import { toolApiRoutePath } from "@repo/core";
import {
  Field,
  GhostButton,
  Input,
  Label,
  Select,
  Slider,
  StatusBanner,
  Switch,
  ToolDrawer,
  useToolbarDrawer,
  useToolRegistration,
} from "@repo/renderer-react";
import {
  controlPanelRoutePaths,
  controlPanelToolId,
  getControlFieldDefault,
  type ControlField,
  type ControlFieldValue,
  type ControlFieldsetValueMap,
  type ControlPanelDefinition,
  type ControlPanelIndexResponse,
  type ControlPanelRouteState,
  type ControlPanelStateResponse,
} from "@repo/control-panel-core";
import { useEffect, useMemo, useState, type ReactElement } from "react";

export type ControlPanelClientOptions = {
  readonly baseUrl?: string | URL;
  readonly fetch?: typeof fetch;
};

export type ControlPanelProps = {
  readonly client?: ControlPanelClient;
  readonly storageKey?: string;
};

export type ControlPanelClient = {
  readonly index: () => Promise<ControlPanelIndexResponse>;
  readonly selectFieldset: (fieldsetId: string) => Promise<ControlPanelStateResponse>;
};

type ControlPanelViewState = {
  readonly config: ControlPanelDefinition;
  readonly draftValuesByFieldset: Readonly<Record<string, ControlFieldsetValueMap>>;
  readonly error?: string;
  readonly loading: boolean;
  readonly routeState: ControlPanelRouteState;
};

type SupportedControlValue = ControlFieldValue<ControlField>;

