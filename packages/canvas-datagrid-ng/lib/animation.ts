export type EasingFunction = (t: number) => number;

export class GridEasingFunctions {
  linear: EasingFunction = (t) => {
    return t;
  };
  easeInQuad: EasingFunction = (t) => {
    return t * t;
  };
  easeOutQuad: EasingFunction = (t) => {
    return t * (2 - t);
  };
  easeInOutQuad: EasingFunction = (t) => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  };
  easeInCubic: EasingFunction = (t) => {
    return t * t * t;
  };
  easeOutCubic: EasingFunction = (t) => {
    return --t * t * t + 1;
  };
  easeInOutCubic: EasingFunction = (t) => {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  };
  easeInQuart: EasingFunction = (t) => {
    return t * t * t * t;
  };
  easeOutQuart: EasingFunction = (t) => {
    return 1 - --t * t * t * t;
  };
  easeInOutQuart: EasingFunction = (t) => {
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
  };
  easeInQuint: EasingFunction = (t) => {
    return t * t * t * t * t;
  };
  easeOutQuint: EasingFunction = (t) => {
    return 1 + --t * t * t * t * t;
  };
  easeInOutQuint: EasingFunction = (t) => {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
  };
}
