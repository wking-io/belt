# Source-First Workspace Development

Toolbar packages are developed source-first inside the pnpm workspace, while published packages provide built JavaScript and declaration outputs. Workspace examples and package-to-package imports should be able to consume TypeScript source directly during development, matching Remix 3's runtime-oriented style and reducing build friction while package boundaries are still changing.

Published npm artifacts should still expose conventional built files so consumers do not need this repository's development runtime.
