/**
 * Every scene mounts, survives being driven, and complains about nothing.
 *
 * This closes the one gap the build cannot: a scene's arithmetic is checked by `checks.ts`,
 * but whether the Three.js code around it actually runs needs a DOM and a canvas. jsdom
 * plus a stubbed WebGL context is enough - nothing is rendered and nothing is inspected
 * visually, so this proves the scene runs, not that it looks right.
 *
 * It earned its place immediately. `rayplane.scene.ts` shipped with a line that hid itself
 * by handing `setFromPoints` an empty array, which allocates a zero-length buffer that can
 * never be filled again - so the dashed ray silently stopped drawing the moment the reader
 * moved the slider past the first hit. No exception, no console error in the happy path,
 * and invisible to the build. Driving every control found it on the first run.
 */
import { describe, expect, it, vi } from "vitest";
import type { MountFn } from "./runner.ts";

const scenes = import.meta.glob<{ default: MountFn }>("./*.scene.ts");

/** A WebGL context that answers everything harmlessly, so Three.js will initialise. */
function stubWebGl() {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "VERSION") return 0x1f02;
        if (prop === "SHADING_LANGUAGE_VERSION") return 0x8b8c;
        if (prop === "getParameter") {
          return (p: number) => {
            if (p === 0x1f02) return "WebGL 2.0 (stub)";
            if (p === 0x8b8c) return "WebGL GLSL ES 3.00 (stub)";
            return 8192;
          };
        }
        if (prop === "getExtension") return () => null;
        if (prop === "getShaderPrecisionFormat") {
          return () => ({ precision: 23, rangeMin: 127, rangeMax: 127 });
        }
        if (prop === "getContextAttributes") return () => ({});
        if (prop === "getProgramParameter" || prop === "getShaderParameter") {
          return () => true;
        }
        if (prop === "getProgramInfoLog" || prop === "getShaderInfoLog")
          return () => "";
        if (prop === "getActiveUniform")
          return () => ({ name: "u", type: 0, size: 1 });
        if (prop === "getActiveAttrib")
          return () => ({ name: "a", type: 0, size: 1 });
        if (prop === "getAttribLocation") return () => 0;
        if (prop === "getUniformLocation") return () => ({});
        if (typeof prop === "string") return () => ({});
        return undefined;
      },
    },
  );
}

/* The stub has no real draw modes, so Three.js reports one per frame. That is an artifact
   of the stub rather than a problem with a scene, and it is the only message allowed. */
const EXPECTED_NOISE = "THREE.WebGLInfo";

HTMLCanvasElement.prototype.getContext = (() => stubWebGl()) as never;

describe("gamedev scenes", () => {
  it("finds every scene file", () => {
    expect(Object.keys(scenes).length).toBeGreaterThan(30);
  });

  for (const [path, load] of Object.entries(scenes)) {
    const name = path.replace("./", "").replace(".scene.ts", "");

    it(`${name} mounts, redraws under every control, and logs nothing`, async () => {
      const complaints: string[] = [];
      const collect = (...args: unknown[]) => {
        const first = String(args[0] ?? "");
        if (!first.startsWith(EXPECTED_NOISE)) complaints.push(first);
      };
      const errorSpy = vi.spyOn(console, "error").mockImplementation(collect);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(collect);

      const stage = document.createElement("div");
      Object.defineProperty(stage, "clientWidth", { value: 620 });
      document.body.appendChild(stage);

      try {
        const mod = await load();
        const teardown = mod.default(stage, { reduced: false });

        expect(stage.querySelectorAll("canvas").length).toBe(1);

        /* Mounting is the easy half. Most of these bugs only appear on a later redraw, so
           every slider is pushed to both ends and back, and every button is pressed. */
        for (const input of Array.from(stage.querySelectorAll("input"))) {
          if (input.type === "range") {
            for (const value of [input.min, input.max, input.value]) {
              input.value = value;
              input.dispatchEvent(new Event("input", { bubbles: true }));
            }
          } else if (input.type === "checkbox") {
            for (let i = 0; i < 2; i += 1) {
              input.checked = !input.checked;
              input.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }
        }
        for (const button of Array.from(stage.querySelectorAll("button"))) {
          button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        }

        expect(complaints).toEqual([]);
        expect(typeof teardown).toBe("function");
        teardown();
      } finally {
        errorSpy.mockRestore();
        warnSpy.mockRestore();
        stage.remove();
      }
    });
  }
});
