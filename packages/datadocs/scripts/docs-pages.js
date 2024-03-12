module.exports = {
  pages: [
    {
      title: "Panels Layout",
      source: "./panels_index.md",
      moduleRoot: true,
      // childrenDir: "panels-content",
      children: [
        {
          title: "Guide",
          childrenDir: "./panels-content",
          source: "./panels_contents.md",
          children: [
            { title: "01 Overview", source: "./page_01_overview.md" },
            {
              title: "02 User Interface",
              source: "./page_02_user_interface.md",
            },
            {
              title: "03 Data structure",
              source: "./page_03_datastructure.md",
            },
            {
              title: "04 View and Panels",
              source: "./page_04_view_and_panels.md",
            },
            { title: "05 Panels Layout", source: "./page_05_panels_layout.md" },
            { title: "06 Drag and Drop", source: "./page_06_drag_drop.md" },
            { title: "07 Resizing", source: "./page_07_panel_resizing.md" },
            { title: "08 Workspace", source: "./page_08_workspace.md" },
          ],
        },
        // { title: "Panels Overview", source: "./panels-content/page_01_overview.md" },
        // { title: "Panels Datastructures", source: "./panels-content/page_02_datastructures.md" },
      ],
    },
  ],
};
