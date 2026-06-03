// @jsxRuntime classic
// @jsx createElement
// @jsxFrag Fragment
import {
  attrs,
  createElement,
  createMixin,
  on,
  ref,
  type ElementProps,
  type Handle,
  type MixinHandle,
  type Props,
  type RemixNode,
} from "@remix-run/ui";
import * as listbox from "@remix-run/ui/listbox";
import * as popover from "@remix-run/ui/popover";
import { Glyph } from "./glyph.js";

const SELECT_CHANGE_EVENT = "belt:select-change" as const;
const TYPEAHEAD_TIMEOUT_MS = 750;

type SelectChangeHandler = (event: SelectChangeEvent, signal: AbortSignal) => void | Promise<void>;
type SelectValue = string | null;
type SearchValue = string | string[];
type SelectTone = "neutral" | "primary" | "info" | "success" | "warning" | "danger";

declare global {
  interface HTMLElementEventMap {
    [SELECT_CHANGE_EVENT]: SelectChangeEvent;
  }
}

export class SelectChangeEvent extends Event {
  readonly label: string | null;
  readonly optionId: string | null;
  readonly value: string | null;

  constructor({
    label,
    optionId,
    value,
  }: {
    readonly label: string | null;
    readonly optionId: string | null;
    readonly value: string | null;
  }) {
    super(SELECT_CHANGE_EVENT, { bubbles: true });
    this.label = label;
    this.optionId = optionId;
    this.value = value;
  }
}

export interface SelectRootProps {
  readonly children?: RemixNode;
  readonly defaultLabel: string;
  readonly defaultValue?: string | null;
  readonly disabled?: boolean;
  readonly name?: string;
  readonly tone?: SelectTone;
}

export interface SelectProps extends Omit<Props<"button">, "children" | "name"> {
  readonly children?: RemixNode;
  readonly defaultLabel: string;
  readonly defaultValue?: string | null;
  readonly name?: string;
  readonly tone?: SelectTone;
}

export interface SelectTriggerProps extends Omit<Props<"button">, "children"> {
  readonly children?: RemixNode;
}

export interface SelectListProps extends Props<"div"> {
  readonly children?: RemixNode;
}

export type SelectOptionProps = Props<"div"> & {
  readonly disabled?: boolean;
  readonly label: string;
  readonly textValue?: SearchValue;
  readonly value: string;
};

type SelectContextValue = {
  readonly activeId: string | undefined;
  readonly disabled: boolean;
  readonly displayedLabel: string;
  readonly isExpanded: boolean;
  readonly isOpen: boolean;
  readonly listId: string;
  readonly name: string | undefined;
  readonly selectedId: string | undefined;
  readonly tone: SelectTone;
  readonly value: SelectValue;
  close: () => void;
  open: () => void;
  registerPopoverContext: (context: popover.PopoverContext) => void;
  registerSurface: (node: HTMLElement) => void;
  registerTrigger: (node: HTMLButtonElement) => void;
  selectTypeaheadMatch: (text: string) => void;
  syncSelectedOption: (option: {
    readonly id: string;
    readonly label: string;
    readonly value: string;
  }) => void;
  syncPopoverMinWidth: () => void;
  unregisterPopoverContext: (context: popover.PopoverContext) => void;
  unregisterSurface: (node: HTMLElement) => void;
  unregisterTrigger: (node: HTMLButtonElement) => void;
};

enum State {
  Initializing = "initializing",
  Closed = "closed",
  Open = "open",
}

type PendingChange = {
  readonly label: string | null;
  readonly optionId: string | null;
  readonly value: string | null;
} | null;

type RegisteredOption = listbox.ListboxRegisteredOption;

