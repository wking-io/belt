import { NonEmptyStringSchema, normalizeRoute } from "@repo/core";
import { Schema } from "effect";
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiError,
  HttpApiSchema,
  OpenApi,
} from "effect/unstable/httpapi";
import { ControlPanelDefinitionSchema } from "../config/index.js";
import { ControlVector2ValueSchema, ControlVector3ValueSchema } from "../config/fields.js";
import {
  CannotSaveDefaultsBaseError,
  ControlSnapshotFieldsetMismatchError,
  DuplicateControlSnapshotIdError,
  DuplicateControlSnapshotNameError,
  UnknownControlFieldsetError,
  UnknownControlSnapshotError,
} from "../errors.js";

export type {
  ControlPanelRouteState,
  ControlPanelStateResponse,
  ControlPanelIndexResponse,
  ControlPanelSnapshotsResponse,
  ControlPanelSnapshotResponse,
  ControlPanelSnapshotStateResponse,
  ControlPanelDeleteSnapshotResponse,
} from "../session/index.js";

export type ControlPanelToolClientOptions = {
  readonly baseUrl?: string | URL;
};

export const controlPanelRoutePaths = {
  index: "index",
  state: "state",
  selectFieldset: "state/select-fieldset",
  selectBase: "state/select-base",
  snapshots: "snapshots",
  readSnapshot: "snapshots/read",
  branchSnapshot: "snapshots/branch",
  saveSnapshot: "snapshots/save",
  deleteSnapshot: "snapshots/delete",
} as const;

export const ControlFieldsetValueMapSchema = Schema.Record(
  Schema.String,
  Schema.Union([
    Schema.String,
    Schema.Number,
    Schema.Boolean,
    ControlVector2ValueSchema,
    ControlVector3ValueSchema,
  ]),
);

const ControlDefaultsBaseSchema = Schema.Struct({
  type: Schema.Literal("defaults"),
});

const ControlSnapshotBaseSchema = Schema.Struct({
  type: Schema.Literal("snapshot"),
  snapshotId: NonEmptyStringSchema,
});

const ControlBaseSchema = Schema.Union([ControlDefaultsBaseSchema, ControlSnapshotBaseSchema]);

const ControlSnapshotSchema = Schema.Struct({
  id: NonEmptyStringSchema,
  name: NonEmptyStringSchema,
  fieldsetId: NonEmptyStringSchema,
  values: Schema.Record(Schema.String, Schema.Unknown),
});

export const ControlPanelRouteStateSchema = Schema.Struct({
  activeFieldsetId: Schema.optionalKey(Schema.String),
  activeBaseByFieldset: Schema.Record(Schema.String, ControlBaseSchema),
  currentValuesByFieldset: Schema.Record(Schema.String, ControlFieldsetValueMapSchema),
});

export const ControlPanelStateResponseSchema = Schema.Struct({
  state: ControlPanelRouteStateSchema,
});

export const ControlPanelIndexResponseSchema = Schema.Struct({
  config: ControlPanelDefinitionSchema,
  state: ControlPanelRouteStateSchema,
});

export const ControlPanelSnapshotsResponseSchema = Schema.Struct({
  snapshots: Schema.Array(ControlSnapshotSchema),
});

export const ControlPanelSnapshotResponseSchema = Schema.Struct({
  snapshot: ControlSnapshotSchema,
});

export const ControlPanelSnapshotStateResponseSchema = Schema.Struct({
  snapshot: ControlSnapshotSchema,
  state: ControlPanelRouteStateSchema,
});

export const ControlPanelDeleteSnapshotResponseSchema = Schema.Struct({
  state: ControlPanelRouteStateSchema,
  snapshots: Schema.Array(ControlSnapshotSchema),
});

export const SelectFieldsetRequestSchema = Schema.Struct({
  fieldsetId: Schema.String,
});

export const DefaultsBaseRequestSchema = Schema.Struct({
  type: Schema.Literal("defaults"),
});

export const SnapshotBaseRequestSchema = Schema.Struct({
  type: Schema.Literal("snapshot"),
  snapshotId: Schema.String,
});

export const ControlBaseRequestSchema = Schema.Union([
  DefaultsBaseRequestSchema,
  SnapshotBaseRequestSchema,
]);

export const SelectBaseRequestSchema = Schema.Struct({
  fieldsetId: Schema.String,
  base: ControlBaseRequestSchema,
});

