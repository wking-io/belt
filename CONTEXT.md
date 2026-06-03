# Toolbar

Toolbar is a dev-only package family for adding installable tools to an application through a shared in-app toolbar surface.

## Language

**Toolbar Wrapper**:
The host surface that mounts installable dev tools inside an application.
_Avoid_: React toolbar, worktree switcher

**Toolbar Shell**:
The shared UI frame owned by the **Toolbar Wrapper**, including global trigger, panel, navigation, slots, and theme boundary.
_Avoid_: tool renderer shell, worktree UI

**Tool**:
An installable capability that contributes behavior and optional UI to the **Toolbar Wrapper**.
_Avoid_: Plugin, widget

**Iterations**:
A **Tool** used to show available variants of the same application and open one.
_Avoid_: Worktree switcher, branch picker

**Iteration Provider**:
A Tool-owned source of **Iterations**, such as Git worktrees or prototype overlays.
_Avoid_: Adapter, renderer, package discovery

**Worktree Iteration Provider**:
An **Iteration Provider** that discovers Git worktrees for the same application.
_Avoid_: Worktree Switcher

**Prototype Iteration Provider**:
An **Iteration Provider** that discovers prototype overlays for the same application.
_Avoid_: Vite adapter, URL resolver

**Prototype Overlay Adapter**:
An **Adapter** that connects prototype overlay runtime behavior to a host runtime such as Vite.
_Avoid_: URL resolver, iteration provider

**Worktree Switcher**:
The legacy name for the worktree-backed **Iterations** experience.
_Avoid_: Branch picker

**Control Panel**:
A **Tool** that lets application code define live-editable fieldsets, read current values, and save or switch presets.
_Avoid_: Dial kit, parameter widget, production settings

**Control Field**:
A typed input definition inside a **Control Fieldset**.
_Avoid_: Parameter, knob, dial

**Control Fieldset**:
A named group of **Control Fields** exposed by application code to the **Control Panel**.
_Avoid_: Folder, panel, form

**Control Fieldset ID**:
The stable object key that identifies a **Control Fieldset** across **Control Snapshots**.
_Avoid_: Label, title, generated id

**Active Fieldset**:
The **Control Fieldset** currently selected in the **Control Panel** UI.
_Avoid_: Active panel, active group, selected folder

**Control Field ID**:
The stable object key that identifies a **Control Field** within a **Control Fieldset**.
_Avoid_: Label, title, generated id

**Control Snapshot**:
A saved snapshot of values for one **Control Fieldset**.
_Avoid_: Preset, version, theme, config

**Control Snapshot ID**:
The generated stable identifier for a **Control Snapshot**.
_Avoid_: Snapshot name, fieldset id

**Branch Snapshot**:
Creating a new **Control Snapshot** from the current **Active Fieldset** values.
_Avoid_: Duplicate, copy

**Discard Changes**:
Clearing the **Control Draft** for the current **Active Fieldset** and its current base.
_Avoid_: Reset to defaults, delete snapshot

**Snapshot Store**:
The project-local backend storage for **Control Snapshots**.
_Avoid_: Browser storage, source config, database

**Control Draft**:
Browser-local unsaved values for one **Control Fieldset** and one base defaults or **Control Snapshot** selection.
_Avoid_: Snapshot, backend state, project artifact

**Defaults Base**:
The built-in **Control Fieldset** base values from **Control Panel Config**.
_Avoid_: Default snapshot

**Internal Field Default**:
The built-in default value used when a **Control Field** does not declare a default value.
_Avoid_: Missing value, undefined

**Control Config Hash**:
A deterministic identifier for the current **Control Panel Config** shape.
_Avoid_: Version number, timestamp

**Control Session**:
The active editable **Control State**, assembled from fieldset defaults, **Control Snapshots**, and **Control Drafts**.
_Avoid_: Preset session, draft config

**Control State**:
Temporary live values created by **Control Fieldsets** for application experimentation.
_Avoid_: App state, persisted settings, form state

