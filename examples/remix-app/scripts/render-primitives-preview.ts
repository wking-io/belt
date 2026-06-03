import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

Object.defineProperty(globalThis.crypto, "randomUUID", {
  configurable: true,
  value: () => "00000000-0000-4000-8000-000000000000"
});

const { router } = await import("../app/router.ts");
const outputPath = fileURLToPath(new URL("../primitive-preview.html", import.meta.url));
const response = await router.fetch(new Request("http://localhost:44100/primitives"));

if (!response.ok) {
  throw new Error(`Failed to render primitive preview: ${response.status} ${response.statusText}`);
}

await writeFile(outputPath, await response.text());
console.log(outputPath);
