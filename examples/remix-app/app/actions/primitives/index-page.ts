import { css, createElement, type CSSMixinDescriptor, type RemixNode } from "remix/ui";
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

export function IndexPage() {
  return layout({
    title: "Belt Remix Primitives",
    children: createElement(
      "main",
      { mix: primitivePreviewStyle },
      createElement(
        "header",
        { className: "preview-header" },
        createElement("h1", { className: "preview-title" }, "Belt Remix Primitives"),
        createElement(
          "p",
          { className: "preview-note" },
          "Preview rendered from the example app with actual @repo/renderer-remix components and @repo/theme-css tokens."
        )
      ),
      section({ title: "Panel", children: panelGrid() }),
      section({ title: "Buttons", children: buttonGrid() }),
      section({ title: "StatusBanner", children: statusBannerGrid() }),
      section({ title: "Text, Badge, Glyph, Radius", children: mixinGrid() }),
      section({ title: "Form Controls", children: formPreview() }),
      section({ title: "Menu, Select, Combobox", children: choicePreview() })
    )
  });
}

function section(props: { readonly children?: RemixNode; readonly title: string }) {
  return createElement(
    "section",
    { className: "preview-section" },
    createElement("h2", { className: "preview-section-title" }, props.title),
    props.children
  );
}

function panelGrid() {
  return createElement(
    "div",
    { className: "preview-grid" },
    ...elevations.map((elevation) =>
      createElement(
        Panel,
        { elevation },
        createElement(
          "div",
          { className: "preview-panel-content" },
          createElement("span", { mix: textStyle({ tone: "strong", weight: "semibold" }) }, `Elevation ${elevation}`),
          createElement("span", { mix: textStyle({ tone: "subtle", size: "xs" }) }, "Outer and inner panel structure.")
        )
      )
    )
  );
}

function buttonGrid() {
  return createElement(
    "div",
    { className: "preview-stack" },
    createElement(
      "div",
      { className: "preview-row" },
      ...tones.map((tone) => createElement(Button, { tone }, tone))
    ),
    createElement(
      "div",
      { className: "preview-row" },
      ...tones.map((tone) => createElement(GhostButton, { tone }, tone))
    ),
    createElement(
      "div",
      { className: "preview-row" },
      createElement(Button, { loading: true, tone: "primary" }, "Loading"),
      createElement(Button, { disabled: true }, "Disabled"),
      createElement(Button, { startIcon: createElement(Glyph, { name: "add" }), tone: "success" }, "With Icon")
    )
  );
}

function statusBannerGrid() {
  return createElement(
    "div",
    { className: "preview-grid" },
    ...tones.map((tone) =>
      createElement(
        StatusBanner.Root,
        { tone: tone === "primary" ? "info" : tone },
        createElement(
          StatusBanner.Row,
          undefined,
          createElement(StatusBanner.Icon, undefined, tone === "danger" ? "!" : "i"),
          createElement(StatusBanner.Message, undefined, `${tone} status message`),
          createElement(StatusBanner.Action, undefined, createElement(GhostButton, { tone }, "Action"))
        )
      )
    )
  );
}

function mixinGrid() {
  return createElement(
    "div",
    { className: "preview-grid" },
    createElement(
      Panel,
      undefined,
      createElement(
        "div",
        { className: "preview-panel-content" },
        createElement("span", { mix: textStyle({ tone: "strong", size: "md", weight: "semibold" }) }, "Strong text"),
        createElement("span", { mix: textStyle({ tone: "foreground" }) }, "Regular foreground text"),
        createElement("span", { mix: textStyle({ tone: "subtle", size: "xs" }) }, "Subtle helper text"),
        createElement("span", { mix: textStyle({ tone: "foreground" }) }, "office affine efficient 0123456789")
      )
    ),
    createElement(
      Panel,
      undefined,
      createElement(
        "div",
        { className: "preview-panel-content" },
        createElement(
          "div",
          { className: "preview-row" },
          ...tones.map((tone) => createElement("span", { mix: badgeStyle({ tone }) }, tone))
        ),
        createElement(
          "div",
          { className: "preview-row" },
          createElement(Glyph, { mix: iconStyle({ tone: "primary", size: "md" }), name: "add" }),
          createElement(Glyph, { mix: iconStyle({ tone: "success", size: "md" }), name: "check" }),
          createElement(Glyph, { mix: iconStyle({ tone: "danger", size: "md" }), name: "trash" })
        )
      )
    ),
    createElement(
      Panel,
      undefined,
      createElement(
        "div",
        { className: "preview-panel-content" },
        createElement("span", { className: "preview-radius", mix: radiusStyle("inner") }, "inner"),
        createElement("span", { className: "preview-radius", mix: radiusStyle() }, "default"),
        createElement("span", { className: "preview-radius", mix: radiusStyle("outer") }, "outer")
      )
    )
  );
}

function formPreview() {
  return createElement(
    Panel,
    undefined,
    createElement(
      "div",
      { className: "preview-panel-content" },
      createElement(
        "div",
        { className: "preview-form" },
        createElement(Field, undefined, createElement(Label, { for: "branch" }, "Branch"), createElement(Input, { id: "branch", placeholder: "feature/new-toolbar" })),
        createElement(Field, undefined, createElement(Label, { for: "volume" }, "Intensity"), createElement(Slider, { id: "volume", max: 100, min: 0, value: 64 })),
        createElement("label", { className: "preview-row" }, createElement(Switch, { checked: true }), createElement("span", { mix: textStyle() }, "Show dev toolbar"))
      )
    )
  );
}

function choicePreview() {
  return createElement(
    "div",
    { className: "preview-grid" },
    createElement(
      Panel,
      undefined,
      createElement(
        "div",
        { className: "preview-panel-content" },
        createElement("span", { mix: textStyle({ tone: "strong", weight: "semibold" }) }, "Behavior controls"),
        createElement(Menu, { label: "Menu" }, createElement(MenuItem, { id: "open", label: "Open worktree", name: "action", value: "open" }, "Open worktree"), createElement(MenuItem, { id: "close", label: "Close panel", name: "action", value: "close" }, "Close panel")),
        createElement(Select, { defaultLabel: "Select destination", name: "destination" }, createElement(SelectOption, { label: "Web", value: "web" }, "Web"), createElement(SelectOption, { label: "Docs", value: "docs" }, "Docs")),
        createElement(Combobox, { name: "branch", placeholder: "Find branch" }, createElement(ComboboxOption, { label: "main", value: "main" }, "main"), createElement(ComboboxOption, { label: "feature/toolbar-shell", value: "feature/toolbar-shell" }, "feature/toolbar-shell"))
      )
    ),
    createElement(
      Panel,
      undefined,
      createElement(
        "div",
        { className: "preview-panel-content" },
        createElement("span", { mix: textStyle({ tone: "strong", weight: "semibold" }) }, "Menu surface mixins"),
        createElement(
          "div",
          { className: "preview-surface", mix: menuListStyle },
          createElement("div", { mix: [menuItemStyle, staticMenuItemStyle] }, "Open worktree"),
          createElement("div", { mix: [menuItemStyle, staticMenuItemStyle] }, "Copy URL"),
          createElement("div", { "data-highlighted": "true", mix: [menuItemStyle, staticMenuItemStyle] }, "Highlighted item")
        )
      )
    )
  );
}
