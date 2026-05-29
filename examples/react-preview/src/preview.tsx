import { useMemo, useState, type ReactNode } from "react";
import {
  Button,
  Combobox,
  ComboboxOption,
  Field,
  GhostButton,
  Glyph,
  GlyphSheet,
  Input,
  Label,
  Menu,
  MenuItem,
  Panel,
  Select,
  SelectOption,
  Slider,
  StatusBanner,
  Submenu,
  Switch,
  Toolbar,
  glyphNames,
  type Elevation,
  type IntentTone,
} from "@repo/renderer-react";

type ThemeMode = "system" | "belt-light" | "belt-dark";

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

export function ReactPreviewApp() {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [toolbarEnabled, setToolbarEnabled] = useState(true);
  const [destination, setDestination] = useState("workspace");
  const [branch, setBranch] = useState<string | null>("main");
  const [intensity, setIntensity] = useState(48);
  const themeAttribute = theme === "system" ? undefined : theme;

  const selectedGlyphs = useMemo(
    () => glyphNames.filter((_, index) => index % 2 === 0).slice(0, 8),
    [],
  );

  return (
    <main className="preview-shell" data-belt-theme={themeAttribute}>
      <GlyphSheet />
      <header className="preview-topbar">
        <div>
          <h1>Belt React Preview</h1>
          <p>Live gallery for every exported React component and the shared theme contract.</p>
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
      </header>

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
              <Select
                defaultLabel="Choose destination"
                name="destination"
                onValueChange={(value) => setDestination(String(value))}
                value={destination}
              >
                <SelectOption value="workspace">Workspace</SelectOption>
                <SelectOption value="browser">Browser</SelectOption>
                <SelectOption value="docs">Docs</SelectOption>
              </Select>
            </Field>
            <Field className="preview-form-grid__wide">
              <Slider
                label="Preview intensity"
                max={100}
                min={0}
                onValueChange={(value) => setIntensity(Array.isArray(value) ? (value[0] ?? 0) : value)}
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
                <Menu label={<Button endIcon="chevronDown">Actions</Button>} menuLabel="Actions">
                  <MenuItem>Open worktree</MenuItem>
                  <MenuItem>Copy URL</MenuItem>
                  <Submenu label="More">
                    <MenuItem>Archive</MenuItem>
                    <MenuItem>Delete</MenuItem>
                  </Submenu>
                </Menu>
                <Menu
                  label={<GhostButton endIcon="chevronDown">More</GhostButton>}
                  menuLabel="Secondary actions"
                >
                  <MenuItem>Rename</MenuItem>
                  <MenuItem>Duplicate</MenuItem>
                </Menu>
              </div>
            </div>
          </Panel>
          <Panel>
            <div className="preview-card-body">
              <PreviewLabel>Select</PreviewLabel>
              <Select
                defaultLabel="Pick a surface"
                onValueChange={(value) => setDestination(String(value))}
                value={destination}
              >
                <SelectOption value="workspace">Workspace</SelectOption>
                <SelectOption value="browser">Browser</SelectOption>
                <SelectOption value="docs">Docs</SelectOption>
              </Select>
            </div>
          </Panel>
          <Panel>
            <div className="preview-card-body">
              <PreviewLabel>Combobox</PreviewLabel>
              <Combobox
                items={["main", "feature/react-preview", "fix/theme-controls"]}
                onValueChange={(value) => setBranch(value)}
                placeholder="Find branch"
                value={branch}
              >
                <ComboboxOption value="main">main</ComboboxOption>
                <ComboboxOption value="feature/react-preview">feature/react-preview</ComboboxOption>
                <ComboboxOption value="fix/theme-controls">fix/theme-controls</ComboboxOption>
              </Combobox>
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

      <Toolbar aria-label="Current preview state" defaultPosition={{ x: 16, y: 16 }}>
        <Button icon={toolbarEnabled ? "check" : "close"} />
        <Button>Iterations</Button>
      </Toolbar>
    </main>
  );
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

function ButtonToneRow(props: { readonly elevation: Elevation; readonly variant: "filled" | "ghost" }) {
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
