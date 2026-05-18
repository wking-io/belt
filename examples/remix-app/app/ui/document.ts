import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement, type RemixNode } from "remix/ui";

const themeCssPath = fileURLToPath(new URL("../../../../packages/theme-css/src/theme.css", import.meta.url));
const themeCss = readFileSync(themeCssPath, "utf8");

const interStylesheetHref =
  "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,100..900&display=swap";

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
      createElement("link", { href: "https://fonts.googleapis.com", rel: "preconnect" }),
      createElement("link", { crossOrigin: "anonymous", href: "https://fonts.gstatic.com", rel: "preconnect" }),
      createElement("link", {
        href: interStylesheetHref,
        rel: "stylesheet"
      }),
      createElement("style", undefined, getThemeCss())
    ),
    createElement("body", { mix: options.bodyMix }, options.children)
  );
}

function getThemeCss() {
  if (process.env.NODE_ENV === "production") return themeCss;

  return readFileSync(themeCssPath, "utf8");
}
