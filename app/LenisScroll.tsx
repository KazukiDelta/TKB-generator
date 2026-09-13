"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export default function LenisScroll() {
  useEffect(() => {
    // Ultra-luxurious "gliding on ice" (lướt trên băng) momentum inertia scroll
    const lenis = new Lenis({
      duration: 1.4, // Generous glide duration
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential deceleration like ice skating
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.08, // Silky initial impulse
      touchMultiplier: 1.8,
      infinite: false,
      prevent: (node: HTMLElement) => {
        // Safely check if node or any parent container has data-lenis-prevent or is an inner scroll container
        if (!node || typeof node.closest !== "function") return false;
        return !!node.closest("[data-lenis-prevent], .custom-scrollbar, .overflow-y-auto, .overflow-auto");
      },
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
