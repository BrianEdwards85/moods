(ns moods.db)

(def default-db
  {:current-user   nil
   :users          []
   :my-entries     {:edges [] :page-info {:has-next-page false :end-cursor nil}}
   :partner-entries {:edges [] :page-info {:has-next-page false :end-cursor nil}}
   :tags           []
   :mood-modal     {:open?   false
                    :mood    5
                    :notes   ""
                    :tags    []}
   :loading        #{}
   :errors         {}})
