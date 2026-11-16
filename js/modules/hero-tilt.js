export function initHeroTilt() {
  const wrap = document.querySelector(".hero-image");
  const frame = wrap?.querySelector(".img-frame");
  if (!wrap || !frame) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const isTouchDevice = window.matchMedia("(hover: none)").matches;

  if (prefersReducedMotion || isTouchDevice) return;

  const MAX_TILT_DEG = 12;

  wrap.addEventListener("mousemove", (event) => {
    const rect = wrap.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (event.clientY - rect.top) / rect.height - 0.5;

    const rotateY = relativeX * MAX_TILT_DEG;
    const rotateX = -relativeY * MAX_TILT_DEG;

    frame.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    wrap.style.setProperty("--glare-x", `${(relativeX + 0.5) * 100}%`);
    wrap.style.setProperty("--glare-y", `${(relativeY + 0.5) * 100}%`);
  });

  wrap.addEventListener("mouseleave", () => {
    frame.style.transform = "rotateX(0deg) rotateY(0deg)";
  });
}
