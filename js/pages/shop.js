import { getAllProducts } from "../modules/api.js";
import { showToast } from "../modules/toast.js";

import {
  renderProductGrid,
  updateCartBadge,
  bumpCartBadge,
  toPersianDigits,
  escapeHtml,
} from "../modules/render.js";

import {
  searchProducts,
  filterByBrand,
  filterByCategory,
  filterByPriceRange,
  sortProducts,
} from "../modules/filters.js";

import { getCartItemCount, addToCart } from "../modules/cart.js";

let products = [];

let currentFilteredProducts = [];
let visibleCount = 0;
// صفحه‌بندی سمت کلاینت: همه‌ی نتایج تو حافظه‌ن، فقط تدریجی رندر میشن
const PAGE_SIZE = 8;

const categoryNames = {
  laptop: "لپ‌تاپ",
  mobile: "موبایل",
  tablet: "تبلت",
  headphone: "هدفون",
  smartwatch: "ساعت هوشمند",
  gaming: "گیمینگ",
  accessories: "لوازم جانبی",
};

// fn فقط بعد از `delay` میلی‌ثانیه سکوت اجرا میشه (برای جستجو)
function debounce(fn, delay = 250) {
  let timerId;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), delay);
  };
}

function applyFilters() {
  const params = new URLSearchParams(location.search);

  const query = params.get("q");

  const selectedCategories = [
    ...document.querySelectorAll('input[name="category"]:checked'),
  ].map((checkbox) => checkbox.value);

  let filteredProducts = filterByCategory(products, selectedCategories);

  filteredProducts = searchProducts(filteredProducts, query);

  const selectedBrands = [
    ...document.querySelectorAll('input[name="brand"]:checked'),
  ].map((checkbox) => checkbox.value);

  filteredProducts = filterByBrand(filteredProducts, selectedBrands);

  const minPriceInput = document.querySelector("#price-min");
  const maxPriceInput = document.querySelector("#price-max");

  const minPrice = minPriceInput.value ? Number(minPriceInput.value) : null;

  const maxPrice = maxPriceInput.value ? Number(maxPriceInput.value) : null;

  filteredProducts = filterByPriceRange(filteredProducts, minPrice, maxPrice);

  const sortSelect = document.querySelector("#sort-by");
  const sortKey = sortSelect.value;

  filteredProducts = sortProducts(filteredProducts, sortKey);

  const resultsGrid = document.querySelector("#results-grid");
  const noResults = document.querySelector("#no-results");
  const resultsCount = document.querySelector("#results-count");
  const loadMoreWrap = document.querySelector("#load-more-wrap");

  resultsCount.textContent = toPersianDigits(filteredProducts.length);

  currentFilteredProducts = filteredProducts;
  visibleCount = Math.min(PAGE_SIZE, filteredProducts.length);

  if (filteredProducts.length === 0) {
    const onlyCategoryChosen =
      selectedCategories.length > 0 &&
      !query &&
      selectedBrands.length === 0 &&
      minPrice === null &&
      maxPrice === null;

    noResults.querySelector("h2").textContent = onlyCategoryChosen
      ? "این دسته هنوز محصولی ندارد"
      : "محصولی پیدا نشد";
    noResults.querySelector("p").textContent = onlyCategoryChosen
      ? "به‌زودی محصولات جدید اضافه می‌شن. تا اون موقع می‌تونی دسته‌های دیگه رو ببینی."
      : "می‌تونی فیلترها رو پاک کنی یا با کلمه‌ی دیگه‌ای جستجو کنی.";

    loadMoreWrap.classList.add("hidden");
    resultsGrid.classList.add("hidden");
    noResults.classList.remove("hidden");
  } else {
    resultsGrid.classList.remove("hidden");
    noResults.classList.add("hidden");

    renderProductGrid(currentFilteredProducts.slice(0, visibleCount), resultsGrid);

    loadMoreWrap.classList.toggle(
      "hidden",
      visibleCount >= currentFilteredProducts.length,
    );
  }

  const shopTitle = document.querySelector("#shop-title");
  const shopSubtitle = document.querySelector("#shop-subtitle");

  if (query) {
    shopTitle.textContent = `نتیجه جستجو برای "${query}"`;

    shopSubtitle.textContent = `${toPersianDigits(filteredProducts.length)} محصول با جستجوی شما پیدا شد`;
  } else if (selectedCategories.length === 1) {
    shopTitle.textContent = categoryNames[selectedCategories[0]] ?? selectedCategories[0];

    shopSubtitle.textContent = `${toPersianDigits(filteredProducts.length)} محصول در این دسته پیدا شد`;
  } else if (selectedCategories.length > 1) {
    shopTitle.textContent = "چند دسته‌ی انتخاب‌شده";

    shopSubtitle.textContent = `${toPersianDigits(filteredProducts.length)} محصول پیدا شد`;
  } else {
    shopTitle.textContent = "همه محصولات";

    shopSubtitle.textContent = "همه‌ی کالاهای موجود تو فراگجت";
  }
}

