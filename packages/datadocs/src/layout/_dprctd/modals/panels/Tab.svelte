<!-- @component
@packageModule(layout/Tab)
-->
<script lang="ts">
  import type { View } from "../../main/panels-layout/types";

  export let tab;
  export let activeIndex: number;
  export let tabIndex: number;
  export let getTabProps = (tab: any, props: View): View => {
    return {
      id: "",
      name: "",
      label: "",
      icon: "",
    };
  };

  let tabView: View;

  $: {
    tabView = getTabProps(tab, {
      id: "",
      name: "",
      label: "",
      icon: "",
    });
  }
</script>

<div class="tab" class:active={activeIndex === tabIndex}>
  <div class="tab-label">
    <div class="tab-label-inner">{tabView.label}</div>

    <div class="corner-container">
      <div class="left-corner">
        <svg
          width="4px"
          height="4px"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 100 0 A 100 100, 0, 0, 1, 0 100 L 100 100 Z"
            fill="#19013A"
          />

          <path
            d="M 100 0 A 100 100, 0, 0, 1, 0 100 L 100 100 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div class="right-corner">
        <svg
          width="4px"
          height="4px"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 100 0 A 100 100, 0, 0, 1, 0 100 L 100 100 Z"
            fill="#19013A"
            transform="scale(-1,1) translate(-100,0)"
          />

          <path
            d="M 100 0 A 100 100, 0, 0, 1, 0 100 L 100 100 Z"
            fill="currentColor"
            transform="scale(-1,1) translate(-100,0)"
          />
        </svg>
      </div>
    </div>
  </div>
</div>

<style lang="postcss">
  .tab {
    @apply mt-1 h-8 rounded-tl rounded-tr cursor-pointer font-normal;
    min-width: 10px;
    color: rgb(247, 249, 250, 0.7);
  }

  .tab :global(*) {
    pointer-events: none;
  }

  .tab.active {
    @apply h-9 mt-0 font-semibold flex-shrink-0 text-tabs-active-color;
    z-index: 1000;
  }

  :global(.tab-proxy) .tab.active {
    margin: 0px !important;
  }

  :global(.tab-proxy) .tab.active .tab-label {
    height: 36px;
    clip-path: inset(-10px -15px 0px -15px);
  }

  :global(.tab-proxy) .tab.active path {
    fill: white !important;
  }

  .tab:not(.active):hover .tab-label-inner {
    background-color: rgb(247, 249, 250, 0.3);
  }

  .tab:not(.active):hover .corner-container {
    color: rgb(247, 249, 250, 0.3);
  }

  .tab .corner-container {
    color: rgb(247, 249, 250, 0.15);
  }

  .tab.active .corner-container {
    color: white;
  }

  .left-corner {
    @apply absolute w-1 h-1 bottom-0 -left-1;
    z-index: 10;
  }

  .right-corner {
    @apply absolute w-1 h-1 bottom-0 -right-1;
    z-index: 10;
  }

  .left-corner svg {
    filter: drop-shadow(-0.4px -0.4px 0.2px rgb(55 84 170 / 2%));
  }

  .right-corner svg {
    filter: drop-shadow(0.6px -0.4px 0.2px rgb(55 84 170 / 2%));
  }

  .tab-label {
    @apply relative h-full inline-block rounded-tl rounded-tr;
    box-shadow: 0px 0px 4px rgba(55, 84, 170, 0.16);
    margin-right: 1px;
    background-color: #19013a;
  }

  .tab.active .tab-label {
    background-color: white;
  }

  .tab .tab-label-inner {
    @apply w-full h-full py-0 px-3 flex flex-row items-center rounded-tl rounded-tr select-none font-normal whitespace-nowrap;
    font-size: 13px;
    background-color: rgba(167, 176, 181, 0.2);
    color: rgba(233, 237, 240, 0.6);
  }

  .tab.active .tab-label-inner {
    background-color: white;
    color: #5f89ff;
    font-weight: 600;
  }

  :global(.tab-source) .tab.active .tab-label-inner {
    color: rgb(80, 88, 93, 0.2);
  }
</style>
