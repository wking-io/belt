// @jsxRuntime classic
// @jsx createElement
// @jsxFrag Fragment
import {
  attrs,
  createElement,
  createMixin,
  Fragment,
  on,
  ref,
  type ElementProps,
  type Handle,
  type MixValue,
  type Props,
  type RemixNode,
} from "@remix-run/ui";

const MENU_SELECT_EVENT = "belt:menu-select" as const;
const MENU_FLASH_DURATION_MS = 60;
const SUBMENU_OPEN_DELAY_MS = 300;
const TYPEAHEAD_TIMEOUT_MS = 750;

type MenuItemType = "item" | "checkbox" | "radio";
type OpenStrategy = "first" | "last" | "list" | "none";
type SearchValue = string | readonly string[];

type MenuSelectHandler = (event: MenuSelectEvent, signal: AbortSignal) => void | Promise<void>;

declare global {
  interface HTMLElementEventMap {
    [MENU_SELECT_EVENT]: MenuSelectEvent;
  }
}

export interface MenuSelectItem {
  readonly checked?: boolean | undefined;
  readonly id: string;
  readonly label: string;
  readonly name: string;
  readonly type: MenuItemType;
  readonly value: string | null;
}

export class MenuSelectEvent extends Event {
  readonly item: MenuSelectItem;

  constructor(item: MenuSelectItem) {
    super(MENU_SELECT_EVENT, { bubbles: true });
    this.item = item;
  }
}

export interface MenuRootProps {
  readonly children?: RemixNode;
  readonly label?: string;
}

export interface MenuProps extends Omit<Props<"button">, "children"> {
  readonly children?: RemixNode;
  readonly label: RemixNode;
  readonly menuLabel?: string;
  readonly triggerMix?: MixValue<HTMLButtonElement, ElementProps>;
  readonly triggerProps?: Omit<Props<"button">, "children">;
}

export interface MenuItemOptions {
  readonly checked?: boolean;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly name: string;
  readonly searchValue?: SearchValue;
  readonly type?: Exclude<MenuItemType, "item">;
  readonly value?: string;
}

export interface MenuItemProps
  extends Omit<Props<"div">, "children" | "name" | "type" | "value">, MenuItemOptions {
  readonly children?: RemixNode;
}

export interface MenuListProps extends Props<"div"> {
  readonly children?: RemixNode;
}

type MenuListChildProps = Omit<
  JSX.LibraryManagedAttributes<typeof MenuList, MenuListProps>,
  "children"
>;

export interface SubmenuProps
  extends
    Omit<Props<"div">, "children" | "name" | "type" | "value">,
    Omit<MenuItemOptions, "label" | "name" | "type" | "checked"> {
  readonly children?: RemixNode;
  readonly label: RemixNode;
  readonly listProps?: MenuListChildProps;
  readonly menuLabel?: string;
}

type RegisteredMenuItem = {
  readonly checked?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly id: string;
  readonly name?: string | undefined;
  readonly searchValue?: SearchValue | undefined;
  readonly submenu?: MenuContextValue | undefined;
  readonly type: MenuItemType;
  readonly value?: string | undefined;
  readonly hidden: boolean;
  readonly label: string;
  readonly node: HTMLElement;
};

