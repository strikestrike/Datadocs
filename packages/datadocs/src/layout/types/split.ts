import type { Split } from "../enums/split";
import type { Pane } from "./pane";

export interface SplitData {
  id: Pane["id"];
  zIndex: number;
  level: SplitLevel;
}
export interface SplitLevel {
  [Split.NORTH_EDGE]: number;
  [Split.SOUTH_EDGE]: number;
  [Split.WEST_EDGE]: number;
  [Split.EAST_EDGE]: number;
}
