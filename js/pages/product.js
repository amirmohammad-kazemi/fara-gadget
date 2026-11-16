import { getProductById } from "../modules/api.js";
import {
  renderProductDetail,
  renderSkeletonDetail,
  updateCartBadge,
  bumpCartBadge,
  formatPrice,
  toPersianDigits,
} from "../modules/render.js";
import { showToast } from "../modules/toast.js";
import { addToCart, getCartItemCount } from "../modules/cart.js";

const categoryNames = {
  laptop: "لپ‌تاپ",
  mobile: "موبایل",
  tablet: "تبلت",
  headphone: "هدفون",
  smartwatch: "ساعت هوشمند",
  gaming: "گیمینگ",
  accessories: "لوازم جانبی",
};

function showNotFound(productContainer) {
  productContainer.innerHTML = `
    <div class="empty-state">
      <h2>محصول پیدا نشد!</h2>
      <p>ممکنه محصول حذف شده باشه یا لینک اشتباه باشه.</p>
      <a href="shop.html" class="btn btn-primary">
        مشاهده محصولات
      </a>
    </div>
  `;
}

function setupTabs() {
  const tabsWrap = document.querySelector("#detail-tabs");
  if (!tabsWrap) return;

  tabsWrap.addEventListener("click", (event) => {
    const tabBtn = event.target.closest("[data-tab]");
    if (!tabBtn) return;

    tabsWrap.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.classList.remove("active");
      btn.setAttribute("aria-selected", "false");
    });
    tabBtn.classList.add("active");
    tabBtn.setAttribute("aria-selected", "true");

    tabsWrap.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.add("hidden");
    });
    tabsWrap.querySelector(`#tab-${tabBtn.dataset.tab}`)?.classList.remove("hidden");
  });
}

