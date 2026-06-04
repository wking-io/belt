import { defineTool, makeToolbarClient, type ToolDefinition } from "@repo/core";
import { Effect, Layer } from "effect";
import { HttpApiError } from "effect/unstable/httpapi";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import {
  controlPanelToolId,
  controlPanelToolLabel,
  defineControlPanel,
  type ControlPanelConfig,
  type ControlPanelRegistration,
} from "../config/index.js";
import {
  CannotSaveDefaultsBaseError,
  ControlSnapshotFieldsetMismatchError,
  DuplicateControlSnapshotIdError,
  DuplicateControlSnapshotNameError,
  UnknownControlFieldsetError,
  UnknownControlSnapshotError,
} from "../errors.js";
import { ControlSnapshotStoreLive } from "../snapshot-store/index.js";
import { ControlSession, type ControlSessionError } from "../session/index.js";
import {
  ControlPanelToolApi,
  type ControlPanelToolApiError,
  type ControlPanelToolClientOptions,
} from "./api.js";

export * from "./api.js";

export type ControlPanelToolDefinition = ToolDefinition<
  typeof ControlPanelToolApi,
  ReturnType<typeof controlPanelToolApiLayer>,
  typeof ControlSnapshotStoreLive
>;

export function controlPanelTool<const Config extends ControlPanelConfig>(
  config: Config,
): ControlPanelRegistration<Config["fieldsets"], ControlPanelToolDefinition> {
  const definition = defineControlPanel(config);

  return {
    config: definition,
    tool: defineTool({
      api: ControlPanelToolApi,
      apiLayer: controlPanelToolApiLayer(definition),
      id: controlPanelToolId,
      label: controlPanelToolLabel,
      runtimeLayer: ControlSnapshotStoreLive,
    }),
  };
}

export function makeControlPanelToolClient(options?: ControlPanelToolClientOptions) {
  return Effect.gen(function* () {
    const toolbar = yield* makeToolbarClient(options);

    return yield* toolbar.tool(ControlPanelToolApi, controlPanelToolId);
  });
}

export function controlPanelToolApiLayer(definition: ReturnType<typeof defineControlPanel>) {
  return Layer.provide(
    HttpApiBuilder.group(
      ControlPanelToolApi,
      "control-panel",
      Effect.fn("ControlPanelToolApi.handlers")(function* (handlers) {
        const session = yield* ControlSession;

        return handlers
          .handle("index", () =>
            Effect.gen(function* () {
              return yield* session.index.pipe(Effect.mapError(toControlPanelToolApiError));
            }),
          )
          .handle("state", () =>
            Effect.gen(function* () {
              return yield* session.state.pipe(Effect.mapError(toControlPanelToolApiError));
            }),
          )
          .handle("selectFieldset", ({ payload }) =>
            Effect.gen(function* () {
              return yield* session
                .selectFieldset(payload)
                .pipe(Effect.mapError(toControlPanelToolApiError));
            }),
          )
          .handle("selectBase", ({ payload }) =>
            Effect.gen(function* () {
              return yield* session
                .selectBase(payload)
                .pipe(Effect.mapError(toControlPanelToolApiError));
            }),
          )
          .handle("snapshots", () =>
            Effect.gen(function* () {
              return yield* session.snapshots.pipe(Effect.mapError(toControlPanelToolApiError));
            }),
          )
          .handle("readSnapshot", ({ payload }) =>
            Effect.gen(function* () {
              return yield* session
                .readSnapshot(payload)
                .pipe(Effect.mapError(toControlPanelToolApiError));
            }),
          )
          .handle("branchSnapshot", ({ payload }) =>
            Effect.gen(function* () {
              return yield* session
                .branchSnapshot(payload)
                .pipe(Effect.mapError(toControlPanelToolApiError));
            }),
          )
          .handle("saveSnapshot", ({ payload }) =>
            Effect.gen(function* () {
              return yield* session
                .saveSnapshot(payload)
                .pipe(Effect.mapError(toControlPanelToolApiError));
            }),
          )
          .handle("deleteSnapshot", ({ payload }) =>
            Effect.gen(function* () {
              return yield* session
                .deleteSnapshot(payload)
                .pipe(Effect.mapError(toControlPanelToolApiError));
            }),
          );
      }),
    ),
    ControlSession.layer(definition),
  );
}

function toControlPanelToolApiError(cause: ControlSessionError): ControlPanelToolApiError {
  if (
    cause instanceof UnknownControlFieldsetError ||
    cause instanceof UnknownControlSnapshotError ||
    cause instanceof ControlSnapshotFieldsetMismatchError ||
    cause instanceof DuplicateControlSnapshotIdError ||
    cause instanceof DuplicateControlSnapshotNameError ||
    cause instanceof CannotSaveDefaultsBaseError
  ) {
    return cause;
  }

  return new HttpApiError.InternalServerError({});
}
