/**
 * One-shot image optimiser.
 *
 * Sizes are derived from what each image actually renders at (see
 * src/css/tokens.css), not from the source file. The design assets came out of
 * Figma at full resolution — testimonial-main.jpg was 2731x4096 for a slot that
 * renders at 807x524.
 *
 * Originals are replaced. They remain recoverable from "Сайт з Figma файлу.zip"
 * and, for recipes, from scripts/import-recipes.mjs.
 *
 * `2x` entries emit two files and are referenced with srcset.
 * Single-width entries are used as CSS background-image, which cannot take a
 * srcset, so they get one file sized for retina at the largest slot.
 */
import sharp from "sharp";
import { readdirSync, statSync, unlinkSync, readFileSync, writeFileSync } from "node:fs";
import { join, extname, basename } from "node:path";

const DIR = "src/assets";
const RECIPES = join(DIR, "recipes");

// width = the CSS px the image occupies at its largest desktop slot
const PLAN = [
  { file: "hero-photo-2.png",        width: 1058, retina: true,  alpha: true  },
  { file: "about-photo-real.png",    width: 656,  retina: true,  alpha: true  },
  { file: "training-bodyweight.png", width: 656,  retina: true,  alpha: true  },
  { file: "training-stretching.png", width: 646,  retina: true,  alpha: true  },
  { file: "testimonial-main.jpg",    width: 807,  retina: true,  alpha: false },
  // Decorative starfield at opacity 0.2 behind the banner, largely occluded by
  // the astronaut and clouds. Film grain is worst-case for WebP, so quality is
  // dropped hard — invisible at 20% opacity, and it is the difference between
  // 400KB and 60KB.
  { file: "banner-space-bg.jpg",     width: 1200, retina: false, alpha: false, quality: 42 },
  { file: "avatar-1.jpg",            width: 48,   retina: true,  alpha: false },
  { file: "avatar-2.jpg",            width: 48,   retina: true,  alpha: false },
  { file: "avatar-3.jpg",            width: 48,   retina: true,  alpha: false },
  { file: "avatar-4.jpg",            width: 48,   retina: true,  alpha: false },
];

// Unreferenced design stock photos — the real recipes replaced them.
const DELETE = ["recipe-bowl.jpg", "recipe-pancakes.jpg", "recipe-plate.jpg"];

const kb = (n) => (n / 1024).toFixed(0);
let before = 0;
let after = 0;

for (const f of DELETE) {
  const p = join(DIR, f);
  try {
    before += statSync(p).size;
    unlinkSync(p);
    console.log(`  removed (unused)  ${f}`);
  } catch {}
}

async function emit(srcPath, outBase, width, alpha, quality) {
  const meta = await sharp(srcPath).metadata();
  const w = Math.min(width, meta.width);
  const out = `${outBase}.webp`;
  await sharp(srcPath)
    .resize({ width: w, withoutEnlargement: true })
    .webp({ quality: quality ?? (alpha ? 82 : 80), alphaQuality: 90, effort: 6 })
    .toFile(out);
  return { out, size: statSync(out).size, w };
}

for (const item of PLAN) {
  const src = join(DIR, item.file);
  let srcSize;
  try {
    srcSize = statSync(src).size;
  } catch {
    console.warn(`  MISSING ${item.file}`);
    continue;
  }
  before += srcSize;

  const stem = basename(item.file, extname(item.file));
  const one = await emit(src, join(DIR, stem), item.width, item.alpha, item.quality);
  after += one.size;
  let note = `${one.w}w ${kb(one.size)}KB`;

  if (item.retina) {
    const two = await emit(src, join(DIR, `${stem}@2x`), item.width * 2, item.alpha, item.quality);
    after += two.size;
    note += ` + ${two.w}w ${kb(two.size)}KB`;
  }

  unlinkSync(src);
  console.log(`  ${item.file.padEnd(26)} ${kb(srcSize).padStart(5)}KB -> ${note}`);
}

/* Recipe photos: the CMS originals are already small and well-compressed — in
   places smaller than the slot they fill. No retina pass, and if WebP does not
   actually beat the original the original is kept, because re-encoding an
   already-optimised JPEG can make it larger. */
const recipeExt = {};
for (const f of readdirSync(RECIPES)) {
  if (!/\.(png|jpe?g)$/i.test(f)) continue;
  const src = join(RECIPES, f);
  const srcSize = statSync(src).size;
  before += srcSize;
  const stem = basename(f, extname(f));
  const r = await emit(src, join(RECIPES, stem), 1200, false);

  if (r.size < srcSize) {
    unlinkSync(src);
    after += r.size;
    recipeExt[stem] = ".webp";
    console.log(`  recipes/${f.padEnd(28)} ${kb(srcSize).padStart(4)}KB -> ${r.w}w ${kb(r.size)}KB`);
  } else {
    unlinkSync(r.out);
    after += srcSize;
    recipeExt[stem] = extname(f);
    console.log(`  recipes/${f.padEnd(28)} ${kb(srcSize).padStart(4)}KB -> kept original (webp was ${kb(r.size)}KB)`);
  }
}

/* recipes.json holds the image paths, so it has to follow whichever format won. */
const RJSON = "src/_data/recipes.json";
const recipes = JSON.parse(readFileSync(RJSON, "utf8"));
for (const r of recipes) {
  if (recipeExt[r.slug]) r.image = `/assets/recipes/${r.slug}${recipeExt[r.slug]}`;
}
writeFileSync(RJSON, JSON.stringify(recipes, null, 2) + "\n", "utf8");
console.log(`\nRewrote image paths in ${RJSON}`);

console.log(
  `Total: ${kb(before)}KB -> ${kb(after)}KB  (${(100 - (after / before) * 100).toFixed(1)}% smaller)`
);
