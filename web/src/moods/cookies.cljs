(ns moods.cookies)

(defn get-cookie [name]
  (let [pairs (.split (.-cookie js/document) "; ")]
    (some (fn [pair]
            (let [[k v] (.split pair "=")]
              (when (= k name) (js/decodeURIComponent v))))
          pairs)))

(defn set-cookie! [name value]
  (set! (.-cookie js/document)
        (str name "=" (js/encodeURIComponent value)
             "; path=/; max-age=" (* 365 24 60 60) "; SameSite=Lax")))

(defn clear-cookie! [name]
  (set! (.-cookie js/document)
        (str name "=; path=/; max-age=0")))
