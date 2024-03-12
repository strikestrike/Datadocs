<script lang="ts">
  import { createEventDispatcher } from "svelte";

  type OptionData = { value: string; label: string };

  export let options: OptionData[];
  export let activeOption: OptionData = null;
  export let name = "radioButton";
  /**
   * Indicate if the radio button options UI is on horizontal/vertical direction
   */
  export let direction: "horizontal" | "vertical" = "horizontal";

  let className = "";
  export { className as class };

  // All options is on the same row by default
  let directionClass =
    direction === "horizontal" ? "flex flex-row gap-6" : "flex flex-col gap-1";
  let value: string = activeOption?.value;
  const dispatch = createEventDispatcher();

  function onValueChange() {
    activeOption = options.find((option) => option.value === value);
    dispatch("change", { value: { ...activeOption } });
  }

  $: if (value) onValueChange();
</script>

<div
  class="radio-group {className} {directionClass}"
  role="radiogroup"
  {...$$restProps}
>
  {#each options as option}
    {@const selected = activeOption?.value === option.value}

    <label class:selected>
      <input bind:group={value} type="radio" value={option.value} {name} />

      <div class="flex flex-row items-center gap-1.5">
        <div class="check-button" />
        <div class="capitalize">{option.label}</div>
      </div>
    </label>
  {/each}
</div>

<style lang="postcss">
  label {
    @apply cursor-pointer m-0 p-0;
  }

  label input {
    @apply hidden;
  }

  .check-button {
    @apply w-[17px] h-[17px] rounded-full bg-light-100;
    @apply flex flex-row items-center justify-center;
  }

  label.selected .check-button {
    @apply bg-primary-datadocs-blue;
  }

  label.selected .check-button::after {
    @apply bg-white rounded-full;
    content: "";
    width: 7px;
    height: 7px;
  }
</style>
