<script lang="ts">
  import { EditorView, basicSetup } from "codemirror";
  import { EditorState } from "@codemirror/state";
  import { onMount } from "svelte";

  onMount(() => {
    const parent = document.querySelector(".codemirror-container");

    const theme = EditorView.theme({
      "&.cm-focused": {
        outline: "none!important",
      },
      "& .cm-content .cm-line.cm-activeLine": {
        backgroundColor: "white",
      },
      "& .cm-gutters .cm-lineNumbers .cm-activeLineGutter": {
        backgroundColor: "white",
      },
      "& .cm-gutters .cm-foldGutter .cm-activeLineGutter": {
        backgroundColor: "white",
      },
      "& .cm-gutters .cm-lineNumbers": {
        color: "#A7B0B5",
        fontSize: "13px",
        fontWeight: "400",
        fontFamily: "Poppins",
      },
      "& .cm-gutters .cm-lineNumbers .cm-gutterElement": {
        textAlign: "center",
        // display: "flex",
        // flexDirection: "row",
        // justifyContent: "center",
        // alignItems: "center",
      },
      "& .cm-gutters": {
        backgroundColor: "white!important",
      },
      "& .cm-gutters .cm-foldGutter": {
        width: "4px",
      },
      "& .cm-content": {
        padding: "0px",
        // fontWeight: "bold",
        // fontStyle: "italic",
        fontFamily: "'Consolas BoldItalic', Poppins",
        fontSize: "15px",
      },
      "& .cm-scroller": {
        overflow: 'hidden',
      },
    });

    const startState = EditorState.create({
      doc: "\n".repeat(20),
      extensions: [basicSetup, theme]
    });

    const editor = new EditorView({
      state: startState,
      parent: parent,
    });
  });
</script>

<div class="codemirror-container" />

<style>
  .codemirror-container {
    width: 100%;
    height: 100%;
    max-height: 100%;
    overflow-y: auto;
  }
</style>
