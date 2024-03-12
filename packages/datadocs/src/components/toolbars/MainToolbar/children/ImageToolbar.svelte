<script lang="ts">
  import type { ToolbarSectionInfo } from "./type";
  import ImageUndoRedoSection from "../sections/ImageUndoRedoSection.svelte";
  import ImageAlignmentSection from "../sections/ImageAlignmentSection.svelte";
  import ImageManipulationSection from "../sections/ImageManipulationSection.svelte";
  import ToolbarBase from "./ToolbarBase.svelte";

  const toolbarSections: ToolbarSectionInfo[] = [
    {
      type: "component",
      name: "toolbar_image_undo_redo_section",
      width: 74,
      component: ImageUndoRedoSection,
    },
    {
      type: "component",
      name: "toolbar_image_alignment_section",
      width: 74,
      component: ImageAlignmentSection,
    },
    {
      type: "component",
      name: "toolbar_image_manipulation_section",
      width: 74,
      component: ImageManipulationSection,
    },
  ];
</script>

<ToolbarBase {toolbarSections} />
