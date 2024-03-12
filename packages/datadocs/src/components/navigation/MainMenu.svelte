<script lang="ts">
  import MenuLeft from "../top-menu/MenuLeft.svelte";
  import WorkbookHeader from "../top-menu/WorkbookHeader.svelte";
  import MenuRight from "../top-menu/MenuRight.svelte";
  import DatadocsLogo from "../common/logos/DatadocsLogo.svelte";
  import checkMobileDevice from "../common/is-mobile";

  const isMobile = checkMobileDevice();
</script>

{#if !isMobile}
  <div
    class="flex flex-row w-full h-full items-center overflow-hidden ml-[73px]"
    style="width: calc(100% - 73px);"
  >
    <div class="main-menu">
      <MenuLeft />

      <WorkbookHeader />

      <MenuRight />
    </div>
  </div>
{:else}
  <div class="flex flex-row w-full h-full items-center overflow-hidden">
    <div class="main-menu">
      <div class="flex flex-row items-center flex-grow-0 flex-shrink-0 ml-3">
        <DatadocsLogo isMobileLogo={true} width="24px" height="24px" />
      </div>

      <WorkbookHeader isMobile />

      <MenuRight isMobile />
    </div>
  </div>
{/if}

<!-- <script lang="ts">
  import MenuList from "../top-menu/MenuList.svelte";
  import QuickActions from "../top-menu/QuickActions.svelte";
  import Logo from "../logo/Logo.svelte";
  import Divider from "../divider/Divider.svelte";
  import ProfileMenu from "../top-menu/ProfileMenu.svelte";
</script>

TODO:
Styling
Responsive expansion (expand towards where there is space)
Responsive hiding - I guess just move nesting one-level deeper (single top-level button with all the menus)
Tie in an action with each item -> Route navigation or function?

Is there a different format of the design? Sketch or Figma would work much better.

<nav
  class="main-menu px-4 bg-white flex flex-row justify-between items-center w-full"
>
  <MenuList
    label={"File"}
    items={[
      {
        label: "Test",
        children: [
          { label: "Test 2", group: "first" },
          { label: "Test 3", group: "first" },
          { label: "Test 5", group: "second" },
          { label: "Test 6", group: "second" },
        ],
      },
      { label: "Test 4" },
    ]}
  />

  <Logo />

  <div>
    <QuickActions />
    <Divider orientation="vertical" />
    <ProfileMenu />
  </div>
</nav>-->
<style lang="postcss">
  /* .main-menu {
    height: 48px;
  } */
  .main-menu {
    @apply w-full h-full;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
  }
</style>
