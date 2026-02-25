(ns moods.events.tags
  (:require [moods.events :as-alias events]
            [moods.gql :as gql]
            [re-frame.core :as rf]
            [re-graph.core :as re-graph]))

;; ---------------------------------------------------------------------------
;; Tags
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::events/search-tags
 (fn [{:keys [db]} [_ search-text]]
   {:db       (update db :loading conj :tags)
    :dispatch [::re-graph/query
               {:query     gql/tags-query
                :variables {:search search-text :first 50}
                :callback  [::events/on-tags]}]}))

(rf/reg-event-fx
 ::events/on-tags
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
 ::events/fetch-tags-page
 (fn [{:keys [db]} _]
   (let [search   (get-in db [:tags-page :search])
         archived (get-in db [:tags-page :show-archived])]
     {:db       (update db :loading conj :tags-page)
      :dispatch [::re-graph/query
                 {:query     gql/tags-query
                  :variables {:search          (when (seq search) search)
                              :includeArchived (boolean archived)
                              :first           tags-page-size}
                  :callback  [::events/on-tags-page-fresh]}]})))

(rf/reg-event-fx
 ::events/load-more-tags-page
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
                  :callback  [::events/on-tags-page-append]}]})))

(rf/reg-event-fx
 ::events/on-tags-page-fresh
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
 ::events/on-tags-page-append
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
 ::events/set-tags-page-search
 (fn [{:keys [db]} [_ text]]
   {:db       (-> db
                  (assoc-in [:tags-page :search] text)
                  (assoc-in [:tags-page :edges] [])
                  (assoc-in [:tags-page :page-info] {:hasNextPage false :endCursor nil}))
    :dispatch [::events/fetch-tags-page]}))

(rf/reg-event-fx
 ::events/toggle-show-archived
 (fn [{:keys [db]} _]
   {:db       (-> db
                  (update-in [:tags-page :show-archived] not)
                  (assoc-in [:tags-page :edges] [])
                  (assoc-in [:tags-page :page-info] {:hasNextPage false :endCursor nil}))
    :dispatch [::events/fetch-tags-page]}))

(rf/reg-event-db
 ::events/open-tag-editor
 (fn [db [_ tag]]
   (assoc-in db [:tags-page :editing] tag)))

(rf/reg-event-db
 ::events/close-tag-editor
 (fn [db _]
   (assoc-in db [:tags-page :editing] nil)))

(rf/reg-event-db
 ::events/set-editing-tag-field
 (fn [db [_ field value]]
   (assoc-in db [:tags-page :editing :metadata field] value)))

(rf/reg-event-fx
 ::events/save-tag-metadata
 (fn [{:keys [db]} _]
   (let [{:keys [name metadata]} (get-in db [:tags-page :editing])
         clean-metadata (dissoc metadata :picker-open?)]
     {:db       (update db :loading conj :save-tag)
      :dispatch [::re-graph/mutate
                 {:query     gql/update-tag-metadata-mutation
                  :variables {:input {:name name :metadata (or clean-metadata {})}}
                  :callback  [::events/on-tag-saved]}]})))

(rf/reg-event-fx
 ::events/on-tag-saved
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
        :dispatch [::events/fetch-tags-page]}))))

(rf/reg-event-fx
 ::events/archive-tag
 (fn [{:keys [db]} [_ tag-name]]
   {:db       (update db :loading conj :archive-tag)
    :dispatch [::re-graph/mutate
               {:query     gql/archive-tag-mutation
                :variables {:name tag-name}
                :callback  [::events/on-tag-archived]}]}))

(rf/reg-event-fx
 ::events/on-tag-archived
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
        :dispatch [::events/fetch-tags-page]}))))

(rf/reg-event-fx
 ::events/unarchive-tag
 (fn [{:keys [db]} [_ tag-name]]
   {:db       (update db :loading conj :unarchive-tag)
    :dispatch [::re-graph/mutate
               {:query     gql/unarchive-tag-mutation
                :variables {:name tag-name}
                :callback  [::events/on-tag-unarchived]}]}))

(rf/reg-event-fx
 ::events/on-tag-unarchived
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
        :dispatch [::events/fetch-tags-page]}))))
