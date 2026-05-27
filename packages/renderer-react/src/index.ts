import { Button as BaseButton } from "@base-ui/react/button";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Field as BaseField } from "@base-ui/react/field";
import { Input as BaseInput } from "@base-ui/react/input";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Slider as BaseSlider } from "@base-ui/react/slider";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import {
  Fragment,
  createContext,
  createElement,
  useContext,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type SVGProps,
} from "react";
import {
  glyphDefinitions,
  glyphIds,
  glyphNames,
  type GlyphDefinition,
  type GlyphName,
  type GlyphNode,
} from "@repo/glyphs";

export type { GlyphDefinition, GlyphName, GlyphNode } from "@repo/glyphs";
export { glyphDefinitions, glyphIds, glyphNames } from "@repo/glyphs";

export type IntentTone = "neutral" | "primary" | "info" | "success" | "warning" | "danger";
export type Elevation = 1 | 2 | 3;
export type Radius = "inner" | "default" | "outer";
export type StatusBannerTone = "neutral" | "info" | "success" | "warning" | "danger";

type SurfaceProps = {
  readonly elevation?: Elevation;
  readonly tone?: IntentTone;
};

type ButtonPropsBase = Omit<React.ComponentProps<typeof BaseButton>, "children"> &
  SurfaceProps & {
    readonly children?: ReactNode;
    readonly endIcon?: GlyphName;
    readonly icon?: GlyphName;
    readonly loading?: boolean;
    readonly startIcon?: GlyphName;
  };

export type PanelProps = React.ComponentProps<"div"> &
  SurfaceProps & {
    readonly radius?: Radius;
  };
export type ButtonProps = ButtonPropsBase;
export type GhostButtonProps = ButtonPropsBase & {
  readonly variant?: "default" | "icon";
};
export type StatusBannerRootProps = React.ComponentProps<"div"> & {
  readonly radius?: Radius;
  readonly tone?: StatusBannerTone;
};
export type LabelProps = React.ComponentProps<typeof BaseField.Label>;
export type FieldProps = React.ComponentProps<typeof BaseField.Root>;
export type InputProps = React.ComponentProps<typeof BaseInput> & SurfaceProps;
export type SliderProps = React.ComponentProps<typeof BaseSlider.Root> & {
  readonly label?: ReactNode;
  readonly unit?: ReactNode;
};
export type SwitchProps = React.ComponentProps<typeof BaseSwitch.Root>;

export type MenuProps = React.ComponentProps<typeof BaseMenu.Root> & {
  readonly children?: ReactNode;
  readonly label: ReactNode;
  readonly menuLabel?: string;
  readonly triggerProps?: React.ComponentProps<typeof BaseMenu.Trigger>;
};
export type MenuItemProps = React.ComponentProps<typeof BaseMenu.Item>;
export type MenuListProps = React.ComponentProps<typeof BaseMenu.Popup>;
export type SubmenuProps = React.ComponentProps<typeof BaseMenu.SubmenuRoot> & {
  readonly children?: ReactNode;
  readonly label: ReactNode;
  readonly listProps?: MenuListProps;
  readonly menuLabel?: string;
  readonly triggerProps?: React.ComponentProps<typeof BaseMenu.SubmenuTrigger>;
};

export type SelectProps<Value = string> = React.ComponentProps<typeof BaseSelect.Root<Value>> & {
  readonly children?: ReactNode;
  readonly defaultLabel: ReactNode;
  readonly triggerProps?: React.ComponentProps<typeof BaseSelect.Trigger>;
};
export type SelectOptionProps = React.ComponentProps<typeof BaseSelect.Item>;

export type ComboboxProps<Value = string> = React.ComponentProps<
  typeof BaseCombobox.Root<Value>
> & {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly placeholder?: string;
};
export type ComboboxOptionProps = React.ComponentProps<typeof BaseCombobox.Item>;