**Control Context**:
The frontend context that exposes load-aware active **Control State** from the **Control Panel** to application code.
_Avoid_: Global store, renderer config

**Control Config Type Inference**:
The TypeScript pattern where application code types **Control Context** values from `typeof` a shared **Control Panel Config**.
_Avoid_: Generated types, hand-written types, runtime-only values

**Control Runtime**:
The renderer-neutral API that manages **Control Fieldsets**, **Control State**, and **Control Snapshots** for the **Control Panel**.
_Avoid_: React hook, renderer adapter

**Control Panel Core**:
The adapter-agnostic implementation of **Control Panel** config, validation, state, snapshots, and Tool routes.
_Avoid_: Remix implementation, React implementation, adapter-specific control panel

**Control Panel Config**:
The frontend-safe **Control Panel**-specific declaration of available **Control Fieldsets**.
_Avoid_: Toolbar Config, renderer config, app settings

**Process Management**:
Starting, stopping, installing for, or supervising development servers.
_Avoid_: Switching

**Backend v1**:
The first backend-only slice of the toolbar platform: **Toolbar Config**, **Toolbar API**, JavaScript **Toolbar Server**, framework backend **Adapters**, and the **Worktree Switcher** backend.
_Avoid_: frontend toolbar implementation, process management

**Remix 3 Component**:
The first UI rendering target for toolbar and tool rendering.
_Avoid_: React package, React component package

**Product Package Name**:
A published package name optimized for user-facing ergonomics rather than internal package taxonomy.
_Avoid_: Workspace Package Name

**Product Facade**:
A user-facing package export surface that re-exports capabilities owned by internal package categories.
_Avoid_: Internal package boundary

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

**Tool Content Renderer**:
A **Renderer** that owns the tool-specific UI inside the **Toolbar Shell**.
_Avoid_: toolbar shell, global launcher

**Rendered Tool Composition**:
The explicit frontend pattern where the host app builds the toolbar by rendering Tool UI as children of the **Toolbar Shell**.
_Avoid_: renderer registry, automatic renderer discovery

**Tool Registration Drift**:
The development-time mismatch where frontend **Rendered Tool Composition** and backend **Tool Registration** do not include the same **Tools**.
_Avoid_: automatic registration, fatal sync requirement

**Tool Renderer Registration**:
The frontend context mechanism used by rendered Tool components to report their Tool identity to the **Toolbar Shell**.
_Avoid_: wrapper metadata component, component static fields

**Tool Identity**:
The stable Tool id exported by a Tool package and reused by backend registration, Tool clients, and Tool renderers.
_Avoid_: user-typed duplicate ids, renderer-owned id

**Renderer Display Props**:
The public component props a **Renderer** exposes for display copy and presentation choices.
_Avoid_: Tool identity, server label

**Component Renderer**:
A **Renderer** that ships actual UI components for a host UI target, not only data-model helpers.
_Avoid_: renderer model only, headless adapter

**Renderer Model**:
A framework-friendly data shape prepared for rendering, without owning the actual UI components.
_Avoid_: component renderer, API response

**Theme**:
The customizable visual contract for **Renderers**, expressed through plain CSS and CSS custom properties.
_Avoid_: styling library, hard-coded styles

**Theme CSS**:
The target-neutral CSS package that defines the **Theme** custom properties and default styles.
_Avoid_: component library, framework CSS

**Theme Registration**:
The optional **Toolbar Config** entry that selects an initial Theme and registers custom partial Themes.
_Avoid_: frontend-only theme registry, automatic theme package scanning

**Default Theme**:
The **Theme** shipped by toolbar packages for apps that do not provide custom styling.
_Avoid_: required design system

**Typography Contract**:
The font family and OpenType feature settings shared by **Theme CSS** and **Renderers**.
_Avoid_: renderer-local font rules

**Internal Component Library**:
The shared component set used by the **Toolbar Wrapper** and Tool **Renderers**.
_Avoid_: third-party component dependency, app design system

