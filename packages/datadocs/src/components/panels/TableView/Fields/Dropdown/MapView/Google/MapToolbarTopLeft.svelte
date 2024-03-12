<script lang="ts">
  import Icon from "../../../../../../common/icons/Icon.svelte";
  import { MarkerClusterer } from "@googlemaps/markerclusterer";

  export let map: google.maps.Map;

  const placesService = new google.maps.places.PlacesService(map);
  const infoWindow = new google.maps.InfoWindow({ disableAutoPan: true });

  let searchInput = "";
  let searchTimeout: NodeJS.Timeout | undefined;
  $: scheduleSearch(searchInput);

  let showResults = false;

  let loading = false;

  let searchResultMarkers: MarkerClusterer | undefined;

  function scheduleSearch(input: string) {
    if (searchTimeout) clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      searchFor(input);
      searchTimeout = undefined;
    }, 1000);
  }

  function searchFor(value: string) {
    if (typeof value === "string") value = value.trim();
    if (!value) return;
    const request: google.maps.places.TextSearchRequest = {
      query: value,
      bounds: map.getBounds(),
    };

    if (searchResultMarkers) {
      searchResultMarkers.clearMarkers();
      searchResultMarkers.setMap(null);
      searchResultMarkers = undefined;
    }

    loading = true;

    placesService.textSearch(request, (results, status) => {
      loading = false;
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        searchResultMarkers = new MarkerClusterer({
          map,
          markers: results.map((result) => {
            const marker = new google.maps.Marker({
              title: result.name,
              position: result.geometry.location,
            });

            marker.addListener("click", () => {
              map.fitBounds(result.geometry.viewport);
              infoWindow.setContent(result.name);
              infoWindow.open(map, marker);
            });

            return marker;
          }),
        });
      }
    });
  }
</script>

<div class="main-container">
  <div
    class="search-input-container"
    class:searching={searchInput.trim().length > 0}
    class:loading
  >
    <Icon class="ml-1" icon="location" size="13px" />
    <input
      bind:value={searchInput}
      type="text"
      placeholder="Search ..."
      on:focusin={() => (showResults = true)}
      on:focusout={() => (showResults = false)}
    />
  </div>
</div>

<style lang="postcss">
  .main-container {
    @apply p-1;
  }

  .search-input-container {
    @apply flex flex-row bg-white items-center text-light-200 p-1 rounded-[3px] font-normal;
    box-shadow: 1px 2px 6px rgba(55, 84, 170, 0.16);
  }

  .search-input-container.searching {
    @apply text-dark-300;
  }

  .search-input-container:focus-within {
    @apply text-primary-datadocs-blue;
  }

  .search-input-container input {
    @apply text-[13px] ml-1 font-normal bg-transparent;
    line-height: 19.5px;
  }

  .search-input-container input:focus {
    @apply outline-none;
  }

  .search-input-container input::placeholder {
    @apply font-normal text-dark-50;
  }

  .loading {
    background-image: linear-gradient(
      to right,
      #fff 0%,
      #ece9e6 50%,
      #fff 100%
    );
    background-size: 200% 100%;
    animation: gradient 1.5s linear infinite;
  }

  @keyframes gradient {
    from {
      background-position: 200% 0;
    }
    to {
      background-position: -200% 0;
    }
  }
</style>
