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
