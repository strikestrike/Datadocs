<!-- @component
@packageDocumentation
@module App
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { routeBasePathStore } from "./app/store/writables";
  import { Router } from "svelte-navigator";
  import { theme } from "./app/store/store-ui";
  import AppRoutes from "./AppRoutes.svelte";
  import { applyTheme } from "./styles/themes/utils";
  import { FONT_FAMILY_VALUES } from "./components/toolbars/MainToolbar/dropdowns/default";
  import { addKeyboardEvents, removeKeyboardEvents } from "./app/events/keyboard-events";

  theme.subscribe((currentTheme) => {
    applyTheme(currentTheme);
  });

  /**
   * Force loading all font family at start
   * It helps prevent font changing problem in the grid at the first time the font is use
   */
  function dummyForceFetchingFontFamily() {
    addFontFamily();
    const fontElements = document.createElement("div");
    Object.assign(fontElements.style, {
      position: "fixed",
      left: "-2000px",
      top: "0px",
    });

    const prefetchFontFamily = [...FONT_FAMILY_VALUES, "Consolas BoldItalic"];
    for (const font of prefetchFontFamily) {
      // normal font
      const normalSpanElement = document.createElement("span");
      Object.assign(normalSpanElement.style, {
        fontFamily: `'${font}'`,
        fontWeight: "normal",
      });
      fontElements.appendChild(normalSpanElement);

      // normal italic font
      const normalItalicSpanElement = document.createElement("span");
      Object.assign(normalItalicSpanElement.style, {
        fontFamily: `'${font}'`,
        fontWeight: "normal",
        fontStyle: "italic",
      });
      fontElements.appendChild(normalItalicSpanElement);

      // bold font
      const boldSpanElement = document.createElement("span");
      Object.assign(boldSpanElement.style, {
        fontFamily: `'${font}'`,
        fontWeight: "bold",
      });
      fontElements.appendChild(boldSpanElement);

      // bold italic font
      const boldItalicSpanElement = document.createElement("span");
      Object.assign(boldItalicSpanElement.style, {
        fontFamily: `'${font}'`,
        fontWeight: "bold",
        fontStyle: "italic",
      });
      fontElements.appendChild(boldItalicSpanElement);
    }

    document.body.appendChild(fontElements);

    setTimeout(() => {
      document.body.removeChild(fontElements);
    }, 1000);
  }

  // A workaround for loading custom font family with route base path
  // TODO: find a way to put it in css file
  function addFontFamily() {
    const styleElement = document.createElement("style");
    document.head.appendChild(styleElement);
    const styleSheet = styleElement.sheet;
    const routeBasePath = get(routeBasePathStore) ?? "";
    styleSheet.insertRule(
      `
        @font-face {
          font-family: "Consolas BoldItalic";
          font-stretch: 100%;
          font-display: swap;
          src: url("${routeBasePath}/fonts/consolaz.ttf") format('truetype');
        }
      `,
      styleSheet.cssRules.length
    );
  }

  onMount(async () => {
    const currentWindow = window as any;
    currentWindow.theme = theme;

    dummyForceFetchingFontFamily();
    addKeyboardEvents();
    return () => {
      removeKeyboardEvents();
    }
  });

</script>

<style global windi:preflights:global windi:safelist:global></style>

<main>
  <Router primary={false}>
    <div id="appRoot">
      <AppRoutes />
    </div>
  </Router>
</main>

