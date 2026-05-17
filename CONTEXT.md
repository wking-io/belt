# Toolbar

Toolbar is a dev-only package family for adding installable tools to an application through a shared in-app toolbar surface.

## Language

**Toolbar Wrapper**:
The host surface that mounts installable dev tools inside an application.
_Avoid_: React toolbar, worktree switcher

**Tool**:
An installable capability that contributes behavior and optional UI to the **Toolbar Wrapper**.
_Avoid_: Plugin, widget

**Worktree Switcher**:
The first **Tool**, used to move between Git worktrees for the same application.
_Avoid_: Branch picker

**Process Management**:
Starting, stopping, installing for, or supervising development servers.
_Avoid_: Switching

**Backend v1**:
The first backend-only slice of the toolbar platform: **Toolbar Config**, **Toolbar API**, JavaScript **Toolbar Server**, framework backend **Adapters**, and the **Worktree Switcher** backend.
_Avoid_: frontend toolbar implementation, process management

**Remix 3 Component**:
The first UI rendering target for toolbar and tool rendering.
_Avoid_: React package, React component package

**Adapter**:
A package that enables the **Toolbar Server** or toolbar platform to run in a specific language, framework, runtime, or host environment.
_Avoid_: Tool extension, integration

**Remix Adapter**:
An **Adapter** that connects the **Toolbar Server** to a Remix 3 application.
_Avoid_: Vite adapter

**Vite Adapter**:
An **Adapter** that connects the **Toolbar Server** to Vite development middleware.
_Avoid_: Remix adapter, renderer

**Explicit Route Mounting**:
Application code that maps the **Toolbar API** into the host framework's routing system.
_Avoid_: Auto route registration

**Sidecar Adapter**:
An **Adapter** that connects a non-JavaScript host framework to a local toolbar process.
_Avoid_: Native reimplementation

**Extension**:
A package that implements an extension point owned by a specific **Tool**.
_Avoid_: Adapter, plugin

**Renderer**:
A package that displays the **Toolbar Wrapper** or a **Tool** in a specific UI model.
_Avoid_: Adapter, extension

**Tool Client**:
The client-side contract a **Renderer** uses to read from or act on a **Tool**.
_Avoid_: Hard-coded endpoint, fetch helper

**URL Resolver**:
An **Extension** for the **Worktree Switcher** that computes navigable destinations for worktrees.
_Avoid_: Portless dependency, URL builder

**Destination**:
A navigable local URL exposed by a worktree for an app, service, or documentation site.
_Avoid_: Worktree URL, port

**Tool Registration**:
The explicit application code that selects which **Tools** are available in a **Toolbar Wrapper**.
_Avoid_: Auto-discovery, package scanning

**Toolbar Config**:
The explicit configuration module that defines **Tool Registration** for a toolbar instance.
_Avoid_: Plugin manifest, package metadata

**Config Discovery**:
The convention-based lookup that finds a **Toolbar Config** without requiring the host app to pass a path.
_Avoid_: Auto-discovery of tools

**Config Package**:
The package that owns **Config Discovery** and **Module Config** loading.
_Avoid_: Adapter-owned config loading

**Module Config**:
A JavaScript or TypeScript module used as a **Toolbar Config**.
_Avoid_: JSON config, YAML config

**ESM Package**:
A package published as ECMAScript modules only.
_Avoid_: CommonJS package, dual package

**Package Runtime**:
The minimum JavaScript runtime supported by published toolbar packages.
_Avoid_: Example runtime

**Working Name**:
A temporary project or package name used before the final product identity is chosen.
_Avoid_: Published package name

**Workspace Package Name**:
A temporary private package name used inside the pnpm workspace.
_Avoid_: Public package name

**Toolbar API**:
The language-neutral HTTP protocol exposed by the **Toolbar Wrapper** for registered **Tools**.
_Avoid_: Per-tool endpoint, dev endpoint

**Toolbar Protocol Model**:
The shared source of truth for **Toolbar API** paths, schemas, response envelopes, and Effect HTTP API definitions.
_Avoid_: server implementation, adapter implementation

**Toolbar Server**:
The JavaScript Fetch API implementation of the **Toolbar API**.
_Avoid_: Vite plugin, Remix route

**Direct Fetch Server**:
Using the **Toolbar Server** directly from a JavaScript host that already speaks standard `Request` and `Response`.
_Avoid_: Fetch adapter package

## Relationships