function SelectContext(handle: Handle<SelectRootProps, SelectContextValue>) {
  let triggerRef: HTMLButtonElement | undefined;
  let listboxRef: listbox.ListboxRef | undefined;
  let surfaceRef: HTMLElement | undefined;
  let popoverContextRef: popover.PopoverContext | undefined;

  let state = State.Initializing;
  let value: SelectValue = null;
  let activeValue: SelectValue = null;
  let activeId: string | undefined;
  let selectedId: string | undefined;
  let selectedLabel = "";
  let displayedLabel = "";
  let pendingChange: PendingChange = null;

  const listId = `${handle.id}-list`;

  const syncPopoverMinWidth = () => {
    if (state !== State.Open || !surfaceRef || !triggerRef) return;
    surfaceRef.style.minWidth = `${triggerRef.offsetWidth}px`;
  };

  const syncPopoverContext = () => {
    if (!popoverContextRef) return;

    popoverContextRef.hideFocusTarget = triggerRef ?? null;
    popoverContextRef.anchor = triggerRef
      ? {
          node: triggerRef,
          options: {
            inset: true,
            placement: "left",
            relativeTo: selectedId ? `#${selectedId}` : '[role="option"]',
          },
        }
      : null;
  };

  const setSelectedOption = (
    nextValue: SelectValue,
    option: RegisteredOption | undefined,
    syncDisplayedLabel = false,
  ) => {
    value = nextValue;
    activeValue = nextValue;
    activeId = option?.id;
    selectedId = option?.id;
    selectedLabel = option ? option.label : handle.props.defaultLabel;
    syncPopoverContext();

    if (syncDisplayedLabel) displayedLabel = selectedLabel;
  };

  const getPendingChange = (
    nextValue: SelectValue,
    option: RegisteredOption | undefined,
  ): PendingChange => {
    if (!option || value === nextValue) return null;

    return {
      label: option.label,
      optionId: option.id,
      value: option.value,
    };
  };

  const dispatchChange = (change: PendingChange) => {
    if (!change) return;
    (triggerRef ?? surfaceRef)?.dispatchEvent(new SelectChangeEvent(change));
  };

  const close = () => {
    if (state !== State.Open) return;
    state = State.Closed;
    void handle.update();
  };

  const context: SelectContextValue = {
    get activeId() {
      return activeId;
    },
    get disabled() {
      return !!handle.props.disabled;
    },
    get displayedLabel() {
      return displayedLabel;
    },
    get isExpanded() {
      return state === State.Open;
    },
    get isOpen() {
      return state === State.Open;
    },
    get listId() {
      return listId;
    },
    get name() {
      return handle.props.name;
    },
    get selectedId() {
      return selectedId;
    },
    get tone() {
      return handle.props.tone ?? "primary";
    },
    get value() {
      return value;
    },
    close,
    open() {
      if (state !== State.Closed || handle.props.disabled) return;
      state = State.Open;
      activeValue = value;
      void handle.update();
    },
    registerPopoverContext(popoverContext) {
      popoverContextRef = popoverContext;
      syncPopoverContext();
    },
    registerSurface(node) {
      surfaceRef = node;
    },
    registerTrigger(node) {
      triggerRef = node;
      syncPopoverContext();
    },
    selectTypeaheadMatch(text) {
      if (state !== State.Closed || handle.props.disabled) return;

      const option = listboxRef?.matchSearchText(text, value);
      if (!option) return;

      const change = getPendingChange(option.value, option);
      pendingChange = null;
      setSelectedOption(option.value, option, true);
      void handle.update().then((signal) => {
        if (!signal.aborted) dispatchChange(change);
      });
    },
    syncSelectedOption(option) {
      if (value !== option.value) return;

      selectedId = option.id;
      selectedLabel = option.label;
      if (activeValue === option.value) activeId = option.id;
      if (state !== State.Open) displayedLabel = option.label;
      syncPopoverContext();
    },
    syncPopoverMinWidth,
    unregisterPopoverContext(popoverContext) {
      if (popoverContextRef !== popoverContext) return;

      popoverContextRef.anchor = null;
      popoverContextRef.hideFocusTarget = null;
      popoverContextRef = undefined;
    },
    unregisterSurface(node) {
      if (surfaceRef === node) surfaceRef = undefined;
    },
    unregisterTrigger(node) {
      if (triggerRef === node) {
        triggerRef = undefined;
        syncPopoverContext();
      }
    },
  };

  const selectOption = (nextValue: SelectValue, option: RegisteredOption | undefined) => {
    if (state !== State.Open) return;
    pendingChange = getPendingChange(nextValue, option);
    setSelectedOption(nextValue, option);
    void handle.update();
  };

  const settleSelectedOption = async () => {
    if (state !== State.Open) return;

    const change = pendingChange;
    pendingChange = null;
    displayedLabel = selectedLabel;
    state = State.Closed;
    const signal = await handle.update();
    if (!signal.aborted) dispatchChange(change);
  };

  const highlightOption = (nextActiveValue: SelectValue, option: RegisteredOption | undefined) => {
    if (state !== State.Open) return;
    activeValue = nextActiveValue;
    activeId = option?.id;
    void handle.update();
  };

  handle.context.set(context);

  return () => {
    if (state === State.Initializing) {
      selectedLabel = displayedLabel = handle.props.defaultLabel;
      value = handle.props.defaultValue ?? null;
      activeValue = value;
      state = State.Closed;

      handle.queueTask(() => {
        if (selectedId || !surfaceRef) return;

        const selected = surfaceRef.querySelector(`[aria-selected="true"]`);
        if (!selected || selectedId) return;

        selectedId = selected.id;
        syncPopoverContext();
        void handle.update();
      });
    }

    return (
      <listbox.Context
        activeValue={activeValue}
        flashSelection
        onHighlight={highlightOption}
        onSelect={selectOption}
        onSelectSettled={settleSelectedOption}
        ref={(nextListboxRef: listbox.ListboxRef) => {
          listboxRef = nextListboxRef;
        }}
        selectionFlashAttribute="data-select-flash"
        value={value}
      >
        {handle.props.children}
        {handle.props.name ? <input mix={hiddenInputMixin()} /> : null}
      </listbox.Context>
    );
  };
}

