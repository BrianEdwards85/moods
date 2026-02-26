(ns moods.storage)

(defn get-item [key]
  (.getItem js/localStorage key))

(defn set-item! [key value]
  (.setItem js/localStorage key value))

(defn remove-item! [key]
  (.removeItem js/localStorage key))
