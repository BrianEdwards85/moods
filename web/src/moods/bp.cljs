(ns moods.bp
  "Reagent wrappers for Blueprint.js and third-party React components."
  (:require ["@blueprintjs/core" :as bp]
            ["@blueprintjs/select" :as bp-select]
            ["@emoji-mart/react" :default EmojiPicker]
            ["@emoji-mart/data" :default emoji-data]
            [reagent.core :as r]))

(def button         (r/adapt-react-class bp/Button))
(def button-group   (r/adapt-react-class bp/ButtonGroup))
(def card           (r/adapt-react-class bp/Card))
(def dialog         (r/adapt-react-class bp/Dialog))
(def dialog-body    (r/adapt-react-class bp/DialogBody))
(def dialog-footer  (r/adapt-react-class bp/DialogFooter))
(def icon           (r/adapt-react-class bp/Icon))
(def navbar         (r/adapt-react-class bp/Navbar))
(def navbar-group   (r/adapt-react-class bp/NavbarGroup))
(def navbar-heading (r/adapt-react-class bp/NavbarHeading))
(def navbar-divider (r/adapt-react-class bp/NavbarDivider))
(def non-ideal-state (r/adapt-react-class bp/NonIdealState))
(def tag            (r/adapt-react-class bp/Tag))
(def text-area      (r/adapt-react-class bp/TextArea))
(def spinner        (r/adapt-react-class bp/Spinner))
(def input-group    (r/adapt-react-class bp/InputGroup))
(def menu-item      (r/adapt-react-class bp/MenuItem))
(def switch-control (r/adapt-react-class bp/Switch))
(def multi-select   (r/adapt-react-class bp-select/MultiSelect))

(def emoji-picker-component (r/adapt-react-class EmojiPicker))
(defn emoji-picker
  "Emoji-mart picker with data pre-loaded. Pass :onEmojiSelect callback etc."
  [props]
  [emoji-picker-component (merge {:data emoji-data} props)])
