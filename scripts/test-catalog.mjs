import { build } from "esbuild";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const dir = await mkdtemp(join(tmpdir(), "gxz-catalog-"));
async function bundle(entry, name) {
  const outfile = join(dir, name + ".mjs");
  await build({ entryPoints: [entry], outfile, bundle: true, platform: "node", format: "esm" });
  return import(pathToFileURL(outfile).href);
}
const { catalogOptions, isProductInStock } = await bundle("src/lib/catalog-options.ts", "options");
const { calculateTrustedCart } = await bundle("server/checkout.ts", "checkout");
const options = [
  {
    name: "Size",
    values: [
      { label: "Small", inStock: true, price: 12 },
      { label: "Large", inStock: false, price: 18 },
    ],
  },
];
const variants = catalogOptions(options, 10);
assert.equal(variants[1].inStock, false);
assert.equal(isProductInStock({ variants }), true);
assert.equal(
  isProductInStock({ variants: variants.map((v) => ({ ...v, inStock: false })) }),
  false,
);
assert.equal(isProductInStock({ track_stock: true, stock_qty: 0 }), false);
const multiple = catalogOptions(
  [...options, { name: "Color", values: [{ label: "Gold", inStock: true }] }],
  10,
);
assert.equal(multiple[0].label, "Small / Gold");
assert.equal(multiple[0].price, 12);
assert.equal(multiple[1].inStock, false);
assert.equal(catalogOptions([{ label: "A" }, { label: "B", inStock: false }], 10).length, 2);
const product = {
  slug: "future-product",
  name: "Future Product",
  price: 10,
  active: true,
  options,
};
function db(rows, error = null) {
  return { from: () => ({ select: () => ({ in: async () => ({ data: rows, error }) }) }) };
}
const item = { slug: product.slug, quantity: 1, optionLabel: "Small" };
assert.equal((await calculateTrustedCart(db([product]), [item])).items[0].unit_price, 12);
await assert.rejects(
  () => calculateTrustedCart(db([product]), [{ ...item, optionLabel: "Large" }]),
  /unavailable/,
);
await assert.rejects(
  () => calculateTrustedCart(db([product]), [{ ...item, optionLabel: "Invented" }]),
  /unavailable/,
);
await assert.rejects(
  () => calculateTrustedCart(db([product]), [{ ...item, optionLabel: undefined }]),
  /unavailable/,
);
await assert.rejects(
  () => calculateTrustedCart(db([{ ...product, active: false }]), [item]),
  /not available/,
);
await assert.rejects(() => calculateTrustedCart(db([], {}), [item]), /Unable to check/);
await assert.rejects(
  () => calculateTrustedCart(db([]), [{ slug: "pen", quantity: 1 }]),
  /not available/,
);
await assert.rejects(
  () => calculateTrustedCart(db([{ ...product, track_stock: true, stock_qty: 1 }]), [item, item]),
  /Not enough stock/,
);
assert.equal(
  (
    await calculateTrustedCart(db([{ ...product, options: [] }]), [
      { slug: product.slug, quantity: 1 },
    ])
  ).items[0].unit_price,
  10,
);
console.log(
  "Catalog tests passed: availability, future products, multiple options, saved prices, removed products, stock limits and database failure.",
);
