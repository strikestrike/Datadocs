<script lang="ts">
  import { DropdownWrapper } from "../../common/dropdown";
  import ProfileDropdown from "./dropdowns/MenuRight/ProfileDropdown.svelte";
  import checkMobileDevice from "../../common/is-mobile";
  import { getUserAvatarChar, userInformationStore } from "../../../api/store";

  let avatar = "";
  let showDropdown = false;
  const isMobile = checkMobileDevice();

  function toggleDropdownActive(value?: boolean) {
    if (typeof value === "undefined") {
      showDropdown = !showDropdown;
    } else {
      showDropdown = value;
    }
  }

  function handleButtonMouseDown() {
    toggleDropdownActive();
  }

  $:if ($userInformationStore) {
    avatar = getUserAvatarChar();
  }
</script>

<DropdownWrapper
  bind:show={showDropdown}
  distanceToDropdown={8}
  closeOnMouseDownOutside={true}
  alignment="right"
>
  <div
    class="flex flex-row items-center"
    class:mobile={isMobile}
    on:mousedown={handleButtonMouseDown}
    slot="button"
  >
    <div class="avatar flex items-center rounded-sm overflow-hidden">
      <div class="w-full text-14px text-white text-center font-semibold">
        {avatar}
      </div>
    </div>
  </div>

  <ProfileDropdown slot="content" />
</DropdownWrapper>

<style lang="postcss">
  .avatar {
    box-sizing: border-box;
    background-color: #3bc7ff;
    width: 21px;
    height: 21px;
    min-width: 21px;
    cursor: pointer;
  }

  .mobile .avatar {
    width: 26px;
    height: 26px;
    min-width: 26px;
  }
</style>
