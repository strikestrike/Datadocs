<script lang="ts">
  import Fa from "svelte-fa";
  import { faPlus } from "@fortawesome/free-solid-svg-icons";
  import { slide } from "svelte/transition";
  import { quartInOut } from "svelte/easing";
  import { objectsList } from "src/components/panels/Objects/objects-list";
  import Icon from "src/components/common/icons/Icon.svelte";
  import { appManager } from "src/app/core/global/app-manager";
  import type { Pane } from "src/layout/types/pane";
  import type { ObjectType } from "src/layout/types/object";
  import { useTab } from "./useTab";

  export let pane: Pane = null;

  let showModal = false;
  let isHover = false;

  $: objects = objectsList.reduce((acc, cur) => {
    return acc.concat(cur.objects);
  }, []);

  const { addTab } = useTab();

  function onShowModal() {
    showModal = true;
    isHover = true;
  }

  function onHideModal() {
    isHover = false;
    setTimeout(() => {
      if (!isHover) {
        showModal = false;
      }
    }, 200);
  }

  function createPane(object: ObjectType) {
    // const containerPane: Pane = appManager.worksheetLayout.panesContext.getPane(
    //   appManager.activeContainer.id
    // );
    const containerPane: Pane = pane;
    return appManager.objectsManager.createPanefromObject({
      object,
      targetId: containerPane.id,
      params: {
        x: 0,
        y: 0,
        width: 400,
        height: 300,
      },
    });
  }

  function onClick(object: ObjectType) {
    const objectPane = createPane(object);
    addTab({
      targetId: pane.id,
      pane: objectPane,
    });
    showModal = false;
  }
</script>

<div
  class="w-4.5 h-4.5 bg-[#e3f3fa] ml-2 mb-1 flex items-center justify-center rounded-sm cursor-pointer relative flex-shrink-0"
  on:mouseenter={onShowModal}
  on:mouseleave={onHideModal}
  on:focus
  on:mousedown|stopPropagation
>
  <Fa icon={faPlus} size="14" color="#3bc7ff" />

  {#if showModal}
    <div
      class="modal absolute top-5 left-0 bg-white p-3 z-999 rounded-sm"
      transition:slide={{ duration: 200, easing: quartInOut }}
      on:mouseenter={onShowModal}
    >
      {#each objects as object}
        <div
          class="object-item flex items-center justify-start"
          on:click={() => onClick(object)}
          on:keypress
        >
          <div>
            <Icon icon={object.icon} size="16" />
          </div>
          <div class="text-gray-600 ml-2 text-xs">
            <caption>{object.label}</caption>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style lang="postcss">
  .modal {
    box-shadow: 0px 0px 4px rgba(55, 84, 170, 0.161);
  }
  .object-item {
    & + .object-item {
      @apply mt-3;
    }
  }
</style>
