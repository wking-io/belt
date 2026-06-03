# Package Taxonomy

Toolbar packages are organized around four package categories: **Tools**, **Extensions**, **Adapters**, and **Renderers**. A **Tool** provides a toolbar capability, an **Extension** implements a tool-owned variation point, an **Adapter** connects the toolbar platform to a runtime, framework, language, or host environment, and a **Renderer** displays toolbar or tool UI in a specific UI model.

This separation keeps installable capabilities independent from framework and UI concerns, while still allowing future support for new languages and host environments. The first worktree URL resolver for `portless` is therefore an **Extension** of the worktree provider for the **Iterations** Tool, not a toolbar-wide adapter; Remix UI packages are **Renderers**, not adapters.

Tool-owned provider packages may include `provider` in the package name when a Tool collects records from multiple backend sources. For example, **Iterations** is the Tool, Git worktrees and prototype overlays are providers, `portless` is an Extension inside the worktree provider boundary, and Vite prototype overlay behavior is an Adapter because it changes the Vite module graph.

Package names should include the category noun when the package belongs to one of these categories, such as `@toolbar/tool-iterations`, `@toolbar/tool-iterations-provider-worktrees`, `@toolbar/tool-iterations-provider-worktrees-extension-portless`, `@toolbar/tool-iterations-adapter-vite-prototypes`, `@toolbar/adapter-vite`, and `@toolbar/renderer-remix`. Category names in package names make ownership and dependency direction visible before reading the implementation.
