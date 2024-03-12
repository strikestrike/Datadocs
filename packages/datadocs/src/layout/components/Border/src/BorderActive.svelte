<script lang="ts">
  import clsx from "clsx";

  export let color: "blue" | "gray" = "blue";
  export let className = "";
  export let show = false;
</script>

<div
  class={clsx(
    "absolute w-full h-full top-0 left-0 border border-4 box-border transition-all duration-300 ease-out z-200 pointer-events-none opacity-0",
    { "opacity-100": show },
    { "border-gray-400": color === "gray" },
    { "border-primary-datadocs-blue": color === "blue" },
    className,
  )}
/>
