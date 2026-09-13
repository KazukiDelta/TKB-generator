"use client";

import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  Check,
  Palette,
  Sparkles,
  Settings,
  PlayCircle,
  Layers,
  ChevronDown,
  Edit3,
  School,
  Lock,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { ScheduleMatrix } from "@/types/schedule";
import { ThemeDefinition } from "@/types/theme";
import { StickerItem } from "@/types/sticker";
import { THEMES } from "@/config/themes";
import { STICKER_PRESETS } from "@/config/defaultStickers";
import { SAMPLE_CLASS, SAMPLE_SCHEDULE } from "@/utils/sampleData";
import {
  analyzeWorkbookSheet,
  extractScheduleForClass,
} from "@/utils/excelParser";
import { RenderOptions } from "@/utils/canvasRenderer";
import { getCurrentAcademicYear } from "@/utils/academicYear";

import Header from "@/components/Header";
import TimetableCanvas from "@/components/TimetableCanvas";
import ThemeSelector from "@/components/ThemeSelector";
import StickerManager from "@/components/StickerManager";
import SettingsModal from "@/components/SettingsModal";
import ScheduleEditorModal from "@/components/ScheduleEditorModal";
import DonateModal from "@/components/DonateModal";

interface SchoolSchedulePackage {
  fileName: string;
  sheetName: string;
  classes: string[];
  headerRowIndex: number;
  uploadedAt: string;
  academicYear?: string;
  scheduleByClass: Record<string, ScheduleMatrix>;
}

const STORAGE_KEY = "tkb_generator_v2_data";

