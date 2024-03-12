<script lang="ts">
  export let size = 24;
  export let clazz = "";
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  xmlns="http://www.w3.org/2000/svg"
  class="spinner {clazz}"
>
  <path
    d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
    opacity=".25"
  />
  <path
    d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"
    class="spinner-foreground"
  />
</svg>

<style lang="postcss">
  .spinner {
    @apply fill-primary-datadocs-blue;

    .spinner-foreground {
      transform-origin: center;
      animation: circular-spinner-anim 0.75s infinite linear;
    }
  }

  @keyframes circular-spinner-anim {
    100% {
      transform: rotate(360deg);
    }
  }
</style>
