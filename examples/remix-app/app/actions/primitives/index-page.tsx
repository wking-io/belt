// @jsxRuntime classic
// @jsx createElement
// oxlint-disable-next-line no-unused-vars -- Remix UI classic JSX needs the factory in scope.
import { createElement, css, type CSSMixinDescriptor, type RemixNode } from "remix/ui";
import {
  Button,
  Combobox,
  ComboboxOption,
  Field,
  GhostButton,
  Glyph,
  Input,
  Label,
  Menu,
  MenuItem,
  Panel,
  Select,
  SelectOption,
  Slider,
  StatusBanner,
  Switch
} from "@repo/renderer-remix";
import { layout } from "../../ui/layout.ts";

const tones = ["neutral", "primary", "info", "success", "warning", "danger"] as const;
const elevations = [1, 2, 3] as const;
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
  "oatmeal"
] as const;
const paletteSteps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const;
const beltColorGroups = [
  {
    label: "elevation 1",
    tokens: ["elevation-1", "elevation-1-hover", "elevation-1-active"]
  },
  {
    label: "elevation 2",
    tokens: ["elevation-2", "elevation-2-hover", "elevation-2-active"]
  },
  {
    label: "elevation 3",
    tokens: ["elevation-3", "elevation-3-hover", "elevation-3-active"]
  },
  {
    label: "foreground",
    tokens: ["foreground", "foreground-subtle", "foreground-strong"]
  },
  {
    label: "border",
    tokens: ["border", "border-subtle", "border-strong"]
  },
  {
    label: "focus",
    tokens: ["focus"]
  },
  {
    label: "primary",
    tokens: [
      "primary",
      "primary-foreground",
      "primary-foreground-subtle",
      "primary-foreground-strong",
      "primary-control",
      "primary-control-hover",
      "primary-control-active",
      "primary-control-foreground",
      "primary-control-foreground-subtle",
      "primary-control-foreground-strong"
    ]
  },
  {
    label: "info",
    tokens: [
      "info",
      "info-foreground",
      "info-foreground-subtle",
      "info-foreground-strong",
      "info-control",
      "info-control-hover",
      "info-control-active",
      "info-control-foreground",
      "info-control-foreground-subtle",
      "info-control-foreground-strong"
    ]
  },
  {
    label: "success",
    tokens: [
      "success",
      "success-foreground",
      "success-foreground-subtle",
      "success-foreground-strong",
      "success-control",
      "success-control-hover",
      "success-control-active",
      "success-control-foreground",
      "success-control-foreground-subtle",
      "success-control-foreground-strong"
    ]
  },
  {
    label: "warning",
    tokens: [
      "warning",
      "warning-foreground",
      "warning-foreground-subtle",
      "warning-foreground-strong",
      "warning-control",
      "warning-control-hover",
      "warning-control-active",
      "warning-control-foreground",
      "warning-control-foreground-subtle",
      "warning-control-foreground-strong"
    ]
  },
  {
    label: "danger",
    tokens: [
      "danger",
      "danger-foreground",
      "danger-foreground-subtle",
      "danger-foreground-strong",
      "danger-control",
      "danger-control-hover",
      "danger-control-active",
      "danger-control-foreground",
      "danger-control-foreground-subtle",
      "danger-control-foreground-strong"
    ]
  }
] as const;

const primitivePreviewStyle: CSSMixinDescriptor = css({
  display: "grid",
  gap: "32px",
  ".preview-header": {
    display: "grid",
    gap: "8px"
  },
  ".preview-title": {
    color: "var(--belt-color-elevation-1-foreground-strong)",
    fontSize: "28px",
    fontWeight: 650,
    lineHeight: 1.1,
    margin: 0
  },
  ".preview-note": {
    color: "var(--belt-color-elevation-1-foreground-subtle)",
    fontSize: "14px",
    lineHeight: 1.5,
    margin: 0,
    maxWidth: "720px"
  },
  ".preview-section": {
    display: "grid",
    gap: "12px"
  },
  ".preview-section-title": {
    color: "var(--belt-color-elevation-1-foreground-strong)",
    fontSize: "13px",
    fontWeight: 650,
    letterSpacing: 0,
    margin: 0
  },
  ".preview-grid": {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
  },
  ".preview-palette": {
    display: "grid",
    gap: "14px"
  },
  ".preview-palette-row": {
    alignItems: "start",
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "96px 1fr"
  },
  ".preview-palette-label": {
    color: "var(--belt-color-elevation-1-foreground-subtle)",
    fontSize: "12px",
    fontWeight: 600,
    lineHeight: 1,
    textTransform: "capitalize"
  },
  ".preview-palette-chips": {
    display: "grid",
    gap: "8px",
    gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))"
  },
  ".preview-palette-chip": {
    aspectRatio: "1",
    border: "0.5px solid color-mix(in oklch, var(--belt-color-border) 65%, transparent)",
    borderRadius: "var(--belt-radius-inner)",
    minWidth: 0
  },
  ".preview-row": {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "8px"
  },
  ".preview-stack": {
    display: "grid",
    gap: "10px"
  },
  ".preview-panel-content": {
    display: "grid",
    gap: "8px",
    padding: "12px"
  },
  ".preview-surface": {
    display: "grid",
    gap: "6px",
    padding: "8px",
    width: "min(260px, 100%)"
  },
  ".preview-form": {
    display: "grid",
    gap: "12px",
    maxWidth: "320px"
  },
  ".preview-radius": {
    alignItems: "center",
    backgroundColor: "var(--belt-color-elevation-3)",
    border: "0.5px solid var(--belt-color-border-subtle)",
    display: "inline-flex",
    height: "40px",
    justifyContent: "center",
    minWidth: "92px"
  }
});