export function createControlPanelClient(
  options: ControlPanelClientOptions = {},
): ControlPanelClient {
  const fetchImpl = options.fetch ?? fetch;

  return {
    index: () => getControlPanelJson<ControlPanelIndexResponse>(controlPanelRoutePaths.index),
    selectFieldset: (fieldsetId: string) =>
      postControlPanelJson<ControlPanelStateResponse>(controlPanelRoutePaths.selectFieldset, {
        fieldsetId,
      }),
  };

  function getControlPanelJson<Response>(routePath: string): Promise<Response> {
    return fetchControlPanelJson<Response>(fetchImpl, options.baseUrl, routePath);
  }

  function postControlPanelJson<Response>(routePath: string, body: unknown): Promise<Response> {
    return fetchControlPanelJson<Response>(fetchImpl, options.baseUrl, routePath, {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
  }
}

export function ControlPanel(props: ControlPanelProps): ReactElement | null {
  const registration = useToolRegistration(controlPanelToolId);
  const config = registration?.config as ControlPanelDefinition | undefined;
  const drawer = useToolbarDrawer();
  const client = useMemo(() => props.client ?? createControlPanelClient(), [props.client]);
  const storageKey =
    props.storageKey ?? (config === undefined ? undefined : controlPanelDraftStorageKey(config));
  const [viewState, setViewState] = useState<ControlPanelViewState | undefined>(() =>
    config === undefined
      ? undefined
      : {
          config,
          draftValuesByFieldset:
            storageKey === undefined
              ? createDraftValuesByFieldset(config)
              : (readControlPanelDraftValues(config, storageKey) ??
                createDraftValuesByFieldset(config)),
          loading: true,
          routeState: createFallbackRouteState(config),
        },
  );

  useEffect(() => {
    if (config === undefined) return undefined;

    let cancelled = false;
    setViewState((current) => ({
      config,
      draftValuesByFieldset:
        current?.draftValuesByFieldset ??
        (storageKey === undefined ? undefined : readControlPanelDraftValues(config, storageKey)) ??
        createDraftValuesByFieldset(config),
      loading: true,
      routeState: current?.routeState ?? createFallbackRouteState(config),
    }));

    void client
      .index()
      .then((response) => {
        if (cancelled) return;
        const draftValuesByFieldset =
          (storageKey === undefined
            ? undefined
            : readControlPanelDraftValues(response.config, storageKey)) ??
          response.state.currentValuesByFieldset;

        setViewState({
          config: response.config,
          draftValuesByFieldset,
          loading: false,
          routeState: response.state,
        });
      })
      .catch((cause) => {
        if (cancelled) return;
        setViewState((current) => ({
          config,
          draftValuesByFieldset:
            current?.draftValuesByFieldset ??
            (storageKey === undefined
              ? undefined
              : readControlPanelDraftValues(config, storageKey)) ??
            createDraftValuesByFieldset(config),
          error: cause instanceof Error ? cause.message : "Unable to load Control Panel state.",
          loading: false,
          routeState: current?.routeState ?? createFallbackRouteState(config),
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [client, config, storageKey]);

  if (config === undefined || viewState === undefined) return null;

  const activeFieldsetId =
    viewState.routeState.activeFieldsetId ?? Object.keys(config.fieldsets)[0];
  const activeFieldset =
    activeFieldsetId === undefined ? undefined : config.fieldsets[activeFieldsetId];
  const activeFieldsetLabel =
    activeFieldsetId === undefined
      ? "Control Panel"
      : (activeFieldset?.label ?? titleFromId(activeFieldsetId));

  return (
    <>
      <div className="belt-control-panel-toolbar-item">
        <GhostButton
          aria-expanded={drawer.isDrawerOpen(controlPanelToolId)}
          aria-label="Open Control Panel"
          icon="dial"
          onClick={() => {
            if (drawer.isDrawerOpen(controlPanelToolId)) {
              drawer.closeDrawer();
            } else {
              drawer.openDrawer(controlPanelToolId);
            }
          }}
          radius="none"
          size="compact"
          tone="neutral"
        />
      </div>
      <ToolDrawer
        drawerId={controlPanelToolId}
        title={
          <span className="belt-control-panel-drawer-title">
            <span className="belt-text" data-emphasis="strong">
              Control Panel
            </span>
            <span className="belt-text" data-emphasis="subtle" data-size="xs">
              {activeFieldsetLabel}
            </span>
          </span>
        }
      >
        <ControlPanelDrawerContent
          activeFieldsetId={activeFieldsetId}
          client={client}
          onDraftValuesChange={(fieldsetId, values) => {
            setViewState((current) =>
              current === undefined
                ? current
                : updateDraftValues(current, fieldsetId, values, storageKey),
            );
          }}
          onRouteStateChange={(routeState) => {
            setViewState((current) =>
              current === undefined
                ? current
                : {
                    ...current,
                    draftValuesByFieldset: mergeDraftValuesByFieldset(
                      current.config,
                      routeState.currentValuesByFieldset,
                      current.draftValuesByFieldset,
                    ),
                    routeState,
                  },
            );
          }}
          viewState={viewState}
        />
      </ToolDrawer>
    </>
  );
}

function ControlPanelDrawerContent(props: {
  readonly activeFieldsetId: string | undefined;
  readonly client: ControlPanelClient;
  readonly onDraftValuesChange: (fieldsetId: string, values: ControlFieldsetValueMap) => void;
  readonly onRouteStateChange: (routeState: ControlPanelRouteState) => void;
  readonly viewState: ControlPanelViewState;
}): ReactElement {
  const { config, draftValuesByFieldset, error, loading } = props.viewState;
  const activeFieldsetId = props.activeFieldsetId;
  const activeFieldset =
    activeFieldsetId === undefined ? undefined : config.fieldsets[activeFieldsetId];

  return (
    <div className="belt-control-panel-drawer">
      {error === undefined ? null : (
        <StatusBanner.Root tone="warning">
          <StatusBanner.Row>
            <StatusBanner.Icon glyph="alert" />
            <StatusBanner.Message>{error}</StatusBanner.Message>
          </StatusBanner.Row>
        </StatusBanner.Root>
      )}
      <div className="belt-control-panel-drawer__fieldset-select">
        <Select.Root
          onValueChange={(value) => {
            const fieldsetId = String(value);
            props.client
              .selectFieldset(fieldsetId)
              .then((response) => props.onRouteStateChange(response.state))
              .catch(() => {
                props.onRouteStateChange({
                  ...props.viewState.routeState,
                  activeFieldsetId: fieldsetId,
                });
              });
          }}
          value={activeFieldsetId}
        >
          <Select.Trigger defaultLabel="Fieldset" />
          <Select.List>
            {Object.entries(config.fieldsets).map(([fieldsetId, fieldset]) => (
              <Select.Option key={fieldsetId} value={fieldsetId}>
                {fieldset.label ?? titleFromId(fieldsetId)}
              </Select.Option>
            ))}
          </Select.List>
        </Select.Root>
        {loading ? (
          <span className="belt-text" data-emphasis="subtle" data-size="xs">
            Loading
          </span>
        ) : null}
      </div>
      {activeFieldset === undefined || activeFieldsetId === undefined ? (
        <span className="belt-text" data-emphasis="subtle" data-size="sm">
          No fieldset selected.
        </span>
      ) : (
        <div className="belt-control-panel-drawer__fields">
          {activeFieldset.description === undefined ? null : (
            <span className="belt-text" data-emphasis="subtle" data-size="sm">
              {activeFieldset.description}
            </span>
          )}
          {Object.entries(activeFieldset.fields).map(([fieldId, field]) => (
            <ControlPanelField
              field={field}
              fieldId={fieldId}
              key={fieldId}
              onChange={(value) => {
                const currentValues = draftValuesByFieldset[activeFieldsetId] ?? {};
                props.onDraftValuesChange(activeFieldsetId, {
                  ...currentValues,
                  [fieldId]: value,
                });
              }}
              value={
                draftValuesByFieldset[activeFieldsetId]?.[fieldId] ?? getControlFieldDefault(field)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ControlPanelField(props: {
  readonly field: ControlField;
  readonly fieldId: string;
  readonly onChange: (value: SupportedControlValue) => void;
  readonly value: unknown;
}): ReactElement {
  const label = props.field.label ?? titleFromId(props.fieldId);

  if (props.field.type === "boolean") {
    return (
      <label className="belt-control-panel-field belt-control-panel-field--boolean">
        <Switch checked={props.value === true} onCheckedChange={(value) => props.onChange(value)} />
        <span className="belt-control-panel-field__copy">
          <span className="belt-text" data-emphasis="strong" data-size="sm">
            {label}
          </span>
          {props.field.description === undefined ? null : (
            <span className="belt-text" data-emphasis="subtle" data-size="xs">
              {props.field.description}
            </span>
          )}
        </span>
      </label>
    );
  }

  if (props.field.type === "select") {
    return (
      <Field className="belt-control-panel-field">
        <ControlPanelFieldLabel field={props.field} label={label} />
        <Select.Root
          onValueChange={(value) => props.onChange(String(value))}
          value={String(props.value)}
        >
          <Select.Trigger defaultLabel={label} />
          <Select.List>
            {props.field.options.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select.List>
        </Select.Root>
      </Field>
    );
  }

  if (props.field.type === "range") {
    const value =
      typeof props.value === "number" ? props.value : (props.field.default ?? props.field.min ?? 0);

    return (
      <Slider
        className="belt-control-panel-field"
        label={label}
        max={props.field.max ?? 1}
        min={props.field.min ?? 0}
        onValueChange={(nextValue) =>
          props.onChange(Array.isArray(nextValue) ? (nextValue[0] ?? value) : nextValue)
        }
        step={props.field.step ?? 0.01}
        unit={props.field.unit}
        value={[value]}
      />
    );
  }

  if (props.field.type === "vector2" || props.field.type === "vector3") {
    const axes = props.field.type === "vector2" ? ["x", "y"] : ["x", "y", "z"];
    const value: Record<string, unknown> =
      typeof props.value === "object" && props.value !== null
        ? (props.value as Record<string, unknown>)
        : props.field.type === "vector2"
          ? (props.field.default ?? { x: 0, y: 0 })
          : (props.field.default ?? { x: 0, y: 0, z: 0 });

    return (
      <Field className="belt-control-panel-field">
        <ControlPanelFieldLabel field={props.field} label={label} />
        <div className="belt-control-panel-vector">
          {axes.map((axis) => (
            <Input
              aria-label={`${label} ${axis}`}
              key={axis}
              onChange={(event) =>
                props.onChange({
                  ...value,
                  [axis]: Number(event.currentTarget.value),
                } as SupportedControlValue)
              }
              type="number"
              value={String(value[axis] ?? 0)}
            />
          ))}
        </div>
      </Field>
    );
  }

  return (
    <Field className="belt-control-panel-field">
      <ControlPanelFieldLabel field={props.field} label={label} />
      <Input
        onChange={(event) =>
          props.onChange(
            props.field.type === "number"
              ? Number(event.currentTarget.value)
              : event.currentTarget.value,
          )
        }
        type={
          props.field.type === "number" ? "number" : props.field.type === "color" ? "text" : "text"
        }
        value={String(props.value)}
      />
    </Field>
  );
}

function ControlPanelFieldLabel(props: {
  readonly field: ControlField;
  readonly label: string;
}): ReactElement {
  return (
    <span className="belt-control-panel-field__copy">
      <Label>{props.label}</Label>
      {props.field.description === undefined ? null : (
        <span className="belt-text" data-emphasis="subtle" data-size="xs">
          {props.field.description}
        </span>
      )}
    </span>
  );
}

async function fetchControlPanelJson<Response>(
  fetchImpl: typeof fetch,
  baseUrl: string | URL | undefined,
  routePath: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetchImpl(resolveControlPanelUrl(baseUrl, routePath), init);

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return (await response.json()) as Response;
}

function resolveControlPanelUrl(baseUrl: string | URL | undefined, routePath: string): string {
  const path = toolApiRoutePath(controlPanelToolId, routePath);

  if (baseUrl === undefined) {
    return path;
  }

  return new URL(path, baseUrl).href;
}

function createDraftValuesByFieldset(
  config: ControlPanelDefinition,
): Readonly<Record<string, ControlFieldsetValueMap>> {
  return Object.fromEntries(
    Object.entries(config.fieldsets).map(([fieldsetId, fieldset]) => [
      fieldsetId,
      Object.fromEntries(
        Object.entries(fieldset.fields).map(([fieldId, field]) => [
          fieldId,
          getControlFieldDefault(field),
        ]),
      ),
    ]),
  );
}

function createFallbackRouteState(config: ControlPanelDefinition): ControlPanelRouteState {
  const activeFieldsetId = Object.keys(config.fieldsets)[0];

  return {
    ...(activeFieldsetId === undefined ? {} : { activeFieldsetId }),
    activeBaseByFieldset: Object.fromEntries(
      Object.keys(config.fieldsets).map((fieldsetId) => [fieldsetId, { type: "defaults" }]),
    ),
    currentValuesByFieldset: createDraftValuesByFieldset(config),
  };
}

function updateDraftValues(
  current: ControlPanelViewState,
  fieldsetId: string,
  values: ControlFieldsetValueMap,
  storageKey: string | undefined,
): ControlPanelViewState {
  const draftValuesByFieldset = {
    ...current.draftValuesByFieldset,
    [fieldsetId]: values,
  };

  if (storageKey !== undefined) {
    writeControlPanelDraftValues(current.config, storageKey, draftValuesByFieldset);
  }

  return {
    ...current,
    draftValuesByFieldset,
  };
}

function mergeDraftValuesByFieldset(
  config: ControlPanelDefinition,
  fallbackValuesByFieldset: Readonly<Record<string, ControlFieldsetValueMap>>,
  draftValuesByFieldset: Readonly<Record<string, ControlFieldsetValueMap>>,
): Readonly<Record<string, ControlFieldsetValueMap>> {
  return Object.fromEntries(
    Object.entries(config.fieldsets).map(([fieldsetId, fieldset]) => {
      const fallbackValues = fallbackValuesByFieldset[fieldsetId] ?? {};
      const draftValues = draftValuesByFieldset[fieldsetId] ?? {};

      return [
        fieldsetId,
        Object.fromEntries(
          Object.entries(fieldset.fields).map(([fieldId, field]) => [
            fieldId,
            draftValues[fieldId] ?? fallbackValues[fieldId] ?? getControlFieldDefault(field),
          ]),
        ),
      ];
    }),
  );
}

function controlPanelDraftStorageKey(config: ControlPanelDefinition): string {
  return `belt:control-panel:${config.configHash}:draft-values`;
}

function readControlPanelDraftValues(
  config: ControlPanelDefinition,
  storageKey: string,
): Readonly<Record<string, ControlFieldsetValueMap>> | undefined {
  const storage = getBrowserStorage();
  if (storage === undefined) return undefined;

  try {
    const stored = storage.getItem(storageKey);
    if (stored === null) return undefined;

    return sanitizeDraftValuesByFieldset(config, JSON.parse(stored));
  } catch {
    return undefined;
  }
}

function writeControlPanelDraftValues(
  config: ControlPanelDefinition,
  storageKey: string,
  valuesByFieldset: Readonly<Record<string, ControlFieldsetValueMap>>,
): void {
  const storage = getBrowserStorage();
  if (storage === undefined) return;

  try {
    storage.setItem(
      storageKey,
      JSON.stringify(sanitizeDraftValuesByFieldset(config, valuesByFieldset)),
    );
  } catch {
    // Browsers can reject localStorage writes because of quota or privacy settings.
  }
}

function sanitizeDraftValuesByFieldset(
  config: ControlPanelDefinition,
  value: unknown,
): Readonly<Record<string, ControlFieldsetValueMap>> {
  const storedByFieldset =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return Object.fromEntries(
    Object.entries(config.fieldsets).map(([fieldsetId, fieldset]) => {
      const storedFieldset =
        typeof storedByFieldset[fieldsetId] === "object" && storedByFieldset[fieldsetId] !== null
          ? (storedByFieldset[fieldsetId] as Record<string, unknown>)
          : {};

      return [
        fieldsetId,
        Object.fromEntries(
          Object.entries(fieldset.fields).map(([fieldId, field]) => [
            fieldId,
            sanitizeDraftValue(field, storedFieldset[fieldId]),
          ]),
        ),
      ];
    }),
  );
}

function sanitizeDraftValue(field: ControlField, value: unknown): SupportedControlValue {
  switch (field.type) {
    case "text":
    case "select":
    case "color":
      return typeof value === "string" ? value : getControlFieldDefault(field);
    case "number":
    case "range":
      return typeof value === "number" && Number.isFinite(value)
        ? value
        : getControlFieldDefault(field);
    case "boolean":
      return typeof value === "boolean" ? value : getControlFieldDefault(field);
    case "vector2":
      return isNumberRecord(value, ["x", "y"]) ? value : getControlFieldDefault(field);
    case "vector3":
      return isNumberRecord(value, ["x", "y", "z"]) ? value : getControlFieldDefault(field);
  }
}

function isNumberRecord<const Axes extends readonly string[]>(
  value: unknown,
  axes: Axes,
): value is { readonly [Axis in Axes[number]]: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    axes.every((axis) => {
      const axisValue = (value as Record<string, unknown>)[axis];

      return typeof axisValue === "number" && Number.isFinite(axisValue);
    })
  );
}

function getBrowserStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function titleFromId(id: string): string {
  return id
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}
