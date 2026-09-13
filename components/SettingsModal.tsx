"use client";

import React from "react";
import { X, Settings, UserX, Sparkles, Type, Calendar, RefreshCw } from "lucide-react";
import { RenderOptions } from "@/utils/canvasRenderer";
import { getCurrentAcademicYear } from "@/utils/academicYear";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: RenderOptions;
  onChangeOptions: (newOptions: RenderOptions) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  options,
  onChangeOptions,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#fff9c4] border-[3px] border-[#2d2d2d] rounded-3xl shadow-[8px_8px_0px_0px_#2d2d2d] overflow-hidden text-[#2d2d2d] hand-wobbly-1">
        {/* Hand tape decoration */}
        <div className="hand-tape -top-2 left-1/2 -translate-x-1/2 !w-32 z-10" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-[2.5px] border-[#2d2d2d] bg-[#fff59d]/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white border-2 border-[#2d2d2d] text-[#2d5da1] shadow-[2px_2px_0px_0px_#2d2d2d]">
              <Settings className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-2xl font-bold font-kalam text-[#2d2d2d] leading-none">
                Cài Đặt Thời Khóa Biểu
              </h3>
              <p className="text-sm font-patrick text-[#2d2d2d]/80 mt-1">
                Tùy biến hiển thị môn học, giáo viên và cỡ chữ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white border-2 border-[#2d2d2d] text-[#2d2d2d] hover:bg-[#ff4d4d] hover:text-white transition-all shadow-[2px_2px_0px_0px_#2d2d2d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            title="Đóng"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar font-patrick">
          {/* Toggle Remove Teacher */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#fdfbf7] border-2 border-[#2d2d2d] shadow-[3px_3px_0px_0px_#2d2d2d]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#fff9c4] border border-[#2d2d2d]">
                <UserX className="w-5 h-5 text-[#2d2d2d]" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#2d2d2d] leading-snug">Ẩn Tên Giáo Viên</p>
                <p className="text-sm text-[#2d2d2d]/75">Chỉ hiển thị tên môn học trong từng ô</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={options.removeTeacher}
                onChange={(e) =>
                  onChangeOptions({ ...options, removeTeacher: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-white border-2 border-[#2d2d2d] rounded-full peer peer-checked:bg-[#2d5da1] peer-focus:outline-none transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#2d2d2d] peer-checked:after:bg-white after:border after:border-[#2d2d2d] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6" />
            </label>
          </div>

          {/* Toggle Highlight NN2 */}
          <div className="space-y-3 p-4 rounded-2xl bg-[#fdfbf7] border-2 border-[#2d2d2d] shadow-[3px_3px_0px_0px_#2d2d2d]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#ffe082] border border-[#2d2d2d]">
                  <Sparkles className="w-5 h-5 text-[#d97706]" />
                </div>
                <div>
                  <p className="text-lg font-bold text-[#2d2d2d] leading-snug">Nổi Bật Ngoại Ngữ 2 (NN2)</p>
                  <p className="text-sm text-[#2d2d2d]/75">Tô màu riêng cho các tiết môn ngoại ngữ 2</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.highlightNN2}
                  onChange={(e) =>
                    onChangeOptions({ ...options, highlightNN2: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-white border-2 border-[#2d2d2d] rounded-full peer peer-checked:bg-[#ff4d4d] peer-focus:outline-none transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#2d2d2d] peer-checked:after:bg-white after:border after:border-[#2d2d2d] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6" />
              </label>
            </div>

            {options.highlightNN2 && (
              <div className="pt-3 border-t-2 border-dashed border-[#2d2d2d]/30 space-y-3">
                <div>
                  <label className="text-sm font-bold text-[#2d2d2d] block mb-1">
                    Từ khóa nhận diện NN2 (phân tách bởi dấu phẩy):
                  </label>
                  <input
                    type="text"
                    value={options.nn2Keywords}
                    onChange={(e) =>
                      onChangeOptions({ ...options, nn2Keywords: e.target.value })
                    }
                    placeholder="Pháp, Trung, Nhật, Đức..."
                    className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#2d2d2d] text-base font-bold text-[#2d2d2d] placeholder-[#2d2d2d]/40 focus:outline-none focus:bg-[#fff9c4]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-[#2d2d2d]">Màu viền & nền NN2:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={options.nn2Color}
                      onChange={(e) =>
                        onChangeOptions({ ...options, nn2Color: e.target.value })
                      }
                      className="w-10 h-10 rounded-xl cursor-pointer bg-white border-2 border-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d] p-0.5"
                    />
                    <span className="text-xs font-mono font-bold text-[#2d2d2d] uppercase">
                      {options.nn2Color}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cell Text Scaling */}
          <div className="p-4 rounded-2xl bg-[#fdfbf7] border-2 border-[#2d2d2d] shadow-[3px_3px_0px_0px_#2d2d2d] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#bbdefb] border border-[#2d2d2d]">
                  <Type className="w-5 h-5 text-[#2d5da1]" />
                </div>
                <div>
                  <p className="text-lg font-bold text-[#2d2d2d] leading-snug">Kích Thước Chữ Môn Học</p>
                  <p className="text-sm text-[#2d2d2d]/75">Điều chỉnh độ to của chữ trên TKB</p>
                </div>
              </div>
              <span className="text-base font-black px-2.5 py-0.5 rounded-lg bg-white border-2 border-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d] text-[#2d5da1]">
                {Math.round(options.cellTextScale * 100)}%
              </span>
            </div>

            <div className="pt-2">
              <input
                type="range"
                min="0.8"
                max="1.6"
                step="0.05"
                value={options.cellTextScale}
                onChange={(e) =>
                  onChangeOptions({
                    ...options,
                    cellTextScale: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-[#2d5da1] cursor-pointer h-2 bg-white rounded-lg border-2 border-[#2d2d2d]"
              />
              <div className="flex justify-between text-xs font-bold text-[#2d2d2d]/70 mt-1">
                <span>Nhỏ (80%)</span>
                <span>Chuẩn (100%)</span>
                <span>To rõ (130%)</span>
                <span>Cực đại (160%)</span>
              </div>
            </div>
          </div>

          {/* Academic Year Input with Auto-detection */}
          <div className="p-4 rounded-2xl bg-[#fdfbf7] border-2 border-[#2d2d2d] shadow-[3px_3px_0px_0px_#2d2d2d] space-y-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#c8e6c9] border border-[#2d2d2d]">
                  <Calendar className="w-5 h-5 text-[#1b5e20]" />
                </div>
                <p className="text-lg font-bold text-[#2d2d2d]">Tiêu Đề Năm Học</p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onChangeOptions({ ...options, academicYear: getCurrentAcademicYear() })
                }
                className="hand-btn text-xs font-bold px-2.5 py-1 bg-white text-[#2d5da1] flex items-center gap-1 shadow-sm"
                title="Tự động cập nhật theo năm hiện tại"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Tự động ({getCurrentAcademicYear()})</span>
              </button>
            </div>
            <input
              type="text"
              value={options.academicYear || getCurrentAcademicYear()}
              onChange={(e) =>
                onChangeOptions({ ...options, academicYear: e.target.value })
              }
              placeholder={getCurrentAcademicYear()}
              className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#2d2d2d] text-base font-bold text-[#2d2d2d] focus:outline-none focus:bg-[#fff9c4]"
            />
          </div>

          {/* Watermark toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#fdfbf7] border-2 border-[#2d2d2d] shadow-[3px_3px_0px_0px_#2d2d2d]">
            <div>
              <p className="text-lg font-bold text-[#2d2d2d]">Chữ Ký Tác Giả (Watermark)</p>
              <p className="text-sm text-[#2d2d2d]/75">Hiển thị "TKB Generator • KazukiDelta" ở góc dưới</p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={options.showWatermark}
                onChange={(e) =>
                  onChangeOptions({ ...options, showWatermark: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-white border-2 border-[#2d2d2d] rounded-full peer peer-checked:bg-[#2d5da1] peer-focus:outline-none transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#2d2d2d] peer-checked:after:bg-white after:border after:border-[#2d2d2d] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6" />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t-[2.5px] border-[#2d2d2d] bg-[#fff59d]/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="hand-btn hand-btn-blue font-kalam font-bold text-lg px-8 py-2 rounded-2xl text-white"
          >
            Lưu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
