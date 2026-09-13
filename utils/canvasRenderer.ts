import { ScheduleCell, ScheduleMatrix, TIME_SLOTS, DAYS_SHORT } from "@/types/schedule";
import { ThemeDefinition } from "@/types/theme";
import { StickerItem } from "@/types/sticker";
import { getCurrentAcademicYear } from "@/utils/academicYear";

export const BASE_CANVAS_WIDTH = 1920;
export const BASE_CANVAS_HEIGHT = 1080;

// Image cache for fast synchronous rendering during drag/drop
const imageCache = new Map<string, HTMLImageElement>();

export function preloadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    const cached = imageCache.get(src)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      // Don't reject fatally, return placeholder or cached broken
      console.warn(`[CanvasRenderer] Failed to load image: ${src}`);
      resolve(img);
    };
    img.src = src;
  });
}

export function preloadStickers(stickers: StickerItem[]): Promise<HTMLImageElement[]> {
  return Promise.all(stickers.map((s) => preloadImage(s.src)));
}

export interface RenderOptions {
  removeTeacher: boolean;
  highlightNN2: boolean;
  nn2Color: string;
  nn2Keywords: string;
  showWatermark: boolean;
  cellTextScale: number;
  academicYear?: string;
  updatedDate?: string;
  scaleFactor?: number;
}

// Utility: convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.trim().replace("#", "");
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

// Draw standard rounded rect
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

// Draw wobbly hand-drawn styled rect
function drawWobblyRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  roughness: number = 3
) {
  ctx.beginPath();
  // Top edge
  ctx.moveTo(x + 10, y + (Math.sin(x) * roughness));
  ctx.quadraticCurveTo(x + w / 2, y - roughness, x + w - 12, y + roughness * 0.5);
  // Right edge
  ctx.quadraticCurveTo(x + w + roughness, y + h / 2, x + w - 4, y + h - 14);
  // Bottom edge
  ctx.quadraticCurveTo(x + w / 2, y + h + roughness * 0.8, x + 14, y + h - roughness * 0.4);
  // Left edge
  ctx.quadraticCurveTo(x - roughness, y + h / 2, x + 10, y + (Math.sin(x) * roughness));
  ctx.closePath();
}

// Text word-wrapper for canvas
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = 2
): string[] {
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
    let last = lines[maxLines - 1];
    const ellipsis = "…";
    while (last.length > 0 && ctx.measureText(`${last}${ellipsis}`).width > maxWidth) {
      last = last.slice(0, -1).trimEnd();
    }
    lines[maxLines - 1] = last ? `${last}${ellipsis}` : ellipsis;
  }
  return lines;
}

