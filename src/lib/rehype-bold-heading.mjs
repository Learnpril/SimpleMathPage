/**
 * rehype-bold-heading
 *
 * Marks paragraphs whose entire content is a single bold run, so CSS can give
 * them the extra space they deserve as mini-headings ("**Example 3: ...**",
 * "**Solution.**") without affecting ordinary prose.
 *
 * It also tags two other worked-example shapes that CSS cannot select on its own:
 *
 *   .solution-start - a paragraph opening with a bold "Solution" run, whether or
 *     not prose follows on the same line. Both spellings exist across the site,
 *     and tagging them uniformly lets one rule set the gap between an example
 *     and its solution instead of leaving it to depend on the author's markup.
 *
 *   .qed - a paragraph holding nothing but the tombstone. When a proof ends on a
 *     display equation the square has to live on its own line, and AMS style puts
 *     it flush right; a bare markdown paragraph would sit flush left and read as
 *     a stray glyph. There is no text-content selector in CSS, so this is decided
 *     here.
 *
 * This cannot be expressed in CSS. The structural pseudo-classes :first-child
 * and :last-child only count element children, so a selector like
 *
 *   p:has(> strong:first-child:last-child)
 *
 * also matches a paragraph with plain text on either side of one bold phrase,
 * which is very common and produced large unwanted gaps mid-section. Working on
 * the syntax tree instead lets us inspect the whole child list, text nodes
 * included, and decide correctly.
 */
const BOLD_TAGS = new Set(["strong", "b"]);
const QED = "\u220E"; // ∎, the end-of-proof tombstone

/** Is every child of this paragraph a single bold element (ignoring whitespace)? */
function isSoleBold(node) {
  const children = (node.children ?? []).filter(
    (c) => !(c.type === "text" && c.value.trim() === ""),
  );
  return (
    children.length === 1 &&
    children[0].type === "element" &&
    BOLD_TAGS.has(children[0].tagName)
  );
}

/** The concatenated text of a subtree, ignoring element boundaries. */
function textOf(node) {
  if (node.type === "text") return node.value;
  if (!Array.isArray(node.children)) return "";
  return node.children.map(textOf).join("");
}

/** Does this paragraph open with a bold run that begins "Solution"? */
function startsWithSolution(node) {
  const children = (node.children ?? []).filter(
    (c) => !(c.type === "text" && c.value.trim() === ""),
  );
  const first = children[0];
  return (
    first &&
    first.type === "element" &&
    BOLD_TAGS.has(first.tagName) &&
    /^solution\b/i.test(textOf(first).trim())
  );
}

/** Is this paragraph nothing but the end-of-proof tombstone? */
function isQed(node) {
  return textOf(node).trim() === QED;
}

function addClass(node, name) {
  node.properties = node.properties ?? {};
  const existing = node.properties.className;
  const list = Array.isArray(existing) ? existing : existing ? [existing] : [];
  if (!list.includes(name)) list.push(name);
  node.properties.className = list;
}

export default function rehypeBoldHeading() {
  return (tree) => {
    const walk = (node) => {
      if (!node || !Array.isArray(node.children)) return;
      for (const child of node.children) {
        if (child.type === "element" && child.tagName === "p") {
          if (isSoleBold(child)) addClass(child, "bold-heading");
          if (startsWithSolution(child)) addClass(child, "solution-start");
          if (isQed(child)) addClass(child, "qed");
        }
        walk(child);
      }
    };
    walk(tree);
  };
}
