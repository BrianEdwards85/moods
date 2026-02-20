(ns moods.views.user-select
  (:require [moods.bp :as bp]
            [moods.events :as events]
            [moods.subs :as subs]
            [moods.util :as util]
            [re-frame.core :as rf]
            [reagent.core :as r]))

(defn user-card [user]
  [bp/card {:interactive true
            :class       "cursor-pointer p-6"
            :on-click    #(rf/dispatch [::events/select-user user])}
   [:div.flex.items-center.gap-4
    [:img {:src   (util/gravatar-url (:email user) 96)
           :alt   (:name user)
           :class "w-12 h-12 rounded-full shrink-0"}]
    [:div.text-left
     [:div.bp6-heading (:name user)]
     [:div {:class "text-tn-fg-muted text-sm"} (:email user)]]]])

(defn user-select-screen []
  (let [users    @(rf/subscribe [::subs/users])
        loading? @(rf/subscribe [::subs/loading? :users])
        error    @(rf/subscribe [::subs/error :users])]
    [:div.flex.items-center.justify-center.min-h-screen
     [:div.text-center {:class "max-w-sm w-full px-4"}
      [bp/icon {:icon "heart" :size 48 :class "mb-4" :intent "primary"}]
      [:h1.bp6-heading.mb-2 {:style {:font-size "2.5rem"}} "Moods"]
      [:p {:class "text-tn-fg-muted text-lg mb-8"} "Who are you?"]
      (cond
        loading?
        [:div.py-8
         [bp/spinner {:size 40}]]

        error
        [bp/non-ideal-state {:icon        "error"
                             :title       "Failed to load users"
                             :description "Check that the backend is running."
                             :action      (r/as-element
                                           [bp/button {:text     "Retry"
                                                       :icon     "refresh"
                                                       :intent   "primary"
                                                       :on-click #(rf/dispatch [::events/fetch-users])}])}]

        (empty? users)
        [bp/non-ideal-state {:icon        "people"
                             :title       "No users yet"
                             :description "Create users via the API first."}]

        :else
        [:div {:class "grid gap-3"}
         (for [user users]
           ^{:key (:id user)}
           [user-card user])])]]))
