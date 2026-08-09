/**
 * Two coordinate systems that disagree about which way is up, and how to move between them.
 *
 * A canvas puts its origin in the **top-left** and counts Y **downward**, because that is how
 * screens have been scanned since television. Almost every piece of mathematics you will write
 * assumes the opposite: origin at the bottom-left, Y counting upward, the way graph paper works.
 *
 * You cannot make the canvas change its mind, and you should not try to do the maths in the
 * canvas's convention either - every angle, every "up", and every trigonometric identity you know
 * would need a sign flipping somewhere. Do the maths in world units with Y up, and convert once,
 * at the moment you draw. That single conversion is this file.
 */

/** Two numbers. In this module that is all a position or a direction ever is. */
export type Vec2 = { x: number; y: number };

/**
 * A world measured in **units**, drawn into a canvas measured in **pixels**.
 *
 * Storing `unitsAcross` rather than a pixel scale is what makes a game resolution independent. The
 * world is "16 units wide" whatever the canvas is, so the same numbers work on a phone and a
 * monitor, and nothing has to be retuned when the window resizes.
 */
export type View = {
  pixelWidth: number;
  pixelHeight: number;
  /** How much of the world fits across the canvas. The vertical extent follows from the shape. */
  unitsAcross: number;
};

/** How many pixels one world unit is worth. The only number that changes with resolution. */
export function pixelsPerUnit(view: View): number {
  return view.pixelWidth / view.unitsAcross;
}

/** How much world fits vertically. Falls out of the aspect ratio rather than being chosen. */
export function unitsDown(view: View): number {
  return view.pixelHeight / pixelsPerUnit(view);
}

/**
 * World to screen: scale into pixels, then flip Y.
 *
 * $$x_{\text{screen}} = x_{\text{world}} \cdot s \qquad y_{\text{screen}} = h - y_{\text{world}} \cdot s$$
 *
 * The subtraction is the whole conversion. A world Y of zero lands at the bottom of the canvas, and
 * growing world Y walks **up** the screen, which is to say toward smaller screen Y.
 */
export function worldToScreen(p: Vec2, view: View): Vec2 {
  const s = pixelsPerUnit(view);
  return { x: p.x * s, y: view.pixelHeight - p.y * s };
}

/** Screen to world: undo the flip, then undo the scale. Needed for every mouse click. */
export function screenToWorld(p: Vec2, view: View): Vec2 {
  const s = pixelsPerUnit(view);
  return { x: p.x / s, y: (view.pixelHeight - p.y) / s };
}

/**
 * Which way is up, in each convention. Worth having as a constant you can point at.
 *
 * The second one is the source of an enormous amount of confusion. **On a canvas you move something
 * up by subtracting from Y**, so a jump is `y -= speed` and gravity is `y += speed`, both of which
 * read backwards to anyone who has done any physics.
 */
export const WORLD_UP: Vec2 = { x: 0, y: 1 };
export const SCREEN_UP: Vec2 = { x: 0, y: -1 };

/**
 * A direction from an angle, the way trigonometry defines it: counter-clockwise from the +X axis.
 *
 * This is correct in world coordinates and is what the unit circle means. Section 2.2 leans on it.
 */
export function directionFromAngle(radians: number): Vec2 {
  return { x: Math.cos(radians), y: Math.sin(radians) };
}

/**
 * The same rotation, expressed for a canvas.
 *
 * Flipping Y also flips the sense of rotation: **counter-clockwise in the world is clockwise on
 * screen.** So an angle that turns a shape one way in your maths turns it the other way once drawn,
 * and the fix is a single minus sign applied at the drawing step rather than woven through the
 * maths.
 *
 * This is why `ctx.rotate(a)` appears to go the "wrong" way compared to the unit circle. It is not
 * wrong; it is measuring in a system where Y grows downward.
 */
export function worldAngleToScreen(radians: number): number {
  return -radians;
}

/**
 * The fraction of the way across and up the canvas a world point sits at.
 *
 * The point of this is that the fractions do **not** depend on the resolution, while the pixels do.
 * Two canvases of different sizes showing the same world put a point at different pixel coordinates
 * and the same fraction - which is the test of whether a layout is resolution independent.
 */
export function fractionOf(p: Vec2, view: View): Vec2 {
  const screen = worldToScreen(p, view);
  return { x: screen.x / view.pixelWidth, y: screen.y / view.pixelHeight };
}

/**
 * How far a fixed number of **pixels** is, measured in world units, on a given canvas.
 *
 * Handy for showing why "move 5 pixels" is a bug: the same 5 pixels is a different distance in the
 * world on every screen, so a game written that way plays differently at different resolutions.
 */
export function pixelsInUnits(pixels: number, view: View): number {
  return pixels / pixelsPerUnit(view);
}
