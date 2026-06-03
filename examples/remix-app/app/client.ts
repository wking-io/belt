import { clientEntry, createElement, run, type EntryComponent, type Handle } from "remix/ui";
import { PrimitivesContent } from "./actions/primitives/index-page.tsx";

export const clientScriptPath = "/assets/client.js";
export const themeCssPath = "/assets/theme.css";

export const PrimitivesEntry: EntryComponent = clientEntry(
  `${clientScriptPath}#PrimitivesEntry`,
  function PrimitivesEntry(_handle: Handle) {
    return () => createElement(PrimitivesContent);
  }
);

if (typeof document !== "undefined") {
  const runtime = run({
    async loadModule(moduleUrl, exportName) {
      const module = await import(moduleUrl);
      return module[exportName];
    },
    async resolveFrame(src, signal) {
      const response = await fetch(src, signal ? { signal } : undefined);
      return response.text();
    }
  });

  runtime.addEventListener("error", (event) => {
    console.error(event.error);
  });
}
