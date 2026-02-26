(ns moods.views.sharing
  (:require [moods.bp :as bp]
            [moods.events :as events]
            [moods.subs :as subs]
            [re-frame.core :as rf]
            [reagent.core :as r]))

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

(defn share-section [user-id user-name shared? filters on-toggle on-update-filter on-remove-filter on-add-filter]
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

(defn user-search-input []
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

(defn search-results-list [local-state]
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

(defn shares->rules [shares]
  (->> shares
       (filter (fn [[_ v]] (:shared? v)))
       (mapv (fn [[uid v]]
               {:userId  uid
                :filters (vec (:filters v))}))))
