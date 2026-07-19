export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addWatchTarget("src/css");
  eleventyConfig.addWatchTarget("src/js");

  // Strip Webflow's rich-text wrapper attributes from CMS-exported HTML.
  eleventyConfig.addFilter("cleanRichText", (html) =>
    (html || "").replace(/\s(id|class)=""/g, "")
  );

  // Nunjucks' built-in `slice` chunks a list; this takes the first n items.
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("after", (arr, n) => (arr || []).slice(n));

  // "/assets/x.webp" -> "/assets/x@2x.webp", for building srcset pairs.
  eleventyConfig.addFilter("retina", (src) =>
    (src || "").replace(/(\.[a-z0-9]+)$/i, "@2x$1")
  );

  // Drop items whose `key` equals `value` — used to exclude the current recipe.
  eleventyConfig.addFilter("reject", (arr, key, value) =>
    (arr || []).filter((item) => item[key] !== value)
  );

  // Distinct categories present in the data, as {slug, name}.
  eleventyConfig.addFilter("categories", (arr) => {
    const seen = new Map();
    for (const r of arr || []) {
      if (r.category && !seen.has(r.category)) {
        seen.set(r.category, { slug: r.category, name: r.categoryName || r.category });
      }
    }
    return [...seen.values()];
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
