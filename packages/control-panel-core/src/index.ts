import { defineTool, NonEmptyStringSchema, type ToolDefinition } from "@repo/core";
import { Effect, Schema } from "effect";
import type { SchemaError } from "effect/Schema";

const NumericControlSchema = Schema.Number.check(Schema.isFinite());
const OklchColorSchema = Schema.String.check(Schema.isPattern(/^oklch\([^/)]*\)$/));

export const controlPanelToolId = "control-panel";
export const controlPanelToolLabel = "Control Panel";

export const ControlVector2ValueSchema = Schema.Struct({
  x: NumericControlSchema,
  y: NumericControlSchema
});

export const ControlVector3ValueSchema = Schema.Struct({
  x: NumericControlSchema,
  y: NumericControlSchema,
  z: NumericControlSchema
});

export type ControlVector2Value = Schema.Schema.Type<typeof ControlVector2ValueSchema>;
export type ControlVector3Value = Schema.Schema.Type<typeof ControlVector3ValueSchema>;

export type ControlFieldMetadata = {
  readonly label?: string;
  readonly description?: string;
  readonly unit?: string;
};

export type ControlTextField = ControlFieldMetadata & {
  readonly type: "text";
  readonly default?: string;
};

export type ControlNumberField = ControlFieldMetadata & {
  readonly type: "number";
  readonly default?: number;
};

export type ControlBooleanField = ControlFieldMetadata & {
  readonly type: "boolean";
  readonly default?: boolean;
};

export type ControlSelectOption = {
  readonly label: string;
  readonly value: string;
};

export type ControlSelectField = ControlFieldMetadata & {
  readonly type: "select";
  readonly options: readonly ControlSelectOption[];
  readonly default?: string;
};

export type ControlColorField = ControlFieldMetadata & {
  readonly type: "color";
  readonly default?: string;
};

export type ControlRangeField = ControlFieldMetadata & {
  readonly type: "range";
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly default?: number;
};

export type ControlVector2Field = ControlFieldMetadata & {
  readonly type: "vector2";
  readonly default?: ControlVector2Value;
};

export type ControlVector3Field = ControlFieldMetadata & {
  readonly type: "vector3";
  readonly default?: ControlVector3Value;
};

export type ControlField =
  | ControlTextField
  | ControlNumberField
  | ControlBooleanField
  | ControlSelectField
  | ControlColorField
  | ControlRangeField
  | ControlVector2Field
  | ControlVector3Field;

export type ControlFieldset<Fields extends ControlFieldMap = ControlFieldMap> = {
  readonly label?: string;
  readonly description?: string;
  readonly fields: Fields;
};

export type ControlFieldMap = Readonly<Record<string, ControlField>>;

export type ControlFieldsetMap = Readonly<Record<string, ControlFieldset>>;

export type ControlPanelConfig<Fieldsets extends ControlFieldsetMap = ControlFieldsetMap> = {
  readonly fieldsets: Fieldsets;
};

export type ControlPanelDefinition<Fieldsets extends ControlFieldsetMap = ControlFieldsetMap> =
  ControlPanelConfig<Fieldsets> & {
    readonly configHash: string;
  };

export type ControlPanelRegistration<Fieldsets extends ControlFieldsetMap = ControlFieldsetMap> = {
  readonly config: ControlPanelDefinition<Fieldsets>;
  readonly tool: ToolDefinition;
};

export type ControlFieldValue<Field extends ControlField> =
  Field extends ControlTextField ? string
    : Field extends ControlNumberField ? number
      : Field extends ControlBooleanField ? boolean
        : Field extends ControlSelectField ? string
          : Field extends ControlColorField ? string
            : Field extends ControlRangeField ? number
              : Field extends ControlVector2Field ? ControlVector2Value
                : Field extends ControlVector3Field ? ControlVector3Value
                  : never;

export type ControlFieldsetValues<Fieldset extends ControlFieldset> = {
  readonly [FieldId in keyof Fieldset["fields"]]: ControlFieldValue<Fieldset["fields"][FieldId]>;
};