function getSelectContext(handle: Pick<Handle<Props<"div">>, "context"> | MixinHandle) {
  return handle.context.get(SelectContext);
}

const hiddenTypeaheadMixin = createMixin<
  HTMLElement,
  [onTypeahead: (text: string) => void],
  ElementProps
>(() => {
  let text = "";
  let timeoutId = 0;

  const clearTypeahead = () => {
    clearTimeout(timeoutId);
    text = "";
  };

  return (onTypeahead) => [
    on("focusout", (event) => {
      if (
        event.relatedTarget instanceof Node &&
        event.currentTarget.contains(event.relatedTarget)
      ) {
        return;
      }

      clearTypeahead();
    }),
    on("keydown", (event) => {
      if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        clearTimeout(timeoutId);
        text += event.key.toLowerCase();
        onTypeahead(text);
        timeoutId = window.setTimeout(clearTypeahead, TYPEAHEAD_TIMEOUT_MS);
      } else if (event.key === "Escape") {
        clearTypeahead();
      } else if (event.key === "Backspace" && text.length > 0) {
        clearTimeout(timeoutId);
        text = text.slice(0, -1);
        onTypeahead(text);
        timeoutId = window.setTimeout(clearTypeahead, TYPEAHEAD_TIMEOUT_MS);
      }
    }),
  ];
});

const selectTriggerMixin = createMixin<HTMLButtonElement, [], ElementProps>((handle) => {
  return (props) => {
    const context = getSelectContext(handle);

    return [
      attrs({
        "aria-controls": context.listId,
        "aria-describedby": context.selectedId,
        "aria-expanded": context.isExpanded ? "true" : "false",
        "aria-haspopup": "listbox",
        disabled: context.disabled ? true : props.disabled,
      }),
      ref((node: HTMLButtonElement, signal) => {
        context.registerTrigger(node);
        signal.addEventListener("abort", () => context.unregisterTrigger(node));
      }),
      hiddenTypeaheadMixin((text) => context.selectTypeaheadMatch(text)),
      on("click", () => context.open()),
      on("keydown", (event) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();
        context.open();
      }),
    ];
  };
});

const selectPopoverMixin = createMixin<HTMLElement, [], ElementProps>((handle) => {
  return () => {
    const context = getSelectContext(handle);
    const popoverState = handle.context.get(popover.Context);

    return [
      ref((node: HTMLElement, signal) => {
        context.registerSurface(node);
        context.registerPopoverContext(popoverState);
        signal.addEventListener("abort", () => {
          context.unregisterSurface(node);
          context.unregisterPopoverContext(popoverState);
        });
      }),
      popover.surface({
        open: context.isOpen,
        onHide: context.close,
      }),
      on("beforetoggle", (event) => {
        if (event.newState === "open") context.syncPopoverMinWidth();
      }),
    ];
  };
});

