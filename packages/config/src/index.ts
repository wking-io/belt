import type { ToolbarConfig as ToolbarConfigData } from "@repo/core";
import { Context, Effect, FileSystem, Layer, Path, Schema } from "effect";

export const toolbarConfigFilenames = [
  "toolbar.config.ts",
  "toolbar.config.mts",
  "toolbar.config.js",
  "toolbar.config.mjs"
] as const;

export type ToolbarConfigFilename = (typeof toolbarConfigFilenames)[number];

export type FindToolbarConfigOptions = {
  cwd?: string;
  filenames?: readonly string[];
};

export type LoadToolbarConfigOptions = FindToolbarConfigOptions & {
  path?: string;
};

export class MissingToolbarConfigError extends Schema.TaggedErrorClass<MissingToolbarConfigError>()(
  "MissingToolbarConfigError",
  {
    cwd: Schema.String,
    filenames: Schema.Array(Schema.String)
  }
) {}

export class UnsupportedToolbarConfigFormatError extends Schema.TaggedErrorClass<UnsupportedToolbarConfigFormatError>()(
  "UnsupportedToolbarConfigFormatError",
  {
    path: Schema.String,
    filenames: Schema.Array(Schema.String)
  }
) {}

export class ToolbarConfigModuleLoadError extends Schema.TaggedErrorClass<ToolbarConfigModuleLoadError>()(
  "ToolbarConfigModuleLoadError",
  {
    path: Schema.String,
    cause: Schema.Unknown
  }
) {}

export class InvalidToolbarConfigExportError extends Schema.TaggedErrorClass<InvalidToolbarConfigExportError>()(
  "InvalidToolbarConfigExportError",
  {
    path: Schema.String
  }
) {}

export type ToolbarConfigError =
  | MissingToolbarConfigError
  | UnsupportedToolbarConfigFormatError
  | ToolbarConfigModuleLoadError
  | InvalidToolbarConfigExportError;

export type ToolbarConfigServiceShape = {
  readonly find: (options?: FindToolbarConfigOptions) => Effect.Effect<string | undefined, never>;
  readonly load: (options?: LoadToolbarConfigOptions) => Effect.Effect<ToolbarConfigData, ToolbarConfigError>;
};

export class ToolbarConfig extends Context.Service<ToolbarConfig, ToolbarConfigData>()("belt/ToolbarConfig") {
  static layer(config: ToolbarConfigData) {
    return Layer.succeed(ToolbarConfig, config);
  }
}

export class ToolbarConfigService extends Context.Service<ToolbarConfigService, ToolbarConfigServiceShape>()(
  "belt/ToolbarConfigService"
) {
  static readonly layer = Layer.effect(
    ToolbarConfigService,
    Effect.gen(function*() {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;

      const find = Effect.fn("ToolbarConfigService.find")(function*(options: FindToolbarConfigOptions = {}) {
        const cwd = options.cwd ?? process.cwd();
        const filenames = options.filenames ?? toolbarConfigFilenames;

        for (const filename of filenames) {
          const candidate = path.resolve(cwd, filename);
          const found = yield* fs.exists(candidate).pipe(Effect.catch(() => Effect.succeed(false)));

          if (found) {
            return candidate;
          }
        }

        return undefined;
      });

      const load = Effect.fn("ToolbarConfigService.load")(function*(options: LoadToolbarConfigOptions = {}) {
        const cwd = options.cwd ?? process.cwd();
        const filenames = options.filenames ?? toolbarConfigFilenames;
        const discoveredPath = options.path ? path.resolve(cwd, options.path) : yield* find(options);

        if (!discoveredPath) {
          return yield* new MissingToolbarConfigError({ cwd, filenames: [...filenames] });
        }

        const configPath = discoveredPath;

        if (!isSupportedConfigPath(path, configPath, filenames)) {
          return yield* new UnsupportedToolbarConfigFormatError({ path: configPath, filenames: [...filenames] });
        }

        const found = yield* fs.exists(configPath).pipe(Effect.catch(() => Effect.succeed(false)));

        if (!found) {
          return yield* new MissingToolbarConfigError({
            cwd: path.dirname(configPath),
            filenames: [path.basename(configPath)]
          });
        }

        const configUrl = yield* path.toFileUrl(configPath).pipe(
          Effect.catch((cause) => Effect.fail(new ToolbarConfigModuleLoadError({ path: configPath, cause })))
        );

        const loaded = yield* Effect.tryPromise({
          try: () => import(configUrl.href) as Promise<{ default?: unknown }>,
          catch: (cause) => new ToolbarConfigModuleLoadError({ path: configPath, cause })
        });

        const config = loaded.default;

        if (!isToolbarConfig(config)) {
          return yield* new InvalidToolbarConfigExportError({ path: configPath });
        }

        return config;
      });

      return ToolbarConfigService.of({ find, load });
    })
  );
}

function isToolbarConfig(value: unknown): value is ToolbarConfigData {
  if (!value || typeof value !== "object") return false;

  const candidate = value as { tools?: unknown };

  return Array.isArray(candidate.tools);
}

function isSupportedConfigPath(path: Path.Path, filePath: string, filenames: readonly string[]): boolean {
  return filenames.includes(path.basename(filePath));
}
