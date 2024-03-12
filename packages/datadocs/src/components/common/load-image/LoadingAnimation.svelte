<script lang="ts">
  export let delay: number;

  let show = false;

  setTimeout(() => {
    show = true;
  }, delay);
</script>

<div class="dot-pulse" class:opacity-0={!show} />

<style lang="postcss">
  .dot-pulse {
    position: relative;
    left: -9999px;
    width: 6px;
    height: 6px;
    border-radius: 5px;
    background-color: #a7b0b5;
    color: #a7b0b5;
    box-shadow: 9999px 0 0 -5px;
    animation: dot-pulse 1.5s infinite linear;
    animation-delay: 0.25s;
  }
  .dot-pulse::before,
  .dot-pulse::after {
    content: "";
    display: inline-block;
    position: absolute;
    top: 0;
    width: 6px;
    height: 6px;
    border-radius: 5px;
    background-color: #a7b0b5;
    color: #a7b0b5;
  }
  .dot-pulse::before {
    box-shadow: 9984px 0 0 -5px;
    animation: dot-pulse-before 1.5s infinite linear;
    animation-delay: 0s;
  }
  .dot-pulse::after {
    box-shadow: 10014px 0 0 -5px;
    animation: dot-pulse-after 1.5s infinite linear;
    animation-delay: 0.5s;
  }

  @keyframes dot-pulse-before {
    0% {
      box-shadow: 9984px 0 0 -5px;
    }
    30% {
      box-shadow: 9984px 0 0 2px;
    }
    60%,
    100% {
      box-shadow: 9984px 0 0 -5px;
    }
  }
  @keyframes dot-pulse {
    0% {
      box-shadow: 9999px 0 0 -5px;
    }
    30% {
      box-shadow: 9999px 0 0 2px;
    }
    60%,
    100% {
      box-shadow: 9999px 0 0 -5px;
    }
  }
  @keyframes dot-pulse-after {
    0% {
      box-shadow: 10014px 0 0 -5px;
    }
    30% {
      box-shadow: 10014px 0 0 2px;
    }
    60%,
    100% {
      box-shadow: 10014px 0 0 -5px;
    }
  }
</style>
