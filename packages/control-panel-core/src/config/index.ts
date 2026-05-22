import { NonEmptyStringSchema, type ToolDefinition } from "@repo/core";
import { Effect, Schema } from "effect";
import {
  ControlFieldSchema,
  type ControlField,
  type ControlFieldMap,
  type ControlFieldValue,
  type ControlPanelDefaultsValue,
  type ControlSelectOption,
  normalizeControlField
} from "./fields.js";
import {
  DuplicateControlSelectOptionValueError,
  EmptyControlSelectOptionsError,
  InvalidControlFieldIdError,
  InvalidControlFieldsetIdError,
  InvalidControlRangeError,
  InvalidControlSelectDefaultError
} from "../errors.js";

export const controlPanelToolId = "control-panel";
export const controlPanelToolLabel = "Control Panel";

export type ControlFieldset<Fields extends ControlFieldMap = ControlFieldMap> = {
  readonly label?: string;
  readonly description?: string;
  readonly fields: Fields;
};

export type ControlFieldsetMap = Readonly<Record<string, ControlFieldset>>;

export type ControlPanelConfig<Fieldsets extends ControlFieldsetMap = ControlFieldsetMap> = {
  readonly fieldsets: Fieldsets;
};

export type ControlPanelDefinition<Fieldsets extends ControlFieldsetMap = ControlFieldsetMap> =
  ControlPanelConfig<Fieldsets> & {
    readonly configHash: string;
  };

export type ControlPanelRegistration<
  Fieldsets extends ControlFieldsetMap = ControlFieldsetMap
> = {
  readonly config: ControlPanelDefinition<Fieldsets>;
  readonly tool: ToolDefinition;
};

export type ControlFieldsetValues<Fieldset extends ControlFieldset> = {
  readonly [FieldId in keyof Fieldset["fields"]]: ControlFieldValue<Fieldset["fields"][FieldId]>;
};

export type ControlPanelValues<Config extends ControlPanelConfig> = {
  readonly [FieldsetId in keyof Config["fieldsets"]]: ControlFieldsetValues<Config["fieldsets"][FieldsetId]>;
};

export type ControlPanelDefaults<Config extends ControlPanelConfig> = ControlPanelValues<Config>;

export const ControlFieldsetSchema = Schema.Struct({
  label: Schema.optionalKey(NonEmptyStringSchema),
  description: Schema.optionalKey(NonEmptyStringSchema),
  fields: Schema.Record(NonEmptyStringSchema, ControlFieldSchema)
});

export const ControlPanelConfigSchema = Schema.Struct({
  fieldsets: Schema.Record(NonEmptyStringSchema, ControlFieldsetSchema)
});

export const ControlPanelDefinitionSchema = Schema.Struct({
  ...ControlPanelConfigSchema.fields,
  configHash: NonEmptyStringSchema
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

export function getControlFieldDefault(field: ControlField): ControlFieldValue<ControlField> {
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

export function validateControlPanelSemantics<const Config extends ControlPanelConfig>(config: Config) {
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