**Target Component Library**:
An **Internal Component Library** package for a specific frontend rendering target.
_Avoid_: universal component package, backend adapter

**Tool Client**:
The client-side contract a **Renderer** uses to read from or act on the **Toolbar API**.
_Avoid_: Hard-coded endpoint, fetch helper

**Generated Toolbar Client**:
The Effect HTTP client generated from the shared **Toolbar API** schema for core toolbar protocol routes.
_Avoid_: hand-written path client, per-tool generated client

**Tool Route Helper**:
A typed helper exported by a **Tool** package that uses the shared **Tool Client** to call that Tool's server routes.
_Avoid_: renderer-built URL, per-tool client instance

**Toolbar Client Context**:
The shell-scoped frontend context that owns the single instantiated **Tool Client** used by Tool renderers.
_Avoid_: per-tool clients, per-component client construction, unrelated global singleton

**URL Resolver**:
An **Extension** for the **Worktree Iteration Provider** that computes navigable destinations for worktrees.
_Avoid_: Portless dependency, URL builder

**Destination**:
A navigable local URL exposed by a worktree for an app, service, or documentation site.
_Avoid_: Worktree URL, port

**Tool Registration**:
The explicit **Toolbar Config** entry that selects a **Tool** for a **Toolbar Wrapper**, wrapping the backend **Tool Definition** and optional frontend-safe tool config.
_Avoid_: Auto-discovery, package scanning

**Toolbar Config**:
The explicit configuration module that defines **Tool Registration** for a toolbar instance.
_Avoid_: Plugin manifest, package metadata

**Toolbar Definition**:
A frontend-safe exported value that carries **Tool Registration**, renderer setup, and typed renderer helpers for a toolbar instance.
_Avoid_: Config object, renderer instance

**Toolbar Root**:
The provider component exposed by a **Toolbar Definition** that owns toolbar runtime context for an application subtree.
_Avoid_: Toolbar Shell, panel

