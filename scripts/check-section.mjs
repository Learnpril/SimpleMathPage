/**
 * Section checker (dev tool).
 * For a built section directory it verifies:
 *   - every page renders a quiz where the source declares one (Quiz.astro
 *     renders nothing when validation fails, so a clean build proves nothing)
 *   - quiz structure: 3-20 questions, exactly 4 options, correctIndex in range,
 *     unique question ids, unique quizIds across the section
 *   - Cayley tables are dumped so their arithmetic can be read back
 *
 * Usage: node scripts/check-section.mjs abstract-algebra [--tables]
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const section = process.argv[2] || "abstract-algebra";
const showTables = process.argv.includes("--tables");
const dist = join("dist", section);
const src = join("src", "content", "docs", section);

if (!existsSync(dist)) {
  console.error(`No built output at ${dist}. Run the build first.`);
  process.exit(1);
}

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");

function pages(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...pages(p));
    else if (e === "index.html") out.push(p);
  }
  return out;
}

let problems = 0;
const fail = (m) => {
  problems++;
  console.log(`  ✗ ${m}`);
};

// Which source files declare a quiz?
const srcFiles = existsSync(src)
  ? readdirSync(src).filter((f) => f.endsWith(".mdx"))
  : [];
const declaresQuiz = new Map();
for (const f of srcFiles) {
  const t = readFileSync(join(src, f), "utf8");
  const m = /quizId="([^"]+)"/.exec(t);
  declaresQuiz.set(f.replace(/\.mdx$/, ""), m ? m[1] : null);
}

const seenQuizIds = new Map();
let totalQuestions = 0;
let quizCount = 0;
const tables = [];
let figureCount = 0;

for (const file of pages(dist).sort()) {
  const slug = file.split(/[\\/]/).slice(-2, -1)[0];
  const html = readFileSync(file, "utf8");

  // Figures
  figureCount += (html.match(/<figure class="/g) || []).length;

  // Cayley tables
  for (const t of html.match(/<figure class="cay[\s\S]*?<\/figure>/g) || []) {
    const title =
      /class="cay-title[^>]*>([\s\S]*?)</.exec(t)?.[1] ?? "(untitled)";
    const rows = [...t.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) =>
      [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) =>
        decode(c[1].replace(/<[^>]*>/g, "").trim()),
      ),
    );
    const notes = (/<p class="cay-notes[\s\S]*?<\/p>/.exec(t)?.[0] ?? "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    tables.push({ slug, title: decode(title), rows, notes });
  }

  // Quizzes
  const declared = declaresQuiz.get(slug);
  const hasContainer = html.includes("quiz-container");
  if (declared && !hasContainer) {
    fail(
      `${slug}: source declares quizId "${declared}" but no quiz rendered (validation failed)`,
    );
    continue;
  }
  if (!declared) continue;

  const raw = /data-questions="([^"]*)"/.exec(html);
  if (!raw) {
    fail(`${slug}: quiz container present but no data-questions payload`);
    continue;
  }
  let questions;
  try {
    questions = JSON.parse(decode(raw[1]));
  } catch (e) {
    fail(`${slug}: data-questions is not valid JSON (${e.message})`);
    continue;
  }

  quizCount++;
  totalQuestions += questions.length;

  if (seenQuizIds.has(declared)) {
    fail(
      `${slug}: quizId "${declared}" already used by ${seenQuizIds.get(declared)}`,
    );
  }
  seenQuizIds.set(declared, slug);

  if (questions.length < 3 || questions.length > 20) {
    fail(`${slug}: ${questions.length} questions, must be 3-20`);
  }

  const ids = new Set();
  questions.forEach((q, i) => {
    const at = `${slug} q${i + 1}`;
    if (!q.id) fail(`${at}: missing id`);
    else if (ids.has(q.id)) fail(`${at}: duplicate id "${q.id}"`);
    else ids.add(q.id);

    if (!Array.isArray(q.options) || q.options.length !== 4)
      fail(`${at}: ${q.options?.length ?? 0} options, must be exactly 4`);
    if (new Set(q.options).size !== q.options?.length)
      fail(`${at}: duplicate option text`);
    if (
      !Number.isInteger(q.correctIndex) ||
      q.correctIndex < 0 ||
      q.correctIndex > 3
    )
      fail(`${at}: correctIndex ${q.correctIndex} out of range`);
    if (!q.explanation || q.explanation.trim().length < 20)
      fail(`${at}: explanation missing or suspiciously short`);
    if (!q.text || q.text.trim().length < 10)
      fail(`${at}: question text missing or too short`);
  });
}

// Pages present in source but never built
for (const slug of declaresQuiz.keys()) {
  if (!existsSync(join(dist, slug, "index.html")))
    fail(`${slug}: no built page`);
}

if (showTables) {
  console.log(`\n--- Cayley tables (${tables.length}) ---`);
  for (const t of tables) {
    console.log(`\n[${t.slug}] ${t.title}`);
    for (const r of t.rows)
      console.log("   " + r.map((c) => c.padStart(4)).join(" "));
    if (t.notes) console.log("   " + t.notes);
  }
}

console.log(
  `\n${section}: ${pages(dist).length} pages, ${quizCount} quizzes, ${totalQuestions} questions, ${figureCount} figures, ${tables.length} operation tables`,
);
console.log(
  problems === 0 ? "No problems found." : `${problems} problem(s) found.`,
);
process.exit(problems === 0 ? 0 : 1);
