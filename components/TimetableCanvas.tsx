"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ScheduleMatrix, ScheduleCell } from "@/types/schedule";
import { ThemeDefinition } from "@/types/theme";
import { StickerItem } from "@/types/sticker";
import {
  renderTimetableToCanvas,
  preloadStickers,
  BASE_CANVAS_WIDTH,
  BASE_CANVAS_HEIGHT,
  RenderOptions,
  getGridCellAtCoordinate,
} from "@/utils/canvasRenderer";
import {
  RotateCw,
  RotateCcw,
  Trash2,
  Maximize2,
  Minimize2,
  Download,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Edit3,
} from "lucide-react";
import { saveAs } from "file-saver";
import EditCellModal from "@/components/EditCellModal";

interface TimetableCanvasProps {
  schedule: ScheduleMatrix | null;
  selectedClass: string;
  theme: ThemeDefinition;
  stickers: StickerItem[];
  onUpdateStickers: (stickers: StickerItem[]) => void;
  onUpdateSchedule: (schedule: ScheduleMatrix) => void;
  options: RenderOptions;
  onOpenStickerManager: () => void;
  onOpenScheduleEditor: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function TimetableCanvas({
  schedule,
  selectedClass,
  theme,
  stickers,
  onUpdateStickers,
  onUpdateSchedule,
  options,
  onOpenStickerManager,
  onOpenScheduleEditor,
  isSidebarOpen,
  onToggleSidebar,
}: TimetableCanvasProps) {
  const outerWrapperRef = useRef<HTMLDivElement>(null);
  const canvasInnerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [previewScale, setPreviewScale] = useState<number>(0.5);
  const [isUserZoom, setIsUserZoom] = useState(false);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    centerX: number;
    centerY: number;
    initialDist: number;
  }>({ startX: 0, startY: 0, startW: 100, startH: 100, centerX: 0, centerY: 0, initialDist: 100 });
  const [rotateStart, setRotateStart] = useState<{
    centerX: number;
    centerY: number;
    startAngle: number;
    startRotation: number;
  }>({ centerX: 0, centerY: 0, startAngle: 0, startRotation: 0 });
  const [isExporting, setIsExporting] = useState(false);

  // Single cell editing state
  const [editingCellInfo, setEditingCellInfo] = useState<{
    periodIndex: number;
    dayIndex: number;
  } | null>(null);

  // Auto-scale calculation to fit the outer container width
  const computeAutoScale = useCallback(() => {
    if (!outerWrapperRef.current) return;
    const availableWidth = outerWrapperRef.current.clientWidth - 32; // 16px padding on sides
    if (availableWidth <= 0) return;
    const autoScale = Math.min(1, availableWidth / BASE_CANVAS_WIDTH);
    setPreviewScale(Math.max(0.2, Number(autoScale.toFixed(3))));
  }, []);

  // Recalculate auto scale on mount and on window resize
  useEffect(() => {
    if (!isUserZoom) {
      computeAutoScale();
    }
    const handleResize = () => {
      if (!isUserZoom) {
        computeAutoScale();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [computeAutoScale, isUserZoom]);

  // Preload and render canvas whenever dependencies change
  useEffect(() => {
    let active = true;

    const render = async () => {
      if (typeof document !== "undefined" && document.fonts) {
        try {
          const sample = "THỜI KHÓA BIỂU Sinh Hoạt Đầu Tuần Ngữ văn Vật lí Lịch sử 1234567890";
          await Promise.allSettled([
            document.fonts.load(`700 28px ${theme.fontHeading}`, sample),
            document.fonts.load(`700 18px ${theme.fontBody}`, sample),
            document.fonts.ready,
          ]);
        } catch {
          // ignore font loading timeout
        }
      }

      await preloadStickers(stickers);

      if (!active || !canvasRef.current) return;

      renderTimetableToCanvas(
        canvasRef.current,
        schedule,
        selectedClass,
        theme,
        stickers,
        {
          ...options,
          scaleFactor: 1, // 1 for preview canvas
        }
      );
    };

    render();

    return () => {
      active = false;
    };
  }, [schedule, selectedClass, theme, stickers, options]);

  // Convert screen coordinates to exact 1920x1080 canvas coordinates
  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } => {
    if (!canvasInnerRef.current) return { x: 0, y: 0 };
    const rect = canvasInnerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / previewScale;
    const y = (clientY - rect.top) / previewScale;
    return { x, y };
  };

  // Sticker drag initiate
  const handleStickerPointerDown = (e: React.PointerEvent, sticker: StickerItem) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedStickerId(sticker.id);
    setIsDragging(true);
    setIsResizing(false);

    const coords = getCanvasCoords(e.clientX, e.clientY);
    setDragOffset({
      x: coords.x - sticker.x,
      y: coords.y - sticker.y,
    });
  };

  // Sticker corner resize initiate (distance-from-center aspect ratio)
  const handleResizePointerDown = (e: React.PointerEvent, sticker: StickerItem) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedStickerId(sticker.id);
    setIsResizing(true);
    setIsDragging(false);
    setIsRotating(false);

    const coords = getCanvasCoords(e.clientX, e.clientY);
    const centerX = sticker.x + sticker.width / 2;
    const centerY = sticker.y + sticker.height / 2;
    const initialDist = Math.max(15, Math.hypot(coords.x - centerX, coords.y - centerY));
    setResizeStart({
      startX: coords.x,
      startY: coords.y,
      startW: sticker.width,
      startH: sticker.height,
      centerX,
      centerY,
      initialDist,
    });
  };

