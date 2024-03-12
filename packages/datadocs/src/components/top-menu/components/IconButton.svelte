<script lang="ts">
  import Icon from "../../common/icons/Icon.svelte";
  import tooltipAction from "../../common/tooltip";
  import type { SvelteComponent } from "svelte";
  import type { ModalConfigType } from "../../common/modal/index";
  import { openModal } from "../../common/modal/store-modal";
  import { bind } from "../../common/modal/modalBind";

  export let icon: string;
  export let name: string;
  export let showTooltip: boolean = false;
  export let modalComponent: typeof SvelteComponent;
  // export let label: string;

  function handleButtonMousedown() {
    const isMovable = false;
    const isResizable = false;
    const createWsProps = {
      isMovable: isMovable,
    };
    const modalElement = bind(modalComponent, createWsProps);
    const modalConfig: ModalConfigType = {
      component: modalElement,
      isMovable: isMovable,
      isResizable: isResizable,
      minWidth: 375,
      minHeight: 200,
      preferredWidth: 500,
    };
    openModal(modalConfig);
  }
</script>

<div
  class="icon-button"
  use:tooltipAction={{ disabled: !showTooltip, content: name }}
  on:mousedown={handleButtonMousedown}
>
  <Icon {icon} width="16px" height="16px" fill="#FFFFFF" />
  <span>{name}</span>
</div>

<style lang="postcss">
  .icon-button {
    @apply flex flex-row items-center h-full justify-center space-x-1 pl-3 pr-4 rounded-sm cursor-pointer text-white;
    background: rgba(255, 255, 255, 0.12);
    font-size: 12px;
  }

  .icon-button:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
