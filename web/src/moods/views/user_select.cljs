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

(defn login-code-dialog []
  (let [code-input (r/atom "")]
    (fn []
      (let [login-user @(rf/subscribe [::subs/login-user])
            code-sent? @(rf/subscribe [::subs/login-code-sent])
            loading?   @(rf/subscribe [::subs/loading? :login])
            error      @(rf/subscribe [::subs/login-error])]
        [bp/dialog {:title    (if code-sent? "Enter login code" "Sending code...")
                    :is-open  (boolean login-user)
                    :on-close #(rf/dispatch [::events/cancel-login])}
         [:div {:class "bp6-dialog-body"}
          (when code-sent?
            [:div
             [:p {:class "mb-4"}
              "A 6-digit code has been sent to "
              [:strong (:email login-user)]
              "."]
             [:div.mb-4
              [bp/input-group {:placeholder "000000"
                               :value       @code-input
                               :max-length  6
                               :auto-focus  true
                               :large       true
                               :on-change   #(reset! code-input (.. % -target -value))
                               :on-key-down (fn [e]
                                              (when (and (= (.-key e) "Enter")
                                                         (= (count @code-input) 6))
                                                (rf/dispatch [::events/verify-login-code @code-input])))}]]
             (when error
               [bp/callout {:intent "danger" :class "mb-4"}
                (or (:message error) "Invalid or expired code. Please try again.")])])
          (when loading?
            [:div.flex.justify-center.py-4
             [bp/spinner {:size 30}]])]
         [:div {:class "bp6-dialog-footer"}
          [:div {:class "bp6-dialog-footer-actions"}
           [bp/button {:text     "Cancel"
                       :on-click #(rf/dispatch [::events/cancel-login])}]
           (when code-sent?
             [bp/button {:text     "Verify"
                         :intent   "primary"
                         :disabled (or loading? (not= (count @code-input) 6))
                         :on-click #(rf/dispatch [::events/verify-login-code @code-input])}])]]]))))

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
           [user-card user])])]
     [login-code-dialog]]))
