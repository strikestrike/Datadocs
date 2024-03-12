<script lang="ts">
  import {
    DataType,
    type Struct,
    type TableDescriptor,
    type ColumnType,
    type GridJsonTypeMap,
  } from "@datadocs/canvas-datagrid-ng";
  import {
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import { getDataTypeIcon } from "../../../../../../../common/icons/utils";
  import { columnTypeToShortFormString } from "@datadocs/canvas-datagrid-ng/lib/utils/column-types";
  import Icon from "../../../../../../../common/icons/Icon.svelte";
  import {
    CLOSE_DROPDOWN_CONTEXT_NAME,
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME,
  } from "../../../../../../../common/dropdown";
  import DropdownSectionTitle from "../../../../../../../toolbars/MainToolbar/dropdowns/common/DropdownSectionTitle.svelte";
  import type { FieldSelectorTarget } from "./type";
  import { ensureAsync } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/await";
  import {
    CLOSE_ROOT_MENU_CONTEXT_NAME,
    MENU_DATA_ITEM_TYPE_ELEMENT,
    MENU_DATA_ITEM_TYPE_LIST,
    MENU_DATA_ITEM_TYPE_SEPARATOR,
    type MenuListType,
    type MenuItemType,
    type MenuElementType,
  } from "../../../../../../../common/menu";
  import Menu from "../../../../../../../common/menu/Menu.svelte";

  const closeContextMenu = getContext(CLOSE_DROPDOWN_CONTEXT_NAME) as () => any;
  const updateDropdown: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );

  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, () => {
    if (!keepMenuOpen) closeContextMenu();
  });

  const dispatch = createEventDispatcher<{
    change: { target: FieldSelectorTarget };
  }>();

  export let table: TableDescriptor;
  export let selectorTarget: FieldSelectorTarget | undefined = undefined;
  export let title: string | undefined = undefined;
  export let keepMenuOpen = false;
  export let hideCustomFormulaOption = false;
  export let hideColumnIds: string[] = [];

  type RootField = {
    columnId: string;
    path: string;
  };

  let menuData: MenuItemType[] = [];
  let searchKeyword = "";

  let searchInput: HTMLInputElement;

  $: searchKeyword, loadFields();

  async function loadFields() {
    const headers = await ensureAsync(
      table.dataSource.getHeaders(searchKeyword)
    );

    menuData = await Promise.all(
      headers.map((header) => buildMenu(header.id, header.title, header.type))
    );

    if (!hideCustomFormulaOption) {
      menuData.push({
        type: MENU_DATA_ITEM_TYPE_SEPARATOR,
      });
      menuData.push({
        type: MENU_DATA_ITEM_TYPE_ELEMENT,
        label: "Custom Formula is",
        state: "enabled",
        active: selectorTarget?.type === "formula",
        action() {
          dispatch("change", { target: { type: "formula" } });
        },
      });
    }

    await tick();
    updateDropdown();
  }

  /**
   * @todo Highlight the selection correctly when it is inside a struct field.
   */
  async function buildMenu(
    name: string,
    displayName: string | undefined,
    columnType: ColumnType,
    rootField?: RootField
  ): Promise<MenuListType | MenuElementType> {
    if (typeof columnType === "object") {
      if (columnType.typeId === DataType.Struct) {
        if (!rootField) {
          rootField = {
            columnId: name,
            path: "",
          };
        }
        return {
          type: MENU_DATA_ITEM_TYPE_LIST,
          label: displayName ?? name,
          state: "enabled",
          prefixIcon: getDataTypeIcon(
            columnTypeToShortFormString(columnType),
            true
          ),
          prefixIconClass: "w-37px h-18px",
          children: await Promise.all(
            (columnType as Struct).children.map((child) =>
              buildMenu(child.name, child.displayname, child.type, {
                columnId: rootField.columnId,
                path: (rootField.path ? rootField.path + "." : "") + child.name,
              })
            )
          ),
        };
      } else if (columnType.typeId === DataType.Json && !rootField) {
        const result = await ensureAsync(
          table.dataSource.getJsonFieldStructure(name, 100)
        );
        const variantIcon = getDataTypeIcon(
          columnTypeToShortFormString({ typeId: DataType.Variant }),
          true
        );

        const loadJsonField = async (jsonMap: GridJsonTypeMap, path = "") => {
          const children: (MenuListType | MenuElementType)[] = [];
          for (const key of Object.keys(jsonMap)) {
            const values = jsonMap[key];
            const thisPath = ((path && path + ".") || "") + key;

            const valuesMenu: MenuItemType[] =
              values && (await loadJsonField(values, thisPath));

            const fieldAsElement = await buildMenu(
              key,
              key,
              { typeId: DataType.Variant },
              {
                columnId: name,
                path: thisPath,
              }
            );

            if (valuesMenu?.length > 0) {
              children.push({
                type: MENU_DATA_ITEM_TYPE_LIST,
                label: key,
                state: "enabled",
                prefixIcon: variantIcon,
                prefixIconClass: "w-37px h-18px",
                children: valuesMenu,
              });

              valuesMenu.push({ type: MENU_DATA_ITEM_TYPE_SEPARATOR });
              valuesMenu.push(fieldAsElement);

              fieldAsElement.label = "Use As Field";
              delete fieldAsElement.prefixIcon;
            } else {
              children.push(fieldAsElement);
            }
          }

          children.sort((a, b) =>
            a.type === b.type
              ? (a.label as string).localeCompare(b.label as string)
              : a.type === MENU_DATA_ITEM_TYPE_LIST
              ? -1
              : 1
          );
          return children;
        };

        return {
          type: MENU_DATA_ITEM_TYPE_LIST,
          label: displayName ?? name,
          state: "enabled",
          prefixIcon: variantIcon,
          prefixIconClass: "w-37px h-18px",
          children: await loadJsonField(result),
        };
      }
    }
    return {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: displayName ?? name,
      state:
        rootField || hideColumnIds.findIndex((id) => name === id) === -1
          ? "enabled"
          : "disabled",
      prefixIcon: getDataTypeIcon(
        columnTypeToShortFormString(columnType),
        true
      ),
      active:
        selectorTarget?.type === "column" &&
        ((rootField &&
          selectorTarget.pathInfo &&
          rootField.columnId === selectorTarget.columnId &&
          rootField.path === selectorTarget.pathInfo.path) ||
          (!rootField &&
            !selectorTarget.pathInfo &&
            name === selectorTarget.columnId)),
      prefixIconClass: "w-37px h-18px",
      action() {
        if (rootField) {
          dispatch("change", {
            target: {
              type: "column",
              columnId: rootField.columnId,
              pathInfo: {
                path: rootField.path,
              },
            },
          });
        } else {
          dispatch("change", {
            target: { type: "column", columnId: name },
          });
        }
      },
    };
  }

  onMount(() => {
    loadFields();
    searchInput.focus();
  });