function syncFiltersWithUrl() {
  const params = new URLSearchParams(location.search);

  const query = params.get("q");

  const selectedCategories = params.getAll("category");

  const selectedBrands = params.getAll("brand");

  const categoryCheckboxes = document.querySelectorAll('input[name="category"]');

  categoryCheckboxes.forEach((checkbox) => {
    checkbox.checked = selectedCategories.includes(checkbox.value);
  });

  const brandCheckboxes = document.querySelectorAll('input[name="brand"]');

  brandCheckboxes.forEach((checkbox) => {
    checkbox.checked = selectedBrands.includes(checkbox.value);
  });

  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");

  const sort = params.get("sort");

  const searchInput = document.querySelector("#site-search");

  const minPriceInput = document.querySelector("#price-min");

  const maxPriceInput = document.querySelector("#price-max");

  const sortSelect = document.querySelector("#sort-by");

  searchInput.value = query ?? "";

  minPriceInput.value = minPrice ?? "";

  maxPriceInput.value = maxPrice ?? "";

  sortSelect.value = sort ?? "newest";
}

// replace=true برای تغییرات پیوسته (تایپ) تا history پر نشه
function syncUrlWithFilters(replace = false) {
  const params = new URLSearchParams();

  const searchInput = document.querySelector("#site-search");

  const query = searchInput.value.trim();

  if (query) {
    params.set("q", query);
  }

  const selectedCategories = [
    ...document.querySelectorAll('input[name="category"]:checked'),
  ].map((checkbox) => checkbox.value);

  selectedCategories.forEach((category) => {
    params.append("category", category);
  });

  const selectedBrands = [
    ...document.querySelectorAll('input[name="brand"]:checked'),
  ].map((checkbox) => checkbox.value);

  selectedBrands.forEach((brand) => {
    params.append("brand", brand);
  });

  const minPriceInput = document.querySelector("#price-min");

  const maxPriceInput = document.querySelector("#price-max");

  if (minPriceInput.value) {
    params.set("minPrice", minPriceInput.value);
  }

  if (maxPriceInput.value) {
    params.set("maxPrice", maxPriceInput.value);
  }

  const sortSelect = document.querySelector("#sort-by");

  if (sortSelect.value !== "newest") {
    params.set("sort", sortSelect.value);
  }

  const newUrl = params.toString()
    ? `${location.pathname}?${params.toString()}`
    : location.pathname;

  if (replace) {
    history.replaceState(null, "", newUrl);
  } else {
    history.pushState(null, "", newUrl);
  }
}

function clearFilters() {
  const categoryCheckboxes = document.querySelectorAll('input[name="category"]');

  const brandCheckboxes = document.querySelectorAll('input[name="brand"]');

  categoryCheckboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });

  brandCheckboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });

  const searchInput = document.querySelector("#site-search");

  const minPriceInput = document.querySelector("#price-min");

  const maxPriceInput = document.querySelector("#price-max");

  const sortSelect = document.querySelector("#sort-by");

  searchInput.value = "";

  minPriceInput.value = "";

  maxPriceInput.value = "";

  sortSelect.value = "newest";

  history.replaceState(null, "", location.pathname);

  applyFilters();
}

function showMoreProducts() {
  const resultsGrid = document.querySelector("#results-grid");
  const loadMoreWrap = document.querySelector("#load-more-wrap");

  visibleCount = Math.min(visibleCount + PAGE_SIZE, currentFilteredProducts.length);

  renderProductGrid(currentFilteredProducts.slice(0, visibleCount), resultsGrid);

  loadMoreWrap.classList.toggle("hidden", visibleCount >= currentFilteredProducts.length);
}

