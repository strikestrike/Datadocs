<script lang="ts">
  import Icon from "../../../../common/icons/Icon.svelte";

  export let closeMenuCallback: () => void;
</script>

<div class="pro-tip-menu w-[290px] pt-2 pb-3">
  <div class="flex flex-row items-center justify-between px-3 pb-2">
    <div
      class="uppercase text-13px font-semibold text-[#C418FF] text-opacity-80"
    >
      Pro Tip
    </div>
    <button on:click={closeMenuCallback}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9.99911 18.9592C8.22737 18.9592 6.49542 18.4338 5.02226 17.4495C3.54911 16.4651 2.40093 15.0661 1.72291 13.4292C1.0449 11.7923 0.867497 9.99113 1.21315 8.25343C1.5588 6.51573 2.41197 4.91955 3.66479 3.66674C4.9176 2.41393 6.51378 1.56075 8.25148 1.2151C9.98918 0.86945 11.7904 1.04685 13.4272 1.72487C15.0641 2.40288 16.4632 3.55107 17.4475 5.02422C18.4318 6.49737 18.9572 8.22932 18.9572 10.0011C18.9552 12.3763 18.0107 14.6536 16.3312 16.3332C14.6517 18.0127 12.3743 18.9571 9.99911 18.9592ZM9.99911 2.2925C8.47446 2.2925 6.98405 2.74462 5.71636 3.59169C4.44867 4.43876 3.46065 5.64273 2.87723 7.05135C2.29382 8.45996 2.14122 10.0099 2.43873 11.5053C2.73625 13.0006 3.47051 14.3742 4.54867 15.4522C5.62683 16.5302 7.00045 17.2643 8.49583 17.5616C9.99121 17.859 11.5412 17.7062 12.9497 17.1226C14.3583 16.539 15.5621 15.5508 16.409 14.283C17.2559 13.0152 17.7079 11.5248 17.7077 10.0001C17.7059 7.95631 16.8932 5.99672 15.4479 4.55162C14.0026 3.10652 12.0429 2.29401 9.99911 2.2925Z"
          fill="white"
        />
        <path
          d="M7.64057 12.9846C7.55839 12.9849 7.47698 12.9688 7.4011 12.9372C7.32523 12.9056 7.2564 12.8593 7.19866 12.8008C7.08263 12.6832 7.01758 12.5246 7.01758 12.3594C7.01758 12.1941 7.08263 12.0356 7.19866 11.9179L11.9158 7.20078C11.9729 7.139 12.0419 7.08938 12.1186 7.05489C12.1953 7.02041 12.2782 7.00178 12.3623 7.00012C12.4465 6.99846 12.53 7.0138 12.6081 7.04522C12.6861 7.07665 12.757 7.1235 12.8165 7.18299C12.8759 7.24247 12.9228 7.31336 12.9542 7.39139C12.9856 7.46942 13.001 7.553 12.9993 7.6371C12.9977 7.72121 12.979 7.80411 12.9446 7.88085C12.9101 7.95758 12.8605 8.02655 12.7987 8.08364L8.08247 12.8008C8.0252 12.8599 7.95646 12.9067 7.88048 12.9383C7.80449 12.9699 7.72286 12.9856 7.64057 12.9846Z"
          fill="white"
        />
        <path
          d="M12.3577 12.9844C12.2755 12.9847 12.1941 12.9686 12.1182 12.937C12.0424 12.9055 11.9736 12.8591 11.9158 12.8006L7.19867 8.08443C7.08147 7.96723 7.01562 7.80827 7.01562 7.64253C7.01562 7.47678 7.08147 7.31782 7.19867 7.20062C7.31587 7.08342 7.47483 7.01758 7.64057 7.01758C7.80632 7.01758 7.96528 7.08342 8.08248 7.20062L12.7987 11.9178C12.9147 12.0354 12.9798 12.194 12.9798 12.3592C12.9798 12.5244 12.9147 12.683 12.7987 12.8006C12.741 12.859 12.6724 12.9053 12.5967 12.9368C12.521 12.9684 12.4397 12.9846 12.3577 12.9844Z"
          fill="white"
        />
      </svg>
    </button>
  </div>

  <div class="key-item">
    <div class="item-icon">
      <Icon icon="table-column-style" size="20px" />
    </div>

    <div class="item-content">
      Hold
      <div class="inline-block w-4.5 h-4.5 p-px rounded-sm bg-dark-100">
        <Icon icon="key-cmd" size="16px" fill="none" />
      </div>
      while clicking a style or format to apply it to the entire column.
    </div>
  </div>

  <!-- <div class="block">
    <div class="my-2.5 border-b border-solid border-dark-100" />
  </div>

  <div class="key-item">
    <div class="item-icon">
      <Icon icon="table-row-style" size="20px" />
    </div>

    <div class="item-content">
      Hold
      <div class="inline-block w-4.5 h-4.5 p-px rounded-sm bg-dark-50">
        <Icon icon="key-shift" size="16px" />
      </div>
      while clicking a style or format to apply it to the entire row.
    </div>
  </div> -->
</div>

<style lang="postcss">
  .pro-tip-menu * {
    @apply select-text;
  }

  .key-item {
    @apply flex flex-row items-center px-3 py-1 text-12px font-normal;
  }

  .item-icon {
    @apply w-5 h-5 flex-shrink-0 flex-grow-0 rounded-sm bg-light-100 text-dark-100;
  }

  .item-content {
    @apply flex-shrink flex-grow pl-2 pr-1;
    text-align: left !important;
  }

  .item-content :global(svg) {
    @apply inline;
  }
</style>
