import {
  getCartItems,
  canAddToCart,
  updateQuantity,
  removeFromCart,
  getCartSubtotal,
  getCartTotal,
  getCartItemCount,
} from "../modules/cart.js";

import {
  renderCartPage,
  updateCartBadge,
  renderCartSummary,
  bumpCartBadge,
} from "../modules/render.js";

import { showToast } from "../modules/toast.js";

export function initCartPage() {

  const cartItems = getCartItems();

  renderCartPage(cartItems);

  const subtotal = getCartSubtotal();
  const total = getCartTotal();

  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  renderCartSummary(subtotal, total, itemCount);

  updateCartBadge(getCartItemCount());

  const cartItemsEl = document.querySelector("#cart-items");

  cartItemsEl.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) {
      return;
    }

    const cartRow = button.closest(".cart-row");

    if (!cartRow) {
      return;
    }

    const cartItemId = cartRow.dataset.id;

    if (button.classList.contains("qty-plus")) {
      const input = cartRow.querySelector("input");
      const currentQuantity = Number(input.value);
      const cartItem = getCartItems().find((item) => item.id === cartItemId);

      const canIncrease =
        cartItem && canAddToCart({ ...cartItem, id: cartItem.productId });

      if (!canIncrease) {
        showToast({ type: "warning", title: "موجودی کافی نیست" });
      } else {
        updateQuantity(cartItemId, currentQuantity + 1);
        bumpCartBadge();
      }
    }

    if (button.classList.contains("qty-minus")) {
      const input = cartRow.querySelector("input");
      const currentQuantity = Number(input.value);

      updateQuantity(cartItemId, currentQuantity - 1);
    }

    if (button.classList.contains("remove-btn")) {
      removeFromCart(cartItemId);
    }

    const updatedCartItems = getCartItems();

    renderCartPage(updatedCartItems);

    const updatedSubtotal = getCartSubtotal();
    const updatedTotal = getCartTotal();

    const updatedItemCount = updatedCartItems.reduce(
      (count, item) => count + item.quantity,
      0,
    );

    renderCartSummary(updatedSubtotal, updatedTotal, updatedItemCount);

    updateCartBadge(getCartItemCount());
  });

  const checkoutBtn = document.querySelector("#checkout-btn");

  checkoutBtn.addEventListener("click", () => {
    showToast({
      type: "info",
      title: "به‌زودی...",
      message: "درگاه پرداخت هنوز وصل نشده — این قابلیت به‌زودی اضافه می‌شه.",
    });
  });

  const promoInput = document.querySelector("#promo-code");
  const promoBtn = promoInput?.closest(".promo-row")?.querySelector("button");

  promoBtn?.addEventListener("click", () => {
    const code = promoInput.value.trim().toUpperCase();

    if (!code) {
      showToast({
        type: "warning",
        title: "کد تخفیف رو وارد کن",
      });
      return;
    }

    if (code === "FARA10") {
      showToast({
        type: "info",
        title: "کد شناسایی شد",
        message: "اعمال تخفیف و محاسبه‌ی مبلغ نهایی در این نسخه‌ی نمایشی فعال نیست.",
      });
    } else {
      showToast({
        type: "error",
        title: "کد تخفیف نامعتبره",
        message: "این کد رو پیدا نکردیم یا منقضی شده.",
      });
    }
  });
}
