import { Effect } from "effect";
import {
  Button,
  Field,
  GhostButton,
  Input,
  Label,
  Select,
  Slider,
  StatusBanner,
  Switch,
  ToolDrawer,
  createToolbarClient,
  useToolbarClient,
  useToolbarDrawer,
  useToolRegistration,
  type ToolbarClient,
} from "@repo/renderer-react";
import {
  ControlPanelToolApi,
  controlPanelToolId,
  getControlFieldDefault,
  type ControlBase,
  type ControlField,
  type ControlFieldValue,
  type ControlFieldsetValueMap,
  type ControlPanelDeleteSnapshotResponse,
  type ControlPanelDefinition,
  type ControlPanelIndexResponse,
  type ControlPanelRouteState,
  type ControlPanelSnapshotsResponse,
  type ControlPanelStateResponse,
  type ControlPanelSnapshotStateResponse,
  type ControlSnapshot,
} from "@repo/control-panel-core/browser";
import { useEffect, useMemo, useState, type ReactElement } from "react";

export type ControlPanelClientOptions = {
  readonly baseUrl?: string | URL;
  readonly toolbarClient?: ToolbarClient;
};

export type ControlPanelProps = {
  readonly client?: ControlPanelClient;
  readonly storageKey?: string;
};

export type ControlPanelClient = {
  readonly branchSnapshot: (
    fieldsetId: string,
    name: string,
    values: ControlFieldsetValueMap,
  ) => Promise<ControlPanelSnapshotStateResponse>;
  readonly deleteSnapshot: (
    fieldsetId: string,
    snapshotId: string,
  ) => Promise<ControlPanelDeleteSnapshotResponse>;
  readonly index: () => Promise<ControlPanelIndexResponse>;
  readonly saveSnapshot: (
    fieldsetId: string,
    values: ControlFieldsetValueMap,
  ) => Promise<ControlPanelStateResponse>;
  readonly selectBase: (
    fieldsetId: string,
    base: ControlBase,
  ) => Promise<ControlPanelStateResponse>;
  readonly selectFieldset: (fieldsetId: string) => Promise<ControlPanelStateResponse>;
  readonly snapshots: () => Promise<ControlPanelSnapshotsResponse>;
};

type ControlPanelViewState = {
  readonly config: ControlPanelDefinition;
  readonly draftValuesByFieldset: Readonly<Record<string, ControlFieldsetValueMap>>;
  readonly error?: string;
  readonly loading: boolean;
  readonly pendingAction?: ControlPanelAction;
  readonly routeState: ControlPanelRouteState;
  readonly snapshots: readonly ControlSnapshot[];
};

type ControlPanelAction =
  | "branchSnapshot"
  | "deleteSnapshot"
  | "discardChanges"
  | "saveSnapshot"
  | "selectBase";

type ControlPanelActionCompleteOptions = {
  readonly fieldsetId: string;
  readonly snapshots?: readonly ControlSnapshot[];
  readonly type: "discardDraft";
};

type SupportedControlValue = ControlFieldValue<ControlField>;

type StoredDraftValues = Readonly<
  Record<string, Readonly<Record<string, ControlFieldsetValueMap>>>
>;

