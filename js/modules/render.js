export function formatPrice(amount) {
  const safeAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return toPersianDigits(safeAmount.toLocaleString("en-US"));
}

export function toPersianDigits(value) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(value).replace(/\d/g, (d) => persianDigits[d]);
}

// هر متنی که از دیتا وارد innerHTML میشه باید از اینجا رد بشه (XSS)
export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char];
  });
}

function getDiscountPercent(product) {
  if (
    !Number.isFinite(product.price) ||
    product.price <= 0 ||
    !Number.isFinite(product.discountPrice) ||
    product.discountPrice >= product.price
  ) return 0;
  return Math.round(((product.price - product.discountPrice) / product.price) * 100);
}

export function renderProductCard(product, index = 0) {
  const price = product.discountPrice ?? product.price;
  const discountPercent = getDiscountPercent(product);
  const name = escapeHtml(product.name);
  const brand = escapeHtml(product.brand);
  const imageName = typeof product.images?.[0] === "string" ? product.images[0] : "";
  const imagePath = escapeHtml(encodeURI(`assets/images/${imageName}`));
  const outOfStock = (product.stock ?? 0) <= 0;

  return `
    <div class="product-card card-enter" style="--i:${index}">
      <div class="thumb">
        ${
          discountPercent > 0
            ? `<span class="badge-discount">${toPersianDigits(discountPercent)}٪ تخفیف</span>`
            : ""
        }

        <img src="${imagePath}" alt="${name}" loading="lazy" decoding="async">

        <button
          type="button"
          class="quick-add-btn"
          data-product-id="${escapeHtml(product.id)}"
          aria-label="افزودن سریع ${name} به سبد"
          ${outOfStock ? "disabled" : ""}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </div>

      <div class="body">
        <span class="brand">${brand}</span>

        <h3 class="name">
          <a href="product.html?id=${encodeURIComponent(product.id)}" class="card-link">
            ${name}
          </a>
        </h3>

        <div class="rating">
          <span class="star" aria-hidden="true">★</span>
          ${toPersianDigits(product.rating)}
          <span style="color:var(--text-faint)">
            (${toPersianDigits(product.reviewCount)} نظر)
          </span>
        </div>

        <div class="price-row">
          <span class="price">
            ${formatPrice(price)} تومان
          </span>

          ${
            product.discountPrice
              ? `<span class="price-old">
                  ${formatPrice(product.price)}
                </span>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

export function renderSkeletonCards(count = 8) {
  const skeletonCard = `
    <div class="skeleton-card">
      <div class="thumb"></div>
      <div class="body">
        <div class="skeleton-line w-40"></div>
        <div class="skeleton-line w-90"></div>
        <div class="skeleton-line w-60"></div>
      </div>
    </div>
  `;

  return skeletonCard.repeat(count);
}

export function renderSkeletonDetail() {
  return `
    <div class="skeleton-detail">
      <div>
        <div class="skeleton-gallery-main"></div>
        <div class="skeleton-thumbs"><span></span><span></span><span></span></div>
      </div>
      <div class="skeleton-info">
        <div class="skeleton-line w-40"></div>
        <div class="skeleton-line w-90" style="height:22px; margin-top:8px;"></div>
        <div class="skeleton-line w-60"></div>
        <div class="skeleton-line w-90" style="height:60px; margin-top:20px;"></div>
        <div class="skeleton-line w-40" style="height:44px; margin-top:20px;"></div>
      </div>
    </div>
  `;
}

export function renderProductGrid(products, containerEl) {
  const html = products
    .map((product, index) => renderProductCard(product, index % 12))
    .join("");

  containerEl.innerHTML = html;
}
export function renderProductDetail(product) {
  const price = product.discountPrice ?? product.price;

  const initialVariantDiff = product.variants?.[0]?.priceDiff ?? 0;
  const initialPrice = price + initialVariantDiff;

  const discountPercent = getDiscountPercent(product);
  const name = escapeHtml(product.name);
  const brand = escapeHtml(product.brand);

  const images = Array.isArray(product.images) ? product.images.filter((image) => typeof image === "string") : [];
  const safeImages = images.length ? images : [""];
  const mainImage = escapeHtml(encodeURI(`assets/images/${safeImages[0]}`));

  const galleryThumbs = safeImages
    .map((image, index) => {
      const imagePath = escapeHtml(encodeURI(`assets/images/${image}`));

      return `
        <button
          type="button"
          class="gallery-thumb ${index === 0 ? "active" : ""}"
          data-img="${imagePath}"
          aria-label="تصویر ${index + 1} ${name}"
        >
          <img src="${imagePath}" alt="" loading="lazy" decoding="async">
        </button>
      `;
    })
    .join("");

  const specs = Object.entries(product.specs ?? {})
    .map(([key, value]) => {
      return `
        <tr>
          <td>${escapeHtml(key)}</td>
          <td>${escapeHtml(value)}</td>
        </tr>
      `;
    })
    .join("");

  const variants = Array.isArray(product.variants)
    ? product.variants
        .map((variant, index) => ({ variant, index }))
        .filter(({ variant }) => variant && typeof variant === "object")
    : [];

  const variantOptions =
    variants.length > 0
      ? `
    <div class="option-group" id="variant-options">
      <div class="label">گزینه‌ها</div>
      <div class="option-pills">
        ${variants
          .map(({ variant, index }) => {
            const { priceDiff, ...attributes } = variant;
            const label = escapeHtml(Object.values(attributes).join(" / "));

            return `
              <button
                type="button"
                class="option-pill ${index === 0 ? "selected" : ""}"
                data-variant-index="${index}"
                aria-pressed="${index === 0}"
              >
                ${label}
              </button>
            `;
          })
          .join("")}
      </div>
    </div>
  `
      : "";

  return `
    <div class="gallery">
      <div class="gallery-main">
        <img
          id="gallery-main-img"
          src="${mainImage}"
          alt="${name}"
          fetchpriority="high"
          decoding="async"
        >
      </div>

      <div class="gallery-thumbs" id="gallery-thumbs">
        ${galleryThumbs}
      </div>
    </div>

    <div class="product-info">
      <a href="shop.html?category=${encodeURIComponent(product.category)}" class="brand-link">
        ${brand}
      </a>

      <h1>${name}</h1>

      <div class="rating-row">
        <span>
          <span class="star" aria-hidden="true">★</span>
          ${toPersianDigits(product.rating)}
        </span>

        <span>(${toPersianDigits(product.reviewCount)} نظر)</span>

        <span class="stock-ok">
          ${product.stock > 0 ? "موجود در انبار" : "ناموجود"}
        </span>
      </div>

      <div class="price-block">
        <span class="current" id="current-price">
          ${formatPrice(initialPrice)} تومان
        </span>

        ${
          product.discountPrice
            ? `<span class="old" id="old-price">
                ${formatPrice(product.price)}
              </span>`
            : ""
        }

        ${
          discountPercent > 0
            ? `<span class="discount-tag" id="discount-tag">${toPersianDigits(discountPercent)}٪</span>`
            : ""
        }
      </div>

      ${variantOptions}

      <div class="purchase-row">
        <div class="qty-control">
          <button type="button" id="qty-minus" aria-label="کاهش تعداد">−</button>
          <input type="text" value="1" id="qty-value" readonly aria-label="تعداد" aria-live="polite">
          <button type="button" id="qty-plus" aria-label="افزایش تعداد">+</button>
        </div>

        <button
          type="button"
          class="btn btn-primary"
          id="add-to-cart-btn"
          data-product-id="${escapeHtml(product.id)}"
        >
          افزودن به سبد خرید
        </button>
      </div>

      <table class="specs-table">
        ${specs}
      </table>
    </div>
  `;
}
export function renderCartRow(cartItem) {
  const imagePath = escapeHtml(encodeURI(`assets/images/${cartItem.image ?? ""}`));
  const lineTotal = cartItem.price * cartItem.quantity;
  const name = escapeHtml(cartItem.name);
  const brand = escapeHtml(cartItem.brand);
  const atMaxStock =
    typeof cartItem.stock === "number" && cartItem.quantity >= cartItem.stock;

  const variantAttributes = cartItem.variant
    ? Object.entries(cartItem.variant).filter(([key]) => key !== "priceDiff").map(([, value]) => value)
    : [];
  const variantLine = variantAttributes.length
    ? `<div class="variant">${escapeHtml(variantAttributes.join(" · "))}</div>`
    : "";

  return `
    <div class="cart-row" data-id="${escapeHtml(cartItem.id)}">
      <div class="thumb"><img src="${imagePath}" alt="${name}"></div>
      <div class="info">
        <div class="brand">${brand}</div>
        <div class="name">${name}</div>
        ${variantLine}
      </div>
      <div class="qty-control">
        <button type="button" class="qty-minus" aria-label="کاهش تعداد">−</button>
        <input type="text" value="${cartItem.quantity}" readonly aria-label="تعداد" aria-live="polite">
        <button type="button" class="qty-plus" aria-label="افزایش تعداد" ${atMaxStock ? "disabled" : ""}>+</button>
      </div>
      <div class="row-price">${formatPrice(lineTotal)} تومان</div>
      <button type="button" class="remove-btn" aria-label="حذف">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
      </button>
    </div>
  `;
}

export function renderCartPage(cartItems) {
  const cartItemsEl = document.querySelector("#cart-items");
  const cartLayoutEl = document.querySelector("#cart-layout");
  const emptyCartEl = document.querySelector("#empty-cart");

  if (cartItems.length === 0) {
    cartLayoutEl.classList.add("hidden");
    emptyCartEl.classList.remove("hidden");
    return;
  }

  cartLayoutEl.classList.remove("hidden");
  emptyCartEl.classList.add("hidden");

  const html = cartItems.map((cartItem) => renderCartRow(cartItem)).join("");

  cartItemsEl.innerHTML = html;
}

export function updateCartBadge(count) {
  const cartBadge = document.querySelector("#cart-count");

  if (!cartBadge) {
    return;
  }

  cartBadge.textContent = count > 0 ? toPersianDigits(count) : "";
}

export function bumpCartBadge() {
  const cartBadge = document.querySelector("#cart-count");
  if (!cartBadge) return;

  cartBadge.classList.remove("bump");
  void cartBadge.offsetWidth; // ری‌فلو اجباری تا با کلیک‌های پشت‌سرهم هم انیمیشن از اول اجرا بشه
  cartBadge.classList.add("bump");
}

export function renderCartSummary(subtotal, total, itemCount) {
  const itemsCountEl = document.querySelector("#items-count");
  const subtotalEl = document.querySelector("#subtotal");
  const discountEl = document.querySelector("#discount");
  const totalEl = document.querySelector("#total");

  const discount = subtotal - total;

  subtotalEl.textContent = `${formatPrice(subtotal)} تومان`;
  if (itemsCountEl) itemsCountEl.textContent = toPersianDigits(itemCount);
  discountEl.textContent =
    discount > 0 ? `−${formatPrice(discount)} تومان` : `${formatPrice(0)} تومان`;
  totalEl.textContent = `${formatPrice(total)} تومان`;
}

export function renderHeroText(product) {
  const id = encodeURIComponent(product.id);
  const detailUrl = `product.html?id=${id}`;
  const price = product.discountPrice ?? product.price;
  const discountPercent = getDiscountPercent(product);
  const outOfStock = (product.stock ?? 0) <= 0;

  const description =
    product.description ??
    `${product.brand} با ضمانت اصالت کالا و ارسال سریع از فراگجت.`;

  const specs = Object.entries(product.specs ?? {})
    .slice(0, 3)
    .map(
      ([label, value]) => `
        <div class="spec-item">
          <span class="val">${escapeHtml(value)}</span>
          <span class="lbl">${escapeHtml(label)}</span>
        </div>`,
    )
    .join("");

  return `
    <div class="eyebrow-line">${discountPercent > 0 ? `پیشنهاد ویژه · ${toPersianDigits(discountPercent)}٪ تخفیف` : "پیشنهاد این هفته"}</div>
    <h1><a href="${escapeHtml(detailUrl)}">${escapeHtml(product.name)}</a></h1>
    <p class="desc">${escapeHtml(description)}</p>
    ${specs ? `<div class="hero-specs">${specs}</div>` : ""}
    <div class="hero-cta">
      <span class="hero-price">${formatPrice(price)} تومان${discountPercent > 0 ? `<span class="old">${formatPrice(product.price)}</span>` : ""}</span>
      <a class="btn btn-primary" href="${escapeHtml(detailUrl)}">مشاهده جزئیات</a>
      <button type="button" class="btn btn-outline" id="hero-add-to-cart-btn" ${outOfStock ? "disabled" : ""}>${outOfStock ? "ناموجود" : "افزودن به سبد"}</button>
    </div>
  `;
}
