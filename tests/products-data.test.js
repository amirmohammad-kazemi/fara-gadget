import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const products = JSON.parse(
  readFileSync(new URL("../data/products.json", import.meta.url), "utf8"),
);

describe("data/products.json", () => {
  it("حداقل یک محصول داره", () => {
    expect(products.length > 0).toBe(true);
  });

  it("idها یکتا هستن", () => {
    const ids = products.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("هر محصول فیلدهای لازمِ رندر رو داره", () => {
    for (const product of products) {
      expect(typeof product.id).toBe("string");
      expect(typeof product.name).toBe("string");
      expect(typeof product.brand).toBe("string");
      expect(typeof product.category).toBe("string");
      expect(typeof product.price).toBe("number");
      expect(typeof product.stock).toBe("number");
      expect(typeof product.rating).toBe("number");
      expect(typeof product.reviewCount).toBe("number");
      expect(Array.isArray(product.images) && product.images.length > 0).toBe(true);
      expect(typeof product.specs).toBe("object");
    }
  });

  it("قیمت تخفیف‌خورده (اگه هست) از قیمت اصلی کمتره", () => {
    for (const product of products) {
      if (product.discountPrice != null) {
        expect(product.discountPrice < product.price).toBe(true);
      }
    }
  });

  it("variant اول هر محصول priceDiff صفر داره (قیمت پیش‌فرض = قیمت پایه)", () => {
    for (const product of products) {
      if (product.variants?.length > 0) {
        expect(product.variants[0].priceDiff).toBe(0);
      }
    }
  });

  it("همه‌ی عکس‌های ذکرشده واقعاً تو assets/images وجود دارن", () => {
    for (const product of products) {
      for (const image of product.images) {
        const imageUrl = new URL(`../assets/images/${image}`, import.meta.url);
        expect(existsSync(imageUrl)).toBe(true);
      }
    }
  });
});
