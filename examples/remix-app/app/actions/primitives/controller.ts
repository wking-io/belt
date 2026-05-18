import type { Controller } from "remix/fetch-router";
import { renderPage } from "../../render.ts";
import { routes } from "../../routes.ts";
import { IndexPage } from "./index-page.ts";

export default {
  actions: {
    index() {
      return renderPage(IndexPage());
    }
  }
} satisfies Controller<typeof routes.primitives>;
