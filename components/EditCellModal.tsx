"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Trash2, BookOpen, User, Sparkles } from "lucide-react";
import { ScheduleCell, ScheduleCellType, TIME_SLOTS, DAYS_SHORT } from "@/types/schedule";

interface EditCellModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodIndex: number;
  dayIndex: number;
  cell: ScheduleCell | null;
  onSaveCell: (periodIndex: number, dayIndex: number, cell: ScheduleCell | null) => void;
}

const COMMON_SUBJECTS = [
  "Toán",
  "Ngữ văn",
  "Tiếng Anh",
  "Vật lí",
  "Hóa học",
  "Sinh học",
  "Lịch sử",
  "Địa lí",
  "Tin học",
  "GDCD",
  "Công nghệ",
  "Thể dục",
  "GDQP-AN",
  "Chào cờ",
  "Sinh hoạt lớp",
  "Ngoại ngữ 2",
];

export default function EditCellModal({
  isOpen,
  onClose,
  periodIndex,
  dayIndex,
  cell,
  onSaveCell,
}: EditCellModalProps) {
  const [subject, setSubject] = useState("");
  const [teacher, setTeacher] = useState("");
  const [cellType, setCellType] = useState<ScheduleCellType>("main");

  useEffect(() => {
    if (cell) {
      setSubject(cell.subject || "");
      setTeacher(cell.teacher || "");
      setCellType(cell.type || "main");
    } else {
      setSubject("");
      setTeacher("");
      setCellType("main");
    }
  }, [cell, isOpen]);

  if (!isOpen) return null;

  const slot = TIME_SLOTS[periodIndex] ?? { start: "", end: "" };
  const dayName = DAYS_SHORT[dayIndex] ?? "";

  const handleSave = () => {
    if (!subject.trim()) {
      // Empty cell
      onSaveCell(periodIndex, dayIndex, null);
      onClose();
      return;
    }

    const updatedCell: ScheduleCell = {
      subject: subject.trim(),
      teacher: teacher.trim(),
      originalText: `${subject.trim()} - ${teacher.trim()}`,
      type: cellType,
    };

    onSaveCell(periodIndex, dayIndex, updatedCell);
    onClose();
  };

  const handleClear = () => {
    onSaveCell(periodIndex, dayIndex, null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#fffef0] dark:bg-[#181a20] border-[3px] border-[#2d2d2d] dark:border-[#383d4a] rounded-3xl shadow-[8px_8px_0px_0px_#2d2d2d] dark:shadow-[8px_8px_0px_0px_#090a0c] overflow-hidden flex flex-col text-[#2d2d2d] dark:text-[#f1f5f9] font-patrick">
        {/* Hand tape decoration */}
        <div className="hand-tape -top-2.5 left-1/2 -translate-x-1/2 !w-32 z-10" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-2 border-dashed border-[#2d2d2d]/25 dark:border-white/20 bg-[#fff9c4]/50 dark:bg-[#222634]/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#ff4d4d] text-white text-xs font-black uppercase tracking-wider border-[1.5px] border-[#2d2d2d] shadow-sm rotate-1">
                Tiết {periodIndex + 1}
              </span>
              <span className="text-sm font-bold text-[#2d2d2d]/80 dark:text-[#cbd5e1]">
                Thứ {dayIndex + 2} ({dayName})
              </span>
              <span className="text-xs text-[#2d2d2d]/60 dark:text-[#94a3b8]">
                • {slot.start} - {slot.end}
              </span>
            </div>
            <h3 className="text-xl font-black font-kalam text-[#2d2d2d] dark:text-[#fde047] mt-1.5 leading-tight">
              Chỉnh Sửa Tiết Học
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white dark:bg-[#27272a] border-2 border-[#2d2d2d] dark:border-white/30 text-[#2d2d2d] dark:text-white hover:bg-[#ff4d4d] hover:text-white transition-all shadow-[2px_2px_0px_0px_#2d2d2d]"
            title="Đóng"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Subject input */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#2d2d2d] dark:text-[#f1f5f9] flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#2d5da1] dark:text-[#38bdf8]" />
              <span>Tên Môn Học:</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="VD: Toán, Ngữ văn, Tiếng Anh..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#222634] border-2 border-[#2d2d2d] dark:border-[#383d4a] text-base text-[#2d2d2d] dark:text-white focus:outline-none focus:border-[#2d5da1] font-bold shadow-[2px_2px_0px_0px_#2d2d2d] dark:shadow-[2px_2px_0px_0px_#090a0c]"
              autoFocus
            />

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COMMON_SUBJECTS.slice(0, 10).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                    subject === s
                      ? "bg-[#ff4d4d] text-white border-[#2d2d2d] shadow-sm -rotate-1"
                      : "bg-white dark:bg-[#222634] border-[#2d2d2d]/40 dark:border-white/20 text-[#2d2d2d] dark:text-[#cbd5e1] hover:bg-[#fff9c4] dark:hover:bg-[#2d3246]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Teacher input */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#2d2d2d] dark:text-[#f1f5f9] flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#2d5da1] dark:text-[#38bdf8]" />
              <span>Giáo Viên (tùy chọn):</span>
            </label>
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="VD: Thầy Hưng, Cô Mai..."
              className="w-full px-3.5 py-2 rounded-2xl bg-white dark:bg-[#222634] border-2 border-[#2d2d2d] dark:border-[#383d4a] text-sm text-[#2d2d2d] dark:text-white focus:outline-none focus:border-[#2d5da1] shadow-[2px_2px_0px_0px_#2d2d2d] dark:shadow-[2px_2px_0px_0px_#090a0c]"
            />
          </div>

          {/* Type selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[#2d2d2d] dark:text-[#f1f5f9] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#ff4d4d]" />
              <span>Loại Tiết:</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "main", label: "Chính Khóa" },
                { id: "nn2", label: "Ngoại Ngữ 2" },
                { id: "activity", label: "Sinh Hoạt" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCellType(t.id as ScheduleCellType)}
                  className={`py-2 rounded-2xl text-xs font-bold transition-all border-2 ${
                    cellType === t.id
                      ? "bg-[#fff9c4] dark:bg-[#2e2a1b] border-[#2d2d2d] dark:border-[#facc15] text-[#2d2d2d] dark:text-[#fef08a] shadow-[2px_2px_0px_0px_#2d2d2d] dark:shadow-[2px_2px_0px_0px_#090a0f] -rotate-1 font-black"
                      : "bg-white dark:bg-[#222634] border-[#2d2d2d]/30 dark:border-white/20 text-[#2d2d2d]/80 dark:text-white/70 hover:bg-[#fff9c4]/50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-dashed border-[#2d2d2d]/25 dark:border-white/15 bg-[#fff9c4]/30 dark:bg-[#222634]/30 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-500/10 text-sm font-bold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Làm trống tiết</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="hand-btn text-sm font-bold px-3.5 py-1.5 bg-white dark:bg-[#27272a] text-[#2d2d2d] dark:text-white border-2 border-[#2d2d2d] hover:bg-stone-100"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="hand-btn hand-btn-red text-sm font-bold px-4 py-1.5 text-white bg-[#ff4d4d] border-2 border-[#2d2d2d] hover:bg-[#e03b3b]"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Lưu Tiết Học</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
