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
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type PointerEvent,
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
export type StatusBannerTone = IntentTone;

type SurfaceProps = {
  readonly elevation?: Elevation;
  readonly tone?: IntentTone;
};

type ButtonPropsBase = Omit<ComponentProps<typeof BaseButton>, "children"> &
  SurfaceProps & {
    readonly children?: ReactNode;
    readonly endIcon?: GlyphName;
    readonly icon?: GlyphName;
    readonly loading?: boolean;
    readonly startIcon?: GlyphName;
  };

export type PanelProps = ComponentProps<"div"> &
  SurfaceProps & {
    readonly padding?: "none" | "sm";
    readonly radius?: Radius;
  };
export type ButtonProps = ButtonPropsBase;
export type GhostButtonProps = ButtonPropsBase & {
  readonly variant?: "default" | "icon";
};
export type DragIndicatorProps = ComponentProps<"div"> & {
  readonly dots?: number;
};
export type ToolbarPosition = {
  readonly x: number;
  readonly y: number;
};
export type ToolbarProps = Omit<ComponentProps<"div">, "children"> &
  SurfaceProps & {
    readonly children?: ReactNode;
    readonly defaultPosition?: ToolbarPosition;
    readonly defaultVisible?: boolean;
    readonly radius?: Radius;
  };
export type StatusBannerRootProps = ComponentProps<"div"> & {
  readonly radius?: Radius;
  readonly tone?: StatusBannerTone;
};
export type StatusBannerIconProps = ComponentProps<"span"> & {
  readonly glyph?: GlyphName;
};
export type LabelProps = ComponentProps<typeof BaseField.Label>;
export type FieldProps = ComponentProps<typeof BaseField.Root>;
export type InputProps = ComponentProps<typeof BaseInput> & SurfaceProps;
export type SliderProps = ComponentProps<typeof BaseSlider.Root> & {
  readonly label?: ReactNode;
  readonly unit?: ReactNode;
};
export type SwitchProps = ComponentProps<typeof BaseSwitch.Root>;

export type MenuProps = ComponentProps<typeof BaseMenu.Root> & {
  readonly children?: ReactNode;
  readonly label: ReactNode;
  readonly menuLabel?: string;
  readonly triggerProps?: ComponentProps<typeof BaseMenu.Trigger>;
};
export type MenuItemProps = ComponentProps<typeof BaseMenu.Item>;
export type MenuListProps = ComponentProps<typeof BaseMenu.Popup>;
export type SubmenuProps = ComponentProps<typeof BaseMenu.SubmenuRoot> & {
  readonly children?: ReactNode;
  readonly label: ReactNode;
  readonly listProps?: MenuListProps;
  readonly menuLabel?: string;
  readonly triggerProps?: ComponentProps<typeof BaseMenu.SubmenuTrigger>;
};

export type SelectProps<Value = string> = ComponentProps<typeof BaseSelect.Root<Value>> & {
  readonly children?: ReactNode;
  readonly defaultLabel: ReactNode;
  readonly triggerProps?: ComponentProps<typeof BaseSelect.Trigger>;
};
export type SelectOptionProps = ComponentProps<typeof BaseSelect.Item>;

export type ComboboxProps<Value = string> = ComponentProps<typeof BaseCombobox.Root<Value>> & {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly placeholder?: string;
};
export type ComboboxOptionProps = ComponentProps<typeof BaseCombobox.Item>;

export type GlyphSheetProps = Omit<SVGProps<SVGSVGElement>, "children">;

export type GlyphProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  readonly name: GlyphName;
};

