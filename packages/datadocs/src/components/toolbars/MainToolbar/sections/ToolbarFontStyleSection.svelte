<script lang="ts">
  import ToolbarButton from "../buttons/ToolbarButton.svelte";
  import TextColorDropdown from "../dropdowns/TextColorDropdown.svelte";
  import ToolbarSplitButton from "../buttons/ToolbarSplitButton.svelte";
  import {
    changeBoldStyle,
    changeItalicStyle,
    changeStrikethroughStyle,
    changeTextColorValue,
    changeUnderlineStyle,
  } from "../../../../app/store/store-toolbar";
  import {
    isBoldStyle,
    isItalicStyle,
    isStrikethroughStyle,
    isUnderlineStyle,
    textColorValue,
  } from "../../../../app/store/writables";
  import {
    addStylePreviewWithKey,
    removeStylePreview,
    checkApplyEntireColumnWithKey,
    previewTextColor,
  } from "../../../../app//store/grid-style-preview";
  import { get } from "svelte/store";
  import { applyStyleProTipStore } from "../dropdowns/ApplyStyleProTip";

  function onBoldStyleMouseOver(event: MouseEvent) {
    const isBold = !get(isBoldStyle);
    addStylePreviewWithKey("static-style", { data: { isBold } });
  }

  async function onBoldStyleButtonClick(event: MouseEvent) {
    const isBold = !get(isBoldStyle);
    await changeBoldStyle(isBold, checkApplyEntireColumnWithKey());
    removeStylePreview();
  }

  function onItalicStyleMouseOver(event: MouseEvent) {
    const isItalic = !get(isItalicStyle);
    addStylePreviewWithKey("static-style", { data: { isItalic } });
  }

  async function onItalicStyleButtonClick(event: MouseEvent) {
    const isItalic = !get(isItalicStyle);
    await changeItalicStyle(isItalic, checkApplyEntireColumnWithKey());
    removeStylePreview();
  }

  function onStrikethroughStyleMouseOver(event: MouseEvent) {
    const isStrikethrough = !get(isStrikethroughStyle);
    addStylePreviewWithKey("static-style", { data: { isStrikethrough } });
  }

  async function onStrikethroughStyleButtonClick(event: MouseEvent) {
    const isStrikethrough = !get(isStrikethroughStyle);
    await changeStrikethroughStyle(
      isStrikethrough,
      checkApplyEntireColumnWithKey()
    );
    removeStylePreview();
  }

  function onUnderlineStyleMouseOver(event: MouseEvent) {
    const isUnderline = !get(isUnderlineStyle);
    addStylePreviewWithKey("static-style", { data: { isUnderline } });
  }

  async function onUnderlineStyleButtonClick(event: MouseEvent) {
    const isUnderline = !get(isUnderlineStyle);
    await changeUnderlineStyle(isUnderline, checkApplyEntireColumnWithKey());
    removeStylePreview();
  }

  function onPreviewTextColor() {
    previewTextColor(textColor.value);
  }

  function onMouseLeave() {
    removeStylePreview();
  }

  $: textColor = $textColorValue;
  $: showApplyStyleProTip = $applyStyleProTipStore;
</script>

<ToolbarButton
  active={$isBoldStyle}
  icon="bold"
  tooltip="Bold"
  {showApplyStyleProTip}
  on:click={onBoldStyleButtonClick}
  on:mouseover={onBoldStyleMouseOver}
  on:mouseleave={onMouseLeave}
/>

<ToolbarButton
  active={$isItalicStyle}
  icon="italic"
  tooltip="Italic"
  {showApplyStyleProTip}
  on:click={onItalicStyleButtonClick}
  on:mouseover={onItalicStyleMouseOver}
  on:mouseleave={onMouseLeave}
/>

<ToolbarButton
  active={$isStrikethroughStyle}
  icon="strikethrough"
  tooltip="Strikethrough"
  {showApplyStyleProTip}
  on:click={onStrikethroughStyleButtonClick}
  on:mouseover={onStrikethroughStyleMouseOver}
  on:mouseleave={onMouseLeave}
/>

<ToolbarButton
  active={$isUnderlineStyle}
  icon="underline"
  tooltip="Underline"
  {showApplyStyleProTip}
  on:click={onUnderlineStyleButtonClick}
  on:mouseover={onUnderlineStyleMouseOver}
  on:mouseleave={onMouseLeave}
/>

<ToolbarSplitButton
  icon="text-color"
  tooltip="Text color"
  indicatorColor={textColor.value}
  {showApplyStyleProTip}
  dropdownComponent={TextColorDropdown}
  on:click={() => changeTextColorValue(textColor.value)}
  on:mouseOverIconButton={onPreviewTextColor}
  on:mouseLeaveIconButton={onMouseLeave}
/>
