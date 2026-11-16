import { describe, expect, it } from "vitest";
import {
  searchProducts,
  filterByCategory,
  filterByPriceRange,
  filterByBrand,
  sortProducts,
  pickFeaturedProduct,
} from "../js/modules/filters.js";

const products = [
  {
    id: "p1",
    name: "لپ‌تاپ ایسوس Vivobook",
    brand: "Asus",
    category: "laptop",
    price: 30000000,
    discountPrice: 27000000,
    rating: 4.2,
    createdAt: { toMillis: () => 3000 },
  },
  {
    id: "p2",
    name: "گوشی سامسونگ Galaxy",
    brand: "Samsung",
    category: "mobile",
    price: 20000000,
    rating: 4.8,
    createdAt: { toMillis: () => 1000 },
  },
  {
    id: "p3",
    name: "هدفون سونی",
    brand: "Sony",
    category: "headphone",
    price: 5000000,
    rating: 4.0,
  },
];

describe("searchProducts", () => {
  it("متن جستجو رو روی نام و برند، بدون حساسیت به بزرگی/کوچکی حروف چک می‌کنه", () => {
    expect(searchProducts(products, "asus")).toHaveLength(1);
    expect(searchProducts(products, "سامسونگ")).toHaveLength(1);
  });

  it("با کوئری خالی همه‌ی محصولات رو برمی‌گردونه", () => {
    expect(searchProducts(products, "")).toHaveLength(3);
    expect(searchProducts(products, null)).toHaveLength(3);
  });
});

describe("filterByCategory", () => {
  it("فقط محصولات دسته‌های انتخاب‌شده رو نگه می‌داره", () => {
    expect(filterByCategory(products, ["laptop"])).toHaveLength(1);
  });

  it("با آرایه‌ی خالی همه رو برمی‌گردونه (فیلتر غیرفعاله)", () => {
    expect(filterByCategory(products, [])).toHaveLength(3);
  });
});

describe("filterByPriceRange", () => {
  it("قیمت مؤثر (discountPrice اگه باشه، وگرنه price) رو در نظر می‌گیره", () => {
    const result = filterByPriceRange(products, 26000000, 28000000);
    expect(result.map((p) => p.id)).toEqual(["p1"]);
  });

  it("min/max برابر null یعنی بدون محدودیت اون سمت", () => {
    expect(filterByPriceRange(products, null, null)).toHaveLength(3);
  });
});

describe("filterByBrand", () => {
  it("چند برند هم‌زمان رو پشتیبانی می‌کنه", () => {
    expect(filterByBrand(products, ["Asus", "Sony"])).toHaveLength(2);
  });
});

describe("sortProducts", () => {
  it("price-asc از ارزان به گرون مرتب می‌کنه (بر اساس قیمت مؤثر)", () => {
    const sorted = sortProducts(products, "price-asc");
    expect(sorted.map((p) => p.id)).toEqual(["p3", "p2", "p1"]);
  });

  it("price-desc از گرون به ارزان مرتب می‌کنه", () => {
    const sorted = sortProducts(products, "price-desc");
    expect(sorted.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
  });

  it("rating از بالا به پایین مرتب می‌کنه", () => {
    const sorted = sortProducts(products, "rating");
    expect(sorted.map((p) => p.id)).toEqual(["p2", "p1", "p3"]);
  });

  it("newest واقعاً بر اساس createdAt مرتب می‌کنه و محصول بدون createdAt رو ته لیست می‌ذاره", () => {
    const sorted = sortProducts(products, "newest");
    expect(sorted.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
  });

  it("آرایه‌ی اصلی رو تغییر نمی‌ده (immutable)", () => {
    const original = [...products];
    sortProducts(products, "price-asc");
    expect(products).toEqual(original);
  });
});

describe("pickFeaturedProduct", () => {
  const list = [
    { id: "a", price: 100, discountPrice: 90, stock: 3 },
    { id: "b", price: 100, discountPrice: 50, stock: 2 },
    { id: "c", price: 100, stock: 5, featured: true },
    { id: "d", price: 100, discountPrice: 10, stock: 0 },
  ];

  it("محصولِ featured را اولویت می‌دهد", () => {
    expect(pickFeaturedProduct(list).id).toBe("c");
  });

  it("بدون featured، بیشترین تخفیفِ موجود را انتخاب می‌کند و ناموجودها را رد می‌کند", () => {
    expect(pickFeaturedProduct(list.filter((product) => !product.featured)).id).toBe("b");
  });

  it("برای لیست خالی null برمی‌گرداند", () => {
    expect(pickFeaturedProduct([])).toBeNull();
    expect(pickFeaturedProduct(undefined)).toBeNull();
  });
});
