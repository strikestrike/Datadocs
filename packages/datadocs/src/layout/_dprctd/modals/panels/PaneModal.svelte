<!-- @component
@packageModule(layout/PaneModal)
-->
<script lang="ts">
  import { onMount, getContext } from "svelte";
  import Tabs from "./Tabs.svelte";
  import Panel from "src/components/panels/Panel.svelte";
  import { CLOSE_MODAL_CONTEXT_NAME } from "src/components/common/modal";
  import type { Pane } from "src/layout/types/pane";

  export let pane: Pane;
  // export let panesContext: PanesContext;
  export let activeTabIndex = 0;

  const closeModal: Function = getContext(CLOSE_MODAL_CONTEXT_NAME);

  function isMainSectionPaneClose(): boolean {
    // return (
    //   pane.props.isClosed ||
    //   (/inner/.test(pane.placement) && pane.parent.props.isClosed)
    // );
    return true;
  }

  function toggleTab(index: number) {
    // pane.props.activeChild = index;

    if (!isMainSectionPaneClose()) {
      // panesContext.activeTabChange(pane, index);
    }

    pane = pane;
  }

  function reorderTab(newTabs: any, active: number) {
    // pane.props.activeChild = active;
    pane.children = newTabs;
    // panesContext.reorderTabs(pane, newTabs, active);
    pane = pane;
  }

  if (isMainSectionPaneClose()) {
    // pane.props.activeChild = activeTabIndex;
  }

  // $: activeIndex = pane.props.activeChild;
  // $: activeTab = pane.children[activeIndex];
</script>

<div class="modal" style="--modal-header-height: 46px;">
  <div class="modal-header">
    <div class="tabs">
      <!-- <Tabs {pane} {toggleTab} {reorderTab} /> -->
    </div>

    <div
      class="absolute top-0 bottom-0 right-5 rounded-full w-10 flex flex-row justify-center items-center"
    >
      <div
        class="close-btn w-5 h-5 cursor-pointer"
        on:click={() => closeModal()}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.0001 18.959C8.22835 18.959 6.49639 18.4337 5.02324 17.4493C3.55009 16.465 2.40191 15.0659 1.72389 13.4291C1.04587 11.7922 0.868473 9.99102 1.21412 8.25332C1.55977 6.51562 2.41295 4.91944 3.66576 3.66662C4.91857 2.41381 6.51475 1.56064 8.25245 1.21499C9.99015 0.869336 11.7913 1.04674 13.4282 1.72475C15.0651 2.40277 16.4641 3.55095 17.4485 5.0241C18.4328 6.49725 18.9582 8.22921 18.9582 10.001C18.9562 12.3762 18.0117 14.6535 16.3322 16.3331C14.6527 18.0126 12.3753 18.957 10.0001 18.959ZM10.0001 2.29238C8.47544 2.29238 6.98503 2.74451 5.71734 3.59158C4.44965 4.43865 3.46162 5.64262 2.87821 7.05123C2.29479 8.45984 2.14219 10.0098 2.43971 11.5052C2.73722 13.0005 3.47149 14.374 4.54965 15.4521C5.6278 16.5301 7.00143 17.2642 8.49681 17.5615C9.99219 17.8589 11.5422 17.7061 12.9507 17.1225C14.3592 16.5389 15.5631 15.5507 16.41 14.2829C17.2569 13.0151 17.7089 11.5247 17.7087 10C17.7069 7.95619 16.8941 5.99661 15.4489 4.55151C14.0036 3.1064 12.0439 2.2939 10.0001 2.29238Z"
            fill="#ffffff"
          />
          <path
            d="M7.64203 12.9838C7.55986 12.9841 7.47845 12.968 7.40257 12.9364C7.32669 12.9048 7.25787 12.8585 7.20013 12.8C7.0841 12.6824 7.01904 12.5238 7.01904 12.3586C7.01904 12.1933 7.0841 12.0348 7.20013 11.9171L11.9173 7.2C11.9744 7.13821 12.0433 7.08859 12.1201 7.05411C12.1968 7.01963 12.2797 7.001 12.3638 6.99934C12.4479 6.99767 12.5315 7.01301 12.6095 7.04444C12.6876 7.07586 12.7584 7.12272 12.8179 7.1822C12.8774 7.24169 12.9243 7.31257 12.9557 7.3906C12.9871 7.46864 13.0025 7.55221 13.0008 7.63632C12.9991 7.72042 12.9805 7.80333 12.946 7.88006C12.9115 7.95679 12.8619 8.02577 12.8001 8.08286L8.08394 12.8C8.02666 12.8591 7.95793 12.9059 7.88194 12.9375C7.80596 12.9691 7.72432 12.9848 7.64203 12.9838Z"
            fill="#ffffff"
          />
          <path
            d="M12.3592 12.9838C12.277 12.9841 12.1956 12.968 12.1197 12.9364C12.0438 12.9049 11.975 12.8585 11.9173 12.8L7.20013 8.08381C7.08293 7.96661 7.01709 7.80765 7.01709 7.64191C7.01709 7.47616 7.08293 7.3172 7.20013 7.2C7.31733 7.0828 7.47629 7.01696 7.64204 7.01696C7.80778 7.01696 7.96674 7.0828 8.08394 7.2L12.8001 11.9171C12.9162 12.0348 12.9812 12.1934 12.9812 12.3586C12.9812 12.5238 12.9162 12.6824 12.8001 12.8C12.7425 12.8584 12.6738 12.9047 12.5981 12.9362C12.5224 12.9678 12.4412 12.984 12.3592 12.9838Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    </div>

    <div class="bottom-border-shadow" />
  </div>

  <div class="modal-body">
    <Panel
      pane={{
        ...pane,
        content: {
          ...pane.content,
          // view: activeTab.content?.view,
        },
      }}
    />
  </div>
</div>

<style lang="postcss">
  .modal {
    background-color: white;
    width: inherit;
    height: inherit;
    overflow: hidden;
    border-radius: 4px;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .modal-header {
    @apply header-gradient-bg;
    width: inherit;
    height: var(--modal-header-height);
    position: relative;
  }

  .modal-body {
    width: inherit;
    height: calc(100% - var(--modal-header-height));
  }

  .tabs {
    width: 100%;
    height: 100%;
    padding-right: 60px;
    overflow: hidden;
  }

  .close-btn:hover {
    opacity: 0.6;
  }

  .bottom-border-shadow {
    position: absolute;
    left: 0px;
    right: 0px;
    bottom: -1px;
    height: 1px;
    z-index: 500;
    box-shadow: 0px -1px 4px rgba(55, 84, 170, 0.06);
    clip-path: inset(-10px -10px 1px -10px);
    pointer-events: none;
  }
</style>
