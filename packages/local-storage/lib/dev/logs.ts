export class LogsWriter {
  constructor(private $root: HTMLElement) {
    $root.className += 'logs-container';
  }

  add(node: Node) {
    this.$root.appendChild(node);
  }

  addCode(code: string) {
    const node = el('pre', {}, el('code', {}, code));
    this.add(node);
  }

  addText(text: string, type?: 'e' | 'w') {
    if (type === 'e') console.error(text);
    else if (type === 'w') console.warn(text);
    else console.log(text);

    const node = el('div', { className: 'log-text ' + (type || '') });
    node.innerText = '[' + new Date().toLocaleString() + ']  ' + text;
    this.add(node);
  }
}

/**
 * @author hangxingliu
 * @license MIT
 */
function el<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  attrs?: Partial<Omit<HTMLElementTagNameMap[K], 'style'>> & {
    html?: string;
    style?: Partial<CSSStyleDeclaration>;
  },
  children?: any,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (attrs) {
    if (typeof attrs.html !== 'undefined') {
      element.innerHTML = attrs.html;
      delete attrs.html;
    }
    if (attrs.style) {
      const style: any = attrs.style;
      const target: any = element.style;
      delete attrs.style;
      Object.keys(style).forEach((key) => (target[key] = style[key]));
    }
    Object.assign(element, attrs);
  }

  if (children) {
    if (Array.isArray(children))
      children.forEach((child) => element.append(child));
    else if (typeof children === 'string') element.innerText = children;
    else element.append(children);
  }
  return element;
}
