import type { ComponentConstructorOptions, SvelteComponentTyped } from "svelte";

/**
 * Wrap a Svelte component to later construct it without its required props.
 * @param Component The class instance of the component.
 * @param props The required properties of that component.
 * @returns The new constructor that feeds the required props when the component
 *  is initialized.  You can override the previously provided properties by
 *  including them in the `options.props` property.
 */
export function bind<
  Props extends Record<string, any>,
  ComponentType extends SvelteComponentTyped<Props>,
  Options extends ComponentConstructorOptions<Partial<Props>>
>(
  Component: new (options: ComponentConstructorOptions<Props>) => ComponentType,
  props: Props = {} as Props
) {
  return function ModalComponent(options: Options) {
    return new Component({
      ...options,
      props: {
        ...props,
        ...options.props,
      },
    });
  } as unknown as new (options: Options) => ComponentType;
}