export function Panel(props: PanelProps): ReactElement {
  const {
    children,
    className,
    elevation = 1,
    padding = "none",
    radius = "outer",
    tone,
    ...rootProps
  } = props;

  return (
    <div
      {...rootProps}
      className={classNames("belt-surface", classNameString(className))}
      data-elevation={String(elevation)}
      data-padding={padding}
      data-radius={radius}
      data-tone={tone}
    >
      <div className="belt-surface__inner">{children}</div>
    </div>
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

  return (
    <div className="belt-surface" data-elevation={elevation} data-tone={tone}>
      <div className="belt-surface__inner">
        <BaseButton
          {...buttonProps}
          aria-busy={loading || undefined}
          className={mergeClassName("belt-button", className)}
          data-control
          disabled={disabled || loading}
          type={type}
        >
          {buttonContents({ children, endIcon, icon, loading, startIcon, part: "belt-button" })}
        </BaseButton>
      </div>
    </div>
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

  return (
    <BaseButton
      {...buttonProps}
      aria-busy={loading || undefined}
      className={mergeClassName("belt-ghost-button", className)}
      data-control
      data-elevation={elevation}
      data-tone={tone}
      disabled={disabled || loading}
      type={type}
    >
      {buttonContents({ children, endIcon, icon, loading, startIcon, part: "belt-ghost-button" })}
    </BaseButton>
  );
}

export function DragIndicator(props: DragIndicatorProps): ReactElement {
  const {
    className,
    dots = 8,
    onMouseDown,
    onMouseUp,
    onPointerCancel,
    onPointerDown,
    onPointerUp,
    ...rootProps
  } = props;
  const [dragging, setDragging] = useState(false);
  const dotCount = Math.max(0, Math.floor(dots));

  useEffect(() => {
    if (!dragging) return undefined;

    const stopDragging = () => setDragging(false);
    window.addEventListener("pointercancel", stopDragging);
    window.addEventListener("pointerup", stopDragging);

    return () => {
      window.removeEventListener("pointercancel", stopDragging);
      window.removeEventListener("pointerup", stopDragging);
    };
  }, [dragging]);

  return (
    <div
      {...rootProps}
      className={classNames("belt-drag-indicator", className)}
      data-dragging={dragging ? "true" : undefined}
      onMouseDown={(event) => {
        setDragging(true);
        onMouseDown?.(event);
      }}
      onMouseUp={(event) => {
        setDragging(false);
        onMouseUp?.(event);
      }}
      onPointerCancel={(event) => {
        setDragging(false);
        onPointerCancel?.(event);
      }}
      onPointerDown={(event) => {
        setDragging(true);
        onPointerDown?.(event);
      }}
      onPointerUp={(event) => {
        setDragging(false);
        onPointerUp?.(event);
      }}
    >
      {Array.from({ length: dotCount }, (_, index) => (
        <span aria-hidden="true" className="belt-drag-indicator__dot" key={index} />
      ))}
    </div>
  );
}

export function Toolbar(props: ToolbarProps): ReactElement | null {
  const {
    children,
    className,
    defaultPosition = { x: 16, y: 16 },
    defaultVisible = true,
    elevation = 1,
    onKeyDown,
    radius = "outer",
    style,
    tone,
    ...rootProps
  } = props;
  const toolbarRef = useRef<HTMLDivElement>(null);
  const lastMouseRef = useRef<ToolbarPosition>(defaultPosition);
  const dragOffsetRef = useRef<ToolbarPosition>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState<ToolbarPosition>(defaultPosition);
  const [visible, setVisible] = useState(defaultVisible);

  useEffect(() => {
    const trackMouse = (event: globalThis.MouseEvent) => {
      lastMouseRef.current = { x: event.clientX, y: event.clientY };
    };

    window.addEventListener("mousemove", trackMouse);
    return () => window.removeEventListener("mousemove", trackMouse);
  }, []);

  useEffect(() => {
    const toggleToolbar = (event: globalThis.KeyboardEvent) => {
      const modifierPressed = isApplePlatform() ? event.metaKey : event.ctrlKey;
      if (event.key.toLowerCase() !== "b" || !modifierPressed) return;

      event.preventDefault();
      setVisible((current) => {
        if (!current) {
          setPosition(clampToolbarPosition(lastMouseRef.current, toolbarRef.current));
        }

        return !current;
      });
    };

    window.addEventListener("keydown", toggleToolbar);
    return () => window.removeEventListener("keydown", toggleToolbar);
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    const clampToViewport = () =>
      setPosition((current) => clampToolbarPosition(current, toolbarRef.current));
    window.addEventListener("resize", clampToViewport);

    return () => window.removeEventListener("resize", clampToViewport);
  }, [visible]);

  useLayoutEffect(() => {
    if (!visible) return;

    setPosition((current) => clampToolbarPosition(current, toolbarRef.current));
  }, [visible, children]);

  useEffect(() => {
    if (!dragging) return undefined;

    const drag = (event: globalThis.MouseEvent | globalThis.PointerEvent) => {
      setPosition(
        clampToolbarPosition(
          {
            x: event.clientX - dragOffsetRef.current.x,
            y: event.clientY - dragOffsetRef.current.y,
          },
          toolbarRef.current,
        ),
      );
    };
    const stopDragging = () => setDragging(false);

    window.addEventListener("mousemove", drag);
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
    window.addEventListener("pointermove", drag);
    window.addEventListener("pointerup", stopDragging);

    return () => {
      window.removeEventListener("mousemove", drag);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
      window.removeEventListener("pointermove", drag);
      window.removeEventListener("pointerup", stopDragging);
    };
  }, [dragging]);

  if (!visible) return null;

  const startDragging = (clientX: number, clientY: number) => {
    const rect = toolbarRef.current?.getBoundingClientRect();
    dragOffsetRef.current = rect
      ? { x: clientX - rect.left, y: clientY - rect.top }
      : { x: 0, y: 0 };
    setDragging(true);
  };

  const toolbarStyle = {
    ...style,
    "--belt-toolbar-x": `${position.x}px`,
    "--belt-toolbar-y": `${position.y}px`,
  } as CSSProperties;
  const panelProps = {
    elevation,
    padding: "sm" as const,
    radius,
    ...(tone === undefined ? {} : { tone }),
  };

  return (
    <div
      {...rootProps}
      className={classNames("belt-toolbar", className)}
      data-dragging={dragging ? "true" : undefined}
      onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
      }}
      ref={toolbarRef}
      style={toolbarStyle}
    >
      <Panel {...panelProps}>
        <div className="belt-toolbar__inner">
          <DragIndicator
            onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
              startDragging(event.clientX, event.clientY);
            }}
            onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
              event.currentTarget.setPointerCapture?.(event.pointerId);
              startDragging(event.clientX, event.clientY);
            }}
          />
          {children}
        </div>
      </Panel>
    </div>
  );
}