function mix(value: CSSMixinDescriptor | readonly CSSMixinDescriptor[]) {
  return value as never;
}

export function IndexPage() {
  return layout({
    title: "Belt Remix Primitives",
    children: (
      <main mix={mix(primitivePreviewStyle)}>
        <header class="preview-header">
          <h1 class="preview-title">Belt Remix Primitives</h1>
          <p class="preview-note">
            Preview rendered from the example app with actual @repo/renderer-remix components and @repo/theme-css tokens.
          </p>
        </header>
        {section({ title: "Color Palette", children: paletteGrid() })}
        {section({ title: "Belt Colors", children: beltColorGrid() })}
        {section({ title: "Panel", children: panelGrid() })}
        {section({ title: "Buttons", children: buttonGrid() })}
        {section({ title: "StatusBanner", children: statusBannerGrid() })}
        {section({ title: "Text, Badge, Glyph, Radius", children: mixinGrid() })}
        {section({ title: "Form Controls", children: formPreview() })}
        {section({ title: "Menu, Select, Combobox", children: choicePreview() })}
      </main>
    )
  });
}

function section(props: { readonly children?: RemixNode; readonly title: string }) {
  return (
    <section class="preview-section">
      <h2 class="preview-section-title">{props.title}</h2>
      {props.children}
    </section>
  );
}

