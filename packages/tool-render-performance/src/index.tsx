import {
  defineTool,
  defineToolRegistration,
  type ToolDefinition,
  type ToolHttpApi,
  type ToolHttpApiLayer,
  type ToolRegistration,
  type ToolRuntimeLayer,
} from "@repo/core";
import {
  Button,
  GhostButton,
  Panel,
  ToolDrawer,
  useToolbarDrawer,
  useToolRegistration,
  type GhostButtonProps,
  type PanelProps,
} from "@repo/renderer-react";
import {
  Children,
  Fragment,
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

export const renderPerformanceToolId = "render-performance";

export type RenderPerformanceToolDefinition = ToolDefinition<
  ToolHttpApi,
  ToolHttpApiLayer,
  ToolRuntimeLayer
>;
export type RenderPerformanceMetricId = "jank" | "inp" | "layoutShift";
export type RenderPerformanceToolConfig = RenderPerformanceJankOptions;
export type RenderPerformanceToolOptions = RenderPerformanceJankOptions;
export type RenderPerformanceToolRegistration = ToolRegistration<
  RenderPerformanceToolConfig,
  RenderPerformanceToolDefinition
>;

export type LongAnimationFrameSummary = {
  readonly duration: number;
  readonly entry: PerformanceEntry;
  readonly startTime: number;
};

export type InteractionLatencySummary = {
  readonly duration: number;
  readonly entry: PerformanceEntry;
  readonly interactionId: number;
  readonly name: string;
  readonly startTime: number;
};

export type LayoutShiftSummary = {
  readonly entry: PerformanceEntry;
  readonly hadRecentInput: boolean;
  readonly startTime: number;
  readonly value: number;
};

export type RenderPerformanceMeterOptions = {
  readonly className?: string;
  readonly historySize?: number;
  readonly observeLongAnimationFrames?: boolean;
  readonly onLongAnimationFrame?: (frame: LongAnimationFrameSummary) => void;
  readonly onSample?: (sample: RenderPerformanceSample) => void;
  readonly target?: HTMLElement;
  readonly updateIntervalMs?: number;
};

export type RenderPerformanceMeterProps = RenderPerformanceMeterOptions;

export type JankSeverity = "normal" | "warning" | "danger";

export type JankThresholds = {
  readonly danger: number;
  readonly warning: number;
};

export type InteractionLatencyThresholds = {
  readonly danger: number;
  readonly warning: number;
};

export type LayoutShiftThresholds = {
  readonly danger: number;
  readonly warning: number;
};

export type LayoutShiftSessionSummary = {
  readonly count: number;
  readonly lastShiftTime: number | undefined;
  readonly lastShiftValue: number;
  readonly totalValue: number;
  readonly value: number;
};

export type RenderPerformanceSample = {
  readonly droppedFrameCount: number;
  readonly durationMs: number;
  readonly endTime: number;
  readonly expectedFrameCount: number;
  readonly fps: number;
  readonly frameBudgetMs: number;
  readonly frameCount: number;
  readonly interactionCount: number;
  readonly interactionLatencyMs: number;
  readonly jank: number;
  readonly jankFrameCount: number;
  readonly jankTimeMs: number;
  readonly layoutShift: number;
  readonly layoutShiftCount: number;
  readonly severity: JankSeverity;
  readonly source: "long-animation-frame" | "request-animation-frame";
  readonly startTime: number;
};

export type RenderPerformanceSnapshot = {
  readonly current: RenderPerformanceSample | undefined;
  readonly history: readonly RenderPerformanceSample[];
  readonly layoutShiftSession: LayoutShiftSessionSummary;
};

export type RenderPerformanceJankOptions = {
  readonly historySize?: number;
  readonly observeLongAnimationFrames?: boolean;
  readonly targetFrameRate?: number;
  readonly thresholds?: JankThresholds;
  readonly updateIntervalMs?: number;
};

export type RenderPerformanceSubscriptionOptions = RenderPerformanceJankOptions & {
  readonly onSample: (snapshot: RenderPerformanceSnapshot) => void;
};

export type RenderPerformanceJankPanelProps = RenderPerformanceJankOptions & {
  readonly className?: string;
  readonly panelProps?: Omit<PanelProps, "children">;
  readonly showInduceJankButton?: boolean;
};

export type RenderPerformanceToolbarItemProps = RenderPerformanceJankOptions &
  Omit<GhostButtonProps, "children" | "icon" | "tone">;

export type RenderPerformanceInpToolbarItemProps = RenderPerformanceJankOptions &
  Omit<GhostButtonProps, "children" | "icon" | "tone">;

export type RenderPerformanceLayoutShiftToolbarItemProps = RenderPerformanceJankOptions &
  Omit<GhostButtonProps, "children" | "icon" | "tone">;

export type RenderPerformanceRootProps = {
  readonly children?: ReactNode;
};

export type RenderPerformanceProps = RenderPerformanceRootProps;

export type RenderPerformanceMetricProps = {
  readonly className?: string;
};

export type RenderPerformanceComponent = {
  (props: RenderPerformanceRootProps): ReactElement;
  readonly Inp: (props: RenderPerformanceMetricProps) => ReactElement;
  readonly Jank: (props: RenderPerformanceMetricProps) => ReactElement;
  readonly LayoutShift: (props: RenderPerformanceMetricProps) => ReactElement;
};

type RenderPerformanceContextValue = {
  readonly drawerOpen: boolean;
  readonly onMetricClick: () => void;
  readonly snapshot: RenderPerformanceSnapshot;
};

const renderPerformanceToolbarSampleSize = 10;
const longFrameThresholdMs = 50;

const RenderPerformanceContext = createContext<RenderPerformanceContextValue | undefined>(
  undefined,
);

export const defaultJankThresholds: JankThresholds = {
  danger: 20,
  warning: 5,
};

export const defaultInteractionLatencyThresholds: InteractionLatencyThresholds = {
  danger: 500,
  warning: 200,
};

export const defaultLayoutShiftThresholds: LayoutShiftThresholds = {
  danger: 0.25,
  warning: 0.1,
};

const emptyLayoutShiftSession: LayoutShiftSessionSummary = {
  count: 0,
  lastShiftTime: undefined,
  lastShiftValue: 0,
  totalValue: 0,
  value: 0,
};

export function renderPerformanceTool(
  options: RenderPerformanceToolOptions = {},
): RenderPerformanceToolRegistration {
  const config = normalizeRenderPerformanceToolConfig(options);

  return defineToolRegistration({
    ...(Object.keys(config).length === 0 ? {} : { config }),
    tool: defineTool({
      id: renderPerformanceToolId,
      label: "Render Performance",
    }),
  });
}

export function normalizeRenderPerformanceToolConfig(
  config: RenderPerformanceToolOptions | unknown,
): RenderPerformanceToolConfig {
  const options =
    config !== null && typeof config === "object" ? (config as RenderPerformanceToolOptions) : {};

  return {
    ...(options.historySize !== undefined ? { historySize: options.historySize } : {}),
    ...(options.observeLongAnimationFrames !== undefined
      ? { observeLongAnimationFrames: options.observeLongAnimationFrames }
      : {}),
    ...(options.targetFrameRate !== undefined ? { targetFrameRate: options.targetFrameRate } : {}),
    ...(options.thresholds !== undefined ? { thresholds: options.thresholds } : {}),
    ...(options.updateIntervalMs !== undefined
      ? { updateIntervalMs: options.updateIntervalMs }
      : {}),
  };
}

export function mountRenderPerformanceMeter(
  options: RenderPerformanceMeterOptions = {},
): () => void {
  const {
    className,
    historySize = 60,
    observeLongAnimationFrames = true,
    onLongAnimationFrame = logLongAnimationFrame,
    onSample,
    target = document.body,
    updateIntervalMs = 1000,
  } = options;
  const el = document.createElement("div");
  const updateEveryMs = Math.max(100, updateIntervalMs);
  let observer: PerformanceObserver | undefined;

  el.className = classNames("belt-render-performance-meter", className) ?? "";
  el.dataset.beltRenderPerformanceMeter = "true";
  el.textContent = "Jank --% • -- FPS";
  target.appendChild(el);

  if (observeLongAnimationFrames && supportsLongAnimationFrameObserver()) {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        onLongAnimationFrame({
          duration: entry.duration,
          entry,
          startTime: entry.startTime,
        });
      }
    });
    observer.observe({ type: "long-animation-frame", buffered: true });
  }

  const unsubscribe = subscribeToRenderPerformanceJank({
    historySize,
    observeLongAnimationFrames,
    onSample(nextSnapshot) {
      const current = nextSnapshot.current;

      if (current === undefined) {
        return;
      }

      el.textContent = `Jank ${formatJank(current.jank)} • ${current.fps.toFixed(0)} FPS`;
      onSample?.(current);
    },
    updateIntervalMs: updateEveryMs,
  });

  return () => {
    unsubscribe();
    observer?.disconnect();
    el.remove();
  };
}

