<script lang="ts" context="module">
  let routeBasePath = "";
  getRouteBasePathFromGlobal();
  function getRouteBasePathFromGlobal() {
    const globalContext = window as any;
    const alternative = globalContext.DATADOCS_BASE_PATH;
    if (typeof alternative !== "string" || !alternative.startsWith("/")) return;
    // ensure there never ending '/' characters
    routeBasePath = alternative.replace(/\/*$/, "");
    console.groupCollapsed("AppRouter");
    console.log(`Updated base path for routes to '${routeBasePath}'`);
    console.groupEnd();
  }
  export function getRoutePath(routeTo = ""): string {
    return routeBasePath + routeTo.replace(/^\/*/, "/");
  }
</script>

<script lang="ts">
  import { Route } from "svelte-navigator";
  import PrivateRoute from "./hocs/PrivateRoute.svelte";
  import Login from "./pages/Login.svelte";
  import Datadocs from "./pages/Datadocs.svelte";
  import { routeBasePathStore } from "./app/store/store-ui";
  import DebugComponent from "./components/DebugComponent.svelte";
  routeBasePathStore.set(routeBasePath);
</script>

<style windi:preflights windi:safelist></style>

<PrivateRoute path={getRoutePath("/debug/components")}>
  <DebugComponent />
</PrivateRoute>

<PrivateRoute path={getRoutePath("/:guid")}>
  <Datadocs />
</PrivateRoute>

<PrivateRoute path={getRoutePath("/:owner/:vanitySlug")}>
  <Datadocs />
</PrivateRoute>

<PrivateRoute path={getRoutePath("/*")}>
  <Datadocs />
</PrivateRoute>

<!-- <Route path={getRoutePath("/login")}>
  <Login />
</Route> -->
