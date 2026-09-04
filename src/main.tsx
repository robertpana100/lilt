import { getAppearanceStore } from "./appearance/browser";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles.css";
getAppearanceStore().initialize();

const element = document.getElementById("root");
if (!element) throw new Error("Lilt's root element is missing.");
const root = createRoot(element);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
import.meta.hot?.dispose(() => root.unmount());
