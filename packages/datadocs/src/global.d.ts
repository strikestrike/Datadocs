import type { SvelteComponent } from "svelte";

import "vite/client";

declare module "*.svelte" {
  const component: SvelteComponent;
  export default component;
}
