import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightObsidian from "starlight-obsidian";
import { starlightKatex } from "starlight-katex";

export default defineConfig({
  integrations: [
    starlight({
      title: "Math Made Clear",
      plugins: [
        starlightObsidian({ vault: "./obsidian-vault" }),
        starlightKatex(),
      ],
      customCss: ["./src/styles/custom.css"],
      social: [],
    }),
  ],
});
