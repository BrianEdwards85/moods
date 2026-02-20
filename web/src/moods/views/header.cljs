(ns moods.views.header
  (:require [moods.bp :as bp]
            [moods.events :as events]
            [moods.routes :as routes]
            [moods.subs :as subs]
            [re-frame.core :as rf]))

(defn header []
  (let [user       @(rf/subscribe [::subs/current-user])
        route-name @(rf/subscribe [::subs/current-route-name])]
    [bp/navbar {:class "mb-4"}
     [bp/navbar-group {:align "left"}
      [:a {:href (routes/href :route/timeline) :class "flex items-center no-underline"}
       [bp/icon {:icon "heart" :intent "primary" :class "mr-2"}]
       [bp/navbar-heading "Moods"]]
      [bp/navbar-divider]
      [bp/button {:icon     "timeline-events"
                  :text     "Timeline"
                  :minimal  true
                  :active   (= route-name :route/timeline)
                  :class    "mobile-icon-only"
                  :on-click #(routes/navigate! :route/timeline)}]
      [bp/button {:icon     "tag"
                  :text     "Tags"
                  :minimal  true
                  :active   (= route-name :route/tags)
                  :class    "mobile-icon-only"
                  :on-click #(routes/navigate! :route/tags)}]
      [bp/button {:icon     "chart"
                  :text     "Summary"
                  :minimal  true
                  :active   (= route-name :route/summary)
                  :class    "mobile-icon-only"
                  :on-click #(routes/navigate! :route/summary)}]]
     [bp/navbar-group {:align "right"}
      (when user
        [:<>
         [:span {:class "bp6-text-muted mr-2 hidden md:inline"} (:name user)]
         [bp/navbar-divider {:class "hidden md:block"}]
         [bp/button {:icon     "swap-horizontal"
                     :text     "Switch User"
                     :minimal  true
                     :class    "mobile-icon-only"
                     :on-click #(rf/dispatch [::events/switch-user])}]
         [bp/navbar-divider]
         [bp/button {:icon     "plus"
                     :intent   "primary"
                     :text     "Log Mood"
                     :class    "mobile-icon-only"
                     :on-click #(rf/dispatch [::events/open-mood-modal])}]])]]))
