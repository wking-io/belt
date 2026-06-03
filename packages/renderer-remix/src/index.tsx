// @jsxRuntime classic
// @jsx createElement
// @jsxFrag Fragment
import {
  createElement,
  createMixin,
  Fragment,
  ref,
  on,
  type ElementProps,
  type Handle,
  type Props,
  type RemixNode,
} from "@remix-run/ui";
import * as RemixCombobox from "@remix-run/ui/combobox";
import type { GlyphName } from "@repo/glyphs";
import {
  defineToolbarDefinition,
  extractToolbarConfig,
  type ToolDefinition,
  type ToolbarConfig,
  type ToolbarConfigSource,
  type ToolbarDefinition,
  type ToolbarTool,
} from "@repo/core";
import {
  Menu as RemixMenu,
  MenuItem as RemixMenuItem,
  MenuList as RemixMenuList,
  MenuRoot as RemixMenuRoot,
  MenuSelectEvent,
  MenuTrigger as RemixMenuTrigger,
  menuTriggerMix,
  onMenuSelect,
  Submenu as RemixSubmenu,
  type MenuItemProps as RemixMenuItemProps,
  type MenuListProps as RemixMenuListProps,
  type MenuProps as RemixMenuProps,
  type MenuRootProps as RemixMenuRootProps,
  type MenuSelectItem,
  type MenuTriggerProps as RemixMenuTriggerProps,
  type SubmenuProps as RemixSubmenuProps,
} from "./menu.js";
import {
  Select as RemixSelect,
  SelectChangeEvent,
  SelectList as RemixSelectList,
  SelectOption as RemixSelectOption,
  SelectRoot as RemixSelectRoot,
  SelectTrigger as RemixSelectTrigger,
  SelectValue as RemixSelectValue,
  onSelectChange,
  selectTriggerMix,
  type SelectListProps as RemixSelectListProps,
  type SelectOptionProps as RemixSelectOptionProps,
  type SelectProps as RemixSelectProps,
  type SelectRootProps as RemixSelectRootProps,
  type SelectTriggerProps as RemixSelectTriggerProps,
} from "./select.js";
import { Glyph } from "./glyph.js";

type IntentTone = "neutral" | "primary" | "info" | "success" | "warning" | "danger" | "foreground";
type Elevation = 1 | 2 | 3;
type Radius = "inner" | "default" | "outer";
type ForegroundTone = "foreground" | "subtle" | "strong";
type TextSize = "xs" | "sm" | "md";
export type ToolbarRendererModel = {
  readonly tools: readonly ToolbarTool[];
};

export function createToolbar<const Config extends ToolbarConfig>(
  config: Config,
): ToolbarDefinition<ToolbarConfig> {
  return defineToolbarDefinition({ toolbarConfig: config });
}

export function createToolbarRendererModel(source: ToolbarConfigSource): ToolbarRendererModel {
  return {
    tools: extractToolbarConfig(source).tools.map((tool: ToolDefinition) => ({
      id: tool.id,
      label: tool.label,
    })),
  };
}

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

export type PanelProps = Props<"div"> &
  SurfaceProps & {
    readonly children?: RemixNode;
    readonly radius?: Radius;
  };