export function createControlPanelClient(
  options: ControlPanelClientOptions = {},
): ControlPanelClient {
  const toolbarClient =
    options.toolbarClient ??
    createToolbarClient(options.baseUrl === undefined ? {} : { baseUrl: options.baseUrl });

  return {
    branchSnapshot: (fieldsetId: string, name: string, values: ControlFieldsetValueMap) =>
      toolbarClient.run((client) =>
        Effect.flatMap(client.tool(ControlPanelToolApi, controlPanelToolId), (controlPanel) =>
          controlPanel.controlPanel.branchSnapshot({
            payload: {
              fieldsetId,
              name,
              values,
            },
          }),
        ),
      ),
    deleteSnapshot: (fieldsetId: string, snapshotId: string) =>
      toolbarClient.run((client) =>
        Effect.flatMap(client.tool(ControlPanelToolApi, controlPanelToolId), (controlPanel) =>
          controlPanel.controlPanel.deleteSnapshot({
            payload: {
              fieldsetId,
              snapshotId,
            },
          }),
        ),
      ),
    index: () =>
      toolbarClient.run((client) =>
        Effect.flatMap(client.tool(ControlPanelToolApi, controlPanelToolId), (controlPanel) =>
          controlPanel.controlPanel.index(),
        ),
      ),
    saveSnapshot: (fieldsetId: string, values: ControlFieldsetValueMap) =>
      toolbarClient.run((client) =>
        Effect.flatMap(client.tool(ControlPanelToolApi, controlPanelToolId), (controlPanel) =>
          controlPanel.controlPanel.saveSnapshot({
            payload: {
              fieldsetId,
              values,
            },
          }),
        ),
      ),
    selectBase: (fieldsetId: string, base: ControlBase) =>
      toolbarClient.run((client) =>
        Effect.flatMap(client.tool(ControlPanelToolApi, controlPanelToolId), (controlPanel) =>
          controlPanel.controlPanel.selectBase({
            payload: {
              base,
              fieldsetId,
            },
          }),
        ),
      ),
    selectFieldset: (fieldsetId: string) =>
      toolbarClient.run((client) =>
        Effect.flatMap(client.tool(ControlPanelToolApi, controlPanelToolId), (controlPanel) =>
          controlPanel.controlPanel.selectFieldset({
            payload: {
              fieldsetId,
            },
          }),
        ),
      ),
    snapshots: () =>
      toolbarClient.run((client) =>
        Effect.flatMap(client.tool(ControlPanelToolApi, controlPanelToolId), (controlPanel) =>
          controlPanel.controlPanel.snapshots(),
        ),
      ),
  };
}

