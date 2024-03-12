<script lang="ts">
  import {
    LAYER_CONTAINER,
    LAYER_ITEM,
  } from "../../../../app/core/layers/layers-constants";
  // import { LAYER_TABGROUP } from "../../../../app/core/layers/layers-constants";
  // import { OBJECT_TYPE_IMAGE } from "../../../../layout/store/object/objects-constants";
  import type { Pane } from "src/layout/types/pane";
  import Icon from "../../../common/icons/Icon.svelte";
  import { graphConfig } from "../../Graph/Graph";
  import { imageConfig } from "../../Image/Image";
  import { spreadsheetConfig } from "../../SpreadSheet/SpreadSheet";

  export let layerType: string;
  export let pane: Pane;
</script>

<!-- {#if layerType === spreadsheetConfig.name}
  <Icon icon={"layer-item-spreadsheet"} size="17px" />
{:else  -->
{#if layerType === LAYER_ITEM}
  {#if pane?.content?.view?.name === spreadsheetConfig.name}
    <Icon icon={"layer-item-spreadsheet"} size="17px" />
  {:else if pane?.content?.view?.name === graphConfig.name}
    <Icon icon={"layer-item-chart"} size="17px" />
  {:else if pane?.content?.view?.name === imageConfig.name}
    <Icon icon={"layer-item-image"} size="17px" />
  {/if}
{:else if layerType === LAYER_CONTAINER}
  <Icon icon={"layer-item-container"} size="17px" />
{/if}
<!-- {:else if layerType === OBJECT_TYPE_IMAGE}
  <Icon icon={"layer-item-image"} size="17px" />
{:else if layerType === LAYER_ITEM}
  {#if true}
    <Icon icon={"layer-item-chart"} size="17px" />
  {/if} -->
