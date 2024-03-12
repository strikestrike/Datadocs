<script lang="ts">
  import ToolbarSeparator from "../../ToolbarSeparator.svelte";
  import type { ToolbarSectionInfo } from "../type";
  import Subtoolbar from "./Subtoolbar.svelte";

  export let sectionStatus: Record<string, boolean>;
  export let section: ToolbarSectionInfo;
  export let isLast: boolean;
  export let hiddenSection: boolean = false;
</script>

{#if !section.hidden}
  {#if section.type === "component"}
    {#if sectionStatus[section.name] !== hiddenSection && !section.hidden}
      <svelte:component this={section.component} />
      {#if !isLast}
        <ToolbarSeparator />
      {/if}
    {/if}
  {:else if section.type === "subtoolbar"}
    <Subtoolbar bind:section {sectionStatus} {hiddenSection} />
  {/if}
{/if}
