// @jsxRuntime classic
// @jsx createElement
// @jsxFrag Fragment
// oxlint-disable-next-line no-unused-vars -- Remix UI classic JSX needs the factory in scope.
import {
  // oxlint-disable-next-line no-unused-vars -- Remix UI classic JSX needs the factory in scope.
  createElement,
  Fragment,
  type Handle,
  type Props,
  type RemixNode,
} from "@remix-run/ui";
import * as RemixCombobox from "@remix-run/ui/combobox";
import { Glyph } from "@remix-run/ui/glyph";
import * as RemixMenu from "@remix-run/ui/menu";
import * as RemixSelect from "@remix-run/ui/select";
import type { GlyphName } from "@repo/glyphs";

type IntentTone = "neutral" | "primary" | "info" | "success" | "warning" | "danger";
type Elevation = 1 | 2 | 3;
type Radius = "inner" | "default" | "outer";
type ForegroundTone = "foreground" | "subtle" | "strong";
type TextSize = "xs" | "sm" | "md";

type WithClassName = {
  readonly className?: string;
};

type WithMix = {
  readonly mix?: unknown;
};

type SurfaceProps = {
  readonly tone?: IntentTone;
  readonly elevation?: Elevation;
};

export type { IntentTone, Elevation, Radius, ForegroundTone, TextSize };

export type PanelProps = Props<"div"> & SurfaceProps & {
  readonly children?: RemixNode;
  readonly radius?: Radius;
};

export function Panel(handle: Handle<PanelProps>) {
  return () => {
    const { children, elevation = 1, mix, className, radius = "outer", tone, ...rootProps } = handle.props;

    return (
      <div
        {...rootProps}
        class={classNames("belt-surface", className)}
        data-elevation={String(elevation)}
        data-radius={radius}
        data-tone={tone}
        mix={mix}
      >
        <div class={classNames("belt-surface__inner")}>{children}</div>
      </div>
    );
  };
}

export type ButtonProps = Omit<Props<"button">, "children"> & SurfaceProps & {
  readonly children?: RemixNode;
  readonly startIcon?: GlyphName;
  readonly endIcon?: GlyphName;
  readonly loading?: boolean;
  readonly icon?: GlyphName;
};

export function Button(handle: Handle<ButtonProps>) {
  return () => {
    const {
      children,
      disabled,
      endIcon,
      loading = false,
      icon,
      startIcon,
      tone = "neutral",
      elevation = 1,
      type = "button",
      class: classes,
      ...buttonProps
    } = handle.props;

    const resolvedStartIcon = loading ? "spinner" : startIcon;

    return (
      <div class={classNames("belt-surface", classes)} data-tone={tone} data-elevation={elevation}>
        <div class={classNames("belt-surface__inner")}>
          <button
            {...buttonProps}
            class={classNames("belt-button")}
            aria-busy={loading || undefined}
            disabled={disabled || loading}
            type={type}
            data-control
          >
            {icon ? (
              <span class={classNames("belt-button__icon")}>
                <Glyph name={icon} />
              </span>
            ) : (
              <Fragment>
                {resolvedStartIcon ? (
                  <span class={classNames("belt-button__start-icon")}>
                    <Glyph name={resolvedStartIcon} />
                  </span>
                ) : null}
                {children !== undefined ? <span>{children}</span> : null}
                {endIcon ? (
                  <span class={classNames("belt-button__end-icon")}>
                    <Glyph name={endIcon} />
                  </span>
                ) : null}
              </Fragment>
            )}
          </button>
        </div>
      </div>
    );
  };
}

export type GhostButtonProps = ButtonProps & {
  readonly variant?: "default" | "icon";
};