const StatusBannerContext = createContext<StatusBannerTone>("neutral");

export function StatusBannerRoot(props: StatusBannerRootProps): ReactElement {
  const { children, className, radius = "default", tone = "neutral", ...rootProps } = props;

  return (
    <StatusBannerContext.Provider value={tone}>
      <div
        {...rootProps}
        className={classNames("belt-status-banner", className)}
        data-radius={radius}
        data-tone={tone}
      >
        {children}
      </div>
    </StatusBannerContext.Provider>
  );
}

export function StatusBannerRow(props: ComponentProps<"div">): ReactElement {
  const { className, ...rootProps } = props;
  return <div {...rootProps} className={classNames("belt-status-banner__row", className)} />;
}

export function StatusBannerBody(props: ComponentProps<"div">): ReactElement {
  const { className, ...rootProps } = props;
  return <div {...rootProps} className={classNames("belt-status-banner__body", className)} />;
}

export function StatusBannerMessage(props: ComponentProps<"span">): ReactElement {
  const { className, ...rootProps } = props;
  return <span {...rootProps} className={classNames("belt-status-banner__message", className)} />;
}

export function StatusBannerIcon(props: StatusBannerIconProps): ReactElement {
  const tone = useContext(StatusBannerContext);
  const { children, className, glyph, ...rootProps } = props;

  return (
    <span
      {...rootProps}
      className={classNames("belt-status-banner__icon", className)}
      data-tone={tone}
    >
      {glyph === undefined ? children : <Glyph name={glyph} />}
    </span>
  );
}

export function StatusBannerActions(props: ComponentProps<"div">): ReactElement {
  const { className, ...rootProps } = props;
  return <div {...rootProps} className={classNames("belt-status-banner__actions", className)} />;
}

export const StatusBannerAction = StatusBannerActions;

export const StatusBanner = {
  Action: StatusBannerActions,
  Actions: StatusBannerActions,
  Body: StatusBannerBody,
  Icon: StatusBannerIcon,
  Message: StatusBannerMessage,
  Root: StatusBannerRoot,
  Row: StatusBannerRow,
} as const;

