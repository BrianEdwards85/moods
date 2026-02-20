(ns moods.views.user-select
  (:require [moods.bp :as bp]
            [moods.events :as events]
            [moods.subs :as subs]
            [re-frame.core :as rf]))

(defn user-card [user]
  [bp/card {:interactive true
            :class       "cursor-pointer p-6 text-center"
            :on-click    #(rf/dispatch [::events/select-user user])}
   [bp/icon {:icon "person" :size 40 :class "mb-3" :intent "primary"}]
   [:h3.bp6-heading (:name user)]
   [:p.bp6-text-muted (:email user)]])

(defn user-select-screen []
  (let [users @(rf/subscribe [::subs/users])]
    [:div.flex.items-center.justify-center.min-h-screen
     [:div.text-center {:class "max-w-md w-full px-4"}
      [bp/icon {:icon "heart" :size 48 :class "mb-4" :intent "primary"}]
      [:h1.bp6-heading.mb-2 {:style {:font-size "2.5rem"}} "Moods"]
      [:p.bp6-text-muted.bp6-text-large.mb-8 "Who are you?"]
      (if (empty? users)
        [bp/non-ideal-state {:icon "search" :title "No users found"
                             :description "Create users via the API first."}]
        [:div {:class "grid gap-4"}
         (for [user users]
           ^{:key (:id user)}
           [user-card user])])]]))
