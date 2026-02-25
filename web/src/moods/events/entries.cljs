(ns moods.events.entries
  (:require [moods.events :as-alias events]
            [moods.db :as db]
            [moods.gql :as gql]
            [re-frame.core :as rf]
            [re-graph.core :as re-graph]))

;; ---------------------------------------------------------------------------
;; Mood Entries
;; ---------------------------------------------------------------------------

(def ^:private entries-page-size 20)

(defn- all-user-ids [db]
  (mapv :id (:users db)))

(defn- entries-query-dispatch [user-ids after callback]
  [::re-graph/query {:query     gql/mood-entries-query
                     :variables {:userIds user-ids
                                 :first   entries-page-size
                                 :after   after}
                     :callback  callback}])

(defn- apply-entries [prev connection append?]
  (if append?
    (-> prev
        (update :edges into (:edges connection))
        (assoc :page-info (:pageInfo connection)))
    {:edges     (:edges connection)
     :page-info (:pageInfo connection)}))

(rf/reg-event-fx
 ::events/fetch-entries
 (fn [{:keys [db]} _]
   (let [user-ids (all-user-ids db)]
     (when (seq user-ids)
       {:db       (update db :loading conj :entries)
        :dispatch (entries-query-dispatch user-ids nil [::events/on-entries-fresh])}))))

(rf/reg-event-fx
 ::events/load-more-entries
 (fn [{:keys [db]} [_ cursor]]
   (let [user-ids (all-user-ids db)]
     (when (seq user-ids)
       {:db       (update db :loading conj :entries)
        :dispatch (entries-query-dispatch user-ids cursor [::events/on-entries-append])}))))

(rf/reg-event-fx
 ::events/on-entries-fresh
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response]
     {:db (-> db
              (assoc :entries (apply-entries nil (:moodEntries data) false))
              (update :loading disj :entries)
              (assoc-in [:errors :entries] errors))})))

(rf/reg-event-fx
 ::events/on-entries-append
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response]
     {:db (-> db
              (update :entries apply-entries (:moodEntries data) true)
              (update :loading disj :entries)
              (assoc-in [:errors :entries] errors))})))

;; ---------------------------------------------------------------------------
;; Log Mood (mutation)
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::events/submit-mood
 (fn [{:keys [db]} _]
   (let [{:keys [mood notes tags]} (:mood-modal db)
         input   {:mood   mood
                  :notes  (or notes "")
                  :tags   (mapv :name tags)}]
     {:db       (update db :loading conj :submit-mood)
      :dispatch [::re-graph/mutate
                 {:query     gql/log-mood-mutation
                  :variables {:input input}
                  :callback  [::events/on-mood-submitted]}]})))

(rf/reg-event-fx
 ::events/on-mood-submitted
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response]
     (if errors
       {:db (-> db
                (update :loading disj :submit-mood)
                (assoc-in [:errors :submit-mood] errors))}
       {:db       (-> db
                      (update :loading disj :submit-mood)
                      (assoc :mood-modal (:mood-modal db/default-db)))
        :dispatch [::events/fetch-entries]}))))

;; ---------------------------------------------------------------------------
;; Archive Entry (mutation)
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::events/archive-entry
 (fn [{:keys [db]} [_ entry-id]]
   {:db       (update db :loading conj :archive)
    :dispatch [::re-graph/mutate
               {:query     gql/archive-entry-mutation
                :variables {:id entry-id}
                :callback  [::events/on-entry-archived]}]}))

(rf/reg-event-fx
 ::events/on-entry-archived
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [errors]} response]
     (if errors
       {:db (assoc-in db [:errors :archive] errors)}
       {:dispatch [::events/fetch-entries]}))))