**Toolbar Panel**:
The visible **Toolbar Shell** component exposed by a **Toolbar Definition**.
_Avoid_: Provider, root

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
- A **Toolbar Wrapper** owns the **Toolbar Shell**.
- The **Toolbar Shell** provides global launcher, panel, navigation, slots, and the **Theme** boundary.
- A **Toolbar Wrapper** uses **Tool Registration** to determine which **Tools** it hosts.
- A **Toolbar Config** can provide **Tool Registration** for direct JavaScript use or sidecar use.
- A **Toolbar Definition** can provide **Tool Registration** to **Config Discovery**.
- A **Toolbar Definition** can be rendered by application code and can expose typed tool hooks.
- A Remix **Toolbar Definition** exposes route handlers for **Explicit Route Mounting**.
- Server/client route-handler boundaries in product packages are internal packaging concerns, not user-facing import splits.
- A **Toolbar Definition** provides frontend **Control Panel Config** to **Control Panel** Renderers.
- A **Toolbar Definition** only exposes typed tool hooks for registered **Tools**.
- Typed hooks on a **Toolbar Definition** throw clear runtime errors when used outside that rendered **Toolbar Definition**.
- A **Toolbar Definition** exposes `Root` for provider setup and `Panel` for the visible **Toolbar Shell**.
- `Toolbar.Root` is required for typed hooks to read toolbar state in application UI.
- `Toolbar.Root` should wrap the root of the application tree.
- `Toolbar.Root` renders children while tool state loads.
- `Toolbar.Panel` must render under the same `Toolbar.Root` as the application UI that reads typed hooks.
- `Toolbar.Panel` preserves **Rendered Tool Composition** by rendering explicit tool content children.
- Tool renderer components can be exposed on the **Toolbar Definition** for registered **Tools**.
- v1 **Control Panel** renderer component on a **Toolbar Definition** is zero-config.
- Missing rendered tool content for a registered **Tool** produces development **Tool Registration Drift** warnings, not runtime failures.
- The **Control Panel** v1 typed hooks are `useControlPanel()` and `useControlFieldset(id)`.
- **Config Discovery** may find a **Toolbar Config**, but it does not discover **Tools** from installed packages.
- The **Config Package** owns **Config Discovery** and **Module Config** loading.
- v1 **Toolbar Config** files are **Module Config** files.
- Published toolbar packages are **ESM Packages**.
- The v1 **Package Runtime** is Node.js 20 or newer.
- Toolbar is a **Working Name** until the final product identity is chosen.
- v1 workspace packages use private `@repo/*` **Workspace Package Names**.
- Published renderer packages may use ergonomic **Product Package Names** such as `@toolbar/remix` and `@toolbar/react`.
- **Product Facades** may re-export Tool, Renderer, and config helpers so users can import from one package.
- **Product Facades** for different frontend targets should expose consistent public helper names when they support the same capabilities.
- The **Control Panel** ships as part of base product packages such as `@toolbar/remix` and `@toolbar/react`, not as a separate user install.
- **Iterations** is a **Tool**.
- Git worktrees are provided to **Iterations** by the **Worktree Iteration Provider**.
- Prototype overlays are provided to **Iterations** by the **Prototype Iteration Provider**.
- Vite prototype overlay runtime behavior belongs in a **Prototype Overlay Adapter**.
- The **Worktree Switcher** is the legacy name for the worktree-backed **Iterations** experience.
- The **Control Panel** is a **Tool**.
- The **Control Panel** is dev-only and is not a production settings or feature-flag system.
- The **Toolbar Shell** shows the **Control Panel** as one **Tool** entry.
- v1 has one **Control Panel** per **Toolbar Wrapper**.
- **Control Field** UI belongs to framework-specific **Renderers**.
- v1 **Control Field** types are text, number, boolean, select, color, range, vector2, and vector3.
- v1 does not support custom **Control Field** types.
- v1 select **Control Fields** use static options.
- v1 select **Control Field** option values are strings.
- **Control Fields** may omit default values and use **Internal Field Defaults**.
- v1 color **Control Fields** use CSS `oklch(...)` strings without alpha.
- **Internal Field Defaults** are empty string for text, zero for number, false for boolean, `oklch(0% 0 0)` for color, zero for range, zero vectors for vector2 and vector3, and the first option for select.
- v1 number **Control Fields** default to zero and do not define internal min, max, or step constraints.
- v1 range **Control Fields** default to min `0`, max `1`, and step `0.01`.
- v1 rejects invalid **Control Panel Config** instead of silently clamping invalid defaults.
- v1 **Control Field** metadata includes label, description, and unit.
- vector2 **Control Fields** use `{ x, y }` values.
- vector3 **Control Fields** use `{ x, y, z }` values.
- v1 vector2 and vector3 **Control Fields** do not define min, max, or step constraints.
- A **Control Fieldset** contains one or more **Control Fields**.
- A **Control Fieldset ID** identifies a **Control Fieldset** in **Control Panel Config** and **Control Snapshots**.
- A **Control Field ID** identifies a **Control Field** inside its **Control Fieldset**.
- **Control Fieldset IDs** and **Control Field IDs** are distinct from display labels.
- **Control Fieldsets** are declared in shared **Control Panel Config**.
- **Control Panel Config** uses plain fieldset objects and field builder functions.
- **Control Panel Config** declares fieldsets under a `fieldsets` property.
- v1 **Control Panel Config** does not include a panel label.
- v1 **Control Fieldsets** may define label and description metadata.
- v1 **Control Panel Config** may declare zero **Control Fieldsets**.
- `defineControlPanel` validates **Control Fieldset IDs** and **Control Field IDs**.
- **Control Fieldsets** display in **Control Panel Config** declaration order by default.
- The first declared **Control Fieldset** is the default **Active Fieldset** when no persisted active fieldset exists.
- v1 **Control Fieldsets** contain flat **Control Fields** and do not support nested fieldsets.
- **Control Fieldsets** create **Control State** for experimentation rather than exposing existing application state by default.
- The **Control Panel** UI can switch between **Control Fieldsets** by changing the **Active Fieldset**.
- The **Control Panel** UI shows an empty state when no **Control Fieldsets** exist.
- The **Control Runtime** is renderer-neutral.
- **Control Panel Core** owns adapter-agnostic **Control Panel** behavior.
- Framework **Adapters** and product **Renderers** build on **Control Panel Core** rather than reimplementing **Control Panel** behavior.
- The frontend **Control Runtime** owns live **Control Session** values while the user edits controls.
- The backend owns **Control Panel Config** and persisted **Control Snapshots**.
- The backend persists active IDs for **Active Fieldset** and active **Control Snapshot** selection per **Control Fieldset** across reloads.
- The backend learns active IDs from frontend **Control Panel** selection updates.
- Backend **Control Panel** state update routes validate **Control Fieldset IDs** against **Control Panel Config**.
- Backend **Control Panel** state update routes validate **Control Snapshot IDs** against the **Snapshot Store** and their **Control Fieldset ID**.
- Frontend **Control Runtime** sanitizes stale persisted active IDs before creating **Control Context**.
- Frontend **Control Runtime** posts sanitized active IDs back to the backend after stale persisted state is corrected.
- The frontend persists unsaved **Control Draft** values per **Control Fieldset** and base defaults or **Control Snapshot** selection for same-user reload continuity.
- Switching **Active Fieldset** restores that fieldset's matching **Control Draft** when one exists.
- Switching a **Control Fieldset** between **Defaults Base** and **Control Snapshots** preserves drafts for other bases.
- Switching a **Control Fieldset** between **Defaults Base** and **Control Snapshots** restores the matching **Control Draft** for the newly selected base when one exists.
- A **Control Draft** is restored only when its **Control Config Hash**, **Control Fieldset ID**, and base defaults or **Control Snapshot** still match the current session.
- A stale **Control Draft** is discarded instead of overlaid onto changed **Control Panel Config** or changed **Control Snapshot** data.
- If backend **Control Snapshot** loading fails, only **Control Drafts** based on **Defaults Base** may be applied.
- **Control Panel** Renderers provide framework-specific developer experience over the **Control Runtime**.
- **Control Panel** Renderers receive **Control Panel Config** from the **Toolbar Definition** before providing active **Control State**.
- Applications read the whole active **Control State** value tree through read-only **Control Context**.
- **Control Context** applies all matching per-fieldset **Control Drafts** to the active value tree.
- **Control Context** is status-aware and does not expose active values until it is ready.
- **Control Panel** v1 typed hooks use `status: "loading" | "ready"` as their discriminant.
- **Control Panel** v1 typed hooks expose optional errors alongside ready values instead of blocking value reads.
- v1 application-facing **Control Panel** hooks expose values, not active IDs or dirty state.
- **Control Context** values are typed through **Control Config Type Inference**.
- v1 application code cannot mutate **Control State** or **Control Snapshots** through **Control Context**.
- The **Control Panel** UI shows retry affordances when backend persistence is unavailable.
- Backend persistence failures do not prevent local live editing or application reads of fallback **Control State**.
- **Active Fieldset** affects **Control Panel** UI navigation, not which values **Control Context** exposes.
- Multiple **Control Fieldsets** may each have their own active **Control Snapshot** at the same time.
- A **Control Session** may contain unsaved live edits without an active **Control Snapshot**.
- A **Control Session** tracks whether active **Control State** differs from its starting defaults or **Control Snapshot**.
- **Defaults Base** is not a **Control Snapshot** and cannot be overwritten by save changes.
- Returning to **Defaults Base** is done by selecting it as the current base, not by a separate reset action.
- The **Control Panel** stores **Control Snapshots** through the **Toolbar API**, not renderer-local browser state.
- v1 **Control Snapshots** are local development artifacts stored in a project-local ignored **Snapshot Store**.
- **Control Snapshot** names are unique per **Control Fieldset**.
- **Control Snapshot IDs** identify **Control Snapshots** independently from their names.
- v1 **Control Snapshot** actions are save changes, branch snapshot, discard changes, and delete snapshot.
- v1 **Control Snapshot** actions apply only to the **Active Fieldset**.
- **Branch Snapshot** creates a new **Control Snapshot** from the current **Active Fieldset** values.
- **Branch Snapshot** is the only action that creates a **Control Snapshot** from **Defaults Base**.
- Save changes is unavailable for **Defaults Base**.
- **Discard Changes** clears the **Control Draft** for the **Active Fieldset** and current base without changing the base.
- **Discard Changes** on **Defaults Base** restores current **Control Field** defaults for the **Active Fieldset**.
- Successful **Control Snapshot** save or branch actions clear only the **Control Draft** for the **Active Fieldset** and previous base.
- Deleting a **Control Snapshot** clears browser-local **Control Drafts** based on that **Control Snapshot**.
- Deleting an active **Control Snapshot** switches that **Control Fieldset** to **Defaults Base**.
- A **Control Snapshot** stores values for exactly one **Control Fieldset** at save time.
- Loading a **Control Snapshot** overlays saved values onto its **Control Fieldset** in the current **Control Panel Config**.
- Missing saved **Control Fields** use current defaults when a **Control Snapshot** is loaded.
- Unknown saved **Control Fields** are ignored when a **Control Snapshot** is loaded.
- Saved **Control Fields** with incompatible current types use current defaults when a **Control Snapshot** is loaded.
- **Control Snapshots** for removed **Control Fieldsets** are not deleted automatically.
- A **Tool** may define extension points implemented by **Extensions**.
- An **Adapter** connects the toolbar platform to a specific runtime or host framework.
- The **Remix Adapter** is distinct from the **Vite Adapter**.
- The **Remix Adapter** uses **Explicit Route Mounting**.
- The **Vite Adapter** connects the **Toolbar Server** to Vite middleware and restores the **Toolbar API** path before forwarding requests.
- Non-JavaScript frameworks should prefer a **Sidecar Adapter** before native reimplementation.
- A **Renderer** displays toolbar or tool UI in a specific UI model.
- Frontend v1 should ship **Component Renderers**, not only **Renderer Models**.
- **Tool Content Renderers** own tool-specific content and states inside the **Toolbar Shell**.
- Frontend v1 uses **Rendered Tool Composition** instead of renderer maps, wrapper metadata components, or automatic renderer discovery.
- Host apps own keeping **Rendered Tool Composition** aligned with backend **Tool Registration**.
- **Tool Registration Drift** should produce development warnings, not automatic registration or hard runtime coupling.
- **Tool Renderer Registration** lets Tool components report their identity to the **Toolbar Shell** while remaining direct rendered children.
- **Tool Identity** should be exported by the Tool package and reused across server and client code so host apps do not manually duplicate ids.
- Host apps should not be able to change a Tool's canonical **Tool Identity** when using the default Tool backend or renderer.
- Display copy belongs to **Renderer Display Props**, not **Tool Identity**.
- Backend Tool metadata should expose machine identity and routes, not display labels.
- A **Renderer** uses the **Tool Client** instead of owning **Toolbar API** paths or response shapes.
- The default **Tool Client** should use a **Generated Toolbar Client** for core **Toolbar API** routes.
- The **Toolbar Shell** owns a **Toolbar Client Context** that provides one **Tool Client** to rendered Tool components.
- The **Toolbar Shell** creates a default **Tool Client** when the host app does not provide one.
- Host apps may provide a custom **Tool Client** for tests, custom fetch behavior, alternate base paths, proxies, or SSR.
- Tool renderers should read the single **Tool Client** from the **Toolbar Client Context** instead of constructing clients independently.
- Tool packages may expose **Tool Route Helpers** over the **Tool Client**, but they should not instantiate separate clients.
- **Tool Route Helpers** own Tool-specific request/response schemas and hide open-ended Tool route paths from Renderers.
- The **Toolbar Shell** may fetch global **Toolbar API** metadata for drift warnings; Tool-specific data still belongs to Tool **Renderers** using the shared **Tool Client**.
- **Renderers** use the **Theme** for visual styling.
- **Theme CSS** is target-neutral because it is plain CSS and CSS custom properties.
- **Theme Registration** belongs in **Toolbar Config**.
- Omitting **Theme Registration** defaults to system preference.
- Custom Themes may be partial and inherit from built-in or registered Themes.
- Theme color variables should use OKLCH values or OKLCH color mixing.
- Theme color variables use elevation, foreground, border, focus, and intent/control families instead of background/surface tokens.
- The default **Typography Contract** uses package-managed Geist Pixel Square from `geist`.
- The **Default Theme** is optional and can be customized or replaced by the host app.
- The **Internal Component Library** provides the preferred building blocks for **Renderers** and downstream Tools.
- Each supported frontend rendering target should have a **Target Component Library**.
- The Remix **Target Component Library** uses the Remix 3 UI component model from `@remix-run/ui`, not React.
- The Remix **Target Component Library** should prefer thin wrappers over Remix UI behavior primitives.
- Style-only primitives in the Remix **Target Component Library** should be mixins, not components.
- Text, badge, icon, gap, and radius styling should be expressed as Remix UI mixins.
- The Remix **Target Component Library** should not include a `Stack` component; layout should use ordinary host elements and mixins.
- The Remix `Panel` primitive always renders outer and inner elements.
- Remix button primitives have one compact control size for toolbar usage.
- Full combobox behavior belongs in the Remix **Target Component Library**.
- Downstream Tools should prefer the **Internal Component Library** when it has a component for the UI need.
- Custom components may still participate in the **Theme** by using the same CSS custom properties.
- The **Worktree Iteration Provider** uses a **URL Resolver** to determine each worktree's **Destinations**.
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