- **Backend v1** includes **Toolbar Config**, **Toolbar API**, the JavaScript **Toolbar Server**, backend **Adapters**, and the backend behavior of the **Worktree Switcher**.
- **Backend v1** does not include frontend **Renderers** or **Process Management**.
- A **Toolbar Wrapper** hosts one or more **Tools**.
- A **Toolbar Wrapper** uses **Tool Registration** to determine which **Tools** it hosts.
- A **Toolbar Config** can provide **Tool Registration** for direct JavaScript use or sidecar use.
- **Config Discovery** may find a **Toolbar Config**, but it does not discover **Tools** from installed packages.
- The **Config Package** owns **Config Discovery** and **Module Config** loading.
- v1 **Toolbar Config** files are **Module Config** files.
- Published toolbar packages are **ESM Packages**.
- The v1 **Package Runtime** is Node.js 20 or newer.
- Toolbar is a **Working Name** until the final product identity is chosen.
- v1 workspace packages use private `@repo/*` **Workspace Package Names**.
- The **Worktree Switcher** is a **Tool**.
- A **Tool** may define extension points implemented by **Extensions**.
- An **Adapter** connects the toolbar platform to a specific runtime or host framework.
- The **Remix Adapter** is distinct from the **Vite Adapter**.
- The **Remix Adapter** uses **Explicit Route Mounting**.
- The **Vite Adapter** connects the **Toolbar Server** to Vite middleware and restores the **Toolbar API** path before forwarding requests.
- Non-JavaScript frameworks should prefer a **Sidecar Adapter** before native reimplementation.
- A **Renderer** displays toolbar or tool UI in a specific UI model.
- A **Renderer** uses a **Tool Client** instead of owning tool API paths or response shapes.
- The **Worktree Switcher** uses a **URL Resolver** to determine each worktree's **Destinations**.
- A worktree may have one or more **Destinations**.
- A **Remix 3 Component** is provided by a **Renderer**.
- A **Toolbar API** exposes registered **Tools** under a shared namespace.
- The **Toolbar Protocol Model** lives in the core package and is shared by servers, adapters, clients, and tests.
- The **Toolbar Server** implements the **Toolbar API** for JavaScript Fetch-compatible environments.
- A **Direct Fetch Server** does not require a framework **Adapter**.
- The **Worktree Switcher** does not perform **Process Management** in v1.

## Example dialogue

> **Dev:** "Should the **Worktree Switcher** own the floating UI?"
> **Domain expert:** "No — it should be a **Tool** installed into the **Toolbar Wrapper**, and its UI should be expressed as a **Remix 3 Component**."

> **Dev:** "Can the toolbar run in a future Python or non-Remix environment?"
> **Domain expert:** "Yes — framework and language support belongs in **Adapters**, not in **Tools**."

> **Dev:** "Is the Remix UI for the **Worktree Switcher** an **Adapter**?"
> **Domain expert:** "No — UI packages are **Renderers**; runtime and host-framework packages are **Adapters**."

> **Dev:** "Should a **Renderer** hard-code `/__toolbar/tools/worktrees`?"
> **Domain expert:** "No — a **Renderer** should use the **Tool Client** exported by the **Tool**."

> **Dev:** "Does installing a package make a **Tool** appear automatically?"
> **Domain expert:** "No — the app must add it through **Tool Registration**."

> **Dev:** "Where does a sidecar learn which **Tools** are installed?"
> **Domain expert:** "From the **Toolbar Config**, such as `toolbar.config.ts`."

> **Dev:** "Can the app omit the config path?"
> **Domain expert:** "Yes — **Config Discovery** can find a conventional **Toolbar Config**, but tool selection remains explicit inside that config."

> **Dev:** "Should each **Adapter** load config files itself?"
> **Domain expert:** "No — **Config Discovery** and **Module Config** loading belong in the **Config Package**."

> **Dev:** "Can the **Toolbar Config** be JSON?"
> **Domain expert:** "Not in v1 — it should be a **Module Config** so it can import **Tools** and **Extensions**."

> **Dev:** "Should packages support CommonJS?"
> **Domain expert:** "No — toolbar packages should be **ESM Packages**."

> **Dev:** "Does the Remix 3 example's Node version define every package's runtime?"
> **Domain expert:** "No — published packages target the **Package Runtime**, while examples may require newer runtimes."

> **Dev:** "Is `toolbar` the final npm package scope?"
> **Domain expert:** "No — it is a **Working Name** until naming and publishing are decided."

> **Dev:** "Should internal packages use the final npm scope?"
> **Domain expert:** "No — use private `@repo/*` **Workspace Package Names** until publishing is decided."

