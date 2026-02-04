"use client";
import { useEffect } from "react";
import Lenis from "lenis";

export default function LenisScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      // Prevent Lenis from managing scroll inside specific containers
      prevent: (node: HTMLElement) => {
        // Allow scroll on elements with data-lenis-prevent attribute
        if (node.hasAttribute("data-lenis-prevent")) {
          return true;
        }
        // Allow scroll on elements with these classes
        const classes = node.className;
        if (
          classes.includes("custom-scrollbar") ||
          classes.includes("overflow-auto") ||
          classes.includes("overflow-y-auto") ||
          classes.includes("overflow-x-auto")
        ) {
          return true;
        }
        return false;
      },
    });

    lenis.on("scroll", (e: any) => {
      // console.log(e);
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return null;
}