export type ControlPanelValues<Config extends ControlPanelConfig> = {
  readonly [FieldsetId in keyof Config["fieldsets"]]: ControlFieldsetValues<Config["fieldsets"][FieldsetId]>;
};

export type ControlPanelDefaults<Config extends ControlPanelConfig> = ControlPanelValues<Config>;
export type ControlPanelDefaultsValue = Readonly<Record<string, Readonly<Record<string, ControlFieldValue<ControlField>>>>>;
export type ControlFieldsetValueMap = Readonly<Record<string, ControlFieldValue<ControlField>>>;
export type ControlSnapshotValueMap = Readonly<Record<string, unknown>>;

export type DefaultsBase = {
  readonly type: "defaults";
};

export type SnapshotBase = {
  readonly type: "snapshot";
  readonly snapshotId: string;
};

export type ControlBase = DefaultsBase | SnapshotBase;

export const defaultsBase: DefaultsBase = {
  type: "defaults"
};

export type ControlSnapshot = {
  readonly id: string;
  readonly name: string;
  readonly fieldsetId: string;
  readonly values: ControlSnapshotValueMap;
};

export type ControlPanelState = {
  readonly activeBaseByFieldset: Readonly<Record<string, ControlBase>>;
  readonly activeFieldsetId?: string;
  readonly snapshots: readonly ControlSnapshot[];
};

export type CreateControlPanelStateOptions = {
  readonly activeBaseByFieldset?: Readonly<Record<string, ControlBase>>;
  readonly activeFieldsetId?: string;
  readonly snapshots?: readonly ControlSnapshot[];
};

export type SnapshotWriteOptions = {
  readonly id: string;
  readonly name: string;
  readonly values: ControlFieldsetValueMap;
};

export const controlSnapshotActions = ["saveChanges", "branchSnapshot", "discardChanges", "deleteSnapshot"] as const;

export type ControlSnapshotAction = (typeof controlSnapshotActions)[number];

export class InvalidControlFieldsetIdError extends Schema.TaggedErrorClass<InvalidControlFieldsetIdError>()(
  "InvalidControlFieldsetIdError",
  {
    id: Schema.String
  }
) {}

export class InvalidControlFieldIdError extends Schema.TaggedErrorClass<InvalidControlFieldIdError>()(
  "InvalidControlFieldIdError",
  {
    fieldsetId: Schema.String,
    id: Schema.String
  }
) {}

export class InvalidControlSelectDefaultError extends Schema.TaggedErrorClass<InvalidControlSelectDefaultError>()(
  "InvalidControlSelectDefaultError",
  {
    fieldsetId: Schema.String,
    fieldId: Schema.String,
    value: Schema.String
  }
) {}

export class EmptyControlSelectOptionsError extends Schema.TaggedErrorClass<EmptyControlSelectOptionsError>()(
  "EmptyControlSelectOptionsError",
  {
    fieldsetId: Schema.String,
    fieldId: Schema.String
  }
) {}

export class DuplicateControlSelectOptionValueError extends Schema.TaggedErrorClass<DuplicateControlSelectOptionValueError>()(
  "DuplicateControlSelectOptionValueError",
  {
    fieldsetId: Schema.String,
    fieldId: Schema.String,
    value: Schema.String
  }
) {}

export class InvalidControlRangeError extends Schema.TaggedErrorClass<InvalidControlRangeError>()(
  "InvalidControlRangeError",
  {
    fieldsetId: Schema.String,
    fieldId: Schema.String,
    message: Schema.String
  }
) {}

export class UnknownControlFieldsetError extends Schema.TaggedErrorClass<UnknownControlFieldsetError>()(
  "UnknownControlFieldsetError",
  {
    fieldsetId: Schema.String
  }
) {}

export class UnknownControlSnapshotError extends Schema.TaggedErrorClass<UnknownControlSnapshotError>()(
  "UnknownControlSnapshotError",
  {
    snapshotId: Schema.String
  }
) {}

