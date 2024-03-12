import type { CustomMenuItemType } from "./type";
import { bindComponent } from "../../../../utils/bindComponent";
import CustomMenuItem from "./CustomMenuItem.svelte";
import MenuItemWithPostTickSign from "./MenuItemWithPostTickSign.svelte";

export function getCustomMenuItem(item: CustomMenuItemType) {
  return bindComponent(CustomMenuItem, { item });
}

export function getMenuItemWithPostTickSign(
  label: string,
  prefixIcon: string = null,
  hasTickSign = false,
  styleClass = "min-w-[240px]"
) {
  return bindComponent(MenuItemWithPostTickSign, {
    label,
    prefixIcon,
    hasTickSign,
    styleClass,
  });
}