function paletteGrid() {
  return (
    <div class="preview-palette">
      {paletteGroups.map((group) => (
        <div class="preview-palette-row">
          <span class="preview-palette-label">{group}</span>
          <div class="preview-palette-chips">
            {paletteSteps.map((step) => (
              <span
                aria-label={`${group} ${step}`}
                class="preview-palette-chip"
                style={{ backgroundColor: `var(--${group}-${step})` }}
                title={`${group}-${step}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function beltColorGrid() {
  return (
    <div class="preview-palette">
      {beltColorGroups.map((group) => (
        <div class="preview-palette-row">
          <span class="preview-palette-label">{group.label}</span>
          <div class="preview-palette-chips">
            {group.tokens.map((token) => (
              <span
                aria-label={`belt color ${token}`}
                class="preview-palette-chip"
                style={{ backgroundColor: `var(--belt-color-${token})` }}
                title={`--belt-color-${token}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function panelGrid() {
  return (
    <div class="preview-grid preview-panel-grid">
      {elevations.map((elevation) => (
        <Panel elevation={elevation}>
          <div class="preview-panel-content">
            <span class="belt-text" data-emphasis="strong" data-weight="semibold">Elevation {elevation}</span>
            <span class="belt-text" data-emphasis="subtle" data-size="xs">Default surface.</span>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function buttonGrid() {
  return (
    <div class="preview-grid">
      {elevations.map((elevation) => (
        <Panel elevation={elevation}>
          <div class="preview-panel-content">
            <span class="belt-text" data-emphasis="strong" data-weight="semibold">Elevation {elevation}</span>
            {buttonRows(elevation)}
          </div>
        </Panel>
      ))}
    </div>
  );
}

function buttonRows(elevation: 1 | 2 | 3) {
  return (
    <div class="preview-stack">
      <div class="preview-row">
        {tones.map((tone) => (
          <Button elevation={elevation} tone={tone}>{tone}</Button>
        ))}
        {tones.map((tone) => (
          <GhostButton elevation={elevation} tone={tone}>{tone}</GhostButton>
        ))}
      </div>
      <div class="preview-row">
        {tones.map((tone) => (
          <Button elevation={elevation} tone={tone} startIcon="add" endIcon="close">{tone}</Button>
        ))}
        {tones.map((tone) => (
          <GhostButton elevation={elevation} tone={tone} startIcon="add" endIcon="close">{tone}</GhostButton>
        ))}
      </div>
      <div class="preview-row">
        {tones.map((tone) => (
          <Button elevation={elevation} tone={tone} loading>{tone}</Button>
        ))}
        {tones.map((tone) => (
          <GhostButton elevation={elevation} tone={tone} loading>{tone}</GhostButton>
        ))}
      </div>
      <div class="preview-row">
        {tones.map((tone) => (
          <Button elevation={elevation} tone={tone} disabled>{tone}</Button>
        ))}
        {tones.map((tone) => (
          <GhostButton elevation={elevation} tone={tone} disabled>{tone}</GhostButton>
        ))}
      </div>
      <div class="preview-row">
        {tones.map((tone) => (
          <Button elevation={elevation} tone={tone} icon="add" />
        ))}
        {tones.map((tone) => (
          <GhostButton elevation={elevation} tone={tone} icon="add" />
        ))}
      </div>
    </div>
  );
}

function statusBannerGrid() {
  return (
    <div class="preview-stack">
      {tones.map((tone) => (
        <StatusBanner.Root tone={tone}>
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
  );
}

function mixinGrid() {
  return (
    <div class="preview-grid">
      <Panel>
        <div class="preview-panel-content">
          <span class="belt-text" data-emphasis="strong" data-size="md" data-weight="semibold">Strong text</span>
          <span class="belt-text">Regular foreground text</span>
          <span class="belt-text" data-emphasis="subtle" data-size="xs">Subtle helper text</span>
          <span class="belt-text">office affine efficient 0123456789</span>
        </div>
      </Panel>
      <Panel>
        <div class="preview-panel-content">
          <div class="preview-row">
            {tones.map((tone) => (
              <span class="belt-badge" data-tone={tone}>{tone}</span>
            ))}
          </div>
          <div class="preview-row">
            <Glyph class="belt-icon" data-tone="primary" data-size="md" name="add" />
            <Glyph class="belt-icon" data-tone="success" data-size="md" name="check" />
            <Glyph class="belt-icon" data-tone="danger" data-size="md" name="trash" />
          </div>
        </div>
      </Panel>
      <Panel>
        <div class="preview-panel-content">
          <span class="preview-radius belt-radius" data-size="inner">
            inner
          </span>
          <span class="preview-radius belt-radius">
            default
          </span>
          <span class="preview-radius belt-radius" data-size="outer">
            outer
          </span>
        </div>
      </Panel>
    </div>
  );
}

function formPreview() {
  return (
    <Panel>
      <div class="preview-panel-content">
        <div class="preview-form">
          <Field>
            <Label for="branch">Branch</Label>
            <Input id="branch" placeholder="feature/new-toolbar" />
          </Field>
          <Field>
            <Label for="volume">Intensity</Label>
            <Slider id="volume" max={100} min={0} value={64} />
          </Field>
          <label class="preview-row">
            <Switch checked />
            <span class="belt-text">Show dev toolbar</span>
          </label>
        </div>
      </div>
    </Panel>
  );
}

function choicePreview() {
  return (
    <div class="preview-grid">
      <Panel>
        <div class="preview-panel-content">
          <span class="belt-text" data-emphasis="strong" data-weight="semibold">Behavior controls</span>
          <Menu label="Menu">
            <MenuItem id="open" label="Open worktree" name="action" value="open">
              Open worktree
            </MenuItem>
            <MenuItem id="close" label="Close panel" name="action" value="close">
              Close panel
            </MenuItem>
          </Menu>
          <Select defaultLabel="Select destination" name="destination">
            <SelectOption label="Web" value="web">
              Web
            </SelectOption>
            <SelectOption label="Docs" value="docs">
              Docs
            </SelectOption>
          </Select>
          <Combobox name="branch" placeholder="Find branch">
            <ComboboxOption label="main" value="main">
              main
            </ComboboxOption>
            <ComboboxOption label="feature/toolbar-shell" value="feature/toolbar-shell">
              feature/toolbar-shell
            </ComboboxOption>
          </Combobox>
        </div>
      </Panel>
      <Panel>
        <div class="preview-panel-content">
          <span class="belt-text" data-emphasis="strong" data-weight="semibold">Menu surface classes</span>
          <div class="preview-surface belt-menu__list">
            <div class="belt-menu__item">Open worktree</div>
            <div class="belt-menu__item">Copy URL</div>
            <div class="belt-menu__item" data-highlighted="true">
              Highlighted item
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
