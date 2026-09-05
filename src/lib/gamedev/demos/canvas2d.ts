/**
 * A plain 2D canvas, sized and themed, for the 2D module's scenes.
 *
 * This lives in its own file rather than in `ui.ts` on purpose. The 2D curriculum's reason for
 * choosing canvas over a rendering library is to keep the 500 KB Three.js chunk out of a beginner
 * track, and `ui.ts` imports Three at module scope - so a 2D scene reaching into `ui.ts` for a
 * canvas would defeat the point. The labelled controls in `ui.ts` are safe to share, because they
 * are plain DOM; only the drawing helpers there touch Three.
 *
 * Everything is measured in **CSS pixels**. The backing store is scaled for the device pixel ratio
 * once, here, so a scene can draw at `width` by `height` and still be sharp on a high-DPI screen.
 */

const DARK_BG = "#0d1117";
const LIGHT_BG = "#f8f9fa";

/**
 * The drawing space every 2D scene lays itself out in, whatever the screen is.
 *
 * This used to be the container's measured width, which quietly broke every scene on a phone. Some
 * of them position things against a fixed view - `axes-shared.ts` declares a 620 by 340 canvas and
 * maps world units into it - and others use a fixed pixels-per-unit. Hand either of those a 540
 * pixel canvas and the layout is unchanged while the canvas is smaller, so the right-hand side is
 * simply not drawn and the labels crowd into each other.
 *
 * So the drawing space is now **constant** and the canvas is scaled by CSS to fit its container.
 * Geometry is identical at every width, nothing can fall off an edge, and text shrinks with the
 * picture rather than growing relative to it. A scene never has to think about screen size.
 */
export const REFERENCE_WIDTH = 620;

export type Canvas2D = {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  /** In CSS pixels, which is what every drawing call below should use. */
  width: number;
  height: number;
  isDark: boolean;
  /** Paint the background over everything. Call at the top of each redraw. */
  clear: () => void;
};

export function makeCanvas2D(el: HTMLElement, height = 300): Canvas2D {
  const width = REFERENCE_WIDTH;
  const isDark = document.documentElement.dataset.theme !== "light";

  const canvas = document.createElement("canvas");
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.display = "block";
  /* Ask for the full drawing width but never insist on it. `height: auto` is what makes a narrow
     container scale the picture down instead of squashing it: with a fixed pixel height and a
     capped width, the same drawing was being crushed horizontally. The backing store is twice
     the size on a high-DPI screen, which covers the sharpness lost when CSS scales it down. */
  canvas.style.width = `${width}px`;
  canvas.style.maxWidth = "100%";
  canvas.style.height = "auto";
  el.appendChild(canvas);

  const ctx = canvas.getContext("2d")!;
  // One scale, applied once, so the rest of the scene never thinks about pixel ratio again.
  ctx.scale(ratio, ratio);

  const background = isDark ? DARK_BG : LIGHT_BG;
  return {
    ctx,
    canvas,
    width,
    height,
    isDark,
    clear: () => {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
    },
  };
}

/** A filled circle. The 2D module's workhorse, so it is worth not retyping. */
export function dot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/** A line, optionally dashed. Dashes are reset afterwards so callers cannot leak state. */
export function line(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color: string,
  opts: { dashed?: boolean; width?: number } = {},
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = opts.width ?? 1.5;
  if (opts.dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

/** A line with an arrowhead, for drawing a direction rather than a connection. */
export function arrow(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color: string,
  width = 1.8,
): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 0.5) return;
  const head = Math.min(9, length * 0.35);
  const ux = dx / length;
  const uy = dy / length;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - ux * head - uy * head * 0.45,
    to.y - uy * head + ux * head * 0.45,
  );
  ctx.lineTo(
    to.x - ux * head + uy * head * 0.45,
    to.y - uy * head - ux * head * 0.45,
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Small text, for labelling a point or an axis inside the picture. */
export function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  align: CanvasTextAlign = "left",
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * Make some points on the canvas draggable with a pointer.
 *
 * `handles` is asked for the current screen positions each time a drag starts, so the caller never
 * has to keep them in sync. `onDrag` receives the index of whatever was grabbed and the new position
 * in CSS pixels.
 *
 * **This is not an accessible control on its own.** A pointer drag cannot be done by keyboard, so
 * every scene using this must also expose the same values through sliders - which is why the drag is
 * a convenience layered on top rather than the only way in.
 */
export function addDragTargets(
  canvas: HTMLCanvasElement,
  handles: () => Array<{ x: number; y: number }>,
  onDrag: (index: number, x: number, y: number) => void,
  grabRadius = 16,
): () => void {
  let held: number | null = null;

  /**
   * Pointer position in the scene's **drawing space**, not in displayed pixels.
   *
   * The two are the same only at full width. Once CSS scales the canvas down to fit a phone, a
   * pointer at the right-hand edge reports about 380 where the scene is thinking in 620, so a drag
   * would land short of the finger by the ratio between them. Dividing by that ratio is the whole
   * correction, and it is a no-op on a desktop.
   */
  /** How many drawing-space pixels one displayed pixel is worth. 1 at full width. */
  const drawingScale = () => {
    const box = canvas.getBoundingClientRect();
    const drawn = parseFloat(canvas.style.width) || box.width;
    return box.width > 0 ? drawn / box.width : 1;
  };

  const positionOf = (event: PointerEvent) => {
    const box = canvas.getBoundingClientRect();
    const k = drawingScale();
    return {
      x: (event.clientX - box.left) * k,
      y: (event.clientY - box.top) * k,
    };
  };

  const down = (event: PointerEvent) => {
    const at = positionOf(event);
    let best: number | null = null;
    /* Scaled with the canvas so the grab target stays the same size under a finger. Left in
       drawing-space units it would shrink on exactly the devices with the least precise pointer. */
    let bestDistance = grabRadius * drawingScale();
    handles().forEach((h, i) => {
      const d = Math.hypot(h.x - at.x, h.y - at.y);
      if (d <= bestDistance) {
        bestDistance = d;
        best = i;
      }
    });
    if (best === null) return;
    held = best;
    canvas.setPointerCapture(event.pointerId);
    onDrag(held, at.x, at.y);
  };

  const move = (event: PointerEvent) => {
    if (held === null) return;
    event.preventDefault();
    const at = positionOf(event);
    onDrag(held, at.x, at.y);
  };

  const up = () => {
    held = null;
  };

  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);

  return () => {
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", up);
    canvas.removeEventListener("pointercancel", up);
  };
}
