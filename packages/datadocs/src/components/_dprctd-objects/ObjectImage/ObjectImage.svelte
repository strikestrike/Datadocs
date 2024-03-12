<script lang="ts">
  import { onMount } from "svelte";

  export let objectData: any = null;
  export let onObjectChange = (gridObject) => {};

  let imageURL = "";

  onMount(() => {
    if (imageURL === "") {
      objectData.config = objectData.config || {};
      objectData.config.imageURL = `https://picsum.photos/seed/${Math.round(
        Math.random() * 99999
      )}/300/300`;
    }
    onObjectChange(objectData);
    imageURL = objectData.config.imageURL;
  });

  $: {
    imageURL = objectData.config?.imageURL || "";
  }
</script>

<div class="object-image">
  <h3 class="object-image-label">{objectData.label}</h3>
  <div class="object-image-img">
    {#if imageURL !== ""}
      <img src={imageURL} alt="Sample File" draggable="false" />
    {/if}
  </div>
</div>

<style lang="postcss">
  .object-image {
    @apply px-3 py-0.5 bg-white border border-solid border-gray-300 rounded-lg overflow-hidden;
    width: 200px;
    height: 200px;
  }

  .object-image-label {
    @apply my-2;
  }

  .object-image-img {
    @apply my-1 object-contain;
    width: 170px;
    height: 145px;
  }

  .object-image-img img {
    @apply w-full h-full;
  }
</style>
