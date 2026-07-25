/**
 * Generates a 1200x630 Open Graph image for social sharing.
 * Run with: node scripts/make-og-image.mjs
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const WIDTH = 1200;
const HEIGHT = 630;
const BG = "#0d1117";

// Mascot sized to fit the right side of the card
const mascot = await sharp(join(root, "src/assets/mascot.png"))
  .resize({ height: 470, fit: "inside" })
  .toBuffer();
const mascotMeta = await sharp(mascot).metadata();

const svgText = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { fill: #ffffff; font-size: 68px; font-weight: 700; font-family: Georgia, 'Times New Roman', serif; }
    .tagline { fill: #9ca3af; font-size: 30px; font-family: Georgia, 'Times New Roman', serif; }
  </style>
  <text x="70" y="250" class="title">Mom's Basement</text>
  <text x="70" y="330" class="title">University</text>
  <text x="70" y="405" class="tagline">Learn Math for Free -</text>
  <text x="70" y="450" class="tagline">Arithmetic and Beyond</text>
</svg>`;

await sharp({
  create: {
    width: WIDTH,
    height: HEIGHT,
    channels: 4,
    background: BG,
  },
})
  .composite([
    { input: Buffer.from(svgText), top: 0, left: 0 },
    {
      input: mascot,
      top: Math.round((HEIGHT - mascotMeta.height) / 2),
      left: WIDTH - mascotMeta.width - 60,
    },
  ])
  .png()
  .toFile(join(root, "public/og-image.png"));

console.log("Wrote public/og-image.png (1200x630)");
