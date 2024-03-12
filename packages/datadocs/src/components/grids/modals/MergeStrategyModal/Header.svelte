<script context="module" lang="ts">
  export const defaultTitle =
    "The upstream has conflicts with your local changes";
  export const defaultSubtitle =
    "You can choose one of the following options for resolving conflicts:";
</script>

<script lang="ts">
  import icon from "./icon.svg?raw";
  export let title = defaultTitle;
  export let subtitle = defaultSubtitle;
  export let className = "";
</script>

<!-- Header -->
<div class={"header-wrapper flex flex-row gap-4 mb-2 " + className}>
  <div class="icon-wrapper">
    {@html icon}
  </div>
  <div class="flex-1 flex-col title-wrapper">
    <h1 class="title">{title || defaultTitle}</h1>
    <h2 class="subtitle">{subtitle || defaultSubtitle}</h2>
  </div>
</div>

<style lang="postcss">
  .header-wrapper {
    padding: 16px 32px 12px 16px;
    align-items: flex-start;
  }
  .icon-wrapper {
    width: 36px;
    height: 36px;
    margin-top: 4px;
    align-items: stretch;
    justify-content: stretch;
    color: #737272;
  }
  .title-wrapper {
    padding-bottom: 12px;
    border-bottom: 1px solid rgb(226 232 240);
  }
  .title-wrapper .title {
    margin-bottom: 2px;
    font-weight: bold;
    font-size: 1em;
  }
  .title-wrapper .subtitle {
    font-size: 0.9em;
    color: #888;
  }
</style>
