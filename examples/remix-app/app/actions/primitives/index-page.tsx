// @jsxRuntime classic
// @jsx createElement
// oxlint-disable-next-line no-unused-vars -- Remix UI classic JSX needs the factory in scope.
import { createElement, css, type CSSMixinDescriptor, type RemixNode } from "remix/ui";
import {
  badgeStyle,
  Button,
  Combobox,
  ComboboxOption,
  Field,
  GhostButton,
  Glyph,
  iconStyle,
  Input,
  Label,
  Menu,
  MenuItem,
  menuItemStyle,
  menuListStyle,
  Panel,
  radiusStyle,
  Select,
  SelectOption,
  Slider,
  StatusBanner,
  Switch,
  textStyle
} from "@repo/renderer-remix";
import { layout } from "../../ui/layout.ts";

const tones = ["neutral", "primary", "info", "success", "warning", "danger"] as const;
const elevations = [0, 1, 2, 3] as const;
const paletteGroups = ["ruby", "honey", "jade", "denim", "iris", "oatmeal"] as const;
const paletteSteps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;
const beltColorGroups = [
  {
    label: "elevation 0",
    tokens: ["elevation-0", "elevation-0-hover", "elevation-0-active", "elevation-0-inset", "elevation-0-highlight"]
  },
  {
    label: "elevation 1",
    tokens: ["elevation-1", "elevation-1-hover", "elevation-1-active", "elevation-1-inset"]
  },
  {
    label: "elevation 2",
    tokens: ["elevation-2", "elevation-2-hover", "elevation-2-active", "elevation-2-inset"]
  },
  {
    label: "elevation 3",
    tokens: ["elevation-3", "elevation-3-hover", "elevation-3-active", "elevation-3-inset"]
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
    color: "var(--belt-color-foreground-strong)",
    fontSize: "28px",
    fontWeight: 650,
    lineHeight: 1.1,
    margin: 0
  },
  ".preview-note": {
    color: "var(--belt-color-foreground-subtle)",
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
    color: "var(--belt-color-foreground-strong)",
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
    gap: "10px"
  },
  ".preview-palette-row": {
    alignItems: "center",
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "72px 1fr"
  },
  ".preview-palette-label": {
    color: "var(--belt-color-foreground-subtle)",
    fontSize: "12px",
    fontWeight: 600,
    lineHeight: 1,
    textTransform: "capitalize"
  },
  ".preview-palette-chips": {
    display: "grid",
    gap: "6px",
    gridTemplateColumns: "repeat(auto-fill, minmax(24px, 1fr))"
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
    backgroundColor: "var(--belt-color-elevation-2)",
    border: "0.5px solid var(--belt-color-border-subtle)",
    display: "inline-flex",
    height: "40px",
    justifyContent: "center",
    minWidth: "92px"
  }
});

const staticMenuItemStyle = css({
  paddingBlock: "8px",
  paddingInline: "10px"
});

function mix(value: CSSMixinDescriptor | readonly CSSMixinDescriptor[]) {
  return value as never;
}