export function renderTimetableToCanvas(
  canvas: HTMLCanvasElement,
  schedule: ScheduleMatrix | null,
  selectedClass: string,
  theme: ThemeDefinition,
  stickers: StickerItem[],
  options: RenderOptions
) {
  const W = BASE_CANVAS_WIDTH;
  const H = BASE_CANVAS_HEIGHT;
  const scale = options.scaleFactor || 1;

  canvas.width = W * scale;
  canvas.height = H * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.save();
  ctx.scale(scale, scale);

  // 1. BACKGROUND RENDERING
  renderBackground(ctx, W, H, theme);

  // 2. MAIN PANEL
  const pad = 54;
  const panelX = pad;
  const panelY = pad;
  const panelW = W - pad * 2;
  const panelH = H - pad * 2;

  // Draw hard shadow if handdrawn or specified
  if (theme.isHandDrawn || (theme.shadowOffset && theme.shadowOffset > 0)) {
    const offset = theme.shadowOffset || 6;
    ctx.save();
    ctx.fillStyle = theme.shadowColor || "#2d2d2d";
    if (theme.isHandDrawn) {
      drawWobblyRect(ctx, panelX + offset, panelY + offset, panelW, panelH, 3);
    } else {
      drawRoundedRect(ctx, panelX + offset, panelY + offset, panelW, panelH, theme.panelRadius);
    }
    ctx.fill();
    ctx.restore();
  }

  // Draw panel surface
  ctx.save();
  if (theme.isHandDrawn) {
    drawWobblyRect(ctx, panelX, panelY, panelW, panelH, 3);
  } else {
    drawRoundedRect(ctx, panelX, panelY, panelW, panelH, theme.panelRadius);
  }
  ctx.fillStyle = theme.panelFill;
  ctx.fill();
  ctx.strokeStyle = theme.panelBorder;
  ctx.lineWidth = theme.isHandDrawn ? 3 : 2;
  ctx.stroke();
  ctx.restore();

  // 3. HEADER RENDERING
  const headerX = panelX + 48;
  const headerTop = panelY + 44;

  // Academic year (top left) - dynamically updates with current year
  const academicYearText = options.academicYear || getCurrentAcademicYear();
  ctx.fillStyle = theme.subtitleColor;
  ctx.font = `700 28px ${theme.fontBody}`;
  const academicYearBaseline = headerTop + 28;
  ctx.fillText(academicYearText, headerX, academicYearBaseline);

  // Updated date (top right)
  const updatedText = `UPDATED: ${options.updatedDate || new Date().toLocaleDateString("vi-VN")}`;
  ctx.fillStyle = theme.textMuted;
  ctx.font = `700 22px ${theme.fontBody}`;
  ctx.textAlign = "right";
  ctx.fillText(updatedText, panelX + panelW - 48, academicYearBaseline);
  ctx.textAlign = "start";

  // Badge (Class name) - noticeably bigger
  const badgeText = `Class ${selectedClass || "12A1"}`;
  ctx.font = `700 22px ${theme.fontHeading}`;
  const badgeTextWidth = ctx.measureText(badgeText).width;
  const badgePaddingX = 24;
  const badgeW = Math.max(140, badgeTextWidth + badgePaddingX * 2);
  const badgeH = 42;
  const badgeX = headerX;
  const badgeY = academicYearBaseline + 14;
  const badgeBottom = badgeY + badgeH;

  ctx.save();
  if (theme.isHandDrawn) {
    drawWobblyRect(ctx, badgeX, badgeY, badgeW, badgeH, 1.5);
  } else {
    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 20);
  }
  ctx.fillStyle = theme.badgeBg;
  ctx.fill();
  if (theme.isHandDrawn) {
    ctx.strokeStyle = theme.panelBorder;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.fillStyle = theme.badgeText;
  ctx.fillText(badgeText, badgeX + badgePaddingX, badgeY + 28);
  ctx.restore();

  // Title: "THỜI KHÓA BIỂU" - bold & prominent
  const titleText = "THỜI KHÓA BIỂU";
  ctx.fillStyle = theme.titleColor;
  ctx.font = `700 68px ${theme.fontHeading}`;
  const titleMetrics = ctx.measureText(titleText);
  const titleAscent = titleMetrics.actualBoundingBoxAscent || 54;
  const titleDescent = titleMetrics.actualBoundingBoxDescent || 14;
  const titleTop = badgeBottom + 16;
  const titleBaseline = titleTop + titleAscent;
  ctx.fillText(titleText, headerX, titleBaseline);

  // 4. GRID CALCULATIONS
  const gridTop = titleBaseline + titleDescent + 28;
  const gridLeft = panelX + 48;
  const gridRight = panelX + panelW - 48;
  const gridBottom = panelY + panelH - 52;
  const rowCount = 10;
  const colCount = 6;
  const gutter = 12;
  const timeColW = 100;
  const gridW = gridRight - gridLeft;
  const gridH = gridBottom - gridTop;
  const cellW = (gridW - timeColW - gutter * (colCount - 1)) / colCount;
  const cellH = (gridH - 48 - gutter * (rowCount - 1)) / rowCount;

  // 5. DAY HEADERS (MON - SAT) - enlarged & bold
  for (let d = 0; d < colCount; d++) {
    const x = gridLeft + timeColW + d * (cellW + gutter);
    ctx.fillStyle = theme.dayColor;
    ctx.font = `700 28px ${theme.fontHeading}`;
    ctx.textAlign = "center";
    ctx.fillText(DAYS_SHORT[d], x + cellW / 2, gridTop + 26);
    ctx.textAlign = "start";

    // Header divider line
    ctx.strokeStyle = theme.dayBorderColor;
    ctx.lineWidth = theme.isHandDrawn ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x, gridTop + 36);
    ctx.lineTo(x + cellW, gridTop + 36);
    ctx.stroke();
  }

  // 6. TIME SLOTS LABELS (Rows 1 to 10) - enlarged & easily readable
  for (let r = 0; r < rowCount; r++) {
    const y = gridTop + 48 + r * (cellH + gutter);
    const slot = TIME_SLOTS[r] ?? { start: `${r + 1}`, end: "" };

    ctx.textAlign = "right";
    // Period number badge
    ctx.fillStyle = theme.titleColor;
    ctx.font = `700 22px ${theme.fontHeading}`;
    ctx.fillText(`T${r + 1}`, gridLeft + timeColW - 12, y + 25);

    // Time start & end
    ctx.fillStyle = theme.timeColor;
    ctx.font = `700 15px ${theme.fontBody}`;
    ctx.fillText(`${slot.start} - ${slot.end}`, gridLeft + timeColW - 12, y + 45);
    ctx.textAlign = "start";
  }

  // Helper to check NN2
  const isNN2 = (text: string): boolean => {
    if (!options.highlightNN2 || !text) return false;
    const kw = options.nn2Keywords.split(",").map((s) => s.trim().toLowerCase());
    const lower = text.toLowerCase();
    return kw.some((k) => lower.includes(k));
  };

  // 7. SCHEDULE CELLS RENDERING
  for (let r = 0; r < rowCount; r++) {
    const y = gridTop + 48 + r * (cellH + gutter);

    for (let d = 0; d < colCount; d++) {
      const x = gridLeft + timeColW + d * (cellW + gutter);
      const cell = schedule ? schedule[r]?.[d] : null;

      if (!cell || !cell.subject) {
        // EMPTY CELL
        ctx.save();
        if (theme.isHandDrawn) {
          drawWobblyRect(ctx, x, y, cellW, cellH, 1.5);
        } else {
          drawRoundedRect(ctx, x, y, cellW, cellH, 12);
        }
        ctx.fillStyle = theme.cellEmptyFill;
        ctx.fill();
        ctx.strokeStyle = theme.cellEmptyBorder;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Small empty dot in center
        ctx.fillStyle = theme.textMuted;
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(x + cellW / 2, y + cellH / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      // FILLED CELL
      const isNN2Cell = isNN2(cell.subject) || isNN2(cell.originalText) || cell.type === "nn2";
      const isActivity = cell.type === "activity";
      const customColor = cell.color; // user-set custom hex color

      ctx.save();
      // Draw subtle shadow for handdrawn cells
      if (theme.isHandDrawn) {
        ctx.fillStyle = theme.shadowColor === "#000000" ? "rgba(0, 0, 0, 0.35)" : "rgba(45, 45, 45, 0.12)";
        drawWobblyRect(ctx, x + 2, y + 2, cellW, cellH, 1.2);
        ctx.fill();
      }

      // Draw cell body
      if (theme.isHandDrawn) {
        drawWobblyRect(ctx, x, y, cellW, cellH, 1.5);
      } else {
        drawRoundedRect(ctx, x, y, cellW, cellH, 12);
      }

      if (customColor) {
        ctx.fillStyle = hexToRgba(customColor, 0.75);
      } else if (isNN2Cell) {
        ctx.fillStyle = hexToRgba(options.nn2Color || theme.highlightDefault, 0.32);
      } else if (isActivity) {
        ctx.fillStyle = hexToRgba(theme.badgeBg, 0.24);
      } else {
        ctx.fillStyle = theme.cellFill;
      }
      ctx.fill();

      ctx.strokeStyle = customColor
        ? customColor
        : isNN2Cell
        ? options.nn2Color || theme.highlightDefault
        : isActivity
        ? theme.badgeBg
        : theme.cellBorder;
      ctx.lineWidth = theme.isHandDrawn ? 2 : 1.5;
      ctx.stroke();

      // Render cell content (Subject & Teacher)
      // Tuned: Not too large to avoid cutoffs (around 18-19px without teacher, 16px with teacher)
      const maxTextWidth = cellW - 16;
      const textScale = options.cellTextScale || 1;
      const hasTeacher = !options.removeTeacher && Boolean(cell.teacher);

      const subjectFontSize = hasTeacher
        ? Math.round(16 * textScale)
        : Math.round(18 * textScale);
      const teacherFontSize = Math.round(13 * textScale);

      ctx.font = `700 ${subjectFontSize}px ${theme.fontHeading}`;
      const lines = wrapLines(ctx, cell.subject, maxTextWidth, 2);

      const totalSubjectHeight = lines.length * (subjectFontSize + 3);
      const totalContentHeight = totalSubjectHeight + (hasTeacher ? teacherFontSize + 4 : 0);
      const startY = y + (cellH - totalContentHeight) / 2 + subjectFontSize * 0.85;

      // For custom-color cells use dark text for legibility
      const textColorOverride = customColor ? "#1a1a1a" : null;

      // Draw Subject lines
      ctx.textAlign = "center";
      ctx.fillStyle = textColorOverride
        ?? (isNN2Cell ? (theme.category === "bw" ? "#000000" : theme.subjectColor) : theme.subjectColor);

      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x + cellW / 2, startY + i * (subjectFontSize + 3));
      }

      // Draw Teacher line
      if (hasTeacher) {
        ctx.fillStyle = textColorOverride ?? theme.teacherColor;
        ctx.font = `600 ${teacherFontSize}px ${theme.fontBody}`;
        const teacherY = startY + (lines.length - 1) * (subjectFontSize + 3) + teacherFontSize + 5;
        let teacherText = cell.teacher;
        while (teacherText.length > 0 && ctx.measureText(teacherText).width > maxTextWidth) {
          teacherText = teacherText.slice(0, -1).trimEnd();
        }
        if (teacherText !== cell.teacher) teacherText += "…";
        ctx.fillText(teacherText, x + cellW / 2, teacherY);
      }

      ctx.restore();
    }
  }

  // 8. STICKERS RENDERING (WYSIWYG 100%)
  for (const sticker of stickers) {
    const img = imageCache.get(sticker.src);
    if (!img || !img.complete || img.naturalWidth === 0) continue;

    ctx.save();
    const centerX = sticker.x + sticker.width / 2;
    const centerY = sticker.y + sticker.height / 2;

    ctx.translate(centerX, centerY);
    if (sticker.rotation) {
      ctx.rotate((sticker.rotation * Math.PI) / 180);
    }
    ctx.globalAlpha = sticker.opacity ?? 1;

    ctx.drawImage(
      img,
      -sticker.width / 2,
      -sticker.height / 2,
      sticker.width,
      sticker.height
    );
    ctx.restore();
  }

  // 9. WATERMARK (If enabled)
  if (options.showWatermark) {
    ctx.save();
    ctx.fillStyle = theme.textMuted;
    ctx.globalAlpha = 0.45;
    ctx.font = `600 13px ${theme.fontBody}`;
    ctx.textAlign = "right";
    ctx.fillText("TKB Generator • KazukiDelta", panelX + panelW - 48, panelY + panelH - 24);
    ctx.restore();
  }

  ctx.restore();
}