export class ControlSnapshotFieldsetMismatchError extends Schema.TaggedErrorClass<ControlSnapshotFieldsetMismatchError>()(
  "ControlSnapshotFieldsetMismatchError",
  {
    fieldsetId: Schema.String,
    snapshotId: Schema.String,
    snapshotFieldsetId: Schema.String
  }
) {}

export class DuplicateControlSnapshotIdError extends Schema.TaggedErrorClass<DuplicateControlSnapshotIdError>()(
  "DuplicateControlSnapshotIdError",
  {
    snapshotId: Schema.String
  }
) {}

export class DuplicateControlSnapshotNameError extends Schema.TaggedErrorClass<DuplicateControlSnapshotNameError>()(
  "DuplicateControlSnapshotNameError",
  {
    fieldsetId: Schema.String,
    name: Schema.String
  }
) {}

export class CannotSaveDefaultsBaseError extends Schema.TaggedErrorClass<CannotSaveDefaultsBaseError>()(
  "CannotSaveDefaultsBaseError",
  {
    fieldsetId: Schema.String
  }
) {}

export type ControlPanelConfigError =
  | InvalidControlFieldsetIdError
  | InvalidControlFieldIdError
  | InvalidControlSelectDefaultError
  | EmptyControlSelectOptionsError
  | DuplicateControlSelectOptionValueError
  | InvalidControlRangeError
  | UnknownControlFieldsetError
  | UnknownControlSnapshotError
  | ControlSnapshotFieldsetMismatchError
  | DuplicateControlSnapshotIdError
  | DuplicateControlSnapshotNameError
  | CannotSaveDefaultsBaseError
  | SchemaError;

export const ControlFieldMetadataSchema = Schema.Struct({
  label: Schema.optionalKey(NonEmptyStringSchema),
  description: Schema.optionalKey(NonEmptyStringSchema),
  unit: Schema.optionalKey(NonEmptyStringSchema)
});

export const ControlTextFieldSchema = Schema.Struct({
  ...ControlFieldMetadataSchema.fields,
  type: Schema.Literal("text"),
  default: Schema.optionalKey(Schema.String)
});

export const ControlNumberFieldSchema = Schema.Struct({
  ...ControlFieldMetadataSchema.fields,
  type: Schema.Literal("number"),
  default: Schema.optionalKey(NumericControlSchema)
});

export const ControlBooleanFieldSchema = Schema.Struct({
  ...ControlFieldMetadataSchema.fields,
  type: Schema.Literal("boolean"),
  default: Schema.optionalKey(Schema.Boolean)
});

export const ControlSelectOptionSchema = Schema.Struct({
  label: NonEmptyStringSchema,
  value: NonEmptyStringSchema
});

export const ControlSelectFieldSchema = Schema.Struct({
  ...ControlFieldMetadataSchema.fields,
  type: Schema.Literal("select"),
  options: Schema.Array(ControlSelectOptionSchema),
  default: Schema.optionalKey(NonEmptyStringSchema)
});

export const ControlColorFieldSchema = Schema.Struct({
  ...ControlFieldMetadataSchema.fields,
  type: Schema.Literal("color"),
  default: Schema.optionalKey(OklchColorSchema)
});

export const ControlRangeFieldSchema = Schema.Struct({
  ...ControlFieldMetadataSchema.fields,
  type: Schema.Literal("range"),
  min: Schema.optionalKey(NumericControlSchema),
  max: Schema.optionalKey(NumericControlSchema),
  step: Schema.optionalKey(NumericControlSchema),
  default: Schema.optionalKey(NumericControlSchema)
});

export const ControlVector2FieldSchema = Schema.Struct({
  ...ControlFieldMetadataSchema.fields,
  type: Schema.Literal("vector2"),
  default: Schema.optionalKey(ControlVector2ValueSchema)
});

export const ControlVector3FieldSchema = Schema.Struct({
  ...ControlFieldMetadataSchema.fields,
  type: Schema.Literal("vector3"),
  default: Schema.optionalKey(ControlVector3ValueSchema)
});

