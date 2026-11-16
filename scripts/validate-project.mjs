import { readdir, readFile, access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else files.push(fullPath);
  }
  return files;
}

const files = await walk(root);
const jsFiles = files.filter((file) => file.endsWith(".js") || file.endsWith(".mjs"));

for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    errors.push(`${path.relative(root, file)}: ${result.stderr || result.stdout}`);
  }

  const source = await readFile(file, "utf8");
  const importPattern = /(?:\bfrom\s*|\bimport\s*\()\s*["'](\.[^"']+)["']/g;
  for (const match of source.matchAll(importPattern)) {
    const dependency = path.resolve(path.dirname(file), match[1]);
    try {
      await access(dependency);
    } catch {
      errors.push(`${path.relative(root, file)}: missing import ${match[1]}`);
    }
  }
}

const productsPath = path.join(root, "data", "products.json");
const products = JSON.parse(await readFile(productsPath, "utf8"));
if (!Array.isArray(products) || products.length === 0) {
  errors.push("data/products.json must contain at least one product.");
} else {
  const ids = new Set();
  for (const product of products) {
    if (!product.id || ids.has(product.id)) errors.push(`Duplicate or missing product id: ${product.id}`);
    ids.add(product.id);
    if (!Array.isArray(product.images) || product.images.length === 0) {
      errors.push(`Product ${product.id} has no image.`);
      continue;
    }
    for (const image of product.images) {
      try {
        await access(path.join(root, "assets", "images", image));
      } catch {
        errors.push(`Product ${product.id} references missing image: ${image}`);
      }
    }
  }
}

for (const page of ["index.html", "shop.html", "product.html", "cart.html"]) {
  const html = await readFile(path.join(root, page), "utf8");
  if (!html.includes('src="js/main.js"')) errors.push(`${page} does not load js/main.js.`);
  if (!html.includes("data-page=")) errors.push(`${page} is missing its data-page attribute.`);
}

if (errors.length) {
  console.error(`Validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Validation passed: ${jsFiles.length} JavaScript files, ${products.length} products, all product images and page entry points.`);
}
