// @jsxRuntime classic
// @jsx createElement
// oxlint-disable-next-line no-unused-vars -- Remix UI classic JSX needs the factory in scope.
import { createElement, css, type CSSMixinDescriptor, type Handle, type MixInput, type Props, type RemixNode } from "@remix-run/ui";
import * as RemixCombobox from "@remix-run/ui/combobox";
import * as RemixMenu from "@remix-run/ui/menu";
import * as RemixSelect from "@remix-run/ui/select";

type IntentTone = "neutral" | "primary" | "info" | "success" | "warning" | "danger";
type Elevation = 1 | 2 | 3;
type ForegroundTone = "foreground" | "subtle" | "strong";
type TextSize = "xs" | "sm" | "md";
type BadgeTone = IntentTone;

type WithClassName = {
  readonly className?: string;
};

type WithMix = {
  readonly mix?: MixInput;
};

const fontFamilyValue = "var(--belt-font-family, \"Inter\", system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif)";
const fontFeatureSettingsValue = "var(--belt-font-feature-settings, \"calt\" 1, \"dlig\" 1, \"case\" 1, \"ccmp\" 1, \"zero\" 1, \"ss01\" 1, \"ss02\" 1, \"ss07\" 1, \"ss08\" 1, \"cv06\" 1, \"cv11\" 1)";
const fontVariantAlternatesValue = "var(--belt-font-variant-alternates, styleset(ss01) styleset(ss02) styleset(ss07) styleset(ss08) character-variant(cv06) character-variant(cv11))";
const fontVariantLigaturesValue = "var(--belt-font-variant-ligatures, common-ligatures discretionary-ligatures contextual)";
const fontVariantNumericValue = "var(--belt-font-variant-numeric, slashed-zero)";

const typographyFeatureStyle = {
  fontFeatureSettings: fontFeatureSettingsValue,
  fontVariantAlternates: fontVariantAlternatesValue,
  fontVariantLigatures: fontVariantLigaturesValue,
  fontVariantNumeric: fontVariantNumericValue
} as const;

export function gapStyle(step: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12): CSSMixinDescriptor {
  return css({
    gap: `var(--belt-space-${step})`
  });
}

export function radiusStyle(size: "inner" | "default" | "outer" = "default"): CSSMixinDescriptor {
  const variable = size === "default" ? "--belt-radius" : `--belt-radius-${size}`;

  return css({
    borderRadius: `var(${variable})`
  });
}

export function textStyle(options: {
  readonly tone?: ForegroundTone;
  readonly size?: TextSize;
  readonly weight?: "regular" | "medium" | "semibold";
} = {}): CSSMixinDescriptor {
  const tone = options.tone ?? "foreground";
  const size = options.size ?? "sm";
  const weight = options.weight ?? "regular";

  return css({
    color: foregroundColor(tone),
    fontFamily: fontFamilyValue,
    ...typographyFeatureStyle,
    fontSize: textSize(size),
    fontWeight: fontWeight(weight),
    lineHeight: "1.35"
  });
}

export function badgeStyle(options: {
  readonly tone?: BadgeTone;
} = {}): CSSMixinDescriptor {
  const tone = options.tone ?? "neutral";

  return css({
    alignItems: "center",
    backgroundColor: tone === "neutral" ? "var(--belt-color-elevation-2)" : `var(--belt-color-${tone})`,
    border: `0.5px solid ${tone === "neutral" ? "var(--belt-color-border-subtle)" : `color-mix(in oklch, var(--belt-color-${tone}-foreground) 24%, transparent)`}`,
    borderRadius: "999px",
    boxSizing: "border-box",
    color: tone === "neutral" ? "var(--belt-color-foreground-subtle)" : `var(--belt-color-${tone}-foreground)`,
    display: "inline-flex",
    fontFamily: fontFamilyValue,
    ...typographyFeatureStyle,
    fontSize: "0.75rem",
    fontWeight: "500",
    gap: "var(--belt-space-1)",
    lineHeight: "1",
    minHeight: "1.25rem",
    paddingBlock: "0",
    paddingInline: "var(--belt-space-2)",
    whiteSpace: "nowrap"
  });
}

