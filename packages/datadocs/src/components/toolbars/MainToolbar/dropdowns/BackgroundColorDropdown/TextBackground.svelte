<script lang="ts">
  import { getContext, setContext } from "svelte";
  import ColorMenu from "../ColorMenu/ColorMenu.svelte";
  import {
    SELECT_COLOR_CONTEXT_NAME,
    RESET_COLOR_CONTEXT_NAME,
    GET_CURRENT_ACTIVE_COLOR,
  } from "../default";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../common/dropdown";
  import {
    BACKGROUND_COLOR_DEFAULT,
    getBackgroundColorValue,
  } from "../../../../../app/store/store-toolbar";
  import type { BackgroundColorValueType } from "../../../../../app/store/store-toolbar";
  import type { GridKeyControlActionOptions } from "../../../../common/key-control/gridKeyControl";

  export let gridKeyControlOptions: GridKeyControlActionOptions;
  export let scrollContainer: HTMLElement = null;
  export let startRowIndex: number;
  export let changeColor: (value: BackgroundColorValueType) => Promise<any>;

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);

  async function handleSelectColor(color: string) {
    const value: BackgroundColorValueType = {
      type: "textbg",
      value: color,
    };

    await changeColor(value);
    closeDropdown();
  }

  async function handleReset() {
    await changeColor(BACKGROUND_COLOR_DEFAULT);
    closeDropdown();
  }

  function getCurrentActiveColor() {
    const value = getBackgroundColorValue();
    if (value.type === "textbg") {
      return value.value;
    } else {
      return null;
    }
  }

  setContext(SELECT_COLOR_CONTEXT_NAME, handleSelectColor);
  setContext(RESET_COLOR_CONTEXT_NAME, handleReset);
  setContext(GET_CURRENT_ACTIVE_COLOR, getCurrentActiveColor);
</script>

<ColorMenu {gridKeyControlOptions} {scrollContainer} {startRowIndex} />
