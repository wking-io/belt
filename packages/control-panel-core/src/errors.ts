import { Schema } from "effect";
import type { SchemaError } from "effect/Schema";

export class InvalidControlFieldsetIdError extends Schema.TaggedErrorClass<InvalidControlFieldsetIdError>()(
  "InvalidControlFieldsetIdError",
  {
    id: Schema.String,
  },
) {}

export class InvalidControlFieldIdError extends Schema.TaggedErrorClass<InvalidControlFieldIdError>()(
  "InvalidControlFieldIdError",
  {
    fieldsetId: Schema.String,
    id: Schema.String,
  },
) {}

export class InvalidControlSelectDefaultError extends Schema.TaggedErrorClass<InvalidControlSelectDefaultError>()(
  "InvalidControlSelectDefaultError",
  {
    fieldsetId: Schema.String,
    fieldId: Schema.String,
    value: Schema.String,
  },
) {}

export class EmptyControlSelectOptionsError extends Schema.TaggedErrorClass<EmptyControlSelectOptionsError>()(
  "EmptyControlSelectOptionsError",
  {
    fieldsetId: Schema.String,
    fieldId: Schema.String,
  },
) {}

export class DuplicateControlSelectOptionValueError extends Schema.TaggedErrorClass<DuplicateControlSelectOptionValueError>()(
  "DuplicateControlSelectOptionValueError",
  {
    fieldsetId: Schema.String,
    fieldId: Schema.String,
    value: Schema.String,
  },
) {}

export class InvalidControlRangeError extends Schema.TaggedErrorClass<InvalidControlRangeError>()(
  "InvalidControlRangeError",
  {
    fieldsetId: Schema.String,
    fieldId: Schema.String,
    message: Schema.String,
  },
) {}

export class UnknownControlFieldsetError extends Schema.TaggedErrorClass<UnknownControlFieldsetError>()(
  "UnknownControlFieldsetError",
  {
    fieldsetId: Schema.String,
  },
) {}

export class UnknownControlSnapshotError extends Schema.TaggedErrorClass<UnknownControlSnapshotError>()(
  "UnknownControlSnapshotError",
  {
    snapshotId: Schema.String,
  },
) {}

export class ControlSnapshotFieldsetMismatchError extends Schema.TaggedErrorClass<ControlSnapshotFieldsetMismatchError>()(
  "ControlSnapshotFieldsetMismatchError",
  {
    fieldsetId: Schema.String,
    snapshotId: Schema.String,
    snapshotFieldsetId: Schema.String,
  },
) {}

export class DuplicateControlSnapshotIdError extends Schema.TaggedErrorClass<DuplicateControlSnapshotIdError>()(
  "DuplicateControlSnapshotIdError",
  {
    snapshotId: Schema.String,
  },
) {}

export class DuplicateControlSnapshotNameError extends Schema.TaggedErrorClass<DuplicateControlSnapshotNameError>()(
  "DuplicateControlSnapshotNameError",
  {
    fieldsetId: Schema.String,
    name: Schema.String,
  },
) {}

export class CannotSaveDefaultsBaseError extends Schema.TaggedErrorClass<CannotSaveDefaultsBaseError>()(
  "CannotSaveDefaultsBaseError",
  {
    fieldsetId: Schema.String,
  },
) {}

export class ControlSnapshotStoreParseError extends Schema.TaggedErrorClass<ControlSnapshotStoreParseError>()(
  "ControlSnapshotStoreParseError",
  {
    path: Schema.String,
    cause: Schema.Unknown,
  },
) {}

export class ControlSnapshotStoreReadError extends Schema.TaggedErrorClass<ControlSnapshotStoreReadError>()(
  "ControlSnapshotStoreReadError",
  {
    path: Schema.String,
    cause: Schema.Unknown,
  },
) {}

export class ControlSnapshotStoreWriteError extends Schema.TaggedErrorClass<ControlSnapshotStoreWriteError>()(
  "ControlSnapshotStoreWriteError",
  {
    path: Schema.String,
    cause: Schema.Unknown,
  },
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
  | ControlSnapshotStoreParseError
  | ControlSnapshotStoreReadError
  | ControlSnapshotStoreWriteError
  | SchemaError;

export type ControlSnapshotStoreError =
  | ControlSnapshotStoreParseError
  | ControlSnapshotStoreReadError
  | ControlSnapshotStoreWriteError
  | UnknownControlFieldsetError
  | DuplicateControlSnapshotIdError
  | DuplicateControlSnapshotNameError
  | SchemaError;

export type ControlSnapshotPersistenceError =
  | ControlSnapshotStoreParseError
  | ControlSnapshotStoreReadError
  | ControlSnapshotStoreWriteError;
