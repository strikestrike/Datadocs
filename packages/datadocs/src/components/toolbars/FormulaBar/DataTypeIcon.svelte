<script lang="ts">
  import type { ComponentType } from "svelte";
  import Icon from "../../common/icons/Icon.svelte";
  import { getDataTypeIcon } from "../../common/icons/utils";
  import tooltipAction from "../../common/tooltip";
  import { bindComponent } from "../../../utils/bindComponent";
  import TypeMenu from "../../grids/type-menu/TypeMenu.svelte";
  import {
    selectedCellDatatype,
    activeCellTypeData,
  } from "../../../app/store/writables";

  let tootlipContentComponent: ComponentType = null;

  $: dataType = $selectedCellDatatype;
  $: icon = getDataTypeIcon(dataType);
  $: tooltipData = $activeCellTypeData;
  $: if (tooltipData) {
    tootlipContentComponent = bindComponent(TypeMenu, { dataType: tooltipData });
  }
</script>

<div
  class="w-[34px] h-[18px]"
  use:tooltipAction={{ contentComponent: tootlipContentComponent }}
>
  <Icon {icon} width="34px" height="18px" />
</div>