type MenuContextValue = {
  readonly activeId: string | undefined;
  readonly flashingChecked: boolean | undefined;
  readonly flashingId: string | undefined;
  readonly isOpen: boolean;
  readonly label: string | undefined;
  readonly listId: string;
  readonly parent: MenuContextValue | undefined;
  readonly root: MenuContextValue;
  readonly surfaceNode: HTMLElement | undefined;
  readonly triggerId: string | undefined;
  activateActive: () => Promise<void>;
  activateItem: (id: string) => Promise<void>;
  closeAll: (options?: { focusRoot?: boolean }) => Promise<void>;
  closeBranch: (options?: { focusTrigger?: boolean }) => Promise<void>;
  hasOpenChild: () => boolean;
  highlight: (id: string | null, options?: { focus?: boolean }) => void;
  highlightSearchMatch: (text: string) => void;
  navigate: (strategy: "next" | "previous" | "first" | "last") => void;
  open: (options?: { focus?: boolean; strategy?: OpenStrategy }) => Promise<void>;
  openActiveSubmenu: () => Promise<void>;
  registerChild: (menu: MenuContextValue) => void;
  registerItem: (item: RegisteredMenuItem) => void;
  registerList: (node: HTMLElement) => void;
  registerSurface: (node: HTMLElement) => void;
  registerTrigger: (node: HTMLElement, id: string) => void;
  unregisterList: (node: HTMLElement) => void;
  unregisterSurface: (node: HTMLElement) => void;
  unregisterTrigger: (node: HTMLElement) => void;
};

type FlashState = { readonly checked?: boolean | undefined; readonly id: string } | null;

