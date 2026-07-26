/**
 * rehype-bold-heading
 *
 * Marks paragraphs whose entire content is a single bold run, so CSS can give
 * them the extra space they deserve as mini-headings ("**Example 3: ...**",
 * "**Solution.**") without affecting ordinary prose.
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
        if (
          child.type === "element" &&
          child.tagName === "p" &&
          isSoleBold(child)
        ) {
          addClass(child, "bold-heading");
        }
        walk(child);
      }
    };
    walk(tree);
  };
}
