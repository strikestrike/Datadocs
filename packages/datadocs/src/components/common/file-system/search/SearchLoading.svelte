<script lang="ts">
  import searchLoadingIcon from "./search_loading_icon.svg?raw";
</script>

<div>
  <div class="w-full flex flex-row justify-center">
    <div class="spin-container">
      <div class="spin-child">{@html searchLoadingIcon}</div>
    </div>
  </div>

  <div class="w-full mt-1 text-dark-300 text-13px font-normal text-center">
    Searching
  </div>
</div>

<style lang="postcss">
  .spin-container {
    @apply relative;
    width: 30px;
    height: 30px;
  }

  .spin-child {
    @apply absolute left-0 right-0 top-0 bottom-0;
    @apply flex flex-row items-center justify-center;
    transform-origin: center;
    animation: spinAnimation 1.5s linear infinite;
  }

  @keyframes spinAnimation {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>