export function ControlPanel(props: ControlPanelProps): ReactElement | null {
  const registration = useToolRegistration(controlPanelToolId);
  const config = registration?.config as ControlPanelDefinition | undefined;
  const drawer = useToolbarDrawer();
  const toolbarClient = useToolbarClient();
  const client = useMemo(
    () => props.client ?? createControlPanelClient({ toolbarClient }),
    [props.client, toolbarClient],
  );
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
              : (readControlPanelDraftValues(
                  config,
                  storageKey,
                  createFallbackRouteState(config),
                ) ?? createDraftValuesByFieldset(config)),
          loading: true,
          routeState: createFallbackRouteState(config),
          snapshots: [],
        },
  );

  useEffect(() => {
    if (config === undefined) return undefined;

    let cancelled = false;
    setViewState((current) => ({
      config,
      draftValuesByFieldset:
        current?.draftValuesByFieldset ??
        (storageKey === undefined
          ? undefined
          : readControlPanelDraftValues(config, storageKey, createFallbackRouteState(config))) ??
        createDraftValuesByFieldset(config),
      loading: true,
      routeState: current?.routeState ?? createFallbackRouteState(config),
      snapshots: current?.snapshots ?? [],
    }));

    void Promise.all([client.index(), client.snapshots()])
      .then(([response, snapshotsResponse]) => {
        if (cancelled) return;
        const draftValuesByFieldset =
          (storageKey === undefined
            ? undefined
            : readControlPanelDraftValues(response.config, storageKey, response.state)) ??
          response.state.currentValuesByFieldset;

        setViewState({
          config: response.config,
          draftValuesByFieldset,
          loading: false,
          routeState: response.state,
          snapshots: snapshotsResponse.snapshots,
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
              : readControlPanelDraftValues(
                  config,
                  storageKey,
                  createFallbackRouteState(config),
                )) ??
            createDraftValuesByFieldset(config),
          error: cause instanceof Error ? cause.message : "Unable to load Control Panel state.",
          loading: false,
          routeState: current?.routeState ?? createFallbackRouteState(config),
          snapshots: current?.snapshots ?? [],
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
                : updateDraftValues(current, fieldsetId, values, storageKey, {
                    type: "write",
                  }),
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
          onSnapshotActionComplete={(routeState, options) => {
            setViewState((current) =>
              current === undefined
                ? current
                : completeSnapshotAction(current, routeState, storageKey, options),
            );
          }}
          onSnapshotActionError={(cause) => {
            setViewState((current) =>
              current === undefined
                ? current
                : toFailedActionState(
                    current,
                    cause instanceof Error ? cause.message : "Control Panel action failed.",
                  ),
            );
          }}
          onSnapshotActionStart={(action) => {
            setViewState((current) =>
              current === undefined ? current : toPendingActionState(current, action),
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
  readonly onSnapshotActionComplete: (
    routeState: ControlPanelRouteState,
    options: ControlPanelActionCompleteOptions,
  ) => void;
  readonly onSnapshotActionError: (cause: unknown) => void;
  readonly onSnapshotActionStart: (action: ControlPanelAction) => void;
  readonly viewState: ControlPanelViewState;
}): ReactElement {
  const { config, draftValuesByFieldset, error, loading, pendingAction, routeState, snapshots } =
    props.viewState;
  const activeFieldsetId = props.activeFieldsetId;
  const activeFieldset =
    activeFieldsetId === undefined ? undefined : config.fieldsets[activeFieldsetId];
  const activeBase =
    activeFieldsetId === undefined ? undefined : routeState.activeBaseByFieldset[activeFieldsetId];
  const activeSnapshot =
    activeBase?.type === "snapshot"
      ? snapshots.find((snapshot) => snapshot.id === activeBase.snapshotId)
      : undefined;
  const activeValues =
    activeFieldsetId === undefined ? undefined : draftValuesByFieldset[activeFieldsetId];
  const snapshotOptions =
    activeFieldsetId === undefined
      ? []
      : snapshots.filter((snapshot) => snapshot.fieldsetId === activeFieldsetId);
  const activeBaseValue =
    activeBase?.type === "snapshot" ? `snapshot:${activeBase.snapshotId}` : "defaults";
  const actionDisabled =
    activeFieldsetId === undefined || activeValues === undefined || pendingAction !== undefined;

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
        <>
          <div className="belt-control-panel-drawer__snapshot-actions">
            <Select.Root
              onValueChange={(value) => {
                const base = parseControlBaseValue(String(value));
                props.onSnapshotActionStart("selectBase");
                props.client
                  .selectBase(activeFieldsetId, base)
                  .then((response) =>
                    props.onSnapshotActionComplete(response.state, {
                      fieldsetId: activeFieldsetId,
                      type: "discardDraft",
                    }),
                  )
                  .catch(props.onSnapshotActionError);
              }}
              value={activeBaseValue}
            >
              <Select.Trigger defaultLabel="Base" />
              <Select.List>
                <Select.Option value="defaults">Defaults</Select.Option>
                {snapshotOptions.map((snapshot) => (
                  <Select.Option key={snapshot.id} value={`snapshot:${snapshot.id}`}>
                    {snapshot.name}
                  </Select.Option>
                ))}
              </Select.List>
            </Select.Root>
            <div className="belt-control-panel-drawer__action-row">
              <Button
                disabled={actionDisabled}
                onClick={() => {
                  if (activeValues === undefined) return;

                  props.onSnapshotActionStart("branchSnapshot");
                  props.client
                    .branchSnapshot(
                      activeFieldsetId,
                      `Snapshot ${new Date().toLocaleTimeString()}`,
                      activeValues,
                    )
                    .then((response) =>
                      props.onSnapshotActionComplete(response.state, {
                        fieldsetId: activeFieldsetId,
                        snapshots: [...snapshots, response.snapshot],
                        type: "discardDraft",
                      }),
                    )
                    .catch(props.onSnapshotActionError);
                }}
                startIcon="branch"
              >
                Branch
              </Button>
              <Button
                disabled={actionDisabled || activeBase?.type !== "snapshot"}
                onClick={() => {
                  if (activeValues === undefined) return;

                  props.onSnapshotActionStart("saveSnapshot");
                  props.client
                    .saveSnapshot(activeFieldsetId, activeValues)
                    .then((response) =>
                      props.onSnapshotActionComplete(response.state, {
                        fieldsetId: activeFieldsetId,
                        type: "discardDraft",
                      }),
                    )
                    .catch(props.onSnapshotActionError);
                }}
                startIcon="check"
              >
                Save
              </Button>
              <GhostButton
                disabled={actionDisabled}
                onClick={() => {
                  props.onSnapshotActionStart("discardChanges");
                  props.onSnapshotActionComplete(routeState, {
                    fieldsetId: activeFieldsetId,
                    type: "discardDraft",
                  });
                }}
                startIcon="close"
              >
                Discard
              </GhostButton>
              <GhostButton
                disabled={actionDisabled || activeBase?.type !== "snapshot"}
                onClick={() => {
                  if (activeBase?.type !== "snapshot") return;

                  props.onSnapshotActionStart("deleteSnapshot");
                  props.client
                    .deleteSnapshot(activeFieldsetId, activeBase.snapshotId)
                    .then((response) =>
                      props.onSnapshotActionComplete(response.state, {
                        fieldsetId: activeFieldsetId,
                        type: "discardDraft",
                      }),
                    )
                    .catch(props.onSnapshotActionError);
                }}
                startIcon="trash"
                tone="danger"
              >
                Delete
              </GhostButton>
            </div>
            {activeBase?.type === "snapshot" && activeSnapshot !== undefined ? (
              <span className="belt-text" data-emphasis="subtle" data-size="xs">
                Editing {activeSnapshot.name}
              </span>
            ) : (
              <span className="belt-text" data-emphasis="subtle" data-size="xs">
                Save is available after selecting or branching a snapshot.
              </span>
            )}
          </div>
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
                  draftValuesByFieldset[activeFieldsetId]?.[fieldId] ??
                  getControlFieldDefault(field)
                }
              />
            ))}
          </div>
        </>
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
  options: {
    readonly type: "discard" | "write";
  },
): ControlPanelViewState {
  const draftValuesByFieldset = {
    ...current.draftValuesByFieldset,
    [fieldsetId]: values,
  };

  if (storageKey !== undefined) {
    if (options.type === "discard") {
      deleteControlPanelDraftValues(current.config, storageKey, current.routeState, fieldsetId);
    } else {
      writeControlPanelDraftValues(
        current.config,
        storageKey,
        current.routeState,
        fieldsetId,
        values,
      );
    }
  }

  return {
    ...current,
    draftValuesByFieldset,
  };
}

function completeSnapshotAction(
  current: ControlPanelViewState,
  routeState: ControlPanelRouteState,
  storageKey: string | undefined,
  options: ControlPanelActionCompleteOptions,
): ControlPanelViewState {
  const baseValues =
    routeState.currentValuesByFieldset[options.fieldsetId] ??
    current.routeState.currentValuesByFieldset[options.fieldsetId] ??
    createDraftValuesByFieldset(current.config)[options.fieldsetId] ??
    {};
  const next = updateDraftValues(current, options.fieldsetId, baseValues, storageKey, {
    type: "discard",
  });

  const { error: _error, pendingAction: _pendingAction, ...rest } = next;

  return {
    ...rest,
    routeState,
    snapshots: options.snapshots ?? current.snapshots,
  };
}

function toFailedActionState(
  current: ControlPanelViewState,
  message: string,
): ControlPanelViewState {
  const { pendingAction: _pendingAction, ...rest } = current;

  return {
    ...rest,
    error: message,
  };
}

function toPendingActionState(
  current: ControlPanelViewState,
  action: ControlPanelAction,
): ControlPanelViewState {
  const { error: _error, ...rest } = current;

  return {
    ...rest,
    pendingAction: action,
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
  routeState: ControlPanelRouteState,
): Readonly<Record<string, ControlFieldsetValueMap>> | undefined {
  const storage = getBrowserStorage();
  if (storage === undefined) return undefined;

  try {
    const stored = storage.getItem(storageKey);
    if (stored === null) return undefined;

    return readActiveDraftValuesByFieldset(
      config,
      routeState,
      sanitizeStoredDraftValues(config, JSON.parse(stored)),
    );
  } catch {
    return undefined;
  }
}

function writeControlPanelDraftValues(
  config: ControlPanelDefinition,
  storageKey: string,
  routeState: ControlPanelRouteState,
  fieldsetId: string,
  values: ControlFieldsetValueMap,
): void {
  const storage = getBrowserStorage();
  if (storage === undefined) return;

  try {
    const stored = readStoredDraftValues(config, storageKey);
    const baseKey = controlBaseStorageKey(routeState.activeBaseByFieldset[fieldsetId]);
    const next: StoredDraftValues = {
      ...stored,
      [fieldsetId]: {
        ...stored[fieldsetId],
        [baseKey]: sanitizeDraftFieldsetValues(config, fieldsetId, values),
      },
    };

    storage.setItem(storageKey, JSON.stringify(next));
  } catch {
    // Browsers can reject localStorage writes because of quota or privacy settings.
  }
}

function deleteControlPanelDraftValues(
  config: ControlPanelDefinition,
  storageKey: string,
  routeState: ControlPanelRouteState,
  fieldsetId: string,
): void {
  const storage = getBrowserStorage();
  if (storage === undefined) return;

  try {
    const stored = readStoredDraftValues(config, storageKey);
    const baseKey = controlBaseStorageKey(routeState.activeBaseByFieldset[fieldsetId]);
    const fieldsetDrafts = stored[fieldsetId] ?? {};
    const nextFieldsetDrafts = Object.fromEntries(
      Object.entries(fieldsetDrafts).filter(([key]) => key !== baseKey),
    );
    const next: StoredDraftValues = {
      ...stored,
      ...(Object.keys(nextFieldsetDrafts).length === 0 ? {} : { [fieldsetId]: nextFieldsetDrafts }),
    };

    if (Object.keys(nextFieldsetDrafts).length === 0) {
      delete (next as Record<string, unknown>)[fieldsetId];
    }

    if (Object.keys(next).length === 0) {
      storage.removeItem(storageKey);
    } else {
      storage.setItem(storageKey, JSON.stringify(next));
    }
  } catch {
    // Browsers can reject localStorage writes because of quota or privacy settings.
  }
}

function readStoredDraftValues(
  config: ControlPanelDefinition,
  storageKey: string,
): StoredDraftValues {
  const storage = getBrowserStorage();
  if (storage === undefined) return {};

  try {
    const stored = storage.getItem(storageKey);
    return stored === null ? {} : sanitizeStoredDraftValues(config, JSON.parse(stored));
  } catch {
    return {};
  }
}

function readActiveDraftValuesByFieldset(
  config: ControlPanelDefinition,
  routeState: ControlPanelRouteState,
  stored: StoredDraftValues,
): Readonly<Record<string, ControlFieldsetValueMap>> {
  return Object.fromEntries(
    Object.entries(config.fieldsets).map(([fieldsetId]) => {
      const baseKey = controlBaseStorageKey(routeState.activeBaseByFieldset[fieldsetId]);
      const fallbackValues =
        routeState.currentValuesByFieldset[fieldsetId] ??
        createDraftValuesByFieldset(config)[fieldsetId] ??
        {};

      return [fieldsetId, stored[fieldsetId]?.[baseKey] ?? fallbackValues];
    }),
  );
}

function sanitizeStoredDraftValues(
  config: ControlPanelDefinition,
  value: unknown,
): StoredDraftValues {
  const storedByFieldset =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return Object.fromEntries(
    Object.keys(config.fieldsets).map((fieldsetId) => {
      const storedFieldset =
        typeof storedByFieldset[fieldsetId] === "object" && storedByFieldset[fieldsetId] !== null
          ? (storedByFieldset[fieldsetId] as Record<string, unknown>)
          : {};

      return [
        fieldsetId,
        Object.fromEntries(
          Object.entries(storedFieldset).map(([baseKey, values]) => [
            baseKey,
            sanitizeDraftFieldsetValues(config, fieldsetId, values),
          ]),
        ),
      ];
    }),
  );
}

function sanitizeDraftFieldsetValues(
  config: ControlPanelDefinition,
  fieldsetId: string,
  value: unknown,
): ControlFieldsetValueMap {
  const fieldset = config.fieldsets[fieldsetId];
  const storedValues = typeof value === "object" && value !== null ? value : {};

  if (fieldset === undefined) return {};

  return Object.fromEntries(
    Object.entries(fieldset.fields).map(([fieldId, field]) => [
      fieldId,
      sanitizeDraftValue(field, (storedValues as Record<string, unknown>)[fieldId]),
    ]),
  );
}

function controlBaseStorageKey(base: ControlBase | undefined): string {
  return base?.type === "snapshot" ? `snapshot:${base.snapshotId}` : "defaults";
}

function parseControlBaseValue(value: string): ControlBase {
  if (value.startsWith("snapshot:")) {
    return {
      snapshotId: value.slice("snapshot:".length),
      type: "snapshot",
    };
  }

  return { type: "defaults" };
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
