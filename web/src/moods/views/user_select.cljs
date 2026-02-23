(ns moods.views.user-select
  (:require [moods.bp :as bp]
            [moods.events :as events]
            [moods.subs :as subs]
            [re-frame.core :as rf]
            [reagent.core :as r]))

(defn login-code-dialog []
  (let [code-input (r/atom "")]
    (fn []
      (let [login-email @(rf/subscribe [::subs/login-email])
            code-sent?  @(rf/subscribe [::subs/login-code-sent])
            loading?    @(rf/subscribe [::subs/loading? :login])
            error       @(rf/subscribe [::subs/login-error])]
        [bp/dialog {:title    (if code-sent? "Enter login code" "Sending code...")
                    :is-open  code-sent?
                    :on-close #(rf/dispatch [::events/cancel-login])}
         [:div {:class "bp6-dialog-body"}
          (when code-sent?
            [:div
             [:p {:class "mb-4"}
              "A 6-digit code has been sent to "
              [:strong login-email]
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
  (let [email-input (r/atom (or @(rf/subscribe [::subs/login-email]) ""))]
    (fn []
      (let [loading? @(rf/subscribe [::subs/loading? :login])]
        [:div.flex.items-center.justify-center.min-h-screen
         [:div.text-center {:class "max-w-sm w-full px-4"}
          [bp/icon {:icon "heart" :size 48 :class "mb-4" :intent "primary"}]
          [:h1.bp6-heading.mb-2 {:style {:font-size "2.5rem"}} "Moods"]
          [:p {:class "text-tn-fg-muted text-lg mb-8"} "Sign in with your email"]
          [:div {:class "flex gap-2"}
           [bp/input-group {:placeholder "you@example.com"
                            :value       @email-input
                            :type        "email"
                            :large       true
                            :class       "flex-1"
                            :on-change   #(reset! email-input (.. % -target -value))
                            :on-key-down (fn [e]
                                           (when (and (= (.-key e) "Enter")
                                                      (seq @email-input)
                                                      (not loading?))
                                             (rf/dispatch [::events/send-login-code @email-input])))}]
           [bp/button {:text     "Send Code"
                       :intent   "primary"
                       :large    true
                       :disabled (or loading? (empty? @email-input))
                       :on-click #(rf/dispatch [::events/send-login-code @email-input])}]]]
         [login-code-dialog]]))))
