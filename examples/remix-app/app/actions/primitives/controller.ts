import type { Controller } from "remix/fetch-router";
import { createElement } from "remix/ui";
import { renderPage } from "../../render.ts";
import { routes } from "../../routes.ts";
import { PrimitivesEntry } from "../../client.ts";
import { layout } from "../../ui/layout.ts";

export default {
  actions: {
    index() {
      return renderPage(
        layout({
          title: "Belt Remix Primitives",
          children: createElement(PrimitivesEntry),
        }),
      );
    },
  },
} satisfies Controller<typeof routes.primitives>;
