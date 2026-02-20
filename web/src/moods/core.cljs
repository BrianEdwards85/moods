(ns moods.core
  (:require [moods.events :as events]
            [moods.subs :as subs]
            [moods.views.header :as header]
            [moods.views.mood-modal :as mood-modal]
            [moods.views.timeline :as timeline]
            [moods.views.user-select :as user-select]
            [re-frame.core :as rf]
            [reagent.dom.client :as rdc]))

(defonce root (atom nil))

(defn app []
  (let [user-id @(rf/subscribe [::subs/current-user-id])]
    (if user-id
      [:<>
       [header/header]
       [timeline/timeline-screen]
       [mood-modal/mood-modal]]
      [user-select/user-select-screen])))

(defn ^:export init []
  (rf/dispatch-sync [::events/initialize-db])
  (let [container (js/document.getElementById "app")]
    (if-let [r @root]
      (rdc/render r [app])
      (let [r (rdc/create-root container)]
        (reset! root r)
        (rdc/render r [app])))))
