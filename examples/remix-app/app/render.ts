import { createHtmlResponse } from "remix/response/html";
import type { RemixNode } from "remix/ui";
import { renderToStream } from "remix/ui/server";

export function renderPage(node: RemixNode, init?: ResponseInit) {
  return createHtmlResponse(renderToStream(node), init);
}
