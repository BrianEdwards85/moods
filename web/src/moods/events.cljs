(ns moods.events
  (:require [moods.cookies :as cookies]
            [moods.db :as db]
            [moods.gql :as gql]
            [moods.routes :as routes]
            [re-frame.core :as rf]
            [re-graph.core :as re-graph]))

;; ---------------------------------------------------------------------------
;; Initialization
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::initialize-db
 (fn [_ _]
   (let [user-id (cookies/get-cookie "moods-user-id")]
     {:db (assoc db/default-db :current-user-id user-id)})))

(rf/reg-event-fx
 ::boot
 (fn [_ _]
   {:dispatch-n [[::re-graph/init {:ws   nil
                                   :http {:url "http://localhost:8000/graphql"}}]
                 [::fetch-users]]}))

;; ---------------------------------------------------------------------------
;; Users
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::fetch-users
 (fn [{:keys [db]} _]
   {:db       (update db :loading conj :users)
    :dispatch [::re-graph/query {:query     gql/users-query
                                 :variables {}
                                 :callback  [::on-users]}]}))

(rf/reg-event-fx
 ::on-users
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response
         users      (:users data)
         user-id    (:current-user-id db)
         current    (when user-id
                      (some #(when (= (:id %) user-id) %) users))]
     (cond-> {:db (-> db
                      (assoc :users users)
                      (update :loading disj :users)
                      (assoc-in [:errors :users] errors))}
       current (-> (assoc-in [:db :current-user] current)
                   (assoc :dispatch-n [[::fetch-my-entries]
                                       [::fetch-partner-entries]]))))))

;; ---------------------------------------------------------------------------
;; Mood Entries — helpers
;; ---------------------------------------------------------------------------

(def ^:private entries-page-size 20)

(defn- entries-query-dispatch [user-id after callback]
  [::re-graph/query {:query     gql/mood-entries-query
                     :variables {:userId user-id
                                 :first  entries-page-size
                                 :after  after}
                     :callback  callback}])

(defn- apply-entries [prev connection append?]
  (if append?
    (-> prev
        (update :edges into (:edges connection))
        (assoc :page-info (:pageInfo connection)))
    {:edges     (:edges connection)
     :page-info (:pageInfo connection)}))

;; ---------------------------------------------------------------------------
;; My Entries
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::fetch-my-entries
 (fn [{:keys [db]} _]
   (when-let [user-id (:current-user-id db)]
     {:db       (update db :loading conj :my-entries)
      :dispatch (entries-query-dispatch user-id nil [::on-my-entries-fresh])})))

(rf/reg-event-fx
 ::load-more-my-entries
 (fn [{:keys [db]} [_ cursor]]
   (when-let [user-id (:current-user-id db)]
     {:db       (update db :loading conj :my-entries)
      :dispatch (entries-query-dispatch user-id cursor [::on-my-entries-append])})))

(rf/reg-event-fx
 ::on-my-entries-fresh
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response]
     {:db (-> db
              (assoc :my-entries (apply-entries nil (:moodEntries data) false))
              (update :loading disj :my-entries)
              (assoc-in [:errors :my-entries] errors))})))

(rf/reg-event-fx
 ::on-my-entries-append
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response]
     {:db (-> db
              (update :my-entries apply-entries (:moodEntries data) true)
              (update :loading disj :my-entries)
              (assoc-in [:errors :my-entries] errors))})))

;; ---------------------------------------------------------------------------
;; Partner Entries
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::fetch-partner-entries
 (fn [{:keys [db]} _]
   (let [user-id (:current-user-id db)
         partner (first (filter #(not= (:id %) user-id) (:users db)))]
     (when partner
       {:db       (update db :loading conj :partner-entries)
        :dispatch (entries-query-dispatch (:id partner) nil [::on-partner-entries-fresh])}))))

(rf/reg-event-fx
 ::load-more-partner-entries
 (fn [{:keys [db]} [_ cursor]]
   (let [user-id (:current-user-id db)
         partner (first (filter #(not= (:id %) user-id) (:users db)))]
     (when partner
       {:db       (update db :loading conj :partner-entries)
        :dispatch (entries-query-dispatch (:id partner) cursor [::on-partner-entries-append])}))))

(rf/reg-event-fx
 ::on-partner-entries-fresh
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response]
     {:db (-> db
              (assoc :partner-entries (apply-entries nil (:moodEntries data) false))
              (update :loading disj :partner-entries)
              (assoc-in [:errors :partner-entries] errors))})))

(rf/reg-event-fx
 ::on-partner-entries-append
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response]
     {:db (-> db
              (update :partner-entries apply-entries (:moodEntries data) true)
              (update :loading disj :partner-entries)
              (assoc-in [:errors :partner-entries] errors))})))

