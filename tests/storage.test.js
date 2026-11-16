import { beforeEach, describe, expect, it } from "vitest";
import { getCartFromStorage, saveCartToStorage } from "../js/modules/storage.js";

const validItem = {
  id: "cart-1",
  productId: "product-1",
  name: "محصول تست",
  brand: "برند تست",
  originalPrice: 1000,
  price: 900,
  image: "product.webp",
  variant: null,
  variantKey: "{}",
  quantity: 1,
  stock: 5,
};

beforeEach(() => localStorage.clear());

describe("storage سبد خرید", () => {
  it("آرایه‌ی معتبر را ذخیره و بازیابی می‌کند", () => {
    expect(saveCartToStorage([validItem])).toBe(true);
    expect(getCartFromStorage()).toEqual([validItem]);
  });

  it("JSON خراب را بدون Crash به سبد خالی تبدیل می‌کند", () => {
    localStorage.setItem("faragadget_cart", "{broken-json");
    expect(getCartFromStorage()).toEqual([]);
  });

  it("ساختار غیرآرایه را پاک می‌کند", () => {
    localStorage.setItem("faragadget_cart", JSON.stringify({ item: validItem }));
    expect(getCartFromStorage()).toEqual([]);
    expect(localStorage.getItem("faragadget_cart")).toBeNull();
  });

  it("آیتم‌های ناقص یا با تعداد نامعتبر را فیلتر می‌کند", () => {
    localStorage.setItem(
      "faragadget_cart",
      JSON.stringify([validItem, { ...validItem, quantity: 0 }, { id: "broken" }]),
    );
    expect(getCartFromStorage()).toEqual([validItem]);
  });

  it("داده‌ای با قیمت غیرعددی را ذخیره نمی‌کند", () => {
    expect(saveCartToStorage([{ ...validItem, price: "900" }])).toBe(false);
    expect(localStorage.getItem("faragadget_cart")).toBeNull();
  });
});
