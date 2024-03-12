<script lang="ts">
  import MainMenu from "../navigation/MainMenu.svelte";
  import MainToolbar from "../toolbars/MainToolbar/MainToolbar.svelte";
  import FormulaBar from "../toolbars/FormulaBar/FormulaBar.svelte";
  import DatadocsLogo from "../common/logos/DatadocsLogo.svelte";
  import checkMobileDevice from "../common/is-mobile";

  const isMobile: boolean = checkMobileDevice();
</script>

<div class="header-container" class:mobile={isMobile}>
  <div class="top-main-menu">
    <MainMenu />
  </div>

  {#if !isMobile}
    <div class="toolbar">
      <div class="top-main-toolbar">
        <MainToolbar />
      </div>

      <div class="w-full h-0px m-0 p-0 border-b border-collapse border-width-0 border-bottom-width-1 border-radius-0 border-solid border-light-100"></div>

      <div class="formula-bar">
        <FormulaBar />
      </div>
    </div>
  {/if}

  <div class="header-logo">
    <div class="header-logo-bg"></div>
    <DatadocsLogo width="50px" height="50px" />
  </div>
</div>

<style lang="postcss">
  .header-container {
    @apply w-full h-full relative;
  }

  .top-main-menu {
    @apply w-full pb-1 relative;
    height: 26px;
  }

  .header-container.mobile .top-main-menu {
    @apply h-10 pb-0;
  }

  /* .header-container:not(.mobile) .top-main-menu::before {
    content: '';
    position: absolute;
    left: 0px;
    right: 0px;
    top: 0px;
    bottom: 0px;
    opacity: 0.6;
    pointer-events: none;
    background-image: url("/images/top-menu-background-image.svg");
    background-repeat: no-repeat;
    background-position: right top;
  } */

  .toolbar {
    @apply w-full;
    border-radius: 3px;
    /* using box shadow instead of filter */
    box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.5);
  }

  .top-main-toolbar {
    @apply w-full;
    height: 34px;
    border-bottom: 0 none;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-collapse: collapse;
  }

  .formula-bar {
    @apply flex flex-row items-center w-full h-6 px-3.5 py-0.5 bg-white;
    border-radius: 0px 0px 3px 3px;
    border-top: 0 none;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    border-collapse: collapse;
  }

  .header-logo {
    @apply absolute flex flex-row justify-start items-center;
    top: 2px;
    left: 13px;
  }

  .header-logo-bg {
    @apply absolute top-px left-px w-12 h-12 rounded-full bg-white;
  }

  .header-container.mobile .header-logo {
    /* this logo is not in mobile version */
    display: none;
  }
</style>
