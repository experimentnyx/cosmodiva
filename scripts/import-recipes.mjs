/**
 * One-shot importer: data/*.csv (Webflow export) -> src/_data/recipes.json
 *
 * Also downloads each recipe photo off Webflow's CDN into src/assets/recipes/.
 * Those uploads-ssl.webflow.com URLs stop resolving once the Webflow site is
 * unpublished, so the images must live in the repo.
 *
 * Re-runnable: skips photos already on disk.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const CSV = join("data", "Cosmo Diva Foods Export.csv");
const CAT_CSV = join("data", "Cosmo Diva Categories.csv");
const IMG_DIR = join("src", "assets", "recipes");
const OUT = join("src", "_data", "recipes.json");

/** Minimal RFC4180 parser — the export contains quoted HTML with embedded commas. */
function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const rows = parseCsv(readFileSync(CSV, "utf8"));
const header = rows[0];
const col = (name) => header.indexOf(name);

const num = (v) => {
  const n = parseInt(String(v).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

// Webflow wraps rich text in id=""/class="" noise; strip it.
const clean = (html) => (html || "").replace(/\s(id|class)=""/g, "").trim();

// Category slug -> display name, so the blog can label and filter with real names.
const catRows = parseCsv(readFileSync(CAT_CSV, "utf8"));
const catHeader = catRows[0];
const catNames = new Map(
  catRows
    .slice(1)
    .filter((r) => r[catHeader.indexOf("Slug")])
    .map((r) => [r[catHeader.indexOf("Slug")], r[catHeader.indexOf("Name")]])
);

mkdirSync(IMG_DIR, { recursive: true });

const recipes = [];
for (const r of rows.slice(1)) {
  if (!r[col("Name")]) continue;
  if (r[col("Archived")] === "true" || r[col("Draft")] === "true") continue;

  const slug = r[col("Slug")];
  const remote = r[col("Main Image")];
  let image = null;

  if (remote) {
    const ext = (remote.split("?")[0].match(/\.(jpe?g|png|webp)$/i) || [, "jpg"])[1];
    const file = `${slug}.${ext.toLowerCase()}`;
    const dest = join(IMG_DIR, file);
    image = `/assets/recipes/${file}`;
    if (!existsSync(dest)) {
      try {
        const res = await fetch(remote);
        if (res.ok) {
          writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
          console.log(`  downloaded ${file}`);
        } else {
          console.warn(`  FAILED ${res.status} ${file} — ${remote}`);
          image = null;
        }
      } catch (e) {
        console.warn(`  FAILED ${file} — ${e.message}`);
        image = null;
      }
    } else {
      console.log(`  have ${file}`);
    }
  }

  recipes.push({
    name: r[col("Name")],
    slug,
    image,
    minutes: num(r[col("Cooking Minutes")]),
    calories: num(r[col("Calories")]),
    protein: num(r[col("Protein")]),
    carbs: num(r[col("Carbs")]),
    fats: num(r[col("Fats")]),
    category: r[col("Categories")] || null,
    categoryName: catNames.get(r[col("Categories")]) || null,
    description: r[col("Description")] || null,
    ingredients: clean(r[col("Ingridiens")]),
    instructions: clean(r[col("Instruction")]),
  });
}

writeFileSync(OUT, JSON.stringify(recipes, null, 2) + "\n", "utf8");
console.log(`\nWrote ${recipes.length} recipes -> ${OUT}`);
