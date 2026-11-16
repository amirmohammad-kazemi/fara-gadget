import { escapeHtml } from "./render.js";

const ICONS = {
  success: `<path pathLength="1" d="M20 6L9 17l-5-5"/>`,
  error: `<path pathLength="1" d="M18 6L6 18M6 6l12 12"/>`,
  warning: `<path pathLength="1" d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-2.96L13.71 3.86a2 2 0 0 0-3.42 0z"/>`,
  info: `<path pathLength="1" d="M12 16v-4M12 8h.01"/><circle pathLength="1" cx="12" cy="12" r="9"/>`,
};

const TYPE_CLASS = {
  success: "toast--success",
  error: "toast--error",
  warning: "toast--warning",
  info: "toast--info",
};

let closeListenerBound = false;

export function showToast({ type = "info", title, message = "", duration = 4000 }) {
  const container = document.querySelector("#toast-container");
  if (!container) return;

  const toastEl = document.createElement("div");
  toastEl.className = `toast ${TYPE_CLASS[type] ?? TYPE_CLASS.info}`;
  toastEl.setAttribute("role", "status");

  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);

  toastEl.innerHTML = `
    <span class="toast__icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        ${ICONS[type] ?? ICONS.info}
      </svg>
    </span>

    <div class="toast__body">
      <p class="toast__title">${safeTitle}</p>
      ${message ? `<p class="toast__message">${safeMessage}</p>` : ""}
    </div>

    <button type="button" class="toast__close" aria-label="بستن اعلان">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>

    <span class="toast__progress"></span>
  `;

  const progressEl = toastEl.querySelector(".toast__progress");
  progressEl.style.animationDuration = `${duration}ms`;

  container.appendChild(toastEl);

  const timerId = setTimeout(() => dismissToast(toastEl), duration);
  toastEl._toastTimerId = timerId;

  setupCloseDelegation();
}

function dismissToast(toastEl) {
  if (!toastEl || toastEl.classList.contains("is-leaving")) return;

  clearTimeout(toastEl._toastTimerId);
  toastEl.classList.add("is-leaving");

  toastEl.addEventListener("animationend", () => toastEl.remove(), { once: true });
}

function setupCloseDelegation() {
  if (closeListenerBound) return;
  closeListenerBound = true;

  document.addEventListener("click", (event) => {
    const closeBtn = event.target.closest(".toast__close");
    if (!closeBtn) return;

    dismissToast(closeBtn.closest(".toast"));
  });
}
