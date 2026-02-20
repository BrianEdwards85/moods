(ns moods.views.timeline
  (:require [moods.bp :as bp]
            [moods.events :as events]
            [moods.subs :as subs]
            [moods.util :as util]
            [re-frame.core :as rf]))

(defn mood-badge [value]
  [:div {:class "w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
         :style {:background-color (util/mood-color value)
                 :color "#1f2335"}}
   (str value)])

(defn entry-card [entry]
  (let [mood (:mood entry)
        user (:user entry)]
    [bp/card {:class "mb-3 p-4"}
     [:div.flex.items-center.gap-3
      [mood-badge mood]
      [:div {:class "flex-1 min-w-0"}
       [:div.flex.items-center.justify-between
        [:div.flex.items-center.gap-2
         [:span.font-bold (str mood "/10")]
         (when user
           [:span {:class "text-tn-fg-muted text-sm"} (str "— " (:name user))])]
        [:span {:class "text-tn-fg-dim text-xs"} (:createdAt entry)]]
       (when-let [notes (not-empty (:notes entry))]
         [:p {:class "text-tn-fg-muted text-sm mt-1"} notes])
       (when-let [tags (seq (:tags entry))]
         [:div {:class "mt-2 flex flex-wrap gap-1"}
          (for [t tags]
            ^{:key (:name t)}
            [bp/tag {:minimal true} (:name t)])])]]]))

(defn timeline-screen []
  (let [entries  @(rf/subscribe [::subs/entries])
        loading? @(rf/subscribe [::subs/loading? :entries])]
    [:div {:class "max-w-2xl mx-auto px-4 py-4"}
     [:h3.bp6-heading.mb-4 "Timeline"]
     (cond
       (and loading? (empty? (:edges entries)))
       [:div.py-8.text-center [bp/spinner {:size 40}]]

       (empty? (:edges entries))
       [bp/non-ideal-state {:icon        "timeline-events"
                            :title       "No entries yet"
                            :description "Mood entries will appear here."}]

       :else
       [:div
        (for [{:keys [node]} (:edges entries)]
          ^{:key (:id node)}
          [entry-card node])
        (when (get-in entries [:page-info :hasNextPage])
          [:div.text-center.mt-2
           [bp/button {:text     "Load more"
                       :minimal  true
                       :loading  loading?
                       :on-click #(rf/dispatch [::events/load-more-entries
                                                (get-in entries [:page-info :endCursor])])}]])])]))
