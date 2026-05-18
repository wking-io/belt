import { createElement, css } from "remix/ui";
import { Button, Panel, textStyle } from "@repo/renderer-remix";
import { routes } from "../routes.ts";
import { layout } from "../ui/layout.ts";

const homeContentStyle = css({
  display: "grid",
  gap: "10px",
  padding: "16px"
});

export function HomePage() {
  return layout({
    title: "Belt Remix Example",
    children: createElement(
      Panel,
      undefined,
      createElement(
        "div",
        { mix: homeContentStyle },
        createElement("span", { mix: textStyle({ size: "md", tone: "strong", weight: "semibold" }) }, "Renderer preview app"),
        createElement(
          "span",
          { mix: textStyle({ tone: "subtle" }) },
          "This example follows the Remix bookstore demo shape and renders Belt primitives through real app routes."
        ),
        createElement("a", { href: routes.primitives.index.href() }, createElement(Button, { tone: "primary" }, "Review primitives"))
      )
    )
  });
}
