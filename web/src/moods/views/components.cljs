(ns moods.views.components
  "Shared, reusable UI components.")

(def ^:private default-tag-color "#3b4261")

(defn mood-tag
  "Renders a tag pill with optional color background and face emoji from metadata.
   `tag` should be a map with :name and optionally :metadata {:color :face}."
  [tag]
  (let [{:keys [name metadata]} tag
        color (:color metadata)
        face  (:face metadata)]
    [:span {:class "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border border-white/35"
            :style {:background-color (or color default-tag-color)
                    :color            "#1f2335"}}
     (when (seq face)
       [:span {:class "text-base leading-none"} face])
     name]))
