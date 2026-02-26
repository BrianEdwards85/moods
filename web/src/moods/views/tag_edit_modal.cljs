(ns moods.views.tag-edit-modal
  (:require [moods.bp :as bp]
            [moods.events :as events]
            [moods.subs :as subs]
            [moods.views.color-picker :refer [color-picker]]
            [re-frame.core :as rf]
            [reagent.core :as r]))

(defn- desktop? []
  (and (exists? js/window)
       (>= (.-innerWidth js/window) 768)))

(defn tag-edit-modal []
  (let [{:keys [editing]} @(rf/subscribe [::subs/tags-page])
        saving?      @(rf/subscribe [::subs/loading? :save-tag])
        archiving?   @(rf/subscribe [::subs/loading? :archive-tag])
        unarchiving? @(rf/subscribe [::subs/loading? :unarchive-tag])
        save-error   @(rf/subscribe [::subs/error :save-tag])]
    (when editing
      (let [{:keys [name metadata archivedAt]} editing
            archived?     (some? archivedAt)
            current-color (:color metadata)
            current-face  (or (:face metadata) "")]
        [bp/dialog {:title    (str "Edit Tag: " name)
                    :icon     "tag"
                    :is-open  true
                    :on-close #(rf/dispatch [::events/close-tag-editor])
                    :class    "w-full max-w-md"}
         [bp/dialog-body
          (when archived?
            [:div {:class "mb-4 p-3 rounded bg-tn-orange/10 text-tn-orange text-sm flex items-center gap-2"}
             [bp/icon {:icon "warning-sign" :size 14}]
             "This tag is archived. Unarchive it to edit color and face."])

          [:div {:class (str "mb-5" (when archived? " opacity-40 pointer-events-none"))}
           [:label.bp6-label "Color"]
           [color-picker current-color
            #(rf/dispatch [::events/set-editing-tag-field :color %])]]

          [:div {:class (str "mb-5" (when archived? " opacity-40 pointer-events-none"))}
           [:label.bp6-label "Face (emoji)"]
           [:div.flex.items-center.gap-3
            [:div {:class    (str "w-12 h-12 rounded border border-tn-border flex items-center justify-center text-3xl transition-colors"
                                  (when-not archived? " cursor-pointer hover:border-tn-fg-muted"))
                   :on-click (when-not archived?
                               (fn []
                                 (if (desktop?)
                                   (rf/dispatch [::events/set-editing-tag-field :picker-open? true])
                                   (.focus (.querySelector js/document "#face-input")))))}
             (if (seq current-face) current-face "?")]
            (when (and (seq current-face) (not archived?))
              [bp/button {:icon     "cross"
                          :minimal  true
                          :small    true
                          :on-click #(rf/dispatch [::events/set-editing-tag-field :face ""])}])]
           [:div {:class "md:hidden mt-2"}
            [:input {:type        "text"
                     :value       current-face
                     :placeholder "Tap to type emoji"
                     :class       "bp6-input w-full text-center text-2xl"
                     :max-length  4
                     :disabled    archived?
                     :on-change   #(rf/dispatch [::events/set-editing-tag-field
                                                  :face (.. % -target -value)])}]]
           (when (and (:picker-open? metadata) (not archived?))
             [:div {:class "mt-2"}
              [bp/emoji-picker
               {:theme         "dark"
                :skin          1
                :set           "native"
                :onEmojiSelect (fn [emoji]
                                 (rf/dispatch [::events/set-editing-tag-field :face (.-native emoji)])
                                 (rf/dispatch [::events/set-editing-tag-field :picker-open? nil]))
                :onClickOutside #(rf/dispatch [::events/set-editing-tag-field :picker-open? nil])
                :previewPosition "none"
                :skinTonePosition "none"}]])]

          (when save-error
            [:div {:class "mt-3 p-3 rounded bg-tn-red/10 text-tn-red text-sm"}
             "Failed to save tag. Please try again."])

          [:div {:class "mt-6 pt-4 border-t border-tn-border"}
           (if archived?
             [bp/button {:icon     "undo"
                         :text     "Unarchive Tag"
                         :intent   "success"
                         :minimal  true
                         :loading  unarchiving?
                         :on-click #(rf/dispatch [::events/unarchive-tag name])}]
             [bp/button {:icon     "trash"
                         :text     "Archive Tag"
                         :intent   "danger"
                         :minimal  true
                         :loading  archiving?
                         :on-click #(rf/dispatch [::events/archive-tag name])}])]]

         [bp/dialog-footer
          {:actions
           (r/as-element
            [:<>
             [bp/button {:text     "Cancel"
                         :on-click #(rf/dispatch [::events/close-tag-editor])}]
             (when-not archived?
               [bp/button {:text     "Save"
                           :intent   "primary"
                           :icon     "tick"
                           :loading  saving?
                           :on-click #(rf/dispatch [::events/save-tag-metadata])}])])}]]))))
