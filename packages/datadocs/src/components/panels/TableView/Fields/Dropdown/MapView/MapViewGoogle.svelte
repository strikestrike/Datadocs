<script lang="ts">
  import { Loader } from "@googlemaps/js-api-loader";
  import { MarkerClusterer } from "@googlemaps/markerclusterer";
  import { createEventDispatcher } from "svelte";
  import MapToolbarGoogleTopRight from "./Google/MapToolbarGoogleTopRight.svelte";
  import MapToolbar from "./Google/MapToolbarTopBottomRight.svelte";
  import MapToolbarTopLeft from "./Google/MapToolbarTopLeft.svelte";
  import type { MapViewMode } from "./MapView";
  import {
    Geometry,
    GeometryCollection,
    LineString,
    MultiLineString,
    MultiPoint,
    MultiPolygon,
    Point,
    Polygon,
  } from "wkx";
  import { Buffer } from "buffer";
  import type { GeographyPoint } from "@datadocs/canvas-datagrid-ng";
  import { writable } from "svelte/store";

  const dispatch = createEventDispatcher<{ update: { mode: MapViewMode } }>();
  const loader = new Loader({
    apiKey:
      window.GOOGLE_MAPS_API_KEY ?? "AIzaSyDiaPHjBbvn2iAslTKn0Ixtt5RqFIMeCCw",
    libraries: ["drawing", "geometry", "marker", "places", "visualization"],
  });

  export let mode: MapViewMode;
  export let mapData: Uint8Array[];
  export let toggleMode: () => any;

  const modeStore = writable<MapViewMode>(mode);

  $: $modeStore = mode;

  const dataGeometryList: (google.maps.Polygon | google.maps.Polyline)[] = [];
  const dataMarkerList: google.maps.Marker[] = [];
  let dataMarkerClusterer: MarkerClusterer | undefined;
  $: updateDataMarkers(mapData);

  const eventListeners = {
    mapCenterChanged: () => {},
    mapClick: (e: google.maps.MapMouseEvent) => {
      if (mode.type === "distance") {
        props.distance.circle.setCenter(e.latLng);
      }
    },
    mapIdle: () => {
      if (mode.type !== "rect") return;
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      notify({
        type: "rect",
        targets: {
          ne: {
            lat: ne.lat(),
            lng: ne.lng(),
          },
          sw: {
            lat: sw.lat(),
            lng: sw.lng(),
          },
        },
      });
    },
    mapZoomChanged: () => {
      // In the distance mode we only update the markers when the center or
      // distance of the circle distance changes, so make sure we update
      // visibility of the shapes on zoom changes.
      if (mode.type === "distance") {
        updateDataMarkers(mapData);
      }
    },
    circleCenterChanged: () => {
      if (mode.type !== "distance") return;
      const { circle } = props.distance;
      const center = circle.getCenter();
      notify({
        type: "distance",
        target: { lat: center.lat(), lng: center.lng() },
        distance: circle.getRadius(),
      });
    },
  };

  let props: {
    distance: {
      circle: google.maps.Circle;
    };
    /* boundingBox: {
      rect: google.maps.Rectangle;
    }; */
  } = undefined;
  let map: google.maps.Map;
  let eventListenerHandles: google.maps.MapsEventListener[] = [];

  $: updateProps(mode);

  function googleMap(el: HTMLElement) {
    loader.load().then(() => {
      createMap(el);
    });
  }

  function createMap(el: HTMLElement) {
    map = new google.maps.Map(el, {
      center: { lat: 0, lng: 0 },
      zoom: 8,
      maxZoom: 18,
      disableDefaultUI: true,
      keyboardShortcuts: false,
    });

    const { TOP_LEFT, TOP_RIGHT, RIGHT_CENTER } = google.maps.ControlPosition;

    const topLeftContainer = document.createElement("div");
    const topLeftToolbar = new MapToolbarTopLeft({
      target: topLeftContainer,
      props: { map },
    });

    const topRightContainer = document.createElement("div");
    const topRightToolbar = new MapToolbarGoogleTopRight({
      target: topRightContainer,
      props: {
        map,
        modeStore,
        toggle() {
          toggleMode();
        },
      },
    });

    createPropsIfNeeded();
    updateProps(mode);
    updateDataMarkers(mapData);

    const bottomRightContainer = document.createElement("div");
    const bottomRightToolbar = new MapToolbar({
      target: bottomRightContainer,
      props: { map },
    });

    map.controls[TOP_LEFT].push(topLeftContainer);
    map.controls[TOP_RIGHT].push(topRightContainer);
    map.controls[RIGHT_CENTER].push(bottomRightContainer);

    return {
      destroy() {
        detachProps();
        topLeftToolbar.$destroy();
        topRightToolbar.$destroy();
        bottomRightToolbar.$destroy();
      },
    };
  }

  function createPropsIfNeeded() {
    if (props) return;
    props = {
      distance: {
        circle: new google.maps.Circle({
          editable: true,
          center: { lat: 0, lng: 0 },
          radius: 1e6,
          strokeColor: "#C418FF",
          strokeWeight: 1,
          fillColor: "#C418FF",
          fillOpacity: 0.1,
          zIndex: 100,
        }),
      },
      /* boundingBox: {
        rect: new google.maps.Rectangle({
          bounds: new google.maps.LatLngBounds(
            { lat: 0, lng: 0 },
            { lat: 20, lng: 20 }
          ),
          draggable: true,
          editable: true,
          strokeColor: "#C418FF",
          strokeWeight: 1,
          fillColor: "#C418FF",
          fillOpacity: 0.1,
        }),
      }, */
    };

    /* const { rect } = props.boundingBox; */
    addListeners();
  }

  function detachProps() {}

  function updateProps(mode: MapViewMode) {
    if (!map || !props) return;

    removeListeners();
    if (mode.type === "distance") {
      /* props.boundingBox.rect.setMap(null); */
      props.distance.circle.setMap(map);
    } else if (mode.type === "rect") {
      //props.boundingBox.rect.setMap(map);
      props.distance.circle.setMap(null);
    }

    if (mode.type === "distance") {
      const { circle } = props.distance;
      circle.setRadius(mode.distance);
      circle.setCenter(mode.target);
      map.fitBounds(circle.getBounds(), 20);
    } else if (mode.type === "rect") {
      /* const { rect } = props.boundingBox;
      rect.setBounds(
        new google.maps.LatLngBounds(mode.targets.sw, mode.targets.ne)
      );
      map.fitBounds(rect.getBounds(), 20); */
      const { sw, ne } = mode.targets;
      // Fit bounds has a problem where, even if you give the same bounds,
      // it zooms out and does so until the zoom level reaches 0. So, we
      // only update when the update is coming from outside the map. Note
      // that even when it still zooms out.
      map.panToBounds(new google.maps.LatLngBounds(sw, ne), );
    }
    addListeners();
  }

  function notify(mode: MapViewMode) {
    dispatch("update", { mode });
  }

  function getBoundsFromPoints(points: Point[]) {
    const bounds = new google.maps.LatLngBounds();
    const latlng: GeographyPoint = { lat: 0, lng: 0 };
    for (const point of points) {
      latlng.lat = point.y;
      latlng.lng = point.x;
      bounds.extend(latlng);
    }
    return bounds;
  }

  function determinePointsVisibility(points: Point[]) {
    const bounds = getBoundsFromPoints(points);
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    const proj = map.getProjection();
    const swPx = proj.fromLatLngToPoint(sw);
    const nePx = proj.fromLatLngToPoint(ne);
    const pixelWidth = Math.abs((nePx.x - swPx.x) * Math.pow(2, map.getZoom()));
    const pixelHeight = Math.abs(
      (nePx.y - swPx.y) * Math.pow(2, map.getZoom())
    );

    // If the pixel width or height is bigger than 8, consider it drawable on
    // the map.
    return pixelWidth > 8 || pixelHeight > 8;
  }

  function centroidFromPoints(points: Point[]) {
    let lat = 0,
      lng = 0;
    for (const point of points) {
      lat += point.y;
      lng += point.x;
    }

    lat /= points.length;
    lng /= points.length;

    return { lat, lng };
  }

  function centroidAndBoundsFromGeometry(
    geometry: Geometry
  ): [GeographyPoint, google.maps.LatLngBounds | undefined] {
    if (geometry instanceof Point) {
      return [{ lat: geometry.y, lng: geometry.x }, undefined];
    } else if (geometry instanceof Polygon) {
      return [
        centroidFromPoints(geometry.exteriorRing),
        getBoundsFromPoints(geometry.exteriorRing),
      ];
    } else if (geometry instanceof LineString) {
      return [
        centroidFromPoints(geometry.points),
        getBoundsFromPoints(geometry.points),
      ];
    }
    return [{ lat: 0, lng: 0 }, undefined];
  }

  function pointToLatLng(point: Point) {
    return { lng: point.x, lat: point.y };
  }

  function addMarkerForGeometry(geometry: Geometry) {
    const [{ lat, lng }, bounds] = centroidAndBoundsFromGeometry(geometry);
    const marker = new google.maps.Marker({
      position: { lng, lat },
      zIndex: 10,
    });
    marker.addListener("click", () => {
      if (bounds) {
        map.fitBounds(bounds);
      } else {
        map.moveCamera({
          center: marker.getPosition(),
          zoom: 13,
        });
      }
    });

    dataMarkerList.push(marker);
  }

  function addPolygonToGeometryList(geometry: Polygon) {
    if (!determinePointsVisibility(geometry.exteriorRing)) {
      addMarkerForGeometry(geometry);
      return;
    }
    const polygon = new google.maps.Polygon({
      map,
      strokeColor: "#C418FF",
      strokeWeight: 1,
      fillColor: "#C418FF",
      fillOpacity: 0.1,
      paths: [
        geometry.exteriorRing.map(pointToLatLng),
        ...geometry.interiorRings.map((points) => points.map(pointToLatLng)),
      ],
    });
    polygon.addListener("click", () => {
      map.fitBounds(getBoundsFromPoints(geometry.exteriorRing));
    });
    dataGeometryList.push(polygon);
  }

  function addLineStringToGeometryList(geometry: LineString) {
    if (!determinePointsVisibility(geometry.points)) {
      addMarkerForGeometry(geometry);
      return;
    }

    const lineString = new google.maps.Polyline({
      map,
      strokeColor: "#C418FF",
      strokeWeight: 1,
      path: geometry.points.map(pointToLatLng),
    });
    lineString.addListener("click", () => {
      map.fitBounds(getBoundsFromPoints(geometry.points));
    });
    dataGeometryList.push(lineString);
  }

  function addShapeToGeometryList(geometry: Geometry) {
    if (geometry instanceof MultiPoint) {
      for (const point of geometry.points) {
        addMarkerForGeometry(point);
      }
    } else if (geometry instanceof MultiPolygon) {
      for (const polygon of geometry.polygons) {
        addPolygonToGeometryList(polygon);
      }
    } else if (geometry instanceof MultiLineString) {
      for (const lineString of geometry.lineStrings) {
        addLineStringToGeometryList(lineString);
      }
    } else if (geometry instanceof GeometryCollection) {
      for (const geo of geometry.geometries) {
        addShapeToGeometryList(geo);
      }
    } else if (geometry instanceof Point) {
      addMarkerForGeometry(geometry);
    } else if (geometry instanceof Polygon) {
      addPolygonToGeometryList(geometry);
    } else if (geometry instanceof LineString) {
      addLineStringToGeometryList(geometry);
    }
  }

  async function updateDataMarkers(data: Uint8Array[]) {
    if (!map) return;
    if (dataMarkerClusterer) {
      dataMarkerClusterer.clearMarkers();
      dataMarkerClusterer.setMap(null);
      dataMarkerClusterer = undefined;
    }

    dataGeometryList.forEach((geometry) => geometry.setMap(null));

    dataGeometryList.length = 0;
    dataMarkerList.length = 0;

    for (const shape of data) {
      try {
        addShapeToGeometryList(Geometry.parse(Buffer.from(shape)));
      } catch {
        // Do nothing
      }
    }

    dataMarkerClusterer = new MarkerClusterer({
      map,
      markers: dataMarkerList,
    });
  }

  function addListeners() {
    const { circle } = props.distance;

    /* eventListenerHandles.push(
      circle.addListener("center_changed", eventListeners.circleCenterChanged)
    ); */
    eventListenerHandles.push(
      circle.addListener("bounds_changed", eventListeners.circleCenterChanged)
    );

    eventListenerHandles.push(
      map.addListener("center_changed", eventListeners.mapCenterChanged)
    );
    eventListenerHandles.push(
      map.addListener("zoom_changed", eventListeners.mapZoomChanged)
    );
    eventListenerHandles.push(
      map.addListener("click", eventListeners.mapClick)
    );
    eventListenerHandles.push(map.addListener("idle", eventListeners.mapIdle));
  }

  function removeListeners() {
    eventListenerHandles.forEach((listener) => listener.remove());
    eventListenerHandles.length = 0;
  }
</script>

<div class="map-container">
  <div class="map" use:googleMap />
</div>

<style lang="postcss">
  .map-container {
    @apply flex flex-row flex-1 min-h-[240px] rounded bg-light-200 items-stretch;
  }

  .map {
    @apply flex-1 rounded;
  }
</style>
