import type { LoadingIndicatorRenderer } from "@datadocs/canvas-datagrid-ng";

const loadingCss = (classname) => `
.${classname} {
  display:block;
  transform-origin: center;
  width: 100%;
  animation: datadocs-loading-spin 3s infinite cubic-bezier(.02,.85,.63,.99);
}
.${classname} svg{
  display:block;
  width: 100%;
}
@keyframes datadocs-loading-spin {
  from { transform: rotateZ(0); }
  to { transform: rotateZ(360deg); }
}
`;

const loadingSVG = `
<svg viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
<linearGradient id="paint3_linear_2841_58971" x1="17.575" y1="8.21689" x2="-2.22705" y2="2.98726" gradientUnits="userSpaceOnUse">
<stop stop-color="#00EFFF"/>
<stop offset="0.995" stop-color="#C418FF"/>
</linearGradient>
<linearGradient id="paint4_linear_2841_58971" x1="17.4336" y1="8.01174" x2="13.6071" y2="-2.37948" gradientUnits="userSpaceOnUse">
<stop stop-color="#00EFFF"/>
<stop offset="0.995" stop-color="#C418FF"/>
</linearGradient>
<linearGradient id="paint5_linear_2841_58971" x1="129.15" y1="25.3517" x2="109.348" y2="20.1221" gradientUnits="userSpaceOnUse">
<stop stop-color="#00EFFF"/>
<stop offset="0.995" stop-color="#C418FF"/>
</linearGradient>
<linearGradient id="paint6_linear_2841_58971" x1="129.057" y1="25.1507" x2="125.23" y2="14.7595" gradientUnits="userSpaceOnUse">
<stop stop-color="#00EFFF"/>
<stop offset="0.995" stop-color="#C418FF"/>
</linearGradient>
<g>
<path d="M21.2221 10.0259C21.6988 10.0259 22.0852 9.64167 22.0852 9.16773C22.0852 8.69378 21.6988 8.30957 21.2221 8.30957C20.7455 8.30957 20.3591 8.69378 20.3591 9.16773C20.3591 9.64167 20.7455 10.0259 21.2221 10.0259Z" fill="url(#paint3_linear_2841_58971)"/>
<path d="M19.8298 6.4827C18.1101 5.23147 16.0147 4.59675 13.8856 4.68218C11.7564 4.76761 9.71927 5.56813 8.10657 6.95307C8.01244 7.03587 7.93657 7.13714 7.88374 7.25053C7.83092 7.36392 7.80229 7.48696 7.79964 7.6119C7.79699 7.73683 7.8204 7.86097 7.86837 7.97647C7.91635 8.09197 7.98786 8.19634 8.0784 8.283C8.24244 8.42742 8.45257 8.50944 8.67159 8.51456C8.89062 8.51968 9.1044 8.44759 9.27508 8.31101C10.5722 7.19608 12.2095 6.54862 13.9224 6.4733C15.6353 6.39798 17.3237 6.89919 18.7148 7.89592C18.897 8.02558 19.119 8.08818 19.3426 8.07298C19.5662 8.05778 19.7775 7.96575 19.9403 7.81263C20.0261 7.72056 20.0917 7.61174 20.1329 7.49309C20.1741 7.37444 20.19 7.24855 20.1796 7.12345C20.1692 6.99835 20.1328 6.87678 20.0725 6.76646C20.0123 6.65615 19.9296 6.55952 19.8298 6.4827V6.4827Z" fill="url(#paint4_linear_2841_58971)"/>
</g>
<g >
<path d="M7.24351 19.717C7.72014 19.717 8.10653 19.3328 8.10653 18.8589C8.10653 18.3849 7.72014 18.0007 7.24351 18.0007C6.76688 18.0007 6.38049 18.3849 6.38049 18.8589C6.38049 19.3328 6.76688 19.717 7.24351 19.717Z" fill="url(#paint5_linear_2841_58971)"/>
<path d="M8.63586 21.5453C10.3555 22.7966 12.4509 23.4312 14.5801 23.3458C16.7092 23.2604 18.7464 22.4599 20.3591 21.0749C20.4532 20.9921 20.5291 20.8909 20.5819 20.7775C20.6347 20.6641 20.6634 20.541 20.666 20.4161C20.6687 20.2912 20.6453 20.167 20.5973 20.0515C20.5493 19.936 20.4778 19.8317 20.3873 19.745V19.745C20.2232 19.6006 20.0131 19.5186 19.7941 19.5134C19.5751 19.5083 19.3613 19.5804 19.1906 19.717C17.8934 20.8319 16.2561 21.4794 14.5432 21.5547C12.8303 21.63 11.1419 21.1288 9.75089 20.1321C9.56857 20.0025 9.34666 19.94 9.1231 19.9552C8.89955 19.9704 8.68825 20.0624 8.52535 20.2154V20.2154C8.43955 20.3074 8.37396 20.4163 8.33276 20.5349C8.29156 20.6536 8.27565 20.7794 8.28605 20.9045C8.29644 21.0296 8.33291 21.1512 8.39314 21.2615C8.45336 21.3719 8.53603 21.4685 8.63586 21.5453V21.5453Z" fill="url(#paint6_linear_2841_58971)"/>
</g>
</svg>`;

export const loadingRenderer: LoadingIndicatorRenderer = (grid) => {
  const style = grid.style;
  const loadingClassName = `datagrid-loading`;
  const wrapperDiv = document.createElement("div");
  wrapperDiv.className = `${loadingClassName}-w`;
  wrapperDiv.style.display = "block";
  wrapperDiv.style.width = style.loadingIndicatorWidth + "px";

  const css = document.createElement("style");
  css.textContent = loadingCss(loadingClassName);

  const loadingDiv = document.createElement("div");
  loadingDiv.className = loadingClassName;
  loadingDiv.innerHTML = loadingSVG;

  wrapperDiv.appendChild(css);
  wrapperDiv.appendChild(loadingDiv);

  return {
    element: wrapperDiv,
    onResize: (overlay, pixelsBounds, gridApi) => {
      const targetStyle = overlay.element.style;
      targetStyle.zIndex = gridApi.getZIndex("loading");

      const width = gridApi.style.loadingIndicatorWidth;
      targetStyle.left = Math.floor((pixelsBounds.width - width) * 0.5) + "px";
      targetStyle.top = Math.floor((pixelsBounds.height - width) * 0.5) + "px";
    },
  };
};
