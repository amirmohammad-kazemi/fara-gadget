const CART_KEY = "faragadget_cart";

function isValidCartItem(item) {
  return Boolean(
    item &&
      typeof item === "object" &&
      typeof item.id === "string" &&
      item.id.length > 0 &&
      typeof item.productId === "string" &&
      item.productId.length > 0 &&
      typeof item.name === "string" &&
      Number.isFinite(item.price) &&
      item.price >= 0 &&
      Number.isFinite(item.originalPrice) &&
      item.originalPrice >= 0 &&
      Number.isSafeInteger(item.quantity) &&
      item.quantity > 0 &&
      (item.stock == null || (Number.isFinite(item.stock) && item.stock >= 0)) &&
      (item.image == null || typeof item.image === "string") &&
      (item.variantKey == null || typeof item.variantKey === "string"),
  );
}

export function getCartFromStorage() {
  let cartData;
  try {
    cartData = localStorage.getItem(CART_KEY);
  } catch {
    return [];
  }

  if (!cartData) return [];

  let parsed;
  try {
    parsed = JSON.parse(cartData);
  } catch {
    try {
      localStorage.removeItem(CART_KEY);
    } catch {
      // پاک‌نشدن داده‌ی خراب مهم نیست
    }
    return [];
  }

  if (!Array.isArray(parsed)) {
    try {
      localStorage.removeItem(CART_KEY);
    } catch {
      // پاک‌نشدن داده‌ی خراب مهم نیست
    }
    return [];
  }

  const validItems = parsed.filter(isValidCartItem);
  if (validItems.length !== parsed.length) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(validItems));
    } catch {
      // حتی اگه ذخیره نشه، آیتم‌های سالم برگردونده میشن
    }
  }

  return validItems;
}

export function saveCartToStorage(cartItems) {
  if (!Array.isArray(cartItems) || !cartItems.every(isValidCartItem)) return false;

  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    return true;
  } catch {
    return false;
  }
}

export function clearCartStorage() {
  try {
    localStorage.removeItem(CART_KEY);
  } catch {
    // بلاک‌بودن storage نباید صفحه رو از کار بندازه
  }
}
