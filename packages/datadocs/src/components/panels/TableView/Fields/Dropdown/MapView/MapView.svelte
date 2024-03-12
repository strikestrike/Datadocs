<script lang="ts">
  import type { Map, LatLngLiteral, LocationEvent } from "leaflet";
  import L from "leaflet";
  import { onMount, SvelteComponent } from "svelte";
  import MapToolbar from "./MapToolbar.svelte";
  import type { MapMarkerDragContext, MapViewMode } from "./MapView";

  import markerHandleIcon from "../../../../../common/icons/icon-imgs/map/icon_map_marker_handle.svg?raw";

  export let mode: MapViewMode = {
    type: "point",
    target: { lat: 0, lng: 0 },
  };

  export let requestUserLocation = false;

  /* const userLocationProps = {
    targetMarker: L.marker([0, 0]),
    circle: L.circle([0, 0], {
      color: "#00EFFF",
      fill: true,
      fillColor: "#00EFFF",
      fillOpacity: 0.05,
      stroke: true,
      weight: 1,
    }),
  }; */

  const distanceProps = {
    targetMarker: createDistanceMarker(),
    circle: L.circle([0, 0], {
      color: "#C418FF",
      fill: true,
      fillColor: "#C418FF",
      fillOpacity: 0.1,
      stroke: true,
      weight: 1,
    }),
  };
  const pointProps = {
    targetMarker: L.marker([0, 0]),
  };
  const rectProps = {
    markers: [
      createRectModeMarker(),
      createRectModeMarker(),
      createRectModeMarker(),
      createRectModeMarker(),
    ],
    foreground: L.polygon([], {
      color: "#C418FF",
      fill: true,
      fillColor: "#C418FF",
      fillOpacity: 0.1,
      stroke: true,
      weight: 1,
    }),
  };

  const distanceModeLayerGroup = L.layerGroup([
    distanceProps.targetMarker,
    distanceProps.circle,
  ]);
  const pointModeLayerGroup = L.layerGroup([pointProps.targetMarker]);
  const rectModeLayerGroup = L.layerGroup([
    ...rectProps.markers,
    rectProps.foreground,
  ]);

  $: mode, updateMapProps();

  let map: Map = undefined;

  let toolbar = createToolbar();
  let toolbarComponent: SvelteComponent | undefined;

  let markerDragContext: MapMarkerDragContext | undefined;

  let userLocation: LocationEvent | undefined;

  function createMap(container: HTMLElement) {
    const map = L.map(container, {
      center: [0, 0],
      zoom: 16,
      preferCanvas: true,
      attributionControl: false,
      zoomControl: false,
      layers: [],
    }).setView([0, 0], 5);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    map.on("locationfound", (e) => {
      const { latlng } = e;

      if (mode.type == "distance") {
        const { target } = mode;

        target.lat = latlng.lat;
        target.lng = latlng.lng;
        mode.distance = e.accuracy;

        updateWithInput();
      } else if (mode.type == "rect") {
        const { ne: tl, sw: br } = mode.targets;

        const dlng = Math.abs(tl.lng - br.lng) / 2;
        const dlat = Math.abs(tl.lat - br.lat) / 2;

        mode.targets.ne = {
          lng: latlng.lng + dlng,
          lat: latlng.lat + dlat,
        };
        mode.targets.sw = {
          lng: latlng.lng - dlng,
          lat: latlng.lat - dlat,
        };

        /* tl.lat = latlng.lat + e.accuracy / 2;
        tl.lng = latlng.lng + e.accuracy / 2;
        br.lat = latlng.lat - e.accuracy / 2;
        br.lng = latlng.lng - e.accuracy / 2; */

        updateWithInput();
      }

      userLocation = e;
    });

    map.on("locationerror", (e) => {
      userLocation = undefined;
    });

    map.on("click", (e) => {
      const { latlng } = e;
      if (mode.type === "rect") {
        const { targets } = mode;
        const { ne: tl, sw: br } = targets;
        const dlng = Math.abs(tl.lng - br.lng) / 2;
        const dlat = Math.abs(tl.lat - br.lat) / 2;

        targets.ne = {
          lng: latlng.lng + dlng,
          lat: latlng.lat + dlat,
        };
        targets.sw = {
          lng: latlng.lng - dlng,
          lat: latlng.lat - dlat,
        };
        updateWithInput();
      } else if (mode.type === "distance") {
        mode.target = { lng: latlng.lng, lat: latlng.lat };
        updateWithInput();
      }
    });

    return map;
  }

  function createToolbar() {
    const toolbar = new L.Control({ position: "bottomright" });
    toolbar.onAdd = (map: L.Map) => {
      let div = L.DomUtil.create("div");
      toolbarComponent = new MapToolbar({
        target: div,
        props: { map },
      });

      return div;
    };
    toolbar.onRemove = () => {
      if (toolbarComponent) {
        toolbarComponent.$destroy();
        toolbarComponent = null;
      }
    };

    return toolbar;
  }

  function createDraggableMarkerIcon() {
    return L.divIcon({
      html: `<div class="flex w-full h-full items-center justify-center">${markerHandleIcon}</div>`,
      className: "map-marker",
    });
  }

  function createDistanceMarker() {
    const marker = L.marker([0, 0], {
      draggable: true,
      icon: createDraggableMarkerIcon(),
    });

    marker.on("drag", () => {
      if (mode.type !== "distance") return;
      const { lat, lng } = marker.getLatLng();
      const { target } = mode;

      target.lat = lat;
      target.lng = lng;
      updateDistanceProps();
    });
    marker.on("dragend", () => {
      updateWithInput();
    });

    return marker;
  }

  function createRectModeMarker(): L.Marker {
    const marker = L.marker([0, 0], {
      draggable: true,
      icon: createDraggableMarkerIcon(),
    });

    marker.on("dragstart", () => {
      const markerIndex = rectProps.markers.findIndex(
        (other) => other == marker
      );
      if (mode.type !== "rect" || markerIndex === -1) return;

      const { lat, lng } = marker.getLatLng();
      const { ne, sw } = mode.targets;
      const availableMarkers = rectProps.markers.filter(
        (other) => other != marker
      );

      let orbit = ne;

      if (lat === ne.lat && lng === ne.lng) {
        // Mouse down on the top left marker.
        orbit = sw;
      } else if (lat === sw.lat && lng === sw.lng) {
        // Mouse down on the bottom right marker.
        orbit = ne;
      } else if (lat === ne.lat && lng === sw.lng) {
        // Mouse down on the top right marker.
        orbit = { lat: sw.lat, lng: ne.lng };
      } else {
        // Mouse down on the bottom left marker.
        orbit = { lat: ne.lat, lng: sw.lng };
      }

      markerDragContext = { marker, orbit, markerIndex, availableMarkers };
    });

    marker.on("drag", () => {
      if (mode.type !== "rect" || !markerDragContext) {
        return;
      }
      // Longitude is the X, and latitude is the Y value of the cartesian
      // coordinate system.

      const { targets } = mode;
      const { marker, orbit, availableMarkers } = markerDragContext;
      const { lat, lng } = marker.getLatLng();
      let markerIndex = 0;

      const getCornerCoords = (
        corner: "tl" | "tr" | "bl" | "br"
      ): LatLngLiteral => {
        const { ne: tl, sw: br } = targets;
        if (corner === "tl") {
          return { ...tl };
        } else if (corner === "tr") {
          return { lng: br.lng, lat: tl.lat };
        } else if (corner === "bl") {
          return { lng: tl.lng, lat: br.lat };
        }
        return { ...br };
      };
      const nextMarker = () => availableMarkers[markerIndex++];

      if (lng >= orbit.lng && lat >= orbit.lat) {
        // The marker is in the top left corner.
        targets.ne = { lat, lng };
        targets.sw = { ...orbit };

        nextMarker().setLatLng(getCornerCoords("tr"));
        nextMarker().setLatLng(getCornerCoords("bl"));
        nextMarker().setLatLng(getCornerCoords("br"));
      } else if (lng >= orbit.lng && lat < orbit.lat) {
        // The marker is in the bottom left corner.
        targets.ne = { lng, lat: orbit.lat };
        targets.sw = { lng: orbit.lng, lat };

        nextMarker().setLatLng(getCornerCoords("tl"));
        nextMarker().setLatLng(getCornerCoords("tr"));
        nextMarker().setLatLng(getCornerCoords("br"));
      } else if (lng < orbit.lng && lat >= orbit.lng) {
        // The marker is in the top right corner.
        targets.ne = { lng: orbit.lng, lat };
        targets.sw = { lng, lat: orbit.lat };

        nextMarker().setLatLng(getCornerCoords("tl"));
        nextMarker().setLatLng(getCornerCoords("bl"));
        nextMarker().setLatLng(getCornerCoords("br"));
      } else {
        // The marker is in the bottom right corner.
        targets.ne = { ...orbit };
        targets.sw = { lng, lat };

        nextMarker().setLatLng(getCornerCoords("tl"));
        nextMarker().setLatLng(getCornerCoords("tr"));
        nextMarker().setLatLng(getCornerCoords("bl"));
      }

      updateRectProps();
    });
    marker.on("dragend", () => {
      markerDragContext = undefined;
      updateWithInput();
    });

    return marker;
  }

  function attachProps() {
    if (!map) return;

    if (mode.type === "distance") {
      distanceModeLayerGroup.addTo(map);
    } else if (mode.type === "point") {
      pointModeLayerGroup.addTo(map);
    } else if (mode.type === "rect") {
      rectModeLayerGroup.addTo(map);
    }
  }

  function detachProps() {
    if (!map) return;
    if (mode.type === "distance") {
      distanceModeLayerGroup.remove();
    } else if (mode.type === "point") {
      pointModeLayerGroup.remove();
    } else if (mode.type === "rect") {
      rectModeLayerGroup.remove();
    }
  }

  function updateMapProps() {
    distanceModeLayerGroup.remove();
    pointModeLayerGroup.remove();
    rectModeLayerGroup.remove();

    attachProps();
    updateWithInput();
  }

  function updateWithInput() {
    if (mode.type === "distance") {
      const { targetMarker } = distanceProps;
      targetMarker.setLatLng({ ...mode.target });
      updateDistanceProps();

      if (map) {
        map.fitBounds(distanceProps.circle.getBounds(), {
          padding: [20, 20],
          maxZoom: 20,
        });
      }
    } else if (mode.type === "rect") {
      const { ne: tl, sw: br } = mode.targets;
      const [a, b, c, d] = rectProps.markers;

      a.setLatLng(tl);
      // top-right
      b.setLatLng({ lng: br.lng, lat: tl.lat });
      // bottom-left
      c.setLatLng({ lng: tl.lng, lat: br.lat });
      d.setLatLng(br);

      updateRectProps();
      if (map) {
        map.fitBounds(rectProps.foreground.getBounds(), {
          padding: [20, 20],
          maxZoom: 19,
        });
      }
    } else {
      pointProps.targetMarker.setLatLng(mode.target);
      if (map) map.setView(pointProps.targetMarker.getLatLng());
    }
  }

  function updateDistanceProps() {
    if (mode.type !== "distance") return;

    const { circle } = distanceProps;
    circle.setLatLng(mode.target);
    circle.setRadius(mode.distance / 2);
  }

  function updateRectProps() {
    if (mode.type !== "rect") return;

    const { ne, sw } = mode.targets;
    const coords = [
      ne,
      { lng: ne.lng, lat: sw.lat },
      sw,
      { lng: sw.lng, lat: ne.lat },
      ne,
    ];

    rectProps.foreground.setLatLngs(coords);
  }

  function mapAction(container) {
    map = createMap(container);

    toolbar.addTo(map);

    attachProps();

    return {
      destroy: () => {
        detachProps();
        toolbar.remove();
        map.remove();
        map = null;
      },
    };
  }

  function resizeMap() {
    if (map) {
      map.invalidateSize();
    }
  }

  onMount(() => {
    updateMapProps();

    if (requestUserLocation) {
      map.locate();
    }
  });
</script>

<svelte:window on:resize={resizeMap} />
<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
  integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
  crossorigin=""
/>
<div class="map flex-grow" use:mapAction />

<style lang="postcss">
  .map {
    @apply flex-grow h-[190px] rounded;
  }
</style>
