<script lang="ts">
  import type { ColumnType } from "@datadocs/canvas-datagrid-ng";
  import Icon from "../../../common/icons/Icon.svelte";
  import { columnTypeToShortFormString } from "@datadocs/canvas-datagrid-ng/lib/utils/column-types";
  import { getDataTypeIcon } from "../../../common/icons/utils";

  export let columnType: ColumnType;

  let icon = getIcon();
  $: columnType, (icon = getIcon());

  function getIcon() {
    return getDataTypeIcon(columnTypeToShortFormString(columnType));
  }
</script>

<Icon {icon} width="30px" height="15px" />
