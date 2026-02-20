(ns moods.core
  (:require [moods.events :as events]
            [moods.routes :as routes]
            [moods.subs :as subs]
            [moods.views.header :as header]
            [moods.views.mood-modal :as mood-modal]
            [moods.views.timeline :as timeline]
            [moods.views.user-select :as user-select]
            [re-frame.core :as rf]
            [reagent.dom.client :as rdc]))

(defonce root (atom nil))

(defn current-page []
  (let [route-name @(rf/subscribe [::subs/current-route-name])
        user-id    @(rf/subscribe [::subs/current-user-id])]
    (if (and (not= route-name :route/user-select) (nil? user-id))
      [user-select/user-select-screen]
      (case route-name
        :route/user-select [user-select/user-select-screen]
        :route/timeline    [timeline/timeline-screen]
        :route/tags        [:div.p-8 [:h2.bp6-heading "Tags — coming soon"]]
        :route/settings    [:div.p-8 [:h2.bp6-heading "Settings — coming soon"]]
        :route/summary     [:div.p-8 [:h2.bp6-heading "Summary — coming soon"]]
        [user-select/user-select-screen]))))

(defn app []
  (let [route-name @(rf/subscribe [::subs/current-route-name])
        user-id    @(rf/subscribe [::subs/current-user-id])]
    (if (and user-id (not= route-name :route/user-select))
      [:<>
       [header/header]
       [current-page]
       [mood-modal/mood-modal]]
      [current-page])))

(defn ^:export init []
  (rf/dispatch-sync [::events/initialize-db])
  (rf/dispatch [::events/boot])
  (routes/start!)
  (let [container (js/document.getElementById "app")]
    (if-let [r @root]
      (rdc/render r [app])
      (let [r (rdc/create-root container)]
        (reset! root r)
        (rdc/render r [app])))))
