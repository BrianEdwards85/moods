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
      [bp/button {:text     "Timeline"
                  :minimal  true
                  :active   (= route-name :route/timeline)
                  :on-click #(routes/navigate! :route/timeline)}]
      [bp/button {:text     "Tags"
                  :minimal  true
                  :active   (= route-name :route/tags)
                  :on-click #(routes/navigate! :route/tags)}]
      [bp/button {:text     "Summary"
                  :minimal  true
                  :active   (= route-name :route/summary)
                  :on-click #(routes/navigate! :route/summary)}]]
     [bp/navbar-group {:align "right"}
      (when user
        [:<>
         [:span.bp6-text-muted.mr-2 (:name user)]
         [bp/navbar-divider]
         [bp/button {:icon     "swap-horizontal"
                     :text     "Switch User"
                     :minimal  true
                     :on-click #(rf/dispatch [::events/switch-user])}]
         [bp/navbar-divider]
         [bp/button {:icon     "plus"
                     :text     "Log Mood"
                     :intent   "primary"
                     :on-click #(rf/dispatch [::events/open-mood-modal])}]])]]))
