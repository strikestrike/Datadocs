<!-- @component
@packageModule(layout/FlexDivide)
-->
<script lang="ts">
  import { setContext } from "svelte";
  import FlexPane from "./components/Main/index.svelte";
  import { useLayoutWorkBook } from "src/layout/store/pane";
  import { CONTEXT_TYPE } from "src/layout/constants/context";
  import type { Type } from "src/layout/types/context";
  import { ContextType } from "src/layout/enums/context";

  const { layout } = useLayoutWorkBook();

  setContext<Type>(CONTEXT_TYPE, ContextType.WORKBOOK);

  $: {
  }
</script>

<div class="flex-divide">
  <FlexPane pane={$layout.root} />
</div>

<style lang="postcss">
  .flex-divide {
    @apply w-full h-full relative pointer-events-auto;
  }
</style>