function MenuContext(handle: Handle<MenuRootProps, MenuContextValue>) {
  const parent = handle.context.get(MenuContext);

  let activeId: string | null = null;
  let childMenus: MenuContextValue[] = [];
  let flashState: FlashState = null;
  let items: RegisteredMenuItem[] = [];
  let listRef: HTMLElement | undefined;
  let open = false;
  let surfaceRef: HTMLElement | undefined;
  let triggerId: string | undefined;
  let triggerRef: HTMLElement | undefined;

  const getItem = (id: string | null | undefined) => items.find((item) => item.id === id);
  const isVisibleItem = (item: RegisteredMenuItem | undefined): item is RegisteredMenuItem =>
    !!item?.node?.isConnected && !item.hidden;
  const isInteractableItem = (item: RegisteredMenuItem | undefined): item is RegisteredMenuItem =>
    isVisibleItem(item) && !item.disabled;
  const getInteractableItems = () => items.filter(isInteractableItem);
  const getOpenChild = () => childMenus.find((menu) => menu.isOpen);

  const focusNode = (node: HTMLElement | undefined) => {
    if (!node || !node.isConnected || document.activeElement === node) return;
    node.focus();
    node.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  const setPopoverOpen = (nextOpen: boolean) => {
    if (!surfaceRef) return;
    if (nextOpen && !surfaceRef.matches(":popover-open")) {
      positionSurface(surfaceRef, triggerRef);
      surfaceRef.showPopover();
    } else if (!nextOpen && surfaceRef.matches(":popover-open")) {
      surfaceRef.hidePopover();
    }
  };

  const context: MenuContextValue = {
    get activeId() {
      return activeId ?? undefined;
    },
    get flashingChecked() {
      return flashState?.checked;
    },
    get flashingId() {
      return flashState?.id;
    },
    get isOpen() {
      return open;
    },
    get label() {
      return handle.props.label;
    },
    get listId() {
      return `${handle.id}-list`;
    },
    get parent() {
      return parent;
    },
    get root() {
      return parent?.root ?? context;
    },
    get surfaceNode() {
      return surfaceRef;
    },
    get triggerId() {
      return triggerId;
    },
    async activateActive() {
      if (activeId) await context.activateItem(activeId);
    },
    async activateItem(id) {
      const item = getItem(id);
      if (!isInteractableItem(item)) return;

      if (item.submenu) {
        await item.submenu.open({ strategy: "first" });
        return;
      }

      const committedChecked =
        item.type === "checkbox" ? !item.checked : item.type === "radio" ? true : undefined;

      activeId = item.id;
      flashState =
        item.type === "item" ? { id: item.id } : { checked: committedChecked, id: item.id };
      let signal = await handle.update();
      if (signal.aborted) return;

      item.node.dispatchEvent(
        new MenuSelectEvent({
          ...(committedChecked === undefined ? {} : { checked: committedChecked }),
          id: item.id,
          label: item.label,
          name: item.name ?? "",
          type: item.type,
          value: item.value ?? null,
        }),
      );

      await wait(MENU_FLASH_DURATION_MS);
      if (handle.signal.aborted) return;

      flashState = null;
      signal = await handle.update();
      if (signal.aborted) return;

      await context.closeAll();
    },
    async closeAll({ focusRoot = true } = {}) {
      if (parent) {
        await context.root.closeAll({ focusRoot });
        return;
      }

      for (const child of childMenus) {
        await child.closeBranch();
      }

      if (!open && activeId === null) return;
      open = false;
      activeId = null;
      const signal = await handle.update();
      if (signal.aborted) return;
      setPopoverOpen(false);
      if (focusRoot) focusNode(triggerRef);
    },
    async closeBranch({ focusTrigger = false } = {}) {
      for (const child of childMenus) {
        await child.closeBranch();
      }

      if (open || activeId !== null) {
        open = false;
        activeId = null;
        const signal = await handle.update();
        if (signal.aborted) return;
        setPopoverOpen(false);
      }

      if (focusTrigger) focusNode(triggerRef);
    },
    hasOpenChild() {
      return !!getOpenChild();
    },
    highlight(id, { focus = false } = {}) {
      const item = id ? getItem(id) : undefined;
      if (id && !isInteractableItem(item)) return;

      const openChild = getOpenChild();
      if (openChild && item?.submenu !== openChild) {
        void openChild.closeBranch();
      }

      if (activeId !== id) {
        activeId = id;
        void handle.update().then((signal) => {
          if (!signal.aborted && focus) focusNode(item?.node);
        });
        return;
      }

      if (focus) focusNode(item?.node);
    },
    highlightSearchMatch(text) {
      const interactableItems = getInteractableItems();
      const activeIndex = interactableItems.findIndex((item) => item.id === activeId);
      const nextItem = matchNextItemBySearchText(text, interactableItems, activeIndex);
      if (nextItem) context.highlight(nextItem.id, { focus: true });
    },
    navigate(strategy) {
      const interactableItems = getInteractableItems();
      const activeIndex = interactableItems.findIndex((item) => item.id === activeId);
      const lastIndex = interactableItems.length - 1;
      let nextItem: RegisteredMenuItem | undefined;

      if (strategy === "next") {
        nextItem =
          activeIndex === -1
            ? interactableItems[0]
            : (interactableItems[activeIndex + 1] ?? interactableItems[activeIndex]);
      } else if (strategy === "previous") {
        nextItem =
          activeIndex === -1
            ? interactableItems[lastIndex]
            : (interactableItems[activeIndex - 1] ?? interactableItems[activeIndex]);
      } else if (strategy === "first") {
        nextItem = interactableItems[0];
      } else {
        nextItem = interactableItems[lastIndex];
      }

      if (nextItem) context.highlight(nextItem.id, { focus: true });
    },
    async open({ focus = true, strategy = "list" } = {}) {
      const interactableItems = getInteractableItems();
      const nextActiveId =
        strategy === "first"
          ? (interactableItems[0]?.id ?? null)
          : strategy === "last"
            ? (interactableItems[interactableItems.length - 1]?.id ?? null)
            : null;

      open = true;
      activeId = nextActiveId;
      const signal = await handle.update();
      if (signal.aborted) return;

      setPopoverOpen(true);
      if (!focus) return;
      focusNode(nextActiveId && strategy !== "list" ? getItem(nextActiveId)?.node : listRef);
    },
    async openActiveSubmenu() {
      const item = getItem(activeId);
      if (isInteractableItem(item) && item.submenu) {
        await item.submenu.open({ strategy: "first" });
      }
    },
    registerChild(menu) {
      childMenus.push(menu);
    },
    registerItem(item) {
      items.push(item);
    },
    registerList(node) {
      listRef = node;
    },
    registerSurface(node) {
      surfaceRef = node;
      setPopoverOpen(open);
    },
    registerTrigger(node, id) {
      triggerRef = node;
      triggerId = id;
    },
    unregisterList(node) {
      if (listRef === node) listRef = undefined;
    },
    unregisterSurface(node) {
      if (surfaceRef === node) surfaceRef = undefined;
    },
    unregisterTrigger(node) {
      if (triggerRef === node) {
        triggerRef = undefined;
        triggerId = undefined;
      }
    },
  };

  handle.context.set(context);

  return () => {
    childMenus = [];
    items = [];
    parent?.registerChild(context);
    return <Fragment>{handle.props.children}</Fragment>;
  };
}

export const MenuRoot = MenuContext;

export function Menu(handle: Handle<MenuProps>) {
  let buttonRef: HTMLButtonElement | undefined;

  return () => {
    const {
      children,
      class: classes,
      className,
      label,
      menuLabel,
      mix,
      triggerMix: triggerVisualMix,
      triggerProps,
      type,
      ...buttonProps
    } = handle.props;
    const {
      class: triggerClass,
      className: triggerClassName,
      mix: triggerMix,
      ...restTriggerProps
    } = triggerProps ?? {};

    return (
      <MenuContext {...(menuLabel === undefined ? {} : { label: menuLabel })}>
        <MenuTrigger
          {...buttonProps}
          {...restTriggerProps}
          class={classNames(classes, className, triggerClass, triggerClassName)}
          mix={[triggerVisualMix, mix, triggerMix]}
          onTriggerRef={(node) => {
            buttonRef = node;
          }}
          type={type ?? "button"}
        >
          {label}
        </MenuTrigger>
        <MenuList
          mix={onMenuSelect((event) => {
            if (!buttonRef) return;
            event.stopPropagation();
            buttonRef.dispatchEvent(new MenuSelectEvent(event.item));
          })}
        >
          {children}
        </MenuList>
      </MenuContext>
    );
  };
}

export type MenuTriggerProps = Omit<Props<"button">, "children"> & {
  readonly children?: RemixNode;
};

type InternalMenuTriggerProps = MenuTriggerProps & {
  readonly onTriggerRef?: (node: HTMLButtonElement | undefined) => void;
};

type MenuTriggerMixOptions = {
  readonly onTriggerRef?: (node: HTMLButtonElement | undefined) => void;
};

const menuTriggerMixin = createMixin<
  HTMLButtonElement,
  [options?: MenuTriggerMixOptions],
  ElementProps
>((handle) => {
  return (options = {}) => {
    const context = handle.context.get(MenuContext);

    return [
      attrs({
        "aria-controls": context.listId,
        "aria-expanded": context.isOpen ? "true" : "false",
        "aria-haspopup": "menu",
      }),
      ref((node: HTMLButtonElement, signal) => {
        options.onTriggerRef?.(node);
        context.registerTrigger(node, handle.id);
        signal.addEventListener("abort", () => {
          options.onTriggerRef?.(undefined);
          context.unregisterTrigger(node);
        });
      }),
      on("click", () => {
        void (context.isOpen ? context.closeAll() : context.open({ strategy: "list" }));
      }),
      on("keydown", (event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          void context.open({ strategy: "first" });
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          void context.open({ strategy: "last" });
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          void context.open({ strategy: "list" });
        }
      }),
    ];
  };
});

