<script lang="ts">
  import type { SvelteComponent } from "svelte";
  import ToolbarButton from "./ToolbarButton.svelte";

  export let active = false;
  export let icon = "";
  export let activeIcon: string = icon;
  export let iconSize = "20px";
  export let hasArrow = false; // is postfix arrow dropdown needed
  export let isDropdownChild = false;
  export let tooltip = "";
  export let disabledTooltipOnActive = false;
  export let indicatorColor = "";
  export let fillColor = "";
  export let dropdownComponent: typeof SvelteComponent = null;
  export let dropdownProps = {}; 
  export let disabled = false;
  export let dropdownIcon = "toolbar-arrow-dropdown";
  export let dropdownIconSize = "7px";
</script>

<ToolbarButton
  {active}
  {icon}
  {activeIcon}
  {iconSize}
  {hasArrow}
  {tooltip}
  {indicatorColor}
  {fillColor}
  {disabled}
  {disabledTooltipOnActive}
  on:click
/>

{#if dropdownComponent}
  <ToolbarButton
    {active}
    icon={dropdownIcon}
    {isDropdownChild}
    {tooltip}
    {disabledTooltipOnActive}
    {disabled}
    buttonHeight={iconSize}
    iconSize={dropdownIconSize}
    {dropdownComponent}
    {dropdownProps}
  />
{/if}