export type GlyphSheetProps = Omit<SVGProps<SVGSVGElement>, "children">;

export type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  readonly name: GlyphName;
};

export function Panel(props: PanelProps): ReactElement {
  const { children, className, elevation = 1, radius = "outer", tone, ...rootProps } = props;

  return createElement(
    "div",
    {
      ...rootProps,
      className: classNames("belt-surface", classNameString(className)),
      "data-elevation": String(elevation),
      "data-radius": radius,
      "data-tone": tone,
    },
    createElement("div", { className: "belt-surface__inner" }, children),
  );
}

export function Button(props: ButtonProps): ReactElement {
  const {
    children,
    className,
    disabled,
    elevation = 1,
    endIcon,
    icon,
    loading = false,
    startIcon,
    tone = "neutral",
    type = "button",
    ...buttonProps
  } = props;

  return createElement(
    "div",
    {
      className: "belt-surface",
      "data-elevation": elevation,
      "data-tone": tone,
    },
    createElement(
      "div",
      { className: "belt-surface__inner" },
      createElement(
        BaseButton,
        {
          ...buttonProps,
          "aria-busy": loading || undefined,
          className: mergeClassName("belt-button", className),
          disabled: disabled || loading,
          type,
          "data-control": true,
        } as React.ComponentProps<typeof BaseButton>,
        buttonContents({ children, endIcon, icon, loading, startIcon, part: "belt-button" }),
      ),
    ),
  );
}

export function GhostButton(props: GhostButtonProps): ReactElement {
  const {
    children,
    className,
    disabled,
    elevation = 1,
    endIcon,
    icon,
    loading = false,
    startIcon,
    tone = "neutral",
    type = "button",
    ...buttonProps
  } = props;

  return createElement(
    BaseButton,
    {
      ...buttonProps,
      "aria-busy": loading || undefined,
      className: mergeClassName("belt-ghost-button", className),
      disabled: disabled || loading,
      type,
      "data-control": true,
      "data-elevation": elevation,
      "data-tone": tone,
    } as React.ComponentProps<typeof BaseButton>,
    buttonContents({ children, endIcon, icon, loading, startIcon, part: "belt-ghost-button" }),
  );
}

const StatusBannerContext = createContext<StatusBannerTone>("neutral");

export function StatusBannerRoot(props: StatusBannerRootProps): ReactElement {
  const { children, className, radius = "default", tone = "neutral", ...rootProps } = props;

  return createElement(
    StatusBannerContext.Provider,
    { value: tone },
    createElement(
      "div",
      {
        ...rootProps,
        className: classNames("belt-status-banner", className),
        "data-radius": radius,
        "data-tone": tone,
      },
      children,
    ),
  );
}

export function StatusBannerRow(props: React.ComponentProps<"div">): ReactElement {
  const { className, ...rootProps } = props;
  return createElement("div", {
    ...rootProps,
    className: classNames("belt-status-banner__row", className),
  });
}

export function StatusBannerBody(props: React.ComponentProps<"div">): ReactElement {
  const { className, ...rootProps } = props;
  return createElement("div", {
    ...rootProps,
    className: classNames("belt-status-banner__body", className),
  });
}

export function StatusBannerMessage(props: React.ComponentProps<"span">): ReactElement {
  const { className, ...rootProps } = props;
  return createElement("span", {
    ...rootProps,
    className: classNames("belt-status-banner__message", className),
  });
}

export function StatusBannerIcon(props: React.ComponentProps<"span">): ReactElement {
  const tone = useContext(StatusBannerContext);
  const { className, ...rootProps } = props;

  return createElement("span", {
    ...rootProps,
    className: classNames("belt-status-banner__icon", className),
    "data-tone": tone,
  });
}

export function StatusBannerAction(props: React.ComponentProps<"div">): ReactElement {
  const { className, ...rootProps } = props;
  return createElement("div", {
    ...rootProps,
    className: classNames("belt-status-banner__action", className),
  });
}

