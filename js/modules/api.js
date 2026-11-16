import { firebaseConfig, FIREBASE_SDK_VERSION } from "../config/firebase-config.js";

// "auto": اول Realtime Database و در صورت خطا JSON محلی | "local": فقط JSON | "realtime-database": فقط دیتابیس آنلاین
const DATA_SOURCE = "auto";

const SDK_BASE_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
const LOCAL_DATA_URL = new URL("../../data/products.json", import.meta.url);
const DATABASE_TIMEOUT_MS = 8000;
const PRODUCTS_CACHE_KEY = "faragadget_products_cache";
const PRODUCTS_CACHE_TTL_MS = 5 * 60 * 1000;

let localProductsPromise;
let databasePromise;
// بعد از خطای اتصال، تا رفرش صفحه از تلاش‌های تکراری جلوگیری می‌کنیم.
let sourceMemo = null;

function isProductList(value) {
  return Array.isArray(value) && value.every(
    (product) => product && typeof product === "object" && typeof product.id === "string",
  );
}

function loadLocalProducts() {
  if (!localProductsPromise) {
    localProductsPromise = fetch(LOCAL_DATA_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`خواندن data/products.json ناموفق بود (${response.status})`);
        }
        return response.json();
      })
      .then((products) => {
        if (!isProductList(products)) throw new Error("ساختار data/products.json معتبر نیست.");
        return products;
      })
      .catch((error) => {
        localProductsPromise = undefined;
        throw error;
      });
  }
  return localProductsPromise;
}

// SDK مخصوص Realtime Database به‌صورت پویا بارگذاری می‌شود تا اختلال CDN کل سایت را از کار نیندازد.
function loadRealtimeDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const [{ initializeApp }, database] = await Promise.all([
        import(`${SDK_BASE_URL}/firebase-app.js`),
        import(`${SDK_BASE_URL}/firebase-database.js`),
      ]);
      const app = initializeApp(firebaseConfig);
      const db = database.getDatabase(app, firebaseConfig.databaseURL);
      return { db, database };
    })().catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

function withTimeout(promise, ms) {
  let timerId;
  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error(`Realtime Database timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timerId));
}

function normalizeRealtimeProducts(value) {
  if (value === null || value === undefined) return [];

  // داده ممکن است به شکل آرایه (ساختار فعلی) یا آبجکت با کلیدهای push ذخیره شده باشد.
  const entries = Array.isArray(value)
    ? value.map((product, index) => [String(index), product])
    : Object.entries(value);

  return entries
    .filter(([, product]) => product && typeof product === "object")
    .map(([key, product]) => ({
      ...product,
      // در صورت نبود id از کلید رکورد دیتابیس استفاده می‌شود.
      id: typeof product.id === "string" && product.id ? product.id : key,
      createdAt: product.createdAt ?? null,
    }));
}

function readProductsCache() {
  try {
    const raw = sessionStorage.getItem(PRODUCTS_CACHE_KEY);
    if (!raw) return null;

    const cache = JSON.parse(raw);
    if (
      !cache ||
      !Number.isFinite(cache.savedAt) ||
      Date.now() - cache.savedAt < 0 ||
      Date.now() - cache.savedAt >= PRODUCTS_CACHE_TTL_MS ||
      !isProductList(cache.products) ||
      !["local", "realtime-database"].includes(cache.source)
    ) {
      return null;
    }

    return { products: cache.products, source: cache.source };
  } catch {
    return null;
  }
}

function writeProductsCache(products, source) {
  try {
    sessionStorage.setItem(
      PRODUCTS_CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), source, products }),
    );
  } catch {
    // شکست کش نباید مانع دریافت محصولات شود.
  }
}

async function fetchRealtimeProducts({ db, database }) {
  const snapshot = await database.get(database.ref(db, "products"));
  const products = normalizeRealtimeProducts(snapshot.val());
  if (products.length === 0) {
    throw new Error("مسیر products در Realtime Database خالی است یا محصول معتبری ندارد.");
  }
  if (!isProductList(products)) {
    throw new Error("ساختار محصولات در Realtime Database معتبر نیست.");
  }
  return products;
}

async function getProductsFromBestSource() {
  if (DATA_SOURCE === "local" || (DATA_SOURCE === "auto" && sourceMemo === "local")) {
    return { products: await loadLocalProducts(), source: "local" };
  }

  try {
    const products = await withTimeout(
      loadRealtimeDatabase().then(fetchRealtimeProducts),
      DATABASE_TIMEOUT_MS,
    );
    sourceMemo = "realtime-database";
    return { products, source: "realtime-database" };
  } catch (error) {
    if (DATA_SOURCE === "realtime-database") throw error;

    console.warn(
      "Realtime Database در دسترس نیست؛ از data/products.json استفاده می‌شود.",
      error,
    );
    sourceMemo = "local";
    return { products: await loadLocalProducts(), source: "local" };
  }
}

function canUseCachedSource(cache) {
  if (!cache) return false;
  if (DATA_SOURCE === "local") return cache.source === "local";
  if (DATA_SOURCE === "realtime-database") return cache.source === "realtime-database";
  if (sourceMemo === "local") return cache.source === "local";
  if (sourceMemo === "realtime-database") return cache.source === "realtime-database";
  // در حالت auto، کش محلی قدیمی نباید جلوی اولین تلاش برای دیتابیس آنلاین را بگیرد.
  return cache.source === "realtime-database";
}

export async function getAllProducts() {
  const cache = readProductsCache();
  if (canUseCachedSource(cache)) return cache.products;

  const result = await getProductsFromBestSource();
  writeProductsCache(result.products, result.source);
  return result.products;
}

export async function getProductById(productId) {
  if (typeof productId !== "string" || !productId.trim()) return null;

  const products = await getAllProducts();
  return products.find((product) => product.id === productId) ?? null;
}

export async function getProductsByCategory(category) {
  if (typeof category !== "string" || !category.trim()) return [];

  const products = await getAllProducts();
  return products.filter((product) => product.category === category);
}
