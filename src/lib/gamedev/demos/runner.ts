/**
 * The contract between a demo and the DemoPanel that shows it.
 *
 * A demo comes in one of two shapes:
 *
 * - **Visual.** A `visual` mount function draws a scene. The panel shows the scene, then
 *   the source that drew it, and nothing else.
 * - **Values.** A `demo` function is handed a `log` callback and produces a short list of
 *   rows. The panel shows the source, then those rows.
 *
 * Either shape may also carry a `check`: a function run during the build purely to catch
 * mistakes, whose output is never displayed. That is where sweeps over thousands of inputs
 * belong - useful to us, noise to a reader.
 *
 * Everything runs at build time, so the rows on the page are the rows the code produced.
 * There is no button and no `eval`: a demo is a module we wrote and Vite bundled.
 */

export interface LogRow {
  /** The expression as the reader should see it written. */
  expr: string;
  /** The formatted result. */
  value: string;
  /** An optional aside, rendered as a comment. */
  note?: string;
}

export type Log = (expr: string, value?: unknown, note?: string) => void;

export type Demo = (log: Log) => void;

/**
 * A live scene, mounted into an element in the browser.
 *
 * Returns a teardown so the panel can dispose of a WebGL context on client-side
 * navigation. `reduced` is true when the reader has asked for reduced motion, in which
 * case the scene must render a single frame and let interaction drive the rest.
 */
export type MountFn = (
  el: HTMLElement,
  opts: { reduced: boolean },
) => () => void;

export interface DemoEntry {
  /** Shown as the panel heading. Keep it to one short line. */
  title: string;
  /** Values to list under the code. Omit for a visual demo. */
  demo?: Demo;
  /** Source file to display, relative to src/. Defaults to the visual's source. */
  file?: string;
  /**
   * A live scene. Lazily imported so Three.js never enters the build-time module graph
   * and gets its own chunk, fetched only when the panel scrolls into view.
   */
  visual?: () => Promise<{ default: MountFn }>;
  /** Source of the scene, shown under it. */
  visualFile?: string;
  /** One line saying how to drive the scene. Omit when a labelled control says it. */
  hint?: string;
  /**
   * Run at build time and never shown. Use it for exhaustive checks: if it throws, the
   * build fails, and the reader is not asked to read a thousand-row table to benefit.
   */
  check?: Demo;
}

/** A sentinel meaning "this row is a heading, not a value". */
export const HEADING = Symbol("heading");

/**
 * Render a value the way a console would, but deterministically.
 *
 * Determinism matters because this output is committed to the repository. Anything using
 * Math.random or Date.now would churn the diff on every build, so demos must avoid them.
 */
export function formatValue(v: unknown): string {
  if (v === HEADING) return "";
  if (v === undefined) return "undefined";
  if (v === null) return "null";
  if (typeof v === "number") {
    if (Number.isNaN(v)) return "NaN";
    if (!Number.isFinite(v)) return v > 0 ? "Infinity" : "-Infinity";
    return String(v);
  }
  if (typeof v === "string") return v;
  if (typeof v === "boolean" || typeof v === "bigint") return String(v);
  if (Array.isArray(v)) return `[${v.map(formatValue).join(", ")}]`;
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    return `{ ${entries.map(([k, val]) => `${k}: ${formatValue(val)}`).join(", ")} }`;
  }
  return String(v);
}

/**
 * Collect a demo's rows. Throws if the demo throws, deliberately: a broken example should
 * fail the build rather than publish a page documenting its own failure.
 */
export function runDemo(demo: Demo): LogRow[] {
  const rows: LogRow[] = [];
  demo((expr, value, note) => {
    rows.push({ expr, value: formatValue(value), note });
  });
  return rows;
}

/** Run a check for its exceptions only, discarding whatever it logs. */
export function runCheck(check: Demo): void {
  check(() => {});
}

/** Throw unless `ok`. The way a `check` reports a problem. */
export function assert(ok: boolean, message: string): void {
  if (!ok) throw new Error(`demo check failed: ${message}`);
}