export const StatusBanner = {
  Action: StatusBannerAction,
  Body: StatusBannerBody,
  Icon: StatusBannerIcon,
  Message: StatusBannerMessage,
  Root: StatusBannerRoot,
  Row: StatusBannerRow,
} as const;

export function Field(props: FieldProps): ReactElement {
  const { className, ...rootProps } = props;
  return createElement(BaseField.Root, {
    ...rootProps,
    className: mergeClassName("belt-field", className),
  });
}

export function Label(props: LabelProps): ReactElement {
  const { className, ...rootProps } = props;
  return createElement(BaseField.Label, {
    ...rootProps,
    className: mergeClassName("belt-label", className),
  });
}

export function Input(props: InputProps): ReactElement {
  const { className, elevation = 1, tone, ...inputProps } = props;

  return createElement(
    "div",
    {
      className: classNames("belt-surface", classNameString(className)),
      "data-elevation": elevation,
      "data-tone": tone,
    },
    createElement(
      "div",
      { className: "belt-surface__inner" },
      createElement(BaseInput, { ...inputProps, className: "belt-input" }),
    ),
  );
}

export function Slider(props: SliderProps): ReactElement {
  const { className, label, unit, ...rootProps } = props;
  const hasHeader = label !== undefined || unit !== undefined;

  return createElement(
    BaseSlider.Root,
    { ...rootProps, className: mergeClassName("belt-slider", className) },
    hasHeader
      ? createElement(
          "div",
          { className: "belt-slider__header" },
          label === undefined
            ? createElement("span", null)
            : createElement(BaseSlider.Label, { className: "belt-slider__label" }, label),
          createElement(BaseSlider.Value, {
            className: "belt-slider__value",
            children: ((formattedValues: readonly string[]) =>
              createElement(
                Fragment,
                null,
                createElement(
                  "span",
                  { className: "belt-slider__value-text" },
                  formattedValues.join(" - "),
                ),
                unit === undefined
                  ? null
                  : createElement("span", { className: "belt-slider__unit" }, unit),
              )) as React.ComponentProps<typeof BaseSlider.Value>["children"],
          }),
        )
      : null,
    createElement(
      BaseSlider.Control,
      { className: "belt-slider__control" },
      createElement(
        BaseSlider.Track,
        { className: "belt-slider__track" },
        createElement(BaseSlider.Indicator, { className: "belt-slider__indicator" }),
      ),
      createElement(BaseSlider.Thumb, { className: "belt-slider__thumb" }),
    ),
  );
}

export function Switch(props: SwitchProps): ReactElement {
  const { className, ...rootProps } = props;

  return createElement(
    BaseSwitch.Root,
    { ...rootProps, className: mergeClassName("belt-switch", className) },
    createElement(BaseSwitch.Thumb, { className: "belt-switch__thumb" }),
  );
}

export function Menu(props: MenuProps): ReactElement {
  const { children, label, menuLabel, triggerProps, ...rootProps } = props;
  const { className: triggerClassName, ...restTriggerProps } = triggerProps ?? {};

  return createElement(
    BaseMenu.Root,
    rootProps,
    createElement(
      BaseMenu.Trigger,
      {
        ...restTriggerProps,
        className: mergeClassName("belt-ghost-button belt-menu__trigger", triggerClassName),
      },
      label,
    ),
    createElement(
      BaseMenu.Portal,
      null,
      createElement(
        BaseMenu.Positioner,
        null,
        createElement(MenuList, { "aria-label": menuLabel }, children),
      ),
    ),
  );
}

export function MenuList(props: MenuListProps): ReactElement {
  const { className, ...rootProps } = props;
  return createElement(BaseMenu.Popup, {
    ...rootProps,
    className: mergeClassName("belt-menu__popup", className),
  });
}

