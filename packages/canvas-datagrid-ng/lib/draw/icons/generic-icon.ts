import { createSvgIconImage } from './utils';

const genericIcons = {
  layers: `
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 12.2785L1.75 8.19518L2.7125 7.46602L7 10.791L11.2875 7.46602L12.25 8.19518L7 12.2785ZM7 9.33268L1.75 5.24935L7 1.16602L12.25 5.24935L7 9.33268Z" fill="#6D777E"/>
    </svg>
  `,
  collapse: `
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.64352 3.24276C4.73842 3.1486 4.86711 3.0957 5.0013 3.0957C5.13549 3.0957 5.26419 3.1486 5.35909 3.24276L8.18596 6.04737C8.25686 6.11755 8.30518 6.20704 8.32481 6.30449C8.34445 6.40194 8.33451 6.50299 8.29626 6.59483C8.25801 6.68668 8.19316 6.7652 8.10993 6.82045C8.02669 6.8757 7.92881 6.90521 7.82868 6.90523H2.17494C2.07472 6.9054 1.9767 6.87604 1.89331 6.82087C1.80992 6.76569 1.74492 6.68718 1.70654 6.5953C1.66816 6.50341 1.65814 6.40228 1.67774 6.30474C1.69734 6.20719 1.74569 6.11761 1.81664 6.04737L4.64352 3.24276Z" fill="#A7B0B5"/>
    </svg>
  `,
  expand: `
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.36039 6.75724C5.26549 6.8514 5.13679 6.9043 5.0026 6.9043C4.86841 6.9043 4.73972 6.8514 4.64482 6.75724L1.81795 3.95263C1.74705 3.88245 1.69873 3.79296 1.67909 3.69551C1.65946 3.59806 1.6694 3.49701 1.70765 3.40517C1.7459 3.31332 1.81075 3.23481 1.89398 3.17955C1.97721 3.1243 2.07509 3.09479 2.17523 3.09477L7.82897 3.09477C7.92919 3.0946 8.02721 3.12396 8.1106 3.17913C8.19398 3.23431 8.25899 3.31282 8.29736 3.4047C8.33574 3.49659 8.34577 3.59772 8.32616 3.69526C8.30656 3.79281 8.25822 3.88239 8.18726 3.95263L5.36039 6.75724Z" fill="#A7B0B5"/>
    </svg>
  `,
};
const iconImageCache: Partial<Record<GenericIcon, HTMLImageElement>> = {};

type GenericIcon = keyof typeof genericIcons;

export function initGenericIconImages() {
  Object.keys(genericIcons).map(getGenericIcon);
}

export function getGenericIcon(name: GenericIcon): HTMLImageElement {
  let image = iconImageCache[name];
  if (image) return image;

  const svg = genericIcons[name];
  if (!svg) throw 'Unknown icon request: ' + name;

  image = createSvgIconImage(svg);
  iconImageCache[name] = image;

  return image;
}
