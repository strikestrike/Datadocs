<script lang="ts">
  export let sourceNodeElement: HTMLElement = null;
  export let handleClick: (event: Event) => void = null;
  export let handleDoubleClick: (event: Event) => void = null;
  export let className: string = "";

  // Check if click to more button or not
  function checkValidClick(node: HTMLElement): boolean {
    if (node.classList.contains("panel-more-button")) {
      return false;
    }
    if (node.parentElement != sourceNodeElement) {
      return checkValidClick(node.parentElement);
    }
    return true;
  }
  function onClick(event: Event) {
    const node = event.target;
    if (handleClick && checkValidClick(node as HTMLElement)) {
      handleClick(event);
    }
  }
  function onDoubleClick(event: Event) {
    const node = event.target;
    if (handleDoubleClick && checkValidClick(node as HTMLElement)) {
      handleDoubleClick(event);
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class={className}
  bind:this={sourceNodeElement}
  on:click={onClick}
  on:dblclick={onDoubleClick}
>
  <slot />
</div>
