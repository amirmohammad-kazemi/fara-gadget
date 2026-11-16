import { initScrollReveal } from "./modules/scroll-reveal.js";
import { initTheme } from "./modules/theme.js";
import { initMobileNav } from "./modules/mobile-nav.js";
import { showToast } from "./modules/toast.js";

const page = document.body.dataset.page;

// بخش‌های مشترک فوری بالا میان؛ کد هر صفحه فقط وقتی لازمه لود میشه
initScrollReveal();
initTheme();
initMobileNav();

const pageInitializers = {
  home: async () => {
    const { initHomePage } = await import("./pages/home.js");
    await initHomePage();
  },
  product: async () => {
    const { initProductPage } = await import("./pages/product.js");
    await initProductPage();
  },
  cart: async () => {
    const { initCartPage } = await import("./pages/cart.js");
    await initCartPage();
  },
  shop: async () => {
    const { initShopPage } = await import("./pages/shop.js");
    await initShopPage();
  },
};

const initializePage = pageInitializers[page];

if (initializePage) {
  try {
    await initializePage();
  } catch (error) {
    console.error(`راه‌اندازی صفحه‌ی «${page}» ناموفق بود:`, error);
    showToast({
      type: "error",
      title: "بارگذاری صفحه ناموفق بود",
      message: "لطفاً صفحه را دوباره بارگذاری کن.",
    });
  }
} else {
  console.warn(`صفحه‌ی ناشناخته: ${page || "بدون data-page"}`);
}

document.querySelector("#account-btn")?.addEventListener("click", () => {
  showToast({
    type: "info",
    title: "به‌زودی...",
    message: "سیستم حساب کاربری هنوز اضافه نشده — این قابلیت به‌زودی میاد.",
  });
});