const selectListMixin = createMixin<HTMLElement, [], ElementProps>((handle) => {
  return () => {
    const context = getSelectContext(handle);

    return [
      attrs({
        "aria-activedescendant": context.activeId,
        id: context.listId,
      }),
      popover.focusOnShow(),
      listbox.list(),
    ];
  };
});

const hiddenInputMixin = createMixin<HTMLInputElement, [], ElementProps>((handle) => {
  return () => {
    const context = getSelectContext(handle);

    return attrs({
      disabled: context.disabled ? true : undefined,
      name: context.name,
      type: "hidden",
      value: context.value ?? "",
    });
  };
});

export function selectTriggerMix() {
  return selectTriggerMixin();
}

export function onSelectChange(handler: SelectChangeHandler, captureBoolean?: boolean) {
  return on<HTMLElement, typeof SELECT_CHANGE_EVENT>(SELECT_CHANGE_EVENT, handler, captureBoolean);
}

function SelectLabel(handle: Handle) {
  const context = getSelectContext(handle);

  return () => (
    <span class="belt-select__value" data-placeholder={context.value == null ? "" : undefined}>
      {context.displayedLabel}
    </span>
  );
}

export const SelectValue = SelectLabel;

export const SelectRoot = SelectContext;

export function Select(handle: Handle<SelectProps>) {
  return () => {
    const {
      children,
      class: classes,
      className,
      defaultLabel,
      defaultValue,
      disabled,
      mix,
      name,
      tone,
      type = "button",
      ...buttonProps
    } = handle.props;

    return (
      <SelectContext
        defaultLabel={defaultLabel}
        {...(defaultValue === undefined ? {} : { defaultValue })}
        {...(disabled === undefined ? {} : { disabled })}
        {...(name === undefined ? {} : { name })}
        {...(tone === undefined ? {} : { tone })}
      >
        <div
          class={classNames("belt-surface", classes, className)}
          data-elevation="1"
          data-tone="neutral"
        >
          <div class="belt-surface__inner">
            <button
              {...buttonProps}
              class="belt-button belt-select__trigger"
              data-control
              disabled={disabled}
              mix={[selectTriggerMix(), mix]}
              type={type}
            >
              <SelectLabel />
              <span class="belt-button__end-icon">
                <Glyph name="chevronVertical" />
              </span>
            </button>
          </div>
        </div>
        <SelectList>{children}</SelectList>
      </SelectContext>
    );
  };
}

export function SelectTrigger(handle: Handle<SelectTriggerProps>) {
  return () => {
    const {
      children,
      class: classes,
      className,
      mix,
      type = "button",
      ...buttonProps
    } = handle.props;

    return (
      <button
        {...buttonProps}
        class={classNames("belt-select__trigger", classes, className)}
        mix={[selectTriggerMix(), mix]}
        type={type}
      >
        {children}
      </button>
    );
  };
}

export function SelectList(handle: Handle<SelectListProps>) {
  return () => {
    const { children, class: classes, className, mix, ...divProps } = handle.props;
    const context = getSelectContext(handle);

    return (
      <popover.Context>
        <div
          class="belt-select__popup belt-surface"
          data-elevation="1"
          data-tone="neutral"
          mix={selectPopoverMixin()}
        >
          <div class="belt-surface__inner">
            <div
              {...divProps}
              class={classNames("belt-select__list", classes, className)}
              mix={[selectListMixin(), mix]}
            >
              {children}
            </div>
          </div>
        </div>
      </popover.Context>
    );
  };
}

export function SelectOption(handle: Handle<SelectOptionProps>) {
  return () => {
    const {
      children,
      class: classes,
      className,
      disabled,
      label,
      mix,
      textValue,
      value,
      ...divProps
    } = handle.props;
    const context = getSelectContext(handle);
    context.syncSelectedOption({ id: handle.id, label, value });

    return (
      <div
        {...divProps}
        class={classNames("belt-select__item belt-text", classes, className)}
        data-size="sm"
        mix={[
          listbox.option({
            ...(disabled === undefined ? {} : { disabled }),
            label,
            ...(textValue === undefined ? {} : { textValue }),
            value,
          }),
          mix,
        ]}
      >
        <span>{children ?? label}</span>
      </div>
    );
  };
}

function classNames(...parts: readonly (string | undefined)[]): string | undefined {
  const className = parts.filter(Boolean).join(" ");
  return className === "" ? undefined : className;
}
