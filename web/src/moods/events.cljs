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
   (let [user-id (cookies/get-cookie "moods-user-id")
         token   (cookies/get-cookie "moods-token")]
     {:db (assoc db/default-db
                 :current-user-id user-id
                 :auth-token token)})))

(defn- re-graph-http-opts [db]
  (let [token (:auth-token db)]
    (cond-> {:url "/graphql"}
      token (assoc :impl {:headers {"Authorization" (str "Bearer " token)}}))))

(rf/reg-event-fx
 ::boot
 (fn [{:keys [db]} _]
   {:dispatch-n [[::re-graph/init {:ws   nil
                                   :http (re-graph-http-opts db)}]
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
                   (assoc :dispatch [::fetch-entries])
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
           (js/setInterval #(rf/dispatch [::fetch-entries]) poll-interval-ms))))

(rf/reg-fx
 :stop-poll
 (fn [_]
   (when-let [h @poll-handle]
     (js/clearInterval h)
     (reset! poll-handle nil))))

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
 ::fetch-entries
 (fn [{:keys [db]} _]
   (let [user-ids (all-user-ids db)]
     (when (seq user-ids)
       {:db       (update db :loading conj :entries)
        :dispatch (entries-query-dispatch user-ids nil [::on-entries-fresh])}))))

(rf/reg-event-fx
 ::load-more-entries
 (fn [{:keys [db]} [_ cursor]]
   (let [user-ids (all-user-ids db)]
     (when (seq user-ids)
       {:db       (update db :loading conj :entries)
        :dispatch (entries-query-dispatch user-ids cursor [::on-entries-append])}))))

(rf/reg-event-fx
 ::on-entries-fresh
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response]
     {:db (-> db
              (assoc :entries (apply-entries nil (:moodEntries data) false))
              (update :loading disj :entries)
              (assoc-in [:errors :entries] errors))})))

(rf/reg-event-fx
 ::on-entries-append
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response]
     {:db (-> db
              (update :entries apply-entries (:moodEntries data) true)
              (update :loading disj :entries)
              (assoc-in [:errors :entries] errors))})))

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
;; Tags Page
;; ---------------------------------------------------------------------------

(def ^:private tags-page-size 30)

(rf/reg-event-fx
 ::fetch-tags-page
 (fn [{:keys [db]} _]
   (let [search   (get-in db [:tags-page :search])
         archived (get-in db [:tags-page :show-archived])]
     {:db       (update db :loading conj :tags-page)
      :dispatch [::re-graph/query
                 {:query     gql/tags-query
                  :variables {:search          (when (seq search) search)
                              :includeArchived (boolean archived)
                              :first           tags-page-size}
                  :callback  [::on-tags-page-fresh]}]})))

(rf/reg-event-fx
 ::load-more-tags-page
 (fn [{:keys [db]} _]
   (let [search   (get-in db [:tags-page :search])
         archived (get-in db [:tags-page :show-archived])
         cursor   (get-in db [:tags-page :page-info :endCursor])]
     {:db       (update db :loading conj :tags-page)
      :dispatch [::re-graph/query
                 {:query     gql/tags-query
                  :variables {:search          (when (seq search) search)
                              :includeArchived (boolean archived)
                              :first           tags-page-size
                              :after           cursor}
                  :callback  [::on-tags-page-append]}]})))

(rf/reg-event-fx
 ::on-tags-page-fresh
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response
         connection (:tags data)]
     {:db (-> db
              (assoc-in [:tags-page :edges] (:edges connection))
              (assoc-in [:tags-page :page-info] (:pageInfo connection))
              (update :loading disj :tags-page)
              (assoc-in [:errors :tags-page] errors))})))

(rf/reg-event-fx
 ::on-tags-page-append
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response
         connection (:tags data)]
     {:db (-> db
              (update-in [:tags-page :edges] into (:edges connection))
              (assoc-in [:tags-page :page-info] (:pageInfo connection))
              (update :loading disj :tags-page)
              (assoc-in [:errors :tags-page] errors))})))