export async function initProductPage() {
  updateCartBadge(getCartItemCount());
  setupTabs();

  const params = new URLSearchParams(location.search);
  const productId = params.get("id");
  const productContainer = document.querySelector("#product-detail");

  productContainer.innerHTML = renderSkeletonDetail();

  let product;

  try {
    product = await getProductById(productId);
  } catch (error) {
    console.error("خطا در دریافت محصول:", error);
    showToast({
      type: "error",
      title: "مشکلی پیش اومد",
      message: "دریافت اطلاعات با خطا مواجه شد. لطفاً دوباره امتحان کن.",
    });
    showNotFound(productContainer);
    return;
  }

  if (!product) {
    showNotFound(productContainer);
    return;
  }

  const pageTitle = `${product.name} | فراگجت`;
  const productDescription = product.description ??
    `${product.name} از برند ${product.brand}، با مشخصات فنی به‌روز و گارانتی اصالت کالا، آماده‌ی ارسال از فراگجت.`;

  document.title = pageTitle;
  document.querySelector('meta[name="description"]')?.setAttribute("content", productDescription);
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", pageTitle);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", productDescription);
  if (typeof product.images?.[0] === "string") {
    const imageUrl = new URL(`assets/images/${encodeURI(product.images[0])}`, document.baseURI);
    document.querySelector('meta[property="og:image"]')?.setAttribute("content", imageUrl.href);
  }

  const breadcrumbCategory = document.querySelector("#breadcrumb-category");
  if (breadcrumbCategory) {
    breadcrumbCategory.textContent = categoryNames[product.category] ?? product.category;
    breadcrumbCategory.href = `shop.html?category=${encodeURIComponent(product.category)}`;
  }
  const breadcrumbCurrent = document.querySelector("#breadcrumb-current");
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = product.name;

  const descriptionEl = document.querySelector("#product-description");
  if (descriptionEl) {
    descriptionEl.textContent = productDescription;
  }

  const reviewsTabBtn = document.querySelector('[data-tab="reviews"]');
  if (reviewsTabBtn) {
    reviewsTabBtn.textContent = `نظرات کاربران (${toPersianDigits(product.reviewCount ?? 0)})`;
  }

  const html = renderProductDetail(product);
  productContainer.innerHTML = html;

  const currentQuantityInput = document.querySelector("#qty-value");
  const qtyPlusBtn = document.querySelector("#qty-plus");
  const qtyMinusBtn = document.querySelector("#qty-minus");
  const galleryThumbs = document.querySelectorAll(".gallery-thumb");
  const galleryMainImg = document.querySelector("#gallery-main-img");
  const currentPriceEl = document.querySelector("#current-price");
  const addToCartBtn = document.querySelector("#add-to-cart-btn");

  const basePrice = product.discountPrice ?? product.price;

  let selectedVariant = Array.isArray(product.variants)
    ? product.variants.find((variant) => variant && typeof variant === "object") ?? null
    : null;

  const availableStock = Number.isFinite(product.stock)
    ? Math.max(0, Math.floor(product.stock))
    : Infinity;

  qtyMinusBtn.disabled = true;

  if (availableStock <= 0) {
    addToCartBtn.disabled = true;
    addToCartBtn.textContent = "ناموجود";
    qtyPlusBtn.disabled = true;
    qtyMinusBtn.disabled = true;
  } else if (Number(currentQuantityInput.value) >= availableStock) {
    qtyPlusBtn.disabled = true;
  }

  productContainer.addEventListener("click", (event) => {
    if (event.target.closest("#qty-plus")) {
      const nextValue = Number(currentQuantityInput.value) + 1;
      if (nextValue > availableStock) return;

      currentQuantityInput.value = nextValue;
      qtyPlusBtn.disabled = nextValue >= availableStock;
      qtyMinusBtn.disabled = false;
      return;
    }

    if (event.target.closest("#qty-minus")) {
      if (Number(currentQuantityInput.value) < 2) {
        return;
      }
      currentQuantityInput.value = Number(currentQuantityInput.value) - 1;
      qtyPlusBtn.disabled = Number(currentQuantityInput.value) >= availableStock;
      qtyMinusBtn.disabled = Number(currentQuantityInput.value) < 2;
      return;
    }

    if (event.target.closest("#add-to-cart-btn")) {
      const added = addToCart(
        product,
        selectedVariant,
        Number(currentQuantityInput.value),
      );
      if (!added) {
        showToast({ type: "warning", title: "موجودی کافی نیست" });
        return;
      }
      updateCartBadge(getCartItemCount());
      bumpCartBadge();

      showToast({
        type: "success",
        title: "به سبد خرید اضافه شد",
        message: product.name,
      });
      return;
    }

    const thumbBtn = event.target.closest(".gallery-thumb");
    if (thumbBtn) {
      galleryThumbs.forEach((btn) => btn.classList.remove("active"));
      galleryMainImg.src = thumbBtn.dataset.img;
      thumbBtn.classList.add("active");
      return;
    }

    const variantBtn = event.target.closest(".option-pill");
    if (variantBtn && Array.isArray(product.variants)) {
      const variantIndex = Number(variantBtn.dataset.variantIndex);
      if (!Number.isSafeInteger(variantIndex) || !product.variants[variantIndex]) return;
      selectedVariant = product.variants[variantIndex];

      document.querySelectorAll(".option-pill").forEach((pill) => {
        pill.classList.remove("selected");
        pill.setAttribute("aria-pressed", "false");
      });
      variantBtn.classList.add("selected");
      variantBtn.setAttribute("aria-pressed", "true");

      const variantDiff = selectedVariant.priceDiff ?? 0;
      const newPrice = basePrice + variantDiff;
      currentPriceEl.textContent = `${formatPrice(newPrice)} تومان`;

      const oldPriceEl = document.querySelector("#old-price");
      if (oldPriceEl) oldPriceEl.textContent = formatPrice(product.price + variantDiff);

      const discountTagEl = document.querySelector("#discount-tag");
      if (discountTagEl) {
        const percent = Math.round(
          ((product.price - basePrice) / (product.price + variantDiff)) * 100,
        );
        discountTagEl.textContent = `${toPersianDigits(percent)}٪`;
      }
    }
  });
}