  // Sticker rotation handle initiate (Canva style bottom handle)
  const handleRotateHandlePointerDown = (e: React.PointerEvent, sticker: StickerItem) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedStickerId(sticker.id);
    setIsRotating(true);
    setIsDragging(false);
    setIsResizing(false);

    const coords = getCanvasCoords(e.clientX, e.clientY);
    const centerX = sticker.x + sticker.width / 2;
    const centerY = sticker.y + sticker.height / 2;
    const startAngle = Math.atan2(coords.y - centerY, coords.x - centerX) * (180 / Math.PI);
    setRotateStart({
      centerX,
      centerY,
      startAngle,
      startRotation: sticker.rotation,
    });
  };

  // Global pointer move & up for smooth dragging, resizing and rotating anywhere
  useEffect(() => {
    if ((!isDragging && !isResizing && !isRotating) || !selectedStickerId) return;

    const handlePointerMove = (e: PointerEvent) => {
      const coords = getCanvasCoords(e.clientX, e.clientY);

      // 1. Continuous Delta-based Rotation (Zero jump, never flips upside down)
      if (isRotating) {
        const currentAngle = Math.atan2(coords.y - rotateStart.centerY, coords.x - rotateStart.centerX) * (180 / Math.PI);
        let diff = currentAngle - rotateStart.startAngle;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;

        let newRotation = Math.round(rotateStart.startRotation + diff);
        while (newRotation > 180) newRotation -= 360;
        while (newRotation < -180) newRotation += 360;

        onUpdateStickers(
          stickers.map((s) => (s.id === selectedStickerId ? { ...s, rotation: newRotation } : s))
        );
        return;
      }

      // 2. Smooth Corner Scale (aspect ratio preserved at any rotation angle)
      if (isResizing) {
        const currentDist = Math.hypot(coords.x - resizeStart.centerX, coords.y - resizeStart.centerY);
        const ratio = currentDist / resizeStart.initialDist;
        const newW = Math.max(35, Math.min(650, Math.round(resizeStart.startW * ratio)));
        const aspect = resizeStart.startH / resizeStart.startW;
        const newH = Math.round(newW * aspect);

        onUpdateStickers(
          stickers.map((s) =>
            s.id === selectedStickerId ? { ...s, width: newW, height: newH } : s
          )
        );
        return;
      }

      // 3. Move / Drag
      if (isDragging) {
        const newX = Math.round(coords.x - dragOffset.x);
        const newY = Math.round(coords.y - dragOffset.y);

        // Clamp inside 1920x1080 canvas bounds
        const clampedX = Math.max(0, Math.min(BASE_CANVAS_WIDTH - 40, newX));
        const clampedY = Math.max(0, Math.min(BASE_CANVAS_HEIGHT - 40, newY));

        onUpdateStickers(
          stickers.map((s) =>
            s.id === selectedStickerId ? { ...s, x: clampedX, y: clampedY } : s
          )
        );
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, isResizing, isRotating, selectedStickerId, dragOffset, resizeStart, rotateStart, stickers, onUpdateStickers, previewScale]);

  // Canvas click: check if user clicked on a timetable cell to edit it
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isDragging || isResizing) return;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    const cellHit = getGridCellAtCoordinate(coords.x, coords.y);

    if (cellHit) {
      setSelectedStickerId(null);
      setEditingCellInfo({
        periodIndex: cellHit.periodIndex,
        dayIndex: cellHit.dayIndex,
      });
    } else {
      setSelectedStickerId(null);
    }
  };

  // Handle saving a single edited cell
  const handleSaveSingleCell = (
    periodIndex: number,
    dayIndex: number,
    updatedCell: ScheduleCell | null
  ) => {
    if (!schedule) return;
    const newSchedule = schedule.map((row, r) =>
      row.map((cell, d) => {
        if (r === periodIndex && d === dayIndex) {
          return updatedCell;
        }
        return cell;
      })
    );
    onUpdateSchedule(newSchedule);
  };

  // Zoom manipulation
  const handleZoomIn = () => {
    setIsUserZoom(true);
    setPreviewScale((prev) => Math.min(1.5, Number((prev + 0.1).toFixed(2))));
  };

  const handleZoomOut = () => {
    setIsUserZoom(true);
    setPreviewScale((prev) => Math.max(0.2, Number((prev - 0.1).toFixed(2))));
  };

  const handleResetAutoZoom = () => {
    setIsUserZoom(false);
    computeAutoScale();
  };

  // Sticker manipulation
  const handleRotateSticker = (id: string, delta: number) => {
    onUpdateStickers(
      stickers.map((s) =>
        s.id === id ? { ...s, rotation: ((s.rotation + delta + 180) % 360) - 180 } : s
      )
    );
  };

  const handleResetRotation = (id: string) => {
    onUpdateStickers(
      stickers.map((s) => (s.id === id ? { ...s, rotation: 0 } : s))
    );
  };

  const handleScaleSticker = (id: string, factor: number) => {
    onUpdateStickers(
      stickers.map((s) => {
        if (s.id !== id) return s;
        const newW = Math.max(30, Math.min(500, Math.round(s.width * factor)));
        const newH = Math.max(30, Math.min(500, Math.round(s.height * factor)));
        return { ...s, width: newW, height: newH };
      })
    );
  };

  const handleDeleteSticker = (id: string) => {
    onUpdateStickers(stickers.filter((s) => s.id !== id));
    if (selectedStickerId === id) setSelectedStickerId(null);
  };

  // High-Resolution Export Function (100% WYSIWYG)
  const handleExportHighRes = async () => {
    if (!schedule) return;
    setIsExporting(true);

    try {
      if (typeof document !== "undefined" && document.fonts) {
        try {
          const sample = "THỜI KHÓA BIỂU Sinh Hoạt Đầu Tuần Ngữ văn Vật lí Lịch sử 1234567890";
          await Promise.allSettled([
            document.fonts.load(`700 28px ${theme.fontHeading}`, sample),
            document.fonts.load(`700 18px ${theme.fontBody}`, sample),
            document.fonts.ready,
          ]);
        } catch {
          // ignore
        }
      }

      await preloadStickers(stickers);

      // Render off-screen canvas at 1.5x resolution (2880x1620)
      const exportCanvas = document.createElement("canvas");
      renderTimetableToCanvas(
        exportCanvas,
        schedule,
        selectedClass,
        theme,
        stickers,
        {
          ...options,
          scaleFactor: 1.5,
        }
      );

      exportCanvas.toBlob((blob) => {
        if (!blob) {
          alert("Không thể xuất ảnh!");
          setIsExporting(false);
          return;
        }
        const fileName = `TKB_${selectedClass || "Lop"}_${theme.id}_${Date.now()}.png`;
        saveAs(blob, fileName);
        setIsExporting(false);
      }, "image/png");
    } catch (err) {
      console.error("Export error:", err);
      alert("Lỗi khi xuất ảnh: " + String(err));
      setIsExporting(false);
    }
  };

  const selectedSticker = stickers.find((s) => s.id === selectedStickerId);

  // Scaled dimensions for the intermediate centering wrapper
  const scaledWidth = Math.round(BASE_CANVAS_WIDTH * previewScale);
  const scaledHeight = Math.round(BASE_CANVAS_HEIGHT * previewScale);

  const activeEditingCell =
    editingCellInfo && schedule
      ? schedule[editingCellInfo.periodIndex]?.[editingCellInfo.dayIndex]
      : null;

  return (
    <div className="space-y-4">
      {/* Top Action & Zoom Toolbar - High Contrast & Hand-Drawn Styled */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#181a20] border-2 border-[#2d2d2d] dark:border-[#383d4a] shadow-[3.5px_3.5px_0px_0px_#2d2d2d] dark:shadow-[3px_3px_0px_0px_#090a0f] text-[#2d2d2d] dark:text-[#f1f5f9]">
        {/* Left: Status & Zoom Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-bold font-patrick text-[#2d2d2d] dark:text-[#f1f5f9] px-2.5 py-1 rounded-xl bg-[#fdfbf7] dark:bg-[#13151d] border border-[#2d2d2d]/30 dark:border-white/20">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Canvas WYSIWYG</span>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5 bg-[#fdfbf7] dark:bg-[#13151d] p-1 rounded-xl border-2 border-[#2d2d2d] dark:border-[#383d4a] text-xs font-bold shadow-sm">
            <button
              type="button"
              onClick={handleZoomOut}
              title="Thu nhỏ"
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-200 dark:hover:bg-white/10 text-[#2d2d2d] dark:text-white transition-colors"
            >
              <ZoomOut className="w-4 h-4 stroke-[2.5]" />
            </button>
            <span className="w-12 text-center font-mono font-bold text-sm text-[#2d2d2d] dark:text-white">
              {Math.round(previewScale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              title="Phóng to"
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-200 dark:hover:bg-white/10 text-[#2d2d2d] dark:text-white transition-colors"
            >
              <ZoomIn className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={handleResetAutoZoom}
              title="Vừa màn hình (Auto)"
              className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wider uppercase transition-all ${
                !isUserZoom
                  ? "bg-[#2d5da1] dark:bg-cyan-500 text-white dark:text-black shadow-sm"
                  : "bg-stone-200 dark:bg-white/10 text-[#2d2d2d] dark:text-white hover:bg-stone-300"
              }`}
            >
              Auto
            </button>
          </div>
        </div>

        {/* Right: Actions - High Contrast, Bold, Ultra Readable Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              title={isSidebarOpen ? "Thu gọn thanh công cụ bên trái để TKB to ra tối đa" : "Mở lại thanh công cụ"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1e222e] text-[#2d2d2d] dark:text-white border-2 border-[#2d2d2d] dark:border-[#383d4a] font-bold text-sm shadow-[2px_2px_0px_0px_#2d2d2d] dark:shadow-[2px_2px_0px_0px_#090a0f] hover:bg-stone-100 transition-all active:translate-x-[1px] active:translate-y-[1px]"
            >
              {isSidebarOpen ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              <span>{isSidebarOpen ? "Phóng To TKB" : "Hiện Menu"}</span>
            </button>
          )}

          {/* Chỉnh Sửa TKB Button - Crisp Bold Blue Hand Button */}
          <button
            type="button"
            onClick={onOpenScheduleEditor}
            className="hand-btn px-4 py-2 bg-white dark:bg-[#181a20] text-[#0284c7] dark:text-[#38bdf8] border-[2.5px] border-[#2d2d2d] dark:border-[#38bdf8] font-patrick text-base font-bold shadow-[3px_3px_0px_0px_#2d2d2d] dark:shadow-[2.5px_2.5px_0px_0px_#090a0f] hover:bg-[#e0f2fe] dark:hover:bg-[#0c2d48] hover:-rotate-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <Edit3 className="w-5 h-5 stroke-[2.5]" />
            <span>Chỉnh Sửa TKB</span>
          </button>

          {/* Thêm Sticker Button - Crisp Bold Purple Hand Button */}
          <button
            type="button"
            onClick={onOpenStickerManager}
            className="hand-btn px-4 py-2 bg-white dark:bg-[#181a20] text-[#7c3aed] dark:text-[#c084fc] border-[2.5px] border-[#2d2d2d] dark:border-[#c084fc] font-patrick text-base font-bold shadow-[3px_3px_0px_0px_#2d2d2d] dark:shadow-[2.5px_2.5px_0px_0px_#090a0f] hover:bg-[#f3e8ff] dark:hover:bg-[#2e1065] hover:-rotate-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <Sparkles className="w-5 h-5 text-[#7c3aed] dark:text-[#c084fc] stroke-[2.5]" />
            <span>Thêm Sticker ({stickers.length})</span>
          </button>

          {/* Tải Ảnh PNG Button - Bold Red Marker Solid */}
          <button
            type="button"
            onClick={handleExportHighRes}
            disabled={isExporting || !schedule}
            className="hand-btn px-5 py-2 bg-[#ff4d4d] hover:bg-[#ef4444] text-white border-[2.5px] border-[#2d2d2d] font-patrick text-base font-black shadow-[3.5px_3.5px_0px_0px_#2d2d2d] dark:shadow-[2.5px_2.5px_0px_0px_#090a0f] hover:-rotate-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5 stroke-[3]" />
            <span>{isExporting ? "Đang xuất..." : "Tải Ảnh PNG"}</span>
          </button>
        </div>
      </div>

      {/* Main Preview Outer Container - Styled like a sketchbook desk mat */}
      <div
        ref={outerWrapperRef}
        data-lenis-prevent
        className="w-full overflow-auto custom-scrollbar rounded-3xl border-2 border-[#2d2d2d] dark:border-[#383d4a] shadow-[6px_6px_0px_0px_#2d2d2d] dark:shadow-[6px_6px_0px_0px_#090a0f] bg-[#f5efe6] dark:bg-[#0c0d12] p-4 select-none min-h-[420px]"
      >
        {/* w-fit min-w-full flex expands when zoomed, centers when smaller without clipping start */}
        <div className="w-fit min-w-full flex min-h-full">
          <div
            style={{
              width: scaledWidth,
              height: scaledHeight,
              flexShrink: 0,
            }}
            className="relative rounded-2xl shadow-xl overflow-hidden m-auto"
          >
            {/* Inner 1920x1080 element scaled down */}
            <div
              ref={canvasInnerRef}
              onClick={handleCanvasClick}
              style={{
                width: BASE_CANVAS_WIDTH,
                height: BASE_CANVAS_HEIGHT,
                transform: `scale(${previewScale})`,
                transformOrigin: "top left",
              }}
              className="relative cursor-pointer"
              title="Nhấp vào ô bất kỳ để chỉnh sửa môn học"
            >
              {/* Main 1920x1080 Canvas */}
              <canvas
                ref={canvasRef}
                width={BASE_CANVAS_WIDTH}
                height={BASE_CANVAS_HEIGHT}
                className="block pointer-events-none"
              />

              {/* Draggable Sticker Interactive Overlay */}
              {stickers.map((sticker) => {
                const isSelected = sticker.id === selectedStickerId;
                const isNearTop = sticker.y < 80;

                return (
                  <div
                    key={sticker.id}
                    onPointerDown={(e) => handleStickerPointerDown(e, sticker)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStickerId(sticker.id);
                    }}
                    className={`absolute group cursor-grab active:cursor-grabbing select-none ${
                      isSelected
                        ? "border-2 border-dashed border-[#ff4d4d] dark:border-cyan-400 z-30"
                        : "hover:border border-dashed border-stone-400/60 z-20"
                    }`}
                    style={{
                      left: sticker.x,
                      top: sticker.y,
                      width: sticker.width,
                      height: sticker.height,
                      transform: `rotate(${sticker.rotation}deg)`,
                      transformOrigin: "center center",
                      touchAction: "none",
                    }}
                  >
                    {/* Visual sticker img */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sticker.src}
                      alt={sticker.name}
                      draggable={false}
                      className="w-full h-full object-contain pointer-events-none select-none drop-shadow-md"
                    />

                    {/* Bottom Center Rotation Drag Handle (Canva style - opposite side from toolbar) */}
                    {isSelected && (
                      <div
                        onPointerDown={(e) => handleRotateHandlePointerDown(e, sticker)}
                        title="Giữ & xoay tròn để xoay sticker tự do"
                        className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing z-40 group"
                      >
                        <div className="w-[2px] h-2 bg-[#2d2d2d] dark:bg-white" />
                        <div className="w-6 h-6 rounded-full bg-[#fef08a] hover:bg-[#ff4d4d] hover:text-white text-[#2d2d2d] border-2 border-[#2d2d2d] shadow-[1.5px_1.5px_0px_0px_#2d2d2d] flex items-center justify-center transition-transform group-hover:scale-125">
                          <RotateCw className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      </div>
                    )}

                    {/* Corner Resize Drag Handle on Bottom-Right */}
                    {isSelected && (
                      <div
                        onPointerDown={(e) => handleResizePointerDown(e, sticker)}
                        title="Kéo góc để phóng to / thu nhỏ sticker"
                        className="absolute -bottom-3.5 -right-3.5 w-7 h-7 rounded-full bg-[#ff4d4d] text-white border-2 border-[#2d2d2d] shadow-md flex items-center justify-center cursor-nwse-resize z-40 hover:scale-125 transition-transform"
                      >
                        <Maximize2 className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Sticker mini-toolbar when selected - stays horizontal and readable */}
                    {isSelected && (
                      <div
                        onPointerDown={(e) => e.stopPropagation()}
                        className={`absolute left-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-[#181a20] border-2 border-[#2d2d2d] dark:border-[#383d4a] shadow-[4px_4px_0px_0px_#2d2d2d] dark:shadow-[3px_3px_0px_0px_#090a0f] z-50 text-[#2d2d2d] dark:text-white select-none whitespace-nowrap ${
                          isNearTop ? "top-full mt-12" : "-top-14"
                        }`}
                        style={{
                          transform: `translateX(-50%) rotate(${-sticker.rotation}deg)`,
                        }}
                      >
                        <button
                          type="button"
                          title="Xoay trái 15°"
                          onClick={() => handleRotateSticker(sticker.id, -15)}
                          className="px-2 py-1 hover:bg-[#fff9c4] dark:hover:bg-white/10 rounded-xl text-[#2d2d2d] dark:text-white transition-colors flex items-center gap-1 font-bold text-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>-15°</span>
                        </button>
                        <button
                          type="button"
                          title="Xoay phải 15°"
                          onClick={() => handleRotateSticker(sticker.id, 15)}
                          className="px-2 py-1 hover:bg-[#fff9c4] dark:hover:bg-white/10 rounded-xl text-[#2d2d2d] dark:text-white transition-colors flex items-center gap-1 font-bold text-xs"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>+15°</span>
                        </button>
                        <button
                          type="button"
                          title="Đặt lại thẳng đứng 0°"
                          onClick={() => handleResetRotation(sticker.id)}
                          className="px-2 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-[#fff9c4] dark:hover:bg-white/10 text-xs font-black transition-colors"
                        >
                          0°
                        </button>

                        <div className="w-[1.5px] h-4 bg-[#2d2d2d]/20 dark:bg-white/20 mx-0.5" />

                        <button
                          type="button"
                          title="Phóng to 25%"
                          onClick={() => handleScaleSticker(sticker.id, 1.25)}
                          className="p-1.5 hover:bg-[#fff9c4] dark:hover:bg-white/10 rounded-xl text-[#2d2d2d] dark:text-white transition-colors"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Thu nhỏ 20%"
                          onClick={() => handleScaleSticker(sticker.id, 0.8)}
                          className="p-1.5 hover:bg-[#fff9c4] dark:hover:bg-white/10 rounded-xl text-[#2d2d2d] dark:text-white transition-colors"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>

                        <div className="w-[1.5px] h-4 bg-[#2d2d2d]/20 dark:bg-white/20 mx-0.5" />

                        <button
                          type="button"
                          title="Xóa sticker"
                          onClick={() => handleDeleteSticker(sticker.id)}
                          className="p-1.5 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Helper text under canvas */}
      <div className="flex flex-wrap items-center justify-between text-sm text-[#2d2d2d]/80 dark:text-[#cbd5e1] px-2 gap-2 font-bold font-patrick">
        <p>
          💡 <strong>Mẹo tương tác:</strong> Nhấp vào ô để sửa môn học • Kéo sticker để di chuyển, kéo nút tròn góc để phóng to/thu nhỏ sticker, hoặc bấm xoay trên thanh công cụ.
        </p>
        {selectedSticker && (
          <span className="text-[#2d5da1] dark:text-[#38bdf8] font-bold">
            Đang chọn: {selectedSticker.name} ({selectedSticker.width}×{selectedSticker.height}px, {selectedSticker.rotation}°)
          </span>
        )}
      </div>

      {/* Single Cell Quick Edit Modal */}
      {editingCellInfo && (
        <EditCellModal
          isOpen={Boolean(editingCellInfo)}
          onClose={() => setEditingCellInfo(null)}
          periodIndex={editingCellInfo.periodIndex}
          dayIndex={editingCellInfo.dayIndex}
          cell={activeEditingCell || null}
          onSaveCell={handleSaveSingleCell}
        />
      )}
    </div>
  );
}
