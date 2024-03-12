<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Checkbox from "../../common/form/Checkbox.svelte";

  const dispatch = createEventDispatcher<{
    updated: {
      caseInsensitive: boolean;
    };
  }>();

  export let caseInsensitive: boolean;

  function notify() {
    dispatch("updated", { caseInsensitive });
  }
</script>

<div class="dropdown">
  <div class="common-setting">
    <Checkbox
      checked={caseInsensitive}
      id="caseInsensitiveSetting"
      on:checked={({ detail }) => {
        caseInsensitive = detail.value;
        notify();
      }}
    />
    <label class="cursor-pointer" for="caseInsensitiveSetting"
      >Case-insensitive</label
    >
  </div>
</div>

<style lang="postcss">
  .dropdown {
    @apply flex flex-col justify-stretch relative bg-white rounded overflow-y-auto overflow-x-hidden text-13px h-full outline-none p-1.5 min-w-240px;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);

    > .common-setting {
      @apply flex flex-row py-1.5 pr-2 pl-3.5;
      column-gap: 8px;
      line-height: normal;
    }
  }
</style>
