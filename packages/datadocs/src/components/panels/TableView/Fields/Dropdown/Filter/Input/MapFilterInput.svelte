<script lang="ts">
  import type {
    GeographyBoundary,
    GridFilterCondition,
    GridGeoUnit,
    GridHeader,
    TableDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import {
    GRID_DISTANCE_UNIT_MILE,
    GRID_FILTER_CONDITION_NAME_BETWEEN,
    GRID_FILTER_CONDITION_NAME_DISTANCE_FROM,
    GRID_FILTER_CONDITION_TYPE_VARIABLE,
    GRID_GEO_UNITS_IMPERIAL,
    GRID_GEO_UNITS_METRIC,
  } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/constants";
  import { createEventDispatcher, tick } from "svelte";
  import type {
    MenuElementType,
    MenuItemType,
  } from "../../../../../../common/menu";
  import {
    MENU_DATA_ITEM_TYPE_ELEMENT,
    MENU_DATA_ITEM_TYPE_TITLE,
    MENU_DATA_ITEM_TYPE_SEPARATOR,
  } from "../../../../../../common/menu";
  import type { MapViewMode } from "../../MapView/MapView";
  import MapViewGoogle from "../../MapView/MapViewGoogle.svelte";
  import DropdownButton from "../../../../../../common/form/button/DropdownButton.svelte";
  import { getPathInfo } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/filters/utils";

  const dispatch = createEventDispatcher<{
    updated: { condition: GridFilterCondition };
  }>();
  const mapFilterOptions: MenuElementType[] = getMapFilterOptions();

  export let table: TableDescriptor;
  export let header: GridHeader;
  export let currentCondition: GridFilterCondition | undefined;
  export let isAdvancedView: boolean;

  let distanceInput = 10;
  let coordinatesInput = "1.203, 2.709, 3.248, 3.721";
  let unit: GridGeoUnit = GRID_DISTANCE_UNIT_MILE;

  let mapData: Uint8Array[] = [];
  let mode = getModeFromCondition(currentCondition);

  let editingDistance = false;
  let editingCoordinates = false;

  $: filterNeedsInput =
    !currentCondition ||
    currentCondition.target.conditionName ===
      GRID_FILTER_CONDITION_NAME_BETWEEN ||
    currentCondition.target.conditionName ===
      GRID_FILTER_CONDITION_NAME_DISTANCE_FROM;
  $: pathInfo = getPathInfo(header, currentCondition?.target);

  $: updateWithCondition(currentCondition);
  $: loadMapData(mode);

  const unitsMenuData = getUnitsMenuData();

  function getUnitsMenuData() {
    const items: MenuItemType[] = [];

    const loadFrom = (unitTitle: string, units: readonly GridGeoUnit[]) => {
      if (items.length) {
        items.push({
          type: MENU_DATA_ITEM_TYPE_SEPARATOR,
        });
      }
      items.push({
        type: MENU_DATA_ITEM_TYPE_TITLE,
        title: unitTitle,
      });
      for (const unitValue of units) {
        items.push({
          type: MENU_DATA_ITEM_TYPE_ELEMENT,
          label: unitValue.title,
          state: "enabled",
          action: async () => {
            unit = unitValue;
            await tick();
            updateWithDistance();
          },
        });
      }
    };

    loadFrom("Metric", GRID_GEO_UNITS_METRIC);
    loadFrom("Imperial", GRID_GEO_UNITS_IMPERIAL);

    return items;
  }

  function getModeFromCondition(
    condition: GridFilterCondition | undefined
  ): MapViewMode | undefined {
    switch (condition?.target.conditionName) {
      case GRID_FILTER_CONDITION_NAME_BETWEEN: {
        const sw = condition.target.values[0];
        const ne = condition.target.values[0];

        if (sw?.valueType === "geopoint" && ne?.valueType === "geopoint") {
          return {
            type: "rect",
            targets: {
              sw: sw.value,
              ne: ne.value,
            },
          };
        }
      }
      case "distanceFrom": {
        const coordinate = condition.target.values[0];
        const distance = condition.target.values[1];
        if (
          coordinate?.valueType === "geopoint" &&
          distance?.valueType === "number"
        ) {
          return {
            type: "distance",
            target: coordinate.value,
            distance: distance.value,
          };
        }
      }
    }

    return generateMode("rect");
  }

  function toggleMode(
    newMode: MapViewMode["type"] = mode.type === "rect" ? "distance" : "rect"
  ) {
    notifyChange(generateMode(newMode));
  }

  async function notifyChange(mode: MapViewMode) {
    currentCondition = getConditionFromMode(mode);
    dispatch("updated", { condition: currentCondition });
  }

  async function loadMapData(mode: MapViewMode) {
    if (mode.type !== "rect" && mode.type !== "distance") return;

    const geographyBoundaries: GeographyBoundary =
      mode.type === "rect"
        ? {
            type: "rectangle",
            sw: structuredClone(mode.targets.sw),
            ne: structuredClone(mode.targets.ne),
          }
        : {
            type: "circular",
            center: structuredClone(mode.target),
            distance: mode.distance,
          };
    const values = await table.dataSource.getFilterableValuesForColumn(
      header.id,
      {
        limit: 10000,
        geographyBoundaries,
      }
    );
    mapData = Object.values(values.data).map((filterable) => filterable.value);
  }

  function getMapFilterOptions() {
    const data: MenuElementType[] = [];

    data.push({
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "visible map",
      state: "enabled",
      action() {
        toggleMode("rect");
      },
    });
    data.push({
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "distance",
      state: "enabled",
      action() {
        toggleMode("distance");
      },
    });

    return data;
  }

  function updateWithMode(mode: MapViewMode) {
    if (mode.type === "distance") {
      const { lat, lng } = mode.target;
      if (!editingCoordinates) {
        coordinatesInput = `${lat}, ${lng}`;
      }
      if (!editingDistance) {
        distanceInput = Math.round(mode.distance / (unit.meters || 1));
      }
    } else if (mode.type === "rect") {
      const { ne, sw } = mode.targets;
      if (!editingCoordinates) {
        coordinatesInput = `${ne.lat}, ${ne.lng}, ${sw.lat}, ${sw.lng}`;
      }
    }
  }

  function updateWithDistance() {
    if (
      mode.type === "distance" &&
      distanceInput !== undefined &&
      !isNaN(distanceInput) &&
      isFinite(distanceInput)
    ) {
      const meters = Math.round(unit.meters * distanceInput);
      mode.distance = meters;
      notifyChange(mode);
    }
  }

  async function updateWithCondition(condition: GridFilterCondition) {
    mode = getModeFromCondition(condition);
    await tick();
    updateWithMode(mode);
  }

  function generateMode(mode: MapViewMode["type"]): MapViewMode {
    if (mode === "rect") {
      return {
        type: "rect",
        targets: {
          ne: { lng: 10, lat: -10 },
          sw: { lng: -10, lat: 10 },
        },
      };
    }
    return {
      type: "distance",
      distance: GRID_DISTANCE_UNIT_MILE.meters * 1500,
      target: {
        lat: 0,
        lng: 0,
      },
    };
  }

  function editAction(
    el: HTMLInputElement,
    options: {
      onEdit: (started: boolean) => any;
      getValue: () => any;
    }
  ) {
    const focusInListener = () => {
      options.onEdit(true);
    };
    const focusOutListener = () => {
      options.onEdit(false);
      el.value = options.getValue();
    };

    el.addEventListener("focusin", focusInListener);
    el.addEventListener("focusout", focusOutListener);

    return {
      destroy() {
        el.removeEventListener("focusin", focusInListener);
        el.removeEventListener("focusout", focusOutListener);
      },
    };
  }

  function latitudeBounds(value: number) {
    return Math.min(90, Math.max(value, -90));
  }

  function longitudeBounds(value: number) {
    return Math.min(180, Math.max(value, -180));
  }

  function updateWithCoordinates() {
    const numbers = [];
    for (const value of coordinatesInput.split(",")) {
      numbers.push(value.replace(/[^0-9.-]/g, ""));

      // We don't need the rest of the input.
      if (numbers.length >= 4) break;
    }

    numbers.forEach((value, i) => {
      if (!value) return;
      const parsedNumber = parseFloat(value);
      if (!isFinite(parsedNumber) || isNaN(parsedNumber)) return;

      if (mode.type === "distance") {
        if (i === 0) mode.target.lat = latitudeBounds(parsedNumber);
        if (i === 1) mode.target.lng = longitudeBounds(parsedNumber);
      } else if (mode.type === "rect") {
        if (i === 0) mode.targets.ne.lat = latitudeBounds(parsedNumber);
        if (i === 1) mode.targets.ne.lng = longitudeBounds(parsedNumber);
        if (i === 2) mode.targets.sw.lat = latitudeBounds(parsedNumber);
        if (i === 3) mode.targets.sw.lng = longitudeBounds(parsedNumber);
      }
    });
    notifyChange(mode);
  }

  function getConditionFromMode(
    mode: MapViewMode
  ): GridFilterCondition | undefined {
    if (mode.type === "rect") {
      const { sw, ne } = mode.targets;
      return {
        type: "condition",
        target: {
          columnId: header.id,
          conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
          conditionName: GRID_FILTER_CONDITION_NAME_BETWEEN,
          values: [
            {
              valueType: "geopoint",
              value: structuredClone(sw),
            },
            {
              valueType: "geopoint",
              value: structuredClone(ne),
            },
          ],
          pathInfo,
        },
      };
    } else if (mode.type === "distance") {
      const { target } = mode;
      return {
        type: "condition",
        target: {
          columnId: header.id,
          conditionType: GRID_FILTER_CONDITION_TYPE_VARIABLE,
          conditionName: GRID_FILTER_CONDITION_NAME_DISTANCE_FROM,
          values: [
            {
              valueType: "geopoint",
              value: structuredClone(target),
            },
            {
              valueType: "number",
              value: mode.distance,
            },
          ],
          pathInfo,
        },
      };
    }
  }
</script>

<div class="flex flex-col flex-1">
  {#if !isAdvancedView}
    <MapViewGoogle
      {mode}
      {mapData}
      {toggleMode}
      on:update={({ detail }) => notifyChange(detail.mode)}
    />
  {/if}

  <div class="map-filters" class:is-advanced={isAdvancedView}>
    {#if !isAdvancedView}
      <span class="text-within">Within</span>
    {/if}
    <DropdownButton
      class="pl-0 {mode.type === 'rect' ? 'flex-grow' : ''}"
      buttonClass="pl-0"
      buttonType="container"
      placement={isAdvancedView ? "middle" : "none"}
      data={mapFilterOptions}
      autoWidth
      allowMinimalWidth
    >
      <div
        slot="value"
        class="filter-type-value"
        class:flex-grow={mode.type === "rect"}
      >
        {#if mode.type === "rect"}
          visible map
        {:else}
          <input
            type="text"
            data-dd-dropdown-toggle-handler={true}
            bind:value={distanceInput}
            use:editAction={{
              onEdit(started) {
                editingDistance = started;
              },
              getValue() {
                return distanceInput;
              },
            }}
            on:input={updateWithDistance}
            class="secondary-input"
            style:width={`calc(${distanceInput.toString().length}ch + 6px)`}
          />
          <DropdownButton
            data={unitsMenuData}
            autoWidth={false}
            allowMinimalWidth
            secondary
            smaller
          >
            <svelte:fragment slot="value">{unit.shortTitle}</svelte:fragment>
          </DropdownButton>
          <span class="flex items-center mr-4">of</span>
        {/if}
      </div>
    </DropdownButton>
    {#if filterNeedsInput && mode.type !== "rect"}
      <div class="coordinates-input-container">
        <input
          bind:value={coordinatesInput}
          use:editAction={{
            onEdit(started) {
              editingCoordinates = started;
            },
            getValue() {
              return coordinatesInput;
            },
          }}
          on:input={updateWithCoordinates}
          class="input"
          type="text"
        />
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  .map-filters {
    @apply flex flex-row font-normal text-dark-200 text-[13px] items-center items-stretch;
    line-height: normal;

    &:not(.is-advanced) {
      @apply mt-1;
      column-gap: 4px;

      .coordinates-input-container {
        @apply rounded;
      }
    }

    &.is-advanced {
      .coordinates-input-container {
        @apply border-r-0;
      }
    }

    .text-within {
      @apply flex items-center ml-2.5 mr-2;
    }

    .coordinates-input-container {
      @apply flex flex-1 border border-solid border-light-100 outline-none bg-white items-center m-0 min-w-0;

      &:focus-within {
        @apply border-light-200;
      }

      > .input {
        @apply flex-1 min-w-0 pl-2.5 pr-2.5;

        &:focus {
          @apply outline-none;
        }
      }
    }

    .secondary-input {
      @apply rounded bg-light-50 text-dark-50 text-11px min-w-[21px] flex-shrink max-w-[6ch] text-center;
      line-height: normal;

      &:focus {
        @apply outline-none text-dark-200;
      }
    }

    .filter-type-value {
      @apply flex flex-row items-center items-stretch;
      column-gap: 4px;
    }
  }
</style>