(rf/reg-event-fx
 ::set-tags-page-search
 (fn [{:keys [db]} [_ text]]
   {:db       (-> db
                  (assoc-in [:tags-page :search] text)
                  (assoc-in [:tags-page :edges] [])
                  (assoc-in [:tags-page :page-info] {:hasNextPage false :endCursor nil}))
    :dispatch [::fetch-tags-page]}))

(rf/reg-event-fx
 ::toggle-show-archived
 (fn [{:keys [db]} _]
   {:db       (-> db
                  (update-in [:tags-page :show-archived] not)
                  (assoc-in [:tags-page :edges] [])
                  (assoc-in [:tags-page :page-info] {:hasNextPage false :endCursor nil}))
    :dispatch [::fetch-tags-page]}))

(rf/reg-event-db
 ::open-tag-editor
 (fn [db [_ tag]]
   (assoc-in db [:tags-page :editing] tag)))

(rf/reg-event-db
 ::close-tag-editor
 (fn [db _]
   (assoc-in db [:tags-page :editing] nil)))

(rf/reg-event-db
 ::set-editing-tag-field
 (fn [db [_ field value]]
   (assoc-in db [:tags-page :editing :metadata field] value)))

(rf/reg-event-fx
 ::save-tag-metadata
 (fn [{:keys [db]} _]
   (let [{:keys [name metadata]} (get-in db [:tags-page :editing])
         clean-metadata (dissoc metadata :picker-open?)]
     {:db       (update db :loading conj :save-tag)
      :dispatch [::re-graph/mutate
                 {:query     gql/update-tag-metadata-mutation
                  :variables {:input {:name name :metadata (or clean-metadata {})}}
                  :callback  [::on-tag-saved]}]})))

(rf/reg-event-fx
 ::on-tag-saved
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response]
     (if errors
       {:db (-> db
                (update :loading disj :save-tag)
                (assoc-in [:errors :save-tag] errors))}
       {:db       (-> db
                      (update :loading disj :save-tag)
                      (assoc-in [:tags-page :editing] nil)
                      (assoc-in [:errors :save-tag] nil))
        :dispatch [::fetch-tags-page]}))))

(rf/reg-event-fx
 ::archive-tag
 (fn [{:keys [db]} [_ tag-name]]
   {:db       (update db :loading conj :archive-tag)
    :dispatch [::re-graph/mutate
               {:query     gql/archive-tag-mutation
                :variables {:name tag-name}
                :callback  [::on-tag-archived]}]}))

(rf/reg-event-fx
 ::on-tag-archived
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [errors]} response]
     (if errors
       {:db (-> db
                (update :loading disj :archive-tag)
                (assoc-in [:errors :archive-tag] errors))}
       {:db       (-> db
                      (update :loading disj :archive-tag)
                      (assoc-in [:tags-page :editing] nil))
        :dispatch [::fetch-tags-page]}))))

(rf/reg-event-fx
 ::unarchive-tag
 (fn [{:keys [db]} [_ tag-name]]
   {:db       (update db :loading conj :unarchive-tag)
    :dispatch [::re-graph/mutate
               {:query     gql/unarchive-tag-mutation
                :variables {:name tag-name}
                :callback  [::on-tag-unarchived]}]}))

(rf/reg-event-fx
 ::on-tag-unarchived
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [errors]} response]
     (if errors
       {:db (-> db
                (update :loading disj :unarchive-tag)
                (assoc-in [:errors :unarchive-tag] errors))}
       {:db       (-> db
                      (update :loading disj :unarchive-tag)
                      (assoc-in [:tags-page :editing] nil))
        :dispatch [::fetch-tags-page]}))))

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
        :dispatch [::fetch-entries]}))))

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
       {:dispatch [::fetch-entries]}))))

