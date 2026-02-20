(ns moods.events
  (:require [moods.cookies :as cookies]
            [moods.db :as db]
            [re-frame.core :as rf]))

(def stub-users
  [{:id "00000000-0000-0000-0000-000000000001"
    :name "Alice" :email "alice@example.com"}
   {:id "00000000-0000-0000-0000-000000000002"
    :name "Bob" :email "bob@example.com"}])

(rf/reg-event-db
 ::initialize-db
 (fn [_ _]
   (let [user-id (cookies/get-cookie "moods-user-id")
         user    (when user-id
                   (some #(when (= (:id %) user-id) %) stub-users))]
     (assoc db/default-db
            :current-user-id user-id
            :current-user user
            :users stub-users))))

(rf/reg-event-db
 ::set-users
 (fn [db [_ users]]
   (assoc db :users users)))

(rf/reg-event-fx
 ::select-user
 (fn [{:keys [db]} [_ user]]
   (cookies/set-cookie! "moods-user-id" (:id user))
   {:db (assoc db
               :current-user-id (:id user)
               :current-user user)}))

(rf/reg-event-fx
 ::switch-user
 (fn [{:keys [db]} _]
   (cookies/clear-cookie! "moods-user-id")
   {:db (assoc db
               :current-user-id nil
               :current-user nil
               :my-entries (:my-entries db/default-db)
               :partner-entries (:partner-entries db/default-db))}))

(rf/reg-event-db
 ::set-current-user
 (fn [db [_ user]]
   (assoc db :current-user user)))

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
