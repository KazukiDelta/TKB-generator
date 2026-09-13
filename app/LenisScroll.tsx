"use client";

import { useEffect } from "react";

/**
 * SmoothScroll – lightweight "gliding on ice" scroll using native scrollTop.
 *
 * Unlike Lenis (which uses transform: translate3d to move content), this
 * implementation uses window.scrollTo, which lets the browser compositor
 * handle scrolling natively. This avoids compositing conflicts with the
 * 1920×1080 canvas that uses transform: scale().
 */
export default function LenisScroll() {
  useEffect(() => {
    let targetY = window.scrollY;
    let currentY = window.scrollY;
    let rafId: number | null = null;
    let isRunning = false;

    const ease = 0.08; // lower = more glide (0.05–0.12 sweet spot)
    const threshold = 0.5; // stop animating when close enough

    function animate() {
      currentY += (targetY - currentY) * ease;

      // Clamp to valid scroll range
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      currentY = Math.max(0, Math.min(maxScroll, currentY));

      if (Math.abs(targetY - currentY) > threshold) {
        window.scrollTo(0, currentY);
        rafId = requestAnimationFrame(animate);
      } else {
        window.scrollTo(0, targetY);
        currentY = targetY;
        isRunning = false;
        rafId = null;
      }
    }

    function startAnimation() {
      if (!isRunning) {
        isRunning = true;
        rafId = requestAnimationFrame(animate);
      }
    }

    function handleWheel(e: WheelEvent) {
      // Don't intercept horizontal or inside nested scrollable containers
      // (modals, dropdowns marked with data-scroll-prevent)
      const target = e.target as HTMLElement;
      if (target?.closest?.("[data-scroll-prevent]")) return;

      e.preventDefault();

      // Sync if user scrolled natively (keyboard, scrollbar drag, etc.)
      if (Math.abs(currentY - window.scrollY) > 100) {
        currentY = window.scrollY;
        targetY = window.scrollY;
      }

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      targetY = Math.max(0, Math.min(maxScroll, targetY + e.deltaY));
      startAnimation();
    }

    // Sync on keyboard/touch/programmatic scroll
    function handleScroll() {
      if (!isRunning) {
        currentY = window.scrollY;
        targetY = window.scrollY;
      }
    }

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return null;
}
