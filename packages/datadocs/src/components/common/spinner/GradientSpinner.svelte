<script lang="ts">
  export let clazz = "";
</script>

<div class="gradient h-20px {clazz}" />

<style lang="postcss">
  .gradient {
    @apply rounded relative;
    animation-duration: 1.8s;
    animation-fill-mode: forwards;
    animation-iteration-count: infinite;
    animation-name: shimmerAnimation;
    animation-timing-function: linear;
    background: #f6f7f8;
    background: linear-gradient(to right, #fafafa 8%, #f4f4f4 38%, #fafafa 54%);
    background-size: 1000px 640px;
  }

  @keyframes shimmerAnimation {
    0% {
      background-position: 0px 0;
    }

    100% {
      background-position: 1000px 0;
    }
  }
</style>
