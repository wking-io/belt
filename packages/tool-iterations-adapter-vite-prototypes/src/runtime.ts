export type PrototypeOverlayRuntime = {
  current: string;
  prototypes: readonly string[];
  routePrefix: string;
};

export const VIRTUAL_MODULE_ID = "virtual:belt-prototype-overlay";
export const RESOLVED_VIRTUAL_MODULE_ID = "\0virtual:belt-prototype-overlay";

export function createPrototypeRuntimeModule(runtime: PrototypeOverlayRuntime): string {
  return [
    `export const prototypes = ${JSON.stringify(runtime.prototypes)};`,
    `export const routePrefix = ${JSON.stringify(runtime.routePrefix)};`,
    "function getCurrentPrototype() {",
    `  if (typeof window === "undefined") return ${JSON.stringify(runtime.current)};`,
    `  if (!window.location.pathname.startsWith(routePrefix)) return ${JSON.stringify(runtime.current)};`,
    "  const withoutPrefix = window.location.pathname.slice(routePrefix.length);",
    "  const [prototypeName] = withoutPrefix.split(/[/?#]/);",
    `  return prototypeName || ${JSON.stringify(runtime.current)};`,
    "}",
    "export const current = getCurrentPrototype();",
    "export const runtime = { current, prototypes, routePrefix };",
  ].join("\n");
}