export function Field(props: FieldProps): ReactElement {
  const { className, ...rootProps } = props;
  return <BaseField.Root {...rootProps} className={mergeClassName("belt-field", className)} />;
}

export function Label(props: LabelProps): ReactElement {
  const { className, ...rootProps } = props;
  return <BaseField.Label {...rootProps} className={mergeClassName("belt-label", className)} />;
}

export function Input(props: InputProps): ReactElement {
  const { className, elevation = 1, tone, ...inputProps } = props;

  return (
    <div
      className={classNames("belt-surface", classNameString(className))}
      data-elevation={elevation}
      data-tone={tone}
    >
      <div className="belt-surface__inner">
        <BaseInput {...inputProps} className="belt-input" />
      </div>
    </div>
  );
}

export function Slider(props: SliderProps): ReactElement {
  const { className, label, unit, ...rootProps } = props;
  const hasHeader = label !== undefined || unit !== undefined;

  return (
    <BaseSlider.Root {...rootProps} className={mergeClassName("belt-slider", className)}>
      {hasHeader ? (
        <div className="belt-slider__header">
          {label === undefined ? (
            <span />
          ) : (
            <BaseSlider.Label className="belt-slider__label">{label}</BaseSlider.Label>
          )}
          <BaseSlider.Value className="belt-slider__value">
            {((formattedValues: readonly string[]) => (
              <Fragment>
                <span className="belt-slider__value-text">{formattedValues.join(" - ")}</span>
                {unit === undefined ? null : <span className="belt-slider__unit">{unit}</span>}
              </Fragment>
            )) as ComponentProps<typeof BaseSlider.Value>["children"]}
          </BaseSlider.Value>
        </div>
      ) : null}
      <BaseSlider.Control className="belt-slider__control">
        <BaseSlider.Track className="belt-slider__track">
          <BaseSlider.Indicator className="belt-slider__indicator" />
        </BaseSlider.Track>
        <BaseSlider.Thumb className="belt-slider__thumb" />
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}

export function Switch(props: SwitchProps): ReactElement {
  const { className, ...rootProps } = props;

  return (
    <BaseSwitch.Root {...rootProps} className={mergeClassName("belt-switch", className)}>
      <BaseSwitch.Thumb className="belt-switch__thumb" />
    </BaseSwitch.Root>
  );
}

export function Menu(props: MenuProps): ReactElement {
  const { children, label, menuLabel, triggerProps, ...rootProps } = props;
  const { className: triggerClassName, ...restTriggerProps } = triggerProps ?? {};

  return (
    <BaseMenu.Root {...rootProps}>
      <BaseMenu.Trigger
        {...restTriggerProps}
        className={mergeClassName("belt-ghost-button belt-menu__trigger", triggerClassName)}
      >
        {label}
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner>
          <MenuList aria-label={menuLabel}>{children}</MenuList>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

export function MenuList(props: MenuListProps): ReactElement {
  const { className, ...rootProps } = props;
  return <BaseMenu.Popup {...rootProps} className={mergeClassName("belt-menu__popup", className)} />;
}

export function MenuItem(props: MenuItemProps): ReactElement {
  const { className, ...rootProps } = props;
  return <BaseMenu.Item {...rootProps} className={mergeClassName("belt-menu__item", className)} />;
}

export function Submenu(props: SubmenuProps): ReactElement {
  const { children, label, listProps, menuLabel, triggerProps, ...rootProps } = props;
  const { className: triggerClassName, ...restTriggerProps } = triggerProps ?? {};

  return (
    <BaseMenu.SubmenuRoot {...rootProps}>
      <BaseMenu.SubmenuTrigger
        {...restTriggerProps}
        className={mergeClassName("belt-menu__item", triggerClassName)}
      >
        {label}
      </BaseMenu.SubmenuTrigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner>
          <MenuList {...listProps} aria-label={menuLabel}>
            {children}
          </MenuList>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.SubmenuRoot>
  );
}

export function Select<Value = string>(props: SelectProps<Value>): ReactElement {
  const { children, defaultLabel, triggerProps, ...rootProps } = props;
  const { className: triggerClassName, ...restTriggerProps } = triggerProps ?? {};

  return (
    <BaseSelect.Root<Value> {...rootProps}>
      <BaseSelect.Trigger
        {...restTriggerProps}
        className={mergeClassName("belt-ghost-button belt-select__trigger", triggerClassName)}
      >
        <BaseSelect.Value placeholder={defaultLabel} />
        <BaseSelect.Icon className="belt-button__end-icon">
          <Glyph name="chevronDown" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner>
          <BaseSelect.Popup className="belt-select__popup">
            <BaseSelect.List className="belt-select__list">{children}</BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}

export function SelectOption(props: SelectOptionProps): ReactElement {
  const { children, className, ...rootProps } = props;

  return (
    <BaseSelect.Item {...rootProps} className={mergeClassName("belt-select__item", className)}>
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
      <BaseSelect.ItemIndicator>
        <Glyph className="belt-icon" name="check" />
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}

export function Combobox<Value = string>(props: ComboboxProps<Value>): ReactElement {
  const { children, className, placeholder, ...rootProps } = props;

  return (
    <BaseCombobox.Root<Value> {...rootProps}>
      <div className={classNames("belt-surface belt-combobox", className)}>
        <div className="belt-surface__inner">
          <BaseCombobox.Input className="belt-input" placeholder={placeholder} />
          <BaseCombobox.Trigger className="belt-ghost-button">
            <BaseCombobox.Icon>
              <Glyph name="chevronDown" />
            </BaseCombobox.Icon>
          </BaseCombobox.Trigger>
        </div>
      </div>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner>
          <BaseCombobox.Popup className="belt-combobox__popup">
            <BaseCombobox.List className="belt-combobox__list">{children}</BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}

export function ComboboxOption(props: ComboboxOptionProps): ReactElement {
  const { className, ...rootProps } = props;
  return (
    <BaseCombobox.Item
      {...rootProps}
      className={mergeClassName("belt-combobox__item", className)}
    />
  );
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

  return (
    <svg
      {...svgProps}
      aria-hidden={props["aria-hidden"] ?? true}
      focusable={props.focusable ?? "false"}
      height={props.height ?? "0"}
      style={hiddenStyle}
      width={props.width ?? "0"}
      xmlns="http://www.w3.org/2000/svg"
    >
      {glyphNames.map((name) => renderSymbol(name, glyphDefinitions[name]))}
    </svg>
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

  return (
    <svg
      {...svgProps}
      aria-hidden={hiddenByDefault ? true : props["aria-hidden"]}
      fill={fill ?? "none"}
      xmlns="http://www.w3.org/2000/svg"
    >
      <use xlinkHref={`#${glyphIds[name]}`} />
    </svg>
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
    return (
      <span className={`${options.part}__icon`}>
        <Glyph name={options.icon} />
      </span>
    );
  }

  return (
    <Fragment>
      {resolvedStartIcon ? (
        <span className={`${options.part}__start-icon`}>
          <Glyph name={resolvedStartIcon} />
        </span>
      ) : null}
      {options.children !== undefined ? <span>{options.children}</span> : null}
      {options.endIcon ? (
        <span className={`${options.part}__end-icon`}>
          <Glyph name={options.endIcon} />
        </span>
      ) : null}
    </Fragment>
  );
}

function renderSymbol(name: GlyphName, definition: GlyphDefinition): ReactElement {
  return (
    <symbol {...toReactAttrs(definition.attrs)} id={glyphIds[name]} key={name} viewBox={definition.viewBox}>
      {definition.children.map((node, index) => renderNode(node, `${name}-${index}`))}
    </symbol>
  );
}

function renderNode(node: GlyphNode, key: string): ReactElement {
  const Tag = node.tag as keyof React.JSX.IntrinsicElements;
  return <Tag {...toReactAttrs(node.attrs)} key={key} />;
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

function clampToolbarPosition(position: ToolbarPosition, element: HTMLElement | null): ToolbarPosition {
  const rect = element?.getBoundingClientRect();
  const width = rect?.width ?? 0;
  const height = rect?.height ?? 0;
  const maxX = Math.max(0, window.innerWidth - width);
  const maxY = Math.max(0, window.innerHeight - height);

  return {
    x: clamp(position.x, 0, maxX),
    y: clamp(position.y, 0, maxY),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isApplePlatform(): boolean {
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}
