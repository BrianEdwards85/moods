(ns moods.views.header
  (:require [moods.bp :as bp]
            [moods.events :as events]
            [moods.routes :as routes]
            [moods.subs :as subs]
            [re-frame.core :as rf]))

(defn header []
  (let [user       @(rf/subscribe [::subs/current-user])
        route-name @(rf/subscribe [::subs/current-route-name])
        avatar-url (when user
                     (let [custom (get-in user [:settings :avatarUrl])]
                       (if (seq custom) custom (:icon user))))]
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
         [:button {:class    (str "flex items-center gap-2 bg-transparent border-0 cursor-pointer px-2 py-1 rounded "
                                  "hover:bg-white/5 transition-colors "
                                  (when (= route-name :route/settings) "bg-white/10"))
                   :on-click #(routes/navigate! :route/settings)}
          [:img {:src   avatar-url
                 :class "w-6 h-6 rounded-full"
                 :alt   (:name user)}]
          [:span {:class "bp6-text-muted hidden md:inline"} (:name user)]]
         [bp/navbar-divider]
         [bp/button {:icon     "plus"
                     :intent   "primary"
                     :text     "Log Mood"
                     :class    "mobile-icon-only"
                     :on-click #(rf/dispatch [::events/open-mood-modal])}]])]]))