export function menuTriggerMix(options?: MenuTriggerMixOptions) {
  return menuTriggerMixin(options);
}

export function MenuTrigger(handle: Handle<InternalMenuTriggerProps>) {
  return () => {
    const {
      children,
      class: classes,
      className,
      mix,
      onTriggerRef,
      type = "button",
      ...buttonProps
    } = handle.props;

    return (
      <button
        {...buttonProps}
        class={classNames("belt-menu__trigger", classes, className)}
        type={type}
        mix={[menuTriggerMix(onTriggerRef ? { onTriggerRef } : undefined), mix]}
      >
        {children}
      </button>
    );
  };
}

export function MenuList(handle: Handle<MenuListProps>) {
  let typeaheadText = "";
  let typeaheadTimeoutId = 0;

  const clearTypeahead = () => {
    clearTimeout(typeaheadTimeoutId);
    typeaheadText = "";
  };

  handle.signal.addEventListener("abort", clearTypeahead);

  return () => {
    const { children, class: classes, className, mix, ...divProps } = handle.props;
    const context = handle.context.get(MenuContext);

    return (
      <div
        class={classNames(
          "belt-menu__popup belt-surface",
          context.parent ? "belt-menu__submenu-popup" : undefined,
        )}
        data-elevation="1"
        data-tone="neutral"
        popover="manual"
        mix={[
          ref((node: HTMLElement, signal) => {
            context.registerSurface(node);
            const ownerDocument = node.ownerDocument;
            const onDocumentClick = (event: MouseEvent) => {
              const target = event.target instanceof Node ? event.target : null;
              if (!context.isOpen || !target) return;
              if (node.contains(target) || context.root.surfaceNode?.contains(target)) return;
              void context.closeAll({ focusRoot: false });
            };
            ownerDocument.addEventListener("click", onDocumentClick, { capture: true, signal });
            signal.addEventListener("abort", () => context.unregisterSurface(node));
          }),
          on("keydown", (event) => {
            if (!eventBelongsToCurrentMenu(event)) return;

            if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
              event.stopPropagation();
              clearTimeout(typeaheadTimeoutId);
              typeaheadText += event.key.toLowerCase();
              context.highlightSearchMatch(typeaheadText);
              typeaheadTimeoutId = window.setTimeout(clearTypeahead, TYPEAHEAD_TIMEOUT_MS);
              return;
            }

            if (event.key === "Backspace" && typeaheadText.length > 0) {
              event.stopPropagation();
              clearTimeout(typeaheadTimeoutId);
              typeaheadText = typeaheadText.slice(0, -1);
              context.highlightSearchMatch(typeaheadText);
              typeaheadTimeoutId = window.setTimeout(clearTypeahead, TYPEAHEAD_TIMEOUT_MS);
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              context.navigate("next");
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              context.navigate("previous");
            } else if (event.key === "Home") {
              event.preventDefault();
              context.navigate("first");
            } else if (event.key === "End") {
              event.preventDefault();
              context.navigate("last");
            } else if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              void context.activateActive();
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              void context.openActiveSubmenu();
            } else if (event.key === "ArrowLeft" && context.parent) {
              event.preventDefault();
              void context.closeBranch({ focusTrigger: true });
            } else if (event.key === "Escape") {
              event.preventDefault();
              clearTypeahead();
              void context.closeAll();
            } else if (event.key === "Tab") {
              void context.closeAll({ focusRoot: false });
            }
          }),
          on("pointerleave", (event) => {
            if (
              event.relatedTarget instanceof Node &&
              event.currentTarget.contains(event.relatedTarget)
            )
              return;
            if (!context.hasOpenChild()) context.highlight(null);
          }),
        ]}
      >
        <div class="belt-surface__inner">
          <div
            {...divProps}
            id={context.listId}
            class={classNames("belt-menu__list", classes, className)}
            role="menu"
            tabindex={-1}
            aria-label={context.label}
            aria-labelledby={context.label ? undefined : context.triggerId}
            mix={[
              ref((node: HTMLElement, signal) => {
                context.registerList(node);
                signal.addEventListener("abort", () => context.unregisterList(node));
              }),
              mix,
            ]}
          >
            {children}
          </div>
        </div>
      </div>
    );
  };
}

