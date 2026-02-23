(ns moods.views.settings
  (:require [moods.bp :as bp]
            [moods.events :as events]
            [moods.subs :as subs]
            [re-frame.core :as rf]
            [reagent.core :as r]))

(def ^:private preset-colors
  ["#f7768e" "#ff9e64" "#e0af68" "#9ece6a" "#73daca"
   "#7dcfff" "#7aa2f7" "#bb9af7" "#c0caf5" "#565f89"])

(defn- color-swatch [color selected? on-click]
  [:button {:class    (str "w-8 h-8 rounded-full border-2 transition-all cursor-pointer "
                           (if selected? "border-white scale-110" "border-transparent hover:scale-105"))
            :style    {:background-color color}
            :on-click #(on-click color)}])

(defn- filter-row [idx filter on-change on-remove]
  [:div {:class "flex items-center gap-2 mb-2"}
   [bp/input-group {:placeholder "Tag regex pattern"
                    :value       (:pattern filter)
                    :class       "flex-1"
                    :on-change   #(on-change idx :pattern (.. % -target -value))}]
   [bp/switch-control {:checked   (:isInclude filter)
                       :label     (if (:isInclude filter) "Include" "Exclude")
                       :class     "mb-0 shrink-0"
                       :on-change #(on-change idx :isInclude (not (:isInclude filter)))}]
   [bp/button {:icon     "cross"
               :minimal  true
               :small    true
               :on-click #(on-remove idx)}]])

(defn- share-section [user-id user-name shared? filters on-toggle on-update-filter on-remove-filter on-add-filter]
  [:div {:class "mb-4 p-3 rounded border border-tn-border"}
   [:div {:class "flex items-center justify-between mb-2"}
    [:span {:class "font-medium"} user-name]
    [bp/switch-control {:checked   shared?
                        :class     "mb-0"
                        :on-change #(on-toggle user-id)}]]
   (when shared?
     [:div {:class "mt-2 pl-2 border-l-2 border-tn-border"}
      (when (seq filters)
        [:div {:class "mb-2"}
         (doall
          (map-indexed
           (fn [idx f]
             ^{:key idx}
             [filter-row idx f on-update-filter on-remove-filter])
           filters))])
      [bp/button {:icon     "plus"
                  :text     "Add Filter"
                  :small    true
                  :minimal  true
                  :on-click #(on-add-filter user-id)}]])])

(defn- user-search-input []
  (let [debounce-handle (atom nil)]
    (fn []
      (let [search-loading? @(rf/subscribe [::subs/loading? :share-user-search])]
        [:div {:class "mb-4"}
         [bp/input-group {:placeholder  "Search users by name or email..."
                          :left-icon    "search"
                          :right-element (when search-loading?
                                           (r/as-element [:div {:class "p-2"} [bp/spinner {:size 16}]]))
                          :on-change    (fn [e]
                                          (let [v (.. e -target -value)]
                                            (when-let [h @debounce-handle]
                                              (js/clearTimeout h))
                                            (reset! debounce-handle
                                                    (js/setTimeout
                                                     #(rf/dispatch [::events/search-share-users v])
                                                     300))))}]]))))

(defn- search-results-list [local-state]
  (let [results       @(rf/subscribe [::subs/share-user-results])
        current-id    (:id @(rf/subscribe [::subs/current-user]))
        state         @local-state
        active-ids    (set (keys (:shares state)))]
    (when (seq results)
      [:div {:class "mb-4 border border-tn-border rounded overflow-hidden"}
       (for [u results
             :when (not= (:id u) current-id)
             :when (not (get active-ids (:id u)))]
         ^{:key (:id u)}
         [:div {:class    "flex items-center justify-between px-3 py-2 hover:bg-tn-bg-float cursor-pointer border-b border-tn-border last:border-b-0"
                :on-click (fn []
                            (swap! local-state assoc-in [:shares (:id u)]
                                   {:shared? true :filters [] :name (:name u)}))}
          [:div
           [:span {:class "font-medium"} (:name u)]
           [:span {:class "text-sm text-tn-fg-muted ml-2"} (:email u)]]
          [bp/icon {:icon "plus" :size 14}]])])))

(defn- shares->rules [shares]
  (->> shares
       (filter (fn [[_ v]] (:shared? v)))
       (mapv (fn [[uid v]]
               {:userId  uid
                :filters (vec (:filters v))}))))

(defn settings-screen []
  (let [current-user @(rf/subscribe [::subs/current-user])
        saving-settings? @(rf/subscribe [::subs/loading? :save-settings])
        saving-sharing?  @(rf/subscribe [::subs/loading? :save-sharing])
        settings-error   @(rf/subscribe [::subs/error :save-settings])
        sharing-error    @(rf/subscribe [::subs/error :save-sharing])

        ;; Local state for form
        local-state  (r/atom {:avatar-url (get-in current-user [:settings :avatarUrl] "")
                              :color      (get-in current-user [:settings :color])
                              :shares     (into {}
                                                (map (fn [rule]
                                                       [(get-in rule [:user :id])
                                                        {:shared?  true
                                                         :filters  (mapv #(select-keys % [:pattern :isInclude])
                                                                         (:filters rule))
                                                         :name     (get-in rule [:user :name])}])
                                                     (:sharedWith current-user)))})
        save-debounce (atom nil)]

    ;; Auto-save sharing on changes (watch only fires on swap!/reset!, not initial value)
    (add-watch local-state ::auto-save-shares
      (fn [_ _ old-state new-state]
        (when (not= (:shares old-state) (:shares new-state))
          (when-let [h @save-debounce]
            (js/clearTimeout h))
          (reset! save-debounce
            (js/setTimeout
              #(rf/dispatch [::events/save-sharing (shares->rules (:shares new-state))])
              1000)))))

    (fn []
      (let [state        @local-state
            active-shares (->> (:shares state)
                               (filter (fn [[_ v]] (:shared? v)))
                               (sort-by (fn [[_ v]] (:name v))))]
        [:div {:class "max-w-2xl mx-auto px-4 py-4"}
         ;; Profile section
         [:h3 {:class "bp6-heading mb-4"} "Profile"]
         [:div {:class "mb-4"}
          [:label.bp6-label "Avatar URL"]
          [bp/input-group {:placeholder "https://example.com/avatar.png"
                           :value       (:avatar-url state)
                           :on-change   #(swap! local-state assoc :avatar-url (.. % -target -value))}]]

         [:div {:class "mb-6"}
          [:label.bp6-label "User Color"]
          [:div {:class "flex flex-wrap gap-2 mb-2"}
           (for [c preset-colors]
             ^{:key c}
             [color-swatch c (= c (:color state))
              #(swap! local-state assoc :color %)])]
          [:div {:class "flex items-center gap-2 mt-2"}
           [:input {:type      "color"
                    :value     (or (:color state) "#7aa2f7")
                    :class     "w-8 h-8 rounded cursor-pointer border-0 p-0"
                    :on-change #(swap! local-state assoc :color (.. % -target -value))}]
           [:span {:class "text-sm text-tn-fg-muted"} "Custom color"]
           (when (:color state)
             [bp/button {:icon     "cross"
                         :minimal  true
                         :small    true
                         :on-click #(swap! local-state assoc :color nil)}])]]

         [bp/button {:text     "Save Profile"
                     :intent   "primary"
                     :icon     "tick"
                     :loading  saving-settings?
                     :class    "mb-6"
                     :on-click #(rf/dispatch [::events/save-user-settings
                                              (cond-> {}
                                                (seq (:avatar-url state))
                                                (assoc :avatarUrl (:avatar-url state))
                                                (:color state)
                                                (assoc :color (:color state)))])}]

         (when settings-error
           [:div {:class "mb-4 p-3 rounded bg-tn-red/10 text-tn-red text-sm"}
            "Failed to save profile settings."])

         ;; Sharing section
         [:h3 {:class "bp6-heading mb-2"} "Sharing"]
         [:div {:class "flex items-center gap-2 mb-4"}
          [:p {:class "text-sm text-tn-fg-muted"}
           "Choose who can see your mood entries. Changes save automatically."]
          (when saving-sharing?
            [:span {:class "text-xs text-tn-fg-muted italic"} "Saving..."])]

         ;; Active shares
         (for [[uid share-cfg] active-shares]
           (let [shared?   (:shared? share-cfg false)
                 filters   (:filters share-cfg [])]
             ^{:key uid}
             [share-section uid (:name share-cfg) shared? filters
              ;; on-toggle
              (fn [_uid]
                (swap! local-state update-in [:shares uid :shared?] not))
              ;; on-update-filter
              (fn [idx field value]
                (swap! local-state assoc-in [:shares uid :filters idx field] value))
              ;; on-remove-filter
              (fn [idx]
                (swap! local-state update-in [:shares uid :filters]
                       (fn [fs] (into [] (concat (subvec fs 0 idx) (subvec fs (inc idx)))))))
              ;; on-add-filter
              (fn [_uid]
                (swap! local-state update-in [:shares uid :filters]
                       (fnil conj []) {:pattern "" :isInclude true}))]))

         ;; User search
         [user-search-input]
         [search-results-list local-state]

         (when sharing-error
           [:div {:class "mb-4 p-3 rounded bg-tn-red/10 text-tn-red text-sm"}
            "Failed to save sharing settings."])

         ;; Switch User
         [:div {:class "mt-8 pt-6 border-t border-tn-border"}
          [bp/button {:icon     "swap-horizontal"
                      :text     "Switch User"
                      :intent   "warning"
                      :minimal  true
                      :on-click #(rf/dispatch [::events/switch-user])}]]]))))
