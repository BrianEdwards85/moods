(ns moods.views.color-picker
  (:require [moods.bp :as bp]))

(def preset-colors
  ["#f7768e" "#ff9e64" "#e0af68" "#9ece6a" "#73daca"
   "#7dcfff" "#7aa2f7" "#bb9af7" "#c0caf5" "#565f89"])

(defn color-swatch [color selected? on-click]
  [:button {:class    (str "w-8 h-8 rounded-full border-2 transition-all cursor-pointer "
                           (if selected? "border-white scale-110" "border-transparent hover:scale-105"))
            :style    {:background-color color}
            :on-click #(on-click color)}])

(defn color-picker
  "Preset color swatches + custom color input + clear button.
   value: current color string or nil
   on-change: called with color string or nil (clear)"
  [value on-change]
  [:<>
   [:div {:class "flex flex-wrap gap-2 mb-2"}
    (for [c preset-colors]
      ^{:key c}
      [color-swatch c (= c value) on-change])]
   [:div {:class "flex items-center gap-2 mt-2"}
    [:input {:type      "color"
             :value     (or value "#7aa2f7")
             :class     "w-8 h-8 rounded cursor-pointer border-0 p-0"
             :on-change #(on-change (.. % -target -value))}]
    [:span {:class "text-sm text-tn-fg-muted"} "Custom color"]
    (when value
      [bp/button {:icon     "cross"
                  :minimal  true
                  :small    true
                  :on-click #(on-change nil)}])]])
