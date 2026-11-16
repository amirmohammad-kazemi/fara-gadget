import { getAllProducts } from "../modules/api.js";
import { showToast } from "../modules/toast.js";
import {
  renderProductGrid,
  renderHeroText,
  renderSkeletonCards,
  updateCartBadge,
  bumpCartBadge,
} from "../modules/render.js";
import { getCartItemCount, addToCart } from "../modules/cart.js";
import { initHeroTilt } from "../modules/hero-tilt.js";
import { pickFeaturedProduct } from "../modules/filters.js";

function showHero(product) {
  const heroText = document.querySelector("#hero-text");
  const heroLink = document.querySelector("#hero-link");
  const heroImg = document.querySelector("#hero-img");
  if (!heroText || !heroLink || !heroImg) return;

  heroText.innerHTML = renderHeroText(product);
  heroLink.href = `product.html?id=${encodeURIComponent(product.id)}`;
  heroLink.setAttribute("aria-label", product.name);

  const imageName = typeof product.images?.[0] === "string" ? product.images[0] : "";
  if (imageName) {
    heroImg.src = encodeURI(`assets/images/${imageName}`);
    heroImg.alt = product.name;
    heroImg.hidden = false;
  }

  heroText.querySelector("#hero-add-to-cart-btn")?.addEventListener("click", () => {
    if (!addToCart(product)) {
      showToast({ type: "warning", title: "موجودی کافی نیست" });
      return;
    }
    updateCartBadge(getCartItemCount());
    bumpCartBadge();
    showToast({ type: "success", title: "به سبد خرید اضافه شد", message: product.name });
  });
}

function hideHero() {
  document.querySelector(".hero")?.classList.add("hidden");
}

export async function initHomePage() {
  updateCartBadge(getCartItemCount());
  initHeroTilt();

  const productContainer = document.querySelector("#product-grid");
  const emptyContainer = document.querySelector("#emptyContainer");

  productContainer.innerHTML = renderSkeletonCards(8);

  let products = [];

  try {
    products = await getAllProducts();
  } catch (error) {
    console.error("خطا در دریافت محصولات:", error);
    hideHero();
    productContainer.innerHTML = "";
    emptyContainer.classList.remove("hidden");
    showToast({
      type: "error",
      title: "مشکلی پیش اومد",
      message: "دریافت اطلاعات با خطا مواجه شد. لطفاً دوباره امتحان کن.",
    });
    return;
  }

  if (products.length === 0) {
    hideHero();
    productContainer.innerHTML = "";
    emptyContainer.classList.remove("hidden");
    return;
  }

  showHero(pickFeaturedProduct(products));
  renderProductGrid(products, productContainer);

  productContainer.addEventListener("click", (event) => {
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