export function iconStyle(options: {
  readonly tone?: IntentTone | ForegroundTone;
  readonly size?: "xs" | "sm" | "md";
} = {}): CSSMixinDescriptor {
  const tone = options.tone ?? "foreground";
  const size = options.size ?? "sm";

  return css({
    color: iconColor(tone),
    display: "inline-flex",
    flexShrink: 0,
    height: iconSize(size),
    width: iconSize(size),
    "& > svg": {
      display: "block",
      height: "100%",
      width: "100%"
    }
  });
}

export type PanelProps = Props<"div"> & {
  readonly children?: RemixNode;
  readonly elevation?: Elevation;
  readonly focused?: boolean;
  readonly innerClassName?: string;
  readonly innerMix?: MixInput;
  readonly inset?: boolean;
};

export function Panel(handle: Handle<PanelProps>) {
  return () => {
    const {
      children,
      elevation = 3,
      focused = false,
      innerClassName,
      innerMix,
      inset = false,
      mix,
      className,
      ...rootProps
    } = handle.props;

    return (
      <div
        {...rootProps}
        className={classNames("belt-surface belt-panel", className)}
        data-belt-panel=""
        data-belt-surface=""
        data-belt-elevation={String(elevation)}
        data-belt-surface-elevation={String(elevation)}
        data-belt-surface-size="surface-default"
        data-belt-surface-variant={inset ? "inset" : "default"}
        data-focused={focused ? "true" : undefined}
        data-inset={inset ? "true" : undefined}
        mix={mix}
      >
        <div className={classNames("belt-surface__inner", innerClassName)} data-belt-surface-inner="" mix={innerMix}>
          {children}
        </div>
      </div>
    );
  };
}

export type ButtonProps = Omit<Props<"button">, "children"> & {
  readonly children?: RemixNode;
  readonly endIcon?: RemixNode;
  readonly loading?: boolean;
  readonly startIcon?: RemixNode;
  readonly tone?: IntentTone;
};

export function Button(handle: Handle<ButtonProps>) {
  return () => {
    const {
      children,
      disabled,
      endIcon,
      loading = false,
      mix,
      startIcon,
      tone = "neutral",
      type,
      ...buttonProps
    } = handle.props;

    return (
      <button
        {...buttonProps}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        type={type ?? "button"}
        mix={composeMix(buttonBaseStyle, buttonToneStyle(tone), mix)}
      >
        {startIcon ? <span mix={composeMix(buttonIconSlotStyle)}>{startIcon}</span> : null}
        {children !== undefined ? <span mix={composeMix(buttonLabelStyle)}>{children}</span> : null}
        {endIcon ? <span mix={composeMix(buttonIconSlotStyle)}>{endIcon}</span> : null}
      </button>
    );
  };
}

export type GhostButtonProps = ButtonProps;

export function GhostButton(handle: Handle<GhostButtonProps>) {
  return () => {
    const {
      children,
      disabled,
      endIcon,
      loading = false,
      mix,
      startIcon,
      tone = "neutral",
      type,
      ...buttonProps
    } = handle.props;

    return (
      <button
        {...buttonProps}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        type={type ?? "button"}
        mix={composeMix(buttonBaseStyle, ghostButtonToneStyle(tone), mix)}
      >
        {startIcon ? <span mix={composeMix(buttonIconSlotStyle)}>{startIcon}</span> : null}
        {children !== undefined ? <span mix={composeMix(buttonLabelStyle)}>{children}</span> : null}
        {endIcon ? <span mix={composeMix(buttonIconSlotStyle)}>{endIcon}</span> : null}
      </button>
    );
  };
}

export type StatusBannerTone = "neutral" | "info" | "success" | "warning" | "danger";

type StatusBannerContextValue = {
  readonly tone: StatusBannerTone;
};

export type StatusBannerRootProps = Props<"div"> & {
  readonly children?: RemixNode;
  readonly tone?: StatusBannerTone;
};

export function StatusBannerRoot(handle: Handle<StatusBannerRootProps, StatusBannerContextValue>) {
  return () => {
    const { children, mix, tone = "neutral", ...props } = handle.props;

    handle.context.set({ tone });

    return (
      <div {...props} mix={composeMix(statusBannerRootStyle(tone), mix)}>
        {children}
      </div>
    );
  };
}

export function StatusBannerRow(handle: Handle<Props<"div">>) {
  return () => {
    const { children, mix, ...props } = handle.props;

    return (
      <div {...props} mix={composeMix(statusBannerRowStyle, mix)}>
        {children}
      </div>
    );
  };
}

