import { useEffect, useState, type ReactNode } from "react";
import {
  RenderPerformanceInpToolbarItem,
  RenderPerformanceJankPanel,
  RenderPerformanceLayoutShiftToolbarItem,
  RenderPerformanceToolbarItem,
} from "@riff-refine/belt/render-performance";
import type { Iteration } from "@riff-refine/belt/iterations";
import { Iterations } from "@repo/tool-iterations-renderer-react";
import {
  Button,
  Combobox,
  createToolbar,
  Field,
  GhostButton,
  Glyph,
  GlyphSheet,
  Input,
  Label,
  Panel,
  Select,
  Slider,
  StatusBanner,
  Switch,
  Toolbar,
  glyphNames,
  Menu,
  type Elevation,
} from "@repo/renderer-react";

type ThemeMode = "system" | "belt-light" | "belt-dark";
type PreviewPage = "primitives" | "live" | "performance";

type ToolbarApiTool = {
  readonly id: string;
  readonly label: string;
  readonly routes?: readonly string[];
};

type ToolbarApiIndex = {
  readonly apiVersion: number;
  readonly tools: readonly ToolbarApiTool[];
};

type ToolbarApiEnvelope =
  | {
      readonly ok: true;
      readonly data: ToolbarApiIndex;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: string;
        readonly message: string;
      };
    };

type IterationsIndex = {
  readonly iterations: readonly Iteration[];
};

type ControlField =
  | {
      readonly default?: string;
      readonly description?: string;
      readonly label?: string;
      readonly type: "text" | "color";
      readonly unit?: string;
    }
  | {
      readonly default?: number;
      readonly description?: string;
      readonly label?: string;
      readonly type: "number" | "range";
      readonly min?: number;
      readonly max?: number;
      readonly step?: number;
      readonly unit?: string;
    }
  | {
      readonly default?: boolean;
      readonly description?: string;
      readonly label?: string;
      readonly type: "boolean";
      readonly unit?: string;
    }
  | {
      readonly default?: string;
      readonly description?: string;
      readonly label?: string;
      readonly options: readonly { readonly label: string; readonly value: string }[];
      readonly type: "select";
      readonly unit?: string;
    };

type ControlPanelIndex = {
  readonly config: {
    readonly fieldsets: Readonly<
      Record<
        string,
        {
          readonly description?: string;
          readonly fields: Readonly<Record<string, ControlField>>;
          readonly label?: string;
        }
      >
    >;
  };
  readonly state: ControlPanelRouteState;
};

type ControlPanelRouteState = {
  readonly activeBaseByFieldset: Readonly<
    Record<string, { readonly snapshotId?: string; readonly type: string }>
  >;
  readonly activeFieldsetId?: string;
  readonly currentValuesByFieldset: Readonly<
    Record<string, Readonly<Record<string, string | number | boolean>>>
  >;
};

const tones = ["neutral", "primary", "info", "success", "warning", "danger"] as const;
const elevations = [1, 2, 3] as const;
const radii = ["inner", "default", "outer"] as const;
const paletteGroups = [
  "strawberry",
  "ruby",
  "tangerine",
  "ochre",
  "honey",
  "lemon",
  "pear",
  "pistachio",
  "jade",
  "emerald",
  "aqua",
  "ocean",
  "sky",
  "cobalt",
  "denim",
  "iris",
  "grape",
  "lilac",
  "fuchsia",
  "blush",
  "plum",
  "oatmeal",
] as const;
const paletteSteps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const;
const PreviewToolbar = createToolbar({
  tools: [
    {
      tool: {
        id: "iterations",
        label: "Iterations",
      },
    },
    {
      tool: {
        id: "control-panel",
        label: "Control Panel",
      },
    },
    {
      tool: {
        id: "render-performance",
        label: "Render Performance",
      },
    },
  ],
});

