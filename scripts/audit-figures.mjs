/**
 * Figure auditor (throwaway dev tool).
 * For every inline <svg> in the built HTML under a directory, it:
 *   - estimates a bounding box for each <text>
 *   - samples every stroked shape (line, polyline, polygon, path, circle, ellipse, rect)
 *   - reports text boxes crossed by a stroke, text boxes that overlap or nearly
 *     overlap another text box, and anything clipped by the viewBox
 *
 * Known limitation: it does not model occlusion. A graph diagram that draws
 * edges first and then paints filled node circles over them renders correctly,
 * but the edge still counts as passing through the node's label. Trimming links
 * back to the node boundary silences this and is the better fix anyway.
 *
 * Usage: node scripts/audit-figures.mjs dist/statistics [padding]
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] || "dist/statistics";
const PAD = process.argv[3] ? parseFloat(process.argv[3]) : 3;

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    statSync(p).isDirectory()
      ? walk(p, out)
      : e.endsWith(".html") && out.push(p);
  }
  return out;
}

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`));
  return m ? m[1] : null;
};
const num = (tag, name, dflt = 0) => {
  const v = parseFloat(attr(tag, name));
  return Number.isFinite(v) ? v : dflt;
};

// Rough advance widths. Wide enough to be conservative for serif faces.
const WIDE = new Set("mwMW@%".split(""));
const NARROW = new Set("iljtfr.,:;'|! ".split(""));
function textWidth(s, fs, bold) {
  let u = 0;
  for (const ch of s) u += WIDE.has(ch) ? 0.86 : NARROW.has(ch) ? 0.31 : 0.55;
  return u * fs * (bold ? 1.07 : 1);
}

function decode(s) {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x?[0-9A-Fa-f]+;/g, "x")
    .replace(/&[a-z]+;/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}

function textBox(tag, inner) {
  const label = decode(inner);
  const fs = num(tag, "font-size", 12);
  const bold = /font-weight\s*=\s*"(bold|[6-9]00)"/.test(tag);
  const wid = textWidth(label, fs, bold);
  const x = num(tag, "x");
  const y = num(tag, "y");
  const anchor = attr(tag, "text-anchor") || "start";
  const x0 = anchor === "middle" ? x - wid / 2 : anchor === "end" ? x - wid : x;
  return { label, x0, x1: x0 + wid, y0: y - fs * 0.78, y1: y + fs * 0.24, fs };
}

function samplePoints(svg) {
  const pts = [];
  const push = (x, y, kind) => {
    if (Number.isFinite(x) && Number.isFinite(y)) pts.push({ x, y, kind });
  };
  const seg = (x1, y1, x2, y2, kind) => {
    const n = Math.max(2, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 2));
    for (let i = 0; i <= n; i++)
      push(x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n, kind);
  };

  for (const m of svg.matchAll(/<line\b([^>]*?)\/?>/g))
    seg(
      num(m[1], "x1"),
      num(m[1], "y1"),
      num(m[1], "x2"),
      num(m[1], "y2"),
      "line",
    );

  for (const m of svg.matchAll(/<(polyline|polygon)\b([^>]*?)\/?>/g)) {
    const raw = attr(m[2], "points");
    if (!raw) continue;
    const nums = raw
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .filter(Number.isFinite);
    const list = [];
    for (let i = 0; i + 1 < nums.length; i += 2)
      list.push([nums[i], nums[i + 1]]);
    const closed = m[1] === "polygon";
    for (let i = 0; i + 1 < list.length; i++)
      seg(list[i][0], list[i][1], list[i + 1][0], list[i + 1][1], m[1]);
    if (closed && list.length > 2) {
      const a = list[list.length - 1],
        b = list[0];
      seg(a[0], a[1], b[0], b[1], m[1]);
    }
  }

  for (const m of svg.matchAll(/<path\b([^>]*?)\/?>/g)) {
    const d = attr(m[1], "d");
    if (!d) continue;
    // Absolute-command approximation: walk every coordinate pair in order.
    const nums = d.match(/-?\d*\.?\d+(?:e-?\d+)?/g);
    if (!nums) continue;
    const v = nums.map(Number);
    const list = [];
    for (let i = 0; i + 1 < v.length; i += 2) list.push([v[i], v[i + 1]]);
    for (let i = 0; i + 1 < list.length; i++)
      seg(list[i][0], list[i][1], list[i + 1][0], list[i + 1][1], "path");
  }

  for (const m of svg.matchAll(/<(circle|ellipse)\b([^>]*?)\/?>/g)) {
    const t = m[2];
    const cx = num(t, "cx"),
      cy = num(t, "cy");
    const rx = num(t, "r", num(t, "rx")),
      ry = num(t, "r", num(t, "ry"));
    if (!rx && !ry) continue;
    for (let a = 0; a < 64; a++) {
      const th = (a / 64) * Math.PI * 2;
      push(cx + rx * Math.cos(th), cy + ry * Math.sin(th), m[1]);
    }
    // Filled dots are small; treat their interior as solid too
    if (rx <= 8) push(cx, cy, m[1]);
  }

  for (const m of svg.matchAll(/<rect\b([^>]*?)\/?>/g)) {
    const t = m[1];
    const x = num(t, "x"),
      y = num(t, "y"),
      rw = num(t, "width"),
      rh = num(t, "height");
    if (!rw || !rh) continue;
    seg(x, y, x + rw, y, "rect");
    seg(x, y + rh, x + rw, y + rh, "rect");
    seg(x, y, x, y + rh, "rect");
    seg(x + rw, y, x + rw, y + rh, "rect");
  }
  return pts;
}

function boxes(svg) {
  const out = [];
  for (const m of svg.matchAll(/<text\b([^>]*?)>([\s\S]*?)<\/text>/g)) {
    if (!m[2].trim()) continue;
    out.push(textBox(m[1], m[2]));
  }
  return out;
}

let total = 0,
  flagged = 0;
const seen = new Set();

for (const file of walk(root)) {
  const html = readFileSync(file, "utf8");
  for (const svg of html.match(/<svg[\s\S]*?<\/svg>/g) || []) {
    const open = svg.match(/<svg[^>]*>/)[0];
    const vb = attr(open, "viewBox");
    if (!vb) continue;
    const [vx, vy, vw, vh] = vb
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    // Skip icons and KaTeX glyph sprites. KaTeX emits path-only SVGs, sometimes
    // with enormous viewBoxes and coordinates that overshoot by a pixel, while
    // every hand-authored figure on the site labels its text.
    if (!vw || vw < 150 || vw > 2000) continue;
    if (!/<text\b/.test(svg)) continue;
    const aria = decode(attr(open, "aria-label") || "");
    // De-dup figures reused across pages
    const key = `${vw}x${vh}|${aria.slice(0, 60)}|${svg.length}`;
    if (seen.has(key)) continue;
    seen.add(key);
    total++;

    const texts = boxes(svg);
    const pts = samplePoints(svg);
    const msgs = [];

    // Text crossed by a stroke
    for (const t of texts) {
      const hit = pts.filter(
        (p) => p.x >= t.x0 - 1 && p.x <= t.x1 + 1 && p.y >= t.y0 && p.y <= t.y1,
      );
      if (hit.length) {
        const kinds = [...new Set(hit.map((h) => h.kind))].join("/");
        msgs.push(
          `STROKE THROUGH TEXT "${t.label}" (${kinds}, ${hit.length} pts)`,
        );
      }
    }

    // Text vs text, with padding so near-misses are caught
    for (let i = 0; i < texts.length; i++)
      for (let j = i + 1; j < texts.length; j++) {
        const a = texts[i],
          b = texts[j];
        const dx = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
        const dy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
        if (dx > -PAD && dy > -PAD) {
          const kind = dx > 0 && dy > 0 ? "OVERLAP" : "TIGHT";
          msgs.push(
            `${kind} TEXT "${a.label}" <-> "${b.label}" (gapX ${(-dx).toFixed(1)}, gapY ${(-dy).toFixed(1)})`,
          );
        }
      }

    // Clipping
    for (const t of texts)
      if (
        t.x0 < vx - 1 ||
        t.y0 < vy - 1 ||
        t.x1 > vx + vw + 1 ||
        t.y1 > vy + vh + 1
      )
        msgs.push(
          `CLIPPED TEXT "${t.label}" box=(${t.x0.toFixed(1)},${t.y0.toFixed(1)})-(${t.x1.toFixed(1)},${t.y1.toFixed(1)})`,
        );
    for (const p of pts)
      if (
        p.x < vx - 1 ||
        p.y < vy - 1 ||
        p.x > vx + vw + 1 ||
        p.y > vy + vh + 1
      ) {
        msgs.push(`CLIPPED ${p.kind} at (${p.x.toFixed(1)},${p.y.toFixed(1)})`);
        break;
      }

    if (msgs.length) {
      flagged++;
      console.log(
        `\n=== ${file.replace(root, "").replace(/\\index\.html$/, "")}  [${vw}x${vh}]`,
      );
      console.log(`    ${aria.slice(0, 90)}`);
      for (const m of [...new Set(msgs)]) console.log(`  ${m}`);
    }
  }
}
console.log(
  `\n${total} unique figure(s), ${flagged} flagged. (padding ${PAD})`,
);
