(ns moods.events.settings
  (:require [moods.events :as-alias events]
            [moods.gql :as gql]
            [re-frame.core :as rf]
            [re-graph.core :as re-graph]))

;; ---------------------------------------------------------------------------
;; User Settings
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::events/save-user-settings
 (fn [{:keys [db]} [_ settings]]
   {:db       (update db :loading conj :save-settings)
    :dispatch [::re-graph/mutate
               {:query     gql/update-user-settings-mutation
                :variables {:input {:settings settings}}
                :callback  [::events/on-settings-saved]}]}))

(rf/reg-event-fx
 ::events/on-settings-saved
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response]
     (if errors
       {:db (-> db
                (update :loading disj :save-settings)
                (assoc-in [:errors :save-settings] errors))}
       {:db (-> db
                (update :loading disj :save-settings)
                (assoc-in [:current-user :settings] (get-in data [:updateUserSettings :settings]))
                (assoc-in [:errors :save-settings] nil))}))))

;; ---------------------------------------------------------------------------
;; Share User Search
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::events/search-share-users
 (fn [{:keys [db]} [_ query]]
   (if (seq query)
     {:db       (-> db
                    (assoc :share-user-search query)
                    (update :loading conj :share-user-search))
      :dispatch [::re-graph/query
                 {:query     gql/search-users-query
                  :variables {:search query}
                  :callback  [::events/on-share-users]}]}
     {:db (-> db
              (assoc :share-user-search "")
              (assoc :share-user-results []))})))

(rf/reg-event-fx
 ::events/on-share-users
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response]
     {:db (-> db
              (assoc :share-user-results (:searchUsers data))
              (update :loading disj :share-user-search)
              (assoc-in [:errors :share-user-search] errors))})))

;; ---------------------------------------------------------------------------
;; Sharing
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::events/save-sharing
 (fn [{:keys [db]} [_ rules]]
   {:db       (update db :loading conj :save-sharing)
    :dispatch [::re-graph/mutate
               {:query     gql/update-sharing-mutation
                :variables {:input {:rules rules}}
                :callback  [::events/on-sharing-saved]}]}))

(rf/reg-event-fx
 ::events/on-sharing-saved
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response]
     (if errors
       {:db (-> db
                (update :loading disj :save-sharing)
                (assoc-in [:errors :save-sharing] errors))}
       {:db       (-> db
                      (update :loading disj :save-sharing)
                      (assoc-in [:current-user :sharedWith]
                                (get-in data [:updateSharing :sharedWith]))
                      (assoc-in [:errors :save-sharing] nil))
        :dispatch [::events/fetch-entries]}))))