export function StatusBannerBody(handle: Handle<Props<"div">>) {
  return () => {
    const { children, mix, ...props } = handle.props;

    return (
      <div {...props} mix={composeMix(statusBannerBodyStyle, mix)}>
        {children}
      </div>
    );
  };
}

export function StatusBannerMessage(handle: Handle<Props<"span">>) {
  return () => {
    const context = handle.context.get(StatusBannerRoot);
    const tone = context?.tone ?? "neutral";
    const { children, mix, ...props } = handle.props;

    return (
      <span {...props} mix={composeMix(statusBannerMessageStyle(tone), mix)}>
        {children}
      </span>
    );
  };
}

export function StatusBannerIcon(handle: Handle<Props<"span">>) {
  return () => {
    const context = handle.context.get(StatusBannerRoot);
    const tone = context?.tone ?? "neutral";
    const { children, mix, ...props } = handle.props;

    return (
      <span {...props} mix={composeMix(statusBannerIconStyle(tone), mix)}>
        {children}
      </span>
    );
  };
}

export function StatusBannerAction(handle: Handle<Props<"div">>) {
  return () => {
    const { children, mix, ...props } = handle.props;

    return (
      <div {...props} mix={composeMix(statusBannerActionStyle, mix)}>
        {children}
      </div>
    );
  };
}

export const StatusBanner = {
  Action: StatusBannerAction,
  Body: StatusBannerBody,
  Icon: StatusBannerIcon,
  Message: StatusBannerMessage,
  Root: StatusBannerRoot,
  Row: StatusBannerRow
} as const;

export type LabelProps = Props<"label">;

export function Label(handle: Handle<LabelProps>) {
  return () => {
    const { children, mix, ...props } = handle.props;

    return (
      <label {...props} mix={composeMix(labelStyle, mix)}>
        {children}
      </label>
    );
  };
}

export type FieldProps = Props<"div"> & {
  readonly children?: RemixNode;
};

export function Field(handle: Handle<FieldProps>) {
  return () => {
    const { children, mix, ...props } = handle.props;

    return (
      <div {...props} mix={composeMix(fieldStyle, mix)}>
        {children}
      </div>
    );
  };
}

export type InputProps = Props<"input">;

export function Input(handle: Handle<InputProps>) {
  return () => {
    const { mix, ...props } = handle.props;

    return <input {...props} mix={composeMix(inputStyle, mix)} />;
  };
}

export type SliderProps = Omit<Props<"input">, "role" | "type">;

export function Slider(handle: Handle<SliderProps>) {
  return () => {
    const { mix, ...props } = handle.props;

    return <input {...props} type="range" mix={composeMix(sliderStyle, mix)} />;
  };
}

export type SwitchProps = Omit<Props<"input">, "role" | "type">;

export function Switch(handle: Handle<SwitchProps>) {
  return () => {
    const { mix, ...props } = handle.props;

    return <input {...props} type="checkbox" role="switch" mix={composeMix(switchStyle, mix)} />;
  };
}

export type MenuProps = RemixMenu.MenuProps & WithClassName & WithMix;
export type MenuItemProps = RemixMenu.MenuItemProps & WithClassName & WithMix;
export type SubmenuProps = RemixMenu.SubmenuProps & WithClassName & WithMix;
export type MenuListProps = RemixMenu.MenuListProps & WithClassName & WithMix;

export function Menu(handle: Handle<MenuProps>) {
  const wrappedHandle = withMix(handle, [menuButtonStyle]);
  return RemixMenu.Menu(wrappedHandle);
}

export function MenuItem(handle: Handle<MenuItemProps>) {
  const wrappedHandle = withMix(handle, [menuItemStyle]);
  return RemixMenu.MenuItem(wrappedHandle);
}

export function Submenu(handle: Handle<SubmenuProps>) {
  const wrappedHandle = withMix(handle, [menuButtonStyle]);
  return RemixMenu.Submenu(wrappedHandle);
}

export function MenuList(handle: Handle<MenuListProps>) {
  const wrappedHandle = withMix(handle, [menuListStyle]);
  return RemixMenu.MenuList(wrappedHandle);
}

export const onMenuSelect = RemixMenu.onMenuSelect;
export const MenuSelectEvent = RemixMenu.MenuSelectEvent;
export type { MenuSelectItem } from "@remix-run/ui/menu";

