import type {
  ComponentEvents,
  ComponentProps,
  ComponentType,
  SvelteComponent,
  SvelteComponentTyped,
} from "svelte";
import type { Readable } from "svelte/store";
export type { ComponentEvents, ComponentProps } from "svelte";

export type ComponentSlots<Component extends SvelteComponent> =
  Component extends SvelteComponentTyped<any, any, infer Slots> ? Slots : never;

export type StoreValue<T extends Readable<any>> = T extends Readable<
  infer ValueType
>
  ? ValueType
  : never;

export type HOCProps<Component extends SvelteComponentTyped> = {
  component: ComponentType<Component>;
  props?: ComponentProps<Component>;
  /**
   * @deprecated this property currently is not available
   * @see https://github.com/sveltejs/svelte/issues/5112
   */
  events?: ComponentEvents<Component>;
  /**
   * @deprecated this property currently is not available
   * @see https://github.com/sveltejs/svelte/issues/5112
   */
  slots?: ComponentSlots<Component>;
};