export function MenuItem(props: MenuItemProps): ReactElement {
  const { className, ...rootProps } = props;
  return createElement(BaseMenu.Item, {
    ...rootProps,
    className: mergeClassName("belt-menu__item", className),
  });
}

export function Submenu(props: SubmenuProps): ReactElement {
  const { children, label, listProps, menuLabel, triggerProps, ...rootProps } = props;
  const { className: triggerClassName, ...restTriggerProps } = triggerProps ?? {};

  return createElement(
    BaseMenu.SubmenuRoot,
    rootProps,
    createElement(
      BaseMenu.SubmenuTrigger,
      { ...restTriggerProps, className: mergeClassName("belt-menu__item", triggerClassName) },
      label,
    ),
    createElement(
      BaseMenu.Portal,
      null,
      createElement(
        BaseMenu.Positioner,
        null,
        createElement(MenuList, { ...listProps, "aria-label": menuLabel }, children),
      ),
    ),
  );
}

export function Select<Value = string>(props: SelectProps<Value>): ReactElement {
  const { children, defaultLabel, triggerProps, ...rootProps } = props;
  const { className: triggerClassName, ...restTriggerProps } = triggerProps ?? {};

  return createElement(
    BaseSelect.Root<Value>,
    rootProps,
    createElement(
      BaseSelect.Trigger,
      {
        ...restTriggerProps,
        className: mergeClassName("belt-ghost-button belt-select__trigger", triggerClassName),
      },
      createElement(BaseSelect.Value, { placeholder: defaultLabel }),
      createElement(
        BaseSelect.Icon,
        { className: "belt-button__end-icon" },
        createElement(Glyph, { name: "chevronDown" }),
      ),
    ),
    createElement(
      BaseSelect.Portal,
      null,
      createElement(
        BaseSelect.Positioner,
        null,
        createElement(
          BaseSelect.Popup,
          { className: "belt-select__popup" },
          createElement(BaseSelect.List, { className: "belt-select__list" }, children),
        ),
      ),
    ),
  );
}

export function SelectOption(props: SelectOptionProps): ReactElement {
  const { children, className, ...rootProps } = props;

  return createElement(
    BaseSelect.Item,
    { ...rootProps, className: mergeClassName("belt-select__item", className) },
    createElement(BaseSelect.ItemText, null, children),
    createElement(
      BaseSelect.ItemIndicator,
      null,
      createElement(Glyph, { className: "belt-icon", name: "check" }),
    ),
  );
}

export function Combobox<Value = string>(props: ComboboxProps<Value>): ReactElement {
  const { children, className, placeholder, ...rootProps } = props;

  return createElement(
    BaseCombobox.Root<Value>,
    rootProps,
    createElement(
      "div",
      { className: classNames("belt-surface belt-combobox", className) },
      createElement(
        "div",
        { className: "belt-surface__inner" },
        createElement(BaseCombobox.Input, { className: "belt-input", placeholder }),
        createElement(
          BaseCombobox.Trigger,
          { className: "belt-ghost-button" },
          createElement(BaseCombobox.Icon, null, createElement(Glyph, { name: "chevronDown" })),
        ),
      ),
    ),
    createElement(
      BaseCombobox.Portal,
      null,
      createElement(
        BaseCombobox.Positioner,
        null,
        createElement(
          BaseCombobox.Popup,
          { className: "belt-combobox__popup" },
          createElement(BaseCombobox.List, { className: "belt-combobox__list" }, children),
        ),
      ),
    ),
  );
}

export function ComboboxOption(props: ComboboxOptionProps): ReactElement {
  const { className, ...rootProps } = props;
  return createElement(BaseCombobox.Item, {
    ...rootProps,
    className: mergeClassName("belt-combobox__item", className),
  });
}

