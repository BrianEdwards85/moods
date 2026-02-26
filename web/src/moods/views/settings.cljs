(ns moods.views.settings
  (:require [moods.bp :as bp]
            [moods.events :as events]
            [moods.subs :as subs]
            [moods.views.color-picker :refer [color-picker]]
            [moods.views.sharing :refer [share-section user-search-input
                                         search-results-list shares->rules]]
            [re-frame.core :as rf]
            [reagent.core :as r]))

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
          [color-picker (:color state) #(swap! local-state assoc :color %)]]

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
