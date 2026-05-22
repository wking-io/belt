import { assert, it } from "@effect/vitest";
import { IdGenerator, normalizeRoute, toolApiRoutePath } from "@repo/core";
import { Context, Effect, Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import { HttpApi } from "effect/unstable/httpapi";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import {
  controlField,
  controlPanelRoutePaths,
  controlPanelTool,
  controlPanelToolId,
  ControlPanelToolApi,
  ControlSnapshotPersistence,
  ControlSnapshotStore,
  type ControlPanelRegistration,
  type ControlPanelConfig,
  type ControlSnapshotStoreData
} from "../src/index.ts";

it("defines the Control Panel routes as an Effect HTTP API", () => {
  const endpoints: Array<{ method: string; path: string }> = [];

  HttpApi.reflect(ControlPanelToolApi, {
    onGroup: () => {},
    onEndpoint: ({ endpoint }) => {
      endpoints.push({
        method: endpoint.method,
        path: endpoint.path
      });
    }
  });

  assert.deepStrictEqual(endpoints, [
    { method: "GET", path: "/" },
    { method: "GET", path: "/state" },
    { method: "POST", path: "/state/select-fieldset" },
    { method: "POST", path: "/state/select-base" },
    { method: "GET", path: "/snapshots" },
    { method: "POST", path: "/snapshots/read" },
    { method: "POST", path: "/snapshots/branch" },
    { method: "POST", path: "/snapshots/save" },
    { method: "POST", path: "/snapshots/delete" }
  ]);
});

it.effect("returns config and persisted active state from the index route", () => {
  let persisted: unknown = {
    version: 1,
    snapshots: []
  };
  const registration = controlPanelTool({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text({ default: "Hello" })
        }
      },
      camera: {
        fields: {
          zoom: controlField.number({ default: 2 })
        }
      }
    }
  });

  return Effect.gen(function*() {
    const server = controlPanelServer(registration, {
      load: () => Effect.succeed(persisted),
      save: (data) => Effect.sync(() => {
        persisted = data;
      })
    });
    const response = yield* json(yield* Effect.promise(() =>
      server.fetch(request(controlPanelRoutePaths.index, "GET"))
    ));

    assert.deepStrictEqual(response, {
      config: registration.config,
      state: {
        activeFieldsetId: "scene",
        activeBaseByFieldset: {
          scene: { type: "defaults" },
          camera: { type: "defaults" }
        },
        currentValuesByFieldset: {
          scene: { title: "Hello" },
          camera: { zoom: 2 }
        }
      }
    });
    assert.deepStrictEqual(persisted, {
      version: 1,
      snapshots: []
    });
    yield* Effect.promise(() => server.dispose());
  });
});

it.effect("persists active fieldset selection across route reads", () => {
  let persisted: unknown = {
    version: 1,
    snapshots: []
  };
  const registration = controlPanelTool({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text()
        }
      },
      camera: {
        fields: {
          zoom: controlField.number()
        }
      }
    }
  });

  return Effect.gen(function*() {
    const server = controlPanelServer(registration, {
      load: () => Effect.succeed(persisted),
      save: (data) => Effect.sync(() => {
        persisted = data;
      })
    });

    yield* Effect.promise(() =>
      server.fetch(request(controlPanelRoutePaths.selectFieldset, "POST", { fieldsetId: "camera" }))
    );
    const response = yield* json(yield* Effect.promise(() =>
      server.fetch(request(controlPanelRoutePaths.state, "GET"))
    ));

    assert.deepStrictEqual(response, {
      state: {
        activeFieldsetId: "camera",
        activeBaseByFieldset: {
          scene: { type: "defaults" },
          camera: { type: "defaults" }
        },
        currentValuesByFieldset: {
          scene: { title: "" },
          camera: { zoom: 0 }
        }
      }
    });
    assert.deepStrictEqual(persisted, {
      version: 1,
      activeFieldsetId: "camera",
      activeBaseByFieldset: {
        scene: { type: "defaults" },
        camera: { type: "defaults" }
      },
      snapshots: []
    });
    yield* Effect.promise(() => server.dispose());
  });
});