export function MenuItem(handle: Handle<MenuItemProps>) {
  let itemRef: HTMLElement | undefined;

  return () => {
    const {
      checked,
      children,
      class: classes,
      className,
      disabled,
      label,
      mix,
      name,
      searchValue,
      type,
      value,
      ...divProps
    } = handle.props;
    const context = handle.context.get(MenuContext);
    const itemType: MenuItemType = type ?? "item";
    const isFlashing = context.flashingId === handle.id;

    context.registerItem({
      ...(checked === undefined ? {} : { checked }),
      ...(disabled === undefined ? {} : { disabled }),
      id: handle.id,
      name,
      ...(searchValue === undefined ? {} : { searchValue }),
      type: itemType,
      ...(value === undefined ? {} : { value }),
      get hidden() {
        return itemRef?.hidden === true;
      },
      get label() {
        return normalizeText(label ?? itemRef?.textContent);
      },
      get node() {
        return itemRef as HTMLElement;
      },
    });

    return (
      <div
        {...divProps}
        id={handle.id}
        class={classNames("belt-menu__item belt-text", classes, className)}
        data-size="sm"
        role={getItemRole(itemType)}
        tabindex={-1}
        aria-checked={
          itemType === "item" ? undefined : isFlashing ? !!context.flashingChecked : !!checked
        }
        aria-disabled={disabled ? "true" : undefined}
        data-disabled={disabled ? "" : undefined}
        data-highlighted={context.activeId === handle.id ? "true" : undefined}
        data-menu-flash={isFlashing ? "true" : undefined}
        mix={[
          ref((node: HTMLElement) => {
            itemRef = node;
          }),
          !disabled && [
            on("click", () => void context.activateItem(handle.id)),
            on("focus", () => context.highlight(handle.id)),
            on("pointermove", () => context.highlight(handle.id, { focus: true })),
            on("pointerleave", (event) => {
              if (context.activeId === handle.id && shouldClearHighlightOnPointerLeave(event)) {
                context.highlight(null);
              }
            }),
          ],
          mix,
        ]}
      >
        {children ?? label}
      </div>
    );
  };
}

