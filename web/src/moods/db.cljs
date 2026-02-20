(ns moods.db)

(def default-db
  {:current-route   nil
   :current-user    nil
   :users           []
   :entries         {:edges [] :page-info {:has-next-page false :end-cursor nil}}
   :tags            []
   :mood-modal      {:open?     false
                     :mood      5
                     :notes     ""
                     :tags      []
                     :tag-query ""}
   :loading         #{}
   :errors          {}})