;; ---------------------------------------------------------------------------
;; Authentication
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::send-login-code
 (fn [{:keys [db]} [_ user]]
   {:db       (-> db
                  (update :loading conj :login)
                  (assoc :login-user user)
                  (assoc :login-error nil))
    :dispatch [::re-graph/mutate
               {:query     gql/send-login-code-mutation
                :variables {:email (:email user)}
                :callback  [::on-login-code-sent]}]}))

(rf/reg-event-fx
 ::on-login-code-sent
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [errors]} response]
     {:db (-> db
              (update :loading disj :login)
              (assoc :login-code-sent true)
              (assoc :login-error (when errors (first errors))))})))

(rf/reg-event-fx
 ::verify-login-code
 (fn [{:keys [db]} [_ code]]
   (let [email (get-in db [:login-user :email])]
     {:db       (update db :loading conj :login)
      :dispatch [::re-graph/mutate
                 {:query     gql/verify-login-code-mutation
                  :variables {:email email :code code}
                  :callback  [::on-login-verified]}]})))

(rf/reg-event-fx
 ::on-login-verified
 [rf/unwrap]
 (fn [{:keys [db]} {:keys [response]}]
   (let [{:keys [data errors]} response]
     (if errors
       {:db (-> db
                (update :loading disj :login)
                (assoc :login-error (first errors)))}
       (let [{:keys [token user]} (:verifyLoginCode data)]
         (cookies/set-cookie! "moods-token" token)
         (cookies/set-cookie! "moods-user-id" (:id user))
         (routes/navigate! :route/timeline)
         {:db         (-> db
                          (update :loading disj :login)
                          (assoc :auth-token token)
                          (assoc :current-user-id (:id user))
                          (assoc :current-user user)
                          (assoc :login-user nil)
                          (assoc :login-code-sent false)
                          (assoc :login-error nil)
                          (assoc :entries (:entries db/default-db)))
          :dispatch-n [[::re-graph/re-init {:http {:impl {:headers {"Authorization" (str "Bearer " token)}}}}]
                       [::fetch-entries]]
          :start-poll true})))))

(rf/reg-event-db
 ::cancel-login
 (fn [db _]
   (-> db
       (assoc :login-user nil)
       (assoc :login-code-sent false)
       (assoc :login-error nil))))

;; ---------------------------------------------------------------------------
;; User selection / switching
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::select-user
 (fn [_ [_ user]]
   {:dispatch [::send-login-code user]}))

(rf/reg-event-fx
 ::switch-user
 (fn [{:keys [db]} _]
   (cookies/clear-cookie! "moods-user-id")
   (cookies/clear-cookie! "moods-token")
   (routes/navigate! :route/user-select)
   {:db        (assoc db
                      :current-user-id nil
                      :current-user nil
                      :auth-token nil
                      :entries (:entries db/default-db))
    :stop-poll true}))

;; ---------------------------------------------------------------------------
;; Mood modal UI
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::open-mood-modal
 (fn [{:keys [db]} _]
   {:db       (assoc-in db [:mood-modal :open?] true)
    :dispatch [::search-tags nil]}))

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

(rf/reg-event-fx
 ::set-tag-query
 (fn [{:keys [db]} [_ text]]
   (cond-> {:db (assoc-in db [:mood-modal :tag-query] text)}
     (>= (count text) 1) (assoc :dispatch [::search-tags text]))))

(rf/reg-event-db
 ::add-mood-tag
 (fn [db [_ tag]]
   (let [tags (get-in db [:mood-modal :tags])
         already? (some #(= (:name %) (:name tag)) tags)]
     (if already?
       db
       (-> db
           (update-in [:mood-modal :tags] conj tag)
           (assoc-in [:mood-modal :tag-query] ""))))))

(rf/reg-event-db
 ::remove-mood-tag
 (fn [db [_ tag-name]]
   (update-in db [:mood-modal :tags]
              (fn [tags] (vec (remove #(= (:name %) tag-name) tags))))))
