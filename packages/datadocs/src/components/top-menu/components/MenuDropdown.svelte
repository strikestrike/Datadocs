<script lang="ts">
  import { Menu } from "../../common/menu";
  import type { MenuItemType } from "../../common/menu";

  export let data: MenuItemType[];
  export let menuClass: string;
</script>

<Menu {data} {menuClass} isRoot isContextMenu={false} />
