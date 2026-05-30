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
  isValidElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
  type SVGProps,
} from "react";
import { createPortal } from "react-dom";
import {
  glyphDefinitions,
  glyphIds,
  glyphNames,
  type GlyphDefinition,
  type GlyphName,
  type GlyphNode,
} from "@repo/glyphs";
import {
  defineToolbarDefinition,
  extractToolbarConfig,
  type ToolDefinition,
  type ToolbarConfig,
  type ToolbarConfigSource,
  type ToolbarDefinition,
  type ToolbarTool,
} from "@repo/core";

export type { GlyphDefinition, GlyphName, GlyphNode } from "@repo/glyphs";
export { glyphDefinitions, glyphIds, glyphNames } from "@repo/glyphs";

export type IntentTone = "neutral" | "primary" | "info" | "success" | "warning" | "danger";
export type Elevation = 1 | 2 | 3;
export type Radius = "inner" | "default" | "outer";
export type StatusBannerTone = IntentTone;
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
export type MenuListProps = ComponentProps<"div">;
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
  readonly elevation?: Elevation;
  readonly tone?: IntentTone;
  readonly triggerProps?: ComponentProps<typeof BaseSelect.Trigger>;
};
export type SelectOptionProps = ComponentProps<typeof BaseSelect.Item>;

export type ComboboxProps<Value = string> = ComponentProps<typeof BaseCombobox.Root<Value>> & {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly elevation?: Elevation;
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
    defaultVisible = true,
    elevation = 1,
    onKeyDown,
    radius = "outer",
    style,
    tone,
    ...rootProps
  } = props;
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [visible, setVisible] = useState(defaultVisible);

  useLayoutEffect(() => {
    const host = document.createElement("div");
    host.className = "belt-toolbar-host";
    document.body.appendChild(host);
    setPortalElement(host);
    const keepHostLast = () => {
      if (document.body.lastElementChild !== host) {
        document.body.appendChild(host);
      }
    };
    const observer = typeof MutationObserver === "undefined"
      ? undefined
      : new MutationObserver(keepHostLast);

    observer?.observe(document.body, { childList: true });

    return () => {
      observer?.disconnect();
      host.remove();
    };
  }, []);

  useEffect(() => {
    const toggleToolbar = (event: globalThis.KeyboardEvent) => {
      const modifierPressed = isApplePlatform() ? event.metaKey : event.ctrlKey;
      if (event.key.toLowerCase() !== "b" || !modifierPressed) return;

      event.preventDefault();
      setVisible((current) => !current);
    };

    window.addEventListener("keydown", toggleToolbar);
    return () => window.removeEventListener("keydown", toggleToolbar);
  }, []);

  if (!visible) return null;

  const panelProps = {
    elevation,
    padding: "sm" as const,
    radius,
    ...(tone === undefined ? {} : { tone }),
  };
  const toolbar = (
    <ToolbarBody
      {...rootProps}
      className={className}
      onKeyDown={onKeyDown}
      panelProps={panelProps}
      style={style}
    >
      {children}
    </ToolbarBody>
  );

  return portalElement ? createPortal(toolbar, portalElement) : toolbar;
}

type ToolbarBodyProps = Omit<ComponentProps<"div">, "children"> & {
  readonly children?: ReactNode;
  readonly panelProps: PanelProps;
};

