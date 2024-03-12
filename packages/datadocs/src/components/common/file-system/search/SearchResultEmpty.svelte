<script lang="ts">
  import searchEmptyIcon from "./search_empty_icon.svg?raw";

  export let searchText: string;
</script>

<div class="gap-y-1">
  <div class="w-full flex flex-row justify-center">
    {@html searchEmptyIcon}
  </div>

  <div class="w-full text-dark-300 text-13px font-normal text-center">
    No results found
  </div>

  <div class="w-full text-dark-50 text-11px font-normal text-center">
    We couldn’t find anything with text “{searchText}”
  </div>
</div>
