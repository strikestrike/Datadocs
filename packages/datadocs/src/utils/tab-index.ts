export class TabIndexManager {
  private elements: HTMLElement[] = [];
  private shift = false;
  private useArrow: boolean;
  constructor(useArrow = false) {
    this.useArrow = useArrow;
  }

  onMount = (
    elements: HTMLElement[] | NodeListOf<any>,
    initFocus: number | false = 0
  ) => {
    elements = Array.from(elements || []);
    this.elements = elements;
    if (typeof initFocus === "number") elements[initFocus]?.focus();
  };

  onKeyUp = (ev: KeyboardEvent) => {
    if (ev.key === "Shift") this.shift = false;
  };
  onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === "Shift") {
      this.shift = true;
      return;
    }
    if (this.useArrow && !this.shift) {
      if (ev.key === "ArrowDown") return this.navigate(ev, false);
      if (ev.key === "ArrowUp") return this.navigate(ev, true);
    }
    if (ev.key === "Tab") {
      this.navigate(ev, this.shift);
      return;
    }
  };
  navigate = (ev: Event, prev: boolean) => {
    const thisElement = ev.target as any;
    const currentIndex = this.elements.indexOf(thisElement);

    const nextElementIndex = prev
      ? (currentIndex <= 0 ? this.elements.length : currentIndex) - 1
      : (currentIndex + 1) % this.elements.length;

    const nextElement = this.elements[nextElementIndex];
    if (nextElement) {
      ev.preventDefault();
      ev.stopPropagation();
      nextElement.focus();
    }
  };
}