export function GhostButton(handle: Handle<GhostButtonProps>) {
  return () => {
    const {
      children,
      disabled,
      endIcon,
      loading = false,
      icon,
      startIcon,
      elevation = 1,
      tone = "neutral",
      type = "button",
      class: classes,
      ...buttonProps
    } = handle.props;

    const resolvedStartIcon = loading ? "spinner" : startIcon;

    return (
      <button
        {...buttonProps}
        class={classNames("belt-ghost-button", classes)}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        type={type}
        data-tone={tone}
        data-elevation={elevation}
        data-control
      >
        {icon ? (
          <span class={classNames("belt-ghost-button__icon")}>
            <Glyph name={icon} />
          </span>
        ) : (
          <Fragment>
            {resolvedStartIcon ? (
              <span class={classNames("belt-ghost-button__start-icon")}>
                <Glyph name={resolvedStartIcon} />
              </span>
            ) : null}
            {children !== undefined ? <span>{children}</span> : null}
            {endIcon ? (
              <span class={classNames("belt-ghost-button__end-icon")}>
                <Glyph name={endIcon} />
              </span>
            ) : null}
          </Fragment>
        )}
      </button>
    );
  };
}


export type StatusBannerRootProps = Props<"div"> & {
  readonly children?: RemixNode;
  readonly radius?: Radius;
  readonly tone?: IntentTone;
};

export function StatusBannerRoot(handle: Handle<StatusBannerRootProps, { tone: IntentTone }>) {
  return () => {
    const { children, class: classes, radius = "default", tone = "neutral", ...props } = handle.props;

    handle.context.set({ tone });

    return (
      <div {...props} class={classNames("belt-status-banner", classes)} data-radius={radius} data-tone={tone}>
        {children}
      </div>
    );
  };
}

export function StatusBannerRow(handle: Handle<Props<"div">>) {
  return () => {
    const { children, class: classes, ...props } = handle.props;

    return (
      <div {...props} class={classNames("belt-status-banner__row", classes)}>
        {children}
      </div>
    );
  };
}

export function StatusBannerBody(handle: Handle<Props<"div">>) {
  return () => {
    const { children, class: classes, ...props } = handle.props;

    return (
      <div {...props} class={classNames("belt-status-banner__body", classes)}>
        {children}
      </div>
    );
  };
}

export function StatusBannerMessage(handle: Handle<Props<"span">>) {
  return () => {
    const { children, class: classes, ...props } = handle.props;

    return (
      <span {...props} class={classNames("belt-status-banner__message", classes)}>
        {children}
      </span>
    );
  };
}

export function StatusBannerIcon(handle: Handle<Props<"span"> & { readonly glyph: GlyphName }>) {
  return () => {
    const { class: classes, glyph, ...props } = handle.props;

    return (
      <span {...props} class={classNames("belt-status-banner__icon", classes)}>
        <Glyph name={glyph} />
      </span>
    );
  };
}

export function StatusBannerActions(handle: Handle<Props<"div">>) {
  return () => {
    const { children, class: classes, ...props } = handle.props;

    return (
      <div {...props} class={classNames("belt-status-banner__actions", classes)}>
        {children}
      </div>
    );
  };
}

export const StatusBanner = {
  Actions: StatusBannerActions,
  Body: StatusBannerBody,
  Icon: StatusBannerIcon,
  Message: StatusBannerMessage,
  Root: StatusBannerRoot,
  Row: StatusBannerRow,
} as const;

export type LabelProps = Props<"label">;