export type SelectProps = RemixSelect.SelectProps & WithClassName & WithMix;
export type SelectOptionProps = RemixSelect.SelectOptionProps & WithClassName & WithMix;

export function Select(handle: Handle<SelectProps>) {
  const wrappedHandle = withMix(handle, [selectTriggerStyle]);
  return RemixSelect.Select(wrappedHandle);
}

export function SelectOption(handle: Handle<SelectOptionProps>) {
  const wrappedHandle = withMix(handle, [optionStyle]);
  return RemixSelect.Option(wrappedHandle);
}

export const onSelectChange = RemixSelect.onSelectChange;
export const SelectChangeEvent = RemixSelect.SelectChangeEvent;

export type ComboboxProps = RemixCombobox.ComboboxProps & WithClassName & WithMix;
export type ComboboxOptionProps = RemixCombobox.ComboboxOptionProps & WithClassName & WithMix;

export function Combobox(handle: Handle<ComboboxProps>) {
  const wrappedHandle = withMix(handle, [comboboxRootStyle]);
  return RemixCombobox.Combobox(wrappedHandle);
}

export function ComboboxOption(handle: Handle<ComboboxOptionProps>) {
  const wrappedHandle = withMix(handle, [optionStyle]);
  return RemixCombobox.ComboboxOption(wrappedHandle);
}

export const onComboboxChange = RemixCombobox.onComboboxChange;
export const ComboboxChangeEvent = RemixCombobox.ComboboxChangeEvent;

export type { GlyphName, GlyphProps } from "@remix-run/ui/glyph";
export { Glyph } from "@remix-run/ui/glyph";

export const buttonBaseStyle: CSSMixinDescriptor = css({
  alignItems: "center",
  appearance: "none",
  borderRadius: "var(--belt-radius)",
  boxSizing: "border-box",
  cursor: "pointer",
  display: "inline-flex",
  fontFamily: fontFamilyValue,
  ...typographyFeatureStyle,
  fontSize: "0.8125rem",
  fontWeight: "500",
  gap: "var(--belt-space-1)",
  justifyContent: "center",
  lineHeight: "1",
  minHeight: "1.875rem",
  outline: "none",
  paddingBlock: "0",
  paddingInline: "var(--belt-space-3)",
  position: "relative",
  transition: "background-color 140ms ease, border-color 140ms ease, color 140ms ease, box-shadow 140ms ease",
  userSelect: "none",
  verticalAlign: "top",
  whiteSpace: "nowrap",
  "&:focus-visible": {
    outline: "2px solid var(--belt-color-focus)",
    outlineOffset: "2px"
  },
  "&:disabled": {
    cursor: "not-allowed",
    opacity: 0.55
  }
});

export const buttonLabelStyle: CSSMixinDescriptor = css({
  alignItems: "center",
  display: "inline-flex",
  minWidth: 0
});

export const buttonIconSlotStyle: CSSMixinDescriptor = css({
  alignItems: "center",
  display: "inline-flex",
  flexShrink: 0,
  height: "1em",
  justifyContent: "center",
  width: "1em"
});

export const statusBannerRowStyle: CSSMixinDescriptor = css({
  alignItems: "center",
  display: "flex",
  gap: "var(--belt-space-2)",
  minHeight: "2rem",
  paddingBlock: "var(--belt-space-1)",
  paddingInline: "var(--belt-space-3)"
});

export const statusBannerBodyStyle: CSSMixinDescriptor = css({
  padding: "var(--belt-space-3)"
});

export const statusBannerActionStyle: CSSMixinDescriptor = css({
  marginInlineStart: "auto"
});

export const labelStyle: CSSMixinDescriptor = css({
  color: "var(--belt-color-foreground-strong)",
  display: "inline-flex",
  fontFamily: fontFamilyValue,
  ...typographyFeatureStyle,
  fontSize: "0.75rem",
  fontWeight: "600",
  lineHeight: "1.2"
});

export const fieldStyle: CSSMixinDescriptor = css({
  display: "grid",
  gap: "var(--belt-space-2)"
});

