"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import * as XLSX from "xlsx";
import {
  Upload,
  LayoutDashboard,
  FileSpreadsheet,
  Download,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  Layers,
  Check,
  ChevronDown,
  Sparkles,
  Calendar,
  Zap,
  Palette,
} from "lucide-react";
import { saveAs } from "file-saver";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utilities
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
type ScheduleCell = {
  subject: string;
  teacher: string;
  originalText: string;
  type: "main" | "nn2" | "activity" | "empty";
};

type ScheduleMatrix = (ScheduleCell | null)[][];
type SheetData = unknown[][];

type ExportTheme = {
  panelFill: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  cellFill: string;
  cellBorder: string;
  cellEmptyFill: string;
  cellEmptyBorder: string;
};

// Themes
const THEMES = [
  {
    id: "cyberpunk",
    name: "Cyberpunk Neon",
    exportBg: "#0f172a",
    exportMesh:
      "radial-gradient(1100px circle at 18% 12%, rgba(34,211,238,0.18), transparent 60%), radial-gradient(900px circle at 82% 28%, rgba(168,85,247,0.20), transparent 60%), radial-gradient(1000px circle at 50% 92%, rgba(236,72,153,0.14), transparent 60%), linear-gradient(180deg, rgba(2,6,23,0.15), rgba(2,6,23,0.92))",
    previewColors: ["#9333ea", "#06b6d4"],
    text: "text-white",
    accent: "bg-cyan-500 text-black",
    card_empty: "bg-slate-800/30 border-white/5",
    card_filled: "bg-slate-800/80 border-white/10 hover:border-cyan-500/50",
    highlight: "#F0ABFC",
    panelBg: "bg-slate-900/80",
    panelBorder: "border-white/10",
    titleColor: "text-white",
    dayColor: "text-white/80",
    timeColor: "text-white/40",
    sigColor: "text-white/40",
    emptyDot: "bg-white/10",
    divider: "border-white/10",
  },
  {
    id: "sunset",
    name: "Sunset Bliss",
    exportBg: "#2F0743",
    exportMesh:
      "radial-gradient(1000px circle at 18% 18%, rgba(255,0,153,0.18), transparent 58%), radial-gradient(950px circle at 78% 25%, rgba(255,106,0,0.18), transparent 60%), radial-gradient(1100px circle at 50% 92%, rgba(253,186,116,0.12), transparent 62%), linear-gradient(180deg, rgba(12,1,18,0.05), rgba(12,1,18,0.86))",
    previewColors: ["#ff0099", "#ff6a00"],
    text: "text-white",
    accent: "bg-[#ff6a00] text-white",
    card_empty: "bg-white/5 border-white/5",
    card_filled: "bg-white/10 border-white/20 hover:border-pink-400/50",
    highlight: "#FDBA74",
    panelBg: "bg-[#2F0743]/90",
    panelBorder: "border-white/15",
    titleColor: "text-white",
    dayColor: "text-white/80",
    timeColor: "text-white/40",
    sigColor: "text-white/40",
    emptyDot: "bg-white/10",
    divider: "border-white/15",
  },
  {
    id: "oceanic",
    name: "Deep Ocean",
    exportBg: "#0c1929",
    exportMesh:
      "radial-gradient(1100px circle at 18% 14%, rgba(20,184,166,0.16), transparent 60%), radial-gradient(1000px circle at 82% 26%, rgba(37,99,235,0.16), transparent 60%), radial-gradient(1100px circle at 50% 92%, rgba(99,102,241,0.12), transparent 62%), linear-gradient(180deg, rgba(2,6,23,0.10), rgba(2,6,23,0.90))",
    previewColors: ["#2563eb", "#14b8a6"],
    text: "text-blue-50",
    accent: "bg-teal-400 text-slate-900",
    card_empty: "bg-slate-800/30 border-blue-200/5",
    card_filled: "bg-slate-700/50 border-blue-200/10 hover:border-teal-400/50",
    highlight: "#5EEAD4",
    panelBg: "bg-slate-900/85",
    panelBorder: "border-blue-200/10",
    titleColor: "text-blue-50",
    dayColor: "text-blue-100/80",
    timeColor: "text-blue-100/40",
    sigColor: "text-blue-100/40",
    emptyDot: "bg-blue-200/10",
    divider: "border-blue-200/10",
  },
  {
    id: "light",
    name: "Light & Fresh",
    exportBg: "#f0f4f8",
    exportMesh:
      "radial-gradient(900px circle at 18% 14%, rgba(99,102,241,0.22), transparent 60%), radial-gradient(900px circle at 82% 24%, rgba(244,114,182,0.22), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.92), rgba(240,244,248,1))",
    previewColors: ["#6366f1", "#f472b6"],
    text: "text-slate-700",
    accent: "bg-indigo-500 text-white",
    card_empty: "bg-white border-slate-200",
    card_filled: "bg-white border-slate-300 hover:border-indigo-400 shadow-sm",
    highlight: "#818cf8",
    panelBg: "bg-white/95",
    panelBorder: "border-slate-200",
    titleColor: "text-slate-800",
    dayColor: "text-slate-500",
    timeColor: "text-slate-400",
    sigColor: "text-slate-300",
    emptyDot: "bg-slate-200",
    divider: "border-slate-200",
  },
];

const PREVIEW_BASE_WIDTH = 1920;
const PREVIEW_BASE_HEIGHT = 1080;

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const SETTINGS_STORAGE_KEY = "tkb_generator_settings_v1";

const TIME_SLOTS: Array<{ start: string; end: string }> = [
  { start: "7:00", end: "7:45" },
  { start: "7:50", end: "8:35" },
  { start: "9:05", end: "9:50" },
  { start: "9:55", end: "10:40" },
  { start: "10:45", end: "11:30" },
  { start: "12:50", end: "13:35" },
  { start: "13:40", end: "14:25" },
  { start: "14:30", end: "15:15" },
  { start: "15:25", end: "16:10" },
  { start: "16:15", end: "17:00" },
];