export function Submenu(handle: Handle<SubmenuProps>) {
  return () => {
    const { children, listProps, menuLabel, ...triggerProps } = handle.props;

    return (
      <MenuContext {...(menuLabel === undefined ? {} : { label: menuLabel })}>
        <SubmenuTrigger {...triggerProps} />
        <MenuList {...listProps}>{children}</MenuList>
      </MenuContext>
    );
  };
}

function SubmenuTrigger(
  handle: Handle<Omit<SubmenuProps, "children" | "listProps" | "menuLabel">>,
) {
  let itemRef: HTMLElement | undefined;
  let openTimeoutId = 0;

  const clearScheduledOpen = () => {
    clearTimeout(openTimeoutId);
    openTimeoutId = 0;
  };

  handle.signal.addEventListener("abort", clearScheduledOpen);

  return () => {
    const {
      class: classes,
      className,
      disabled,
      label,
      mix,
      searchValue,
      value,
      ...divProps
    } = handle.props;
    const childMenu = handle.context.get(MenuContext);
    const parent = childMenu.parent;

    if (parent) {
      parent.registerItem({
        ...(disabled === undefined ? {} : { disabled }),
        id: handle.id,
        ...(searchValue === undefined ? {} : { searchValue }),
        submenu: childMenu,
        type: "item",
        ...(value === undefined ? {} : { value }),
        get hidden() {
          return itemRef?.hidden === true;
        },
        get label() {
          return normalizeText(itemRef?.textContent);
        },
        get node() {
          return itemRef as HTMLElement;
        },
      });
    }

    const scheduleOpen = () => {
      clearScheduledOpen();
      if (disabled || childMenu.isOpen) return;
      openTimeoutId = window.setTimeout(() => {
        if (parent?.activeId === handle.id) {
          void childMenu.open({ focus: false, strategy: "none" });
        }
      }, SUBMENU_OPEN_DELAY_MS);
    };

    return (
      <div
        {...divProps}
        id={handle.id}
        class={classNames("belt-menu__item", classes, className)}
        role="menuitem"
        tabindex={-1}
        aria-controls={childMenu.listId}
        aria-disabled={disabled ? "true" : undefined}
        aria-expanded={childMenu.isOpen ? "true" : "false"}
        aria-haspopup="menu"
        data-disabled={disabled ? "" : undefined}
        data-highlighted={parent?.activeId === handle.id ? "true" : undefined}
        mix={[
          ref((node: HTMLElement, signal) => {
            itemRef = node;
            childMenu.registerTrigger(node, handle.id);
            signal.addEventListener("abort", () => childMenu.unregisterTrigger(node));
          }),
          !disabled &&
            parent && [
              on("click", () => {
                parent.highlight(handle.id, { focus: true });
                void childMenu.open({ focus: false, strategy: "none" });
              }),
              on("focus", () => {
                parent.highlight(handle.id);
                scheduleOpen();
              }),
              on("blur", clearScheduledOpen),
              on("pointermove", () => {
                parent.highlight(handle.id, { focus: true });
                scheduleOpen();
              }),
              on("pointerleave", (event) => {
                clearScheduledOpen();
                if (parent.activeId === handle.id && shouldClearHighlightOnPointerLeave(event)) {
                  parent.highlight(null);
                }
              }),
            ],
          mix,
        ]}
      >
        {label}
      </div>
    );
  };
}

