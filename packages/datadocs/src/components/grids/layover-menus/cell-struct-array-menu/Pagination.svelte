<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let pageCount: number;
  export let pageIndex: number;
  export let size: "big" | "small" = "small";

  const isBig = size === "big";
  const fontSize = isBig ? "text-12px" : "text-11px"
  const iconWidth = isBig ? 5 : 4;
  const iconHeight = isBig ? 8 : 7;

  const dispatch = createEventDispatcher();

  function increasePageIndex(delta: number) {
    const newIndex = pageIndex + delta;

    if (newIndex < 0 || newIndex > pageCount - 1) {
      return;
    }

    pageIndex = newIndex;
    dispatch("change", { pageIndex });
  }
</script>

<div class="flex flex-row gap-1">
  <span class="{fontSize} text-dark-300">
    {pageIndex + 1} of {pageCount}
  </span>

  <div class="flex flex-row">
    <div class="w-4 h-4 flex flex-row items-center justify-center">
      <button
        class="text-dark-50 p-1"
        class:text-light-100={pageIndex <= 0}
        on:click={() => increasePageIndex(-1)}
      >
        <svg
          width="{iconWidth}"
          height="{iconHeight}"
          viewBox="0 0 4 7"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.154407 3.12432C0.0555405 3.22397 1.46831e-07 3.3591 1.5299e-07 3.5C1.59149e-07 3.6409 0.0555405 3.77603 0.154407 3.87568L3.09925 6.84389C3.17294 6.91833 3.2669 6.96907 3.36923 6.98969C3.47155 7.0103 3.57765 6.99987 3.67408 6.9597C3.77052 6.91954 3.85297 6.85145 3.91098 6.76406C3.969 6.67666 3.99998 6.57389 4 6.46875L4 0.532318C4.00019 0.427085 3.96936 0.324166 3.91142 0.236608C3.85349 0.149051 3.77105 0.0807974 3.67457 0.0405011C3.57809 0.000204907 3.47191 -0.0103194 3.36948 0.0102623C3.26706 0.030844 3.17301 0.081605 3.09925 0.15611L0.154407 3.12432Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>

    <div class="w-4 h-4 flex flex-row items-center justify-center">
      <button
        class="text-dark-50 p-1"
        class:text-light-100={pageIndex >= pageCount - 1}
        on:click={() => increasePageIndex(1)}
      >
        <svg
          width="{iconWidth}"
          height="{iconHeight}"
          viewBox="0 0 4 7"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3.84559 3.12432C3.94446 3.22397 4 3.3591 4 3.5C4 3.6409 3.94446 3.77603 3.84559 3.87568L0.900751 6.84389C0.827057 6.91833 0.733101 6.96907 0.630775 6.98969C0.528449 7.0103 0.422353 6.99987 0.325916 6.9597C0.229478 6.91954 0.147034 6.85145 0.089018 6.76406C0.0310025 6.67666 2.28392e-05 6.57389 6.70916e-07 6.46875L9.30406e-07 0.532318C-0.000185985 0.427085 0.0306425 0.324166 0.088578 0.236608C0.146514 0.149051 0.228947 0.0807974 0.325428 0.0405011C0.421909 0.000204907 0.528092 -0.0103194 0.630516 0.0102623C0.732941 0.030844 0.826994 0.081605 0.900751 0.15611L3.84559 3.12432Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  </div>
</div>
