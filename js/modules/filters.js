function getEffectivePrice(product) {
  const price = product?.discountPrice ?? product?.price;
  return Number.isFinite(price) ? price : 0;
}

function getCreatedAtMillis(product) {
  const value = product?.createdAt;
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function searchProducts(products, query) {
  const normalizedQuery = String(query ?? "").trim().toLocaleLowerCase();
  if (!normalizedQuery) return products;

  return products.filter((product) => {
    const name = String(product.name ?? "").toLocaleLowerCase();
    const brand = String(product.brand ?? "").toLocaleLowerCase();
    return name.includes(normalizedQuery) || brand.includes(normalizedQuery);
  });
}

export function filterByCategory(products, categories = []) {
  if (!Array.isArray(categories) || categories.length === 0) return products;
  return products.filter((product) => categories.includes(product.category));
}

export function filterByPriceRange(products, minPrice, maxPrice) {
  const min = minPrice == null || minPrice === "" ? null : Number(minPrice);
  const max = maxPrice == null || maxPrice === "" ? null : Number(maxPrice);
  const validMin = Number.isFinite(min) ? min : null;
  const validMax = Number.isFinite(max) ? max : null;

  return products.filter((product) => {
    const price = getEffectivePrice(product);
    if (validMin !== null && price < validMin) return false;
    if (validMax !== null && price > validMax) return false;
    return true;
  });
}

export function filterByBrand(products, brands = []) {
  if (!Array.isArray(brands) || brands.length === 0) return products;
  return products.filter((product) => brands.includes(product.brand));
}

export function sortProducts(products, sortKey) {
  const sortedProducts = [...products];

  switch (sortKey) {
    case "price-asc":
      return sortedProducts.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    case "price-desc":
      return sortedProducts.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    case "rating":
      return sortedProducts.sort(
        (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0),
      );
    case "newest":
      return sortedProducts.sort((a, b) => getCreatedAtMillis(b) - getCreatedAtMillis(a));
    default:
      return sortedProducts;
  }
}

// محصول هیرو: اول محصولی که featured: true دارد، بعد بیشترین درصد تخفیفِ موجود، بعد اولین محصول موجود.
export function pickFeaturedProduct(products) {
  if (!Array.isArray(products) || products.length === 0) return null;

  const inStock = products.filter((product) => (product?.stock ?? 0) > 0);
  const flagged = (inStock.length ? inStock : products).find((product) => product?.featured === true);
  if (flagged) return flagged;

  const discountOf = (product) =>
    product.discountPrice != null && product.price > 0
      ? (product.price - product.discountPrice) / product.price
      : 0;

  const pool = inStock.length ? inStock : products;
  return pool.reduce((best, product) => (discountOf(product) > discountOf(best) ? product : best), pool[0]);
}
