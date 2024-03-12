<script lang="ts">
  import type { ComponentType } from "svelte";
  import { bind } from "../../common/modal";
  import { convertDataTypeToDisplayName } from "./utils";
  import SimpleType from "./children/SimpleType.svelte";
  import StructType from "./children/StructType.svelte";
  import type { CellDetailTypeData } from "@datadocs/canvas-datagrid-ng";

  export let dataType: CellDetailTypeData;

  let component: ComponentType = null;

  if (typeof dataType === "string") {
    switch (dataType) {
      case "int":
      case "float":
      case "decimal": {
        component = bind(SimpleType, {
          content: "Number",
          hint: convertDataTypeToDisplayName(dataType),
        });
        break;
      }
      default: {
        component = bind(SimpleType, {
          content: convertDataTypeToDisplayName(dataType),
        });
      }
    }
  } else {
    component = bind(StructType, { dataType });
  }
</script>

{#if component}
  <svelte:component this={component} />
{/if}
