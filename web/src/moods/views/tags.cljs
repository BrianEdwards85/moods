(ns moods.views.tags
  (:require [moods.bp :as bp]
            [moods.events :as events]
            [moods.subs :as subs]
            [re-frame.core :as rf]
            [reagent.core :as r]))

(defn tag-edit-modal []
  (let [{:keys [editing]} @(rf/subscribe [::subs/tags-page])]
    [bp/dialog {:title    (str "Edit Tag: " (:name editing))
                :icon     "tag"
                :is-open  (some? editing)
                :on-close #(rf/dispatch [::events/close-tag-editor])
                :class    "w-full max-w-md"}
     [bp/dialog-body
      [:p {:class "text-tn-fg-muted"} "Tag editing coming soon."]]
     [bp/dialog-footer
      {:actions
       (r/as-element
        [bp/button {:text     "Close"
                    :on-click #(rf/dispatch [::events/close-tag-editor])}])}]]))

(defn tag-row [tag]
  (let [{:keys [name metadata archivedAt]} (:node tag)]
    [bp/card {:interactive true
              :class       "mb-2 p-3 cursor-pointer"
              :on-click    #(rf/dispatch [::events/open-tag-editor (:node tag)])}
     [:div.flex.items-center.justify-between
      [:div.flex.items-center.gap-2
       [bp/icon {:icon "tag" :class "opacity-60"}]
       [:span.font-medium name]
       (when archivedAt
         [bp/tag {:minimal true :intent "warning" :class "ml-2"} "archived"])]
      [bp/icon {:icon "chevron-right" :class "opacity-40"}]]]))

(defn tags-screen []
  (let [{:keys [search edges page-info]} @(rf/subscribe [::subs/tags-page])
        loading? @(rf/subscribe [::subs/loading? :tags-page])
        initial-load (r/atom true)]
    (when @initial-load
      (rf/dispatch [::events/fetch-tags-page])
      (reset! initial-load false))
    (fn []
      (let [{:keys [search edges page-info]} @(rf/subscribe [::subs/tags-page])
            loading? @(rf/subscribe [::subs/loading? :tags-page])]
        [:div {:class "max-w-2xl mx-auto px-4 py-4"}
         [:div.flex.items-center.justify-between.mb-4
          [:h3.bp6-heading "Tags"]
          [bp/button {:icon     "refresh"
                      :minimal  true
                      :loading  loading?
                      :on-click #(rf/dispatch [::events/fetch-tags-page])}]]

         [:div.mb-4
          [bp/input-group {:left-icon   "search"
                           :placeholder "Search tags..."
                           :value       search
                           :on-change   #(rf/dispatch [::events/set-tags-page-search
                                                       (.. % -target -value)])}]]

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
