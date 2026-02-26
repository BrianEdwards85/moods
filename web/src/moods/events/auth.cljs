(ns moods.events.auth
  (:require [moods.events :as-alias events]
            [moods.db :as db]
            [moods.gql :as gql]
            [re-frame.core :as rf]
            [re-graph.core :as re-graph]))

;; ---------------------------------------------------------------------------
;; Authentication
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::events/send-login-code
 (fn [{:keys [db]} [_ email]]
   {:db       (-> db
                  (update :loading conj :login)
                  (assoc :login-email email)
                  (assoc :login-error nil))
    :dispatch [::re-graph/mutate
               {:query     gql/send-login-code-mutation
                :variables {:email email}
                :callback  [::events/on-login-code-sent]}]}))

(rf/reg-event-fx
 ::events/on-login-code-sent
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [errors]} response]
     {:db (-> db
              (update :loading disj :login)
              (assoc :login-code-sent (not errors))
              (assoc :login-error (when errors (first errors))))})))

(rf/reg-event-fx
 ::events/verify-login-code
 (fn [{:keys [db]} [_ code]]
   (let [email (:login-email db)]
     {:db       (update db :loading conj :login)
      :dispatch [::re-graph/mutate
                 {:query     gql/verify-login-code-mutation
                  :variables {:email email :code code}
                  :callback  [::events/on-login-verified]}]})))

(rf/reg-event-fx
 ::events/on-login-verified
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response]
     (if errors
       {:db (-> db
                (update :loading disj :login)
                (assoc :login-error (first errors)))}
       (let [{:keys [token user]} (:verifyLoginCode data)]
         {:db               (-> db
                                (update :loading disj :login)
                                (assoc :auth-token token)
                                (assoc :current-user-id (:id user))
                                (assoc :current-user user)
                                (assoc :login-code-sent false)
                                (assoc :login-error nil)
                                (assoc :entries (:entries db/default-db)))
          :set-auth-storage {"moods-token"   token
                             "moods-user-id" (:id user)
                             "moods-email"   (:login-email db)}
          :navigate         :route/timeline
          :dispatch-n       [[::re-graph/re-init {:http {:impl {:headers {"Authorization" (str "Bearer " token)}}}}]
                             [::events/fetch-users]
                             [::events/fetch-entries]]
          :start-poll       true})))))

(rf/reg-event-db
 ::events/cancel-login
 (fn [db _]
   (-> db
       (assoc :login-code-sent false)
       (assoc :login-error nil))))

;; ---------------------------------------------------------------------------
;; User selection / switching
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::events/switch-user
 (fn [{:keys [db]} _]
   {:db                 (assoc db
                               :current-user-id nil
                               :current-user nil
                               :auth-token nil
                               :entries (:entries db/default-db))
    :clear-auth-storage true
    :navigate           :route/user-select
    :stop-poll          true}))
