import { readFile } from "node:fs/promises";
import * as http from "node:http";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { createRequestListener } from "remix/node-fetch-server";
import { clientScriptPath, themeCssPath } from "./app/client.ts";
import { createExampleRouter } from "./app/router.ts";

const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 44100;
const router = createExampleRouter();
const themeCssFilePath = fileURLToPath(
  new URL("../../packages/theme-css/src/theme.css", import.meta.url),
);

const server = http.createServer(
  createRequestListener(async (request) => {
    try {
      if (new URL(request.url).pathname === clientScriptPath) {
        return await clientScriptResponse();
      }

      if (new URL(request.url).pathname === themeCssPath) {
        return await themeCssResponse();
      }

      return await router.fetch(request);
    } catch (error) {
      console.error(error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }),
);

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

let shuttingDown = false;

function shutdown() {
  if (shuttingDown) return;

  shuttingDown = true;
  server.close(() => process.exit(0));
  server.closeAllConnections();
}

async function themeCssResponse(): Promise<Response> {
  return new Response(await readFile(themeCssFilePath, "utf8"), {
    headers: {
      "cache-control": "no-store",
      "content-type": "text/css; charset=utf-8",
    },
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function clientScriptResponse(): Promise<Response> {
  const result = await build({
    bundle: true,
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
    },
    entryPoints: [fileURLToPath(new URL("./app/client.ts", import.meta.url))],
    format: "esm",
    platform: "browser",
    sourcemap: "inline",
    write: false,
  });

  const output = result.outputFiles[0]?.text;

  if (!output) {
    return new Response("Client bundle was not generated", { status: 500 });
  }

  return new Response(output, {
    headers: {
      "cache-control": "no-store",
      "content-type": "text/javascript; charset=utf-8",
    },
  });
}
