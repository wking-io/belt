# Package Taxonomy

Toolbar packages are organized around four package categories: **Tools**, **Extensions**, **Adapters**, and **Renderers**. A **Tool** provides a toolbar capability, an **Extension** implements a tool-owned variation point, an **Adapter** connects the toolbar platform to a runtime, framework, language, or host environment, and a **Renderer** displays toolbar or tool UI in a specific UI model.

This separation keeps installable capabilities independent from framework and UI concerns, while still allowing future support for new languages and host environments. The first worktree URL resolver for `portless` is therefore an **Extension** of the **Worktree Switcher**, not a toolbar-wide adapter; Remix UI packages are **Renderers**, not adapters.

Package names should include the category noun when the package belongs to one of these categories, such as `@toolbar/tool-worktrees`, `@toolbar/tool-worktrees-extension-portless`, `@toolbar/tool-worktrees-renderer-remix`, `@toolbar/adapter-vite`, and `@toolbar/renderer-remix`. Category names in package names make ownership and dependency direction visible before reading the implementation.
