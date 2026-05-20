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

export type ControlPanelConfigError =
  | InvalidControlFieldsetIdError
  | InvalidControlFieldIdError
  | InvalidControlSelectDefaultError
  | EmptyControlSelectOptionsError
  | DuplicateControlSelectOptionValueError
  | InvalidControlRangeError
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
