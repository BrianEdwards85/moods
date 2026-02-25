(ns moods.events.init
  (:require [moods.events :as-alias events]
            [moods.db :as db]
            [moods.gql :as gql]
            [moods.util :as util]
            [moods.storage :as storage]
            [re-frame.core :as rf]
            [re-graph.core :as re-graph]))

;; ---------------------------------------------------------------------------
;; Initialization
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::events/initialize-db
 (fn [_ _]
   (let [user-id (storage/get-item "moods-user-id")
         token   (storage/get-item "moods-token")
         email   (storage/get-item "moods-email")]
     {:db (assoc db/default-db
                 :current-user-id user-id
                 :auth-token token
                 :login-email (or email ""))})))

(defn- re-graph-http-opts [db]
  (let [token (:auth-token db)]
    (cond-> {:url "/graphql"}
      token (assoc :impl {:headers {"Authorization" (str "Bearer " token)}}))))

(rf/reg-fx
 :clear-auth-storage
 (fn [_]
   (storage/remove-item! "moods-user-id")
   (storage/remove-item! "moods-token")))

(rf/reg-event-fx
 ::events/boot
 (fn [{:keys [db]} _]
   (let [token (:auth-token db)]
     (cond
       ;; Expired token — clear everything, send to login
       (and token (util/token-expired? token))
       {:db                (assoc db :auth-token nil :current-user-id nil)
        :clear-auth-storage true}

       ;; Token needs refresh — init re-graph then refresh before fetching
       (and token (util/token-needs-refresh? token))
       {:dispatch-n [[::re-graph/init {:ws nil :http (re-graph-http-opts db)}]
                     [::events/refresh-token]]}

       ;; Normal boot
       :else
       (cond-> {:dispatch-n [[::re-graph/init {:ws   nil
                                                :http (re-graph-http-opts db)}]]}
         token (update :dispatch-n conj [::events/fetch-users]))))))

(rf/reg-event-fx
 ::events/refresh-token
 (fn [_ _]
   {:dispatch [::re-graph/mutate
               {:query    gql/refresh-token-mutation
                :variables {}
                :callback [::events/on-token-refreshed]}]}))

(rf/reg-event-fx
 ::events/on-token-refreshed
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response
         new-token (get-in data [:refreshToken :token])]
     (if (and (nil? errors) new-token)
       (do
         (storage/set-item! "moods-token" new-token)
         {:db         (assoc db :auth-token new-token)
          :dispatch-n [[::re-graph/re-init {:http {:impl {:headers {"Authorization" (str "Bearer " new-token)}}}}]
                       [::events/fetch-users]]})
       {:db                (assoc db :auth-token nil :current-user-id nil :current-user nil)
        :clear-auth-storage true
        :dispatch          [::re-graph/re-init {:http {:impl {:headers {}}}}]}))))

(rf/reg-event-fx
 ::events/tick
 (fn [{:keys [db]} _]
   (let [token (:auth-token db)]
     (cond
       (or (nil? token) (util/token-expired? token))
       {:dispatch [::events/switch-user]}

       (util/token-needs-refresh? token)
       {:dispatch-n [[::events/refresh-token] [::events/fetch-entries]]}

       :else
       {:dispatch [::events/fetch-entries]}))))

;; ---------------------------------------------------------------------------
;; Users
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::events/fetch-users
 (fn [{:keys [db]} _]
   {:db       (update db :loading conj :users)
    :dispatch [::re-graph/query {:query     gql/users-query
                                 :variables {}
                                 :callback  [::events/on-users]}]}))

(rf/reg-event-fx
 ::events/on-users
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
                   (assoc :dispatch [::events/fetch-entries])
                   (assoc :start-poll true))))))

;; ---------------------------------------------------------------------------
;; Polling
;; ---------------------------------------------------------------------------

(defonce ^:private poll-handle (atom nil))

(def ^:private poll-interval-ms 60000)

(rf/reg-fx
 :start-poll
 (fn [_]
   (when-let [h @poll-handle]
     (js/clearInterval h))
   (reset! poll-handle
           (js/setInterval #(rf/dispatch [::events/tick]) poll-interval-ms))))

(rf/reg-fx
 :stop-poll
 (fn [_]
   (when-let [h @poll-handle]
     (js/clearInterval h)
     (reset! poll-handle nil))))
