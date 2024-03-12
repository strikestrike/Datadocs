import type {
  ConditionalFormattingIconSet,
  ConditionalFormattingIcons,
} from '../types/cell';

export const conditionalFormattingIconsList: Array<ConditionalFormattingIcons> =
  [
    {
      iconSet: '3-arrows-colored',
      icons: ['arrow-up', 'arrow-right', 'arrow-down'],
    },
    {
      iconSet: '3-traffic-lights',
      icons: ['green-light', 'yellow-light', 'red-light'],
    },
  ];

/**
 * Get conditional formatting icon depend on value and the icon set
 * Note: It is hardcoded at the moment, by comparing with 0
 * @param value
 * @param iconSet
 * @returns
 */
export function getConditionalFormattingIcon(
  value: any,
  iconSet: ConditionalFormattingIconSet,
) {
  const icons = conditionalFormattingIconsList.find(
    (icons) => icons.iconSet === iconSet,
  );

  const typeOfValue = typeof value;
  let isNumber = typeOfValue === 'number' || typeOfValue === 'bigint';
  if (typeof value === 'object' && value) {
    if (
      value.dataType === 'float' ||
      value.dataType === 'decimal' ||
      value.dataType === 'int'
    ) {
      const data = value.value;
      if (typeof data === 'number' || typeof data === 'bigint') {
        value = data;
      } else {
        value = data.a;
      }
      isNumber = true;
    } else {
      isNumber = false;
    }
  }
  if (!icons || !isNumber) return null;

  let iconImage = '';
  if (value > 0 || value > 0n) {
    iconImage = icons.icons[0];
  } else if (value === 0 || value === 0n) {
    iconImage = icons.icons[1];
  } else {
    iconImage = icons.icons[2];
  }

  return { iconSet: icons.iconSet, iconImage };
}
