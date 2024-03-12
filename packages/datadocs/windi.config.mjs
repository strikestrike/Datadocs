/*
 * @Author: lainlee
 * @Date: 2023-06-25 15:43:08
 * @Description:
 */
const colors = require("./src/styles/themes/colors");

import { defineConfig } from "windicss/helpers";
import defaultTheme from "windicss/defaultTheme";
import {
  utilsPlugin,
  makeShorthandAttributePlugin,
} from "@datadocs/windi-plugins";

export default defineConfig({
  preflight: true,
  extract: {
    include: ["**/*.{html,svelte,css}"],
    exclude: ["node_modules", ".git"],
  },
  theme: {
    colors: { ...defaultTheme.colors, ...colors },
    cursor: {
      auto: "auto",
      default: "default",
      pointer: "pointer",
      wait: "wait",
      text: "text",
      move: "move",
      "not-allowed": "not-allowed",
      crosshair: "crosshair",
      "zoom-in": "zoom-in",
      "col-resize": "col-resize",
      "n-resize": "ns-resize",
      "s-resize": "ns-resize",
      "e-resize": "ew-resize",
      "w-resize": "ew-resize",
      "ne-resize": "nesw-resize",
      "nw-resize": "nwse-resize",
      "se-resize": "nwse-resize",
      "sw-resize": "nesw-resize",
    },
    screens: {
      xtiny: "64px",
      ...defaultTheme.screens,
    },
  },
  plugins: [
    makeShorthandAttributePlugin("text", "font-size"),
    utilsPlugin({
      watch: true,
      include: [
        "./src/styles/components.css",
        "./src/styles/utilities.css",
        "./src/styles/base.css",
      ],
    }),
  ],
});
