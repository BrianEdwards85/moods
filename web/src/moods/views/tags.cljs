(ns moods.views.tags
  (:require [moods.bp :as bp]
            [moods.events :as events]
            [moods.subs :as subs]
            [re-frame.core :as rf]
            [reagent.core :as r]))

(defn- desktop? []
  (and (exists? js/window)
       (>= (.-innerWidth js/window) 768)))

(defn color-swatch [color selected? on-click]
  [:button {:class    (str "w-8 h-8 rounded-full border-2 transition-all cursor-pointer "
                           (if selected? "border-white scale-110" "border-transparent hover:scale-105"))
            :style    {:background-color color}
            :on-click #(on-click color)}])

(def ^:private preset-colors
  ["#f7768e" "#ff9e64" "#e0af68" "#9ece6a" "#73daca"
   "#7dcfff" "#7aa2f7" "#bb9af7" "#c0caf5" "#565f89"])

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
           [:div {:class "flex flex-wrap gap-2 mb-2"}
            (for [c preset-colors]
              ^{:key c}
              [color-swatch c (= c current-color)
               #(rf/dispatch [::events/set-editing-tag-field :color %])])]
           [:div.flex.items-center.gap-2.mt-2
            [:input {:type      "color"
                     :value     (or current-color "#7aa2f7")
                     :class     "w-8 h-8 rounded cursor-pointer border-0 p-0"
                     :disabled  archived?
                     :on-change #(rf/dispatch [::events/set-editing-tag-field
                                               :color (.. % -target -value)])}]
            [:span {:class "text-sm text-tn-fg-muted"} "Custom color"]
            (when current-color
              [bp/button {:icon     "cross"
                          :minimal  true
                          :small    true
                          :disabled archived?
                          :on-click #(rf/dispatch [::events/set-editing-tag-field :color nil])}])]]

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

(def ^:private default-tag-color "#3b4261")

(defn tag-row [tag]
  (let [{:keys [name metadata archivedAt]} (:node tag)
        archived? (some? archivedAt)
        color     (or (:color metadata) default-tag-color)
        face      (:face metadata)]
    [:div {:class    (str "mb-2 rounded p-3 cursor-pointer transition-all hover:scale-[1.01] hover:brightness-110"
                          (when archived? " opacity-60"))
           :style    {:background-color color
                      :color            "#1f2335"}
           :on-click #(rf/dispatch [::events/open-tag-editor (:node tag)])}
     [:div.flex.items-center.justify-between
      [:div.flex.items-center.gap-2
       (when (seq face)
         [:span {:class "text-lg"} face])
       [:span {:class (str "font-semibold" (when archived? " line-through"))} name]
       (when archived?
         [bp/tag {:minimal true :class "ml-2"} "archived"])]
      [bp/icon {:icon "chevron-right" :class "opacity-50"}]]]))

(defn tags-screen []
  (let [{:keys [search edges page-info]} @(rf/subscribe [::subs/tags-page])
        loading? @(rf/subscribe [::subs/loading? :tags-page])
        initial-load (r/atom true)]
    (when @initial-load
      (rf/dispatch [::events/fetch-tags-page])
      (reset! initial-load false))
    (fn []
      (let [{:keys [search show-archived edges page-info]} @(rf/subscribe [::subs/tags-page])
            loading? @(rf/subscribe [::subs/loading? :tags-page])]
        [:div {:class "max-w-2xl mx-auto px-4 py-4"}
         [:div.flex.items-center.justify-between.mb-4
          [:h3.bp6-heading "Tags"]
          [bp/button {:icon     "refresh"
                      :minimal  true
                      :loading  loading?
                      :on-click #(rf/dispatch [::events/fetch-tags-page])}]]

         [:div {:class "flex items-center gap-3 mb-4"}
          [:div.flex-1
           [bp/input-group {:left-icon   "search"
                            :placeholder "Search tags..."
                            :value       search
                            :on-change   #(rf/dispatch [::events/set-tags-page-search
                                                        (.. % -target -value)])}]]
          [bp/switch-control {:checked   (boolean show-archived)
                              :label     "Archived"
                              :class     "mb-0"
                              :on-change #(rf/dispatch [::events/toggle-show-archived])}]]

         (cond
           (and loading? (empty? edges))
           [:div.py-8.text-center [bp/spinner {:size 40}]]

           (empty? edges)
           [bp/non-ideal-state {:icon        "tag"
                                :title       "No tags found"
                                :description (if (seq search)
                                               "Try a different search term."
                                               "Tags will appear here when mood entries are created with tags.")}]

           :else
           [:div
            (for [edge edges]
              ^{:key (get-in edge [:node :name])}
              [tag-row edge])
            (when (:hasNextPage page-info)
              [:div.text-center.mt-2
               [bp/button {:text     "Load more"
                           :minimal  true
                           :loading  loading?
                           :on-click #(rf/dispatch [::events/load-more-tags-page])}]])])

         [tag-edit-modal]]))))
