import { describe, expect, it } from "vitest";
import {
  formatPrice,
  toPersianDigits,
  escapeHtml,
  renderProductCard,
  renderCartRow,
  renderHeroText,
} from "../js/modules/render.js";

describe("toPersianDigits", () => {
  it("ارقام لاتین رو به فارسی تبدیل می‌کنه", () => {
    expect(toPersianDigits(1234)).toBe("۱۲۳۴");
  });

  it("روی رشته هم کار می‌کنه و بقیه‌ی کاراکترها رو دست‌نخورده می‌ذاره", () => {
    expect(toPersianDigits("(4 نظر)")).toBe("(۴ نظر)");
  });
});

describe("formatPrice", () => {
  it("عدد رو با جداکننده‌ی کاما و رقم فارسی فرمت می‌کنه", () => {
    expect(formatPrice(29900000)).toBe("۲۹,۹۰۰,۰۰۰");
  });
});

describe("escapeHtml", () => {
  it("کاراکترهای خطرناک HTML رو escape می‌کنه", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });

  it("متن عادی فارسی رو بدون تغییر برمی‌گردونه", () => {
    expect(escapeHtml("لپ‌تاپ ایسوس Vivobook 15")).toBe("لپ‌تاپ ایسوس Vivobook 15");
  });

  it("مقدار null/undefined رو به رشته‌ی خالی تبدیل می‌کنه (بدون Error)", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("اپاستروف رو escape می‌کنه (جلوگیری از شکستن attribute تک‌کوتیشن)", () => {
    expect(escapeHtml("O'Brien")).toBe("O&#39;Brien");
  });
});


describe("امنیت خروجی HTML", () => {
  it("مقدار نام فایل تصویر را در attribute ایمن می‌کند", () => {
    const html = renderProductCard({
      id: "safe-id",
      name: "محصول",
      brand: "برند",
      price: 100,
      stock: 1,
      rating: 4,
      reviewCount: 1,
      images: ['x" onerror="alert(1)'],
    });
    expect(html).not.toMatch(/<img[^>]*\sonerror=/i);
  });

  it("priceDiff داخلی variant را به‌عنوان مشخصه‌ی قابل‌نمایش نشان نمی‌دهد", () => {
    const html = renderCartRow({
      id: "cart-1",
      productId: "product-1",
      name: "محصول",
      brand: "برند",
      image: "product.webp",
      price: 100,
      quantity: 1,
      variant: { ram: "16GB", priceDiff: 200 },
      stock: 2,
    });
    expect(html).toContain("16GB");
    expect(html).not.toContain("200");
  });
});

describe("renderHeroText", () => {
  const product = {
    id: "p<1>",
    name: "لپ‌تاپ <b>تست</b>",
    brand: "Apple",
    price: 100000,
    discountPrice: 80000,
    stock: 2,
    specs: { "پردازنده": "M3", "رم": "16GB" },
  };

  it("لینک جزئیات محصول و درصد تخفیف را می‌سازد", () => {
    const html = renderHeroText(product);
    expect(html).toContain('href="product.html?id=p%3C1%3E"');
    expect(html).toContain("۲۰٪");
    expect(html).toContain("M3");
  });

  it("متن محصول را escape می‌کند", () => {
    const html = renderHeroText(product);
    expect(html).not.toContain("<b>تست</b>");
  });

  it("برای محصول ناموجود دکمه‌ی افزودن را غیرفعال می‌کند", () => {
    const html = renderHeroText({ ...product, stock: 0 });
    expect(html).toContain("ناموجود");
  });
});