it.effect("branches, saves, reads, and deletes snapshots through tool routes", () => {
  let persisted: unknown = {
    version: 1,
    snapshots: []
  };
  const registration = controlPanelTool({
    fieldsets: {
      scene: {
        fields: {
          title: controlField.text({ default: "Default" })
        }
      }
    }
  });

  return Effect.gen(function*() {
    const server = controlPanelServer(registration, {
      load: () => Effect.succeed(persisted),
      save: (data) => Effect.sync(() => {
        persisted = data;
      })
    });

    const branched = yield* json(yield* Effect.promise(() => server.fetch(request(controlPanelRoutePaths.branchSnapshot, "POST", {
      fieldsetId: "scene",
      name: "Draft",
      values: {
        title: "Draft title"
      }
    }))));

    assert.deepStrictEqual(branched, {
      snapshot: {
        id: "snapshot_test-id-1",
        name: "Draft",
        fieldsetId: "scene",
        values: {
          title: "Draft title"
        }
      },
      state: {
        activeFieldsetId: "scene",
        activeBaseByFieldset: {
          scene: {
            type: "snapshot",
            snapshotId: "snapshot_test-id-1"
          }
        },
        currentValuesByFieldset: {
          scene: {
            title: "Draft title"
          }
        }
      }
    });

    yield* Effect.promise(() => server.fetch(request(controlPanelRoutePaths.saveSnapshot, "POST", {
      fieldsetId: "scene",
      values: {
        title: "Saved title"
      }
    })));

    assert.deepStrictEqual(yield* json(yield* Effect.promise(() => server.fetch(request(controlPanelRoutePaths.readSnapshot, "POST", {
      fieldsetId: "scene",
      snapshotId: "snapshot_test-id-1"
    })))), {
      snapshot: {
        id: "snapshot_test-id-1",
        name: "Draft",
        fieldsetId: "scene",
        values: {
          title: "Saved title"
        }
      }
    });

    assert.deepStrictEqual(yield* json(yield* Effect.promise(() => server.fetch(request(controlPanelRoutePaths.deleteSnapshot, "POST", {
      fieldsetId: "scene",
      snapshotId: "snapshot_test-id-1"
    })))), {
      state: {
        activeFieldsetId: "scene",
        activeBaseByFieldset: {
          scene: {
            type: "defaults"
          }
        },
        currentValuesByFieldset: {
          scene: {
            title: "Default"
          }
        }
      },
      snapshots: []
    });
    yield* Effect.promise(() => server.dispose());
  });
});

function request(routePath: string, method: string, body?: unknown): Request {
  return new Request(new URL(toolApiRoutePath(controlPanelToolId, routePath), "http://belt.local"), {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : {
      "content-type": "application/json"
    }
  });
}

function json(response: Response) {
  return Effect.promise(async (): Promise<unknown> => response.json());
}

function controlPanelServer(
  registration: ControlPanelRegistration<ControlPanelConfig["fieldsets"], ControlSnapshotStore>,
  persistence: {
    readonly load: () => Effect.Effect<unknown>;
    readonly save: (data: ControlSnapshotStoreData) => Effect.Effect<void>;
  }
) {
  const api = registration.tool.api;
  const apiLayer = registration.tool.apiLayer;

  if (!api || !apiLayer) {
    throw new Error("Control Panel tool API registration is missing");
  }

  const app = HttpApiBuilder.layer(api).pipe(
    Layer.provide(apiLayer),
    Layer.provide(testStoreLayer(persistence)),
    Layer.provide(HttpServer.layerServices)
  );

  const { handler, dispose } = HttpRouter.toWebHandler(app);

  return {
    fetch: (request: Request) => handler(rewriteControlPanelRequest(request), Context.empty() as Context.Context<unknown>),
    dispose
  };
}

function rewriteControlPanelRequest(request: Request): Request {
  const url = new URL(request.url);
  const toolPath = `/__toolbar/tools/${controlPanelToolId}`;
  url.pathname = normalizeRoute(url.pathname.slice(toolPath.length));

  return new Request(url, request);
}

function testStoreLayer(persistence: {
  readonly load: () => Effect.Effect<unknown>;
  readonly save: (data: ControlSnapshotStoreData) => Effect.Effect<void>;
}) {
  let idIndex = 0;

  return Layer.provide(
    ControlSnapshotStore.layer,
    Layer.mergeAll(
      Layer.succeed(ControlSnapshotPersistence)({
        load: persistence.load,
        save: (data) => persistence.save(data)
      }),
      Layer.succeed(IdGenerator)({
        next: (prefix) => {
          idIndex += 1;
          return Effect.succeed(prefix ? `${prefix}_test-id-${idIndex}` : `test-id-${idIndex}`);
        }
      })
    )
  );
}