export const SnapshotRequestSchema = Schema.Struct({
  fieldsetId: Schema.String,
  snapshotId: Schema.String,
});

export const BranchSnapshotRequestSchema = Schema.Struct({
  fieldsetId: Schema.String,
  name: Schema.String,
  values: ControlFieldsetValueMapSchema,
});

export const SaveSnapshotRequestSchema = Schema.Struct({
  fieldsetId: Schema.String,
  values: ControlFieldsetValueMapSchema,
});

export const ControlPanelToolApiErrorSchemas = [
  UnknownControlFieldsetError.pipe(HttpApiSchema.status(404)),
  UnknownControlSnapshotError.pipe(HttpApiSchema.status(404)),
  ControlSnapshotFieldsetMismatchError.pipe(HttpApiSchema.status(409)),
  DuplicateControlSnapshotIdError.pipe(HttpApiSchema.status(409)),
  DuplicateControlSnapshotNameError.pipe(HttpApiSchema.status(409)),
  CannotSaveDefaultsBaseError.pipe(HttpApiSchema.status(409)),
  HttpApiError.InternalServerError,
] as const;

export type ControlPanelToolApiError =
  | UnknownControlFieldsetError
  | UnknownControlSnapshotError
  | ControlSnapshotFieldsetMismatchError
  | DuplicateControlSnapshotIdError
  | DuplicateControlSnapshotNameError
  | CannotSaveDefaultsBaseError
  | HttpApiError.InternalServerError;

export class ControlPanelToolApiGroup extends HttpApiGroup.make("control-panel")
  .add(
    HttpApiEndpoint.get("index", normalizeRoute(controlPanelRoutePaths.index), {
      error: ControlPanelToolApiErrorSchemas,
      success: ControlPanelIndexResponseSchema,
    }),
    HttpApiEndpoint.get("state", normalizeRoute(controlPanelRoutePaths.state), {
      error: ControlPanelToolApiErrorSchemas,
      success: ControlPanelStateResponseSchema,
    }),
    HttpApiEndpoint.post("selectFieldset", normalizeRoute(controlPanelRoutePaths.selectFieldset), {
      error: ControlPanelToolApiErrorSchemas,
      payload: SelectFieldsetRequestSchema,
      success: ControlPanelStateResponseSchema,
    }),
    HttpApiEndpoint.post("selectBase", normalizeRoute(controlPanelRoutePaths.selectBase), {
      error: ControlPanelToolApiErrorSchemas,
      payload: SelectBaseRequestSchema,
      success: ControlPanelStateResponseSchema,
    }),
    HttpApiEndpoint.get("snapshots", normalizeRoute(controlPanelRoutePaths.snapshots), {
      error: ControlPanelToolApiErrorSchemas,
      success: ControlPanelSnapshotsResponseSchema,
    }),
    HttpApiEndpoint.post("readSnapshot", normalizeRoute(controlPanelRoutePaths.readSnapshot), {
      error: ControlPanelToolApiErrorSchemas,
      payload: SnapshotRequestSchema,
      success: ControlPanelSnapshotResponseSchema,
    }),
    HttpApiEndpoint.post("branchSnapshot", normalizeRoute(controlPanelRoutePaths.branchSnapshot), {
      error: ControlPanelToolApiErrorSchemas,
      payload: BranchSnapshotRequestSchema,
      success: ControlPanelSnapshotStateResponseSchema,
    }),
    HttpApiEndpoint.post("saveSnapshot", normalizeRoute(controlPanelRoutePaths.saveSnapshot), {
      error: ControlPanelToolApiErrorSchemas,
      payload: SaveSnapshotRequestSchema,
      success: ControlPanelStateResponseSchema,
    }),
    HttpApiEndpoint.post("deleteSnapshot", normalizeRoute(controlPanelRoutePaths.deleteSnapshot), {
      error: ControlPanelToolApiErrorSchemas,
      payload: SnapshotRequestSchema,
      success: ControlPanelDeleteSnapshotResponseSchema,
    }),
  )
  .annotate(OpenApi.Title, "Control Panel") {}

export class ControlPanelToolApi extends HttpApi.make("control-panel-tool-api")
  .add(ControlPanelToolApiGroup)
  .annotate(OpenApi.Title, "Belt Control Panel Tool API") {}
