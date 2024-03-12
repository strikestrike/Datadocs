<script lang="ts">
  import { onMount } from "svelte";
  import { watchResize } from "svelte-watch-resize";

  import img_pie from "./chart_pie.svg?raw";
  import img_bars from "./chart_bars.svg?raw";

  let element = null;
  const chartCanvas = null;

  let chartData = null;
  let width = 0;
  let height = 0;

  let elements;

  function getRandomCount() {
    return 3000 + Math.round(Math.random() * 9999);
  }

  function getRandomColor() {
    var letters = "0123456789ABCDEF";
    var color = "#";
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color + "40";
  }

  function getChartData() {
    return [
      { mood: "Angry", total: getRandomCount(), shade: getRandomColor() },
      { mood: "Happy", total: getRandomCount(), shade: getRandomColor() },
      {
        mood: "Melancholic",
        total: getRandomCount(),
        shade: getRandomColor(),
      },
      { mood: "Gloomy", total: getRandomCount(), shade: getRandomColor() },
    ];
  }

  function drawChart(data, width, height) {
    // Sample Chart
    if (chartCanvas !== null) {
      const ctx: CanvasRenderingContext2D = (
        chartCanvas as HTMLCanvasElement
      ).getContext("2d");

      const sum = 0;
      const totalNumberOfPeople = data.reduce((sum, { total }) => sum + total, 0);
      let currentAngle = 0;

      ctx.clearRect(0, 0, width, height);

      for (const moodValue of data) {
        //calculating the angle the slice (portion) will take in the chart
        const portionAngle =
          (moodValue.total / totalNumberOfPeople) * 2 * Math.PI;
        //drawing an arc and a line to the center to differentiate the slice from the rest
        ctx.beginPath();
        ctx.arc(120, 120, 120, currentAngle, currentAngle + portionAngle);
        currentAngle += portionAngle;
        ctx.lineTo(120, 120);
        //filling the slices with the corresponding mood's color
        ctx.fillStyle = moodValue.shade;
        ctx.fill();
      }
    }
  }

  function redrawChart() {
    const bounds = element.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    chartData = chartData || getChartData();
    setTimeout(() => {
      drawChart(getChartData(), width, height);
    }, 100);
  }

  function handleResize() {
    // redrawChart();
  }

  onMount(() => {
    // redrawChart();
  });

  $: {
    width = 0;
    height = 0;
    chartData = null;
  }

  $: elements = (Math.round(4 * Math.random()) >= 2 ? img_pie : img_bars)
    .replace(/<svg ([^>]*)>/, "")
    .replace("</svg>", "");
</script>

<div class="panel-graph p-0">
  <!-- <h3 class="panel-graph-label">{graphConfig.label}</h3> -->
  <div
    class="panel-graph-chart"
    bind:this={element}
    use:watchResize={handleResize}
  >
    <!-- <canvas {width} {height} bind:this={chartCanvas} /> -->
    <!-- style={`width:${height}px;width:${height}px`} -->
    <!-- <img
      src={Math.round(4 * Math.random()) >= 2 ? img_pie : img_bars}
      class="dummy-image"
      alt="chart"
    /> -->
    <svg xmlns="http://www.w3.org/2000/svg" class="dummy-image">
      {@html elements}
    </svg>
  </div>
</div>

<style lang="postcss">
  .panel-graph {
    @apply bg-white rounded-lg w-full h-full;
    /* border border-solid border-gray-300  */
  }

  /* .panel-graph-label {
    @apply my-2;
  } */

  .panel-graph-chart {
    @apply w-full h-full flex flex-auto justify-center items-center;
  }

  .dummy-image {
    @apply w-full h-full;
  }
</style>
