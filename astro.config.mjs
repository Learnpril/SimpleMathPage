import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  integrations: [
    starlight({
      title: "Mom's Basement University",
      favicon: "/favicon.png",
      logo: {
        src: "./src/assets/logo.png",
      },
      sidebar: [
        { label: "Welcome", slug: "" },
        {
          label: "Arithmetic",
          autogenerate: { directory: "arithmetic" },
        },
        {
          label: "Pre-Algebra",
          autogenerate: { directory: "pre-algebra" },
        },
        {
          label: "Linear Algebra",
          autogenerate: { directory: "linear-algebra" },
        },
        {
          label: "Graphics Math",
          autogenerate: { directory: "graphics-math" },
        },
        {
          label: "AI Art Math",
          autogenerate: { directory: "ai-art-math" },
        },
        {
          label: "Esoteric Patterns",
          autogenerate: { directory: "esoteric-patterns" },
        },
      ],
      customCss: ["./src/styles/custom.css", "katex/dist/katex.min.css"],
      head: [
        {
          tag: "script",
          content: `if (!localStorage.getItem('starlight-theme')) { document.documentElement.dataset.theme = 'dark'; }`,
        },
        {
          tag: "link",
          attrs: {
            rel: "preconnect",
            href: "https://fonts.googleapis.com",
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "preconnect",
            href: "https://fonts.gstatic.com",
            crossorigin: true,
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "stylesheet",
            href: "https://fonts.googleapis.com/css?family=Libre+Baskerville:400,400italic,700&display=swap",
          },
        },
      ],
    }),
  ],
});