function ToolbarBody(props: ToolbarBodyProps): ReactElement {
  const {
    children,
    className,
    onKeyDown,
    panelProps,
    style,
    ...rootProps
  } = props;
  const toolbarRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = toolbarRef.current;
    const body = document.body;
    const previousReservedSize = body.style.getPropertyValue("--belt-toolbar-reserved-block-size");

    const reserveSpace = () => {
      const blockSize = element?.getBoundingClientRect().height ?? 0;
      body.style.setProperty("--belt-toolbar-reserved-block-size", `${blockSize}px`);
    };
    const resizeObserver = typeof ResizeObserver === "undefined" || element === null
      ? undefined
      : new ResizeObserver(reserveSpace);

    reserveSpace();
    if (element) {
      resizeObserver?.observe(element);
    }
    window.addEventListener("resize", reserveSpace);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", reserveSpace);
      if (previousReservedSize) {
        body.style.setProperty("--belt-toolbar-reserved-block-size", previousReservedSize);
      } else {
        body.style.removeProperty("--belt-toolbar-reserved-block-size");
      }
    };
  }, [children]);

  return (
    <div
      {...rootProps}
      className={classNames("belt-toolbar", className)}
      onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
      }}
      ref={toolbarRef}
      style={style}
    >
      <svg className="belt-toolbar__logo" viewBox="0 0 140 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M80 40H60V60H140V100H80V200H100V180H140V220H120V240H60V220H40V100H0V60H20V40H40V0H80V40Z" fill="currentColor" />
      </svg>
      <div className="belt-toolbar__inner">
        {children}
      </div>
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

  return (
    <BaseMenu.Root {...rootProps}>
      {menuTrigger(label, triggerProps)}
      <BaseMenu.Portal>
        <BaseMenu.Positioner>
          <MenuList aria-label={menuLabel}>{children}</MenuList>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

function menuTrigger(
  label: ReactNode,
  triggerProps: ComponentProps<typeof BaseMenu.Trigger> | undefined,
): ReactElement {
  const { className: triggerClassName, ...restTriggerProps } = triggerProps ?? {};

  if (isValidElement<ButtonProps>(label) && label.type === Button) {
    const {
      children,
      className,
      disabled,
      elevation = 1,
      endIcon,
      icon,
      loading = false,
      ref: _buttonRef,
      startIcon,
      tone = "neutral",
      type = "button",
      ...buttonProps
    } = label.props;

    return (
      <BaseMenu.Trigger
        {...buttonProps}
        {...restTriggerProps}
        aria-busy={loading || undefined}
        className={mergeClassName(
          classNames("belt-button belt-menu__trigger", classNameString(className)) ??
          "belt-button belt-menu__trigger",
          triggerClassName,
        )}
        data-control
        disabled={disabled || loading || restTriggerProps.disabled}
        type={restTriggerProps.type ?? type}
      >
        {buttonContents({ children, endIcon, icon, loading, startIcon, part: "belt-button" })}
      </BaseMenu.Trigger>
    );
  }

  if (isValidElement<GhostButtonProps>(label) && label.type === GhostButton) {
    const {
      children,
      className,
      disabled,
      elevation = 1,
      endIcon,
      icon,
      loading = false,
      ref: _buttonRef,
      startIcon,
      tone = "neutral",
      type = "button",
      variant: _variant,
      ...buttonProps
    } = label.props;

    return (
      <BaseMenu.Trigger
        {...buttonProps}
        {...restTriggerProps}
        aria-busy={loading || undefined}
        className={mergeClassName(
          classNames("belt-ghost-button belt-menu__trigger", classNameString(className)) ??
          "belt-ghost-button belt-menu__trigger",
          triggerClassName,
        )}
        data-control
        data-elevation={elevation}
        data-tone={tone}
        disabled={disabled || loading || restTriggerProps.disabled}
        type={restTriggerProps.type ?? type}
      >
        {buttonContents({
          children,
          endIcon,
          icon,
          loading,
          startIcon,
          part: "belt-ghost-button",
        })}
      </BaseMenu.Trigger>
    );
  }

  return (
    <BaseMenu.Trigger
      {...restTriggerProps}
      className={mergeClassName("belt-ghost-button belt-menu__trigger", triggerClassName)}
    >
      {label}
    </BaseMenu.Trigger>
  );
}

export function MenuList(props: MenuListProps): ReactElement {
  const { children, className, ...listProps } = props;

  return (
    <BaseMenu.Popup
      className="belt-menu__popup belt-surface"
      data-elevation="1"
      data-tone="neutral"
    >
      <div className="belt-surface__inner">
        <div {...listProps} className={classNames("belt-menu__list", className)}>
          {children}
        </div>
      </div>
    </BaseMenu.Popup>
  );
}

export function MenuItem(props: MenuItemProps): ReactElement {
  const { className, ...rootProps } = props;
  return (
    <BaseMenu.Item
      {...rootProps}
      className={mergeClassName("belt-menu__item belt-text", className)}
      data-size="sm"
    />
  );
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
  const { children, defaultLabel, tone = "primary", elevation = 2, triggerProps, ...rootProps } = props;
  const { className: triggerClassName, ...restTriggerProps } = triggerProps ?? {};

  return (
    <BaseSelect.Root<Value> {...rootProps}>
      <div className="belt-surface" data-elevation={elevation} data-tone="neutral">
        <div className="belt-surface__inner">
          <BaseSelect.Trigger
            {...restTriggerProps}
            className={mergeClassName("belt-button belt-select__trigger", triggerClassName)}
            data-control
          >
            <BaseSelect.Value className="belt-select__value" placeholder={defaultLabel} />
            <BaseSelect.Icon className="belt-button__end-icon">
              <Glyph className="belt-icon" data-size="md" name="chevronVertical" />
            </BaseSelect.Icon>
          </BaseSelect.Trigger>
        </div>
      </div>
      <BaseSelect.Portal>
        <BaseSelect.Positioner>
          <BaseSelect.Popup
            className="belt-select__popup belt-surface"
            data-elevation={elevation}
            data-tone="neutral"
          >
            <div className="belt-surface__inner">
              <BaseSelect.List className="belt-select__list" data-tone={tone}>
                {children}
              </BaseSelect.List>
            </div>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}

export function SelectOption(props: SelectOptionProps): ReactElement {
  const { children, className, ...rootProps } = props;

  return (
    <BaseSelect.Item
      {...rootProps}
      className={mergeClassName("belt-select__item belt-text", className)}
      data-size="sm"
    >
      <BaseSelect.ItemText render={<span />}>{children}</BaseSelect.ItemText>
      <BaseSelect.ItemIndicator className="belt-icon" data-size="md">
        <Glyph name="check" />
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}

export function Combobox<Value = string>(props: ComboboxProps<Value>): ReactElement {
  const { children, className, elevation = 1, placeholder, ...rootProps } = props;

  return (
    <BaseCombobox.Root<Value> {...rootProps}>
      <div
        className={classNames("belt-surface belt-combobox", className)}
        data-elevation={elevation}
      >
        <div className="belt-surface__inner">
          <BaseCombobox.Input className="belt-input" placeholder={placeholder} />
          <BaseCombobox.Trigger className="belt-ghost-button belt-combobox__trigger">
            <BaseCombobox.Icon className="belt-button__end-icon">
              <Glyph className="belt-icon" data-size="md" name="chevronVertical" />
            </BaseCombobox.Icon>
          </BaseCombobox.Trigger>
        </div>
      </div>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner>
          <BaseCombobox.Popup
            className="belt-combobox__popup belt-surface"
            data-elevation="1"
            data-tone="neutral"
          >
            <div className="belt-surface__inner">
              <BaseCombobox.List className="belt-combobox__list">{children}</BaseCombobox.List>
            </div>
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
      className={mergeClassName("belt-combobox__item belt-text", className)}
      data-size="sm"
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

function isApplePlatform(): boolean {
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}
