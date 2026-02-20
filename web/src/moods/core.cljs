(ns moods.core
  (:require ["@blueprintjs/core" :refer [Card Icon]]
            [reagent.core :as r]
            [reagent.dom.client :as rdc]))

(defonce root (atom nil))

(def bp-card (r/adapt-react-class Card))
(def bp-icon (r/adapt-react-class Icon))

(defn app []
  [:div.flex.items-center.justify-center.min-h-screen
   [bp-card {:elevation 3 :class "p-8 text-center"}
    [bp-icon {:icon "heart" :size 48 :class "mb-4" :intent "primary"}]
    [:h1.bp5-heading {:style {:font-size "2.5rem"}} "Moods"]
    [:p.bp5-text-muted.bp5-text-large "Track and share how you feel."]]])

(defn ^:export init []
  (let [container (js/document.getElementById "app")]
    (if-let [r @root]
      (rdc/render r [app])
      (let [r (rdc/create-root container)]
        (reset! root r)
        (rdc/render r [app])))))