</script>

<div class="dropdown">
  <div class="field-list-container">
    <!-- {#if title !== undefined}
      <DropdownSectionTitle {title} spacing="mx-5 my-1.5" />
    {/if} -->

    <div class="search-container">
      <div class="flex w-20px h-20px items-center justify-center">
        <Icon icon="filter-search" />
      </div>
      <input
        bind:this={searchInput}
        bind:value={searchKeyword}
        type="text"
        placeholder="Search..."
      />
    </div>

    <div class="field-list">
      <Menu data={menuData} embeded isRoot />
    </div>
  </div>
</div>

<style lang="postcss">
  .dropdown {
    @apply flex flex-row relative text-[13px] bg-white rounded h-[inherit] overflow-x-hidden;
    box-shadow: 0px 5px 20px 0px rgba(55, 84, 170, 0.16);

    .field-list-container {
      @apply flex flex-col flex-1min-w-0;

      .search-container {
        @apply flex flex-row px-3.5 py-1.5 mt-1.5 items-center text-dark-50 mx-1.5;
        line-height: normal;

        input {
          @apply min-w-0 flex-1 ml-1.5 outline-none bg-transparent;
        }

        &:has(input:focus) {
          @apply text-dark-200 bg-light-50 rounded;
        }
      }

      .field-list {
        @apply flex flex-col overflow-y-auto;
      }

      .separator {
        @apply border-t border-solid border-light-100;
      }

      .field-selection-button {
        @apply flex flex-row rounded mx-1.5 px-3.5 py-1.5 my-1 items-center text-dark-200 outline-none;

        .field-selection-title {
          @apply overflow-hidden text-13px font-medium whitespace-nowrap overflow-x-hidden overflow-ellipsis;
          line-height: normal;
        }

        &.activated {
          @apply text-primary-datadocs-blue bg-primary-datadocs-blue bg-opacity-[0.1];
        }

        &:hover,
        &:focus-within {
          @apply bg-light-50;
        }
      }
    }
  }
</style>
