<script lang="ts">
  import { getContext } from "svelte";
  import type { QueryToolbarContextType } from "./type";
import { QUERY_TOOLBAR_CONTEXT_NAME } from "./type";
  import Select from "svelte-select";
  import Icon from "../../common/icons/Icon.svelte";
  import Selection1 from "./Selection1.svelte";
  import checkMobileDevice from "../../common/is-mobile";

  const isMobile = checkMobileDevice();
  const items = [
    { value: "a1", label: "A1" },
    { value: "a2", label: "A2" },
    { value: "a3", label: "A3" },
    { value: "a4", label: "A4" },
    { value: "a5", label: "A5" },
  ];

  const value = { value: "a1", label: "A1" };

  const verticalSeparator = `<div class="w-1px h-[23px] mx-5 border-r-[1px] border-solid border-separator-line-color" />`;

  const queryToolbarContext: QueryToolbarContextType = getContext(
    QUERY_TOOLBAR_CONTEXT_NAME
  );

  function expandQueryToolbar() {
    queryToolbarContext.expandQueryToolbar();
  }

  function handleSelect(event) {
    console.log("selected item", event.detail);
    // .. do something here 🙂
  }

  let chevron1;

  $: chevron1SVG = chevron1?.outerHTML;
</script>

<div class="h-10 w-full px-4 bg-white flex flex-col items-start rounded">
  <div class="w-full h-full flex flex-row items-center">
    <div class="hidden">
      <Icon icon="v-grip" width="10px" height="31px" />
    </div>
    <div class="select1-theme">
      <div class="hidden">
        <Icon icon="chevron-1" bind:svg={chevron1} width="7px" height="23px" />
      </div>
      <Select
        {items}
        {value}
        isClearable={false}
        on:select={handleSelect}
        showIndicator={true}
        indicatorSvg={chevron1SVG}
        Selection={Selection1}
        containerStyles="min-width: {isMobile ? 50 : 80}px;"
        inputStyles="font-style: normal;font-weight: 500;font-size: 15px;"
      />
    </div>

    {@html verticalSeparator}

    <div class="flex flex-row items-center space-x-3">
      <div>
        <Icon icon="query-editor-formula" size="20px" fill="#5F89FF" />
      </div>

      <div>
        <Icon icon="query-editor-raw" size="20px" fill="#E6E6E6" />
      </div>

      <div>
        <Icon icon="query-editor-application" size="20px" fill="#E6E6E6" />
      </div>

      <div>
        <Icon icon="query-editor-http" size="20px" fill="#E6E6E6" />
      </div>
    </div>

    {@html verticalSeparator}

    <div class="w-full flex flex-row items-center flex-grow">
      <div class="flex-grow">
        <input
          class="formula-input w-full h-[23px] border-none"
          value="= 26 + 3 "
        />
      </div>

      <div
        class="flex-grow-0 flex-shrink-0 cursor-pointer"
        on:click={expandQueryToolbar}
      >
        <Icon
          icon="query-editor-arrow"
          width="9px"
          height="6px"
          fill="#A7B0B5"
        />
      </div>
    </div>
  </div>
</div>

<style lang="postcss">
  .select1-theme {
    --border: none;
    /* --indicatorHeight: 40px; */

    /* select container */
    --borderRadius: 4px;
    --height: 23px;
    --padding: 0px;

    /* input */
    --inputPadding: 0px 10px 0px 0px;

    /* indicator icon */
    --indicatorWidth: 7px;
    --indicatorHeight: 23px;
    --indicatorTop: 0px;
    --indicatorRight: 0px;
  }

  .formula-input {
    font-weight: 500;
    font-size: 15px;
    outline: none;
  }
</style>
