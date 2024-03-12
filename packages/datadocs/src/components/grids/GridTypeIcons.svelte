<script lang="ts">
  import Icon from "../common/icons/Icon.svelte";

  const typeIcons = [
    "data-type-array-array",
    "data-type-binary",
    "data-type-binary-array",
    "data-type-boolean",
    "data-type-boolean-array",
    "data-type-date",
    "data-type-date-array",
    "data-type-datetime",
    "data-type-datetime-array",
    "data-type-decimal",
    "data-type-decimal-array",
    "data-type-float",
    "data-type-float-array",
    "data-type-geography",
    "data-type-geography-array",
    "data-type-integer",
    "data-type-integer-array",
    "data-type-interval",
    "data-type-interval-array",
    "data-type-json",
    "data-type-json-array",
    "data-type-string",
    "data-type-string-array",
    "data-type-struct",
    "data-type-struct-array",
    "data-type-time",
    "data-type-time-array",
    "data-type-timestamp",
    "data-type-timestamp-array",
    "data-type-variant",
    "data-type-variant-array",
  ];
</script>

<div class="grid-type-icons-container hidden">
  {#each typeIcons as icon}
    <div id={`icon__${icon}`}>
      <Icon {icon} width="26px" height="14px" />
    </div>
  {/each}
</div>
