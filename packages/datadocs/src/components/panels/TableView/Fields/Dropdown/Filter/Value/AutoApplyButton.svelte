<script lang="ts">
  import Checkbox from "../../../../../../common/form/Checkbox.svelte";

  export let checked = false;

  let className = "";
  export { className as class };

  let selected = false;
</script>

<div class="aa-button-container {className}" class:selected>
  <Checkbox bind:checked id="autoApplyCheckBox" size="17px" />
  <label for="autoApplyCheckBox" class="label">Auto Apply</label>
</div>

<style lang="postcss">
  .aa-button-container {
    @apply flex flex-row items-center text-11px;

    &:has(:focus-visible),
    &.selected {
      .label {
        text-decoration: underline;
      }
    }

    .label {
      @apply ml-2 font-medium cursor-pointer;
    }
  }
</style>