// Background render helper
function renderBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  theme: ThemeDefinition
) {
  ctx.save();
  ctx.fillStyle = theme.canvasBg;
  ctx.fillRect(0, 0, W, H);

  if (theme.bgType === "mesh" && theme.meshColors) {
    const [c1, c2] = theme.meshColors;
    const g1 = ctx.createRadialGradient(W * 0.18, H * 0.14, 0, W * 0.18, H * 0.14, 900);
    g1.addColorStop(0, hexToRgba(c1, 0.22));
    g1.addColorStop(1, "transparent");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(W * 0.82, H * 0.24, 0, W * 0.82, H * 0.24, 950);
    g2.addColorStop(0, hexToRgba(c2, 0.22));
    g2.addColorStop(1, "transparent");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);
  } else if (theme.bgType === "chalkboard") {
    // Subtle dusty chalkboard texture streaks
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    for (let y = 10; y < H; y += 35) {
      ctx.fillRect(0, y, W, 2);
    }
  } else if (theme.bgType === "notebook") {
    // Light blue graph grid
    ctx.strokeStyle = "rgba(147, 197, 253, 0.22)";
    ctx.lineWidth = 1;
    for (let x = 24; x < W; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 24; y < H; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  } else if (theme.bgType === "paper") {
    // Subtle dot grain
    ctx.fillStyle = "#e5e0d8";
    for (let x = 16; x < W; x += 24) {
      for (let y = 16; y < H; y += 24) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

export interface CellHitResult {
  periodIndex: number;
  dayIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getGridCellAtCoordinate(canvasX: number, canvasY: number): CellHitResult | null {
  const W = BASE_CANVAS_WIDTH;
  const H = BASE_CANVAS_HEIGHT;
  const pad = 54;
  const panelX = pad;
  const panelY = pad;
  const panelW = W - pad * 2;
  const panelH = H - pad * 2;

  const headerTop = panelY + 44;
  const academicYearBaseline = headerTop + 28;
  const badgeY = academicYearBaseline + 14;
  const badgeH = 42;
  const badgeBottom = badgeY + badgeH;
  const titleAscent = 54;
  const titleDescent = 14;
  const titleTop = badgeBottom + 16;
  const titleBaseline = titleTop + titleAscent;

  const gridTop = titleBaseline + titleDescent + 28;
  const gridLeft = panelX + 48;
  const gridRight = panelX + panelW - 48;
  const gridBottom = panelY + panelH - 52;
  const rowCount = 10;
  const colCount = 6;
  const gutter = 12;
  const timeColW = 100;
  const gridW = gridRight - gridLeft;
  const gridH = gridBottom - gridTop;
  const cellW = (gridW - timeColW - gutter * (colCount - 1)) / colCount;
  const cellH = (gridH - 48 - gutter * (rowCount - 1)) / rowCount;

  for (let r = 0; r < rowCount; r++) {
    const y = gridTop + 48 + r * (cellH + gutter);
    if (canvasY >= y && canvasY <= y + cellH) {
      for (let d = 0; d < colCount; d++) {
        const x = gridLeft + timeColW + d * (cellW + gutter);
        if (canvasX >= x && canvasX <= x + cellW) {
          return {
            periodIndex: r,
            dayIndex: d,
            x,
            y,
            width: cellW,
            height: cellH,
          };
        }
      }
    }
  }

  return null;
}