export function GlyphSheet(props: GlyphSheetProps): ReactElement {
  const { style, ...svgProps } = props;
  const hiddenStyle = {
    position: "absolute",
    width: "0",
    height: "0",
    overflow: "hidden",
    pointerEvents: "none",
    ...style,
  } satisfies CSSProperties;

  return createElement(
    "svg",
    {
      ...svgProps,
      "aria-hidden": props["aria-hidden"] ?? true,
      focusable: props.focusable ?? "false",
      height: props.height ?? "0",
      style: hiddenStyle,
      width: props.width ?? "0",
      xmlns: "http://www.w3.org/2000/svg",
    },
    glyphNames.map((name) => renderSymbol(name, glyphDefinitions[name])),
  );
}

GlyphSheet.ids = glyphIds;
GlyphSheet.values = glyphDefinitions;

export function Glyph(props: GlyphProps): ReactElement {
  const { fill, name, ...svgProps } = props;
  const hiddenByDefault =
    props["aria-hidden"] === undefined &&
    props["aria-label"] === undefined &&
    props["aria-labelledby"] === undefined;

  return createElement(
    "svg",
    {
      ...svgProps,
      "aria-hidden": hiddenByDefault ? true : props["aria-hidden"],
      fill: fill ?? "none",
      xmlns: "http://www.w3.org/2000/svg",
    },
    createElement("use", {
      xlinkHref: `#${glyphIds[name]}`,
    }),
  );
}

function buttonContents(options: {
  readonly children?: ReactNode;
  readonly endIcon?: GlyphName | undefined;
  readonly icon?: GlyphName | undefined;
  readonly loading: boolean;
  readonly part: "belt-button" | "belt-ghost-button";
  readonly startIcon?: GlyphName | undefined;
}): ReactNode {
  const resolvedStartIcon = options.loading ? "spinner" : options.startIcon;

  if (options.icon) {
    return createElement(
      "span",
      { className: `${options.part}__icon` },
      createElement(Glyph, { name: options.icon }),
    );
  }

  return [
    resolvedStartIcon
      ? createElement(
          "span",
          { className: `${options.part}__start-icon`, key: "start" },
          createElement(Glyph, { name: resolvedStartIcon }),
        )
      : null,
    options.children !== undefined
      ? createElement("span", { key: "children" }, options.children)
      : null,
    options.endIcon
      ? createElement(
          "span",
          { className: `${options.part}__end-icon`, key: "end" },
          createElement(Glyph, { name: options.endIcon }),
        )
      : null,
  ];
}

function renderSymbol(name: GlyphName, definition: GlyphDefinition): ReactElement {
  return createElement(
    "symbol",
    {
      ...toReactAttrs(definition.attrs),
      id: glyphIds[name],
      key: name,
      viewBox: definition.viewBox,
    },
    definition.children.map((node, index) => renderNode(node, `${name}-${index}`)),
  );
}

function renderNode(node: GlyphNode, key: string): ReactElement {
  return createElement(node.tag, {
    ...toReactAttrs(node.attrs),
    key,
  });
}

function toReactAttrs(attrs: GlyphDefinition["attrs"]): Record<string, string | number> {
  const nextAttrs: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(attrs ?? {})) {
    nextAttrs[reactAttributeName(key)] = value;
  }

  return nextAttrs;
}

function reactAttributeName(name: string): string {
  if (name === "stroke-linecap") return "strokeLinecap";
  if (name === "stroke-linejoin") return "strokeLinejoin";
  if (name === "stroke-width") return "strokeWidth";

  return name;
}

function classNames(...parts: readonly (string | undefined)[]): string | undefined {
  const className = parts.filter(Boolean).join(" ");

  return className === "" ? undefined : className;
}

function classNameString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function mergeClassName(
  base: string,
  value: unknown,
): string | ((state: unknown) => string | undefined) {
  if (typeof value === "function") {
    const resolve = value as (state: unknown) => string | undefined;
    return (state: unknown) => classNames(base, resolve(state));
  }

  if (typeof value === "string") {
    return classNames(base, value) ?? base;
  }

  return base;
}
