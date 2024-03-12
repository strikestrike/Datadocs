/*
 * @Author: lainlee
 * @Date: 2023-08-07 15:16:06
 * @Description:
 */
import { writable } from "svelte/store";

export const phantom = writable<HTMLElement | null>(null);

export const phantomGlobal = writable<HTMLElement | null>(null);

let phantomCache: HTMLElement | null = null;

phantom.subscribe((val) => {
  if (val && phantomCache && val.id && val.id === phantomCache.id) {
    phantomCache.style.top = val.style.top;
    phantomCache.style.left = val.style.left;
    return;
  }
  if (phantomCache) {
    document.body.removeChild(phantomCache);
    phantomCache = null;
  }
  if (val) {
    phantomCache = val.cloneNode(true) as HTMLElement;
    phantomCache.style.position = "fixed";
    phantomCache.style.zIndex = "9999";
    phantomCache.style.pointerEvents = "none";
    phantomCache.style.visibility = "visible";
    document.body.appendChild(phantomCache);
    // remove all pointer events
    phantomCache.style.pointerEvents = "none";
    const childElements = phantomCache.querySelectorAll("*");
    childElements.forEach((element: HTMLElement) => {
      element.style.pointerEvents = "none";
    });
  }
});