> **Dev:** "Should the **Worktree Switcher** expose `/__dev/worktrees`?"
> **Domain expert:** "No — tool HTTP behavior belongs under the **Toolbar API**, such as `/__toolbar/tools/worktrees`."

> **Dev:** "Should Vite own the **Toolbar API**?"
> **Domain expert:** "No — Vite should adapt requests into the framework-neutral **Toolbar Server**."

> **Dev:** "Is the **Toolbar API** a JavaScript API?"
> **Domain expert:** "No — it is a language-neutral HTTP protocol; the **Toolbar Server** is the JavaScript Fetch implementation."

> **Dev:** "Where do shared route paths and response schemas live?"
> **Domain expert:** "In the **Toolbar Protocol Model**, not in framework **Adapters** or individual **Tools**."

> **Dev:** "Do JavaScript hosts need a Fetch adapter package?"
> **Domain expert:** "No — they can use the **Direct Fetch Server** from the **Toolbar Server** package."

> **Dev:** "Can Remix 3 use the Vite adapter?"
> **Domain expert:** "No — Remix 3 applications need a **Remix Adapter** because their current template routes requests through a Fetch API server."

> **Dev:** "Should the **Remix Adapter** create routes automatically?"
> **Domain expert:** "No — Remix 3 apps should use **Explicit Route Mounting** to route `__toolbar` requests to the **Toolbar Server**."

> **Dev:** "Should Rails or Laravel reimplement every **Tool** natively?"
> **Domain expert:** "Not initially — they should prefer a **Sidecar Adapter** that proxies the **Toolbar API** to a local toolbar process."

> **Dev:** "Can the **Worktree Switcher** start another worktree's dev server?"
> **Domain expert:** "No — v1 only switches to worktrees that are already running."

> **Dev:** "Is `portless` required for the **Worktree Switcher**?"
> **Domain expert:** "No — `portless` should be implemented as a **URL Resolver** **Extension**, not as the core worktree dependency."

> **Dev:** "Does each worktree have exactly one URL?"
> **Domain expert:** "No — a worktree may have multiple **Destinations**, such as web, API, and docs apps in a monorepo."

## Flagged ambiguities

- "React UI wrapper" was proposed, but the intended UI target is **Remix 3 Component**.
- "Tool" should not imply JavaScript or UI; language and framework concerns belong in **Adapters**.
- Tool-owned variation points are **Extensions**, not **Adapters**.
- UI packages are **Renderers**, not **Adapters** or **Extensions**.
- **Renderers** use **Tool Clients** and do not own tool API contracts.
- Tool availability is resolved by **Tool Registration**, not automatic package discovery.
- Sidecars should load **Tool Registration** from a **Toolbar Config**.
- **Config Discovery** is allowed for finding the **Toolbar Config**; automatic tool discovery remains out of scope.
- **Config Discovery** and **Module Config** loading belong in the **Config Package**.
- v1 supports **Module Config** files such as `toolbar.config.ts`, `toolbar.config.mts`, `toolbar.config.js`, and `toolbar.config.mjs`.
- **Backend v1** is complete without frontend **Renderers**; frontend planning starts from the **Toolbar API** and **Tool Clients**.
- Published packages should be ESM-only.
- Published packages should support Node.js 20 or newer, even if examples require a newer runtime.
- Package naming and npm scope are deferred because Toolbar is a **Working Name**.
- All workspace packages start private and use `@repo/*` names until the final package identity is chosen.
- Tool HTTP behavior is exposed through the **Toolbar API**, not independent per-tool endpoint names.
- The **Toolbar API** is a language-neutral HTTP protocol, not just a JavaScript interface.
- Shared **Toolbar API** route paths, schemas, envelopes, and Effect HTTP definitions belong in the **Toolbar Protocol Model**.
- The **Toolbar Server** is the JavaScript Fetch API implementation of the **Toolbar API**.
- JavaScript hosts can use the **Direct Fetch Server**; there is no standalone Fetch adapter package.
- Remix 3 support should use the **Remix Adapter**, not assume a Vite development server.
- Vite support should use the **Vite Adapter**, not assume Remix route semantics.
- Remix 3 integration should use **Explicit Route Mounting**, not automatic route registration.
- Non-JavaScript framework support should start with **Sidecar Adapters** before native tool reimplementation.
- **Process Management** is out of scope for the v1 **Worktree Switcher**.
- `portless` is a **URL Resolver** **Extension**, not a hard dependency of the **Worktree Switcher**.
- The **Worktree Switcher** must model multiple **Destinations** per worktree.
