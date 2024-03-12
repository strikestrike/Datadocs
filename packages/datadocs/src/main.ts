import "gridstack/dist/gridstack.min.css";
import "virtual:windi.css";
import "./styles/main.css";

import App from "./App.svelte";
import { listenToAuthStateChanged } from "./api";

listenToAuthStateChanged();

const app: App = new App({
  target: document.querySelector("#app"),
});

export default app;
