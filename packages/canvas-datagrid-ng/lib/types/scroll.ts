import type { ScrollBarTarget } from './base';

export type ScrollContext = {
  /**
   * The pixel or the index that was set before the user started interacting
   * with the scrollbar.
   */
  left: number;
  /**
   * The pixel or the index that was set before the user started interacting
   * with the scrollbar.
   */
  top: number;
  /**
   * The scroll mode when the user first started interacting with the
   * scrollbar.  Note that this might change during the scrolling process if
   * the cursor goes on to the scrollbar thumb while the user is scrolling
   * using the tracks.
   */
  mode: ScrollBarTarget;
  /**
   * Whether the grid has already went into autoscrolling mode, so we don't need
   * to wait for the minimum threshold anymore, which is useful when we receive
   * a new event (e.g., mousemove) and should not stop autoscrolling unless the
   * cursor leaves the track.
   */
  autoScrolling?: boolean;
};