export function Label(handle: Handle<LabelProps>) {
  return () => {
    const { children, class: classes, ...props } = handle.props;

    return (
      <label {...props} class={classNames("belt-label", classes)}>
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
    const { children, class: classes, ...props } = handle.props;

    return (
      <div {...props} class={classNames("belt-field", classes)}>
        {children}
      </div>
    );
  };
}

export type InputProps = Props<"input"> & SurfaceProps & {
  readonly startIcon?: GlyphName;
  readonly endIcon?: GlyphName;
};

export function Input() {
  return ({ tone, elevation, class: classes, ...props }: InputProps) => {
    return (
      <div class={classNames("belt-surface", classes)} data-tone={tone} data-elevation={elevation}>
        <div class={classNames("belt-surface__inner")}>
          <input {...props} class="belt-input" />
        </div>
      </div>
    );
  };
}

export type SliderProps = Omit<Props<"input">, "role" | "type">;

export function Slider(handle: Handle<SliderProps>) {
  return () => {
    const { class: classes, ...props } = handle.props;

    return <input {...props} class={classNames("belt-slider", classes)} type="range" />;
  };
}

export type SwitchProps = Omit<Props<"input">, "role" | "type">;

export function Switch(handle: Handle<SwitchProps>) {
  return () => {
    const { class: classes, ...props } = handle.props;

    return <input {...props} class={classNames("belt-switch", classes)} type="checkbox" role="switch" />;
  };
}

export type MenuProps = RemixMenu.MenuProps & WithClassName & WithMix;
export type MenuItemProps = RemixMenu.MenuItemProps & WithClassName & WithMix;
export type SubmenuProps = RemixMenu.SubmenuProps & WithClassName & WithMix;
export type MenuListProps = RemixMenu.MenuListProps & WithClassName & WithMix;

export function Menu(handle: Handle<MenuProps>) {
  const wrappedHandle = withClass(handle, "belt-menu__trigger");
  return RemixMenu.Menu(wrappedHandle);
}

export function MenuItem(handle: Handle<MenuItemProps>) {
  const wrappedHandle = withClass(handle, "belt-menu__item");
  return RemixMenu.MenuItem(wrappedHandle);
}

export function Submenu(handle: Handle<SubmenuProps>) {
  const wrappedHandle = withClass(handle, "belt-menu__trigger");
  return RemixMenu.Submenu(wrappedHandle);
}

export function MenuList(handle: Handle<MenuListProps>) {
  const wrappedHandle = withClass(handle, "belt-menu__list");
  return RemixMenu.MenuList(wrappedHandle);
}

export const onMenuSelect = RemixMenu.onMenuSelect;
export const MenuSelectEvent = RemixMenu.MenuSelectEvent;
export type { MenuSelectItem } from "@remix-run/ui/menu";

export type SelectProps = RemixSelect.SelectProps & WithClassName & WithMix;
export type SelectOptionProps = RemixSelect.SelectOptionProps & WithClassName & WithMix;

export function Select(handle: Handle<SelectProps>) {
  const wrappedHandle = withClass(handle, "belt-select__trigger");
  return RemixSelect.Select(wrappedHandle);
}

export function SelectOption(handle: Handle<SelectOptionProps>) {
  const wrappedHandle = withClass(handle, "belt-select__item");
  return RemixSelect.Option(wrappedHandle);
}

export const onSelectChange = RemixSelect.onSelectChange;
export const SelectChangeEvent = RemixSelect.SelectChangeEvent;

export type ComboboxProps = RemixCombobox.ComboboxProps & WithClassName & WithMix;
export type ComboboxOptionProps = RemixCombobox.ComboboxOptionProps & WithClassName & WithMix;

export function Combobox(handle: Handle<ComboboxProps>) {
  const wrappedHandle = withClass(handle, "belt-combobox");
  return RemixCombobox.Combobox(wrappedHandle);
}

export function ComboboxOption(handle: Handle<ComboboxOptionProps>) {
  const wrappedHandle = withClass(handle, "belt-combobox__item");
  return RemixCombobox.ComboboxOption(wrappedHandle);
}

export const onComboboxChange = RemixCombobox.onComboboxChange;
export const ComboboxChangeEvent = RemixCombobox.ComboboxChangeEvent;

export type { GlyphDefinition, GlyphName, GlyphNode, GlyphProps } from "./glyph.js";
export {
  Glyph,
  glyphDefinitions,
  glyphIds,
  glyphNames,
  GlyphSheet,
  ToolbarGlyphSheet,
} from "./glyph.js";

function withClass<Props_>(handle: Handle<Props_>, className: string): Handle<Props_> {
  const props = handle.props as Props_ & {
    readonly class?: string | undefined;
    readonly className?: string | undefined;
  };

  return {
    ...handle,
    props: {
      ...props,
      class: classNames(className, props.class, props.className),
    } as Props_,
  };
}

function classNames(...parts: readonly (string | undefined)[]): string | undefined {
  const className = parts.filter(Boolean).join(" ");

  return className === "" ? undefined : className;
}
