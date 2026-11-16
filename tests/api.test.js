import { beforeEach, describe, expect, it, vi } from "vitest";

let getAllProducts;
let getProductById;
let getProductsByCategory;

const fixture = [
  { id: "a", name: "لپ‌تاپ A", category: "laptop" },
  { id: "b", name: "موبایل B", category: "mobile" },
  { id: "c", name: "لپ‌تاپ C", category: "laptop" },
];

let fetchCalls;

beforeEach(async () => {
  vi.resetModules();
  sessionStorage.clear();
  // پرچم قدیمی نباید جلوی تلاش دوباره برای Realtime Database رو بگیره
  sessionStorage.setItem("faragadget_data_source", "local");

  ({ getAllProducts, getProductById, getProductsByCategory } = await import("../js/modules/api.js"));
  fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return { ok: true, json: async () => fixture };
  };
});

describe("بازیابی اتصال Realtime Database بعد از تغییر شبکه", () => {
  it("پرچم local قدیمی در sessionStorage نباید مانع تلاش مجدد برای Realtime Database شود", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    // تو Node ایمپورت SDK مرورگر شکست می‌خوره؛ پس warning ثابت می‌کنه Realtime Database امتحان شده
    await getAllProducts();

    expect(warn).toHaveBeenCalled();
    expect(sessionStorage.getItem("faragadget_data_source")).toBe("local");
    warn.mockRestore();
  });
});

describe("getAllProducts (منبع محلی)", () => {
  it("همه‌ی محصولات رو از data/products.json برمی‌گردونه", async () => {
    const products = await getAllProducts();
    expect(products).toHaveLength(3);
  });
});

describe("getProductById (منبع محلی)", () => {
  it("محصول درست رو با id پیدا می‌کنه", async () => {
    const product = await getProductById("b");
    expect(product.name).toBe("موبایل B");
  });

  it("برای id ناموجود null برمی‌گردونه، نه خطا", async () => {
    expect(await getProductById("nope")).toBe(null);
  });

  it("برای id خالی (null) اصلاً درخواستی نمی‌فرسته", async () => {
    const before = fetchCalls;
    expect(await getProductById(null)).toBe(null);
    expect(fetchCalls).toBe(before);
  });
});

describe("getProductsByCategory (منبع محلی)", () => {
  it("فقط محصولات همون دسته رو برمی‌گردونه", async () => {
    const laptops = await getProductsByCategory("laptop");
    expect(laptops).toHaveLength(2);
    expect(laptops.every((product) => product.category === "laptop")).toBe(true);
  });
});

describe("کش لیست محصولات (sessionStorage)", () => {
  const CACHE_KEY = "faragadget_products_cache";

  it("بعد از اولین دریافت، لیست رو کش می‌کنه", async () => {
    await getAllProducts();
    const saved = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    expect(saved.products).toHaveLength(3);
  });

  it("تا وقتی کش تازه‌ست، از کش منبع فعلی می‌خونه و درخواستی نمی‌فرسته", async () => {
    // شبیه‌سازی حالتی که اولین تلاش Realtime Database شکست خورده
    await getAllProducts();
    const cachedProduct = { id: "x", name: "فقط تو کش", category: "mobile" };
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), source: "local", products: [cachedProduct] }),
    );
    const before = fetchCalls;

    expect(await getAllProducts()).toEqual([cachedProduct]);
    expect(await getProductById("x")).toEqual(cachedProduct);
    expect(await getProductsByCategory("mobile")).toEqual([cachedProduct]);
    expect(fetchCalls).toBe(before);
  });

  it("کشِ قدیمی (بیشتر از ۵ دقیقه) رو نادیده می‌گیره", async () => {
    const stale = Date.now() - 6 * 60 * 1000;
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ savedAt: stale, products: [{ id: "old" }] }),
    );
    const products = await getAllProducts();
    expect(products).toHaveLength(3);
  });

  it("کشِ خراب باعث خطا نمیشه", async () => {
    sessionStorage.setItem(CACHE_KEY, "{خراب");
    expect(await getAllProducts()).toHaveLength(3);
  });
});