> **Dev:** "Should frontend v1 only export renderable data models?"
> **Domain expert:** "No — frontend v1 should ship **Component Renderers** with actual Remix 3-compatible UI components."

> **Dev:** "Should each Tool renderer own its own launcher and panel?"
> **Domain expert:** "No — the **Toolbar Shell** owns shared launcher and panel behavior; **Tool Content Renderers** own tool-specific content."

> **Dev:** "How does a host app register frontend Tool UI?"
> **Domain expert:** "By using **Rendered Tool Composition**: render Tool UI as children of the **Toolbar Shell** with standard component composition."

> **Dev:** "Should every Tool UI be wrapped in a metadata component like `<ToolbarTool id label>`?"
> **Domain expert:** "No — Tool UI should be rendered directly as children; the host app owns keeping frontend and backend Tool lists aligned."

> **Dev:** "What happens if frontend Tool UI and backend Tool Registration drift?"
> **Domain expert:** "Show a development warning for **Tool Registration Drift**, but do not make the shell auto-register or hard-fail."

> **Dev:** "How does the **Toolbar Shell** know which Tool components were rendered?"
> **Domain expert:** "Rendered Tool components use **Tool Renderer Registration** through shell context; avoid wrapper metadata components and static component introspection."

> **Dev:** "Should host apps type the same Tool id in server config and frontend composition?"
> **Domain expert:** "No — the Tool package should export **Tool Identity** reused by backend registration, Tool clients, and Tool renderers."

