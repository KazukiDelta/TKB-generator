"use client";

import React from "react";
import { Sparkles, Settings, Palette, PlayCircle, SidebarClose, SidebarOpen, PanelLeftClose, PanelLeftOpen, Heart, Moon, Sun } from "lucide-react";

interface HeaderProps {
  onLoadDemo: () => void;
  onOpenSettings: () => void;
  onOpenDonate?: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function Header({
  onLoadDemo,
  onOpenSettings,
  onOpenDonate,
  isSidebarOpen,
  onToggleSidebar,
  isDarkMode = false,
  onToggleDarkMode,
}: HeaderProps) {
  return (
    <header className="relative z-20 border-b-[3px] border-[#2d2d2d] dark:border-[#383d4a] bg-[#fdfbf7]/90 dark:bg-[#13151d]/95 backdrop-blur-md sticky top-0 shadow-[0_3px_0_0_rgba(45,45,45,0.08)]">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left: Toggle sidebar button + Logo & App Branding */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              title={isSidebarOpen ? "Thu gọn thanh công cụ để TKB to ra" : "Mở thanh công cụ"}
              className={`hand-btn text-base font-bold px-3.5 py-1.5 transition-all ${
                !isSidebarOpen
                  ? "bg-[#ff4d4d] text-white"
                  : "bg-white dark:bg-[#1c202b] text-[#2d2d2d] dark:text-white"
              }`}
            >
              {!isSidebarOpen ? (
                <>
                  <PanelLeftOpen className="w-5 h-5" />
                  <span>Mở Bảng Công Cụ</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="w-5 h-5" />
                  <span className="hidden md:inline">Thu Gọn (Phóng To TKB)</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-2xl overflow-hidden border-[2.5px] border-[#2d2d2d] dark:border-[#383d4a] bg-white dark:bg-[#1c202b] flex items-center justify-center -rotate-2 shadow-[2.5px_2.5px_0px_0px_#2d2d2d] dark:shadow-[2.5px_2.5px_0px_0px_#090a0f]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="TKB Generator"
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black font-kalam text-[#2d2d2d] dark:text-white tracking-tight">
                    TKB Generator
                  </h1>
                  <span className="hand-wobbly-sm px-2.5 py-0.5 text-xs font-bold font-patrick uppercase tracking-wider bg-[#fff9c4] text-[#2d2d2d] border-[1.5px] border-[#2d2d2d] rotate-1 shadow-[1.5px_1.5px_0px_0px_#2d2d2d]">
                    Sketch Edition
                  </span>
                </div>
                <p className="text-sm sm:text-base font-patrick text-[#2d2d2d]/70 dark:text-[#cbd5e1] font-semibold hidden sm:block">
                  Sổ tay thời khóa biểu • Vẽ tay & Sáng tạo • Sticker tương tác
                </p>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={onLoadDemo}
              className="hand-btn hand-btn-yellow text-base font-bold px-3.5 py-1.5"
            >
              <PlayCircle className="w-4 h-4 text-[#2d2d2d]" />
              <span>Dữ Liệu Mẫu</span>
            </button>

            {onOpenDonate && (
              <button
                type="button"
                onClick={onOpenDonate}
                className="hand-btn text-base font-bold px-3.5 py-1.5 bg-[#ffe4e6] text-[#b91c1c] hover:bg-[#ff4d4d] hover:text-white"
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>Ủng Hộ Creator</span>
              </button>
            )}

            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                title={isDarkMode ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối (Dark Mode)"}
                className="hand-btn text-base font-bold px-3.5 py-1.5 flex items-center gap-1.5"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                    <span className="hidden md:inline">Sáng</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-500 stroke-[2.5]" />
                    <span className="hidden md:inline">Tối</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onOpenSettings}
              className="hand-btn text-base font-bold px-3.5 py-1.5"
            >
              <Settings className="w-4 h-4 text-[#2d2d2d] dark:text-white" />
              <span>Cài Đặt</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
