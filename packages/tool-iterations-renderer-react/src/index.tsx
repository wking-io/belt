import { Combobox, GhostButton, useToolRegistration } from "@repo/renderer-react";
import type { Iteration, IterationsIndexResponse } from "@repo/tool-iterations";
import { useEffect, useMemo, useState, type ReactElement } from "react";

export const iterationsToolId = "iterations";

export type IterationsClient = {
  readonly list: () => Promise<IterationsIndexResponse>;
};

export type IterationsClientOptions = {
  readonly baseUrl?: string | URL;
  readonly fetch?: typeof fetch;
};

export type IterationsProps = {
  readonly client?: IterationsClient;
  readonly initialIterations?: readonly Iteration[];
  readonly placeholder?: string;
};

export function Iterations(props: IterationsProps): ReactElement | null {
  const registration = useToolRegistration(iterationsToolId);
  const client = useMemo(() => props.client ?? createIterationsClient(), [props.client]);
  const [iterations, setIterations] = useState<readonly Iteration[]>(props.initialIterations ?? []);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [selectedIterationId, setSelectedIterationId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (registration === undefined) return undefined;

    let cancelled = false;
    setLoading(true);
    setError(undefined);
    void client
      .list()
      .then((response) => {
        if (!cancelled) {
          setIterations(response.iterations);
          setError(undefined);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Unable to load iterations");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [client, registration]);

  if (registration === undefined) return null;

  const selectedIteration = selectFallbackIteration(iterations, selectedIterationId);
  const visibleIterations = filterIterations(iterations, search);
  const placeholder = props.placeholder ?? "Find iteration";
  const triggerLabel = getIterationsTriggerLabel({
    error,
    iterations,
    loading,
    selectedIteration,
  });

  return (
    <div className="belt-iterations-toolbar-item">
      <Combobox.Root
        inputValue={search}
        items={iterations.map((iteration) => iteration.id)}
        onInputValueChange={(inputValue) => setSearch(inputValue)}
        onValueChange={(iterationId) => {
          setSelectedIterationId(iterationId === null ? null : String(iterationId));
          setSearch("");
        }}
        value={selectedIteration?.id ?? null}
      >
        <Combobox.Trigger
          placeholder={placeholder}
          render={
            <GhostButton
              aria-label="Select iteration"
              radius="none"
              size="compact"
              startIcon="split"
            >
              {triggerLabel}
            </GhostButton>
          }
          searchPlacement="popup"
        />
        <Combobox.List placeholder={placeholder} searchPlacement="popup">
          {visibleIterations.map((iteration) => (
            <Combobox.Option key={iteration.id} value={iteration.id}>
              {getIterationDisplayLabel(iteration)}
            </Combobox.Option>
          ))}
          {iterations.length > 0 && visibleIterations.length === 0 ? (
            <Combobox.Option disabled value="no-matching-iterations">
              No matching iterations
            </Combobox.Option>
          ) : null}
          {iterations.length === 0 ? (
            <Combobox.Option disabled value="no-iterations">
              {error === undefined ? "No iterations found" : "Unable to load iterations"}
            </Combobox.Option>
          ) : null}
        </Combobox.List>
      </Combobox.Root>
    </div>
  );
}

export function selectFallbackIteration(
  iterations: readonly Iteration[],
  selectedIterationId?: string | null,
): Iteration | undefined {
  return (
    iterations.find((iteration) => iteration.id === selectedIterationId) ??
    iterations.find((iteration) => iteration.current) ??
    iterations[0]
  );
}

export function filterIterations(
  iterations: readonly Iteration[],
  query: string,
): readonly Iteration[] {
  const normalized = query.trim().toLocaleLowerCase();

  if (normalized.length === 0) return iterations;

  return iterations.filter((iteration) =>
    getIterationSearchText(iteration).toLocaleLowerCase().includes(normalized),
  );
}

export function getIterationDisplayLabel(iteration: Iteration): string {
  return getMetadataString(iteration, "branch") ?? iteration.label;
}

export function getIterationDescription(iteration: Iteration): string | undefined {
  return getMetadataString(iteration, "path") ?? iteration.description;
}

export function getIterationSearchText(iteration: Iteration): string {
  return [
    iteration.label,
    iteration.kind,
    iteration.description,
    getMetadataString(iteration, "branch"),
    getMetadataString(iteration, "path"),
    ...iteration.destinations.flatMap((destination) => [
      destination.id,
      destination.label,
      destination.url,
    ]),
  ]
    .filter((value) => value !== undefined && value.length > 0)
    .join(" ");
}

export function getIterationsTriggerLabel(options: {
  readonly error: string | undefined;
  readonly iterations: readonly Iteration[];
  readonly loading: boolean;
  readonly selectedIteration: Iteration | undefined;
}): string {
  if (options.selectedIteration !== undefined) {
    return getIterationDisplayLabel(options.selectedIteration);
  }

  if (options.loading) return "Loading iterations";
  if (options.error !== undefined) return "Iterations unavailable";
  if (options.iterations.length === 0) return "No iterations found";

  return "Select iteration";
}

function getMetadataString(iteration: Iteration, key: string): string | undefined {
  const value = iteration.metadata?.[key];

  return typeof value === "string" ? value : undefined;
}

export function createIterationsClient(options: IterationsClientOptions = {}): IterationsClient {
  const fetchImplementation = options.fetch ?? globalThis.fetch;
  const indexUrl = resolveIterationsIndexUrl(options.baseUrl);

  return {
    list: async () => {
      const response = await fetchImplementation(indexUrl);

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      return (await response.json()) as IterationsIndexResponse;
    },
  };
}

function resolveIterationsIndexUrl(baseUrl: string | URL | undefined): string {
  const routePath = "/__toolbar/tools/iterations/";

  if (baseUrl === undefined) return routePath;

  return new URL(routePath, baseUrl).href;
}
