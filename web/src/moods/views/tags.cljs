(ns moods.views.tags
  (:require [moods.bp :as bp]
            [moods.events :as events]
            [moods.subs :as subs]
            [moods.views.tag-edit-modal :refer [tag-edit-modal]]
            [re-frame.core :as rf]
            [reagent.core :as r]))

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
  (let [initial-load (r/atom true)]
    (when @initial-load
      (rf/dispatch [::events/fetch-tags-page])
      (reset! initial-load false))
    (fn []
      (let [{:keys [search show-archived edges page-info]} @(rf/subscribe [::subs/tags-page])
            loading?   @(rf/subscribe [::subs/loading? :tags-page])
            page-error @(rf/subscribe [::subs/error :tags-page])]
        [:div {:class "max-w-2xl mx-auto px-4 py-4"}
         (when page-error
           [:div {:class "mb-4 p-3 rounded bg-tn-red/10 text-tn-red text-sm"}
            "Failed to load tags. Please try refreshing."])
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