export const ControlFieldSchema = Schema.Union([
  ControlTextFieldSchema,
  ControlNumberFieldSchema,
  ControlBooleanFieldSchema,
  ControlSelectFieldSchema,
  ControlColorFieldSchema,
  ControlRangeFieldSchema,
  ControlVector2FieldSchema,
  ControlVector3FieldSchema
]);

export const ControlFieldsetSchema = Schema.Struct({
  label: Schema.optionalKey(NonEmptyStringSchema),
  description: Schema.optionalKey(NonEmptyStringSchema),
  fields: Schema.Record(NonEmptyStringSchema, ControlFieldSchema)
});

export const ControlPanelConfigSchema = Schema.Struct({
  fieldsets: Schema.Record(NonEmptyStringSchema, ControlFieldsetSchema)
});

export const validateControlPanel = Effect.fn("validateControlPanel")(function*(config: ControlPanelConfig) {
  const decoded = yield* Schema.decodeUnknownEffect(ControlPanelConfigSchema)(config);
  const normalized = normalizeControlPanelConfig(decoded);

  const valid = yield* validateControlPanelSemantics(normalized);

  return {
    ...valid,
    configHash: getControlConfigHash(valid)
  };
});

export function defineControlPanel<const Config extends ControlPanelConfig>(
  config: Config
): ControlPanelDefinition<Config["fieldsets"]>;
export function defineControlPanel(config: ControlPanelConfig): ControlPanelDefinition {
  Schema.decodeUnknownSync(ControlPanelConfigSchema)(config);
  const normalized = normalizeControlPanelConfig(config);
  Effect.runSync(validateControlPanelSemantics(normalized));

  return {
    ...normalized,
    configHash: getControlConfigHash(normalized)
  };
}

export function controlPanelTool<const Config extends ControlPanelConfig>(
  config: Config
): ControlPanelRegistration<Config["fieldsets"]> {
  const definition = defineControlPanel(config);

  return {
    config: definition,
    tool: defineTool({
      id: controlPanelToolId,
      label: controlPanelToolLabel,
      routes: {
        index: () => Effect.succeed({ config: definition })
      }
    })
  };
}

export function normalizeControlPanelConfig<const Config extends ControlPanelConfig>(
  config: Config
): ControlPanelConfig<Config["fieldsets"]>;
export function normalizeControlPanelConfig(config: ControlPanelConfig): ControlPanelConfig {
  const fieldsets = Object.fromEntries(
    Object.entries(config.fieldsets).map(([fieldsetId, fieldset]) => [
      fieldsetId,
      {
        ...fieldset,
        fields: Object.fromEntries(
          Object.entries(fieldset.fields).map(([fieldId, field]) => [fieldId, normalizeControlField(field)])
        )
      }
    ])
  );

  return { fieldsets };
}

export function getControlPanelDefaults<const Config extends ControlPanelConfig>(
  config: Config
): ControlPanelDefaults<Config>;
export function getControlPanelDefaults(config: ControlPanelConfig): ControlPanelDefaultsValue {
  const fieldsets = Object.fromEntries(
    Object.entries(config.fieldsets).map(([fieldsetId, fieldset]) => [
      fieldsetId,
      Object.fromEntries(
        Object.entries(fieldset.fields).map(([fieldId, field]) => [fieldId, getControlFieldDefault(field)])
      )
    ])
  );

  return fieldsets;
}

export function getControlConfigHash(config: ControlPanelConfig): string {
  const shape = Object.entries(config.fieldsets)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([fieldsetId, fieldset]) => [
      fieldsetId,
      Object.entries(fieldset.fields)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([fieldId, field]) => [fieldId, field.type])
    ]);

  return hashString(stableJson(shape));
}