> **Dev:** "Should **Tool Identity** include the display label?"
> **Domain expert:** "No — **Tool Identity** is only the stable id; display copy belongs to **Renderer Display Props**."

> **Dev:** "Should backend Tool metadata include display labels?"
> **Domain expert:** "No — backend Tool metadata should expose machine identity and routes; display labels belong to **Renderer Display Props**."

> **Dev:** "Should a **Renderer** hard-code `/__toolbar/tools/worktrees`?"
> **Domain expert:** "No — a **Renderer** should use the **Tool Client** exported by the **Tool**."

> **Dev:** "Who owns Tool client instances?"
> **Domain expert:** "The **Toolbar Shell** owns a **Toolbar Client Context** that provides one shared **Tool Client** to Tool renderers."

> **Dev:** "Does the host app have to create the **Tool Client**?"
> **Domain expert:** "No — the **Toolbar Shell** creates a default client, but host apps may pass a custom client for tests, custom fetch behavior, alternate base paths, proxies, or SSR."

> **Dev:** "Should Tool UIs bring their own styling framework?"
> **Domain expert:** "No — use plain CSS and CSS custom properties through the shared **Theme**."

> **Dev:** "Where are custom Themes registered?"
> **Domain expert:** "In **Toolbar Config** through **Theme Registration**; custom Themes are partial and inherit from a built-in or registered Theme."

