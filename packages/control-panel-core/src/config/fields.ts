import { NonEmptyStringSchema } from "@repo/core";
import { Schema } from "effect";

export const NumericControlSchema = Schema.Number.check(Schema.isFinite());
export const OklchColorSchema = Schema.String.check(Schema.isPattern(/^oklch\([^/)]*\)$/));

export const ControlVector2ValueSchema = Schema.Struct({
  x: NumericControlSchema,
  y: NumericControlSchema,
});

export const ControlVector3ValueSchema = Schema.Struct({
  x: NumericControlSchema,
  y: NumericControlSchema,
  z: NumericControlSchema,
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

export type ControlFieldMap = Readonly<Record<string, ControlField>>;

export type ControlFieldValue<Field extends ControlField> = Field extends ControlTextField
  ? string
  : Field extends ControlNumberField
    ? number
    : Field extends ControlBooleanField
      ? boolean
      : Field extends ControlSelectField
        ? string
        : Field extends ControlColorField
          ? string
          : Field extends ControlRangeField
            ? number
            : Field extends ControlVector2Field
              ? ControlVector2Value
              : Field extends ControlVector3Field
                ? ControlVector3Value
                : never;

export type ControlPanelDefaultsValue = Readonly<
  Record<string, Readonly<Record<string, ControlFieldValue<ControlField>>>>
>;
export type ControlFieldsetValueMap = Readonly<Record<string, ControlFieldValue<ControlField>>>;
export type ControlSnapshotValueMap = Readonly<Record<string, unknown>>;

export const ControlFieldMetadataSchema = Schema.Struct({
  label: Schema.optionalKey(NonEmptyStringSchema),
  description: Schema.optionalKey(NonEmptyStringSchema),
  unit: Schema.optionalKey(NonEmptyStringSchema),
});

export const ControlTextFieldSchema = Schema.Struct({
  ...ControlFieldMetadataSchema.fields,
  type: Schema.Literal("text"),
  default: Schema.optionalKey(Schema.String),
});

export const ControlNumberFieldSchema = Schema.Struct({
  ...ControlFieldMetadataSchema.fields,
  type: Schema.Literal("number"),
  default: Schema.optionalKey(NumericControlSchema),
});

export const ControlBooleanFieldSchema = Schema.Struct({
  ...ControlFieldMetadataSchema.fields,
  type: Schema.Literal("boolean"),
  default: Schema.optionalKey(Schema.Boolean),
});

export const ControlSelectOptionSchema = Schema.Struct({
  label: NonEmptyStringSchema,
  value: NonEmptyStringSchema,
});

export const ControlSelectFieldSchema = Schema.Struct({
  ...ControlFieldMetadataSchema.fields,
  type: Schema.Literal("select"),
  options: Schema.Array(ControlSelectOptionSchema),
  default: Schema.optionalKey(NonEmptyStringSchema),
});

export const ControlColorFieldSchema = Schema.Struct({
  ...ControlFieldMetadataSchema.fields,
  type: Schema.Literal("color"),
  default: Schema.optionalKey(OklchColorSchema),
});

export const ControlRangeFieldSchema = Schema.Struct({
  ...ControlFieldMetadataSchema.fields,
  type: Schema.Literal("range"),
  min: Schema.optionalKey(NumericControlSchema),
  max: Schema.optionalKey(NumericControlSchema),
  step: Schema.optionalKey(NumericControlSchema),
  default: Schema.optionalKey(NumericControlSchema),
});

export const ControlVector2FieldSchema = Schema.Struct({
  ...ControlFieldMetadataSchema.fields,
  type: Schema.Literal("vector2"),
  default: Schema.optionalKey(ControlVector2ValueSchema),
});

export const ControlVector3FieldSchema = Schema.Struct({
  ...ControlFieldMetadataSchema.fields,
  type: Schema.Literal("vector3"),
  default: Schema.optionalKey(ControlVector3ValueSchema),
});

export const ControlFieldSchema = Schema.Union([
  ControlTextFieldSchema,
  ControlNumberFieldSchema,
  ControlBooleanFieldSchema,
  ControlSelectFieldSchema,
  ControlColorFieldSchema,
  ControlRangeFieldSchema,
  ControlVector2FieldSchema,
  ControlVector3FieldSchema,
]);

export const textField = (field: Omit<ControlTextField, "type"> = {}): ControlTextField => ({
  ...field,
  type: "text",
});

export const numberField = (field: Omit<ControlNumberField, "type"> = {}): ControlNumberField => ({
  ...field,
  type: "number",
});

export const booleanField = (
  field: Omit<ControlBooleanField, "type"> = {},
): ControlBooleanField => ({
  ...field,
  type: "boolean",
});

export const selectField = (field: Omit<ControlSelectField, "type">): ControlSelectField => ({
  ...field,
  type: "select",
});

export const colorField = (field: Omit<ControlColorField, "type"> = {}): ControlColorField => ({
  ...field,
  type: "color",
});

export const rangeField = (field: Omit<ControlRangeField, "type"> = {}): ControlRangeField => ({
  min: 0,
  max: 1,
  step: 0.01,
  ...field,
  type: "range",
});

export const vector2Field = (
  field: Omit<ControlVector2Field, "type"> = {},
): ControlVector2Field => ({
  ...field,
  type: "vector2",
});

export const vector3Field = (
  field: Omit<ControlVector3Field, "type"> = {},
): ControlVector3Field => ({
  ...field,
  type: "vector3",
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
  vector3: vector3Field,
};

export function normalizeControlField(field: ControlField): ControlField {
  if (field.type === "range") {
    return {
      min: 0,
      max: 1,
      step: 0.01,
      ...field,
    };
  }

  return field;
}

export function isCompatibleControlFieldValue(field: ControlField, value: unknown): boolean {
  switch (field.type) {
    case "text":
      return typeof value === "string";
    case "number":
    case "range":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "select":
      return typeof value === "string" && field.options.some((option) => option.value === value);
    case "color":
      return typeof value === "string" && isOklchColor(value);
    case "vector2":
      return isVector2Value(value);
    case "vector3":
      return isVector3Value(value);
  }
}

export function isVector2Value(value: unknown): value is ControlVector2Value {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
}

export function isVector3Value(value: unknown): value is ControlVector3Value {
  return (
    isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y) && isFiniteNumber(value.z)
  );
}

export function isOklchColor(value: string): boolean {
  return /^oklch\([^/)]*\)$/.test(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return !!value && typeof value === "object";
}
