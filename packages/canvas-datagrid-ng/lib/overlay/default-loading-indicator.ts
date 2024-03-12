import type { OverlayDescriptor } from '../types/overlay';
import type { defaultGridStyles } from '../style/default-styles';

export const defaultLoadingResizer: OverlayDescriptor['onResize'] = (
  overlay,
  pixelsBounds,
  gridApi,
) => {
  const targetStyle = overlay.element.style;
  targetStyle.zIndex = gridApi.getZIndex('loading');

  const width = gridApi.style.loadingIndicatorWidth;
  targetStyle.left = Math.floor((pixelsBounds.width - width) * 0.5) + 'px';
  targetStyle.top = Math.floor((pixelsBounds.height - width) * 0.5) + 'px';
};

export function getDefaultLoadingIndicator(
  gridStyle: typeof defaultGridStyles,
) {
  const loadingClassName = `datagrid-default-loading`;

  const width = gridStyle.loadingIndicatorWidth;
  const halfWidth = Math.floor(width * 0.5);
  const pending = Math.floor(halfWidth * 0.075);
  const barHeight = Math.floor(halfWidth * 0.45);

  const wrapperDiv = document.createElement('div');
  wrapperDiv.className = `${loadingClassName}-w`;
  wrapperDiv.style.display = 'block';

  const css = document.createElement('style');
  css.textContent = `
.${loadingClassName} {
  color: ${gridStyle.loadingIndicatorColor};
  display: inline-block;
  position: relative;
  width: ${width}px;
  height: ${width}px;
}
.${loadingClassName} div {
  transform-origin: ${halfWidth}px ${halfWidth}px;
  animation: ${loadingClassName} 1.2s linear infinite;
}
.${loadingClassName} div:after {
  content: " ";
  display: block;
  position: absolute;
  top: ${pending}px;
  left: ${halfWidth - pending}px;
  width: ${pending * 2}px;
  height: ${barHeight}px;
  border-radius: 20%;
  background: ${gridStyle.loadingIndicatorColor};
}
.${loadingClassName} div:nth-child(1) {
  transform: rotate(0deg);
  animation-delay: -1.1s;
}
.${loadingClassName} div:nth-child(2) {
  transform: rotate(30deg);
  animation-delay: -1s;
}
.${loadingClassName} div:nth-child(3) {
  transform: rotate(60deg);
  animation-delay: -0.9s;
}
.${loadingClassName} div:nth-child(4) {
  transform: rotate(90deg);
  animation-delay: -0.8s;
}
.${loadingClassName} div:nth-child(5) {
  transform: rotate(120deg);
  animation-delay: -0.7s;
}
.${loadingClassName} div:nth-child(6) {
  transform: rotate(150deg);
  animation-delay: -0.6s;
}
.${loadingClassName} div:nth-child(7) {
  transform: rotate(180deg);
  animation-delay: -0.5s;
}
.${loadingClassName} div:nth-child(8) {
  transform: rotate(210deg);
  animation-delay: -0.4s;
}
.${loadingClassName} div:nth-child(9) {
  transform: rotate(240deg);
  animation-delay: -0.3s;
}
.${loadingClassName} div:nth-child(10) {
  transform: rotate(270deg);
  animation-delay: -0.2s;
}
.${loadingClassName} div:nth-child(11) {
  transform: rotate(300deg);
  animation-delay: -0.1s;
}
.${loadingClassName} div:nth-child(12) {
  transform: rotate(330deg);
  animation-delay: 0s;
}
@keyframes ${loadingClassName} {
  0% { opacity: 1; }
  100% { opacity: 0; }
}
`;

  const loadingDiv = document.createElement('div');
  loadingDiv.className = loadingClassName;
  loadingDiv.innerHTML = new Array(12).fill('<div></div>').join('');

  wrapperDiv.appendChild(css);
  wrapperDiv.appendChild(loadingDiv);
  return wrapperDiv;
}
