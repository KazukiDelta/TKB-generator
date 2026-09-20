"use client";

import React from "react";
import {
  Settings,
  PlayCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Heart,
  Moon,
  Sun,
  Globe,
} from "lucide-react";

interface HeaderProps {
  onLoadDemo: () => void;
  onOpenSettings: () => void;
  onOpenDonate?: () => void;
  onOpenSyncTkbWeb?: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function Header({
  onLoadDemo,
  onOpenSettings,
  onOpenDonate,
  onOpenSyncTkbWeb,
  isSidebarOpen,
  onToggleSidebar,
  isDarkMode = false,
  onToggleDarkMode,
}: HeaderProps) {
  return (
    <header className="relative z-30 border-b-[3px] border-[#2d2d2d] dark:border-[#383d4a] bg-[#fdfbf7]/95 dark:bg-[#13151d]/95 backdrop-blur-md sticky top-0 shadow-[0_3px_0_0_rgba(45,45,45,0.08)]">
      <div className="max-w-[1920px] mx-auto px-2.5 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Toggle sidebar button + Logo & App Branding */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onToggleSidebar}
              title={isSidebarOpen ? "Thu gọn bảng công cụ (Phóng to TKB)" : "Mở bảng công cụ"}
              className={`hand-btn text-sm sm:text-base font-bold p-2 sm:px-3.5 sm:py-1.5 transition-all flex items-center gap-1.5 shrink-0 min-h-[38px] sm:min-h-[42px] ${
                !isSidebarOpen
                  ? "bg-[#ff4d4d] text-white"
                  : "bg-white dark:bg-[#1c202b] text-[#2d2d2d] dark:text-white"
              }`}
            >
              {!isSidebarOpen ? (
                <>
                  <PanelLeftOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Mở Công Cụ</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden lg:inline">Thu Gọn (TKB To)</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-[2.5px] border-[#2d2d2d] dark:border-[#383d4a] bg-white dark:bg-[#1c202b] flex items-center justify-center -rotate-2 shadow-[2px_2px_0px_0px_#2d2d2d] dark:shadow-[2px_2px_0px_0px_#090a0f] shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="TKB Generator"
                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black font-kalam text-[#2d2d2d] dark:text-white tracking-tight leading-none truncate">
                    <span className="sm:hidden">TKB Maker</span>
                    <span className="hidden sm:inline">TKB Generator</span>
                  </h1>
                  <span className="hidden md:inline-block hand-wobbly-sm px-2 py-0.5 text-xs font-bold font-patrick uppercase tracking-wider bg-[#fff9c4] text-[#2d2d2d] border-[1.5px] border-[#2d2d2d] rotate-1 shadow-[1.5px_1.5px_0px_0px_#2d2d2d] shrink-0">
                    Sketch
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-patrick text-[#2d2d2d]/70 dark:text-[#cbd5e1] font-semibold hidden md:block truncate">
                  Sổ tay thời khóa biểu • Vẽ tay & Sáng tạo
                </p>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons (compact icon-focused on mobile, full labels on desktop) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {onOpenSyncTkbWeb && (
              <button
                type="button"
                onClick={onOpenSyncTkbWeb}
                title="Lấy TKB Trực Tuyến Từ Web Trường (tkb-web)"
                className="hand-btn text-sm sm:text-base font-bold p-2 sm:px-3 sm:py-1.5 bg-[#e0f2fe] dark:bg-[#0c4a6e] text-[#0369a1] dark:text-[#bae6fd] hover:bg-[#38bdf8] hover:text-[#0f172a] flex items-center gap-1.5 min-h-[38px] sm:min-h-[42px]"
              >
                <Globe className="w-4 h-4 text-[#0284c7] dark:text-[#38bdf8]" />
                <span className="hidden sm:inline">TKB Trực Tuyến</span>
              </button>
            )}

            <button
              type="button"
              onClick={onLoadDemo}
              title="Xem Dữ Liệu Mẫu"
              className="hand-btn hand-btn-yellow text-sm sm:text-base font-bold p-2 sm:px-3 sm:py-1.5 flex items-center gap-1.5 min-h-[38px] sm:min-h-[42px]"
            >
              <PlayCircle className="w-4 h-4 text-[#2d2d2d]" />
              <span className="hidden sm:inline">Dữ Liệu Mẫu</span>
            </button>

            {onOpenDonate && (
              <button
                type="button"
                onClick={onOpenDonate}
                title="Ủng Hộ Creator"
                className="hand-btn text-sm sm:text-base font-bold p-2 sm:px-3 sm:py-1.5 bg-[#ffe4e6] dark:bg-[#3f1d24] text-[#b91c1c] dark:text-[#fda4af] hover:bg-[#ff4d4d] hover:text-white flex items-center gap-1.5 min-h-[38px] sm:min-h-[42px]"
              >
                <Heart className="w-4 h-4 fill-current text-[#e11d48] dark:text-[#fb7185]" />
                <span className="hidden md:inline">Ủng Hộ</span>
              </button>
            )}

            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                title={isDarkMode ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
                className="hand-btn text-sm sm:text-base font-bold p-2 sm:px-3 sm:py-1.5 flex items-center gap-1.5 min-h-[38px] sm:min-h-[42px]"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                    <span className="hidden lg:inline">Sáng</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-500 stroke-[2.5]" />
                    <span className="hidden lg:inline">Tối</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onOpenSettings}
              title="Cài Đặt"
              className="hand-btn text-sm sm:text-base font-bold p-2 sm:px-3 sm:py-1.5 flex items-center gap-1.5 min-h-[38px] sm:min-h-[42px]"
            >
              <Settings className="w-4 h-4 text-[#2d2d2d] dark:text-white" />
              <span className="hidden sm:inline">Cài Đặt</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