> **Dev:** "Should theme CSS be bundled into the first component library?"
> **Domain expert:** "No — **Theme CSS** should be target-neutral, while component libraries are target-specific."

> **Dev:** "Should downstream Tools invent components before checking shared components?"
> **Domain expert:** "No — they should prefer the **Internal Component Library** and only roll custom components when the shared library does not cover the need."

> **Dev:** "Should there be one universal component package for every frontend target?"
> **Domain expert:** "No — each supported frontend rendering target should have a **Target Component Library**."

> **Dev:** "Is the first **Target Component Library** a React package?"
> **Domain expert:** "No — the Remix renderer should use Remix 3 UI components from `@remix-run/ui`, not React."

> **Dev:** "Should style-only primitives like text and badge be components?"
> **Domain expert:** "No — use Remix UI mixins when behavior and styling are independent of the underlying host element."

> **Dev:** "Should layout use a shared `Stack` component?"
> **Domain expert:** "No — use ordinary host elements, CSS, and mixins for layout."

> **Dev:** "Should the Remix renderer wrap all of Remix UI heavily?"
> **Domain expert:** "No — prefer thin wrappers over Remix UI behavior primitives and export shared mixins for custom composition."

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
- Frontend v1 should produce **Component Renderers**, not only **Renderer Models**.
- The **Toolbar Shell** owns shared composition, while **Tool Content Renderers** own tool-specific UI.
- Frontend Tool UI should be composed directly as rendered children through **Rendered Tool Composition**, not passed through renderer maps, wrapper metadata components, or discovered from packages.
- The host app owns consistency between frontend **Rendered Tool Composition** and backend **Tool Registration**.
- **Tool Registration Drift** should be warned about in development.
- Use **Tool Renderer Registration** for drift detection, not wrapper metadata components or component static fields.
- **Tool Identity** must be canonical and package-owned to avoid user-created id drift between backend and frontend.
- **Tool Identity** should not include display labels; **Renderer Display Props** own display copy.
- Backend Tool metadata should remove display labels before frontend v1.
- Tool-specific server calls should use the single **Tool Client** from the **Toolbar Client Context**.
- The shared **Tool Client** should use a **Generated Toolbar Client** for core protocol calls where the route is part of the shared **Toolbar API** schema.
- Tool packages may provide **Tool Route Helpers** for the shared **Tool Client**, but frontend v1 should not create per-tool client instances.
- **Tool Route Helpers** should own Tool-specific schemas and route names so Tool renderers do not hard-code Toolbar API paths.
- The **Toolbar Shell** should support both default **Tool Client** creation and host-provided client override.
- **Renderers** use **Tool Clients** and do not own tool API contracts.
- **Renderers** should use plain CSS and CSS custom properties through the **Theme**.
- **Theme Registration** should live in **Toolbar Config**, support `system` as the default, and allow custom partial Themes.
- Theme colors should use OKLCH values or OKLCH color mixing.
- V1 Theme tokens should use elevation, foreground, border, focus, and intent/control families; background/surface, selected/highlight, and shadow tokens are deferred.
- **Theme CSS** should be target-neutral and reusable across frontend rendering targets.
- A **Default Theme** should ship with the package, but host apps may customize it.
- The **Internal Component Library** is the preferred UI vocabulary for downstream Tools.
- Shared components should be packaged per frontend rendering target as **Target Component Libraries**.
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