export function Panel(handle: Handle<PanelProps>) {
  return () => {
    const {
      children,
      elevation = 1,
      mix,
      className,
      radius = "outer",
      tone,
      ...rootProps
    } = handle.props;

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

export type ButtonProps = Omit<Props<"button">, "children"> &
  SurfaceProps & {
    readonly children?: RemixNode;
    readonly startIcon?: GlyphName;
    readonly endIcon?: GlyphName;
    readonly loading?: boolean;
    readonly icon?: GlyphName;
  };

export type ButtonMixOptions = SurfaceProps & {
  readonly loading?: boolean;
};

const buttonMixDescriptor = createMixin<HTMLElement, [options: ButtonMixOptions], ElementProps>(
  (handle) => (options, props) => {
    const { elevation = 1, loading = false, tone = "neutral" } = options;

    return createElement(handle.element, {
      ...props,
      "aria-busy": loading || props["aria-busy"],
      class: classNames("belt-surface belt-button", props.class, props.className),
      "data-control": props["data-control"] ?? true,
      "data-elevation": props["data-elevation"] ?? elevation,
      "data-tone": props["data-tone"] ?? tone,
      disabled: props.disabled || loading,
      type: props.type ?? "button",
    });
  },
);

const ghostButtonMixDescriptor = createMixin<
  HTMLElement,
  [options: ButtonMixOptions],
  ElementProps
>((handle) => (options, props) => {
  const { elevation = 1, loading = false, tone = "neutral" } = options;

  return createElement(handle.element, {
    ...props,
    "aria-busy": loading || props["aria-busy"],
    class: classNames("belt-ghost-button", props.class, props.className),
    "data-control": props["data-control"] ?? true,
    "data-elevation": props["data-elevation"] ?? elevation,
    "data-tone": props["data-tone"] ?? tone,
    disabled: props.disabled || loading,
    type: props.type ?? "button",
  });
});

export function buttonMix(options: ButtonMixOptions = {}) {
  return buttonMixDescriptor(options);
}

export function ghostButtonMix(options: ButtonMixOptions = {}) {
  return ghostButtonMixDescriptor(options);
}

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
    const {
      children,
      class: classes,
      radius = "default",
      tone = "neutral",
      ...props
    } = handle.props;

    handle.context.set({ tone });

    return (
      <div
        {...props}
        class={classNames("belt-status-banner", classes)}
        data-radius={radius}
        data-tone={tone}
      >
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
  Action: StatusBannerActions,
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
      <label
        {...props}
        class={classNames("belt-label belt-text", classes)}
        data-size="sm"
        data-weight="medium"
        data-emphasis="strong"
      >
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

export type InputProps = Props<"input"> & {
  readonly startIcon?: GlyphName;
  readonly endIcon?: GlyphName;
  readonly elevation?: Elevation;
  readonly tone?: Omit<IntentTone, "foreground" | "neutral">;
};

export function Input() {
  return ({ tone, elevation = 2, class: classes, ...props }: InputProps) => {
    return (
      <div
        class={classNames("belt-surface", classes)}
        data-tone={tone}
        data-elevation={elevation}
        data-control
      >
        <div class={classNames("belt-surface__inner")}>
          <input {...props} class="belt-input" />
        </div>
      </div>
    );
  };
}

export type SliderProps = Omit<Props<"input">, "children" | "role" | "type"> & {
  readonly elevation?: Elevation;
  readonly label: string;
  readonly tone?: Omit<IntentTone, "foreground" | "neutral">;
  readonly unit?: string;
};

export function Slider(handle: Handle<SliderProps>) {
  let input: HTMLInputElement | undefined;
  let control: HTMLElement | undefined;
  let activePointerId: number | undefined;
  let hasInitialized = false;
  let lastValueProp: number | undefined;
  let sliderValue = 0;

  const resolveValue = (newValue: unknown) => {
    const min = sliderNumber(handle.props.min, 0);
    const max = sliderNumber(handle.props.max, 100);
    return Math.min(max, Math.max(min, sliderNumber(newValue, min)));
  };

  const setValue = async (newValue: unknown) => {
    const nextValue = resolveValue(newValue);
    if (sliderValue === nextValue) return;

    sliderValue = nextValue;
    return handle.update();
  };

  const updateFromPointer = async (event: Pick<PointerEvent, "clientX">) => {
    if (!input || handle.props.disabled || !control) return;

    const rect = control.getBoundingClientRect();
    const min = sliderNumber(handle.props.min, 0);
    const max = sliderNumber(handle.props.max, 100);
    const percent = rect.width <= 0 ? 0 : (event.clientX - rect.left) / rect.width;
    const rawValue = min + Math.min(1, Math.max(0, percent)) * (max - min);
    const nextValue = Math.min(
      max,
      Math.max(min, sliderStepValue(rawValue, min, String(handle.props.step ?? "1"))),
    );

    const signal = await setValue(nextValue);
    if (signal?.aborted) return;
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (!input || handle.props.disabled || event.button !== 0 || activePointerId !== undefined) {
      return;
    }
    const { currentTarget } = event;
    if (!(currentTarget instanceof HTMLElement)) return;

    event.preventDefault();
    activePointerId = event.pointerId;
    currentTarget.setPointerCapture(event.pointerId);
    input.focus();
    void updateFromPointer(event);
  };

  const handlePointerMove = (event: PointerEvent) => {
    const { currentTarget } = event;
    if (
      !(currentTarget instanceof HTMLElement) ||
      activePointerId !== event.pointerId ||
      !currentTarget.hasPointerCapture(event.pointerId)
    ) {
      return;
    }

    void updateFromPointer(event);
  };

  const handlePointerEnd = (event: PointerEvent) => {
    const { currentTarget } = event;
    if (!(currentTarget instanceof HTMLElement) || activePointerId !== event.pointerId) return;

    if (currentTarget.hasPointerCapture(event.pointerId)) {
      currentTarget.releasePointerCapture(event.pointerId);
    }

    activePointerId = undefined;
    input?.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const handleMouseDown = (event: MouseEvent) => {
    if (!input || handle.props.disabled || event.button !== 0 || activePointerId !== undefined) {
      return;
    }

    event.preventDefault();
    input.focus();
    void updateFromPointer(event);

    const controller = new AbortController();
    window.addEventListener("mousemove", (event) => void updateFromPointer(event), {
      signal: controller.signal,
    });
    window.addEventListener(
      "mouseup",
      () => {
        controller.abort();
        input?.dispatchEvent(new Event("change", { bubbles: true }));
      },
      { once: true, signal: controller.signal },
    );
  };

  const bindControl = (node: HTMLElement, signal: AbortSignal) => {
    control = node;
    node.addEventListener("pointerdown", handlePointerDown, { signal });
    node.addEventListener("pointermove", handlePointerMove, { signal });
    node.addEventListener("pointerup", handlePointerEnd, { signal });
    node.addEventListener("pointercancel", handlePointerEnd, { signal });
    node.addEventListener("lostpointercapture", handlePointerEnd, { signal });
    node.addEventListener("mousedown", handleMouseDown, { signal });
  };

  return ({
    class: classes,
    className,
    defaultValue,
    disabled,
    label,
    max,
    min,
    unit,
    value,
    tone = "primary",
    elevation = 1,
    ...inputProps
  }: SliderProps) => {
    const currentMin = sliderNumber(min, 0);
    const valueProp = value == null ? undefined : sliderNumber(value, currentMin);
    if (!hasInitialized) {
      sliderValue = resolveValue(valueProp ?? defaultValue ?? min ?? 0);
      lastValueProp = valueProp;
      hasInitialized = true;
    } else if (valueProp !== undefined && valueProp !== lastValueProp) {
      sliderValue = resolveValue(valueProp);
      lastValueProp = valueProp;
    }

    const resolvedValue = sliderValue;
    const percent = sliderPercent(resolvedValue, currentMin, sliderNumber(max, 100));
    const percentStyle = `${percent}%`;
    const disabledData = disabled ? "" : undefined;
    const id = inputProps.id ?? handle.id;

    return (
      <div
        class={classNames("belt-slider", classes, className)}
        data-disabled={disabledData}
        data-orientation="horizontal"
        role="group"
        style={{
          "--belt-slider-value": `${percentStyle}`,
        }}
      >
        <div class="belt-slider__header">
          <label
            class="belt-slider__label belt-text"
            for={id}
            data-size="sm"
            data-weight="medium"
            data-emphasis="strong"
          >
            {label}
          </label>
          <output class="belt-slider__value belt-text" data-size="xs">
            <span class="belt-slider__value-text">{resolvedValue}</span>
            {unit === undefined ? null : <span class="belt-slider__unit">{unit}</span>}
          </output>
        </div>
        <div
          class="belt-slider__control"
          data-disabled={disabledData}
          data-orientation="horizontal"
          mix={ref(bindControl)}
        >
          <div
            class="belt-slider__track"
            data-disabled={disabledData}
            data-orientation="horizontal"
          >
            <div
              class="belt-slider__indicator belt-surface"
              data-tone={tone}
              data-disabled={disabledData}
              data-orientation="horizontal"
            >
              <div class="belt-surface__inner"></div>
            </div>
            <div
              class="belt-slider__thumb belt-surface"
              data-elevation={elevation + 2}
              data-tone="foreground"
              data-disabled={disabledData}
              data-index={0}
              data-orientation="horizontal"
            >
              <div class="belt-surface__inner" />
              <input
                data-control
                {...inputProps}
                id={id}
                aria-orientation="horizontal"
                aria-valuenow={resolvedValue}
                disabled={disabled}
                max={max}
                min={min}
                mix={[
                  ref((node, signal) => {
                    input = node;
                    node.form?.addEventListener(
                      "reset",
                      () => queueMicrotask(() => void setValue(defaultValue ?? min ?? 0)),
                      { signal },
                    );
                  }),
                  on("input", (e) => {
                    void setValue(e.currentTarget.valueAsNumber);
                  }),
                  on("change", (e) => {
                    void setValue(e.currentTarget.valueAsNumber);
                  }),
                ]}
                style={{
                  cursor: disabled ? "not-allowed" : "pointer",
                  display: "block",
                  height: "100%",
                  inset: 0,
                  margin: 0,
                  opacity: 0,
                  padding: 0,
                  pointerEvents: "none",
                  position: "absolute",
                  width: "100%",
                  zIndex: 1,
                }}
                type="range"
                value={resolvedValue}
              />
            </div>
            <div class="belt-slider__fill belt-surface" data-elevation={elevation + 1}>
              <div class="belt-surface__inner"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };
}

export type SwitchProps = Omit<Props<"input">, "children" | "role" | "type"> & SurfaceProps;

export function Switch(handle: Handle<SwitchProps>) {
  let checkedState = Boolean(handle.props.checked ?? handle.props.defaultChecked);

  const setChecked = (checked: boolean) => {
    if (checkedState === checked) return;

    checkedState = checked;
    void handle.update();
  };

  return ({
    checked,
    class: classes,
    defaultChecked,
    disabled,
    id,
    mix,
    name,
    required,
    value,
    tone = "primary",
    elevation = 2,
    ...inputProps
  }: SwitchProps) => {
    const checkedData = checkedState ? "" : undefined;
    const disabledData = disabled ? "" : undefined;

    return (
      <>
        <div
          aria-checked={checkedState}
          class={classNames("belt-switch belt-surface", classes)}
          data-checked={checkedData}
          data-disabled={disabledData}
          data-tone={checkedState ? tone : "neutral"}
          data-elevation={elevation}
          id={id}
          mix={[
            on("click", (event) => {
              event.preventDefault();
              if (!disabled) setChecked(!checkedState);
            }),
            on("keydown", (event) => {
              if (event.key !== " " && event.key !== "Enter") return;
              event.preventDefault();
              if (!disabled) setChecked(!checkedState);
            }),
          ]}
          role="switch"
          tabindex={disabled ? undefined : 0}
        >
          <div class="belt-surface__inner">
            <div
              class="belt-switch__thumb belt-surface"
              data-elevation={elevation + 2}
              data-tone="foreground"
              data-checked={checkedData}
              data-disabled={disabledData}
            >
              <div class="belt-surface__inner" />
            </div>
            <input
              data-control
              {...inputProps}
              aria-hidden="true"
              checked={checkedState}
              disabled={disabled}
              name={name}
              required={required}
              mix={[
                mix,
                ref((node, signal) => {
                  node.form?.addEventListener(
                    "reset",
                    () => queueMicrotask(() => setChecked(node.checked)),
                    { signal },
                  );
                }),
                on("input", (event) => {
                  setChecked(event.currentTarget.checked);
                }),
                on("change", (event) => {
                  setChecked(event.currentTarget.checked);
                }),
              ]}
              style={{
                border: 0,
                clipPath: "inset(50%)",
                height: "1px",
                margin: "-1px",
                overflow: "hidden",
                padding: 0,
                position: "absolute",
                whiteSpace: "nowrap",
                width: "1px",
              }}
              tabindex={-1}
              type="checkbox"
              value={value}
            />
          </div>
        </div>
      </>
    );
  };
}

export type MenuProps = RemixMenuProps & WithClassName & WithMix;
export type MenuRootProps = RemixMenuRootProps;
export type MenuTriggerProps = RemixMenuTriggerProps & WithClassName & WithMix;
export type MenuItemProps = RemixMenuItemProps & WithClassName & WithMix;
export type SubmenuProps = RemixSubmenuProps & WithClassName & WithMix;
export type MenuListProps = RemixMenuListProps & WithClassName & WithMix;

export function Menu(handle: Handle<MenuProps>) {
  return RemixMenu({
    ...handle,
    props: {
      ...handle.props,
      triggerMix: handle.props.triggerMix ?? ghostButtonMix(),
    },
  });
}

export function MenuTrigger(handle: Handle<MenuTriggerProps>) {
  return RemixMenuTrigger(handle);
}

export function MenuItem(handle: Handle<MenuItemProps>) {
  return RemixMenuItem(handle);
}

export function Submenu(handle: Handle<SubmenuProps>) {
  return RemixSubmenu(handle);
}

export function MenuList(handle: Handle<MenuListProps>) {
  return RemixMenuList(handle);
}

export { menuTriggerMix, onMenuSelect, MenuSelectEvent, type MenuSelectItem };
export { RemixMenuRoot as MenuRoot };

export type SelectProps = RemixSelectProps & WithClassName & WithMix;
export type SelectRootProps = RemixSelectRootProps;
export type SelectTriggerProps = RemixSelectTriggerProps & WithClassName & WithMix;
export type SelectListProps = RemixSelectListProps & WithClassName & WithMix;
export type SelectOptionProps = RemixSelectOptionProps & WithClassName & WithMix;

export function Select(handle: Handle<SelectProps>) {
  return RemixSelect(handle);
}

export function SelectTrigger(handle: Handle<SelectTriggerProps>) {
  return RemixSelectTrigger(handle);
}

export function SelectList(handle: Handle<SelectListProps>) {
  return RemixSelectList(handle);
}

export function SelectValue(handle: Handle) {
  return RemixSelectValue(handle);
}

export function SelectOption(handle: Handle<SelectOptionProps>) {
  return RemixSelectOption(handle);
}

export { onSelectChange, selectTriggerMix, SelectChangeEvent };
export { RemixSelectRoot as SelectRoot };

export type ComboboxProps = RemixCombobox.ComboboxProps &
  WithClassName &
  WithMix & {
    readonly "data-elevation"?: Elevation;
    readonly elevation?: Elevation;
  };
export type ComboboxOptionProps = RemixCombobox.ComboboxOptionProps & WithClassName & WithMix;

export function Combobox(handle: Handle<ComboboxProps>) {
  const { elevation = 3, "data-elevation": dataElevation, ...props } = handle.props;
  const wrappedHandle = withClass(
    {
      ...handle,
      props: {
        ...props,
        "data-elevation": dataElevation ?? elevation,
      },
    },
    "belt-combobox",
  );
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

function sliderNumber(value: unknown, fallback: number): number {
  const numeric =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(numeric) ? numeric : fallback;
}

function sliderPercent(value: number, min: number, max: number): number {
  const range = max - min;
  if (range <= 0) return 0;

  return Math.min(100, Math.max(0, ((value - min) / range) * 100));
}

function sliderStepValue(value: number, min: number, step: string): number {
  if (step === "any") return value;

  const stepValue = sliderNumber(step, 1);
  if (stepValue <= 0) return value;

  const precision = Math.max(decimalPlaces(min), decimalPlaces(stepValue));
  return Number((Math.round((value - min) / stepValue) * stepValue + min).toFixed(precision));
}

function decimalPlaces(value: number): number {
  const decimal = String(value).split(".")[1];
  return decimal?.length ?? 0;
}

function classNames(...parts: readonly (string | undefined)[]): string | undefined {
  const className = parts.filter(Boolean).join(" ");

  return className === "" ? undefined : className;
}