export function RenderPerformanceMeter(props: RenderPerformanceMeterProps): ReactElement | null {
  useEffect(
    () => mountRenderPerformanceMeter(props),
    [
      props.className,
      props.historySize,
      props.observeLongAnimationFrames,
      props.onLongAnimationFrame,
      props.onSample,
      props.target,
      props.updateIntervalMs,
    ],
  );

  return null;
}

export function subscribeToRenderPerformanceJank(
  options: RenderPerformanceSubscriptionOptions,
): () => void {
  const {
    historySize = 60,
    observeLongAnimationFrames = true,
    onSample,
    targetFrameRate = 60,
    thresholds = defaultJankThresholds,
    updateIntervalMs = 1000,
  } = options;
  const updateEveryMs = Math.max(100, updateIntervalMs);
  const maxHistorySize = Math.max(1, Math.floor(historySize));
  let frameDurationsMs: readonly number[] = [];
  let frameCount = 0;
  let interactions: readonly InteractionLatencySummary[] = [];
  let lastSampleTime = performance.now();
  let lastFrameTime = lastSampleTime;
  let layoutShifts: readonly LayoutShiftSummary[] = [];
  let layoutShiftSessionEntries: readonly LayoutShiftSummary[] = [];
  let longAnimationFrames: readonly LongAnimationFrameSummary[] = [];
  let eventObserver: PerformanceObserver | undefined;
  let layoutShiftObserver: PerformanceObserver | undefined;
  let longAnimationFrameObserver: PerformanceObserver | undefined;
  let rafId = 0;
  let history: readonly RenderPerformanceSample[] = [];

  if (observeLongAnimationFrames && supportsLongAnimationFrameObserver()) {
    longAnimationFrameObserver = new PerformanceObserver((list) => {
      longAnimationFrames = [
        ...longAnimationFrames,
        ...list.getEntries().map((entry) => ({
          duration: entry.duration,
          entry,
          startTime: entry.startTime,
        })),
      ];
    });
    longAnimationFrameObserver.observe({ type: "long-animation-frame", buffered: true });
  }

  if (supportsEventObserver()) {
    eventObserver = new PerformanceObserver((list) => {
      interactions = [...interactions, ...list.getEntries().map(toInteractionLatencySummary)];
    });
    eventObserver.observe({
      type: "event",
      buffered: true,
      durationThreshold: 16,
    } as PerformanceObserverInit & { readonly durationThreshold: number });
  }

  if (supportsLayoutShiftObserver()) {
    layoutShiftObserver = new PerformanceObserver((list) => {
      layoutShifts = [...layoutShifts, ...list.getEntries().map(toLayoutShiftSummary)];
    });
    layoutShiftObserver.observe({ type: "layout-shift", buffered: true });
  }

  const tick = (now: number) => {
    frameCount += 1;
    const frameDurationMs = Math.max(0, now - lastFrameTime);
    const elapsed = now - lastSampleTime;
    frameDurationsMs = [...frameDurationsMs, frameDurationMs];
    lastFrameTime = now;

    if (elapsed >= updateEveryMs) {
      const sampleWindow = {
        endTime: now,
        startTime: lastSampleTime,
      };
      const sample = calculateRenderPerformanceSample({
        endTime: now,
        frameDurationsMs,
        frameCount,
        interactions,
        layoutShifts,
        longAnimationFrames,
        startTime: lastSampleTime,
        targetFrameRate,
        thresholds,
      });
      const sampleLayoutShifts = filterEntriesInWindow(layoutShifts, sampleWindow).filter(
        (entry) => !entry.hadRecentInput,
      );
      layoutShiftSessionEntries = [...layoutShiftSessionEntries, ...sampleLayoutShifts];
      const layoutShiftSession = calculateLayoutShiftSession(layoutShiftSessionEntries);
      const nextSampleStartTime = now;
      history = appendRenderPerformanceSample(history, sample, maxHistorySize);
      onSample({
        current: sample,
        history,
        layoutShiftSession,
      });
      frameDurationsMs = [];
      frameCount = 0;
      interactions = interactions.filter((interaction) => interaction.startTime >= now);
      lastSampleTime = nextSampleStartTime;
      lastFrameTime = nextSampleStartTime;
      layoutShifts = layoutShifts.filter((layoutShift) => layoutShift.startTime >= now);
      longAnimationFrames = longAnimationFrames.filter((frame) => frame.startTime >= now);
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(rafId);
    eventObserver?.disconnect();
    layoutShiftObserver?.disconnect();
    longAnimationFrameObserver?.disconnect();
  };
}

export function useRenderPerformanceJank(
  options: RenderPerformanceJankOptions = {},
): RenderPerformanceSnapshot {
  const [snapshot, setSnapshot] = useState<RenderPerformanceSnapshot>({
    current: undefined,
    history: [],
    layoutShiftSession: emptyLayoutShiftSession,
  });

  useEffect(
    () =>
      subscribeToRenderPerformanceJank({
        ...options,
        onSample: setSnapshot,
      }),
    [
      options.historySize,
      options.observeLongAnimationFrames,
      options.targetFrameRate,
      options.thresholds,
      options.updateIntervalMs,
    ],
  );

  return snapshot;
}

function RenderPerformanceRoot(props: RenderPerformanceRootProps): ReactElement {
  const registration = useToolRegistration(renderPerformanceToolId);
  const config = normalizeRenderPerformanceToolConfig(registration?.config);
  const snapshot = useRenderPerformanceJank(config);
  const drawer = useToolbarDrawer();

  const value: RenderPerformanceContextValue = {
    drawerOpen: drawer.isDrawerOpen(renderPerformanceToolId),
    onMetricClick: () => {
      if (drawer.isDrawerOpen(renderPerformanceToolId)) {
        drawer.closeDrawer();
      } else {
        drawer.openDrawer(renderPerformanceToolId);
      }
    },
    snapshot,
  };

  return (
    <RenderPerformanceContext.Provider value={value}>
      {Children.count(props.children) === 0 ? null : (
        <div className="belt-render-performance-toolbar-item">{props.children}</div>
      )}
      <ToolDrawer
        drawerId={renderPerformanceToolId}
        title={<RenderPerformanceDrawerTitle snapshot={snapshot} />}
      >
        <RenderPerformanceDrawerContent snapshot={snapshot} />
      </ToolDrawer>
    </RenderPerformanceContext.Provider>
  );
}

export const RenderPerformance = Object.assign(RenderPerformanceRoot, {
  Inp: RenderPerformanceInpMetric,
  Jank: RenderPerformanceJankMetric,
  LayoutShift: RenderPerformanceLayoutShiftMetric,
}) satisfies RenderPerformanceComponent;

export function RenderPerformanceJankPanel(props: RenderPerformanceJankPanelProps): ReactElement {
  const { className, panelProps, showInduceJankButton = true, ...jankOptions } = props;
  const snapshot = useRenderPerformanceJank(jankOptions);
  const current = snapshot.current;
  const panelClassName = classNames("belt-render-performance", className, panelProps?.className);

  return (
    <Panel {...panelProps} className={panelClassName}>
      <div className="belt-render-performance__panel-body">
        <div className="belt-render-performance__metric-header">
          <div className="belt-render-performance__metric-label-group">
            <span className="belt-text" data-emphasis="subtle" data-size="xs">
              Jank
            </span>
            <span
              className="belt-render-performance__metric-value belt-text"
              data-emphasis="strong"
            >
              {current === undefined ? "--%" : formatJank(current.jank)}
            </span>
          </div>
          <span className="belt-text" data-emphasis="subtle" data-size="xs">
            {current === undefined ? "Collecting" : `${current.fps.toFixed(0)} FPS`}
          </span>
        </div>
        <RenderPerformanceJankFlamegraph history={snapshot.history} />
        <div className="belt-render-performance__footer">
          <span className="belt-text" data-emphasis="subtle" data-size="xs">
            {snapshot.history.length} samples over time
          </span>
          {showInduceJankButton ? (
            <Button onClick={() => blockMainThread(140)} tone="warning">
              Induce jank
            </Button>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

export function RenderPerformanceToolbarItem(
  props: RenderPerformanceToolbarItemProps,
): ReactElement {
  return <RenderPerformanceToolbarMetricItem {...props} metric="jank" />;
}

export function RenderPerformanceToolbarButtonChart(props: {
  readonly current: RenderPerformanceSample | undefined;
  readonly history: readonly RenderPerformanceSample[];
  readonly size: GhostButtonProps["size"];
}): ReactElement {
  return (
    <RenderPerformanceToolbarButtonChartLayout
      chart={<RenderPerformanceJankFlamegraph axis emptySampleCount={0} history={props.history} />}
      label="Jank"
      size={props.size}
      value={props.current === undefined ? "--%" : formatJank(props.current.jank)}
    />
  );
}

export function RenderPerformanceInpToolbarItem(
  props: RenderPerformanceInpToolbarItemProps,
): ReactElement {
  return <RenderPerformanceToolbarMetricItem {...props} metric="inp" />;
}

export function RenderPerformanceInpToolbarButtonChart(props: {
  readonly current: RenderPerformanceSample | undefined;
  readonly history: readonly RenderPerformanceSample[];
  readonly size: GhostButtonProps["size"];
}): ReactElement {
  return (
    <RenderPerformanceToolbarButtonChartLayout
      chart={<RenderPerformanceInpFlamegraph axis emptySampleCount={0} history={props.history} />}
      label="INP"
      size={props.size}
      value={
        props.current === undefined
          ? "--ms"
          : formatMilliseconds(props.current.interactionLatencyMs)
      }
    />
  );
}

export function RenderPerformanceLayoutShiftToolbarItem(
  props: RenderPerformanceLayoutShiftToolbarItemProps,
): ReactElement {
  return <RenderPerformanceToolbarMetricItem {...props} metric="layout-shift" />;
}

function RenderPerformanceJankMetric(props: RenderPerformanceMetricProps): ReactElement {
  return <RenderPerformanceToolbarMetricTrigger {...props} metric="jank" />;
}

function RenderPerformanceInpMetric(props: RenderPerformanceMetricProps): ReactElement {
  return <RenderPerformanceToolbarMetricTrigger {...props} metric="inp" />;
}

function RenderPerformanceLayoutShiftMetric(props: RenderPerformanceMetricProps): ReactElement {
  return <RenderPerformanceToolbarMetricTrigger {...props} metric="layoutShift" />;
}

function RenderPerformanceToolbarMetricTrigger(
  props: RenderPerformanceMetricProps & {
    readonly metric: RenderPerformanceMetricId;
  },
): ReactElement {
  const context = useRenderPerformanceContext();
  const current = context.snapshot.current;
  const history = context.snapshot.history.slice(-renderPerformanceToolbarSampleSize);
  const ariaLabel =
    props.metric === "jank"
      ? `Render performance, jank ${current === undefined ? "collecting" : formatJank(current.jank)}`
      : props.metric === "inp"
        ? `Render performance, INP ${
            current === undefined ? "collecting" : formatMilliseconds(current.interactionLatencyMs)
          }`
        : `Render performance, layout shift ${formatLayoutShift(context.snapshot.layoutShiftSession.value)}`;

  return (
    <GhostButton
      aria-expanded={context.drawerOpen}
      aria-label={ariaLabel}
      className={props.className}
      onClick={context.onMetricClick}
      radius="none"
      size="compact"
      tone="neutral"
    >
      {props.metric === "jank" ? (
        <RenderPerformanceToolbarButtonChart current={current} history={history} size="compact" />
      ) : props.metric === "inp" ? (
        <RenderPerformanceInpToolbarButtonChart
          current={current}
          history={history}
          size="compact"
        />
      ) : (
        <RenderPerformanceLayoutShiftToolbarButtonChart
          history={history}
          layoutShiftSession={context.snapshot.layoutShiftSession}
          size="compact"
        />
      )}
    </GhostButton>
  );
}

function useRenderPerformanceContext(): RenderPerformanceContextValue {
  const context = useContext(RenderPerformanceContext);

  if (context === undefined) {
    throw new Error(
      "RenderPerformance metric components must be rendered inside RenderPerformance.",
    );
  }

  return context;
}

function RenderPerformanceToolbarMetricItem(
  props: RenderPerformanceToolbarItemProps & {
    readonly metric: "jank" | "inp" | "layout-shift";
  },
): ReactElement {
  const {
    historySize = 60,
    metric,
    observeLongAnimationFrames,
    onClick,
    targetFrameRate,
    thresholds,
    updateIntervalMs,
    size = "default",
    ...buttonProps
  } = props;
  const jankOptions: RenderPerformanceJankOptions = {
    historySize,
    ...(observeLongAnimationFrames !== undefined ? { observeLongAnimationFrames } : {}),
    ...(targetFrameRate !== undefined ? { targetFrameRate } : {}),
    ...(thresholds !== undefined ? { thresholds } : {}),
    ...(updateIntervalMs !== undefined ? { updateIntervalMs } : {}),
  };

  const snapshot = useRenderPerformanceJank(jankOptions);
  const current = snapshot.current;
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [drawerOpen]);

  const history = snapshot.history.slice(-renderPerformanceToolbarSampleSize);
  const ariaLabel =
    metric === "jank"
      ? `Render performance, jank ${current === undefined ? "collecting" : formatJank(current.jank)}`
      : metric === "inp"
        ? `Render performance, INP ${
            current === undefined ? "collecting" : formatMilliseconds(current.interactionLatencyMs)
          }`
        : `Render performance, layout shift ${formatLayoutShift(snapshot.layoutShiftSession.value)}`;

  return (
    <div className="belt-render-performance-toolbar-item">
      <GhostButton
        {...buttonProps}
        aria-expanded={drawerOpen}
        aria-label={ariaLabel}
        onClick={(event) => {
          onClick?.(event);
          setDrawerOpen((open) => !open);
        }}
        size={size}
        tone="neutral"
      >
        {metric === "jank" ? (
          <RenderPerformanceToolbarButtonChart current={current} history={history} size={size} />
        ) : metric === "inp" ? (
          <RenderPerformanceInpToolbarButtonChart current={current} history={history} size={size} />
        ) : (
          <RenderPerformanceLayoutShiftToolbarButtonChart
            history={history}
            layoutShiftSession={snapshot.layoutShiftSession}
            size={size}
          />
        )}
      </GhostButton>
      {drawerOpen ? (
        <RenderPerformanceDrawer onClose={() => setDrawerOpen(false)} snapshot={snapshot} />
      ) : null}
    </div>
  );
}

export function RenderPerformanceLayoutShiftToolbarButtonChart(props: {
  readonly history: readonly RenderPerformanceSample[];
  readonly layoutShiftSession: LayoutShiftSessionSummary;
  readonly size: GhostButtonProps["size"];
}): ReactElement {
  return (
    <RenderPerformanceToolbarButtonChartLayout
      chart={
        <RenderPerformanceLayoutShiftEventStrip axis emptySampleCount={0} history={props.history} />
      }
      label="CLS"
      size={props.size}
      value={formatLayoutShift(props.layoutShiftSession.value)}
    />
  );
}

function RenderPerformanceToolbarButtonChartLayout(props: {
  readonly chart: ReactElement;
  readonly label: string;
  readonly size: GhostButtonProps["size"];
  readonly value: string;
}): ReactElement {
  return (
    <span className="belt-render-performance-toolbar-chart" data-size={props.size}>
      <span className="belt-render-performance-toolbar-chart__graph">{props.chart}</span>
      <span className="belt-render-performance-toolbar-chart__label belt-text" data-size="xs">
        {props.label}
      </span>
      <span className="belt-render-performance-toolbar-chart__value belt-text" data-size="xs">
        {props.value}
      </span>
    </span>
  );
}

export function RenderPerformanceDrawer(props: {
  readonly onClose: () => void;
  readonly snapshot: RenderPerformanceSnapshot;
}): ReactElement {
  return (
    <div
      aria-label="Render performance details"
      className="belt-render-performance-drawer"
      role="dialog"
    >
      <div className="belt-render-performance-drawer__panel">
        <div className="belt-render-performance-drawer__body">
          <div className="belt-render-performance-drawer__header">
            <RenderPerformanceDrawerTitle snapshot={props.snapshot} />
            <Button icon="close" onClick={props.onClose} title="Close" />
          </div>
          <RenderPerformanceDrawerContent snapshot={props.snapshot} />
        </div>
      </div>
    </div>
  );
}

function RenderPerformanceDrawerTitle(props: {
  readonly snapshot: RenderPerformanceSnapshot;
}): ReactElement {
  return (
    <div className="belt-render-performance__metric-label-group">
      <span className="belt-text" data-emphasis="strong" data-weight="semibold">
        Render performance
      </span>
      <span className="belt-text" data-emphasis="subtle" data-size="xs">
        {props.snapshot.current === undefined
          ? "Collecting samples"
          : `${props.snapshot.history.length} samples`}
      </span>
    </div>
  );
}

function RenderPerformanceDrawerContent(props: {
  readonly snapshot: RenderPerformanceSnapshot;
}): ReactElement {
  const current = props.snapshot.current;
  const layoutShiftSession = props.snapshot.layoutShiftSession;

  return (
    <Fragment>
      <Panel elevation={1}>
        <div className="belt-render-performance__panel-body">
          <div className="belt-render-performance__metric-header">
            <div className="belt-render-performance__metric-label-group">
              <span className="belt-text" data-emphasis="subtle" data-size="xs">
                Jank
              </span>
              <span
                className="belt-render-performance__metric-value belt-text"
                data-emphasis="strong"
              >
                {current === undefined ? "--%" : formatJank(current.jank)}
              </span>
            </div>
            <span className="belt-text" data-emphasis="subtle" data-size="xs">
              {current === undefined ? "Collecting" : `${current.fps.toFixed(0)} FPS`}
            </span>
          </div>
          <RenderPerformanceJankFlamegraph history={props.snapshot.history} />
          <div className="belt-render-performance__footer">
            <span className="belt-text" data-emphasis="subtle" data-size="xs">
              {props.snapshot.history.length} samples over time
            </span>
            <Button onClick={() => blockMainThread(140)} tone="warning">
              Induce jank
            </Button>
          </div>
        </div>
      </Panel>
      <div className="belt-render-performance__detail-grid">
        <RenderPerformanceMetric
          label="FPS"
          value={current === undefined ? "--" : current.fps.toFixed(0)}
        />
        <RenderPerformanceMetric
          label="Janky frames"
          value={current === undefined ? "--" : String(current.jankFrameCount)}
        />
        <RenderPerformanceMetric
          label="INP"
          value={current === undefined ? "--" : formatMilliseconds(current.interactionLatencyMs)}
        />
        <RenderPerformanceMetric label="CLS" value={formatLayoutShift(layoutShiftSession.value)} />
        <RenderPerformanceMetric label="Shifts" value={String(layoutShiftSession.count)} />
        <RenderPerformanceMetric
          label="Frame budget"
          value={current === undefined ? "--" : `${current.frameBudgetMs.toFixed(1)}ms`}
        />
        <RenderPerformanceMetric
          label="Window"
          value={current === undefined ? "--" : `${Math.round(current.durationMs)}ms`}
        />
      </div>
    </Fragment>
  );
}

function RenderPerformanceMetric(props: {
  readonly label: string;
  readonly value: string;
}): ReactElement {
  return (
    <div className="belt-render-performance__detail-metric">
      <span className="belt-text" data-emphasis="subtle" data-size="xs">
        {props.label}
      </span>
      <span className="belt-text" data-emphasis="strong" data-weight="semibold">
        {props.value}
      </span>
    </div>
  );
}

export function RenderPerformanceJankFlamegraph(props: {
  readonly axis?: boolean;
  readonly emptySampleCount?: number;
  readonly history: readonly RenderPerformanceSample[];
}): ReactElement {
  const visibleSamples =
    props.history.length === 0
      ? Array.from({ length: props.emptySampleCount ?? 24 }, () => undefined)
      : props.history;

  return (
    <div
      aria-label="Jank samples over time"
      className="belt-render-performance-chart"
      data-axis={props.axis ? "true" : undefined}
      role="img"
    >
      {props.axis ? <span aria-hidden className="belt-render-performance-chart__axis" /> : null}
      {visibleSamples.map((sample, index) => (
        <span
          aria-label={
            sample === undefined ? "No jank sample yet" : `Jank ${formatJank(sample.jank)}`
          }
          className="belt-render-performance-chart-bar"
          data-height={chartHeightBucket(Math.max(8, Math.min(100, sample?.jank ?? 4)))}
          data-severity={sample?.severity ?? "empty"}
          key={`${sample?.startTime ?? "empty"}-${index}`}
          title={sample === undefined ? "Collecting" : `Jank ${formatJank(sample.jank)}`}
        />
      ))}
    </div>
  );
}

export function RenderPerformanceInpFlamegraph(props: {
  readonly axis?: boolean;
  readonly emptySampleCount?: number;
  readonly history: readonly RenderPerformanceSample[];
  readonly thresholds?: InteractionLatencyThresholds;
}): ReactElement {
  const thresholds = props.thresholds ?? defaultInteractionLatencyThresholds;
  const visibleSamples =
    props.history.length === 0
      ? Array.from({ length: props.emptySampleCount ?? 24 }, () => undefined)
      : props.history;

  return (
    <div
      aria-label="INP samples over time"
      className="belt-render-performance-chart"
      data-axis={props.axis ? "true" : undefined}
      role="img"
    >
      {props.axis ? <span aria-hidden className="belt-render-performance-chart__axis" /> : null}
      {visibleSamples.map((sample, index) => {
        const severity =
          sample === undefined
            ? "empty"
            : getInteractionLatencySeverity(sample.interactionLatencyMs, thresholds);
        const heightPercent =
          sample === undefined
            ? 4
            : Math.min(100, (sample.interactionLatencyMs / thresholds.danger) * 100);

        return (
          <span
            aria-label={
              sample === undefined
                ? "No INP sample yet"
                : `INP ${formatMilliseconds(sample.interactionLatencyMs)}`
            }
            className="belt-render-performance-chart-bar"
            data-height={chartHeightBucket(Math.max(8, heightPercent))}
            data-severity={severity}
            key={`${sample?.startTime ?? "empty"}-${index}`}
            title={
              sample === undefined
                ? "Collecting"
                : `INP ${formatMilliseconds(sample.interactionLatencyMs)}`
            }
          />
        );
      })}
    </div>
  );
}

export function RenderPerformanceLayoutShiftEventStrip(props: {
  readonly axis?: boolean;
  readonly emptySampleCount?: number;
  readonly history: readonly RenderPerformanceSample[];
  readonly thresholds?: LayoutShiftThresholds;
}): ReactElement {
  const thresholds = props.thresholds ?? defaultLayoutShiftThresholds;
  const visibleSamples =
    props.history.length === 0
      ? Array.from({ length: props.emptySampleCount ?? 24 }, () => undefined)
      : props.history;

  return (
    <div
      aria-label="Layout shift events over time"
      className="belt-render-performance-chart"
      data-axis={props.axis ? "true" : undefined}
      role="img"
    >
      {props.axis ? <span aria-hidden className="belt-render-performance-chart__axis" /> : null}
      {visibleSamples.map((sample, index) => {
        const layoutShift = sample?.layoutShift ?? 0;
        const hasShift = layoutShift > 0;
        const severity = getLayoutShiftSeverity(layoutShift, thresholds);
        const heightPercent = hasShift ? Math.min(100, (layoutShift / thresholds.danger) * 100) : 0;

        return (
          <span
            aria-label={
              sample === undefined
                ? "No layout shift sample yet"
                : `Layout shift ${formatLayoutShift(layoutShift)}`
            }
            className="belt-render-performance-chart-bar"
            data-height={chartHeightBucket(hasShift ? Math.max(8, heightPercent) : 0)}
            data-severity={sample === undefined ? "empty" : hasShift ? severity : "none"}
            key={`${sample?.startTime ?? "empty"}-${index}`}
            title={
              sample === undefined ? "Collecting" : `Layout shift ${formatLayoutShift(layoutShift)}`
            }
          />
        );
      })}
    </div>
  );
}

export function calculateRenderPerformanceSample(options: {
  readonly endTime: number;
  readonly frameDurationsMs?: readonly number[];
  readonly frameCount: number;
  readonly interactions?: readonly InteractionLatencySummary[];
  readonly layoutShifts?: readonly LayoutShiftSummary[];
  readonly longAnimationFrames?: readonly LongAnimationFrameSummary[];
  readonly startTime: number;
  readonly targetFrameRate?: number;
  readonly thresholds?: JankThresholds;
}): RenderPerformanceSample {
  const targetFrameRate = options.targetFrameRate ?? 60;
  const thresholds = options.thresholds ?? defaultJankThresholds;
  const durationMs = Math.max(0, options.endTime - options.startTime);
  const frameDurationsMs = options.frameDurationsMs ?? [];
  const frameBudgetMs = calculateFrameBudgetMs(frameDurationsMs, targetFrameRate);
  const frameCount = Math.max(0, Math.floor(options.frameCount));
  const longAnimationFrames = (options.longAnimationFrames ?? []).filter(
    (frame) => frame.startTime >= options.startTime && frame.startTime < options.endTime,
  );
  const source =
    longAnimationFrames.length > 0 ? "long-animation-frame" : "request-animation-frame";
  const overBudgetFrames =
    longAnimationFrames.length > 0
      ? longAnimationFrames.map((frame) => frame.duration)
      : frameDurationsMs.filter((frameDurationMs) =>
          isJankyFrameDuration(frameDurationMs, frameBudgetMs),
        );
  const jankTimeMs = overBudgetFrames.reduce(
    (total, frameDurationMs) => total + Math.max(0, frameDurationMs - frameBudgetMs),
    0,
  );
  const jank = durationMs === 0 ? 0 : Math.min(100, (jankTimeMs / durationMs) * 100);
  const fps = durationMs === 0 ? 0 : (frameCount * 1000) / durationMs;
  const expectedFrameCount = Math.max(1, Math.round(durationMs / frameBudgetMs));
  const jankFrameCount = overBudgetFrames.length;
  const interactions = filterEntriesInWindow(options.interactions ?? [], options);
  const interactionLatencyMs = calculateInteractionLatencyMs(interactions);
  const layoutShifts = filterEntriesInWindow(options.layoutShifts ?? [], options).filter(
    (entry) => !entry.hadRecentInput,
  );
  const layoutShift = layoutShifts.reduce((total, entry) => total + entry.value, 0);

  return {
    droppedFrameCount: jankFrameCount,
    durationMs,
    endTime: options.endTime,
    expectedFrameCount,
    fps,
    frameBudgetMs,
    frameCount,
    interactionCount: interactions.length,
    interactionLatencyMs,
    jank,
    jankFrameCount,
    jankTimeMs,
    layoutShift,
    layoutShiftCount: layoutShifts.length,
    severity: getJankSeverity(jank, thresholds),
    source,
    startTime: options.startTime,
  };
}

export function appendRenderPerformanceSample(
  history: readonly RenderPerformanceSample[],
  sample: RenderPerformanceSample,
  historySize: number,
): readonly RenderPerformanceSample[] {
  return [...history, sample].slice(-Math.max(1, Math.floor(historySize)));
}

export function getJankSeverity(
  jank: number,
  thresholds: JankThresholds = defaultJankThresholds,
): JankSeverity {
  if (jank >= thresholds.danger) return "danger";
  if (jank >= thresholds.warning) return "warning";
  return "normal";
}

export function getInteractionLatencySeverity(
  interactionLatencyMs: number,
  thresholds: InteractionLatencyThresholds = defaultInteractionLatencyThresholds,
): JankSeverity {
  if (interactionLatencyMs >= thresholds.danger) return "danger";
  if (interactionLatencyMs >= thresholds.warning) return "warning";
  return "normal";
}

export function getLayoutShiftSeverity(
  layoutShift: number,
  thresholds: LayoutShiftThresholds = defaultLayoutShiftThresholds,
): JankSeverity {
  if (layoutShift >= thresholds.danger) return "danger";
  if (layoutShift >= thresholds.warning) return "warning";
  return "normal";
}

export function calculateLayoutShiftSession(
  layoutShifts: readonly LayoutShiftSummary[],
): LayoutShiftSessionSummary {
  const unexpectedLayoutShifts = layoutShifts
    .filter((entry) => !entry.hadRecentInput)
    .toSorted((left, right) => left.startTime - right.startTime);

  if (unexpectedLayoutShifts.length === 0) {
    return emptyLayoutShiftSession;
  }

  let currentWindowStartTime = unexpectedLayoutShifts[0]?.startTime ?? 0;
  let currentWindowLastShiftTime = currentWindowStartTime;
  let currentWindowValue = 0;
  let maxWindowValue = 0;
  let totalValue = 0;
  let lastShiftTime: number | undefined;
  let lastShiftValue = 0;

  for (const layoutShift of unexpectedLayoutShifts) {
    const startsNewSessionWindow =
      layoutShift.startTime - currentWindowLastShiftTime > 1000 ||
      layoutShift.startTime - currentWindowStartTime > 5000;

    if (startsNewSessionWindow) {
      currentWindowStartTime = layoutShift.startTime;
      currentWindowValue = 0;
    }

    currentWindowLastShiftTime = layoutShift.startTime;
    currentWindowValue += layoutShift.value;
    maxWindowValue = Math.max(maxWindowValue, currentWindowValue);
    totalValue += layoutShift.value;
    lastShiftTime = layoutShift.startTime;
    lastShiftValue = layoutShift.value;
  }

  return {
    count: unexpectedLayoutShifts.length,
    lastShiftTime,
    lastShiftValue,
    totalValue,
    value: maxWindowValue,
  };
}

function calculateFrameBudgetMs(
  frameDurationsMs: readonly number[],
  targetFrameRate: number,
): number {
  const targetFrameBudgetMs = 1000 / Math.max(1, targetFrameRate);
  const candidateDurations = frameDurationsMs
    .filter((durationMs) => durationMs > 0 && durationMs <= longFrameThresholdMs)
    .toSorted((left, right) => left - right);

  if (candidateDurations.length < 3) {
    return targetFrameBudgetMs;
  }

  const percentileIndex = Math.floor((candidateDurations.length - 1) * 0.2);
  return Math.max(1, candidateDurations[percentileIndex] ?? targetFrameBudgetMs);
}

function isJankyFrameDuration(frameDurationMs: number, frameBudgetMs: number): boolean {
  return frameDurationMs > Math.max(longFrameThresholdMs, frameBudgetMs * 2);
}

function supportsLongAnimationFrameObserver(): boolean {
  return (
    typeof PerformanceObserver !== "undefined" &&
    PerformanceObserver.supportedEntryTypes.includes("long-animation-frame")
  );
}

function supportsEventObserver(): boolean {
  return (
    typeof PerformanceObserver !== "undefined" &&
    PerformanceObserver.supportedEntryTypes.includes("event")
  );
}

function supportsLayoutShiftObserver(): boolean {
  return (
    typeof PerformanceObserver !== "undefined" &&
    PerformanceObserver.supportedEntryTypes.includes("layout-shift")
  );
}

function filterEntriesInWindow<TEntry extends { readonly startTime: number }>(
  entries: readonly TEntry[],
  window: { readonly endTime: number; readonly startTime: number },
): readonly TEntry[] {
  return entries.filter(
    (entry) => entry.startTime >= window.startTime && entry.startTime < window.endTime,
  );
}

function calculateInteractionLatencyMs(interactions: readonly InteractionLatencySummary[]): number {
  const interactionGroups = new Map<number, number>();
  let maxLatencyMs = 0;

  for (const interaction of interactions) {
    if (interaction.interactionId === 0) {
      maxLatencyMs = Math.max(maxLatencyMs, interaction.duration);
      continue;
    }

    interactionGroups.set(
      interaction.interactionId,
      Math.max(interactionGroups.get(interaction.interactionId) ?? 0, interaction.duration),
    );
  }

  for (const latencyMs of interactionGroups.values()) {
    maxLatencyMs = Math.max(maxLatencyMs, latencyMs);
  }

  return maxLatencyMs;
}

function toInteractionLatencySummary(entry: PerformanceEntry): InteractionLatencySummary {
  const eventEntry = entry as PerformanceEntry & {
    readonly interactionId?: number;
  };

  return {
    duration: entry.duration,
    entry,
    interactionId: eventEntry.interactionId ?? 0,
    name: entry.name,
    startTime: entry.startTime,
  };
}

function toLayoutShiftSummary(entry: PerformanceEntry): LayoutShiftSummary {
  const layoutShiftEntry = entry as PerformanceEntry & {
    readonly hadRecentInput?: boolean;
    readonly value?: number;
  };

  return {
    entry,
    hadRecentInput: layoutShiftEntry.hadRecentInput ?? false,
    startTime: entry.startTime,
    value: layoutShiftEntry.value ?? 0,
  };
}

function logLongAnimationFrame(frame: LongAnimationFrameSummary): void {
  console.debug("Long animation frame:", frame);
}

function formatJank(jank: number): string {
  return `${Math.round(jank)}%`;
}

function formatMilliseconds(durationMs: number): string {
  return `${Math.round(durationMs)}ms`;
}

function formatLayoutShift(layoutShift: number): string {
  return layoutShift.toFixed(3);
}

function blockMainThread(durationMs: number): void {
  const end = performance.now() + durationMs;

  while (performance.now() < end) {
    // Intentionally block so the preview can demonstrate a jank spike.
  }
}

function chartHeightBucket(height: number): string {
  const clampedHeight = Math.max(0, Math.min(100, height));
  return String(Math.round(clampedHeight / 4) * 4);
}

function classNames(...classes: readonly (string | undefined)[]): string | undefined {
  const className = classes.filter(Boolean).join(" ");
  return className.length === 0 ? undefined : className;
}
