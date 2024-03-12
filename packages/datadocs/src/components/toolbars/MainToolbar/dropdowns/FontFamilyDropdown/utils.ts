import type { FontFamilyDataItem } from "../default";

const MAX_N_RECENTLY_USED_FONTS = 5;

export const FONT_FAMILY_MENU_CLASSNAME = "font-family-menu";
export const FONT_FAMILY_MENU_LIST_CLASSNAME = "font-family-menu-list";
export const MOUSE_ON_FONT_FAMILY_DROPDOWN_CONTEXT_NAME =
  "Toolbar:FontFamilyDropdown:mouseOnRootDropdown";
export const MOUSE_OVER_TARGET_CONTEXT_NAME =
  "Toolbar:FontFamilyDropdown:mouseOverTarget";
export const SELECT_FONT_FAMILY_CONTEXT_NAME =
  "Toolbar:FontFamilyDropdown:handleSelectItem";

export function isValueInFontFamilyItem(
  fontFamilyItem: FontFamilyDataItem,
  value: string
): boolean {
  function isInside(fontFamilyItem: FontFamilyDataItem, value: string) {
    if (fontFamilyItem.type === "font") {
      return fontFamilyItem.value === value ? true : false;
    } else {
      const items = fontFamilyItem.fonts;

      for (const item of items) {
        if (isInside(item, value)) {
          return true;
        }
      }

      return false;
    }
  }

  return isInside(fontFamilyItem, value);
}

function getFontFamilyItemIndex(
  items: FontFamilyDataItem[],
  value: string
): number {
  let index = -1;

  for (let i = 0; i < items.length; i++) {
    if (isValueInFontFamilyItem(items[i], value)) {
      index = i;
      break;
    }
  }

  return index;
}

export function getNewRecentlyUsedFontFamily(
  recentlyUsedFonts: FontFamilyDataItem[],
  fonts: FontFamilyDataItem[],
  value: string
): FontFamilyDataItem[] {
  let newRecentlyUsedFonts: FontFamilyDataItem[] = [];
  const itemIndex = getFontFamilyItemIndex(recentlyUsedFonts, value);

  if (itemIndex !== -1) {
    newRecentlyUsedFonts[0] = recentlyUsedFonts[itemIndex];

    for (let i = 0; i < recentlyUsedFonts.length; i++) {
      if (i !== itemIndex) {
        newRecentlyUsedFonts.push(recentlyUsedFonts[i]);
      }
    }
  } else {
    const index = getFontFamilyItemIndex(fonts, value);

    if (index === -1) {
      newRecentlyUsedFonts = [...recentlyUsedFonts];
    } else {
      if (recentlyUsedFonts.length < MAX_N_RECENTLY_USED_FONTS) {
        newRecentlyUsedFonts = [fonts[index], ...recentlyUsedFonts];
      } else {
        newRecentlyUsedFonts = [
          fonts[index],
          ...recentlyUsedFonts.splice(0, MAX_N_RECENTLY_USED_FONTS - 1),
        ];
      }
    }
  }

  return newRecentlyUsedFonts;
}
