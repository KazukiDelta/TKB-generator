"use client";

import React, { useRef, useState } from "react";
import { StickerItem, StickerPreset } from "@/types/sticker";
import { STICKER_PRESETS } from "@/config/defaultStickers";
import {
  X,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Smile,
  BookOpen,
  Pin,
  Layers,
} from "lucide-react";

interface StickerManagerProps {
  isOpen: boolean;
  onClose: () => void;
  stickers: StickerItem[];
  onUpdateStickers: (stickers: StickerItem[]) => void;
}

export default function StickerManager({
  isOpen,
  onClose,
  stickers,
  onUpdateStickers,
}: StickerManagerProps) {
  const [selectedTab, setSelectedTab] = useState<"presets" | "custom" | "active">("presets");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Add preset sticker to canvas
  const handleAddPreset = (preset: StickerPreset) => {
    // Stagger position near center-right
    const randomOffset = Math.floor(Math.random() * 80) - 40;
    const newSticker: StickerItem = {
      id: `sticker-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      src: preset.src,
      name: preset.name,
      x: 1550 + randomOffset,
      y: 100 + randomOffset,
      width: preset.defaultWidth,
      height: preset.defaultHeight,
      rotation: Math.floor(Math.random() * 16) - 8, // slight playful tilt
      opacity: 1,
    };

    onUpdateStickers([...stickers, newSticker]);
  };

  // Upload custom sticker from file
  const handleUploadCustomSticker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;

      const newSticker: StickerItem = {
        id: `custom-sticker-${Date.now()}`,
        src,
        name: file.name.replace(/\.[^/.]+$/, ""),
        x: 1500,
        y: 120,
        width: 120,
        height: 120,
        rotation: 0,
        opacity: 1,
        isCustom: true,
      };

      onUpdateStickers([...stickers, newSticker]);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteSticker = (id: string) => {
    onUpdateStickers(stickers.filter((s) => s.id !== id));
  };

  const handleClearAllStickers = () => {
    if (confirm("Bạn có chắc muốn xóa tất cả sticker trên thời khóa biểu?")) {
      onUpdateStickers([]);
    }
  };

  const filteredPresets =
    categoryFilter === "all"
      ? STICKER_PRESETS
      : STICKER_PRESETS.filter((p) => p.category === categoryFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl hand-card bg-[#fdfbf7] border-[3px] border-[#2d2d2d] shadow-[8px_8px_0px_0px_#2d2d2d] rounded-3xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-dashed border-[#2d2d2d]/30 bg-white/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#ff4d4d] text-white border-2 border-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black font-kalam text-[#2d2d2d]">Quản Lý Sticker</h3>
              <p className="text-sm font-patrick text-[#2d2d2d]/70 font-bold">Thêm nhãn dán, ghim, mascot và ảnh riêng để trang trí TKB</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="hand-btn text-base px-2.5 py-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2.5 px-6 py-3 border-b-2 border-[#2d2d2d]/20 bg-[#fdfbf7]">
          <button
            type="button"
            onClick={() => setSelectedTab("presets")}
            className={`hand-wobbly-sm px-4 py-2 text-base font-bold font-patrick border-2 border-[#2d2d2d] transition-all ${
              selectedTab === "presets"
                ? "bg-[#ff4d4d] text-white shadow-[3px_3px_0px_0px_#2d2d2d] -rotate-1"
                : "bg-white text-[#2d2d2d] hover:bg-[#fff9c4]"
            }`}
          >
            Thư Viện Sticker
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab("custom")}
            className={`hand-wobbly-sm px-4 py-2 text-base font-bold font-patrick border-2 border-[#2d2d2d] transition-all ${
              selectedTab === "custom"
                ? "bg-[#2d5da1] text-white shadow-[3px_3px_0px_0px_#2d2d2d] rotate-1"
                : "bg-white text-[#2d2d2d] hover:bg-[#fff9c4]"
            }`}
          >
            Tải Ảnh Của Bạn
          </button>

          <button
            type="button"
            onClick={() => setSelectedTab("active")}
            className={`hand-wobbly-sm px-4 py-2 text-base font-bold font-patrick border-2 border-[#2d2d2d] transition-all flex items-center gap-1.5 ${
              selectedTab === "active"
                ? "bg-[#fef08a] text-[#2d2d2d] shadow-[3px_3px_0px_0px_#2d2d2d] -rotate-1"
                : "bg-white text-[#2d2d2d] hover:bg-[#fff9c4]"
            }`}
          >
            <span>Đang Dùng</span>
            <span className="px-2 py-0.5 rounded-full bg-[#ff4d4d] text-white text-xs font-bold font-patrick border-[1.5px] border-[#2d2d2d]">
              {stickers.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {selectedTab === "presets" && (
            <div className="space-y-4">
              {/* Category filters */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "all", label: "Tất Cả" },
                  { id: "mascot", label: "Mascot HUST", icon: Smile },
                  { id: "study", label: "Học Tập", icon: BookOpen },
                  { id: "decoration", label: "Ghim & Băng Dính", icon: Pin },
                  { id: "fun", label: "Vui Vẻ", icon: Sparkles },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`hand-wobbly-sm px-3 py-1 text-sm font-bold font-patrick border-2 border-[#2d2d2d] transition-all flex items-center gap-1.5 ${
                      categoryFilter === cat.id
                        ? "bg-[#2d2d2d] text-white shadow-[2px_2px_0px_0px_#2d2d2d] -rotate-1"
                        : "bg-white text-[#2d2d2d] hover:bg-[#fff9c4]"
                    }`}
                  >
                    {cat.icon && <cat.icon className="w-3.5 h-3.5" />}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleAddPreset(preset)}
                    className="group relative flex flex-col items-center justify-center p-4 rounded-2xl bg-white border-2 border-[#2d2d2d] shadow-[3px_3px_0px_0px_#2d2d2d] hover:bg-[#fff9c4]/70 hover:-rotate-1 hover:scale-105 transition-all"
                  >
                    <div className="w-20 h-20 flex items-center justify-center mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preset.src}
                        alt={preset.name}
                        className="max-w-full max-h-full object-contain filter drop-shadow-sm group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <span className="text-base font-bold font-patrick text-[#2d2d2d] text-center line-clamp-1">
                      {preset.name}
                    </span>
                    <div className="mt-1 flex items-center gap-1 text-xs font-bold font-patrick text-[#ff4d4d] opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Thêm</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedTab === "custom" && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleUploadCustomSticker}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer flex flex-col items-center justify-center p-10 rounded-3xl border-[2.5px] border-dashed border-[#2d2d2d] bg-white hover:bg-[#fff9c4]/50 transition-all group text-center hover:-rotate-1"
              >
                <div className="p-4 rounded-2xl bg-[#fff9c4] border-2 border-[#2d2d2d] text-[#2d2d2d] shadow-[3px_3px_0px_0px_#2d2d2d] group-hover:scale-110 transition-transform mb-3">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold font-kalam text-[#2d2d2d] mb-1">
                  Chọn ảnh từ máy tính
                </h4>
                <p className="text-base font-patrick text-[#2d2d2d]/70 max-w-sm font-semibold">
                  Khuyên dùng ảnh PNG nền trong suốt (logo trường, avatar lớp, sticker vẽ tay) để trang trí đẹp nhất.
                </p>
              </div>
            </div>
          )}

          {selectedTab === "active" && (
            <div className="space-y-3">
              {stickers.length === 0 ? (
                <div className="text-center py-12 text-[#2d2d2d]/60 font-patrick text-base font-semibold">
                  Chưa có sticker nào trên thời khóa biểu. Hãy chọn từ tab "Thư Viện" để dán ngay!
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-base font-bold font-patrick text-[#2d2d2d]">
                      Tổng số: {stickers.length} sticker
                    </span>
                    <button
                      type="button"
                      onClick={handleClearAllStickers}
                      className="text-sm font-bold font-patrick text-[#ff4d4d] hover:underline"
                    >
                      Xóa tất cả
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {stickers.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white border-2 border-[#2d2d2d] shadow-[2.5px_2.5px_0px_0px_#2d2d2d]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#fdfbf7] border border-[#2d2d2d]/20 p-1 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={s.src}
                              alt={s.name}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <div>
                            <p className="text-base font-bold font-patrick text-[#2d2d2d]">{s.name}</p>
                            <p className="text-xs font-patrick text-[#2d2d2d]/60">
                              Vị trí: ({s.x}, {s.y}) • Kích thước: {s.width}x{s.height}px
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSticker(s.id)}
                          className="p-2 rounded-xl text-[#ff4d4d] hover:bg-[#ffe4e6] border border-transparent hover:border-[#ff4d4d]/30 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-[#2d2d2d]/20 bg-white/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="hand-btn text-base font-bold px-6 py-2 bg-white"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