export function createControlPanelState(
  config: ControlPanelConfig,
  options: CreateControlPanelStateOptions = {}
): ControlPanelState {
  const fieldsetIds = Object.keys(config.fieldsets);
  const activeFieldsetId = options.activeFieldsetId ?? fieldsetIds[0];
  const activeBaseByFieldset: Record<string, ControlBase> = {};

  assertSnapshots(config, options.snapshots ?? []);

  if (activeFieldsetId !== undefined) {
    assertKnownFieldset(config, activeFieldsetId);
  }

  for (const fieldsetId of fieldsetIds) {
    const activeBase = options.activeBaseByFieldset?.[fieldsetId] ?? defaultsBase;
    activeBaseByFieldset[fieldsetId] = sanitizeControlBase(config, options.snapshots ?? [], fieldsetId, activeBase);
  }

  const state = {
    activeBaseByFieldset,
    snapshots: options.snapshots ?? []
  };

  return activeFieldsetId === undefined ? state : { ...state, activeFieldsetId };
}

export function selectActiveFieldset(state: ControlPanelState, config: ControlPanelConfig, fieldsetId: string): ControlPanelState {
  assertKnownFieldset(config, fieldsetId);

  return {
    ...state,
    activeFieldsetId: fieldsetId
  };
}

export function selectControlBase(
  state: ControlPanelState,
  config: ControlPanelConfig,
  fieldsetId: string,
  base: ControlBase
): ControlPanelState {
  assertKnownFieldset(config, fieldsetId);

  return {
    ...state,
    activeBaseByFieldset: {
      ...state.activeBaseByFieldset,
      [fieldsetId]: sanitizeControlBase(config, state.snapshots, fieldsetId, base)
    }
  };
}

export function getActiveControlBase(state: ControlPanelState, fieldsetId: string): ControlBase {
  return state.activeBaseByFieldset[fieldsetId] ?? defaultsBase;
}

export function getCurrentFieldsetValues(
  state: ControlPanelState,
  config: ControlPanelConfig,
  fieldsetId: string = state.activeFieldsetId ?? ""
): ControlFieldsetValueMap {
  assertKnownFieldset(config, fieldsetId);

  return getFieldsetValuesForBase(state, config, fieldsetId, getActiveControlBase(state, fieldsetId));
}

export function getFieldsetValuesForBase(
  state: ControlPanelState,
  config: ControlPanelConfig,
  fieldsetId: string,
  base: ControlBase
): ControlFieldsetValueMap {
  assertKnownFieldset(config, fieldsetId);

  if (base.type === "defaults") {
    return getFieldsetDefaults(config, fieldsetId);
  }

  const snapshot = findSnapshot(state.snapshots, base.snapshotId);

  if (!snapshot) {
    throw new UnknownControlSnapshotError({ snapshotId: base.snapshotId });
  }

  assertSnapshotFieldset(fieldsetId, snapshot);

  return restoreControlSnapshot(config, snapshot);
}

export function restoreControlSnapshot(config: ControlPanelConfig, snapshot: ControlSnapshot): ControlFieldsetValueMap {
  assertKnownFieldset(config, snapshot.fieldsetId);
  const defaults = getFieldsetDefaults(config, snapshot.fieldsetId);
  const fields = config.fieldsets[snapshot.fieldsetId]?.fields ?? {};
  const values: Record<string, ControlFieldValue<ControlField>> = {};

  for (const [fieldId, field] of Object.entries(fields)) {
    const savedValue = snapshot.values[fieldId];
    const fallback = defaults[fieldId] ?? getControlFieldDefault(field);
    values[fieldId] = savedValue === undefined ? fallback : restoreControlFieldValue(field, savedValue, fallback);
  }

  return values;
}

export function saveControlSnapshot(
  state: ControlPanelState,
  config: ControlPanelConfig,
  fieldsetId: string,
  values: ControlFieldsetValueMap
): ControlPanelState {
  assertKnownFieldset(config, fieldsetId);
  const activeBase = getActiveControlBase(state, fieldsetId);

  if (activeBase.type === "defaults") {
    throw new CannotSaveDefaultsBaseError({ fieldsetId });
  }

  const existingSnapshot = findSnapshot(state.snapshots, activeBase.snapshotId);

  if (!existingSnapshot) {
    throw new UnknownControlSnapshotError({ snapshotId: activeBase.snapshotId });
  }

  assertSnapshotFieldset(fieldsetId, existingSnapshot);

  return {
    ...state,
    snapshots: state.snapshots.map((snapshot) =>
      snapshot.id === existingSnapshot.id
        ? {
          ...snapshot,
          values: pickKnownFieldValues(config, fieldsetId, values)
        }
        : snapshot
    )
  };
}

