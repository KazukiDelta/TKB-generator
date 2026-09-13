"use client";

import React, { useState } from "react";
import { X, Check, Edit3, Trash2, Calendar, LayoutGrid, List } from "lucide-react";
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

  // Active day filter for mobile view (-1: All days grid, 0-5: Monday to Saturday)
  const [activeDayFilter, setActiveDayFilter] = useState<number>(-1);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#fdfbf7] border-[3px] border-[#2d2d2d] rounded-2xl sm:rounded-3xl shadow-[6px_6px_0px_0px_#2d2d2d] sm:shadow-[8px_8px_0px_0px_#2d2d2d] overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[92vh] text-[#2d2d2d] hand-wobbly-1">
        {/* Hand tape decoration */}
        <div className="hand-tape -top-2 left-1/2 -translate-x-1/2 !w-32 sm:!w-36 z-10" />

        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b-[2.5px] border-[#2d2d2d] bg-[#f5efe6]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#fff9c4] border-2 border-[#2d2d2d] text-[#ff4d4d] shadow-[2px_2px_0px_0px_#2d2d2d] shrink-0">
              <Edit3 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-2xl font-bold font-kalam text-[#2d2d2d] leading-none truncate">
                  Sửa Thời Khóa Biểu
                </h3>
                <span className="px-2 sm:px-3 py-0.5 rounded-xl bg-[#fff9c4] border-2 border-[#2d2d2d] font-kalam font-bold text-xs sm:text-base shadow-[1.5px_1.5px_0px_0px_#2d2d2d] text-[#2d2d2d] shrink-0">
                  {selectedClass || "Lớp"}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-patrick text-[#2d2d2d]/80 mt-0.5 truncate hidden sm:block">
                Nhấp vào bất kỳ ô nào để sửa trực tiếp môn học và giáo viên
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-white border-2 border-[#2d2d2d] text-[#2d2d2d] hover:bg-[#ff4d4d] hover:text-white transition-all shadow-[2px_2px_0px_0px_#2d2d2d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shrink-0 ml-2"
            title="Đóng"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Mobile Day Selector Tabs (Only visible on small screens to easily jump to each Day) */}
        <div className="sm:hidden px-3 py-2 bg-[#fdfbf7] border-b-2 border-[#2d2d2d]/30 overflow-x-auto custom-scrollbar flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveDayFilter(-1)}
            className={`px-3 py-1 rounded-xl text-xs font-bold font-patrick transition-all whitespace-nowrap border-2 ${
              activeDayFilter === -1
                ? "bg-[#2d5da1] text-white border-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d]"
                : "bg-white text-[#2d2d2d] border-[#2d2d2d]/30"
            }`}
          >
            Lưới Toàn Bộ
          </button>
          {DAYS_SHORT.map((day, d) => (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDayFilter(d)}
              className={`px-3 py-1 rounded-xl text-xs font-bold font-patrick transition-all whitespace-nowrap border-2 ${
                activeDayFilter === d
                  ? "bg-[#ff4d4d] text-white border-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d] -rotate-1"
                  : "bg-white text-[#2d2d2d] border-[#2d2d2d]/30"
              }`}
            >
              Thứ {d + 2}
            </button>
          ))}
        </div>

        {/* Editing Popover Header if an active cell is selected */}
        {editingPos && (
          <div className="bg-[#fff9c4] border-b-[2.5px] border-[#2d2d2d] p-3 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 animate-in slide-in-from-top-2 shrink-0">
            <div className="flex items-center gap-2 font-kalam font-bold text-sm sm:text-base text-[#2d2d2d]">
              <span>✏️ Tiết {editingPos.r + 1} • Thứ {editingPos.d + 2} ({DAYS_SHORT[editingPos.d]})</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1 sm:max-w-xl">
              <input
                type="text"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                placeholder="Tên môn (Toán, Văn...)"
                className="hand-input flex-1 px-3 py-1.5 font-patrick font-bold text-sm sm:text-base bg-white focus:bg-[#fffde7] min-w-0"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyCell();
                }}
              />
              <input
                type="text"
                value={editTeacher}
                onChange={(e) => setEditTeacher(e.target.value)}
                placeholder="Giáo viên"
                className="hand-input w-28 sm:w-44 px-3 py-1.5 font-patrick font-bold text-sm sm:text-base bg-white focus:bg-[#fffde7]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyCell();
                }}
              />
              <button
                type="button"
                onClick={handleApplyCell}
                className="hand-btn hand-btn-blue px-3 sm:px-4 py-1.5 font-kalam font-bold text-sm sm:text-base text-white flex items-center gap-1 rounded-xl whitespace-nowrap shrink-0"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Áp dụng</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingPos(null)}
                className="hand-btn bg-white px-2.5 py-1.5 font-patrick font-bold text-sm sm:text-base rounded-xl shrink-0"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Schedule Content: Mobile Single Day Card List OR Full Matrix Grid */}
        <div className="flex-1 overflow-auto p-2.5 sm:p-4 custom-scrollbar">
          {activeDayFilter >= 0 ? (
            /* Mobile Single Day View (Vertical List of 10 Periods) */
            <div className="max-w-md mx-auto space-y-2 py-1">
              <div className="p-2.5 rounded-2xl bg-[#fff9c4] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d] text-center font-kalam font-bold text-base text-[#2d2d2d]">
                📅 Đang xem: Thứ {activeDayFilter + 2} ({DAYS_SHORT[activeDayFilter]})
              </div>

              {draftSchedule.map((row, r) => {
                const slot = TIME_SLOTS[r] ?? { start: "", end: "" };
                const cell = row[activeDayFilter];
                const isBeingEdited = editingPos?.r === r && editingPos?.d === activeDayFilter;

                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleStartEdit(r, activeDayFilter)}
                    className={`w-full p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-3 ${
                      isBeingEdited
                        ? "border-[#2d5da1] bg-[#e3f2fd] shadow-[3px_3px_0px_0px_#2d5da1]"
                        : cell?.subject
                        ? "bg-white border-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d] hover:bg-[#fffde7]"
                        : "bg-white/60 border-dashed border-[#2d2d2d]/40 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#f5efe6] border-2 border-[#2d2d2d] flex flex-col items-center justify-center shrink-0">
                        <span className="font-kalam font-bold text-sm text-[#2d2d2d] leading-none">T{r + 1}</span>
                        <span className="font-patrick text-[10px] text-[#2d2d2d]/60 leading-none mt-0.5">{slot.start}</span>
                      </div>

                      <div className="truncate">
                        {cell?.subject ? (
                          <>
                            <p className="font-patrick font-bold text-base text-[#2d2d2d] truncate leading-tight">
                              {cell.subject}
                            </p>
                            {cell.teacher && (
                              <p className="font-patrick text-xs font-bold text-[#2d5da1] truncate mt-0.5">
                                GV: {cell.teacher}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="font-patrick text-sm font-bold text-[#2d2d2d]/40">
                            + Nhấp để thêm môn học
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-xs font-bold text-[#2d5da1] px-2 py-1 rounded-lg bg-blue-50 border border-blue-200">
                      Sửa
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Full Table Grid View */
            <div className="min-w-[650px] sm:min-w-[720px]">
              {/* Header row: Days */}
              <div className="grid grid-cols-[60px_repeat(6,1fr)] sm:grid-cols-[70px_repeat(6,1fr)] gap-1.5 sm:gap-2 mb-2">
                <div className="text-center font-kalam font-bold text-sm sm:text-base text-[#2d2d2d] py-1.5 sm:py-2">
                  Tiết
                </div>
                {DAYS_SHORT.map((day, d) => (
                  <div
                    key={day}
                    className="text-center font-kalam font-bold text-sm sm:text-lg text-[#2d2d2d] py-1.5 sm:py-2 rounded-xl bg-[#fff9c4] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d]"
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
                    <div key={r} className="grid grid-cols-[60px_repeat(6,1fr)] sm:grid-cols-[70px_repeat(6,1fr)] gap-1.5 sm:gap-2 items-center">
                      {/* Time Label */}
                      <div className="text-right pr-1 sm:pr-2">
                        <p className="font-kalam font-bold text-sm sm:text-base text-[#2d2d2d] leading-none">
                          T{r + 1}
                        </p>
                        <p className="font-patrick text-[10px] sm:text-xs font-bold text-[#2d2d2d]/60 mt-0.5">
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
                            className={`min-h-[46px] sm:min-h-[50px] p-1.5 sm:p-2 rounded-xl border-2 text-left transition-all flex flex-col justify-center ${
                              isBeingEdited
                                ? "border-[#2d5da1] bg-[#e3f2fd] shadow-[3px_3px_0px_0px_#2d5da1]"
                                : cell?.subject
                                ? "bg-white border-[#2d2d2d] shadow-[1.5px_1.5px_0px_0px_#2d2d2d] hover:bg-[#fffde7] hover:scale-[1.01]"
                                : "bg-white/50 border-dashed border-[#2d2d2d]/40 hover:border-[#2d2d2d] hover:bg-white"
                            }`}
                          >
                            {cell?.subject ? (
                              <>
                                <p className="font-patrick font-bold text-xs sm:text-base text-[#2d2d2d] truncate leading-tight">
                                  {cell.subject}
                                </p>
                                {cell.teacher && (
                                  <p className="font-patrick text-[10px] sm:text-sm font-bold text-[#2d5da1] truncate leading-tight mt-0.5">
                                    {cell.teacher}
                                  </p>
                                )}
                              </>
                            ) : (
                              <span className="font-patrick text-xs font-bold text-[#2d2d2d]/40 text-center block">
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
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 sm:px-6 border-t-[2.5px] border-[#2d2d2d] bg-[#f5efe6] flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleClearAll}
            className="hand-btn bg-white hover:bg-[#ff4d4d] hover:text-white text-[#ff4d4d] font-kalam font-bold text-xs sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Làm trống bảng</span>
            <span className="sm:hidden">Làm trống</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="hand-btn bg-white font-kalam font-bold text-xs sm:text-base px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl text-[#2d2d2d]"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="hand-btn hand-btn-red font-kalam font-bold text-sm sm:text-lg px-4 sm:px-8 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl flex items-center gap-1.5 sm:gap-2"
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
