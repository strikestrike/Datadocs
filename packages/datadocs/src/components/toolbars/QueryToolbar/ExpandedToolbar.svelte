<script lang="ts">
  import Icon from "../../common/icons/Icon.svelte";
  import RawQuery from "./body/RawQuery.svelte";
  import type { QueryToolbarContextType } from "./type";
import { QUERY_TOOLBAR_CONTEXT_NAME } from "./type";
  import { getContext } from "svelte";

  const queryToolbarContext: QueryToolbarContextType = getContext(
    QUERY_TOOLBAR_CONTEXT_NAME
  );
  const footerHeight = 33;

  function collapseQueryToolbar() {
    queryToolbarContext.collapseQueryToolbar();
  }
</script>

<div class="toolbar" style="--query-toolbar-footer-height: {footerHeight}px">
  <div class="toolbar-header">
    <div class="header-buttons">
      <div class="w-4 h-4 cursor-pointer mr-3">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13.4017 6.14613C12.1948 6.14613 11.7019 5.29262 12.301 4.24573C12.4676 3.95474 12.5119 3.60949 12.4241 3.28586C12.3363 2.96222 12.1236 2.68669 11.8328 2.51981L10.6797 1.85242C10.4243 1.70492 10.1206 1.66495 9.83569 1.7413C9.55074 1.81765 9.30779 2.00407 9.16028 2.25954L9.08758 2.38604C9.00725 2.61258 8.85872 2.80868 8.6624 2.94736C8.46608 3.08604 8.23162 3.1605 7.99126 3.1605C7.75089 3.1605 7.51643 3.08604 7.32011 2.94736C7.12379 2.80868 6.97526 2.61258 6.89493 2.38604L6.81932 2.25954C6.74811 2.13292 6.65238 2.02175 6.53773 1.93254C6.42307 1.84333 6.29179 1.77786 6.15155 1.73996C6.01131 1.70206 5.86492 1.69248 5.72093 1.71179C5.57695 1.7311 5.43826 1.7789 5.31296 1.85242L4.15992 2.51981C3.86881 2.68833 3.65628 2.96527 3.56881 3.29007C3.48135 3.61487 3.52606 3.96108 3.69318 4.253C4.29951 5.29262 3.8066 6.14322 2.59976 6.14322C2.26373 6.14438 1.94183 6.27857 1.70449 6.51646C1.46715 6.75434 1.3337 7.07655 1.33331 7.41258V8.58597C1.33523 8.92099 1.46936 9.24171 1.70654 9.47834C1.94371 9.71497 2.26473 9.84837 2.59976 9.84951C3.8066 9.84951 4.29951 10.703 3.69318 11.7499C3.60924 11.8943 3.55471 12.0538 3.53274 12.2194C3.51078 12.3849 3.52181 12.5532 3.5652 12.7145C3.60859 12.8757 3.68348 13.0268 3.78556 13.159C3.88763 13.2911 4.01487 13.4018 4.15992 13.4846L5.31296 14.1447C5.56756 14.2928 5.87051 14.3339 6.15535 14.2589C6.4402 14.1839 6.68369 13.9991 6.8324 13.7448L6.90511 13.6183C6.98544 13.3918 7.13397 13.1957 7.33029 13.057C7.52661 12.9183 7.76107 12.8439 8.00143 12.8439C8.2418 12.8439 8.47626 12.9183 8.67258 13.057C8.86889 13.1957 9.01743 13.3918 9.09776 13.6183L9.17046 13.7448C9.31918 13.9991 9.56267 14.1839 9.84751 14.2589C10.1324 14.3339 10.4353 14.2928 10.6899 14.1447L11.8459 13.4846C12.1362 13.3172 12.3483 13.0415 12.4358 12.718C12.5233 12.3945 12.479 12.0495 12.3126 11.7586C11.7063 10.7059 12.1992 9.84951 13.4017 9.84951C13.7372 9.84836 14.0586 9.71456 14.2959 9.47731C14.5332 9.24005 14.6669 8.91859 14.6681 8.58306V7.41258C14.6643 7.07787 14.5297 6.75793 14.293 6.52124C14.0563 6.28455 13.7364 6.14991 13.4017 6.14613ZM7.99998 10.1665C7.57149 10.1665 7.15262 10.0394 6.79634 9.80137C6.44007 9.56331 6.16238 9.22495 5.99841 8.82908C5.83443 8.43321 5.79153 7.9976 5.87512 7.57734C5.95872 7.15708 6.16506 6.77105 6.46804 6.46807C6.77103 6.16508 7.15706 5.95874 7.57732 5.87514C7.99758 5.79155 8.43318 5.83445 8.82906 5.99843C9.22493 6.16241 9.56329 6.44009 9.80135 6.79637C10.0394 7.15264 10.1665 7.57151 10.1665 8C10.1653 8.57423 9.93669 9.12462 9.53064 9.53066C9.1246 9.93671 8.57421 10.1653 7.99998 10.1665Z"
            fill="#A7B0B5"
          />
        </svg>
      </div>

      <div
        class="flex-grow-0 flex-shrink-0 cursor-pointer"
        style="transform: rotate(180deg);"
        on:click={collapseQueryToolbar}
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

  <div class="toolbar-body">
    <RawQuery />
  </div>

  <div class="toolbar-footer">
    <div class="footer-status">Query Complete (0.2 sec elapsed, cached)</div>

    <div class="footer-button">
      <div class="mr-2 text-11px font-medium">Run</div>
      <div class="arrow-button">
        <Icon
          icon="query-editor-arrow"
          width="6px"
          height="4px"
          fill="currentColor"
        />
      </div>
    </div>
  </div>
</div>

<style lang="postcss">
  .toolbar {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    user-select: auto;
  }

  .toolbar :global(*) {
    user-select: text;
  }

  .toolbar-header {
    position: absolute;
    top: 12px;
    right: 16px;
  }

  .header-buttons {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
  }

  .toolbar-body {
    height: calc(100% - var(--query-toolbar-footer-height));
    max-height: calc(100% - var(--query-toolbar-footer-height));
    width: calc(100% - 40px);
    padding: 12px 16px 0px 10px;
  }

  .toolbar-footer {
    height: var(--query-toolbar-footer-height);
    padding: 0px 6px 0px 16px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .footer-status {
    color: #a7b0b5;
    font-size: 11px;
    font-weight: 500;
  }

  .footer-button {
    @apply primary-button flex flex-row items-center cursor-pointer self-start;
    height: 29px;
    border-radius: 3px;
    padding: 0px 6px 0px 12px;
    margin-top: -2px;
  }

  .footer-button:hover {
    @apply primary-button-hover;
  }

  /* .arrow-button {
    @apply flex flex-row items-center px-1 cursor-pointer;
  } */
</style>
