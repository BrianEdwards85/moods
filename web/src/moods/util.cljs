(ns moods.util
  (:require ["md5" :as md5]))

(defn gravatar-url
  ([email] (gravatar-url email 80))
  ([email size]
   (let [hash (md5 (.trim (.toLowerCase email)))]
     (str "https://www.gravatar.com/avatar/" hash "?s=" size "&d=retro"))))

(def mood-colors
  {1  "#f7768e"   ; red
   2  "#f7768e"
   3  "#ff9e64"   ; orange
   4  "#ff9e64"
   5  "#e0af68"   ; yellow
   6  "#e0af68"
   7  "#9ece6a"   ; yellow-green
   8  "#9ece6a"
   9  "#73daca"   ; green
   10 "#73daca"})

(defn mood-color [value]
  (get mood-colors value "#565f89"))
