<script lang="ts">
  import clsx from "clsx";

  export let position: "left" | "right" = "left";
  export let className = "text-white";
</script>

<div
  class={clsx(
    "border-corner absolute bottom-0 w-1 h-1",
    position === "left" ? "-left-1" : "-right-1 transform !rotate-y-180",
    className
  )}
>
  <svg
    width="4px"
    height="4px"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M 100 0 A 100 100, 0, 0, 1, 0 100 L 100 100 Z" fill="white" />

    <path
      d="M 100 0 A 100 100, 0, 0, 1, 0 100 L 100 100 Z"
      fill="currentColor"
    />
  </svg>
</div>

<style lang="postcss">
  .right {
    right: -1px;
    transform: rotate(180deg);
  }
  svg {
    filter: drop-shadow(-0.4px -0.4px 0.2px rgb(55 84 170 / 2%));
  }
</style>