export function branchControlSnapshot(
  state: ControlPanelState,
  config: ControlPanelConfig,
  fieldsetId: string,
  options: SnapshotWriteOptions
): ControlPanelState {
  assertKnownFieldset(config, fieldsetId);
  assertUniqueSnapshotId(state.snapshots, options.id);
  assertUniqueSnapshotName(state.snapshots, fieldsetId, options.name);

  const snapshot: ControlSnapshot = {
    id: options.id,
    name: options.name,
    fieldsetId,
    values: pickKnownFieldValues(config, fieldsetId, options.values)
  };

  return {
    ...state,
    activeBaseByFieldset: {
      ...state.activeBaseByFieldset,
      [fieldsetId]: {
        type: "snapshot",
        snapshotId: snapshot.id
      }
    },
    snapshots: [...state.snapshots, snapshot]
  };
}

export function discardControlChanges(
  state: ControlPanelState,
  config: ControlPanelConfig,
  fieldsetId: string
): ControlFieldsetValueMap {
  return getCurrentFieldsetValues(state, config, fieldsetId);
}

export function deleteControlSnapshot(state: ControlPanelState, snapshotId: string): ControlPanelState {
  const snapshot = findSnapshot(state.snapshots, snapshotId);

  if (!snapshot) {
    throw new UnknownControlSnapshotError({ snapshotId });
  }

  const activeBaseByFieldset: Record<string, ControlBase> = {};

  for (const [fieldsetId, activeBase] of Object.entries(state.activeBaseByFieldset)) {
    activeBaseByFieldset[fieldsetId] = activeBase.type === "snapshot" && activeBase.snapshotId === snapshotId
      ? defaultsBase
      : activeBase;
  }

  return {
    ...state,
    activeBaseByFieldset,
    snapshots: state.snapshots.filter((candidate) => candidate.id !== snapshotId)
  };
}

export const textField = (field: Omit<ControlTextField, "type"> = {}): ControlTextField => ({
  ...field,
  type: "text"
});

export const numberField = (field: Omit<ControlNumberField, "type"> = {}): ControlNumberField => ({
  ...field,
  type: "number"
});

export const booleanField = (field: Omit<ControlBooleanField, "type"> = {}): ControlBooleanField => ({
  ...field,
  type: "boolean"
});

export const selectField = (field: Omit<ControlSelectField, "type">): ControlSelectField => ({
  ...field,
  type: "select"
});

export const colorField = (field: Omit<ControlColorField, "type"> = {}): ControlColorField => ({
  ...field,
  type: "color"
});

export const rangeField = (field: Omit<ControlRangeField, "type"> = {}): ControlRangeField => ({
  min: 0,
  max: 1,
  step: 0.01,
  ...field,
  type: "range"
});

export const vector2Field = (field: Omit<ControlVector2Field, "type"> = {}): ControlVector2Field => ({
  ...field,
  type: "vector2"
});

export const vector3Field = (field: Omit<ControlVector3Field, "type"> = {}): ControlVector3Field => ({
  ...field,
  type: "vector3"
});

export const controlField: {
  readonly boolean: typeof booleanField;
  readonly color: typeof colorField;
  readonly number: typeof numberField;
  readonly range: typeof rangeField;
  readonly select: typeof selectField;
  readonly text: typeof textField;
  readonly vector2: typeof vector2Field;
  readonly vector3: typeof vector3Field;
} = {
  boolean: booleanField,
  color: colorField,
  number: numberField,
  range: rangeField,
  select: selectField,
  text: textField,
  vector2: vector2Field,
  vector3: vector3Field
};