function buildBrandFilterList() {
  const brandListEl = document.querySelector("#brand-filter-list");
  if (!brandListEl) return;

  const uniqueBrands = [...new Set(products.map((product) => product.brand))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "fa"));

  brandListEl.innerHTML = uniqueBrands
    .map((brand) => {
      const safeBrand = escapeHtml(brand);
      return `
        <label class="filter-option">
          <input type="checkbox" name="brand" value="${safeBrand}"> ${safeBrand}
        </label>
      `;
    })
    .join("");
}

function setupFiltersToggle() {
  const toggleBtn = document.querySelector("#filters-toggle");
  const panel = document.querySelector("#filters-panel");
  if (!toggleBtn || !panel) return;

  toggleBtn.addEventListener("click", () => {
    const isOpen = panel.classList.toggle("is-open");
    toggleBtn.setAttribute("aria-expanded", String(isOpen));
  });
}

function setupFilterEvents() {
  setupFiltersToggle();

  const categoryCheckboxes = document.querySelectorAll('input[name="category"]');

  categoryCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      syncUrlWithFilters();
      applyFilters();
    });
  });

  const brandCheckboxes = document.querySelectorAll('input[name="brand"]');

  brandCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      syncUrlWithFilters();
      applyFilters();
    });
  });

  const searchInput = document.querySelector("#site-search");

  const debouncedSearch = debounce(() => {
    syncUrlWithFilters(true);
    applyFilters();
  }, 250);

  searchInput.addEventListener("input", debouncedSearch);

  const searchForm = searchInput.closest("form");

  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      syncUrlWithFilters();
      applyFilters();
    });
  }

  const minPriceInput = document.querySelector("#price-min");

  minPriceInput.addEventListener("change", () => {
    syncUrlWithFilters();
    applyFilters();
  });

  const maxPriceInput = document.querySelector("#price-max");

  maxPriceInput.addEventListener("change", () => {
    syncUrlWithFilters();
    applyFilters();
  });

  const sortSelect = document.querySelector("#sort-by");

  sortSelect.addEventListener("change", () => {
    syncUrlWithFilters();
    applyFilters();
  });

  const clearFiltersBtn = document.querySelector("#clear-filters-btn");

  clearFiltersBtn.addEventListener("click", () => {
    clearFilters();
  });

  document.querySelector("#load-more-btn").addEventListener("click", showMoreProducts);

  document.querySelector("#results-grid").addEventListener("click", (event) => {
    const button = event.target.closest(".quick-add-btn");
    if (!button) return;

    const currentProduct = products.find(
      (product) => product.id === button.dataset.productId,
    );
    if (!currentProduct) return;

    const added = addToCart(currentProduct);
    if (!added) {
      showToast({ type: "warning", title: "موجودی کافی نیست" });
      return;
    }
    updateCartBadge(getCartItemCount());
    bumpCartBadge();

    showToast({
      type: "success",
      title: "به سبد خرید اضافه شد",
      message: currentProduct.name,
    });
  });
}

function setupUrlNavigation() {
  // دکمه‌ی Back/Forward مرورگر: فیلترها دوباره از URL خونده میشن
  window.addEventListener("popstate", () => {
    syncFiltersWithUrl();
    applyFilters();
  });
}

export async function initShopPage() {
  try {
    products = await getAllProducts();
  } catch (error) {
    console.error("خطا در دریافت محصولات:", error);

    const resultsGrid = document.querySelector("#results-grid");
    const noResults = document.querySelector("#no-results");
    resultsGrid.classList.add("hidden");
    resultsGrid.innerHTML = "";
    noResults.querySelector("h2").textContent = "مشکلی پیش اومد";
    noResults.querySelector("p").textContent =
      "دریافت محصولات با خطا مواجه شد. لطفاً دوباره امتحان کن.";
    noResults.classList.remove("hidden");

    showToast({
      type: "error",
      title: "مشکلی پیش اومد",
      message: "دریافت اطلاعات با خطا مواجه شد. لطفاً دوباره امتحان کن.",
    });
    return;
  }

  buildBrandFilterList();

  syncFiltersWithUrl();

  applyFilters();

  setupFilterEvents();

  setupUrlNavigation();

  updateCartBadge(getCartItemCount());
}