export default function DashboardPage() {
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetName, setSheetName] = useState<string>("");
  const [allClasses, setAllClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [processedSchedule, setProcessedSchedule] =
    useState<ScheduleMatrix | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [removeTeacher, setRemoveTeacher] = useState<boolean>(true);
  const [highlightNN2, setHighlightNN2] = useState<boolean>(true);
  const [nn2Color, setNn2Color] = useState<string>("#4ade80");
  const [nn2Keywords, setNn2Keywords] = useState<string>("Pháp, Trung");
  const [currentTheme, setCurrentTheme] = useState(THEMES[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);
  const [showSticker, setShowSticker] = useState(true);
  const [useImageLogo, setUseImageLogo] = useState(true);
  const [useLoadingGif, setUseLoadingGif] = useState(true);
  const [previewZoomScale, setPreviewZoomScale] = useState(1);
  const [userPreviewZoom, setUserPreviewZoom] = useState(false);
  const [zoomPercentInput, setZoomPercentInput] = useState("100");
  const [cellTextScale, setCellTextScale] = useState(1);

  const tableRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewOuterRef = useRef<HTMLDivElement>(null);
  const hadScheduleRef = useRef(false);
  const didHydrateSettingsRef = useRef(false);
  const hadPersistedSettingsRef = useRef(false);
  const computeAutoZoom = React.useCallback(() => {
    const outer = previewOuterRef.current;
    if (!outer) return;
    const width = outer.clientWidth;
    const rawScale = (width - 2) / PREVIEW_BASE_WIDTH;
    const scale = clamp(rawScale, 0.3, 1);
    setPreviewZoomScale(Number.isFinite(scale) ? scale : 1);
    setZoomPercentInput(`${Math.round(scale * 100)}`);
  }, []);

  const runAutoZoomStabilized = React.useCallback(() => {
    let frames = 0;
    let lastWidth = -1;

    const tick = () => {
      frames += 1;
      const outer = previewOuterRef.current;
      const width = outer?.clientWidth ?? 0;
      if (width > 0) {
        computeAutoZoom();
        if (Math.abs(width - lastWidth) < 0.5 && frames >= 3) return;
        lastWidth = width;
      }
      // AnimatePresence `mode="wait"` can delay mounting the preview by ~0.4s,
      // so we keep retrying long enough to catch the first render.
      if (frames < 90) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [computeAutoZoom]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      hadPersistedSettingsRef.current = true;
      const obj = parsed as Record<string, unknown>;

      if (typeof obj.removeTeacher === "boolean")
        setRemoveTeacher(obj.removeTeacher);
      if (typeof obj.highlightNN2 === "boolean")
        setHighlightNN2(obj.highlightNN2);
      if (typeof obj.nn2Color === "string") setNn2Color(obj.nn2Color);
      if (typeof obj.nn2Keywords === "string") setNn2Keywords(obj.nn2Keywords);
      if (typeof obj.showWatermark === "boolean")
        setShowWatermark(obj.showWatermark);
      if (typeof obj.showSticker === "boolean") setShowSticker(obj.showSticker);
      if (typeof obj.showSettings === "boolean")
        setShowSettings(obj.showSettings);

      if (typeof obj.themeId === "string") {
        const foundTheme = THEMES.find((t) => t.id === obj.themeId);
        if (foundTheme) setCurrentTheme(foundTheme);
      }

      if (typeof obj.userPreviewZoom === "boolean")
        setUserPreviewZoom(obj.userPreviewZoom);
      if (
        typeof obj.previewZoomScale === "number" &&
        Number.isFinite(obj.previewZoomScale)
      ) {
        setPreviewZoomScale(clamp(obj.previewZoomScale, 0.3, 2.5));
      }
      if (typeof obj.zoomPercentInput === "string")
        setZoomPercentInput(obj.zoomPercentInput);
      if (
        typeof obj.cellTextScale === "number" &&
        Number.isFinite(obj.cellTextScale)
      )
        setCellTextScale(clamp(obj.cellTextScale, 0.85, 1.5));
    } catch {
      // ignore
    } finally {
      didHydrateSettingsRef.current = true;
    }
  }, []);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (!didHydrateSettingsRef.current) return;
    const payload = {
      removeTeacher,
      highlightNN2,
      nn2Color,
      nn2Keywords,
      themeId: currentTheme.id,
      showWatermark,
      showSticker,
      showSettings,
      userPreviewZoom,
      previewZoomScale,
      zoomPercentInput,
      cellTextScale,
    };
    try {
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(payload),
      );
    } catch {
      // ignore
    }
  }, [
    removeTeacher,
    highlightNN2,
    nn2Color,
    nn2Keywords,
    currentTheme.id,
    showWatermark,
    showSticker,
    showSettings,
    userPreviewZoom,
    previewZoomScale,
    zoomPercentInput,
    cellTextScale,
  ]);

  useLayoutEffect(() => {
    // Default to AUTO on first load if nothing was persisted (Fast Refresh can preserve state).
    if (!hadPersistedSettingsRef.current) setUserPreviewZoom(false);
  }, []);

  useLayoutEffect(() => {
    // When the preview appears for the first time, compute AUTO zoom immediately.
    const hasSchedule = Boolean(processedSchedule);
    if (!hadScheduleRef.current && hasSchedule) {
      setUserPreviewZoom(false);
      runAutoZoomStabilized();
    }
    hadScheduleRef.current = hasSchedule;
  }, [processedSchedule, runAutoZoomStabilized]);

  useLayoutEffect(() => {
    if (!processedSchedule) return;
    if (userPreviewZoom) return;

    runAutoZoomStabilized();
    const outer = previewOuterRef.current;
    if (!outer) return;
    const ro = new ResizeObserver(computeAutoZoom);
    ro.observe(outer);
    window.addEventListener("resize", computeAutoZoom);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", computeAutoZoom);
    };
  }, [
    processedSchedule,
    userPreviewZoom,
    computeAutoZoom,
    runAutoZoomStabilized,
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setLoading(true);
    setFile(uploadedFile);
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          setWorkbook(wb);
          const likelySheet =
            wb.SheetNames.find((n) => n.toUpperCase().includes("DATA")) ||
            wb.SheetNames[0];
          setSheetName(likelySheet);
          analyzeSheet(wb, likelySheet);
        } catch {
          alert("Lỗi đọc file Excel.");
          setFile(null);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsBinaryString(uploadedFile);
    }, 1500);
  };

  const analyzeSheet = (wb: XLSX.WorkBook, sheet: string) => {
    const ws = wb.Sheets[sheet];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as SheetData;
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const row = data[i];
      if (row && row.length > 3) {
        const hasClassNames = row.slice(3).some((cell: unknown) => {
          if (typeof cell === "string") {
            return /^\d+[A-Z]/.test(cell.trim());
          }
          return false;
        });
        if (hasClassNames) {
          headerRowIndex = i;
          break;
        }
      }
    }
    if (headerRowIndex === -1) {
      alert("Không tìm thấy dòng tiêu đề chứa tên các lớp!");
      return;
    }
    const classesSet = new Set<string>();
    const headerRow = data[headerRowIndex];
    for (let col = 3; col < headerRow.length; col++) {
      const cell = headerRow[col];
      if (cell && typeof cell === "string") {
        const trimmed = cell.trim();
        if (/^\d+[A-Z]/.test(trimmed)) {
          classesSet.add(trimmed);
        }
      }
    }
    setAllClasses(Array.from(classesSet).sort());
  };

  const handleSelectClass = (className: string) => {
    setSelectedClass(className);
    setUserPreviewZoom(false);
    if (!workbook || !sheetName) return;
    const ws = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as SheetData;
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const row = data[i];
      if (row && row.length > 3) {
        const hasClassNames = row.slice(3).some((cell: unknown) => {
          if (typeof cell === "string") {
            return /^\d+[A-Z]/.test(cell.trim());
          }
          return false;
        });
        if (hasClassNames) {
          headerRowIndex = i;
          break;
        }
      }
    }
    if (headerRowIndex === -1) return;
    const headerRow = data[headerRowIndex];
    let classColumnIndex = -1;
    for (let col = 3; col < headerRow.length; col++) {
      const cell = headerRow[col];
      if (cell && typeof cell === "string" && cell.trim() === className) {
        classColumnIndex = col;
        break;
      }
    }
    if (classColumnIndex === -1) {
      alert(`Không tìm thấy cột cho lớp ${className}`);
      return;
    }
    // Render expects a 10 (periods) x 6 (days) matrix.
    const schedule: ScheduleMatrix = Array(10)
      .fill(null)
      .map(() => Array(6).fill(null));

    const coerceInt = (value: unknown): number | null => {
      if (typeof value === "number" && Number.isFinite(value))
        return Math.trunc(value);
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const normalized = trimmed.replace(",", ".");
        const asNumber = Number(normalized);
        if (Number.isFinite(asNumber)) return Math.trunc(asNumber);
        const m = trimmed.match(/-?\d+/);
        if (m) return Number(m[0]);
      }
      return null;
    };

    const parseThu = (value: unknown): number | null => {
      const direct = coerceInt(value);
      if (direct !== null) return direct;
      if (typeof value === "string") {
        const s = value.trim().toUpperCase();
        if (!s) return null;
        if (s === "CN" || s.includes("CHỦ NHẬT") || s.includes("CHU NHAT"))
          return 8;
        const m = s.match(/(\d+)/);
        if (m) return coerceInt(m[1]);
      }
      return null;
    };

    let currentDay = -1;
    let periodOffset = 0;
    let filledCount = 0;
    for (let row = headerRowIndex + 1; row < data.length; row++) {
      const rowData = data[row];
      if (!rowData) continue;
      const thu = rowData[0];
      const buoi = rowData[1];
      const tiet = rowData[2];
      const cellContent = rowData[classColumnIndex];
      const parsedThu = parseThu(thu);
      if (parsedThu !== null) {
        currentDay = parsedThu - 2;
      }
      if (typeof buoi === "string" && buoi.trim()) {
        const session = buoi.toUpperCase().trim();
        const leading = session[0];
        if (leading === "S") {
          periodOffset = 0;
        } else if (leading === "C") {
          periodOffset = 5;
        }
      }
      let periodIndex = -1;
      const parsedTiet = coerceInt(tiet);
      if (parsedTiet !== null) {
        periodIndex = parsedTiet - 1 + periodOffset;
      }
      if (
        currentDay >= 0 &&
        currentDay < 6 &&
        periodIndex >= 0 &&
        periodIndex < 10
      ) {
        if (cellContent && typeof cellContent === "string") {
          const text = cellContent.replace(/\s+/g, " ").trim();
          schedule[periodIndex][currentDay] = parsePeriodText(text);
          filledCount++;
        } else {
          schedule[periodIndex][currentDay] = null;
        }
      }
    }
    setProcessedSchedule(schedule);
    setUserPreviewZoom(false);
    runAutoZoomStabilized();
    if (filledCount === 0) {
      console.warn(
        "[TKB] Parsed 0 cells. Check sheet format for columns Thứ/Buổi/Tiết.",
        {
          sheetName,
          selectedClass: className,
          headerRowIndex,
          classColumnIndex,
        },
      );
    }
  };

  function parsePeriodText(text: string): ScheduleCell {
    if (!text) {
      return { subject: "", teacher: "", originalText: "", type: "empty" };
    }
    const isActivity = /^(sinh hoạt|shđt|sinhhoạt)/i.test(text);
    if (isActivity) {
      return {
        subject: "Sinh Hoạt Đầu Tuần",
        teacher: "",
        originalText: text,
        type: "activity",
      };
    }
    const dashSep = /^(.+?)(?:\s*[–-]\s*)(.+)$/.exec(text);
    if (dashSep) {
      const left = dashSep[1].trim();
      const right = dashSep[2].trim();
      const hasSpacesAroundDash = /\s[–-]\s/.test(text);
      const rightLooksLikeTeacher = /[\s,]/.test(right);
      if (hasSpacesAroundDash || rightLooksLikeTeacher) {
        return {
          subject: left,
          teacher: right,
          originalText: text,
          type: "main",
        };
      }
    }
    const codeDashDash = /^([A-ZĐ]{2,6})-([A-ZĐ]{2,5})-(.+)$/.exec(text);
    if (codeDashDash) {
      const teachers = codeDashDash[3]
        .split(/[,-]/)
        .map((p) => p.trim())
        .filter(Boolean)
        .join(", ");
      return {
        subject: `${codeDashDash[1].trim()}-${codeDashDash[2].trim()}`,
        teacher: teachers,
        originalText: text,
        type: "main",
      };
    }
    // Compact "Môn-GV" form: keep everything before the LAST "-" as the subject.
    // Examples: "Ngữ văn-Quỳnh.T", "Lịch sử-Nương", "GDKT-PL-Trí", "Chuyên 1 - GV1 - GV2".
    if (text.includes("-")) {
      const parts = text
        .split("-")
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length >= 2) {
        // NEW: Check if this is "Chuyên X - GV1 - GV2" pattern
        const firstLooksLikeSubject = /[a-zà-ỹ]/i.test(parts[0] ?? "");
        const firstIsCode = /^[A-Z\u0110]{2,6}$/.test(parts[0] ?? "");

        if (firstLooksLikeSubject && !firstIsCode && parts.length >= 2) {
          // Format: "Chuyên 1 - GV1 - GV2..."
          const subjectCandidate = parts[0];
          const teacherCandidate = parts.slice(1).join(", ");
          if (subjectCandidate && teacherCandidate) {
            return {
              subject: subjectCandidate,
              teacher: teacherCandidate,
              originalText: text,
              type: "main",
            };
          }
        }

        // Original logic for CODE-based formats
        if (firstIsCode && parts.length >= 3) {
          const secondIsCode = /^[A-Z\u0110]{1,5}$/.test(parts[1] ?? "");
          const subjectPartsCount = secondIsCode ? 2 : 1;
          const subjectCandidate = parts.slice(0, subjectPartsCount).join("-");
          const teacherCandidate = parts.slice(subjectPartsCount).join(", ");
          if (subjectCandidate && teacherCandidate) {
            return {
              subject: subjectCandidate,
              teacher: teacherCandidate,
              originalText: text,
              type: "main",
            };
          }
        }

        const teacherCandidate = parts[parts.length - 1] ?? "";
        const subjectCandidate = parts.slice(0, -1).join("-");
        const teacherLooksLike =
          /[a-zà-ỹ.]/.test(teacherCandidate) || /[\s,]/.test(teacherCandidate);
        const teacherLooksLikeRobust =
          /[A-Za-z]/.test(teacherCandidate) ||
          /[^\x00-\x7F]/.test(teacherCandidate) ||
          /[.,\s]/.test(teacherCandidate);
        const isShortCode = /^[A-Z]{1,3}$/.test(teacherCandidate);
        if (
          subjectCandidate &&
          (teacherLooksLike || teacherLooksLikeRobust) &&
          !isShortCode
        ) {
          return {
            subject: subjectCandidate,
            teacher: teacherCandidate,
            originalText: text,
            type: "main",
          };
        }
      }
    }
    const match2 = /^(.+)\((.+)\)$/.exec(text);
    if (match2) {
      return {
        subject: match2[1].trim(),
        teacher: match2[2].trim(),
        originalText: text,
        type: "main",
      };
    }
    return {
      subject: text,
      teacher: "",
      originalText: text,
      type: "main",
    };
  }

  const isNN2 = (text: string): boolean => {
    if (!highlightNN2) return false;
    if (!text) return false;
    const kw = nn2Keywords.split(",").map((s) => s.trim().toLowerCase());
    const lower = text.toLowerCase();
    return kw.some((k) => lower.includes(k));
  };

  const handleExportImage = async () => {
    if (!processedSchedule) return;
    setExporting(true);
    setTimeout(async () => {
      try {
        const loadImage = (src: string) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => resolve(img);
            img.onerror = () =>
              reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
          });

        const isProbablyBlank = (canvas: HTMLCanvasElement) => {
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return false;
          const points: Array<[number, number]> = [
            [10, 10],
            [100, 100],
            [400, 120],
            [900, 200],
            [1600, 300],
            [300, 700],
            [900, 700],
            [1600, 900],
          ];
          const colors = points
            .filter(([x, y]) => x < canvas.width && y < canvas.height)
            .map(([x, y]) => Array.from(ctx.getImageData(x, y, 1, 1).data));
          if (colors.length < 2) return false;
          const first = colors[0].join(",");
          return colors.every((c) => c.join(",") === first);
        };

        const resolveExportTheme = (): ExportTheme => {
          if (currentTheme.id === "light") {
            return {
              panelFill: "rgba(255,255,255,0.94)",
              panelBorder: "rgba(148,163,184,0.40)",
              textPrimary: "#0f172a",
              textMuted: "rgba(15,23,42,0.65)",
              cellFill: "rgba(255,255,255,0.95)",
              cellBorder: "rgba(148,163,184,0.35)",
              cellEmptyFill: "rgba(255,255,255,0.80)",
              cellEmptyBorder: "rgba(148,163,184,0.18)",
            };
          }
          return {
            panelFill: "rgba(2,6,23,0.65)",
            panelBorder: "rgba(255,255,255,0.12)",
            textPrimary: "#ffffff",
            textMuted: "rgba(255,255,255,0.65)",
            cellFill: "rgba(15,23,42,0.70)",
            cellBorder: "rgba(255,255,255,0.12)",
            cellEmptyFill: "rgba(15,23,42,0.25)",
            cellEmptyBorder: "rgba(255,255,255,0.08)",
          };
        };

        const hexToRgba = (hex: string, alpha01: number) => {
          const cleaned = hex.trim().replace("#", "");
          if (cleaned.length !== 6) return `rgba(0,0,0,${alpha01})`;
          const r = parseInt(cleaned.slice(0, 2), 16);
          const g = parseInt(cleaned.slice(2, 4), 16);
          const b = parseInt(cleaned.slice(4, 6), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha01})`;
        };

        const drawRoundedRect = (
          ctx: CanvasRenderingContext2D,
          x: number,
          y: number,
          w: number,
          h: number,
          r: number,
        ) => {
          const radius = Math.min(r, w / 2, h / 2);
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.arcTo(x + w, y, x + w, y + h, radius);
          ctx.arcTo(x + w, y + h, x, y + h, radius);
          ctx.arcTo(x, y + h, x, y, radius);
          ctx.arcTo(x, y, x + w, y, radius);
          ctx.closePath();
        };

        const W = 1920;
        const H = 1080;
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Cannot create canvas context");

        // Background
        ctx.fillStyle = currentTheme.exportBg;
        ctx.fillRect(0, 0, W, H);

        // Simple mesh approximation (avoid CSS gradients / oklab parsing)
        const [c1, c2] = currentTheme.previewColors;
        const mesh1 = ctx.createRadialGradient(
          W * 0.18,
          H * 0.12,
          0,
          W * 0.18,
          H * 0.12,
          900,
        );
        mesh1.addColorStop(0, hexToRgba(c1, 0.2));
        mesh1.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = mesh1;
        ctx.fillRect(0, 0, W, H);

        const mesh2 = ctx.createRadialGradient(
          W * 0.82,
          H * 0.22,
          0,
          W * 0.82,
          H * 0.22,
          900,
        );
        mesh2.addColorStop(0, hexToRgba(c2, 0.2));
        mesh2.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = mesh2;
        ctx.fillRect(0, 0, W, H);

        // Panel
        const theme = resolveExportTheme();
        const pad = 64;
        const panelX = pad;
        const panelY = pad;
        const panelW = W - pad * 2;
        const panelH = H - pad * 2;
        drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 28);
        ctx.fillStyle = theme.panelFill;
        ctx.fill();
        ctx.strokeStyle = theme.panelBorder;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Header layout (computed so the badge never overlaps Academic Year or the title)
        const headerX = panelX + 48;
        const headerTop = panelY + 48;

        const academicYearText = "Năm Học 2025-2026";
        ctx.fillStyle = theme.textMuted;
        ctx.font = "600 18px system-ui, -apple-system, Segoe UI, Arial";
        const academicYearBaseline = headerTop + 18;
        ctx.fillText(academicYearText, headerX, academicYearBaseline);

        // Updated (top-right)
        const updated = new Date().toLocaleDateString();
        const updatedText = `UPDATED: ${updated}`;
        ctx.fillStyle = theme.textMuted;
        ctx.font =
          "700 16px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
        ctx.textAlign = "right";
        ctx.fillText(updatedText, panelX + panelW - 48, academicYearBaseline);
        ctx.textAlign = "start";

        // Badge (Class) – below Academic Year with safe gap
        const badgeText = `Class ${selectedClass}`;
        ctx.font = "800 14px system-ui, -apple-system, Segoe UI, Arial";
        const badgeTextWidth = ctx.measureText(badgeText).width;
        const badgePaddingX = 14;
        const badgeW = Math.min(
          260,
          Math.max(120, badgeTextWidth + badgePaddingX * 2),
        );
        const badgeH = 28;
        const badgeX = headerX;
        const badgeY = academicYearBaseline + 10;
        const badgeBottom = badgeY + badgeH;

        drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 14);
        ctx.fillStyle =
          currentTheme.id === "light" ? "#4f46e5" : "rgba(34,211,238,0.95)";
        ctx.fill();
        ctx.fillStyle = currentTheme.id === "light" ? "#ffffff" : "#0b1220";
        ctx.fillText(badgeText, badgeX + badgePaddingX, badgeY + 19);

        // Title – compute baseline so the title's top clears the badge
        const titleText = "Thời Khóa Biểu";
        ctx.fillStyle = theme.textPrimary;
        ctx.font = "800 54px system-ui, -apple-system, Segoe UI, Arial";
        const titleMetrics = ctx.measureText(titleText);
        const titleAscent = titleMetrics.actualBoundingBoxAscent || 44;
        const titleDescent = titleMetrics.actualBoundingBoxDescent || 10;
        const titleTop = badgeBottom + 18;
        const titleBaseline = titleTop + titleAscent;
        ctx.fillText(titleText, headerX, titleBaseline);

        // Grid layout
        const gridTop = titleBaseline + titleDescent + 36;
        const gridLeft = panelX + 48;
        const gridRight = panelX + panelW - 48;
        const gridBottom = panelY + panelH - 72;
        const rowCount = 10;
        const colCount = 6;
        const gutter = 14;
        const timeColW = 72;
        const gridW = gridRight - gridLeft;
        const gridH = gridBottom - gridTop;
        const cellW = (gridW - timeColW - gutter * (colCount - 1)) / colCount;
        const cellH = (gridH - 46 - gutter * (rowCount - 1)) / rowCount;

        // Sticker (logo)
        if (showSticker) {
          try {
            const stickerImg = await loadImage("/logo.png");
            const stickerSize = 96;
            const stickerX = panelX + panelW - 48 - stickerSize;
            const stickerY = Math.max(panelY + 56, gridTop - stickerSize - 18);

            const scale = Math.min(
              stickerSize / stickerImg.width,
              stickerSize / stickerImg.height,
            );
            const drawW = stickerImg.width * scale;
            const drawH = stickerImg.height * scale;
            const drawX = stickerX + (stickerSize - drawW) / 2;
            const drawY = stickerY + (stickerSize - drawH) / 2;

            ctx.save();
            drawRoundedRect(
              ctx,
              stickerX,
              stickerY,
              stickerSize,
              stickerSize,
              20,
            );
            ctx.clip();
            ctx.globalAlpha = 0.92;
            ctx.drawImage(stickerImg, drawX, drawY, drawW, drawH);
            ctx.restore();
          } catch {
            // ignore missing/broken logo
          }
        }

        // Day headers
        const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
        for (let d = 0; d < colCount; d++) {
          const x = gridLeft + timeColW + d * (cellW + gutter);
          ctx.fillStyle = theme.textMuted;
          ctx.font = "900 16px system-ui, -apple-system, Segoe UI, Arial";
          ctx.fillText(days[d], x + 12, gridTop + 16);
          ctx.strokeStyle = theme.panelBorder;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, gridTop + 28);
          ctx.lineTo(x + cellW, gridTop + 28);
          ctx.stroke();
        }

        // Time labels
        for (let r = 0; r < rowCount; r++) {
          const y = gridTop + 46 + r * (cellH + gutter);
          ctx.fillStyle = theme.textMuted;
          const slot = TIME_SLOTS[r] ?? { start: `${r + 1}`, end: "" };
          ctx.textAlign = "right";
          ctx.font =
            "800 13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
          ctx.fillText(slot.start, gridLeft + timeColW - 10, y + 26);
          ctx.font =
            "700 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
          ctx.fillText(`- ${slot.end}`, gridLeft + timeColW - 10, y + 42);
          ctx.textAlign = "start";
        }

        const wrapLines = (
          ctx: CanvasRenderingContext2D,
          text: string,
          maxWidth: number,
          maxLines: number,
        ) => {
          const words = text.split(/\s+/).filter(Boolean);
          if (words.length === 0) return [""];

          const lines: string[] = [];
          let current = "";
          for (const word of words) {
            const next = current ? `${current} ${word}` : word;
            if (ctx.measureText(next).width <= maxWidth) {
              current = next;
              continue;
            }
            if (current) lines.push(current);
            current = word;
            if (lines.length >= maxLines - 1) break;
          }
          if (lines.length < maxLines && current) lines.push(current);

          if (lines.length > maxLines) lines.length = maxLines;
          if (lines.length === maxLines) {
            // Ensure last line fits with ellipsis if needed.
            let last = lines[maxLines - 1];
            const ellipsis = "…";
            while (
              last.length > 0 &&
              ctx.measureText(`${last}${ellipsis}`).width > maxWidth
            ) {
              last = last.slice(0, -1).trimEnd();
            }
            lines[maxLines - 1] = last ? `${last}${ellipsis}` : ellipsis;
          }
          return lines;
        };

        const drawCellText = (
          x: number,
          y: number,
          w: number,
          h: number,
          cell: ScheduleCell,
        ) => {
          const centerX = x + w / 2;
          const centerY = y + h / 2;
          ctx.textAlign = "center";
          const subject = cell.subject || "";

          const maxTextWidth = w - 24;
          let subjectFontSize = 16;
          const teacherFontSize = Math.round(11 * cellTextScale);
          const hasTeacher = !removeTeacher && Boolean(cell.teacher);
          const lineGap = hasTeacher ? 6 : 0;

          ctx.textBaseline = "alphabetic";

          // Fit subject into up to 2 lines (avoid aggressive truncation like "Ngoại ngữ 2 (Trun...)").
          let subjectLines: string[] = [];
          const baseFontSizes = [16, 15, 14].map((s) =>
            Math.round(s * cellTextScale),
          );
          for (const size of baseFontSizes) {
            subjectFontSize = size;
            ctx.font = `800 ${subjectFontSize}px system-ui, -apple-system, Segoe UI, Arial`;
            subjectLines = wrapLines(ctx, subject, maxTextWidth, 2);
            if (subjectLines.length <= 2) break;
          }

          ctx.font = `800 ${subjectFontSize}px system-ui, -apple-system, Segoe UI, Arial`;
          const mSub = ctx.measureText("Mg");
          const subAscent =
            mSub.actualBoundingBoxAscent || subjectFontSize * 0.8;
          const subDescent =
            mSub.actualBoundingBoxDescent || subjectFontSize * 0.2;
          const subLineHeight = subAscent + subDescent;
          const subBlockHeight =
            subLineHeight * subjectLines.length +
            (subjectLines.length > 1 ? 4 : 0);

          let teacherAscent = 0;
          let teacherDescent = 0;
          let teacherHeight = 0;
          if (hasTeacher) {
            ctx.font = `800 ${teacherFontSize}px system-ui, -apple-system, Segoe UI, Arial`;
            const mTeach = ctx.measureText("Mg");
            teacherAscent =
              mTeach.actualBoundingBoxAscent || teacherFontSize * 0.8;
            teacherDescent =
              mTeach.actualBoundingBoxDescent || teacherFontSize * 0.2;
            teacherHeight = teacherAscent + teacherDescent;
          }

          const totalHeight =
            subBlockHeight + (hasTeacher ? lineGap + teacherHeight : 0);
          const topY = centerY - totalHeight / 2;

          // Baselines so the whole block is vertically centered.
          const firstSubjectBaseline = topY + subAscent;
          const teacherBaseline =
            topY + subBlockHeight + lineGap + teacherAscent;

          ctx.fillStyle = theme.textPrimary;
          ctx.font = `800 ${subjectFontSize}px system-ui, -apple-system, Segoe UI, Arial`;
          for (let i = 0; i < subjectLines.length; i++) {
            const baseline =
              firstSubjectBaseline + i * subLineHeight + (i > 0 ? 4 : 0);
            ctx.fillText(subjectLines[i], centerX, baseline);
          }

          if (hasTeacher) {
            ctx.fillStyle = theme.textMuted;
            ctx.font = `800 ${teacherFontSize}px system-ui, -apple-system, Segoe UI, Arial`;
            const t =
              (cell.teacher || "").length > 20
                ? `${cell.teacher.slice(0, 19)}…`
                : cell.teacher || "";
            ctx.fillText(t, centerX, teacherBaseline);
          }

          ctx.textAlign = "start";
          ctx.textBaseline = "alphabetic";
        };

        // Cells (processedSchedule is 10 (periods) x 6 (days))
        for (let r = 0; r < rowCount; r++) {
          for (let d = 0; d < colCount; d++) {
            const x = gridLeft + timeColW + d * (cellW + gutter);
            const y = gridTop + 46 + r * (cellH + gutter);
            const cell = processedSchedule[r]?.[d] ?? null;

            const isNN = cell && isNN2(cell.originalText);
            const isActivity = cell?.type === "activity";

            drawRoundedRect(ctx, x, y, cellW, cellH, 18);
            if (!cell) {
              ctx.fillStyle = theme.cellEmptyFill;
              ctx.fill();
              ctx.strokeStyle = theme.cellEmptyBorder;
              ctx.lineWidth = 1;
              ctx.stroke();
              // dot
              ctx.fillStyle =
                currentTheme.id === "light"
                  ? "rgba(15,23,42,0.15)"
                  : "rgba(255,255,255,0.12)";
              ctx.beginPath();
              ctx.arc(x + cellW / 2, y + cellH / 2, 3, 0, Math.PI * 2);
              ctx.fill();
              continue;
            }

            if (isNN) {
              ctx.fillStyle = hexToRgba(nn2Color, 0.12);
              ctx.strokeStyle = hexToRgba(nn2Color, 0.4);
            } else if (isActivity) {
              ctx.fillStyle = "rgba(190, 24, 93, 0.10)";
              ctx.strokeStyle = "rgba(190, 24, 93, 0.28)";
            } else {
              ctx.fillStyle = theme.cellFill;
              ctx.strokeStyle = theme.cellBorder;
            }
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.stroke();

            drawCellText(x, y, cellW, cellH, cell);
          }
        }

        if (isProbablyBlank(canvas)) {
          // If something goes wrong, fail explicitly instead of exporting an all-black image.
          throw new Error("Export produced a blank image");
        }

        if (showWatermark) {
          // Signature
          ctx.fillStyle = theme.textMuted;
          ctx.font =
            "700 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
          ctx.fillText(
            "Generated by TKB Gen IV",
            panelX + 48,
            panelY + panelH - 28,
          );
          ctx.fillText(
            "Design System V1.1 Fixed",
            panelX + panelW - 260,
            panelY + panelH - 28,
          );
        }

        canvas.toBlob((blob) => {
          if (blob) {
            saveAs(blob, `Schedule_${selectedClass}_${Date.now()}.png`);
          }
        });
      } catch (err) {
        console.error(err);
        alert("Lỗi xuất ảnh!");
      } finally {
        setExporting(false);
      }
    }, 200);
  };

  const handleReset = () => {
    setFile(null);
    setWorkbook(null);
    setSheetName("");
    setAllClasses([]);
    setSelectedClass("");
    setProcessedSchedule(null);
    setUserPreviewZoom(false);
  };

  const applyZoomPercent = (value: string) => {
    const parsed = Number.parseFloat(value.replace("%", "").trim());
    if (!Number.isFinite(parsed)) return;
    const scale = clamp(parsed / 100, 0.3, 2.5);
    setUserPreviewZoom(true);
    setPreviewZoomScale(scale);
    setZoomPercentInput(`${Math.round(scale * 100)}`);
  };

  const previewScale = previewZoomScale;

  return (
    <div className="min-h-screen relative">
      <AnimatePresence>
        {(loading || exporting) && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-md" />
            <motion.div
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.98 }}
              className="relative w-[340px] max-w-[90vw] rounded-3xl border border-white/10 bg-slate-900/60 px-6 py-7 text-center shadow-2xl"
            >
              <div className="mx-auto mb-4 grid place-items-center">
                {/* Placeholder – replace with your GIF later (e.g. `/loading.gif`) */}
                {useLoadingGif ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/loading.gif"
                    alt=""
                    width={80}
                    height={80}
                    className="opacity-90"
                    onError={() => setUseLoadingGif(false)}
                  />
                ) : (
                  <Image
                    src="/loading-placeholder.svg"
                    alt=""
                    width={80}
                    height={80}
                    className="opacity-90"
                    priority
                  />
                )}
              </div>
              <div className="text-sm font-black tracking-wide text-white">
                {exporting ? "Exporting..." : "Loading..."}
              </div>
              <div className="mt-1 text-xs font-medium text-white/60">
                Please wait a moment
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="relative z-10 border-b border-white/10 backdrop-blur-xl bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="relative">
                {useImageLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/logo.png"
                    alt="TKB Generator"
                    width={40}
                    height={40}
                    className="rounded-xl object-cover"
                    onError={() => setUseImageLogo(false)}
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-500 blur-lg opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-cyan-500 to-purple-600 p-2.5 rounded-xl">
                      <div className="w-6 h-6 grid place-items-center">
                        <span className="text-[11px] font-black tracking-widest text-white">
                          TKB
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  TKB Generator
                </h1>
                <p className="hidden sm:block text-xs text-white/50 font-medium tracking-wide">
                  Made by KazukiDelta
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 self-start sm:self-auto"
            >
              <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-xs font-bold text-white/70">
                  v1.1 Fixed
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-12 gap-4 sm:gap-6">
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-12 lg:col-span-3 space-y-4"
          >
            <div className="glass-panel rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white/90">
                  Upload File
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
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full group relative overflow-hidden rounded-xl p-6 sm:p-8 border-2 border-dashed border-white/20 hover:border-cyan-400/50 transition-all duration-300 bg-white/5 hover:bg-white/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/10 group-hover:to-purple-500/10 transition-all duration-500"></div>
                  <div className="relative flex flex-col items-center gap-3">
                    <div className="p-3 rounded-xl bg-white/10 group-hover:bg-cyan-500/20 transition-colors">
                      <Upload className="w-6 h-6 text-white/70 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white/90">
                        Drop Excel file
                      </p>
                      <p className="text-xs text-white/50 mt-1">
                        or click to browse
                      </p>
                    </div>
                  </div>
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3"
                >
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-white/50 mt-0.5">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReset}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 text-sm font-bold transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </motion.button>
                </motion.div>
              )}
            </div>

            {allClasses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-white/90">
                    CHỌN LỚP
                  </h3>
                </div>
                <div
                  className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1"
                  data-lenis-prevent
                >
                  {allClasses.map((cls) => (
                    <motion.button
                      key={cls}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelectClass(cls)}
                      className={cn(
                        "px-3 py-2.5 rounded-lg text-xs font-black transition-all duration-300",
                        selectedClass === cls
                          ? "bg-gradient-to-br from-cyan-500 to-purple-500 text-white shadow-lg shadow-purple-500/30"
                          : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10",
                      )}
                    >
                      {cls}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {processedSchedule && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-panel rounded-2xl p-5"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-4 h-4 text-pink-400" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-white/90">
                      Theme
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {THEMES.map((theme) => (
                      <motion.button
                        key={theme.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCurrentTheme(theme)}
                        className={cn(
                          "w-full p-3 rounded-xl transition-all duration-300 flex items-center gap-3 group",
                          currentTheme.id === theme.id
                            ? "bg-white/15 border-2 border-white/30"
                            : "bg-white/5 border border-white/10 hover:bg-white/10",
                        )}
                      >
                        <div className="flex gap-1">
                          {theme.previewColors.map((color, i) => (
                            <div
                              key={i}
                              className="w-4 h-4 rounded-md"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-white/90 group-hover:text-white transition-colors">
                          {theme.name}
                        </span>
                        {currentTheme.id === theme.id && (
                          <Check className="w-4 h-4 text-white ml-auto" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass-panel rounded-2xl p-5"
                >
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="w-full flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-white/90">
                        Settings
                      </h3>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-white/50 transition-transform duration-300",
                        showSettings && "rotate-180",
                      )}
                    />
                  </button>
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-3 overflow-hidden"
                      >
                        <EnhancedToggle
                          label="Ẩn Tên Giáo Viên"
                          active={removeTeacher}
                          onClick={() => setRemoveTeacher(!removeTeacher)}
                          icon={
                            removeTeacher ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )
                          }
                        />
                        <EnhancedToggle
                          label="Highlight NN2"
                          active={highlightNN2}
                          onClick={() => setHighlightNN2(!highlightNN2)}
                          icon={<Sparkles className="w-3 h-3" />}
                        />
                        <EnhancedToggle
                          label="Ẩn Watermark"
                          active={!showWatermark}
                          onClick={() => setShowWatermark(!showWatermark)}
                          icon={<Layers className="w-3 h-3" />}
                        />
                        <EnhancedToggle
                          label="Sticker Logo"
                          active={showSticker}
                          onClick={() => setShowSticker(!showSticker)}
                          icon={<Layers className="w-3 h-3" />}
                        />
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-bold text-white/70">
                              Cỡ chữ môn/GV
                            </span>
                            <span className="text-[13px] font-mono text-white/60">
                              {Math.round(cellTextScale * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0.85}
                            max={1.4}
                            step={0.05}
                            value={cellTextScale}
                            onChange={(e) =>
                              setCellTextScale(
                                clamp(Number(e.target.value), 0.85, 1.4),
                              )
                            }
                            className="mt-2 w-full accent-cyan-400"
                            aria-label="Cell text scale"
                          />
                        </div>
                        {highlightNN2 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2 pt-2"
                          >
                            <label className="text-xs font-bold text-white/70">
                              NN2 Keywords
                            </label>
                            <input
                              type="text"
                              value={nn2Keywords}
                              onChange={(e) => setNn2Keywords(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                              placeholder="Pháp, Trung"
                            />
                            <label className="text-xs font-bold text-white/70 block mt-3">
                              Highlight Color
                            </label>
                            <input
                              type="color"
                              value={nn2Color}
                              onChange={(e) => setNn2Color(e.target.value)}
                              className="w-full h-10 rounded-lg cursor-pointer bg-white/10 border border-white/20"
                            />
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExportImage}
                  disabled={exporting}
                  className="w-full relative overflow-hidden group rounded-2xl p-5 bg-gradient-to-br from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 transition-all duration-300 shadow-2xl shadow-purple-500/30"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  <div className="relative flex items-center justify-center gap-3">
                    {exporting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin text-white" />
                        <span className="text-sm font-black text-white">
                          Exporting...
                        </span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 text-white" />
                        <span className="text-sm font-black text-white">
                          Xuất Ảnh
                        </span>
                      </>
                    )}
                  </div>
                </motion.button>
              </>
            )}
          </motion.aside>

          <main className="col-span-12 lg:col-span-9 min-w-0">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-[600px] glass-panel rounded-3xl"
                >
                  <div className="text-center space-y-4">
                    <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-sm font-bold text-white/70">
                      Processing file...
                    </p>
                  </div>
                </motion.div>
              )}

              {!loading && !processedSchedule && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center justify-center h-[600px] glass-panel rounded-3xl relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5"></div>
                  <div className="relative text-center space-y-6 max-w-md">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="w-32 h-32 mx-auto rounded-3xl flex items-center justify-center"
                    >
                      {useImageLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src="/logo.png"
                          alt=""
                          width={112}
                          height={112}
                          className="w-28 h-28 object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
                          onError={() => setUseImageLogo(false)}
                        />
                      ) : (
                        <LayoutDashboard
                          className="w-12 h-12 text-white"
                          strokeWidth={2}
                        />
                      )}
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-black text-white mb-2">
                        Sẵn Sàng Để Tạo Thời Khóa Biểu
                      </h3>
                      <p className="text-sm text-white/60 leading-relaxed">
                        Upload file Excel và chọn lớp để tạo thời khóa biểu.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {!loading && processedSchedule && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-sm font-bold text-white/70">
                        Live Preview
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="ml-1 flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setUserPreviewZoom(true);
                            setPreviewZoomScale((s) => {
                              const next = clamp(s - 0.1, 0.3, 2.5);
                              setZoomPercentInput(`${Math.round(next * 100)}`);
                              return next;
                            });
                          }}
                          className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 text-white/70"
                          aria-label="Zoom out"
                        >
                          −
                        </button>
                        <div className="flex items-center">
                          <input
                            value={zoomPercentInput}
                            onChange={(e) =>
                              setZoomPercentInput(e.target.value)
                            }
                            onBlur={() => applyZoomPercent(zoomPercentInput)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                applyZoomPercent(zoomPercentInput);
                                (e.currentTarget as HTMLInputElement).blur();
                              }
                            }}
                            inputMode="numeric"
                            className="w-12 bg-transparent text-center text-xs font-mono text-white/70 focus:outline-none"
                            aria-label="Zoom percent"
                          />
                          <span className="text-xs font-mono text-white/50 select-none">
                            %
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUserPreviewZoom(true);
                            setPreviewZoomScale((s) => {
                              const next = clamp(s + 0.1, 0.3, 2.5);
                              setZoomPercentInput(`${Math.round(next * 100)}`);
                              return next;
                            });
                          }}
                          className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 text-white/70"
                          aria-label="Zoom in"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUserPreviewZoom(false);
                            // Apply immediately (don't wait for effects) so the button feels responsive.
                            runAutoZoomStabilized();
                          }}
                          className={cn(
                            "ml-1 px-2 h-7 rounded-md text-[10px] font-black tracking-wide transition-colors",
                            userPreviewZoom
                              ? "bg-white/5 hover:bg-white/10 text-white/60"
                              : "bg-white/15 border border-white/15 text-white",
                          )}
                          aria-label="Auto zoom"
                          title="Auto"
                        >
                          AUTO
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] overflow-hidden">
                    <div
                      ref={previewOuterRef}
                      className="custom-scrollbar rounded-[24px] max-h-[70vh] overflow-auto pb-4"
                      data-lenis-prevent
                    >
                      <div
                        className="mx-auto"
                        style={{
                          width: PREVIEW_BASE_WIDTH * previewScale,
                          height: PREVIEW_BASE_HEIGHT * previewScale,
                        }}
                      >
                        <div
                          style={{
                            width: PREVIEW_BASE_WIDTH,
                            height: PREVIEW_BASE_HEIGHT,
                            transform: `scale(${previewScale})`,
                            transformOrigin: "top left",
                          }}
                        >
                          <div
                            ref={tableRef}
                            style={{
                              width: PREVIEW_BASE_WIDTH,
                              height: PREVIEW_BASE_HEIGHT,
                            }}
                            className={`p-8 rounded-[24px] shadow-2xl relative overflow-hidden ${currentTheme.panelBg} border ${currentTheme.panelBorder}`}
                          >
                            {showSticker && useImageLogo && (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src="/logo.png"
                                  alt=""
                                  width={96}
                                  height={96}
                                  className="absolute top-24 right-8 w-24 h-24 object-contain opacity-90 pointer-events-none select-none"
                                />
                              </>
                            )}
                            <div className="flex justify-between items-end mb-5">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${currentTheme.accent}`}
                                  >
                                    Class {selectedClass}
                                  </span>
                                  <span
                                    className={`text-sm font-medium opacity-60 flex items-center gap-1.5 ${currentTheme.text}`}
                                  >
                                    <Zap
                                      size={12}
                                      className="text-yellow-400"
                                    />{" "}
                                    Năm Học 2025-2026
                                  </span>
                                </div>
                                <h2
                                  className={`text-4xl font-black tracking-tight ${currentTheme.titleColor}`}
                                >
                                  Thời Khóa Biểu
                                </h2>
                              </div>
                              <div
                                className={`text-right opacity-60 ${currentTheme.text}`}
                              >
                                <Calendar
                                  size={28}
                                  strokeWidth={1}
                                  className="ml-auto mb-1"
                                />
                                <p className="text-xs font-mono">
                                  UPDATED: {new Date().toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-[110px_1fr] gap-4">
                              <div className="pt-11 space-y-2">
                                {TIME_SLOTS.map((slot, i) => (
                                  <div
                                    key={i}
                                    className={`h-[70px] flex flex-col items-end justify-center text-[13px] font-bold leading-tight pr-2 ${currentTheme.timeColor}`}
                                  >
                                    <span className="text-[11px] leading-tight">
                                      {slot.start}
                                    </span>
                                    <span className="text-[12px] opacity-80 leading-tight">
                                      {slot.end}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              <div className="flex-1">
                                <div className="grid grid-cols-6 gap-3 mb-3">
                                  {[
                                    "MON",
                                    "TUE",
                                    "WED",
                                    "THU",
                                    "FRI",
                                    "SAT",
                                  ].map((day) => (
                                    <div
                                      key={day}
                                      className={`text-center pb-2 border-b ${currentTheme.divider}`}
                                    >
                                      <span
                                        className={`text-base font-black tracking-widest ${currentTheme.dayColor}`}
                                      >
                                        {day}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                <div className="grid grid-cols-6 gap-3">
                                  {processedSchedule?.map((row, rowIdx) => (
                                    <React.Fragment key={rowIdx}>
                                      {row.map((cell, colIdx) => {
                                        const isNN =
                                          cell && isNN2(cell.originalText);
                                        const isActivity =
                                          cell?.type === "activity";
                                        const hexToRgb = (hex: string) => {
                                          const result =
                                            /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
                                              hex,
                                            );
                                          return result
                                            ? {
                                                r: parseInt(result[1], 16),
                                                g: parseInt(result[2], 16),
                                                b: parseInt(result[3], 16),
                                              }
                                            : { r: 74, g: 222, b: 128 };
                                        };
                                        const rgb = hexToRgb(nn2Color);

                                        return (
                                          <div
                                            key={`${rowIdx}-${colIdx}`}
                                            className={cn(
                                              "h-[70px] rounded-xl p-2 flex flex-col justify-center items-center text-center transition-all duration-300 relative group border",
                                              cell
                                                ? isNN
                                                  ? ""
                                                  : isActivity
                                                    ? "border-[#3d1a1f]"
                                                    : currentTheme.card_filled
                                                : currentTheme.card_empty,
                                            )}
                                            style={
                                              cell
                                                ? isNN
                                                  ? {
                                                      borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`,
                                                      backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`,
                                                    }
                                                  : isActivity
                                                    ? {
                                                        backgroundColor:
                                                          "rgba(190, 24, 93, 0.08)",
                                                        borderColor:
                                                          "rgba(190, 24, 93, 0.25)",
                                                      }
                                                    : {}
                                                : {}
                                            }
                                          >
                                            {cell ? (
                                              <>
                                                <span
                                                  className={`font-bold leading-tight ${currentTheme.titleColor}`}
                                                  style={{
                                                    fontSize: `${20 * cellTextScale}px`,
                                                    lineHeight: 1.15,
                                                  }}
                                                >
                                                  {cell.subject}
                                                </span>
                                                {!removeTeacher &&
                                                  cell.teacher && (
                                                    <span
                                                      className={`font-bold opacity-60 mt-1 px-2 py-0.5 rounded ${currentTheme.id === "light" ? "bg-black/5" : "bg-black/20"}`}
                                                      style={{
                                                        fontSize: `${14 * cellTextScale}px`,
                                                        lineHeight: 1.1,
                                                      }}
                                                    >
                                                      {cell.teacher}
                                                    </span>
                                                  )}
                                                <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                              </>
                                            ) : (
                                              <div
                                                className={`w-1.5 h-1.5 rounded-full ${currentTheme.emptyDot}`}
                                              ></div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {showWatermark && (
                              <div
                                className={`mt-5 pt-3 border-t ${currentTheme.divider} flex justify-between items-center text-xs tracking-widest uppercase ${currentTheme.sigColor}`}
                              >
                                <span>Generated by TKB Generator</span>
                                <span>Trường THPT Chuyên Lý Tự Trọng</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
        <footer className="mt-8 border-t border-white/10 pt-4 text-center text-xs text-white/40">
          © {new Date().getFullYear()} KazukiDelta. All Rights Reserved.
        </footer>
      </div>
    </div>
  );
}

function EnhancedToggle({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-all duration-300 group border border-white/10"
    >
      <div className="flex items-center gap-2">
        {icon && (
          <div className="text-white/60 group-hover:text-white/80 transition-colors">
            {icon}
          </div>
        )}
        <span className="text-xs font-bold text-white/70 group-hover:text-white/90 transition-colors">
          {label}
        </span>
      </div>
      <div
        className={cn(
          "w-10 h-6 rounded-full p-1 transition-all duration-300 flex items-center",
          active
            ? "bg-gradient-to-r from-cyan-500 to-purple-500"
            : "bg-white/10",
        )}
      >
        <motion.div
          layout
          className="w-4 h-4 rounded-full bg-white shadow-lg"
          style={{ x: active ? 16 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </motion.div>
  );
}
