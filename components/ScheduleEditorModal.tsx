"use client";

import React, { useState } from "react";
import { X, Check, Edit3, Trash2, Calendar } from "lucide-react";
import { ScheduleMatrix, TIME_SLOTS, DAYS_SHORT } from "@/types/schedule";

interface ScheduleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: ScheduleMatrix;
  selectedClass: string;
  onSaveSchedule: (newSchedule: ScheduleMatrix) => void;
}

export default function ScheduleEditorModal({
  isOpen,
  onClose,
  schedule,
  selectedClass,
  onSaveSchedule,
}: ScheduleEditorModalProps) {
  // Local clone of schedule for editing
  const [draftSchedule, setDraftSchedule] = useState<ScheduleMatrix>(() =>
    schedule ? schedule.map((row) => row.map((cell) => (cell ? { ...cell } : null))) : []
  );

  // Sync draftSchedule whenever the parent schedule or modal opens
  React.useEffect(() => {
    if (schedule) {
      setDraftSchedule(schedule.map((row) => row.map((cell) => (cell ? { ...cell } : null))));
    }
  }, [schedule, isOpen]);

  const [editingPos, setEditingPos] = useState<{ r: number; d: number } | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editTeacher, setEditTeacher] = useState("");

  if (!isOpen) return null;

  const handleStartEdit = (r: number, d: number) => {
    setEditingPos({ r, d });
    const existing = draftSchedule[r]?.[d];
    setEditSubject(existing?.subject || "");
    setEditTeacher(existing?.teacher || "");
  };

  const handleApplyCell = () => {
    if (!editingPos) return;
    const { r, d } = editingPos;
    const updated = draftSchedule.map((row) => [...row]);

    if (!editSubject.trim()) {
      updated[r][d] = null;
    } else {
      updated[r][d] = {
        subject: editSubject.trim(),
        teacher: editTeacher.trim(),
        originalText: `${editSubject.trim()} - ${editTeacher.trim()}`,
        type: "main",
      };
    }

    setDraftSchedule(updated);
    setEditingPos(null);
  };

  const handleSaveAll = () => {
    onSaveSchedule(draftSchedule);
    onClose();
  };

  const handleClearAll = () => {
    if (confirm("Bạn có chắc muốn làm trống toàn bộ thời khóa biểu?")) {
      setDraftSchedule(Array(10).fill(null).map(() => Array(6).fill(null)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#fdfbf7] border-[3px] border-[#2d2d2d] rounded-3xl shadow-[8px_8px_0px_0px_#2d2d2d] overflow-hidden flex flex-col max-h-[92vh] text-[#2d2d2d] hand-wobbly-1">
        {/* Hand tape decoration */}
        <div className="hand-tape -top-2 left-1/2 -translate-x-1/2 !w-36 z-10" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-[2.5px] border-[#2d2d2d] bg-[#f5efe6]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#fff9c4] border-2 border-[#2d2d2d] text-[#ff4d4d] shadow-[2px_2px_0px_0px_#2d2d2d]">
              <Edit3 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-2xl font-bold font-kalam text-[#2d2d2d] leading-none">
                  Chỉnh Sửa Thời Khóa Biểu
                </h3>
                <span className="px-3 py-0.5 rounded-xl bg-[#fff9c4] border-2 border-[#2d2d2d] font-kalam font-bold text-base shadow-[2px_2px_0px_0px_#2d2d2d] text-[#2d2d2d]">
                  Lớp: {selectedClass || "Lớp Học"}
                </span>
              </div>
              <p className="text-sm font-patrick text-[#2d2d2d]/80 mt-1">
                Nhấp vào bất kỳ ô nào để sửa trực tiếp môn học và giáo viên
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

        {/* Editing Popover Header if an active cell is selected */}
        {editingPos && (
          <div className="bg-[#fff9c4] border-b-[2.5px] border-[#2d2d2d] p-3 px-6 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 font-kalam font-bold text-base text-[#2d2d2d]">
              <span>✏️ Đang sửa: Tiết {editingPos.r + 1} - Thứ {editingPos.d + 2} ({DAYS_SHORT[editingPos.d]})</span>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-xl">
              <input
                type="text"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                placeholder="Tên môn học (VD: Toán, Văn...)"
                className="hand-input flex-1 px-3 py-1.5 font-patrick font-bold text-base bg-white focus:bg-[#fffde7]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyCell();
                }}
              />
              <input
                type="text"
                value={editTeacher}
                onChange={(e) => setEditTeacher(e.target.value)}
                placeholder="Giáo viên (VD: Thầy Hưng)"
                className="hand-input w-44 px-3 py-1.5 font-patrick font-bold text-base bg-white focus:bg-[#fffde7]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyCell();
                }}
              />
              <button
                type="button"
                onClick={handleApplyCell}
                className="hand-btn hand-btn-blue px-4 py-1.5 font-kalam font-bold text-base text-white flex items-center gap-1.5 rounded-xl whitespace-nowrap"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Áp dụng</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingPos(null)}
                className="hand-btn bg-white px-3 py-1.5 font-patrick font-bold text-base rounded-xl"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Schedule Grid */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          <div className="min-w-[720px]">
            {/* Header row: Days */}
            <div className="grid grid-cols-[70px_repeat(6,1fr)] gap-2 mb-2">
              <div className="text-center font-kalam font-bold text-base text-[#2d2d2d] py-2">
                Tiết
              </div>
              {DAYS_SHORT.map((day, d) => (
                <div
                  key={day}
                  className="text-center font-kalam font-bold text-lg text-[#2d2d2d] py-2 rounded-xl bg-[#fff9c4] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d]"
                >
                  Thứ {d + 2} ({day})
                </div>
              ))}
            </div>

            {/* Rows: Periods 1 to 10 */}
            <div className="space-y-1.5">
              {draftSchedule.map((row, r) => {
                const slot = TIME_SLOTS[r] ?? { start: "", end: "" };

                return (
                  <div key={r} className="grid grid-cols-[70px_repeat(6,1fr)] gap-2 items-center">
                    {/* Time Label */}
                    <div className="text-right pr-2">
                      <p className="font-kalam font-bold text-base text-[#2d2d2d] leading-none">
                        T{r + 1}
                      </p>
                      <p className="font-patrick text-xs font-bold text-[#2d2d2d]/60 mt-0.5">
                        {slot.start}
                      </p>
                    </div>

                    {/* Cells for Mon to Sat */}
                    {row.map((cell, d) => {
                      const isBeingEdited = editingPos?.r === r && editingPos?.d === d;

                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handleStartEdit(r, d)}
                          className={`min-h-[50px] p-2 rounded-xl border-2 text-left transition-all flex flex-col justify-center ${
                            isBeingEdited
                              ? "border-[#2d5da1] bg-[#e3f2fd] shadow-[3px_3px_0px_0px_#2d5da1]"
                              : cell?.subject
                              ? "bg-white border-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d] hover:bg-[#fffde7] hover:scale-[1.02]"
                              : "bg-white/50 border-dashed border-[#2d2d2d]/40 hover:border-[#2d2d2d] hover:bg-white"
                          }`}
                        >
                          {cell?.subject ? (
                            <>
                              <p className="font-patrick font-bold text-base text-[#2d2d2d] truncate leading-tight">
                                {cell.subject}
                              </p>
                              {cell.teacher && (
                                <p className="font-patrick text-sm font-bold text-[#2d5da1] truncate leading-tight mt-0.5">
                                  {cell.teacher}
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="font-patrick text-sm font-bold text-[#2d2d2d]/40 text-center block">
                              + Trống
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t-[2.5px] border-[#2d2d2d] bg-[#f5efe6] flex items-center justify-between">
          <button
            type="button"
            onClick={handleClearAll}
            className="hand-btn bg-white hover:bg-[#ff4d4d] hover:text-white text-[#ff4d4d] font-kalam font-bold text-base px-4 py-2 rounded-xl flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4 stroke-[2.5]" />
            <span>Làm trống bảng</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="hand-btn bg-white font-kalam font-bold text-base px-5 py-2 rounded-xl text-[#2d2d2d]"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="hand-btn hand-btn-red font-kalam font-bold text-lg px-8 py-2.5 rounded-2xl flex items-center gap-2"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>Lưu Toàn Bộ Thay Đổi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
