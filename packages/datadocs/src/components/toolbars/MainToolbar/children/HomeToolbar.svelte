<script lang="ts">
  import type { ToolbarSectionInfo } from "./type";
  import ToolbarUndoRedoSection from "../sections/ToolbarUndoRedoSection.svelte";
  import ToolbarZoomSection from "../sections/ToolbarZoomSection.svelte";
  import ToolbarFormatSection from "../sections/ToolbarFormatSection.svelte";
  import ToolbarFontFamilySection from "../sections/ToolbarFontFamilySection.svelte";
  import ToolbarFontSizeSection from "../sections/ToolbarFontSizeSection.svelte";
  import ToolbarFontStyleSection from "../sections/ToolbarFontStyleSection.svelte";
  import ToolbarConditionalFormattingSection from "../sections/ToolbarConditionalFormattingSection.svelte";
  import ToolbarCellStyleSection from "../sections/ToolbarCellStyleSection.svelte";
  import ToolbarTextStyleSection from "../sections/ToolbarTextStyleSection.svelte";
  import ToolbarUtilitiesSection from "../sections/ToolbarUtilitiesSection.svelte";
  import ToolbarCellModificationSection from "../sections/ToolbarCellModificationSection.svelte";
  import ToolbarBase from "./ToolbarBase.svelte";
  import ToolbarLocaleSection from "../sections/ToolbarLocaleSection.svelte";
  import {
    tableSubtoolbar,
    tableViewShowComponentName,
  } from "./table/TableSubtoolbar";
  import { selectedTable } from "../../../../app/store/writables";
  import type { TableDescriptor } from "@datadocs/canvas-datagrid-ng";
  import { uniqueReadable } from "../../../../app/store/readable-unique";
  import { isTableViewOpen } from "../../../../app/store/panels/writables";
  import ToolbarHyperlinkSection from "../sections/ToolbarHyperlinkSection.svelte";

  const tableStore = uniqueReadable(selectedTable);

  /**
   * NOTE: The commented ones are not included in the initial version but
   * keep it so we can bring it back if necessary.
   */
  let toolbarSections: ToolbarSectionInfo[] = [
    {
      type: "component",
      name: "toolbar_undo_redo_section",
      width: 74,
      component: ToolbarUndoRedoSection,
    },
    {
      type: "component",
      name: "toolbar_zoom_section",
      width: 64,
      component: ToolbarZoomSection,
    },
    tableSubtoolbar,
    {
      type: "component",
      name: "toolbar_format_section",
      width: 152,
      component: ToolbarFormatSection,
    },
    {
      type: "component",
      name: "toolbar_font_family_section",
      width: 99,
      component: ToolbarFontFamilySection,
    },
    {
      type: "component",
      name: "toolbar_font_size_section",
      width: 56,
      component: ToolbarFontSizeSection,
    },
    {
      type: "component",
      name: "toolbar_font_style_section",
      width: 141,
      component: ToolbarFontStyleSection,
    },
    // {
    //   type: "component",
    //   name: "toolbar_conditional_formatting_section",
    //   width: 111,
    //   component: ToolbarConditionalFormattingSection,
    // },
    {
      type: "component",
      name: "toolbar_cell_style_section",
      width: 111,
      component: ToolbarCellStyleSection,
    },
    {
      type: "component",
      name: "toolbar_text_style_section",
      width: 148,
      component: ToolbarTextStyleSection,
    },
    // {
    //   type: "component",
    //   name: "toolbar_utilities_section",
    //   width: 104,
    //   component: ToolbarUtilitiesSection,
    // },
    // {
    //   type: "component",
    //   name: "toolbar_cell_modification_section",
    //   width: 111,
    //   component: ToolbarCellModificationSection,
    // },
    // {
    //   type: "component",
    //   name: "toolbar_locale_section",
    //   width: 37,
    //   component: ToolbarLocaleSection,
    // },
    {
      type: "component",
      name: "toolbar_hyperlink_section",
      width: 26,
      component: ToolbarHyperlinkSection,
    }
  ];

  let hadTable = false;

  $: updateWithActiveTable($tableStore);

  function updateWithActiveTable(table: TableDescriptor | undefined) {
    const hasTable = !!table;
    if (hadTable === hasTable) return;
    tableSubtoolbar.hidden = !hasTable;
    toolbarSections = toolbarSections;
    hadTable = hasTable;
  }
</script>

<ToolbarBase {toolbarSections} />
