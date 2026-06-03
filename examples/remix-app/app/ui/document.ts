import { createElement, type RemixNode } from "remix/ui";
import { clientScriptPath, themeCssPath } from "../client.ts";

export function document(options: {
  readonly bodyMix?: unknown;
  readonly children?: RemixNode;
  readonly title: string;
}) {
  return createElement(
    "html",
    { lang: "en" },
    createElement(
      "head",
      undefined,
      createElement("meta", { charSet: "utf-8" }),
      createElement("meta", { content: "width=device-width, initial-scale=1", name: "viewport" }),
      createElement("meta", { content: "light dark", name: "color-scheme" }),
      createElement("title", undefined, options.title),
      createElement("link", { href: themeCssPath, rel: "stylesheet" }),
      createElement("script", { src: clientScriptPath, type: "module" }),
    ),
    createElement("body", { mix: options.bodyMix }, options.children),
  );
}
