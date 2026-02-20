(ns moods.views.header
  (:require [moods.bp :as bp]
            [moods.events :as events]
            [moods.subs :as subs]
            [re-frame.core :as rf]))

(defn header []
  (let [user @(rf/subscribe [::subs/current-user])]
    [bp/navbar {:class "mb-4"}
     [bp/navbar-group {:align "left"}
      [bp/icon {:icon "heart" :intent "primary" :class "mr-2"}]
      [bp/navbar-heading "Moods"]]
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
