import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@riff-refine/belt/theme.css";
import "./styles.css";
import { ReactPreviewApp } from "./preview.tsx";

const root = document.getElementById("root");

if (root === null) {
  throw new Error("React preview root element was not found.");
}

createRoot(root).render(
  <StrictMode>
    <ReactPreviewApp />
  </StrictMode>,
);
