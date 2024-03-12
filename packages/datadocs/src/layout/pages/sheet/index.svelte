<!-- @component
@packageModule(layout/ContainersLayout)
-->
<script lang="ts">
  import { setContext } from "svelte";
  import ContainerPane from "./components/Main/index.svelte";
  import { useLayoutSheet } from "src/layout/store/pane";
  import type { Type } from "../../types/context";
  import { CONTEXT_TYPE } from "../../constants/context";
  import { ContextType } from "../../enums/context";

  const { layout } = useLayoutSheet();

  setContext<Type>(CONTEXT_TYPE, ContextType.SHEET);
</script>

<div class="container-layout">
  <ContainerPane pane={$layout.root} allowSplit={true} />
</div>

<style lang="postcss">
  .container-layout {
    @apply w-full h-full relative pointer-events-none;
  }
</style>
