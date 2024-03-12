<script context="module" lang="ts">
  export const defaultTitle =
    "The upstream has conflicts with your local changes";
  export const defaultSubtitle =
    "You can choose one of the following options for resolving conflicts:";
</script>

<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";

  import { useToggle } from "../../../../utils/svelte-writable";
  import { TabIndexManager } from "../../../../utils/tab-index";
  import { DropdownWrapper } from "../../../common/dropdown";
  import Button from "../../../common/form/Button.svelte";
  import Checkbox from "../../../common/form/Checkbox.svelte";
  import Icon from "../../../common/icons/Icon.svelte";
  import Dropdown from "./Dropdown.svelte";
  import type {
    WrappedMergeStrategyModalResult} from "./types";
import {
  MergeStrategyModalResult
} from "./types";

  let className = "";
  export { className as class };

  const [rem, toggleRem] = useToggle(true);
  const [showDropdown, toggleDropdown] = useToggle();

  let wrapperElement: HTMLDivElement;
  const tabIndexes = new TabIndexManager(true);

  const dispatcher = createEventDispatcher<{
    change: WrappedMergeStrategyModalResult;
  }>();
  const dispatchChangeEvent = (choice: MergeStrategyModalResult) =>
    dispatcher("change", { choice, remember: $rem });

  // function forwardEvent(ev: CustomEvent) {
  //   dispatcher(ev.type as any, ev.detail);
  // }

  onMount(() => {
    tabIndexes.onMount(wrapperElement.querySelectorAll(".focusable"));
  });
</script>

<!-- Header -->
<div
  bind:this={wrapperElement}
  class={"choice-wrapper flex flex-row gap-4 mb-2 " + className}
>
  <div class="left-side-padding" />
  <div class="flex-1 flex-col buttons-wrapper gap-4">
    <DropdownWrapper autoWidth class="flex-1 flex-row" show={$showDropdown}>
      <Button
        slot="button"
        class="flex-1 flex-row"
        align="start"
        color="primary"
        on:click={toggleDropdown}
        on:keydown={(ev) => {
          tabIndexes.onKeyDown(ev);
          if (ev.key === "Enter") toggleDropdown();
        }}
        on:keyup={tabIndexes.onKeyUp}
      >
        <span style="margin-right: auto">Resolve conflicts automatically</span>
        <Icon icon="toolbar-arrow-dropdown" width="8px" />
      </Button>
      <Dropdown
        on:change={(ev) => dispatchChangeEvent(ev.detail.optionValue)}
        slot="content"
      />
    </DropdownWrapper>
    <div class="separator" />
    <Button
      tabIndex="-1"
      align="start"
      color="light-warn"
      on:click={() =>
        dispatchChangeEvent(MergeStrategyModalResult.drop_local_changes)}
      on:keydown={tabIndexes.onKeyDown}
      on:keyup={tabIndexes.onKeyUp}>Drop all local changes</Button
    >
    <Button
      align="start"
      color="teal"
      on:click={() =>
        dispatchChangeEvent(MergeStrategyModalResult.fork_local_changes)}
      on:keydown={tabIndexes.onKeyDown}
      on:keyup={tabIndexes.onKeyUp}>Fork all local changes</Button
    >
    <div class="separator" />
    <Button
      align="start"
      color="secondary"
      on:click={() =>
        dispatchChangeEvent(MergeStrategyModalResult.merge_manually)}
      on:keydown={tabIndexes.onKeyDown}
      on:keyup={tabIndexes.onKeyUp}>Resolve conflicts manually</Button
    >
    <div class="separator" />
    <Checkbox
      checked={$rem}
      on:checked={toggleRem}
      on:keydown={tabIndexes.onKeyDown}
      on:keyup={tabIndexes.onKeyUp}
      name="remember"
      label="Remember my choice for this document"
    />
  </div>
</div>

<style lang="postcss">
  .choice-wrapper {
    padding: 0 32px 12px 16px;
  }
  .left-side-padding {
    width: 36px;
    height: 36px;
  }

  .buttons-wrapper {
    display: flex;
    align-items: stretch;
    padding-right: 32px;
  }
  .buttons-wrapper .button {
    text-align: left;
  }
  .buttons-wrapper .separator {
    border-bottom: 1px solid rgb(231 229 228);
  }
</style>
