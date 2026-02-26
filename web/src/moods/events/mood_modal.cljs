(ns moods.events.mood-modal
  (:require [moods.events :as-alias events]
            [moods.db :as db]
            [re-frame.core :as rf]))

;; ---------------------------------------------------------------------------
;; Mood modal UI
;; ---------------------------------------------------------------------------

(rf/reg-event-fx
 ::events/open-mood-modal
 (fn [{:keys [db]} _]
   {:db       (assoc-in db [:mood-modal :open?] true)
    :dispatch [::events/search-tags nil]}))

(rf/reg-event-db
 ::events/close-mood-modal
 (fn [db _]
   (assoc db :mood-modal (:mood-modal db/default-db))))

(rf/reg-event-db
 ::events/set-mood-value
 (fn [db [_ value]]
   (assoc-in db [:mood-modal :mood] value)))

(rf/reg-event-db
 ::events/set-mood-notes
 (fn [db [_ text]]
   (assoc-in db [:mood-modal :notes] text)))

(rf/reg-event-db
 ::events/set-mood-tags
 (fn [db [_ tags]]
   (assoc-in db [:mood-modal :tags] tags)))

(rf/reg-event-fx
 ::events/set-tag-query
 (fn [{:keys [db]} [_ text]]
   (cond-> {:db (assoc-in db [:mood-modal :tag-query] text)}
     (>= (count text) 1) (assoc :dispatch [::events/search-tags text]))))

(rf/reg-event-db
 ::events/add-mood-tag
 (fn [db [_ tag]]
   (let [tags (get-in db [:mood-modal :tags])
         already? (some #(= (:name %) (:name tag)) tags)]
     (if already?
       db
       (-> db
           (update-in [:mood-modal :tags] conj tag)
           (assoc-in [:mood-modal :tag-query] ""))))))

(rf/reg-event-db
 ::events/remove-mood-tag
 (fn [db [_ tag-name]]
   (update-in db [:mood-modal :tags]
              (fn [tags] (vec (remove #(= (:name %) tag-name) tags))))))
