(ns moods.routes
  (:require [re-frame.core :as rf]
            [reitit.frontend :as rtf]
            [reitit.frontend.easy :as rtfe]))

(def routes
  [["/"         {:name :route/user-select}]
   ["/timeline" {:name :route/timeline}]
   ["/tags"     {:name :route/tags}]
   ["/settings" {:name :route/settings}]
   ["/summary"  {:name :route/summary}]])

(defn on-navigate [match _history]
  (when match
    (rf/dispatch [::navigated match])))

(defn start! []
  (rtfe/start!
   (rtf/router routes)
   on-navigate
   {:use-fragment false}))

(rf/reg-event-db
 ::navigated
 (fn [db [_ match]]
   (assoc db :current-route match)))

(defn navigate! [route-name]
  (rtfe/navigate route-name))

(defn href [route-name]
  (rtfe/href route-name))