export function IndexPage() {
  return layout({
    title: "Belt Remix Primitives",
    children: (
      <main mix={mix(primitivePreviewStyle)}>
        <header className="preview-header">
          <h1 className="preview-title">Belt Remix Primitives</h1>
          <p className="preview-note">
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
    <section className="preview-section">
      <h2 className="preview-section-title">{props.title}</h2>
      {props.children}
    </section>
  );
}

function paletteGrid() {
  return (
    <div className="preview-palette">
      {paletteGroups.map((group) => (
        <div className="preview-palette-row">
          <span className="preview-palette-label">{group}</span>
          <div className="preview-palette-chips">
            {paletteSteps.map((step) => (
              <span
                aria-label={`${group} ${step}`}
                className="preview-palette-chip"
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
    <div className="preview-palette">
      {beltColorGroups.map((group) => (
        <div className="preview-palette-row">
          <span className="preview-palette-label">{group.label}</span>
          <div className="preview-palette-chips">
            {group.tokens.map((token) => (
              <span
                aria-label={`belt color ${token}`}
                className="preview-palette-chip"
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
    <div className="preview-grid">
      {elevations.map((elevation) => (
        <Panel elevation={elevation}>
          <div className="preview-panel-content">
            <span mix={mix(textStyle({ tone: "strong", weight: "semibold" }))}>Elevation {elevation}</span>
            <span mix={mix(textStyle({ tone: "subtle", size: "xs" }))}>Outer and inner panel structure.</span>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function buttonGrid() {
  return (
    <div className="preview-stack">
      <div className="preview-row">
        {tones.map((tone) => (
          <Button tone={tone}>{tone}</Button>
        ))}
      </div>
      <div className="preview-row">
        {tones.map((tone) => (
          <GhostButton tone={tone}>{tone}</GhostButton>
        ))}
      </div>
      <div className="preview-row">
        <Button loading tone="primary">
          Loading
        </Button>
        <Button disabled>Disabled</Button>
        <Button startIcon={<Glyph name="add" />} tone="success">
          With Icon
        </Button>
      </div>
    </div>
  );
}

function statusBannerGrid() {
  return (
    <div className="preview-grid">
      {tones.map((tone) => (
        <StatusBanner.Root tone={tone === "primary" ? "info" : tone}>
          <StatusBanner.Row>
            <StatusBanner.Icon>{tone === "danger" ? "!" : "i"}</StatusBanner.Icon>
            <StatusBanner.Message>{tone} status message</StatusBanner.Message>
            <StatusBanner.Action>
              <GhostButton tone={tone}>Action</GhostButton>
            </StatusBanner.Action>
          </StatusBanner.Row>
        </StatusBanner.Root>
      ))}
    </div>
  );
}

function mixinGrid() {
  return (
    <div className="preview-grid">
      <Panel>
        <div className="preview-panel-content">
          <span mix={mix(textStyle({ tone: "strong", size: "md", weight: "semibold" }))}>Strong text</span>
          <span mix={mix(textStyle({ tone: "foreground" }))}>Regular foreground text</span>
          <span mix={mix(textStyle({ tone: "subtle", size: "xs" }))}>Subtle helper text</span>
          <span mix={mix(textStyle({ tone: "foreground" }))}>office affine efficient 0123456789</span>
        </div>
      </Panel>
      <Panel>
        <div className="preview-panel-content">
          <div className="preview-row">
            {tones.map((tone) => (
              <span mix={mix(badgeStyle({ tone }))}>{tone}</span>
            ))}
          </div>
          <div className="preview-row">
            <Glyph mix={mix(iconStyle({ tone: "primary", size: "md" }))} name="add" />
            <Glyph mix={mix(iconStyle({ tone: "success", size: "md" }))} name="check" />
            <Glyph mix={mix(iconStyle({ tone: "danger", size: "md" }))} name="trash" />
          </div>
        </div>
      </Panel>
      <Panel>
        <div className="preview-panel-content">
          <span className="preview-radius" mix={mix(radiusStyle("inner"))}>
            inner
          </span>
          <span className="preview-radius" mix={mix(radiusStyle())}>
            default
          </span>
          <span className="preview-radius" mix={mix(radiusStyle("outer"))}>
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
      <div className="preview-panel-content">
        <div className="preview-form">
          <Field>
            <Label for="branch">Branch</Label>
            <Input id="branch" placeholder="feature/new-toolbar" />
          </Field>
          <Field>
            <Label for="volume">Intensity</Label>
            <Slider id="volume" max={100} min={0} value={64} />
          </Field>
          <label className="preview-row">
            <Switch checked />
            <span mix={mix(textStyle())}>Show dev toolbar</span>
          </label>
        </div>
      </div>
    </Panel>
  );
}

function choicePreview() {
  return (
    <div className="preview-grid">
      <Panel>
        <div className="preview-panel-content">
          <span mix={mix(textStyle({ tone: "strong", weight: "semibold" }))}>Behavior controls</span>
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
        <div className="preview-panel-content">
          <span mix={mix(textStyle({ tone: "strong", weight: "semibold" }))}>Menu surface mixins</span>
          <div className="preview-surface" mix={mix(menuListStyle)}>
            <div mix={mix([menuItemStyle, staticMenuItemStyle])}>Open worktree</div>
            <div mix={mix([menuItemStyle, staticMenuItemStyle])}>Copy URL</div>
            <div data-highlighted="true" mix={mix([menuItemStyle, staticMenuItemStyle])}>
              Highlighted item
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
