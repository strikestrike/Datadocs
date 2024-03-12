<script lang="ts">
  import { onMount } from "svelte";

  let chartCanvas = null;

  export let objectData: any = null;
  export let onObjectChange = (gridObject) => {};

  let chartData = null;

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

  function drawChart(data) {
    // Sample Chart
    if (chartCanvas !== null) {
      const ctx = chartCanvas.getContext("2d");

      const sum = 0;
      const totalNumberOfPeople = data.reduce(
        (sum, { total }) => sum + total,
        0
      );
      let currentAngle = 0;

      for (const moodValue of data) {
        //calculating the angle the slice (portion) will take in the chart
        const portionAngle =
          (moodValue.total / totalNumberOfPeople) * 2 * Math.PI;
        //drawing an arc and a line to the center to differentiate the slice from the rest
        ctx.beginPath();
        ctx.arc(100, 100, 100, currentAngle, currentAngle + portionAngle);
        currentAngle += portionAngle;
        ctx.lineTo(100, 100);
        //filling the slices with the corresponding mood's color
        ctx.fillStyle = moodValue.shade;
        ctx.fill();
      }
    }
  }

  onMount(() => {
    if (chartData !== null) {
      drawChart(chartData);
    } else {
      objectData.config = objectData.config || {};
      objectData.config.chartData = getChartData();
      onObjectChange(objectData);
      drawChart(objectData.config.chartData);
    }

  });

  $: {
    chartData = objectData.config?.chartData || null;
  }
</script>

<div class="object-chart">
  <h3 class="object-chart-label">{objectData.label}</h3>
  <div class="object-chart-chart">
    <canvas width="200" height="200" bind:this={chartCanvas} />
  </div>
</div>

<style lang="postcss">
  .object-chart {
    @apply px-3 py-0.5 bg-white border border-solid border-gray-300 rounded-lg;
    width: auto;
    height: auto;
  }

  .object-chart-label {
    @apply my-2;
  }

  .object-chart-chart {
    @apply my-1;
    width: 200px;
    height: 200px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
