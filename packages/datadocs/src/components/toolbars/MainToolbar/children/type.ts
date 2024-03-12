import type { SvelteComponent } from "svelte";

type BaseSection = {
  name: string;
  hidden?: boolean;
};

export type ToolbarSectionInfo =
  | ToolbarSectionComponent
  | ToolbarSectionSubtoolbar;

export type ToolbarSectionComponent = BaseSection & {
  type: "component";
  width: number;
  visibility?: "when-docked" | "when-undocked";
  component: typeof SvelteComponent;
};

export type SubtoolbarMeta = {
  undocked: boolean;
  undockedPosition: { x: number; y: number };
};

export type ToolbarSectionSubtoolbar = BaseSection & {
  type: "subtoolbar";
  sections: ToolbarSectionComponent[];
  /**
   * When available, forces the subtoolbar to stay undocked and appear undocked
   * when it first becomes visible.
   */
  alwaysFloating?: {
    /**
     * A callback that returns the position that the subtoolbar should have when
     * it is always floating and becomes visible for the first time.
     * @param rect The current dimensions of the subtoolbar.
     * @returns The initial position.
     */
    getInitialPosition: (rect: DOMRect) => SubtoolbarMeta["undockedPosition"];
  };
  meta?: SubtoolbarMeta;
};
