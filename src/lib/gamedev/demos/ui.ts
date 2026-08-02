/**
 * The boring parts of a scene: making a canvas, adding a labelled slider, adding a
 * checkbox, adding a line of text under the picture.
 *
 * These live here so the scene files shown in the lessons stay short and stay about the
 * maths. Every control is a real `<input>` with a visible label, so it works by keyboard.
 */
import * as THREE from "three";

const DARK_BG = 0x0d1117;
const LIGHT_BG = 0xf8f9fa;

/** A sized, theme-aware canvas appended to the panel. */
export function makeCanvas(el: HTMLElement, height = 300) {
  const width = Math.min(el.clientWidth || 620, 620);
  const isDark = document.documentElement.dataset.theme !== "light";
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  el.appendChild(renderer.domElement);
  return {
    renderer,
    width,
    height,
    isDark,
    background: new THREE.Color(isDark ? DARK_BG : LIGHT_BG),
  };
}

/** A labelled slider with a live numeric readout. Returns a getter for its value. */
export function addSlider(
  el: HTMLElement,
  label: string,
  min: number,
  max: number,
  value: number,
  onInput: () => void,
  suffix = "\u00B0",
): () => number {
  const row = document.createElement("div");
  row.className = "demo-row";
  const id = `demo-${label.replace(/\W+/g, "-").toLowerCase()}`;

  const text = document.createElement("label");
  text.textContent = label;
  text.htmlFor = id;

  const input = document.createElement("input");
  input.type = "range";
  input.id = id;
  input.min = String(min);
  input.max = String(max);
  input.step = "1";
  input.value = String(value);

  const out = document.createElement("output");
  const show = () => {
    out.textContent = `${input.value}${suffix}`;
  };
  input.addEventListener("input", () => {
    show();
    onInput();
  });
  show();

  row.append(text, input, out);
  el.appendChild(row);
  return () => parseFloat(input.value);
}

/** A labelled checkbox. Returns a getter for its state. */
export function addCheckbox(
  el: HTMLElement,
  label: string,
  checked: boolean,
  onChange: () => void,
): () => boolean {
  const wrap = document.createElement("label");
  wrap.className = "demo-check";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", onChange);
  const text = document.createElement("span");
  text.textContent = label;
  wrap.append(input, text);
  el.appendChild(wrap);
  return () => input.checked;
}

/** One line of text under the picture. Returns a setter. */
export function addReadout(el: HTMLElement): (text: string) => void {
  const div = document.createElement("div");
  div.className = "demo-readout";
  el.appendChild(div);
  return (text: string) => {
    div.textContent = text;
  };
}

/**
 * A plain push button.
 *
 * Note there is deliberately no "hold these keys" control here. A reader with a mouse has
 * one pointer, so any demo that needs two inputs at once is unusable for most people -
 * which is why the movement demo sweeps a direction with a slider instead.
 */
export function addButton(
  el: HTMLElement,
  label: string,
  onClick: () => void,
): void {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "demo-btn";
  b.textContent = label;
  b.addEventListener("click", onClick);
  el.appendChild(b);
}
