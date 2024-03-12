<script lang="ts">
  /*
  import type {
    NavigateFn,
    NavigatorLocation} from "svelte-navigator";
import {
  useNavigate,
  useLocation
} from "svelte-navigator";
  import type AnyObject from "svelte-navigator/types/AnyObject";
  import type { Readable } from "svelte/store";
  const navigate: NavigateFn = useNavigate();
  const location: Readable<NavigatorLocation<AnyObject>> = useLocation();
  const loggedIn = true;
  if (!loggedIn) {
    navigate("/login", {
      state: { from: $location.pathname },
      replace: true,
    });
  } else if ($location.pathname === "/") {
    // navigate("/visualize", {
    //   state: { from: $location.pathname },
    //   replace: true,
    // });
  }
  */

  import { loginStatusStore, firebaseAuthLoadedStore } from "../api/store";
  import { signIn, getSignInUrl, setCookie } from "../api";

  const useAuth: boolean = true;
  async function handleUserLogin() {
    const url = new URL(window.location.toString());
    let customToken: string;
    if (
      url.searchParams.get("action") === "auth" &&
      (customToken = url.searchParams.get("customToken"))
    ) {
      const dduid = url.searchParams.get('dduid');
      if(dduid) setCookie('dduid', dduid);
      const success: boolean = await signIn(customToken);
      if (success) {
        clearAuthParam();
      }
    } else {
      location.replace(getSignInUrl());
    }
  }

  function clearAuthParam() {
    const url = new URL(window.location.toString());
    url.searchParams.delete('dduid');
    if (url.searchParams.get("action") === "auth") {
      url.searchParams.delete("action");
    }
    url.searchParams.delete("customToken");
    history.replaceState(null, "", url.toString());
  }

  $: isLoggedIn = useAuth ? $loginStatusStore : true;
  $: firebaseAuthLoaded = $firebaseAuthLoadedStore;
  $: if (firebaseAuthLoaded && !isLoggedIn) {
    useAuth && handleUserLogin();
  } else if (isLoggedIn) {
    // Make sure all of auth information is cleaned.
    clearAuthParam();
  }
</script>

{#if firebaseAuthLoaded && isLoggedIn}
  <slot />
{/if}
