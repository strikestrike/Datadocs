<style lang="postcss">
  :global {
    .source-panel-tree-view ul > li {
      @apply ml-2;
    }

    .source-panel-tree-view ul {
      @apply border-l border-solid border-light-50;
    }

    /* no border for first ul */
    .source-panel-tree-view > ul {
      @apply border-none;
    }

    /* first item is root node, no margin left for it */
    .source-panel-tree-view > ul > li {
      @apply ml-0;
    }

    /* make sure tree node text can be selected */
    .source-panel-tree-view * {
      user-select: text;
    }

    .source-panel-tree-view .tree-node-container:hover .tree-node-bg {
      @apply bg-dark-50;
      opacity: 0.15;
    }

    .source-panel-tree-view .tree-node-container.selected .tree-node-bg {
      @apply bg-dark-50;
      opacity: 0.2;
    }
  }
</style>
