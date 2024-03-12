<script lang="ts">
  import { onMount } from "svelte";
  import type { Pane } from "../../../layout/main/panels-layout/types";

  export let pane: Pane;

  export let objectData: any = {
    config: {},
  };
  export let onObjectChange = (gridObject) => {};

  let imageURL = "";

  onMount(() => {
    if (imageURL === "") {
      objectData = objectData || pane?.content?.view?.config;
      objectData.config = objectData.config || {};
      objectData.config.imageURL = `https://picsum.photos/seed/${Math.round(
        Math.random() * 99999
      )}/300/300`;
      if(pane.content.view){
        pane.content.view.config = pane.content.view.config || {}
        pane.content.view.config = {
          ...pane.content.view.config,
          ...objectData
        };
      }
      pane = pane;
    }
    // onObjectChange(objectData);
    imageURL = objectData.config.imageURL;
  });

  $: {
    objectData = objectData || pane?.content?.view?.config;
    imageURL = objectData.config?.imageURL || "";
  }
</script>

<div class="object-image">
  <!-- <h3 class="object-image-label">{objectData.label}</h3> -->
  <div class="object-image-img">
    {#if imageURL !== ""}
      <img src={imageURL} alt="Sample File" draggable="false" class="object-contain"/>
    {/if}
  </div>
</div>

<style lang="postcss">
  .object-image {
    @apply bg-white overflow-hidden w-full h-full;
    /* border border-solid border-gray-300 rounded-lg  */
  }

  .object-image-label {
    @apply my-2;
  }

  .object-image-img {
    @apply object-contain w-full h-full;
    /* width: 170px;
    height: 145px; */
  }

  .object-image-img img {
    @apply w-full h-full;
  }
</style>
