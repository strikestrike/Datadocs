type ScaleUpType = {
  delay?: number;
  duration: number;
  from?: number;
};

export function scaleUp(node: HTMLElement, options: ScaleUpType) {
  const getCurrentScale = (t: number) => from + (1 - from) * t;
  const delay = options.delay ?? 0;
  let from = options.from ?? 1;
  from = from > 0 && from <= 1 ? from : 1;

  return {
    delay,
    duration: options.duration,
    css: (t: number) => {
      return `
        transform: scale(${getCurrentScale(t)}, ${getCurrentScale(t)});
      `;
    },
  };
}
