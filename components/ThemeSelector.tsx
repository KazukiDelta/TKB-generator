"use client";

import React, { useState } from "react";
import { ThemeDefinition } from "@/types/theme";
import { THEMES } from "@/config/themes";
import { Check } from "lucide-react";

interface ThemeSelectorProps {
  currentTheme: ThemeDefinition;
  onSelectTheme: (theme: ThemeDefinition) => void;
}

export default function ThemeSelector({
  currentTheme,
  onSelectTheme,
}: ThemeSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "Tất Cả" },
    { id: "handdrawn", label: "Vẽ Tay" },
    { id: "current", label: "Hiện Tại" },
    { id: "classic", label: "Classic" },
    { id: "bw", label: "B&W" },
  ];

  const filteredThemes =
    selectedCategory === "all"
      ? THEMES
      : THEMES.filter((t) => t.category === selectedCategory);

  return (
    <div className="space-y-3">
      {/* Category Pills - Hand-Drawn */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#fdfbf7] dark:bg-[#14161d] border-2 border-[#2d2d2d]/30 dark:border-[#383a42]">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 hand-wobbly-sm text-sm font-bold font-patrick transition-all ${
                isActive
                  ? "bg-[#ff4d4d] text-white border-2 border-[#2d2d2d] dark:border-white/40 shadow-[2px_2px_0px_0px_#2d2d2d] -rotate-1"
                  : "text-[#2d2d2d]/70 dark:text-[#94a3b8] hover:text-[#2d2d2d] dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Theme Mini-Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {filteredThemes.map((theme) => {
          const isSelected = theme.id === currentTheme.id;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelectTheme(theme)}
              className={`flex items-center justify-between p-3 rounded-2xl border-2 text-left transition-all ${
                isSelected
                  ? "bg-[#fef08a] dark:bg-[#2b271d] text-[#2d2d2d] dark:text-[#fef08a] border-[#2d2d2d] dark:border-[#facc15] shadow-[3.5px_3.5px_0px_0px_#2d2d2d] dark:shadow-[3px_3px_0px_0px_#090a0f] -rotate-1 ring-2 ring-[#ff4d4d]"
                  : "bg-white dark:bg-[#181b24] text-[#2d2d2d] dark:text-[#e2e8f0] border-[#2d2d2d] dark:border-[#383a42] hover:bg-[#fff9c4]/70 dark:hover:bg-[#222632] shadow-[2px_2px_0px_0px_#2d2d2d] dark:shadow-[2px_2px_0px_0px_#090a0f] hover:-rotate-1"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Color Swatch Circle */}
                <div
                  className="w-5 h-5 rounded-full border-2 border-[#2d2d2d] dark:border-white/30 shadow-sm flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${theme.previewColors[0]}, ${theme.previewColors[1]})`,
                  }}
                />
                {/* Large 1-2 words title */}
                <span className="text-base font-bold font-patrick truncate">
                  {theme.shortName || theme.name}
                </span>
              </div>

              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-[#ff4d4d] text-white border-[1.5px] border-[#2d2d2d] flex items-center justify-center flex-shrink-0 ml-1 shadow-sm">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