function validateControlPanelSemantics<const Config extends ControlPanelConfig>(config: Config) {
  return Effect.gen(function*() {
    for (const [fieldsetId, fieldset] of Object.entries(config.fieldsets)) {
      if (!isControlId(fieldsetId)) {
        return yield* new InvalidControlFieldsetIdError({ id: fieldsetId });
      }

      for (const [fieldId, field] of Object.entries(fieldset.fields)) {
        if (!isControlId(fieldId)) {
          return yield* new InvalidControlFieldIdError({ fieldsetId, id: fieldId });
        }

        if (field.type === "select") {
          if (field.options.length === 0) {
            return yield* new EmptyControlSelectOptionsError({ fieldsetId, fieldId });
          }

          const duplicateOptionValue = findDuplicateSelectOptionValue(field.options);

          if (duplicateOptionValue) {
            return yield* new DuplicateControlSelectOptionValueError({
              fieldsetId,
              fieldId,
              value: duplicateOptionValue
            });
          }

          if (field.default !== undefined && !field.options.some((option) => option.value === field.default)) {
            return yield* new InvalidControlSelectDefaultError({
              fieldsetId,
              fieldId,
              value: field.default
            });
          }
        }

        if (field.type === "range") {
          const min = field.min ?? 0;
          const max = field.max ?? 1;
          const step = field.step ?? 0.01;

          if (min >= max) {
            return yield* new InvalidControlRangeError({
              fieldsetId,
              fieldId,
              message: "range min must be less than max"
            });
          }

          if (step <= 0) {
            return yield* new InvalidControlRangeError({
              fieldsetId,
              fieldId,
              message: "range step must be greater than zero"
            });
          }

          if (field.default !== undefined && (field.default < min || field.default > max)) {
            return yield* new InvalidControlRangeError({
              fieldsetId,
              fieldId,
              message: "range default must be between min and max"
            });
          }
        }
      }
    }

    return config;
  });
}

function isControlId(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value);
}

function normalizeControlField(field: ControlField): ControlField {
  if (field.type === "range") {
    return {
      min: 0,
      max: 1,
      step: 0.01,
      ...field
    };
  }

  return field;
}

function getControlFieldDefault(field: ControlField): ControlFieldValue<ControlField> {
  switch (field.type) {
    case "text":
      return field.default ?? "";
    case "number":
      return field.default ?? 0;
    case "boolean":
      return field.default ?? false;
    case "select":
      return field.default ?? field.options[0]?.value ?? "";
    case "color":
      return field.default ?? "oklch(0% 0 0)";
    case "range":
      return field.default ?? 0;
    case "vector2":
      return field.default ?? { x: 0, y: 0 };
    case "vector3":
      return field.default ?? { x: 0, y: 0, z: 0 };
  }
}

function getFieldsetDefaults(config: ControlPanelConfig, fieldsetId: string): ControlFieldsetValueMap {
  const fieldset = config.fieldsets[fieldsetId];

  if (!fieldset) {
    throw new UnknownControlFieldsetError({ fieldsetId });
  }

  const values: Record<string, ControlFieldValue<ControlField>> = {};

  for (const [fieldId, field] of Object.entries(fieldset.fields)) {
    values[fieldId] = getControlFieldDefault(field);
  }

  return values;
}

function restoreControlFieldValue(
  field: ControlField,
  value: unknown,
  fallback: ControlFieldValue<ControlField>
): ControlFieldValue<ControlField> {
  switch (field.type) {
    case "text":
      return typeof value === "string" ? value : fallback;
    case "number":
    case "range":
      return typeof value === "number" && Number.isFinite(value) ? value : fallback;
    case "boolean":
      return typeof value === "boolean" ? value : fallback;
    case "select":
      return typeof value === "string" && field.options.some((option) => option.value === value) ? value : fallback;
    case "color":
      return typeof value === "string" && isOklchColor(value) ? value : fallback;
    case "vector2":
      return isVector2Value(value) ? value : fallback;
    case "vector3":
      return isVector3Value(value) ? value : fallback;
  }
}

