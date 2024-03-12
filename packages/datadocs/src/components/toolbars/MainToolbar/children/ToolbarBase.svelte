<script lang="ts">
  import type { ToolbarSectionComponent, ToolbarSectionInfo } from "./type";
  import { onMount, setContext } from "svelte";
  import ToolbarButton from "../buttons/ToolbarButton.svelte";
  import { DropdownWrapper } from "../../../common/dropdown";
  import Section from "./toolbar/Section.svelte";
  import {
    MIME_TYPE_APP_TOOLBAR_DND,
    MIME_TYPE_APP_TOOLBAR_DND_UNDOCKABLE,
    TRIGGER_TOOLBAR_UPDATE_CONTEXT_NAME,
  } from "./ToolbarBase";

  setContext(TRIGGER_TOOLBAR_UPDATE_CONTEXT_NAME, triggerToolbarUpdate);

  export let toolbarSections: ToolbarSectionInfo[];

  let toolbarElement: HTMLElement;
  let moreDropdownActive: boolean = false;
  let showMoreButtonSection: boolean = false;
  let moreButtonDropdownWidth: number = 0;

  let sectionStatus: Record<string, boolean> = {};
  let isDropTarget = false;

  $: toolbarSections, updateToolbar();

  const TOOLBAR_SEPARATOR_WIDTH = 15;
  const TOOLBAR_MORE_BUTTON_WIDTH = 26;
  const MORE_BUTTON_DROPDOWN_PADDING_X = 8;

  function onEachComponent(
    sections: ToolbarSectionInfo[],
    callback: (section: ToolbarSectionComponent, index: number) => any
  ) {
    let i = 0;
    for (const section of sections) {
      if (section.hidden) continue;
      if (section.type === "component") {
        callback(section, i++);
      } else if (section.type === "subtoolbar") {
        if (section.meta?.undocked) continue;
        for (const subsection of section.sections) {
          callback(subsection, i++);
        }
      }
    }
    return i;
  }

  function updateToolbar() {
    if (!toolbarElement) return;
    const toolbarWidth = toolbarElement.getBoundingClientRect().width;

    let sectionsWidth = 0;
    const sectionsCount = onEachComponent(toolbarSections, (section) => {
      sectionsWidth += section.width;
      sectionStatus[section.name] = true;
    });

    const totalSectionWidth =
      sectionsWidth + (sectionsCount - 1) * TOOLBAR_SEPARATOR_WIDTH;
    moreButtonDropdownWidth = 0;

    if (toolbarWidth < totalSectionWidth) {
      let currentWidth = TOOLBAR_MORE_BUTTON_WIDTH;

      onEachComponent(toolbarSections, (section) => {
        currentWidth += section.width + TOOLBAR_SEPARATOR_WIDTH;
        sectionStatus[section.name] = currentWidth <= toolbarWidth;

        if (currentWidth > toolbarWidth) {
          if (moreButtonDropdownWidth > 0) {
            moreButtonDropdownWidth += TOOLBAR_SEPARATOR_WIDTH;
          }
          moreButtonDropdownWidth += section.width;
        }
      });
      moreButtonDropdownWidth += MORE_BUTTON_DROPDOWN_PADDING_X * 2;
    }

    showMoreButtonSection = moreButtonDropdownWidth > 0;
  }

  function handleResize() {
    updateToolbar();
  }

  onMount(() => {
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  function toggleDropdownActive() {
    moreDropdownActive = !moreDropdownActive;
  }

  function handleMoreButtonMouseDown() {
    toggleDropdownActive();
  }

  function triggerToolbarUpdate() {
    toolbarSections = toolbarSections;
    moreDropdownActive = false;
  }

  $: if (!showMoreButtonSection) {
    moreDropdownActive = false;
  }

  function onDragEnter(e: DragEvent) {
    const subtoolbar = e.dataTransfer.types.indexOf(MIME_TYPE_APP_TOOLBAR_DND);
    const subtoolbarUndockable = e.dataTransfer.types.indexOf(
      MIME_TYPE_APP_TOOLBAR_DND_UNDOCKABLE
    );
    if (subtoolbar === -1 || subtoolbarUndockable !== -1) return;
    isDropTarget = true;
    e.preventDefault();
  }

  function onDragOver(e: DragEvent) {
    if (!isDropTarget) return;
    e.preventDefault();
  }

  async function onDragLeave(e: DragEvent) {
    if (
      !isDropTarget ||
      (e.currentTarget instanceof Node &&
        e.relatedTarget instanceof Node &&
        e.currentTarget.contains(e.relatedTarget))
    ) {
      return;
    }
    isDropTarget = false;
    e.preventDefault();
  }

  function onDrop(e: DragEvent) {
    isDropTarget = false;
    const subtoolbar = e.dataTransfer.getData(MIME_TYPE_APP_TOOLBAR_DND);
    if (!subtoolbar) return false;
    const section = toolbarSections.find(
      (section) => subtoolbar === section.name
    );

    if (!section || section.type !== "subtoolbar" || !section.meta?.undocked) {
      return;
    }

    section.meta.undocked = false;
    triggerToolbarUpdate();
  }

  onMount(() => {
    updateToolbar();
  });
</script>

<div
  bind:this={toolbarElement}
  class="toolbar max-w-full w-full flex flex-row items-center select-none"
  on:dragenter={onDragEnter}
  on:dragover={onDragOver}
  on:dragleave={onDragLeave}
  on:drop={onDrop}
  class:drop-target={isDropTarget}
>
  {#each toolbarSections as section, index}
    <Section
      bind:section
      {sectionStatus}
      isLast={index >= toolbarSections.length - 1}
    />
  {/each}

  {#if showMoreButtonSection}
    <div class="h-full flex items-center justify-center">
      <DropdownWrapper
        alignment="right"
        closeOnMouseDownOutside={false}
        closeOnEscapeKey={true}
        width={moreButtonDropdownWidth}
        isMoreButtonDropdown
        distanceToDropdown={11}
        bind:show={moreDropdownActive}
      >
        <div on:mousedown={handleMoreButtonMouseDown} slot="button">
          <ToolbarButton
            icon="toolbar-more"
            tooltip="More"
            disabledTooltipOnActive
            active={moreDropdownActive}
          />
        </div>

        <div
          slot="content"
          class="flex items-center bg-white flex-wrap rounded default-dropdown-box-shadow overflow-hidden"
        >
          <div
            class="flex items-center bg-white flex-wrap z-20"
            style="padding: 5px {MORE_BUTTON_DROPDOWN_PADDING_X}px"
          >
            {#each toolbarSections as section, index}
              <Section
                bind:section
                {sectionStatus}
                isLast={index >= toolbarSections.length - 1}
                hiddenSection
              />
            {/each}
          </div>
        </div>
      </DropdownWrapper>
    </div>
  {/if}
</div>

<style lang="postcss">
  .toolbar.drop-target {
    opacity: 0.5;
  }
</style>
