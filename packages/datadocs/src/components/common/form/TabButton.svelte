<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { TabOption } from "./TabButton";

  const dispatch = createEventDispatcher<{ changed: { value } }>();

  export let options: TabOption[];
  export let value: string;

  let className = "";
  export { className as class };
</script>

<ul class="tab-button-container {className}">
  {#each options as option}
    <li class:active={value === option.value}>
      <button
        on:click={(e) => {
          e.preventDefault();
          value = option.value;
          dispatch("changed", { value });
        }}>{option.title}</button
      >
    </li>
  {/each}
</ul>

<style lang="postcss">
  ul.tab-button-container {
    @apply flex flex-row bg-light-50 border border-light-100 rounded;

    li > button {
      @apply uppercase py-1 px-2.5 m-0.5 text-11px font-medium text-dark-100 rounded;
    }

    li.active > button {
      @apply bg-[white] text-primary-indigo-blue;
      box-shadow: 0px 4px 6px rgba(55, 84, 170, 0.16);
    }
  }
</style>
