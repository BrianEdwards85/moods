(ns moods.views.timeline
  (:require [moods.bp :as bp]
            [moods.events :as events]
            [moods.subs :as subs]
            [moods.util :as util]
            [moods.views.components :as comp]
            [re-frame.core :as rf]))

(defn mood-badge [value]
  [:div {:class (str "w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs text-tn-bg-dark "
                     (util/mood-bg value))}
   (str value)])

(defn entry-card [entry user-detail mine?]
  [:div {:class (str "mb-3 " (if mine? "mr-8 md:mr-16" "ml-8 md:ml-16"))}
   [:div {:class (str "rounded p-4 text-tn-bg-dark "
                      (if mine? "entry-card-mine " "entry-card-partner ")
                      (util/mood-bg (:mood entry)))
          :title (util/format-full-datetime (:createdAt entry))}
    [:div {:class "flex flex-col items-center mb-3"}
     [:img {:src   (util/gravatar-url (:email user-detail) 48)
            :alt   (:name user-detail)
            :class "w-8 h-8 rounded-full mb-1"}]
     [:span {:class "font-bold text-base"}
      (str (:name user-detail) " is at " (:mood entry))]
     [:span {:class "text-xs opacity-60 mt-0.5"}
      (util/format-relative-time (:createdAt entry))]]
    (when-let [notes (not-empty (:notes entry))]
      [:p {:class "text-sm opacity-90"} notes])
    (when-let [tags (seq (:tags entry))]
      [:div {:class "mt-2 flex flex-wrap gap-1"}
       (for [t tags]
         ^{:key (:name t)}
         [comp/mood-tag t])])]])

(defn date-divider [label]
  [:div {:class "flex items-center gap-3 my-5"}
   [:div {:class "flex-1 h-px bg-tn-border"}]
   [:span {:class "text-xs text-tn-fg-dim font-medium uppercase tracking-wide"} label]
   [:div {:class "flex-1 h-px bg-tn-border"}]])

(defn timeline-screen []
  (let [entries     @(rf/subscribe [::subs/entries])
        loading?    @(rf/subscribe [::subs/loading? :entries])
        current-id  @(rf/subscribe [::subs/current-user-id])
        users-by-id @(rf/subscribe [::subs/users-by-id])]
    [:div {:class "max-w-2xl mx-auto px-4 py-2 pb-20"}
     (cond
       (and loading? (empty? (:edges entries)))
       [:div.py-8.text-center [bp/spinner {:size 40}]]

       (empty? (:edges entries))
       [bp/non-ideal-state {:icon        "timeline-events"
                            :title       "No entries yet"
                            :description "Mood entries will appear here."}]

       :else
       (let [nodes (mapv :node (:edges entries))]
         [:div
          (doall
           (map-indexed
            (fn [idx node]
              (let [cur-date    (util/date-key (:createdAt node))
                    prev-date   (when (pos? idx)
                                  (util/date-key (:createdAt (nth nodes (dec idx)))))
                    show-header (or (zero? idx) (not= cur-date prev-date))
                    entry-user-id (get-in node [:user :id])
                    user-detail   (get users-by-id entry-user-id)
                    mine?         (= entry-user-id current-id)]
                [:<> {:key (:id node)}
                 (when show-header
                   [date-divider (util/date-label (:createdAt node))])
                 [entry-card node user-detail mine?]]))
            nodes))
          (when (get-in entries [:page-info :hasNextPage])
            [:div.text-center.mt-2
             [bp/button {:text     "Load more"
                         :minimal  true
                         :loading  loading?
                         :on-click #(rf/dispatch [::events/load-more-entries
                                                  (get-in entries [:page-info :endCursor])])}]])]))
     [:div {:class "fixed bottom-6 right-6 z-10"}
      [bp/button {:icon     "refresh"
                  :loading  loading?
                  :class    "rounded-full shadow-lg"
                  :on-click #(rf/dispatch [::events/fetch-entries])}]]]))