export const inputStyle: CSSMixinDescriptor = css({
  appearance: "none",
  backgroundColor: "var(--belt-color-elevation-2-inset)",
  border: "0.5px solid var(--belt-color-border)",
  borderRadius: "var(--belt-radius)",
  boxSizing: "border-box",
  color: "var(--belt-color-foreground)",
  fontFamily: fontFamilyValue,
  ...typographyFeatureStyle,
  fontSize: "0.8125rem",
  lineHeight: "1.2",
  minHeight: "1.875rem",
  outline: "none",
  paddingBlock: "0",
  paddingInline: "var(--belt-space-3)",
  width: "100%",
  "&::placeholder": {
    color: "var(--belt-color-foreground-subtle)"
  },
  "&:focus-visible": {
    borderColor: "var(--belt-color-focus)",
    boxShadow: "0 0 0 2px color-mix(in oklch, var(--belt-color-focus) 24%, transparent)"
  }
});

export const sliderStyle: CSSMixinDescriptor = css({
  accentColor: "var(--belt-color-primary-control)",
  width: "100%"
});

export const switchStyle: CSSMixinDescriptor = css({
  accentColor: "var(--belt-color-primary-control)"
});

export const menuButtonStyle: CSSMixinDescriptor = css({
  minWidth: "0"
});

export const menuListStyle: CSSMixinDescriptor = css({
  backgroundColor: "var(--belt-color-elevation-3)",
  border: "0.5px solid var(--belt-color-border-subtle)",
  borderRadius: "var(--belt-radius-outer)",
  boxShadow: "0 12px 30px color-mix(in oklch, var(--belt-color-foreground) 18%, transparent)",
  color: "var(--belt-color-foreground)",
  padding: "var(--belt-space-1)"
});

export const menuItemStyle: CSSMixinDescriptor = css({
  borderRadius: "var(--belt-radius)",
  color: "var(--belt-color-foreground)",
  "&[data-highlighted=\"true\"]": {
    backgroundColor: "var(--belt-color-elevation-3-hover)"
  }
});

export const optionStyle: CSSMixinDescriptor = css({
  borderRadius: "var(--belt-radius)",
  color: "var(--belt-color-foreground)"
});

export const selectTriggerStyle: CSSMixinDescriptor = css({
  minWidth: "0"
});

export const comboboxRootStyle: CSSMixinDescriptor = css({
  minWidth: "0"
});

export function panelRootStyle(options: {
  readonly elevation: Elevation;
  readonly focused: boolean;
  readonly inset: boolean;
}): CSSMixinDescriptor {
  return css({
    backgroundColor: `var(--belt-color-elevation-${options.elevation})`,
    borderRadius: "var(--belt-radius-outer)",
    boxShadow: options.inset
      ? "inset 0 1px 2px color-mix(in oklch, var(--belt-color-foreground) 12%, transparent)"
      : "0 1px 1px color-mix(in oklch, var(--belt-color-foreground) 10%, transparent), 0 8px 24px color-mix(in oklch, var(--belt-color-foreground) 12%, transparent)",
    boxSizing: "border-box",
    outline: options.focused ? "2px solid var(--belt-color-focus)" : "none",
    outlineOffset: "2px",
    padding: "1px",
    position: "relative"
  });
}

export function panelInnerStyle(options: {
  readonly elevation: Elevation;
  readonly inset: boolean;
}): CSSMixinDescriptor {
  return css({
    backgroundColor: `var(--belt-color-elevation-${options.elevation}${options.inset ? "-inset" : ""})`,
    border: "0.5px solid var(--belt-color-border-subtle)",
    borderRadius: "var(--belt-radius)",
    boxSizing: "border-box",
    color: "var(--belt-color-foreground)",
    minWidth: 0,
    overflow: "hidden"
  });
}

export function buttonToneStyle(tone: IntentTone): CSSMixinDescriptor {
  if (tone === "neutral") {
    return css({
      backgroundColor: "var(--belt-color-elevation-3)",
      border: "0.5px solid var(--belt-color-border)",
      boxShadow: "inset 0 1px 0 color-mix(in oklch, var(--belt-color-foreground-strong) 8%, transparent)",
      color: "var(--belt-color-foreground)",
      "&:hover": {
        backgroundColor: "var(--belt-color-elevation-3-hover)"
      },
      "&:active": {
        backgroundColor: "var(--belt-color-elevation-3-active)"
      }
    });
  }

  return css({
    backgroundColor: `var(--belt-color-${tone}-control)`,
    border: `0.5px solid color-mix(in oklch, var(--belt-color-${tone}-control-active) 70%, transparent)`,
    boxShadow: `inset 0 1px 0 color-mix(in oklch, var(--belt-color-${tone}-control-foreground-strong) 14%, transparent)`,
    color: `var(--belt-color-${tone}-control-foreground)`,
    "&:hover": {
      backgroundColor: `var(--belt-color-${tone}-control-hover)`
    },
    "&:active": {
      backgroundColor: `var(--belt-color-${tone}-control-active)`
    }
  });
}