export function ReactPreviewApp() {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [page, setPage] = useState<PreviewPage>("primitives");
  const [toolbarEnabled, setToolbarEnabled] = useState(true);
  const [destination, setDestination] = useState("workspace");
  const [branch, setBranch] = useState<string | null>("main");
  const [intensity, setIntensity] = useState(48);
  const themeAttribute = theme === "system" ? undefined : theme;

  return (
    <main className="preview-shell" data-belt-theme={themeAttribute}>
      <GlyphSheet />
      <header className="preview-topbar">
        <div>
          <h1>Belt React Preview</h1>
          <p>Live gallery for every exported React component and the shared theme contract.</p>
        </div>
        <div className="preview-topbar__controls">
          <div className="preview-page-tabs" aria-label="Preview page">
            <GhostButton aria-pressed={page === "primitives"} onClick={() => setPage("primitives")}>
              Primitives
            </GhostButton>
            <GhostButton aria-pressed={page === "live"} onClick={() => setPage("live")}>
              Live toolbar
            </GhostButton>
            <GhostButton
              aria-pressed={page === "performance"}
              onClick={() => setPage("performance")}
            >
              Performance
            </GhostButton>
          </div>
          <div className="preview-theme-tabs" aria-label="Theme">
            <GhostButton
              aria-pressed={theme === "system"}
              icon="expand"
              onClick={() => setTheme("system")}
              title="Use system theme"
            />
            <GhostButton
              aria-pressed={theme === "belt-light"}
              icon="info"
              onClick={() => setTheme("belt-light")}
              title="Use light theme"
            />
            <GhostButton
              aria-pressed={theme === "belt-dark"}
              icon="check"
              onClick={() => setTheme("belt-dark")}
              title="Use dark theme"
            />
          </div>
        </div>
      </header>

      {page === "live" ? (
        <LiveToolbarPreview toolbarEnabled={toolbarEnabled} />
      ) : page === "performance" ? (
        <PerformancePreview />
      ) : (
        <>
          <PreviewSection title="Surfaces">
            <div className="preview-grid preview-grid--three">
              {elevations.map((elevation) => (
                <Panel elevation={elevation} key={elevation}>
                  <div className="preview-card-body">
                    <span className="belt-text" data-emphasis="strong" data-weight="semibold">
                      Elevation {elevation}
                    </span>
                    <span className="belt-text" data-emphasis="subtle" data-size="sm">
                      Panel with default outer radius.
                    </span>
                  </div>
                </Panel>
              ))}
              {radii.map((radius) => (
                <Panel elevation={2} key={radius} radius={radius}>
                  <div className="preview-card-body">
                    <span className="belt-text" data-emphasis="strong" data-weight="semibold">
                      {radius} radius
                    </span>
                    <span className="belt-text" data-emphasis="subtle" data-size="sm">
                      Radius prop on Panel.
                    </span>
                  </div>
                </Panel>
              ))}
            </div>
          </PreviewSection>

          <PreviewSection title="Buttons">
            <div className="preview-grid preview-grid--stacked">
              {elevations.map((elevation) => (
                <Panel elevation={elevation} key={elevation}>
                  <div className="preview-card-body">
                    <PreviewLabel>Elevation {elevation}</PreviewLabel>
                    <ButtonRows elevation={elevation} />
                  </div>
                </Panel>
              ))}
            </div>
          </PreviewSection>

          <PreviewSection title="Status Banners">
            <div className="preview-stack">
              {tones.map((tone) => (
                <StatusBanner.Root key={tone} tone={tone}>
                  <StatusBanner.Row>
                    <StatusBanner.Icon glyph="alert" />
                    <StatusBanner.Message>{tone} status message</StatusBanner.Message>
                    <StatusBanner.Actions>
                      <GhostButton tone={tone}>cancel</GhostButton>
                      <Button tone={tone} icon="check" />
                    </StatusBanner.Actions>
                  </StatusBanner.Row>
                </StatusBanner.Root>
              ))}
            </div>
          </PreviewSection>

          <PreviewSection title="Form Controls">
            <Panel>
              <div className="preview-form-grid">
                <Field>
                  <Label htmlFor="preview-branch">Branch</Label>
                  <Input
                    id="preview-branch"
                    onChange={(event) => setBranch(event.currentTarget.value)}
                    placeholder="feature/react-preview"
                    value={branch ?? ""}
                  />
                </Field>
                <Field>
                  <Label htmlFor="preview-destination">Destination</Label>
                  <Select.Root
                    name="destination"
                    onValueChange={(value) => setDestination(String(value))}
                    value={destination}
                  >
                    <Select.Trigger defaultLabel="Choose destination" />
                    <Select.List>
                      <Select.Option value="workspace">Workspace</Select.Option>
                      <Select.Option value="browser">Browser</Select.Option>
                      <Select.Option value="docs">Docs</Select.Option>
                    </Select.List>
                  </Select.Root>
                </Field>
                <Field className="preview-form-grid__wide">
                  <Slider
                    label="Preview intensity"
                    max={100}
                    min={0}
                    onValueChange={(value) =>
                      setIntensity(Array.isArray(value) ? (value[0] ?? 0) : value)
                    }
                    step={1}
                    unit="%"
                    value={[intensity]}
                  />
                </Field>
                <label className="preview-switch-label">
                  <Switch checked={toolbarEnabled} onCheckedChange={setToolbarEnabled} />
                  <span className="belt-text" data-size="sm">
                    Enable toolbar overlay
                  </span>
                </label>
              </div>
            </Panel>
          </PreviewSection>

          <PreviewSection title="Menus, Selects, Comboboxes">
            <div className="preview-grid">
              <Panel>
                <div className="preview-card-body">
                  <PreviewLabel>Menu</PreviewLabel>
                  <div className="preview-row">
                    <Menu.Root>
                      <Menu.Trigger render={<Button endIcon="chevronDown">Actions</Button>} />
                      <Menu.List>
                        <Menu.Item>Open iteration</Menu.Item>
                        <Menu.Item>Copy URL</Menu.Item>
                        <Menu.Item>Archive</Menu.Item>
                        <Menu.Item>Delete</Menu.Item>
                      </Menu.List>
                    </Menu.Root>
                    <Menu.Root>
                      <Menu.Trigger
                        render={<GhostButton endIcon="chevronDown">More</GhostButton>}
                      />
                      <Menu.List>
                        <Menu.Item>Rename</Menu.Item>
                        <Menu.Item>Duplicate</Menu.Item>
                      </Menu.List>
                    </Menu.Root>
                  </div>
                </div>
              </Panel>
              <Panel>
                <div className="preview-card-body">
                  <PreviewLabel>Select</PreviewLabel>
                  <Select.Root
                    onValueChange={(value) => setDestination(String(value))}
                    value={destination}
                  >
                    <Select.Trigger defaultLabel="Pick a surface" elevation={2} />
                    <Select.List elevation={2}>
                      <Select.Option value="workspace">Workspace</Select.Option>
                      <Select.Option value="browser">Browser</Select.Option>
                      <Select.Option value="docs">Docs</Select.Option>
                    </Select.List>
                  </Select.Root>
                </div>
              </Panel>
              <Panel>
                <div className="preview-card-body">
                  <PreviewLabel>Combobox</PreviewLabel>
                  <Combobox.Root
                    items={["main", "feature/react-preview", "fix/theme-controls"]}
                    onValueChange={(value) => setBranch(value)}
                    value={branch}
                  >
                    <Combobox.Trigger placeholder="Find branch" />
                    <Combobox.List>
                      <Combobox.Option value="main">main</Combobox.Option>
                      <Combobox.Option value="feature/react-preview">
                        feature/react-preview
                      </Combobox.Option>
                      <Combobox.Option value="fix/theme-controls">
                        fix/theme-controls
                      </Combobox.Option>
                    </Combobox.List>
                  </Combobox.Root>
                </div>
              </Panel>
            </div>
          </PreviewSection>

          <PreviewSection title="Glyphs">
            <Panel>
              <div className="preview-glyph-grid">
                {glyphNames.map((name) => (
                  <div className="preview-glyph-cell" key={name}>
                    <Glyph className="belt-icon" data-size="md" name={name} />
                    <span className="belt-text" data-size="xs">
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </PreviewSection>

          <PreviewSection title="Theme Tokens">
            <Panel>
              <div className="preview-palette">
                {paletteGroups.map((group) => (
                  <div className="preview-palette-row" key={group}>
                    <span className="preview-palette-label">{group}</span>
                    <div className="preview-palette-chips">
                      {paletteSteps.map((step) => (
                        <span
                          aria-label={`${group} ${step}`}
                          className="preview-palette-chip"
                          key={step}
                          style={{ backgroundColor: `var(--${group}-${step})` }}
                          title={`${group}-${step}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </PreviewSection>
        </>
      )}

      {toolbarEnabled ? <LiveBeltToolbar /> : null}
    </main>
  );
}

function PerformancePreview() {
  return (
    <PreviewSection title="Render Performance">
      <div className="preview-live-grid">
        <RenderPerformanceJankPanel historySize={60} updateIntervalMs={1000} />
        <Panel>
          <div className="preview-card-body">
            <PreviewLabel>Jank Trigger</PreviewLabel>
            <div className="preview-stack">
              <span className="belt-text" data-emphasis="subtle" data-size="sm">
                Block the main thread for a few animation frames to verify the panel and toolbar
                item catch the spike.
              </span>
              <div className="preview-row">
                <Button onClick={inducePreviewJank} startIcon="alert" tone="warning">
                  Make real jank
                </Button>
              </div>
            </div>
          </div>
        </Panel>
        <Panel>
          <div className="preview-card-body">
            <PreviewLabel>Toolbar Component</PreviewLabel>
            <div className="preview-stack">
              <span className="belt-text" data-emphasis="subtle" data-size="sm">
                The toolbar item below is the same package-owned component rendered in the live
                toolbar.
              </span>
              <div className="preview-row">
                <RenderPerformanceToolbarItem historySize={20} size="compact" />
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </PreviewSection>
  );
}

function inducePreviewJank(): void {
  const blockFrame = (remainingFrames: number) => {
    const end = performance.now() + 180;

    while (performance.now() < end) {
      Math.sqrt(performance.now());
    }

    if (remainingFrames > 1) {
      requestAnimationFrame(() => blockFrame(remainingFrames - 1));
    }
  };

  requestAnimationFrame(() => blockFrame(4));
}

function PreviewSection(props: { readonly children: ReactNode; readonly title: string }) {
  return (
    <section className="preview-section">
      <h2>{props.title}</h2>
      {props.children}
    </section>
  );
}

function PreviewLabel(props: { readonly children: ReactNode }) {
  return (
    <span className="belt-text" data-emphasis="strong" data-size="sm" data-weight="semibold">
      {props.children}
    </span>
  );
}

function ButtonRows(props: { readonly elevation: Elevation }) {
  return (
    <div className="preview-stack">
      <ButtonToneRow elevation={props.elevation} variant="filled" />
      <ButtonToneRow elevation={props.elevation} variant="ghost" />
      <div className="preview-row">
        <Button elevation={props.elevation} loading startIcon="spinner">
          Loading
        </Button>
        <Button disabled elevation={props.elevation} startIcon="close">
          Disabled
        </Button>
        <GhostButton elevation={props.elevation} icon="search" title="Search" />
        <GhostButton disabled elevation={props.elevation} icon="trash" title="Delete" />
      </div>
    </div>
  );
}

function ButtonToneRow(props: {
  readonly elevation: Elevation;
  readonly variant: "filled" | "ghost";
}) {
  return (
    <div className="preview-row">
      {tones.map((tone) =>
        props.variant === "filled" ? (
          <Button elevation={props.elevation} key={tone} startIcon="add" tone={tone}>
            {tone}
          </Button>
        ) : (
          <GhostButton elevation={props.elevation} key={tone} endIcon="chevronRight" tone={tone}>
            {tone}
          </GhostButton>
        ),
      )}
    </div>
  );
}

function LiveToolbarPreview(props: { readonly toolbarEnabled: boolean }) {
  const live = useLiveToolbarData();

  return (
    <>
      <PreviewSection title="Live Toolbar Settings">
        <div className="preview-live-grid">
          <Panel>
            <div className="preview-card-body">
              <PreviewLabel>Toolbar API</PreviewLabel>
              <StatusBanner.Root tone={live.error ? "danger" : "success"}>
                <StatusBanner.Row>
                  <StatusBanner.Icon glyph={live.error ? "alert" : "check"} />
                  <StatusBanner.Message>
                    {live.error ?? `Mounted with ${live.toolbar?.tools.length ?? 0} tools`}
                  </StatusBanner.Message>
                  <StatusBanner.Actions>
                    <GhostButton
                      icon="spinner"
                      onClick={() => void live.refresh()}
                      title="Refresh"
                    />
                  </StatusBanner.Actions>
                </StatusBanner.Row>
              </StatusBanner.Root>
              <div className="preview-toolbar-metadata">
                {(live.toolbar?.tools ?? []).map((tool) => (
                  <div className="preview-toolbar-tool" key={tool.id}>
                    <span className="belt-text" data-emphasis="strong" data-size="sm">
                      {tool.label}
                    </span>
                    <span className="belt-text" data-emphasis="subtle" data-size="xs">
                      {tool.id}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
          <Panel>
            <div className="preview-card-body">
              <PreviewLabel>Live Overlay</PreviewLabel>
              <div className="preview-stack">
                <span className="belt-text" data-size="sm">
                  {props.toolbarEnabled
                    ? "The draggable Belt toolbar is rendered on this page."
                    : "Toolbar overlay is disabled from the primitives form."}
                </span>
                <span className="belt-text" data-emphasis="subtle" data-size="xs">
                  The toolbar reads from the Vite-mounted API at /__toolbar.
                </span>
              </div>
            </div>
          </Panel>
        </div>
      </PreviewSection>

      <PreviewSection title="Iterations">
        <Panel>
          <div className="preview-card-body">
            <PreviewLabel>Discovered Iterations</PreviewLabel>
            <IterationList iterations={live.iterations?.iterations ?? []} />
          </div>
        </Panel>
      </PreviewSection>

      <PreviewSection title="Control Panel">
        <Panel>
          <ControlPanelEditor controlPanel={live.controlPanel} onRefresh={live.refresh} />
        </Panel>
      </PreviewSection>
    </>
  );
}

function LiveBeltToolbar() {
  const live = useLiveToolbarData();

  return (
    <PreviewToolbar.Provider>
      <Toolbar aria-label="Belt toolbar">
        <Toolbar.Body>
          <Toolbar.Left>
            <Iterations initialIterations={live.iterations?.iterations ?? []} />
            <GhostButton size="compact" icon="dial" radius="none" />
          </Toolbar.Left>
          <Toolbar.Right>
            <RenderPerformanceInpToolbarItem historySize={20} radius="none" size="compact" />
            <RenderPerformanceLayoutShiftToolbarItem
              historySize={20}
              radius="none"
              size="compact"
            />
            <RenderPerformanceToolbarItem historySize={20} radius="none" size="compact" />
          </Toolbar.Right>
        </Toolbar.Body>
      </Toolbar>
    </PreviewToolbar.Provider>
  );
}

function IterationList(props: { readonly iterations: readonly Iteration[] }) {
  if (props.iterations.length === 0) {
    return (
      <span className="belt-text" data-emphasis="subtle" data-size="sm">
        No iterations were discovered for this checkout.
      </span>
    );
  }

  return (
    <div className="preview-iteration-list">
      {props.iterations.map((iteration) => (
        <div className="preview-iteration-row" key={iteration.id}>
          <div>
            <span className="belt-text" data-emphasis="strong" data-size="sm">
              {getIterationDisplayName(iteration)}
            </span>
            {getIterationDetail(iteration) === undefined ? null : (
              <span className="belt-text" data-emphasis="subtle" data-size="xs">
                {getIterationDetail(iteration)}
              </span>
            )}
          </div>
          <div className="preview-row">
            {iteration.current ? (
              <span className="belt-badge" data-tone="success">
                current
              </span>
            ) : null}
            {iteration.destinations.map((destination) => (
              <a className="preview-destination-link" href={destination.url} key={destination.id}>
                {destination.label}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function getIterationDisplayName(iteration: Iteration): string {
  return getIterationMetadataString(iteration, "branch") ?? iteration.label;
}

function getIterationDetail(iteration: Iteration): string | undefined {
  return getIterationMetadataString(iteration, "path") ?? iteration.description;
}

function getIterationMetadataString(iteration: Iteration, key: string): string | undefined {
  const value = iteration.metadata?.[key];

  return typeof value === "string" ? value : undefined;
}

function ControlPanelEditor(props: {
  readonly controlPanel: ControlPanelIndex | undefined;
  readonly onRefresh: () => Promise<void>;
}) {
  const controlPanel = props.controlPanel;
  const activeFieldsetId = controlPanel?.state.activeFieldsetId;
  const activeFieldset =
    activeFieldsetId === undefined ? undefined : controlPanel?.config.fieldsets[activeFieldsetId];
  const [draftValues, setDraftValues] = useState<
    Readonly<Record<string, string | number | boolean>>
  >({});

  useEffect(() => {
    if (!controlPanel || activeFieldsetId === undefined) return;
    setDraftValues(controlPanel.state.currentValuesByFieldset[activeFieldsetId] ?? {});
  }, [activeFieldsetId, controlPanel]);

  if (!controlPanel || activeFieldsetId === undefined || !activeFieldset) {
    return (
      <div className="preview-card-body">
        <PreviewLabel>Control Panel</PreviewLabel>
        <span className="belt-text" data-emphasis="subtle" data-size="sm">
          Loading control panel state...
        </span>
      </div>
    );
  }

  const updateValue = (fieldId: string, value: string | number | boolean) => {
    setDraftValues((current) => ({ ...current, [fieldId]: value }));
  };

  const branchSnapshot = async () => {
    await postJson("/__toolbar/tools/control-panel/snapshots/branch", {
      fieldsetId: activeFieldsetId,
      name: `Preview ${new Date().toLocaleTimeString()}`,
      values: draftValues,
    });
    await props.onRefresh();
  };

  return (
    <div className="preview-card-body">
      <div className="preview-control-header">
        <PreviewLabel>{activeFieldset.label ?? activeFieldsetId}</PreviewLabel>
        <Select.Root
          onValueChange={(value) => {
            void postJson("/__toolbar/tools/control-panel/state/select-fieldset", {
              fieldsetId: String(value),
            }).then(props.onRefresh);
          }}
          value={activeFieldsetId}
        >
          <Select.Trigger defaultLabel="Fieldset" />
          <Select.List>
            {Object.entries(controlPanel.config.fieldsets).map(([fieldsetId, fieldset]) => (
              <Select.Option key={fieldsetId} value={fieldsetId}>
                {fieldset.label ?? fieldsetId}
              </Select.Option>
            ))}
          </Select.List>
        </Select.Root>
      </div>
      <div className="preview-control-fields">
        {Object.entries(activeFieldset.fields).map(([fieldId, field]) => (
          <ControlFieldEditor
            field={field}
            fieldId={fieldId}
            key={fieldId}
            onChange={(value) => updateValue(fieldId, value)}
            value={draftValues[fieldId]}
          />
        ))}
      </div>
      <div className="preview-row">
        <Button onClick={() => void branchSnapshot()} startIcon="add">
          Branch snapshot
        </Button>
        <GhostButton onClick={() => void props.onRefresh()} startIcon="spinner">
          Refresh
        </GhostButton>
      </div>
    </div>
  );
}

function ControlFieldEditor(props: {
  readonly field: ControlField;
  readonly fieldId: string;
  readonly onChange: (value: string | number | boolean) => void;
  readonly value: string | number | boolean | undefined;
}) {
  const label = props.field.label ?? props.fieldId;

  if (props.field.type === "boolean") {
    return (
      <label className="preview-switch-label">
        <Switch checked={props.value === true} onCheckedChange={(value) => props.onChange(value)} />
        <span className="belt-text" data-size="sm">
          {label}
        </span>
      </label>
    );
  }

  if (props.field.type === "select") {
    return (
      <Field>
        <Label>{label}</Label>
        <Select.Root
          onValueChange={(value) => props.onChange(String(value))}
          value={String(props.value ?? props.field.default ?? "")}
        >
          <Select.Trigger defaultLabel={label} />
          <Select.List>
            {props.field.options.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select.List>
        </Select.Root>
      </Field>
    );
  }

  if (props.field.type === "range") {
    const value =
      typeof props.value === "number" ? props.value : (props.field.default ?? props.field.min ?? 0);
    return (
      <Slider
        label={label}
        max={props.field.max ?? 1}
        min={props.field.min ?? 0}
        onValueChange={(nextValue) =>
          props.onChange(Array.isArray(nextValue) ? (nextValue[0] ?? value) : nextValue)
        }
        step={props.field.step ?? 0.01}
        unit={props.field.unit}
        value={[value]}
      />
    );
  }

  return (
    <Field>
      <Label>{label}</Label>
      <Input
        onChange={(event) =>
          props.onChange(
            props.field.type === "number"
              ? Number(event.currentTarget.value)
              : event.currentTarget.value,
          )
        }
        type={props.field.type === "number" ? "number" : "text"}
        value={String(props.value ?? props.field.default ?? "")}
      />
    </Field>
  );
}

function useLiveToolbarData() {
  const [toolbar, setToolbar] = useState<ToolbarApiIndex>();
  const [iterations, setIterations] = useState<IterationsIndex>();
  const [controlPanel, setControlPanel] = useState<ControlPanelIndex>();
  const [error, setError] = useState<string>();

  const refresh = async () => {
    try {
      setError(undefined);
      const [toolbarResponse, iterationsResponse, controlPanelResponse] = await Promise.all([
        getJson<ToolbarApiEnvelope>("/__toolbar"),
        getJson<IterationsIndex>("/__toolbar/tools/iterations/"),
        getJson<ControlPanelIndex>("/__toolbar/tools/control-panel/index"),
      ]);

      if (!toolbarResponse.ok) {
        throw new Error(toolbarResponse.error.message);
      }

      setToolbar(toolbarResponse.data);
      setIterations(iterationsResponse);
      setControlPanel(controlPanelResponse);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load live toolbar data");
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return { controlPanel, error, iterations, refresh, toolbar };
}

async function getJson<Data>(url: string): Promise<Data> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return (await response.json()) as Data;
}

async function postJson<Data = unknown>(url: string, body: unknown): Promise<Data> {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return (await response.json()) as Data;
}
