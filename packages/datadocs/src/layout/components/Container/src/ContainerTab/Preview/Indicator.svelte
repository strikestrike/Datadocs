<script lang="ts">
  import { Drop } from "src/layout/components/DragDrop";
  import { createEventDispatcher, getContext } from "svelte";

  type DragFunction = (event?: MouseEvent) => void;

  const emit =
    createEventDispatcher<
      Record<"dragover" | "drop" | "dragin" | "dragout", MouseEvent>
    >();

  const onDragIn: DragFunction = getContext("onDragIn");
  const onDragOut: DragFunction = getContext("onDragOut");
  const onDragOver: DragFunction = getContext("onDragOver");
  const onDrop: DragFunction = getContext("onDrop");

  const dragIn = (event?: MouseEvent) => {
    onDragIn(event);
    emit("dragin", event);
  };
  const dragOut = (event?: MouseEvent) => {
    onDragOut(event);
    emit("dragout", event);
  };
</script>

<Drop
  phantom="none"
  on:dragin={({ detail: event }) => dragIn(event)}
  on:dragout={({ detail: event }) => dragOut(event)}
  on:dragover={({ detail: event }) => onDragOver(event)}
  on:drop={({ detail: event }) => onDrop(event)}
>
  <slot />
</Drop>
