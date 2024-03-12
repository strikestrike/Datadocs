<script lang="ts">
  import Icon from "../../../../common/icons/Icon.svelte";

  /**
   * List of keys for do the action without using menu
   */
  export let icons: string[];
</script>

<div class="flex flex-row items-center h-full justify-center gap-x-0.5 text-dark-50">
  {#each icons as icon}
    <Icon {icon} size="14px" />
  {/each}
</div>
