(ns moods.views.timeline
  (:require [moods.bp :as bp]
            [moods.subs :as subs]
            [re-frame.core :as rf]))

(defn entry-card [entry]
  (let [mood (:mood entry)]
    [bp/card {:class "mb-3 p-4"}
     [:div.flex.items-center.justify-between
      [:div
       [:span.bp6-text-large.font-bold (str mood "/10")]
       (when-let [notes (:notes entry)]
         [:p.bp6-text-muted.mt-1 notes])]
      [:span.bp6-text-muted.text-sm (:createdAt entry)]]
     (when-let [tags (seq (:tags entry))]
       [:div.mt-2.flex.flex-wrap.gap-1
        (for [t tags]
          ^{:key (:name t)}
          [bp/tag {:minimal true} (:name t)])])]))

(defn user-column [label entries-sub]
  (let [entries @(rf/subscribe [entries-sub])]
    [:div {:class "flex-1 min-w-0 px-2"}
     [:h3.bp6-heading.mb-3 label]
     (if (empty? (:edges entries))
       [bp/non-ideal-state {:icon        "timeline-events"
                            :title       "No entries yet"
                            :description "Mood entries will appear here."}]
       [:div
        (for [{:keys [node]} (:edges entries)]
          ^{:key (:id node)}
          [entry-card node])])]))

(defn timeline-screen []
  (let [current @(rf/subscribe [::subs/current-user])
        partner @(rf/subscribe [::subs/partner-user])]
    [:div {:class "max-w-5xl mx-auto px-4 py-4"}
     [:div {:class "flex gap-6"}
      [user-column (str (:name current) " (You)") ::subs/my-entries]
      [user-column (or (:name partner) "Partner") ::subs/partner-entries]]]))