export default function DashboardPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // School-wide schedule state
  const [schoolSchedule, setSchoolSchedule] = useState<SchoolSchedulePackage | null>(null);
  const [isSchoolScheduleActive, setIsSchoolScheduleActive] = useState<boolean>(false);

  // File & Excel States
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [allClasses, setAllClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [headerRowIndex, setHeaderRowIndex] = useState<number>(-1);
  const [processedSchedule, setProcessedSchedule] = useState<ScheduleMatrix | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Customization & Theme States
  const [currentTheme, setCurrentTheme] = useState<ThemeDefinition>(THEMES[0]);
  const [stickers, setStickers] = useState<StickerItem[]>([
    {
      id: "default-logo-sticker",
      src: "/logo.png",
      name: "TKB Logo",
      x: 1680,
      y: 80,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 0.95,
    },
  ]);

  // Options
  const [options, setOptions] = useState<RenderOptions>({
    removeTeacher: false,
    highlightNN2: true,
    nn2Color: "#4ade80",
    nn2Keywords: "Pháp, Trung, Nhật, Đức, Hàn",
    showWatermark: true,
    cellTextScale: 1.1,
    academicYear: getCurrentAcademicYear(),
    updatedDate: new Date().toLocaleDateString("vi-VN"),
  });

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedDark = localStorage.getItem("tkb_dark_mode") === "true";
    if (savedDark) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleToggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (typeof window !== "undefined") {
      localStorage.setItem("tkb_dark_mode", String(nextDark));
      if (nextDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  // Modals & UI States
  const [isStickerManagerOpen, setIsStickerManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScheduleEditorOpen, setIsScheduleEditorOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDonateOpen, setIsDonateOpen] = useState(false);

  // Restore saved preferences from LocalStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.themeId) {
          const found = THEMES.find((t) => t.id === parsed.themeId);
          if (found) setCurrentTheme(found);
        }
        if (parsed.options) {
          setOptions((prev) => ({ ...prev, ...parsed.options }));
        }
        if (Array.isArray(parsed.stickers) && parsed.stickers.length > 0) {
          setStickers(parsed.stickers);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save preferences to LocalStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const dataToSave = {
        themeId: currentTheme.id,
        options,
        stickers,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {
      // ignore
    }
  }, [currentTheme.id, options, stickers]);

  // Auto-fetch published school schedule on mount
  useEffect(() => {
    const fetchSchoolSchedule = async () => {
      try {
        const res = await fetch("/api/schedule");
        const json = await res.json();
        if (json.success && json.data && json.data.classes?.length > 0) {
          const pkg: SchoolSchedulePackage = json.data;
          setSchoolSchedule(pkg);
          setIsSchoolScheduleActive(true);
          setAllClasses(pkg.classes);

          // Select first class or keep existing if found
          const defaultClass = pkg.classes[0];
          setSelectedClass(defaultClass);

          if (pkg.scheduleByClass?.[defaultClass]) {
            setProcessedSchedule(pkg.scheduleByClass[defaultClass]);
          }

          if (pkg.academicYear) {
            setOptions((prev) => ({ ...prev, academicYear: pkg.academicYear! }));
          }
          if (pkg.uploadedAt) {
            setOptions((prev) => ({ ...prev, updatedDate: pkg.uploadedAt }));
          }
        }
      } catch (err) {
        console.warn("Could not auto-fetch school schedule:", err);
      }
    };

    fetchSchoolSchedule();
  }, []);

  // Load sample schedule immediately
  const handleLoadDemo = () => {
    setIsSchoolScheduleActive(false);
    setSelectedClass(SAMPLE_CLASS);
    setProcessedSchedule(SAMPLE_SCHEDULE);
    // Add demo motivation stickers
    setStickers([
      {
        id: "demo-sticker-1",
        src: STICKER_PRESETS[1].src, // "CỐ LÊN!"
        name: "Cố Lên!",
        x: 1620,
        y: 84,
        width: 150,
        height: 56,
        rotation: -4,
        opacity: 1,
      },
      {
        id: "demo-sticker-2",
        src: STICKER_PRESETS[6].src, // Ghim đỏ
        name: "Ghim Đỏ",
        x: 1600,
        y: 60,
        width: 50,
        height: 50,
        rotation: 8,
        opacity: 1,
      },
    ]);
  };

  // Handle Excel File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setIsSchoolScheduleActive(false);
    setLoading(true);
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);

        const likelySheet =
          wb.SheetNames.find((n) => n.toUpperCase().includes("DATA")) ||
          wb.SheetNames[0];

        setSelectedSheet(likelySheet);

        const result = analyzeWorkbookSheet(wb, likelySheet);
        if (!result) {
          alert("Không tìm thấy dòng tiêu đề chứa tên các lớp trong sheet này!");
          setLoading(false);
          return;
        }

        setAllClasses(result.classes);
        setHeaderRowIndex(result.headerRowIndex);

        // Auto select first class if available
        if (result.classes.length > 0) {
          const firstClass = result.classes[0];
          setSelectedClass(firstClass);
          const schedule = extractScheduleForClass(
            wb,
            likelySheet,
            firstClass,
            result.headerRowIndex
          );
          setProcessedSchedule(schedule);
        }
      } catch (err) {
        console.error("Excel read error:", err);
        alert("Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng file.");
        setFile(null);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  // Handle Sheet Change
  const handleSheetChange = (sheet: string) => {
    setSelectedSheet(sheet);
    if (!workbook) return;

    const result = analyzeWorkbookSheet(workbook, sheet);
    if (!result) {
      alert("Sheet này không có định dạng các lớp.");
      setAllClasses([]);
      setProcessedSchedule(null);
      return;
    }

    setAllClasses(result.classes);
    setHeaderRowIndex(result.headerRowIndex);

    if (result.classes.length > 0) {
      const firstClass = result.classes[0];
      setSelectedClass(firstClass);
      const schedule = extractScheduleForClass(
        workbook,
        sheet,
        firstClass,
        result.headerRowIndex
      );
      setProcessedSchedule(schedule);
    }
  };

  // Handle Class Selection
  const handleSelectClass = (clsName: string) => {
    setSelectedClass(clsName);

    // If school schedule is active, get from published school schedule
    if (isSchoolScheduleActive && schoolSchedule?.scheduleByClass?.[clsName]) {
      setProcessedSchedule(schoolSchedule.scheduleByClass[clsName]);
      return;
    }

    // Otherwise extract from current workbook
    if (!workbook || !selectedSheet || headerRowIndex === -1) return;

    const schedule = extractScheduleForClass(
      workbook,
      selectedSheet,
      clsName,
      headerRowIndex
    );
    setProcessedSchedule(schedule);
  };

  // Switch back to school schedule
  const handleSwitchToSchoolSchedule = () => {
    if (!schoolSchedule) return;
    setIsSchoolScheduleActive(true);
    setAllClasses(schoolSchedule.classes);
    const defaultCls = schoolSchedule.classes[0];
    setSelectedClass(defaultCls);
    if (schoolSchedule.scheduleByClass?.[defaultCls]) {
      setProcessedSchedule(schoolSchedule.scheduleByClass[defaultCls]);
    }
  };

  const handleSelectTheme = (theme: ThemeDefinition) => {
    setCurrentTheme(theme);
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-patrick transition-colors ${
        isDarkMode ? "dark bg-[#0e1117] text-[#f1f5f9]" : "bg-[#fdfbf7] text-[#2d2d2d]"
      }`}
    >
      {/* Header */}
      <Header
        onLoadDemo={handleLoadDemo}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDonate={() => setIsDonateOpen(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-12 gap-5 items-start">
          {/* LEFT SIDEBAR: File Upload, Class Select, Themes */}
          {isSidebarOpen && (
            <aside className="col-span-12 xl:col-span-3 lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-base font-bold font-kalam text-[#2d2d2d] dark:text-white uppercase tracking-wider">
                  Bảng Điều Khiển
                </span>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="hand-btn text-sm font-bold px-2.5 py-1"
                  title="Thu gọn để TKB to ra"
                >
                  <span>◀ Thu gọn (TKB To)</span>
                </button>
              </div>

              {/* School-wide Schedule Status Card (If published) */}
              {schoolSchedule && (
                <div className="hand-card-yellow hand-tape p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <School className="w-5 h-5 text-[#2d5da1]" />
                      <h3 className="text-lg font-bold font-kalam text-[#2d2d2d]">
                        TKB Toàn Trường
                      </h3>
                    </div>
                    {isSchoolScheduleActive ? (
                      <span className="hand-wobbly-sm px-2.5 py-0.5 bg-[#ff4d4d] text-white text-xs font-bold font-patrick border-[1.5px] border-[#2d2d2d] -rotate-1 shadow-sm">
                        ✓ Đang Đồng Bộ
                      </span>
                    ) : (
                      <span className="hand-wobbly-sm px-2.5 py-0.5 bg-white text-[#2d2d2d] text-xs font-bold font-patrick border-[1.5px] border-[#2d2d2d]">
                        File riêng
                      </span>
                    )}
                  </div>

                  <div className="text-base font-patrick text-[#2d2d2d]/80 space-y-0.5">
                    <p className="font-bold text-[#2d2d2d] truncate">{schoolSchedule.fileName}</p>
                    <p>{schoolSchedule.classes.length} Lớp • Cập nhật: {schoolSchedule.uploadedAt}</p>
                  </div>

                  {!isSchoolScheduleActive ? (
                    <button
                      type="button"
                      onClick={handleSwitchToSchoolSchedule}
                      className="hand-btn hand-btn-blue text-base font-bold w-full py-2"
                    >
                      Quay Lại TKB Trường
                    </button>
                  ) : (
                    <p className="text-sm font-patrick text-[#2d5da1] font-semibold italic">
                      * Đang đồng bộ trực tiếp. Bạn chỉ cần bấm chọn lớp bên dưới để xem.
                    </p>
                  )}
                </div>
              )}

              {/* Upload Box Card */}
              <div className="hand-card p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#2d5da1] dark:text-[#38bdf8]" />
                  <h3 className="text-lg font-bold font-kalam text-[#2d2d2d] dark:text-[#f8fafc]">
                    Tải Lên File TKB
                  </h3>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {!file ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full group rounded-2xl p-6 border-[2.5px] border-dashed border-[#2d2d2d] dark:border-[#383e52] bg-[#fdfbf7] dark:bg-[#13151d] hover:bg-[#fff9c4]/60 dark:hover:bg-[#1c202d] transition-all flex flex-col items-center gap-2 text-center hover:-rotate-1"
                  >
                    <div className="p-3 rounded-2xl bg-white dark:bg-[#1e222e] border-2 border-[#2d2d2d] dark:border-[#383e52] text-[#2d2d2d] dark:text-[#f8fafc] shadow-[2px_2px_0px_0px_#2d2d2d] dark:shadow-[2px_2px_0px_0px_#090a0f] group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-base font-bold font-patrick text-[#2d2d2d] dark:text-[#f8fafc]">Chọn file Excel (.xlsx, .xls)</p>
                    <p className="text-sm font-patrick text-[#2d2d2d]/60 dark:text-[#94a3b8]">hoặc kéo thả file vào đây</p>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-[#f0fdf4] dark:bg-[#14261c] border-2 border-[#2d2d2d] dark:border-[#22c55e] flex items-center justify-between shadow-[2px_2px_0px_0px_#2d2d2d] dark:shadow-[2px_2px_0px_0px_#090a0f]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Check className="w-5 h-5 text-[#16a34a] flex-shrink-0 stroke-[3]" />
                        <div className="truncate">
                          <p className="text-base font-bold font-patrick text-[#2d2d2d] dark:text-[#f8fafc] truncate">{file.name}</p>
                          <p className="text-xs font-patrick text-[#2d2d2d]/60 dark:text-[#94a3b8]">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm font-bold font-patrick text-[#2d5da1] dark:text-[#38bdf8] hover:underline flex-shrink-0 ml-2"
                      >
                        Đổi file
                      </button>
                    </div>

                    {/* Sheet Selector (if multiple) */}
                    {sheetNames.length > 1 && (
                      <div className="space-y-1">
                        <label className="text-sm font-bold font-patrick text-[#2d2d2d] dark:text-[#e2e8f0] block">
                          Chọn Sheet dữ liệu:
                        </label>
                        <select
                          value={selectedSheet}
                          onChange={(e) => handleSheetChange(e.target.value)}
                          className="w-full px-3 py-2 hand-input text-base"
                        >
                          {sheetNames.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Class Selector Card */}
              {allClasses.length > 0 && (
                <div className="hand-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold font-kalam text-[#2d2d2d] dark:text-[#f8fafc]">
                      Chọn Lớp ({allClasses.length})
                    </h3>
                    <span className="text-base font-bold font-patrick text-[#ff4d4d]">
                      {selectedClass || "Chưa chọn"}
                    </span>
                  </div>

                  <div
                    data-lenis-prevent
                    className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto custom-scrollbar p-1"
                  >
                    {allClasses.map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => handleSelectClass(cls)}
                        className={`hand-wobbly-sm px-2.5 py-2 text-base font-bold font-patrick transition-all truncate border-2 border-[#2d2d2d] ${
                          selectedClass === cls
                            ? "bg-[#ff4d4d] text-white shadow-[2.5px_2.5px_0px_0px_#2d2d2d] dark:shadow-[2px_2px_0px_0px_#090a0f] -rotate-1"
                            : "bg-white dark:bg-[#1e222e] hover:bg-[#fff9c4] dark:hover:bg-[#282e3f] text-[#2d2d2d] dark:text-[#e2e8f0] dark:border-[#383e52] shadow-[1.5px_1.5px_0px_0px_#2d2d2d] dark:shadow-[1.5px_1.5px_0px_0px_#090a0f] hover:-rotate-1"
                        }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Edit Schedule Shortcut Card */}
              {processedSchedule && (
                <div className="hand-card p-4 flex items-center justify-between bg-[#f0f9ff] dark:bg-[#142030] border-2 border-[#2d2d2d] dark:border-[#0284c7]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white dark:bg-[#1e222e] border-2 border-[#2d2d2d] dark:border-[#383e52] text-[#2d5da1] dark:text-[#38bdf8] shadow-[2px_2px_0px_0px_#2d2d2d] dark:shadow-[2px_2px_0px_0px_#090a0f]">
                      <Edit3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold font-kalam text-[#2d2d2d] dark:text-[#f8fafc]">Chỉnh Sửa TKB</h4>
                      <p className="text-sm font-patrick text-[#2d2d2d]/60 dark:text-[#94a3b8]">Sửa môn, GV hoặc thêm bớt tiết</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsScheduleEditorOpen(true)}
                    className="hand-btn hand-btn-blue text-base font-bold px-3.5 py-1.5"
                  >
                    Mở Bảng Sửa
                  </button>
                </div>
              )}

              {/* Theme Selector Card */}
              <div className="hand-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-[#2d5da1] dark:text-[#38bdf8]" />
                    <h3 className="text-lg font-bold font-kalam text-[#2d2d2d] dark:text-[#f8fafc]">
                      Giao Diện (Theme)
                    </h3>
                  </div>
                  <span className="text-base font-bold font-patrick text-[#2d5da1] dark:text-[#38bdf8]">
                    {currentTheme.shortName || currentTheme.name}
                  </span>
                </div>

                <ThemeSelector
                  currentTheme={currentTheme}
                  onSelectTheme={handleSelectTheme}
                />
              </div>

              {/* Sticker Button Shortcut */}
              <div className="hand-card p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white dark:bg-[#1e222e] border-2 border-[#2d2d2d] dark:border-[#383e52] text-[#ff4d4d] shadow-[2px_2px_0px_0px_#2d2d2d] dark:shadow-[2px_2px_0px_0px_#090a0f]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold font-kalam text-[#2d2d2d] dark:text-[#f8fafc]">Trang Trí Sticker</h4>
                    <p className="text-sm font-patrick text-[#2d2d2d]/60 dark:text-[#94a3b8]">{stickers.length} sticker trên TKB</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsStickerManagerOpen(true)}
                  className="hand-btn text-base font-bold px-4 py-2"
                >
                  Mở Quản Lý
                </button>
              </div>

              {/* Donate Creator Card */}
              <div className="hand-card-yellow hand-thumbtack p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white border-2 border-[#2d2d2d] text-[#ff4d4d] shadow-[2px_2px_0px_0px_#2d2d2d]">
                    <Heart className="w-5 h-5 fill-[#ff4d4d]/30" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold font-kalam text-[#2d2d2d]">Ủng Hộ Creator</h4>
                    <p className="text-sm font-patrick text-[#2d2d2d]/75 font-semibold">Mời ly trà sữa / cà phê</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDonateOpen(true)}
                  className="hand-btn text-base font-bold px-4 py-1.5 bg-[#ff4d4d] text-white hover:bg-[#e11d48]"
                >
                  Donate
                </button>
              </div>

              {/* Discreet Admin Entry */}
              <div className="pt-2 text-center">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-sm font-bold font-patrick text-[#2d2d2d]/50 dark:text-white/60 hover:text-[#ff4d4d] dark:hover:text-[#ff4d4d] transition-colors"
                  title="Cổng Quản Trị Hệ Thống"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Cổng Quản Trị Trường</span>
                </Link>
              </div>
            </aside>
          )}

          {/* RIGHT MAIN: Canvas Timetable Preview & Export */}
          <section className={`${isSidebarOpen ? "col-span-12 xl:col-span-9 lg:col-span-8" : "col-span-12"} space-y-4 transition-all duration-300`}>
            {/* Floating button when sidebar is collapsed to re-open easily */}
            {!isSidebarOpen && (
              <div className="hand-card p-3.5 px-5 flex flex-wrap items-center justify-between text-base font-patrick font-bold shadow-[4px_4px_0px_0px_#2d2d2d]">
                <div className="flex items-center gap-3">
                  <span className="inline-block w-3 h-3 rounded-full bg-[#ff4d4d] border-[1.5px] border-[#2d2d2d] animate-pulse" />
                  <span className="font-kalam text-lg text-[#2d2d2d]">Chế độ Phóng To TKB</span>
                  <span className="text-[#2d2d2d]/30">•</span>
                  <span className="text-[#2d2d2d]">Lớp: {selectedClass || "Chưa chọn"}</span>
                  <span className="text-[#2d2d2d]/30">•</span>
                  <span className="text-[#2d5da1]">{currentTheme.shortName || currentTheme.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="hand-btn text-base font-bold px-4 py-1.5 bg-[#fef08a]"
                >
                  <span>☰ Mở Lại Bảng Công Cụ</span>
                </button>
              </div>
            )}

            {!processedSchedule ? (
              /* Empty state placeholder */
              <div className="hand-card p-12 text-center min-h-[550px] space-y-6 flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="w-28 h-28 rounded-3xl bg-[#fff9c4] border-[2.5px] border-[#2d2d2d] shadow-[4px_4px_0px_0px_#2d2d2d] flex items-center justify-center -rotate-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logo.png"
                      alt="TKB Generator"
                      className="w-20 h-20 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-[#ff4d4d] text-white border-2 border-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>

                <div className="max-w-md space-y-2">
                  <h3 className="text-3xl font-black font-kalam text-[#2d2d2d]">
                    Sẵn Sàng Tạo Thời Khóa Biểu
                  </h3>
                  <p className="text-lg font-patrick text-[#2d2d2d]/70 leading-relaxed font-semibold">
                    Hãy chọn lớp từ TKB trường, tải lên file Excel riêng, hoặc nhấn nút bên dưới để trải nghiệm dữ liệu mẫu ngay lập tức!
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={handleLoadDemo}
                    className="hand-btn hand-btn-yellow text-lg font-bold px-6 py-3"
                  >
                    <PlayCircle className="w-5 h-5" />
                    <span>Xem Dữ Liệu Mẫu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="hand-btn text-lg font-bold px-6 py-3"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Tải File Excel Của Bạn</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Live WYSIWYG Canvas Timetable */
              <TimetableCanvas
                schedule={processedSchedule}
                selectedClass={selectedClass}
                theme={currentTheme}
                stickers={stickers}
                onUpdateStickers={setStickers}
                onUpdateSchedule={setProcessedSchedule}
                options={options}
                onOpenStickerManager={() => setIsStickerManagerOpen(true)}
                onOpenScheduleEditor={() => setIsScheduleEditorOpen(true)}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              />
            )}
          </section>
        </div>
      </main>

      {/* Modals */}
      <StickerManager
        isOpen={isStickerManagerOpen}
        onClose={() => setIsStickerManagerOpen(false)}
        stickers={stickers}
        onUpdateStickers={setStickers}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        options={options}
        onChangeOptions={setOptions}
      />

      {isScheduleEditorOpen && processedSchedule && (
        <ScheduleEditorModal
          key={`${selectedClass}-${processedSchedule.map((r) => r.map((c) => c?.subject || "").join(",")).join(";")}`}
          isOpen={isScheduleEditorOpen}
          onClose={() => setIsScheduleEditorOpen(false)}
          schedule={processedSchedule}
          selectedClass={selectedClass}
          onSaveSchedule={setProcessedSchedule}
        />
      )}

      <DonateModal
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
      />
    </div>
  );
}


