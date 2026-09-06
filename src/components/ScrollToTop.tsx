import { useEffect, useState } from "react";

/** Floating scroll-to-top arrow that fades in after scrolling down. */
export function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      aria-label="Powrót do góry"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/60 bg-surface-deep/85 text-lg text-primary backdrop-blur transition-all duration-300 hover:glow-ring-strong ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      ↑
    </button>
  );
}
