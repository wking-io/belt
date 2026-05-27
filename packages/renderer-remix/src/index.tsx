// @jsxRuntime classic
// @jsx createElement
// @jsxFrag Fragment
import {
  createElement,
  Fragment,
  ref,
  on,
  type Handle,
  type Props,
  type RemixNode,
} from "@remix-run/ui";
import * as RemixCombobox from "@remix-run/ui/combobox";
import { Glyph } from "@remix-run/ui/glyph";
import * as RemixMenu from "@remix-run/ui/menu";
import * as RemixSelect from "@remix-run/ui/select";
import type { GlyphName } from "@repo/glyphs";

type IntentTone = "neutral" | "primary" | "info" | "success" | "warning" | "danger" | "foreground";
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

export type InputProps = Props<"input"> & {
  readonly startIcon?: GlyphName;
  readonly endIcon?: GlyphName;
  readonly elevation?: Elevation;
  readonly tone?: Omit<IntentTone, "foreground" | "neutral">;
};

export function Input() {
  return ({ tone, elevation = 2, class: classes, ...props }: InputProps) => {
    return (
      <div class={classNames("belt-surface", classes)} data-tone={tone} data-elevation={elevation}>
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

export function Slider(handle: Handle) {
  let input: HTMLInputElement | undefined;
  let thumb: HTMLElement | undefined;
  let control: HTMLElement | undefined;
  let valueText: HTMLElement | undefined;
  let activePointerId: number | undefined;
  let currentValue: number | undefined;
  let lastValueProp: number | undefined;
  let genId = Math.random().toString(36).substring(2, 15);

  const update = (newValue: number) => {
    if (!input) return;
    const currentMin = sliderNumber(input.min, 0);
    const currentMax = sliderNumber(input.max, 100);
    const resolvedValue = Math.min(
      currentMax,
      Math.max(currentMin, sliderNumber(newValue, currentMin)),
    );
    const percentStyle = `${sliderPercent(resolvedValue, currentMin, currentMax)}%`;

    currentValue = resolvedValue;
    input.value = String(resolvedValue);
    input.setAttribute("aria-valuenow", String(resolvedValue));
    if (valueText) {
      valueText.textContent = String(resolvedValue);
    }
    input
      .closest<HTMLElement>(".belt-slider")
      ?.style.setProperty("--belt-slider-value", percentStyle);
  };

  const updateFocus = () => {
    if (!input || !thumb) return;
    if (input.matches(":focus-visible")) {
      thumb.setAttribute("data-focus-visible", "");
    } else {
      thumb.removeAttribute("data-focus-visible");
    }
  };

  const updateFromPointer = (event: Pick<PointerEvent, "clientX">) => {
    if (!input || input.disabled || !control) return;

    const rect = control.getBoundingClientRect();
    const min = sliderNumber(input.min, 0);
    const max = sliderNumber(input.max, 100);
    const percent = rect.width <= 0 ? 0 : (event.clientX - rect.left) / rect.width;
    const rawValue = min + Math.min(1, Math.max(0, percent)) * (max - min);
    const nextValue = Math.min(max, Math.max(min, sliderStepValue(rawValue, min, input.step)));

    update(nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (!input || input.disabled || event.button !== 0 || activePointerId !== undefined) return;
    const { currentTarget } = event;
    if (!(currentTarget instanceof HTMLElement)) return;

    event.preventDefault();
    activePointerId = event.pointerId;
    currentTarget.setPointerCapture(event.pointerId);
    input.focus();
    updateFromPointer(event);
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

    updateFromPointer(event);
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
    if (!input || input.disabled || event.button !== 0 || activePointerId !== undefined) return;

    event.preventDefault();
    input.focus();
    updateFromPointer(event);

    const controller = new AbortController();
    window.addEventListener("mousemove", updateFromPointer, { signal: controller.signal });
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

    const shouldSyncExternalValue = valueProp !== undefined && valueProp !== lastValueProp;

    if (shouldSyncExternalValue) {
      currentValue = valueProp;
      lastValueProp = valueProp;
    }

    const resolvedValue = sliderNumber(currentValue ?? defaultValue ?? min ?? 0, 0);
    const percent = sliderPercent(resolvedValue, currentMin, sliderNumber(max, 100));
    const percentStyle = `${percent}%`;
    const disabledData = disabled ? "" : undefined;
    const id = inputProps.id ?? genId;

    if (shouldSyncExternalValue) {
      handle.queueTask(() => update(resolvedValue));
    }

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
          <label class="belt-text" for={id} data-size="sm" data-weight="medium" data-emphasis="strong">
            {label}
          </label>
          <output class="belt-slider__value belt-text" data-size="xs">
            <span
              class="belt-slider__value-text"
              mix={ref((node) => {
                valueText = node;
              })}
            >
              {resolvedValue}
            </span>
            {unit === undefined ? null : <span class="belt-slider__unit" data-size="xs">{unit}</span>}
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
              mix={ref((node) => {
                thumb = node;
              })}
            >
              <div class="belt-surface__inner" />
              <input
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
                      () => queueMicrotask(() => update(sliderNumber(defaultValue, 0))),
                      { signal },
                    );
                  }),
                  on("input", (e) => {
                    update(e.currentTarget.valueAsNumber);
                  }),
                  on("change", (e) => {
                    update(e.currentTarget.valueAsNumber);
                  }),
                  on("focus", updateFocus),
                  on("blur", updateFocus),
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
                defaultValue={resolvedValue}
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
