import { getCartFromStorage, saveCartToStorage } from "./storage.js";

function isValidProduct(product) {
  return Boolean(
    product &&
      typeof product.id === "string" &&
      product.id.length > 0 &&
      typeof product.name === "string" &&
      Number.isFinite(product.price) &&
      product.price >= 0 &&
      (product.discountPrice == null ||
        (Number.isFinite(product.discountPrice) &&
          product.discountPrice >= 0 &&
          product.discountPrice <= product.price)),
  );
}

function getStock(product) {
  if (product.stock == null) return Infinity;
  if (!Number.isFinite(product.stock)) return 0;
  return Math.max(0, Math.floor(product.stock));
}

function getVariantPriceDiff(variant) {
  const value = variant?.priceDiff ?? 0;
  return Number.isFinite(value) ? value : null;
}

function createCartId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// موجودی بین همه‌ی تنوع‌های یک محصول مشترکه
export function canAddToCart(product, additionalQty = 1) {
  if (!isValidProduct(product) || !Number.isSafeInteger(additionalQty) || additionalQty <= 0) {
    return false;
  }

  const stock = getStock(product);
  if (stock <= 0) return false;

  const alreadyInCart = getCartItems()
    .filter((item) => item.productId === product.id)
    .reduce((sum, item) => sum + item.quantity, 0);

  return alreadyInCart + additionalQty <= stock;
}

export function addToCart(product, selectedVariant, quantity = 1) {
  if (!isValidProduct(product) || !canAddToCart(product, quantity)) return false;

  const variantDiff = getVariantPriceDiff(selectedVariant);
  if (variantDiff === null) return false;

  const originalPrice = product.price + variantDiff;
  const price = (product.discountPrice ?? product.price) + variantDiff;
  if (!Number.isFinite(originalPrice) || !Number.isFinite(price) || price < 0 || originalPrice < 0) {
    return false;
  }

  const cartItems = getCartItems();
  const variantKey = JSON.stringify(selectedVariant ?? {});
  const existingItem = cartItems.find(
    (item) => item.productId === product.id && item.variantKey === variantKey,
  );

  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.stock = product.stock ?? null;
    existingItem.price = price;
    existingItem.originalPrice = originalPrice;
  } else {
    cartItems.push({
      id: createCartId(),
      productId: product.id,
      name: product.name,
      brand: typeof product.brand === "string" ? product.brand : "",
      originalPrice,
      price,
      image: Array.isArray(product.images) && typeof product.images[0] === "string"
        ? product.images[0]
        : "",
      variant: selectedVariant ?? null,
      variantKey,
      quantity,
      stock: product.stock ?? null,
    });
  }

  return saveCartToStorage(cartItems);
}

export function removeFromCart(cartItemId) {
  if (typeof cartItemId !== "string") return;
  const updatedCartItems = getCartItems().filter((item) => item.id !== cartItemId);
  saveCartToStorage(updatedCartItems);
}

export function updateQuantity(cartItemId, newQuantity) {
  if (typeof cartItemId !== "string" || !Number.isSafeInteger(newQuantity)) return;

  if (newQuantity <= 0) {
    removeFromCart(cartItemId);
    return;
  }

  const cartItems = getCartItems();
  const existingItem = cartItems.find((item) => item.id === cartItemId);
  if (!existingItem) return;

  const otherRowsQuantity = cartItems
    .filter((item) => item.productId === existingItem.productId && item.id !== cartItemId)
    .reduce((sum, item) => sum + item.quantity, 0);
  const stock = existingItem.stock == null ? Infinity : getStock(existingItem);
  const maxQuantity = Math.max(0, stock - otherRowsQuantity);

  if (maxQuantity < 1) {
    removeFromCart(cartItemId);
    return;
  }

  existingItem.quantity = Math.min(newQuantity, maxQuantity);
  saveCartToStorage(cartItems);
}

export function getCartItems() {
  return getCartFromStorage();
}

export function getCartSubtotal() {
  return getCartItems().reduce(
    (total, item) => total + item.originalPrice * item.quantity,
    0,
  );
}

export function getCartTotal() {
  return getCartItems().reduce((total, item) => total + item.price * item.quantity, 0);
}

export function getCartItemCount() {
  return getCartItems().reduce((count, item) => count + item.quantity, 0);
}

export function clearCart() {
  saveCartToStorage([]);
}
