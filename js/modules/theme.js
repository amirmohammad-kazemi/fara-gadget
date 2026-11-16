const THEME_KEY = "faragadget_theme";

function getCurrentTheme() {
  const stored = document.documentElement.getAttribute("data-theme");
  if (stored === "dark" || stored === "light") return stored;

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // اگه storage بلاک باشه، تم فقط برای همین صفحه می‌مونه
  }

  const toggleBtn = document.querySelector("#theme-toggle");
  if (toggleBtn) {
    toggleBtn.setAttribute(
      "aria-label",
      theme === "dark" ? "تغییر به حالت روشن" : "تغییر به حالت تاریک",
    );
    toggleBtn.setAttribute("aria-pressed", String(theme === "dark"));
  }
}

export function initTheme() {
  const toggleBtn = document.querySelector("#theme-toggle");
  applyTheme(getCurrentTheme());
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    const next = getCurrentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
  });
}