;; ---------------------------------------------------------------------------
;; Tags
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::search-tags
 (fn [{:keys [db]} [_ search-text]]
   {:db       (update db :loading conj :tags)
    :dispatch [::re-graph/query
               {:query     gql/tags-query
                :variables {:search search-text :first 50}
                :callback  [::on-tags]}]}))

(rf/reg-event-fx
 ::on-tags
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response
         tags (mapv :node (get-in data [:tags :edges]))]
     {:db (-> db
              (assoc :tags tags)
              (update :loading disj :tags)
              (assoc-in [:errors :tags] errors))})))

;; ---------------------------------------------------------------------------
;; Log Mood (mutation)
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::submit-mood
 (fn [{:keys [db]} _]
   (let [{:keys [mood notes tags]} (:mood-modal db)
         user-id (:current-user-id db)
         input   {:userId user-id
                  :mood   mood
                  :notes  (or notes "")
                  :tags   (mapv :name tags)}]
     {:db       (update db :loading conj :submit-mood)
      :dispatch [::re-graph/mutate
                 {:query     gql/log-mood-mutation
                  :variables {:input input}
                  :callback  [::on-mood-submitted]}]})))

(rf/reg-event-fx
 ::on-mood-submitted
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
        :dispatch [::fetch-my-entries]}))))

;; ---------------------------------------------------------------------------
;; Archive Entry (mutation)
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::archive-entry
 (fn [{:keys [db]} [_ entry-id]]
   {:db       (update db :loading conj :archive)
    :dispatch [::re-graph/mutate
               {:query     gql/archive-entry-mutation
                :variables {:id entry-id}
                :callback  [::on-entry-archived]}]}))

(rf/reg-event-fx
 ::on-entry-archived
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [errors]} response]
     (if errors
       {:db (assoc-in db [:errors :archive] errors)}
       {:dispatch-n [[::fetch-my-entries]
                     [::fetch-partner-entries]]}))))

;; ---------------------------------------------------------------------------
;; User selection / switching
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::select-user
 (fn [{:keys [db]} [_ user]]
   (cookies/set-cookie! "moods-user-id" (:id user))
   (routes/navigate! :route/timeline)
   {:db         (assoc db
                       :current-user-id (:id user)
                       :current-user user
                       :my-entries (:my-entries db/default-db)
                       :partner-entries (:partner-entries db/default-db))
    :dispatch-n [[::fetch-my-entries]
                 [::fetch-partner-entries]]}))

(rf/reg-event-fx
 ::switch-user
 (fn [{:keys [db]} _]
   (cookies/clear-cookie! "moods-user-id")
   (routes/navigate! :route/user-select)
   {:db (assoc db
               :current-user-id nil
               :current-user nil
               :my-entries (:my-entries db/default-db)
               :partner-entries (:partner-entries db/default-db))}))

;; ---------------------------------------------------------------------------
;; Mood modal UI
;; ---------------------------------------------------------------------------

(rf/reg-event-db
 ::open-mood-modal
 (fn [db _]
   (assoc-in db [:mood-modal :open?] true)))

(rf/reg-event-db
 ::close-mood-modal
 (fn [db _]
   (assoc db :mood-modal (:mood-modal db/default-db))))

(rf/reg-event-db
 ::set-mood-value
 (fn [db [_ value]]
   (assoc-in db [:mood-modal :mood] value)))

(rf/reg-event-db
 ::set-mood-notes
 (fn [db [_ text]]
   (assoc-in db [:mood-modal :notes] text)))

(rf/reg-event-db
 ::set-mood-tags
 (fn [db [_ tags]]
   (assoc-in db [:mood-modal :tags] tags)))
