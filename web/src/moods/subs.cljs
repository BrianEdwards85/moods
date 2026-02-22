(ns moods.subs
  (:require [re-frame.core :as rf]))

(rf/reg-sub ::current-route     (fn [db _] (:current-route db)))
(rf/reg-sub ::current-route-name
 :<- [::current-route]
 (fn [route _] (-> route :data :name)))
(rf/reg-sub ::current-user-id   (fn [db _] (:current-user-id db)))
(rf/reg-sub ::current-user      (fn [db _] (:current-user db)))
(rf/reg-sub ::users             (fn [db _] (:users db)))
(rf/reg-sub ::entries           (fn [db _] (:entries db)))
(rf/reg-sub ::mood-modal        (fn [db _] (:mood-modal db)))
(rf/reg-sub ::tags              (fn [db _] (:tags db)))
(rf/reg-sub ::tags-page         (fn [db _] (:tags-page db)))
(rf/reg-sub ::loading           (fn [db _] (:loading db)))
(rf/reg-sub ::loading?
 :<- [::loading]
 (fn [loading [_ key]] (contains? loading key)))
(rf/reg-sub ::errors            (fn [db _] (:errors db)))
(rf/reg-sub ::error
 :<- [::errors]
 (fn [errors [_ key]] (get errors key)))

(rf/reg-sub
 ::partner-user
 :<- [::current-user-id]
 :<- [::users]
 (fn [[current-id users] _]
   (first (filter #(not= (:id %) current-id) users))))

(rf/reg-sub
 ::users-by-id
 :<- [::users]
 (fn [users _]
   (into {} (map (juxt :id identity)) users)))

(rf/reg-sub ::login-email       (fn [db _] (:login-email db)))
(rf/reg-sub ::login-code-sent   (fn [db _] (:login-code-sent db)))
(rf/reg-sub ::login-error       (fn [db _] (:login-error db)))
(rf/reg-sub ::auth-token        (fn [db _] (:auth-token db)))