export function onMenuSelect(handler: MenuSelectHandler, captureBoolean?: boolean) {
  return on<HTMLElement, typeof MENU_SELECT_EVENT>(MENU_SELECT_EVENT, handler, captureBoolean);
}

function positionSurface(surface: HTMLElement, trigger: HTMLElement | undefined) {
  if (!trigger) return;

  const triggerRect = trigger.getBoundingClientRect();
  const isSubmenu = surface.classList.contains("belt-menu__submenu-popup");
  const surfaceWidth = surface.offsetWidth || 192;
  const surfaceHeight = surface.offsetHeight || 0;
  const viewportPadding = 8;
  const top = isSubmenu ? triggerRect.top : triggerRect.bottom + 4;
  const left = isSubmenu ? triggerRect.right + 4 : triggerRect.left;
  const maxLeft = window.innerWidth - surfaceWidth - viewportPadding;
  const maxTop = window.innerHeight - surfaceHeight - viewportPadding;

  surface.style.position = "fixed";
  surface.style.inset = "auto";
  surface.style.margin = "0";
  surface.style.left = `${Math.max(viewportPadding, Math.min(left, maxLeft))}px`;
  surface.style.top = `${Math.max(viewportPadding, Math.min(top, maxTop))}px`;
}

function eventBelongsToCurrentMenu(event: Event) {
  if (!(event.target instanceof Element) || !(event.currentTarget instanceof Element)) return false;
  return (
    event.target.closest('[role="menu"]') === event.currentTarget.querySelector('[role="menu"]')
  );
}

function shouldClearHighlightOnPointerLeave(event: PointerEvent) {
  if (!(event.currentTarget instanceof Element)) return false;
  if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))
    return false;
  if (!(event.relatedTarget instanceof Element)) return true;

  const currentMenu = event.currentTarget.closest('[role="menu"]');
  const nextItem = event.relatedTarget.closest('[role^="menuitem"]');
  return !currentMenu || !nextItem || nextItem.closest('[role="menu"]') !== currentMenu;
}

function matchNextItemBySearchText(
  text: string,
  items: readonly RegisteredMenuItem[],
  fromIndex: number,
) {
  if (text === "") return null;

  for (let offset = 1; offset <= items.length; offset += 1) {
    const item = items[(fromIndex + offset + items.length) % items.length];
    if (!item) continue;
    if (itemMatchesSearchText(item, text)) return item;
  }

  return null;
}

function itemMatchesSearchText(item: RegisteredMenuItem, text: string) {
  const values = Array.isArray(item.searchValue)
    ? item.searchValue
    : [item.searchValue ?? item.label];
  const normalizedText = text.toLowerCase();
  return values.some((value) => value.toLowerCase().startsWith(normalizedText));
}

function getItemRole(type: MenuItemType) {
  return type === "checkbox" ? "menuitemcheckbox" : type === "radio" ? "menuitemradio" : "menuitem";
}

function normalizeText(text: string | null | undefined) {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function classNames(...parts: readonly (string | undefined)[]): string | undefined {
  const className = parts.filter(Boolean).join(" ");
  return className === "" ? undefined : className;
}
