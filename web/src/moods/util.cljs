(ns moods.util
  (:require ["md5" :as md5]))

(defn gravatar-url
  ([email] (gravatar-url email 80))
  ([email size]
   (let [hash (md5 (.trim (.toLowerCase email)))]
     (str "https://www.gravatar.com/avatar/" hash "?s=" size "&d=retro"))))

(def ^:private mood-bg-classes
  {1  "bg-mood-1"
   2  "bg-mood-2"
   3  "bg-mood-3"
   4  "bg-mood-4"
   5  "bg-mood-5"
   6  "bg-mood-6"
   7  "bg-mood-7"
   8  "bg-mood-8"
   9  "bg-mood-9"
   10 "bg-mood-10"})

(defn mood-bg [value]
  (get mood-bg-classes value "bg-tn-fg-dim"))

;; ---------------------------------------------------------------------------
;; Date / time formatting
;; ---------------------------------------------------------------------------

(def ^:private day-names
  ["Sunday" "Monday" "Tuesday" "Wednesday" "Thursday" "Friday" "Saturday"])

(def ^:private month-names
  ["Jan" "Feb" "Mar" "Apr" "May" "Jun"
   "Jul" "Aug" "Sep" "Oct" "Nov" "Dec"])

(defn- pad2 [n]
  (if (< n 10) (str "0" n) (str n)))

(defn- format-time-12h [date]
  (let [h  (.getHours date)
        m  (.getMinutes date)
        ap (if (< h 12) "AM" "PM")
        h  (cond (zero? h) 12 (> h 12) (- h 12) :else h)]
    (str h ":" (pad2 m) " " ap)))

(defn- same-day? [a b]
  (and (= (.getFullYear a) (.getFullYear b))
       (= (.getMonth a) (.getMonth b))
       (= (.getDate a) (.getDate b))))

(defn- yesterday? [date now]
  (let [yesterday (doto (js/Date. (.getTime now))
                    (.setDate (- (.getDate now) 1)))]
    (same-day? date yesterday)))

(defn- days-ago [date now]
  (/ (- (.getTime now) (.getTime date)) 86400000))

(defn format-relative-time
  "Human-readable relative timestamp from an ISO date string."
  [iso-str]
  (let [date    (js/Date. iso-str)
        now     (js/Date.)
        diff-ms (- (.getTime now) (.getTime date))
        diff-s  (/ diff-ms 1000)
        diff-m  (/ diff-s 60)
        diff-h  (/ diff-m 60)]
    (cond
      (< diff-m 1)   "just now"
      (< diff-h 1)   (str (js/Math.floor diff-m) "m ago")
      (and (same-day? date now) (< diff-h 12))
      (str (js/Math.floor diff-h) "h ago")

      (same-day? date now)
      (str "Today at " (format-time-12h date))

      (yesterday? date now)
      (str "Yesterday at " (format-time-12h date))

      (< (days-ago date now) 7)
      (str (nth day-names (.getDay date)) " at " (format-time-12h date))

      (= (.getFullYear date) (.getFullYear now))
      (str (nth month-names (.getMonth date)) " " (.getDate date))

      :else
      (str (nth month-names (.getMonth date)) " " (.getDate date) ", " (.getFullYear date)))))

(defn date-label
  "Date group label from an ISO date string: 'Today', 'Yesterday', or the full date."
  [iso-str]
  (let [date (js/Date. iso-str)
        now  (js/Date.)]
    (cond
      (same-day? date now)       "Today"
      (yesterday? date now)      "Yesterday"
      (< (days-ago date now) 7)  (str (nth day-names (.getDay date)) ", "
                                      (nth month-names (.getMonth date)) " "
                                      (.getDate date))
      (= (.getFullYear date) (.getFullYear now))
      (str (nth month-names (.getMonth date)) " " (.getDate date))

      :else
      (str (nth month-names (.getMonth date)) " " (.getDate date) ", " (.getFullYear date)))))

(defn date-key
  "Calendar date string for grouping (YYYY-MM-DD)."
  [iso-str]
  (let [d (js/Date. iso-str)]
    (str (.getFullYear d) "-" (pad2 (inc (.getMonth d))) "-" (pad2 (.getDate d)))))

(defn format-full-datetime
  "Full human-readable timestamp, e.g. 'Wednesday, Feb 19, 2026 at 3:42 PM'."
  [iso-str]
  (let [d (js/Date. iso-str)]
    (str (nth day-names (.getDay d)) ", "
         (nth month-names (.getMonth d)) " "
         (.getDate d) ", "
         (.getFullYear d) " at "
         (format-time-12h d))))
