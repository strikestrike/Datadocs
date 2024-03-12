<script lang="ts">
  import Icon from "../../common/icons/Icon.svelte";
  import StatusBarTabs from "./StatusBarTabs.svelte";
  import { watchResize } from "svelte-watch-resize";
  import checkMobileDevice from "../../common/is-mobile";

  export let numberOfSheets: number;

  let rightPartWidth: number;
  let showRightPart = false;
  const isMobile: boolean = checkMobileDevice();

  function handleResize(element: HTMLElement) {
    // showRightPart = element.clientWidth > 550;
  }

  $: rightPartWidth = showRightPart ? 220 : 0;
</script>

<div
  class="status-bar w-full h-full px-2 flex flex-row justify-between"
  use:watchResize={handleResize}
>
  <div
    class="left-status-bar h-full flex flex-row items-center justify-start"
    style="width: calc(100% - {rightPartWidth}px);"
  >
    <StatusBarTabs />
  </div>

  <div
    class="right-status-bar h-full flex flex-row items-center justify-end flex-grow-0"
  >
    {#if showRightPart && !isMobile}
      <div class="flex flex-row items-center mr-2 whitespace-nowrap">
        Workbook has {numberOfSheets} Sheets
      </div>

      <div class="flex flex-row items-center space-x-1.5">
        <div>
          <Icon icon="status-bar-grid" size="18px" />
        </div>

        <div>
          <Icon icon="status-bar-document" size="18px" />
        </div>

        <div class="h-[18px] flex flex-row items-center space-x-0.5">
          <div>
            <Icon icon="status-bar-row-horizontal" size="18px" />
          </div>

          <div>
            <svg
              width="5"
              height="4"
              viewBox="0 0 5 4"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.00611 0.605528C2.13685 0.474823 2.31415 0.401398 2.49902 0.401398C2.68389 0.401398 2.8612 0.474823 2.99194 0.605528L4.79489 2.40848C4.89237 2.50598 4.95875 2.6302 4.98563 2.76542C5.01252 2.90065 4.99872 3.04081 4.94596 3.16818C4.8932 3.29556 4.80386 3.40444 4.68924 3.48105C4.57461 3.55766 4.43985 3.59856 4.30197 3.59859H0.696072C0.558201 3.59856 0.423434 3.55766 0.308808 3.48105C0.194182 3.40444 0.104843 3.29556 0.0520863 3.16818C-0.00067059 3.04081 -0.0144771 2.90065 0.0124121 2.76542C0.0393013 2.6302 0.105679 2.50598 0.203154 2.40848L2.00611 0.605528Z"
                fill="#A7B0B5"
              />
            </svg>
          </div>
        </div>
      </div>
    {:else}
      <!-- <Icon icon="status-bar-more" size="16px" /> -->
    {/if}
  </div>
</div>

<style lang="postcss">
  /* left status bar */
  .left-status-bar {
    font-size: 15px;
    font-weight: 500;
  }

  /* right status bar */
  .right-status-bar {
    font-size: 11px;
    font-weight: 500;
    color: #a7b0b5;
  }
</style>
