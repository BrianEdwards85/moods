(ns moods.views.mood-modal
  (:require [moods.bp :as bp]
            [moods.events :as events]
            [moods.subs :as subs]
            [moods.util :as util]
            [re-frame.core :as rf]
            [reagent.core :as r]))

(defn mood-button [current-value value]
  (let [selected (= current-value value)]
    [:button {:class    (str "py-3 rounded font-bold text-sm text-tn-bg-dark transition-all "
                             (util/mood-bg value) " "
                             (if selected "ring-2 ring-white/50 scale-105" "opacity-60 hover:opacity-90"))
              :on-click #(rf/dispatch [::events/set-mood-value value])}
     (str value)]))

(defn tag-renderer [^js item ^js props]
  (let [^js mods (.-modifiers props)]
    (when (.-matchesPredicate mods)
      (r/as-element
       [bp/menu-item {:key      (.-name item)
                      :text     (.-name item)
                      :active   (.-active mods)
                      :disabled (.-disabled mods)
                      :on-click (.-handleClick props)}]))))

(defn tag-input-props [tag-query]
  {:placeholder "Search or create tags..."
   :value       tag-query
   :on-change   #(rf/dispatch [::events/set-tag-query (.. % -target -value)])})

(defn create-new-tag-renderer [query active handleClick]
  (r/as-element
   [bp/menu-item {:icon     "plus"
                  :text     (str "Create \"" query "\"")
                  :active   active
                  :on-click handleClick
                  :should-dismiss-popover false}]))

(defn mood-modal []
  (let [{:keys [open? mood notes tags tag-query]} @(rf/subscribe [::subs/mood-modal])
        available-tags @(rf/subscribe [::subs/tags])
        submitting?    @(rf/subscribe [::subs/loading? :submit-mood])
        error          @(rf/subscribe [::subs/error :submit-mood])
        selected-names (set (map :name tags))
        filtered-items (remove #(contains? selected-names (:name %)) available-tags)]
    [bp/dialog {:title    "Log Mood"
                :icon     "heart"
                :is-open  open?
                :on-close #(rf/dispatch [::events/close-mood-modal])
                :class    "w-full max-w-lg"}
     [bp/dialog-body
      [:div.mb-5
       [:label.bp6-label "How are you feeling?"]
       [:div {:class "grid grid-cols-5 gap-1"}
        (for [v (range 1 11)]
          ^{:key v}
          [mood-button mood v])]]

      [:div.mb-5
       [:label.bp6-label "Notes " [:span {:class "text-tn-fg-dim"} "(optional)"]]
       [bp/text-area {:fill      true
                      :rows      3
                      :value     (or notes "")
                      :placeholder "What's on your mind?"
                      :on-change #(rf/dispatch [::events/set-mood-notes
                                                (.. % -target -value)])}]]

      [:div.mb-2
       [:label.bp6-label "Tags " [:span {:class "text-tn-fg-dim"} "(optional)"]]
       [bp/multi-select
        {:items             (clj->js filtered-items)
         :item-renderer     tag-renderer
         :selected-items    (clj->js tags)
         :on-item-select    #(rf/dispatch [::events/add-mood-tag (js->clj % :keywordize-keys true)])
         :on-remove         (fn [tag-name _idx]
                              (rf/dispatch [::events/remove-mood-tag tag-name]))
         :tag-renderer      (fn [item] (.-name item))
         :no-results        (r/as-element [bp/menu-item {:disabled true :text "No matching tags"}])
         :create-new-item-from-query (fn [q] #js {:name q :metadata #js {}})
         :create-new-item-renderer   create-new-tag-renderer
         :on-query-change   #(rf/dispatch [::events/set-tag-query %])
         :query             tag-query
         :reset-on-select   true
         :popover-props     #js {:minimal true}
         :tag-input-props   #js {:placeholder "Search or create tags..."}}]]

      (when error
        [:div {:class "mt-3 p-3 rounded bg-tn-red/10 text-tn-red text-sm"}
         "Failed to save mood. Please try again."])]

     [bp/dialog-footer
      {:actions
       (r/as-element
        [:<>
         [bp/button {:text     "Cancel"
                     :on-click #(rf/dispatch [::events/close-mood-modal])}]
         [bp/button {:text     "Save"
                     :intent   "primary"
                     :icon     "tick"
                     :loading  submitting?
                     :on-click #(rf/dispatch [::events/submit-mood])}]])}]]))
