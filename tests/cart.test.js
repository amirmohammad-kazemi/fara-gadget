import { beforeEach, describe, expect, it } from "vitest";
import {
  addToCart,
  canAddToCart,
  removeFromCart,
  updateQuantity,
  getCartItems,
  getCartSubtotal,
  getCartTotal,
  getCartItemCount,
  clearCart,
} from "../js/modules/cart.js";

const product = {
  id: "prod_1",
  name: "لپ‌تاپ تست",
  brand: "TestBrand",
  price: 10000000,
  discountPrice: 9000000,
  images: ["main.webp"],
  stock: 3,
};

beforeEach(() => {
  localStorage.clear();
});

describe("addToCart", () => {
  it("محصول جدید رو با قیمت تخفیف‌خورده اضافه می‌کنه", () => {
    const added = addToCart(product);
    expect(added).toBe(true);

    const items = getCartItems();
    expect(items).toHaveLength(1);
    expect(items[0].price).toBe(9000000);
    expect(items[0].quantity).toBe(1);
    expect(items[0].stock).toBe(3);
  });

  it("افزودن دوباره‌ی همون محصول (بدون variant) تعداد رو جمع می‌کنه، نه ردیف جدید", () => {
    addToCart(product);
    addToCart(product);

    const items = getCartItems();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it("وقتی مجموع تعداد از موجودی بیشتر بشه، اضافه نمی‌کنه و false برمی‌گردونه", () => {
    addToCart(product, undefined, 3); // دقیقاً کل موجودی
    const added = addToCart(product, undefined, 1); // یکی بیشتر از موجودی

    expect(added).toBe(false);
    expect(getCartItems()[0].quantity).toBe(3); // تغییر نکرده
  });

  it("محصول ناموجود (stock=0) اصلاً اضافه نمی‌شه", () => {
    const outOfStock = { ...product, stock: 0 };
    expect(addToCart(outOfStock)).toBe(false);
    expect(getCartItems()).toHaveLength(0);
  });

  it("variantهای متفاوت از یک محصول، ردیف‌های جدا می‌سازن", () => {
    const variantA = { ram: "8GB", priceDiff: 0 };
    const variantB = { ram: "16GB", priceDiff: 2000000 };

    addToCart(product, variantA);
    addToCart(product, variantB);

    expect(getCartItems()).toHaveLength(2);
  });
});

describe("canAddToCart", () => {
  it("قبل از رسیدن به سقف موجودی true برمی‌گردونه", () => {
    expect(canAddToCart(product, 3)).toBe(true);
  });

  it("بعد از پر شدن سبد تا سقف موجودی، false برمی‌گردونه", () => {
    addToCart(product, undefined, 3);
    expect(canAddToCart(product, 1)).toBe(false);
  });
});

describe("updateQuantity", () => {
  it("تعداد رو تا سقف stock ذخیره‌شده‌ی همون آیتم محدود می‌کنه", () => {
    addToCart(product, undefined, 1);
    const itemId = getCartItems()[0].id;

    updateQuantity(itemId, 10); // بیشتر از موجودی (3)

    expect(getCartItems()[0].quantity).toBe(3);
  });

  it("سقف تعداد، مجموع همه‌ی variantهای یک محصول رو حساب می‌کنه (موجودی مشترکه)", () => {
    const variantA = { storage: "128GB", priceDiff: 0 };
    const variantB = { storage: "256GB", priceDiff: 1000000 };
    addToCart(product, variantA, 2);
    addToCart(product, variantB, 1); // مجموع = ۳ = کل موجودی

    const rowA = getCartItems().find((item) => item.variant.storage === "128GB");
    updateQuantity(rowA.id, 3); // افزایش به ۳ مجموع رو ۴ می‌کرد

    expect(getCartItemCount()).toBe(3);
    expect(getCartItems().find((item) => item.id === rowA.id).quantity).toBe(2);
  });

  it("با تعداد صفر یا کمتر، آیتم رو کامل حذف می‌کنه", () => {
    addToCart(product);
    const itemId = getCartItems()[0].id;

    updateQuantity(itemId, 0);

    expect(getCartItems()).toHaveLength(0);
  });
});

describe("removeFromCart", () => {
  it("فقط همون آیتم رو حذف می‌کنه", () => {
    addToCart(product);
    addToCart({ ...product, id: "prod_2" });
    const [first] = getCartItems();

    removeFromCart(first.id);

    expect(getCartItems()).toHaveLength(1);
    expect(getCartItems()[0].productId).toBe("prod_2");
  });
});

describe("جمع‌های سبد خرید", () => {
  it("Subtotal رو از originalPrice و Total رو از price (بعد از تخفیف) حساب می‌کنه", () => {
    addToCart(product, undefined, 2);

    expect(getCartSubtotal()).toBe(10000000 * 2);
    expect(getCartTotal()).toBe(9000000 * 2);
    expect(getCartItemCount()).toBe(2);
  });

  it("clearCart سبد رو کاملاً خالی می‌کنه", () => {
    addToCart(product);
    clearCart();

    expect(getCartItems()).toHaveLength(0);
  });
});

describe("اعتبارسنجی ورودی‌های سبد خرید", () => {
  it("تعداد صفر، منفی، اعشاری و نامعتبر را نمی‌پذیرد", () => {
    expect(addToCart(product, undefined, 0)).toBe(false);
    expect(addToCart(product, undefined, -1)).toBe(false);
    expect(addToCart(product, undefined, 1.5)).toBe(false);
    expect(addToCart(product, undefined, Number.NaN)).toBe(false);
    expect(getCartItems()).toHaveLength(0);
  });

  it("محصول با قیمت یا شناسه نامعتبر را وارد سبد نمی‌کند", () => {
    expect(addToCart({ ...product, price: Number.NaN })).toBe(false);
    expect(addToCart({ ...product, id: "" })).toBe(false);
    expect(getCartItems()).toHaveLength(0);
  });

  it("priceDiff نامعتبر را نمی‌پذیرد", () => {
    expect(addToCart(product, { ram: "16GB", priceDiff: Number.NaN })).toBe(false);
    expect(getCartItems()).toHaveLength(0);
  });

  it("تعداد اعشاری هنگام ویرایش سبد خرید را نادیده می‌گیرد", () => {
    addToCart(product);
    const itemId = getCartItems()[0].id;
    updateQuantity(itemId, 1.5);
    expect(getCartItems()[0].quantity).toBe(1);
  });
});