function pickKnownFieldValues(
  config: ControlPanelConfig,
  fieldsetId: string,
  values: ControlFieldsetValueMap
): ControlSnapshotValueMap {
  const fieldset = config.fieldsets[fieldsetId];

  if (!fieldset) {
    throw new UnknownControlFieldsetError({ fieldsetId });
  }

  const snapshotValues: Record<string, unknown> = {};

  for (const fieldId of Object.keys(fieldset.fields)) {
    if (fieldId in values) {
      snapshotValues[fieldId] = values[fieldId];
    }
  }

  return snapshotValues;
}

function sanitizeControlBase(
  config: ControlPanelConfig,
  snapshots: readonly ControlSnapshot[],
  fieldsetId: string,
  base: ControlBase
): ControlBase {
  if (base.type === "defaults") {
    return defaultsBase;
  }

  const snapshot = findSnapshot(snapshots, base.snapshotId);

  if (!snapshot) {
    throw new UnknownControlSnapshotError({ snapshotId: base.snapshotId });
  }

  assertKnownFieldset(config, fieldsetId);
  assertSnapshotFieldset(fieldsetId, snapshot);

  return base;
}

function assertKnownFieldset(config: ControlPanelConfig, fieldsetId: string): void {
  if (!config.fieldsets[fieldsetId]) {
    throw new UnknownControlFieldsetError({ fieldsetId });
  }
}

function assertSnapshots(config: ControlPanelConfig, snapshots: readonly ControlSnapshot[]): void {
  const snapshotIds = new Set<string>();
  const snapshotNamesByFieldset = new Map<string, Set<string>>();

  for (const snapshot of snapshots) {
    assertKnownFieldset(config, snapshot.fieldsetId);

    if (snapshotIds.has(snapshot.id)) {
      throw new DuplicateControlSnapshotIdError({ snapshotId: snapshot.id });
    }

    snapshotIds.add(snapshot.id);

    const names = snapshotNamesByFieldset.get(snapshot.fieldsetId) ?? new Set<string>();

    if (names.has(snapshot.name)) {
      throw new DuplicateControlSnapshotNameError({
        fieldsetId: snapshot.fieldsetId,
        name: snapshot.name
      });
    }

    names.add(snapshot.name);
    snapshotNamesByFieldset.set(snapshot.fieldsetId, names);
  }
}

function assertSnapshotFieldset(fieldsetId: string, snapshot: ControlSnapshot): void {
  if (snapshot.fieldsetId !== fieldsetId) {
    throw new ControlSnapshotFieldsetMismatchError({
      fieldsetId,
      snapshotId: snapshot.id,
      snapshotFieldsetId: snapshot.fieldsetId
    });
  }
}

function assertUniqueSnapshotId(snapshots: readonly ControlSnapshot[], snapshotId: string): void {
  if (snapshots.some((snapshot) => snapshot.id === snapshotId)) {
    throw new DuplicateControlSnapshotIdError({ snapshotId });
  }
}

function assertUniqueSnapshotName(snapshots: readonly ControlSnapshot[], fieldsetId: string, name: string): void {
  if (snapshots.some((snapshot) => snapshot.fieldsetId === fieldsetId && snapshot.name === name)) {
    throw new DuplicateControlSnapshotNameError({ fieldsetId, name });
  }
}

function findSnapshot(snapshots: readonly ControlSnapshot[], snapshotId: string): ControlSnapshot | undefined {
  return snapshots.find((snapshot) => snapshot.id === snapshotId);
}

function isVector2Value(value: unknown): value is ControlVector2Value {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
}

function isVector3Value(value: unknown): value is ControlVector3Value {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y) && isFiniteNumber(value.z);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return !!value && typeof value === "object";
}

function isOklchColor(value: string): boolean {
  return /^oklch\([^/)]*\)$/.test(value);
}

function findDuplicateSelectOptionValue(options: readonly ControlSelectOption[]): string | undefined {
  const values = new Set<string>();

  for (const option of options) {
    if (values.has(option.value)) {
      return option.value;
    }

    values.add(option.value);
  }

  return undefined;
}

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

function hashString(value: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash.toString(16).padStart(8, "0");
}
