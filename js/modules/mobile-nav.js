export function initMobileNav() {
  const toggleBtn = document.querySelector("#nav-toggle");
  const panel = document.querySelector("#mobile-nav-panel");
  const overlay = document.querySelector("#mobile-nav-overlay");
  const closeBtn = document.querySelector("#mobile-nav-close");

  if (!toggleBtn || !panel || !overlay) return;

  const focusableSelector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const previousBodyOverflow = document.body.style.overflow;

  panel.setAttribute("aria-hidden", "true");
  overlay.setAttribute("aria-hidden", "true");
  panel.inert = true;

  function openMenu() {
    panel.classList.add("is-open");
    overlay.classList.add("is-open");
    toggleBtn.classList.add("is-open");
    toggleBtn.setAttribute("aria-expanded", "true");
    toggleBtn.setAttribute("aria-label", "بستن منو");
    panel.setAttribute("aria-hidden", "false");
    panel.inert = false;
    document.body.style.overflow = "hidden";
    (closeBtn ?? panel.querySelector(focusableSelector) ?? panel).focus();
  }

  function closeMenu(restoreFocus = true) {
    panel.classList.remove("is-open");
    overlay.classList.remove("is-open");
    toggleBtn.classList.remove("is-open");
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.setAttribute("aria-label", "باز کردن منو");
    panel.setAttribute("aria-hidden", "true");
    panel.inert = true;
    document.body.style.overflow = previousBodyOverflow;
    if (restoreFocus) toggleBtn.focus();
  }

  toggleBtn.addEventListener("click", () => {
    panel.classList.contains("is-open") ? closeMenu(false) : openMenu();
  });

  overlay.addEventListener("click", () => closeMenu());
  closeBtn?.addEventListener("click", () => closeMenu());

  panel.addEventListener("click", (event) => {
    if (event.target.closest("a[href]")) closeMenu(false);
  });

  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = [...panel.querySelectorAll(focusableSelector)].filter(
      (element) => element.getClientRects().length > 0,
    );
    if (focusable.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900 && panel.classList.contains("is-open")) {
      closeMenu(false);
    }
  });
}
