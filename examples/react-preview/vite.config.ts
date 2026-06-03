import { toolbarVite } from "@riff-refine/belt/vite";
import { defineConfig } from "vite";
import toolbarConfig from "./toolbar.config";

export default defineConfig({
  plugins: [
    toolbarVite(toolbarConfig),
  ],
});