export function ghostButtonToneStyle(tone: IntentTone): CSSMixinDescriptor {
  if (tone === "neutral") {
    return css({
      backgroundColor: "transparent",
      border: "0.5px solid transparent",
      color: "var(--belt-color-foreground-subtle)",
      "&:hover": {
        backgroundColor: "var(--belt-color-elevation-2-hover)",
        color: "var(--belt-color-foreground)"
      },
      "&:active": {
        backgroundColor: "var(--belt-color-elevation-2-active)",
        color: "var(--belt-color-foreground-strong)"
      }
    });
  }

  return css({
    backgroundColor: "transparent",
    border: "0.5px solid transparent",
    color: `var(--belt-color-${tone}-foreground)`,
    "&:hover": {
      backgroundColor: `color-mix(in oklch, var(--belt-color-${tone}) 70%, transparent)`,
      color: `var(--belt-color-${tone}-foreground-strong)`
    },
    "&:active": {
      backgroundColor: `color-mix(in oklch, var(--belt-color-${tone}) 90%, transparent)`
    }
  });
}

export function statusBannerRootStyle(tone: StatusBannerTone): CSSMixinDescriptor {
  const neutral = tone === "neutral";

  return css({
    backgroundColor: neutral ? "var(--belt-color-elevation-2)" : `var(--belt-color-${tone})`,
    border: `0.5px solid ${neutral ? "var(--belt-color-border-subtle)" : `color-mix(in oklch, var(--belt-color-${tone}-foreground) 24%, transparent)`}`,
    borderRadius: "var(--belt-radius-outer)",
    boxShadow: "0 1px 2px color-mix(in oklch, var(--belt-color-foreground) 10%, transparent)",
    boxSizing: "border-box",
    color: neutral ? "var(--belt-color-foreground)" : `var(--belt-color-${tone}-foreground)`
  });
}

export function statusBannerMessageStyle(tone: StatusBannerTone): CSSMixinDescriptor {
  return css({
    color: tone === "neutral" ? "var(--belt-color-foreground)" : `var(--belt-color-${tone}-foreground)`,
    flex: "1 1 auto",
    minWidth: 0
  });
}

export function statusBannerIconStyle(tone: StatusBannerTone): CSSMixinDescriptor {
  return iconStyle({
    tone: tone === "neutral" ? "foreground" : tone,
    size: "sm"
  });
}

function foregroundColor(tone: ForegroundTone): string {
  return tone === "foreground" ? "var(--belt-color-foreground)" : `var(--belt-color-foreground-${tone})`;
}

function iconColor(tone: IntentTone | ForegroundTone): string {
  if (tone === "neutral") return "var(--belt-color-foreground)";
  if (tone === "foreground" || tone === "subtle" || tone === "strong") return foregroundColor(tone);
  return `var(--belt-color-${tone}-foreground)`;
}

function textSize(size: TextSize): string {
  switch (size) {
    case "xs":
      return "0.75rem";
    case "md":
      return "0.875rem";
    case "sm":
      return "0.8125rem";
  }
}

function iconSize(size: "xs" | "sm" | "md"): string {
  switch (size) {
    case "xs":
      return "0.75rem";
    case "md":
      return "1rem";
    case "sm":
      return "0.875rem";
  }
}

function fontWeight(weight: "regular" | "medium" | "semibold"): string {
  switch (weight) {
    case "medium":
      return "500";
    case "semibold":
      return "600";
    case "regular":
      return "400";
  }
}

function withMix<Props_ extends WithMix>(
  handle: Handle<Props_>,
  styles: readonly CSSMixinDescriptor[]
): Handle<Props_> {
  return {
    ...handle,
    props: {
      ...handle.props,
      mix: [...styles, handle.props.mix]
    }
  };
}

function classNames(...parts: readonly (string | undefined)[]): string | undefined {
  const className = parts.filter(Boolean).join(" ");

  return className === "" ? undefined : className;
}

function composeMix(...parts: readonly unknown[]) {
  return parts as MixInput;
}
