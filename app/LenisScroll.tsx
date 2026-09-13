"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export default function LenisScroll() {
  useEffect(() => {
    // Ultra-luxurious "gliding on ice" (lướt trên băng) momentum inertia scroll
    const lenis = new Lenis({
      duration: 1.6, // Longer gliding glide
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Luxurious exponential deceleration
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.15, // Effortless glide impulse
      touchMultiplier: 1.8,
      infinite: false,
      prevent: (node: HTMLElement) => {
        // Only prevent Lenis inside elements explicitly marked with data-lenis-prevent
        if (!node || typeof node.closest !== "function") return false;
        return !!node.closest("[data-lenis-prevent]");
      },
    });

    // Expose lenis globally for seamless delegation from canvas frame
    if (typeof window !== "undefined") {
      (window as any).__lenis = lenis;
    }

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      if (typeof window !== "undefined") {
        delete (window as any).__lenis;
      }
      lenis.destroy();
    };
  }, []);

  return null;
}
