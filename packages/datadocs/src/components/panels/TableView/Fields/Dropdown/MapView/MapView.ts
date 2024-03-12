import type {
  GeographyPoint,
  GeographyRectangle,
} from "@datadocs/canvas-datagrid-ng";
import type { Marker } from "leaflet";

declare global {
  interface Window {
    GOOGLE_MAPS_API_KEY: string;
  }
}

export type MapViewDistanceMode = {
  type: "distance";
  target: GeographyPoint;
  /**
   * Distance in meters.
   */
  distance: number;
};

export type MapViewRectMode = {
  type: "rect";
  targets: GeographyRectangle;
};

export type MapViewMode = MapViewDistanceMode | MapViewRectMode;

export type MapMarkerDragContext = {
  /**
   * The marker that is being dragged.
   */
  marker: Marker;
  /**
   * The coordinates of the corner opposite to the marker that is being dragged.
   */
  orbit: GeographyPoint;
  /**
   * The array index of the marker that is being dragged.
   */
  markerIndex: number;
  /**
   * The other 3 markers that needs updating excluding the marker that is being
   * dragged.
   */
  availableMarkers: Marker[];
};
