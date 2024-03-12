<script lang="ts">
  import Button from "../../../../common/form/Button.svelte";
  import { userInformationStore, getUserAvatarChar } from "../../../../../api/store";
  import { signOut, getSignOutUrl } from "../../../../../api";

  let userName: string = "";
  let email: string = "";
  let avatarChar: string = "";

  async function onSignOut() {
    const success = await signOut();
    if (success) {
      // redirect to sign out page to log out at auth site
      location.replace(getSignOutUrl());
    }
  }

  $: userInfo = $userInformationStore;
  $: if (userInfo) {
    userName = [userInfo.firstName, userInfo.lastName].join(" ");
    email = userInfo.email;
    avatarChar = getUserAvatarChar();
  }
</script>

<div
  class="profile-menu default-dropdown-box-shadow h-[inherit] overflow-y-auto overflow-x-hidden bg-white rounded"
>
  <div class="pl-5 pr-4 py-4 w-[270px] max-w-[270px]">
    <div class="flex flex-row justify-start space-x-3">
      <div class="avatar flex items-center rounded overflow-hidden">
        <div
          class="w-full text-white text-center font-semibold"
          style="font-size: 22px"
        >
          {avatarChar}
        </div>
      </div>

      <div class="overflow-hidden whitespace-nowrap">
        <div class="ellipsis h-5 text-13px font-semibold">
          {userName}
        </div>

        <div class="ellipsis h-[17px] text-11px font-normal text-[#A7B0B5]">
          {email}
        </div>

        <div class="mt-3 h-[17px] text-11px font-medium text-[#3BC7FF]">
          My account
        </div>

        <div class="mt-2 h-[17px] text-11px font-medium text-[#3BC7FF]">
          Contact Support
        </div>

        <div class="mt-3">
          <Button
            class="px-3 py-1.5 text-11px font-medium rounded-[3px]"
            color="secondary"
            type="button"
            on:click={onSignOut}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>

<style lang="postcss">
  .avatar {
    box-sizing: border-box;
    background-color: #3bc7ff;
    width: 37px;
    height: 37px;
    min-width: 37px;
    cursor: pointer;
  }

  .profile-menu :global(*) {
    user-select: text;
  }

  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
