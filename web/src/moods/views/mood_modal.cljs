(ns moods.views.mood-modal
  (:require [moods.bp :as bp]
            [moods.events :as events]
            [moods.subs :as subs]
            [re-frame.core :as rf]
            [reagent.core :as r]))

(defn mood-button [current-value value]
  [bp/button {:text     (str value)
              :intent   (if (= current-value value) "primary" "none")
              :on-click #(rf/dispatch [::events/set-mood-value value])}])

(defn mood-modal []
  (let [{:keys [open? mood notes]} @(rf/subscribe [::subs/mood-modal])]
    [bp/dialog {:title    "Log Mood"
                :icon     "heart"
                :is-open  open?
                :on-close #(rf/dispatch [::events/close-mood-modal])}
     [bp/dialog-body
      [:div.mb-4
       [:label.bp6-label "How are you feeling? (1\u201310)"]
       [bp/button-group {:class "flex-wrap"}
        (for [v (range 1 11)]
          ^{:key v}
          [mood-button mood v])]]
      [:div
       [:label.bp6-label "Notes (optional)"]
       [bp/text-area {:fill      true
                      :rows      3
                      :value     notes
                      :on-change #(rf/dispatch [::events/set-mood-notes
                                                (.. % -target -value)])}]]]
     [bp/dialog-footer
      {:actions
       (r/as-element
        [:<>
         [bp/button {:text     "Cancel"
                     :on-click #(rf/dispatch [::events/close-mood-modal])}]
         [bp/button {:text     "Save"
                     :intent   "primary"
                     :icon     "tick"
                     :on-click #(js/console.log "TODO: submit mood")}]])}]]))
