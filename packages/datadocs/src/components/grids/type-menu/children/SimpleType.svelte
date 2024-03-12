<script lang='ts'>
  export let content: string;
  export let hint: string = '';
</script>

<span>{content}{hint ? ` (${hint})` : ''}</span>
