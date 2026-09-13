import * as XLSX from "xlsx";
import { ScheduleCell, ScheduleMatrix, SheetData } from "@/types/schedule";

export interface ParsedSheetResult {
  classes: string[];
  headerRowIndex: number;
}

export function analyzeWorkbookSheet(
  wb: XLSX.WorkBook,
  sheetName: string
): ParsedSheetResult | null {
  const ws = wb.Sheets[sheetName];
  if (!ws) return null;
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
    return null;
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

  return {
    classes: Array.from(classesSet).sort(),
    headerRowIndex,
  };
}

export function parsePeriodText(text: string): ScheduleCell {
  if (!text) {
    return { subject: "", teacher: "", originalText: "", type: "empty" };
  }
  const isActivity = /^(sinh hoạt|shđt|sinhhoạt|chào cờ|shl)/i.test(text);
  if (isActivity) {
    return {
      subject: text.includes("chào cờ") || text.includes("Chào cờ") ? "Chào Cờ" : "Sinh Hoạt Đầu Tuần",
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

  if (text.includes("-")) {
    const parts = text
      .split("-")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      const firstLooksLikeSubject = /[a-zà-ỹ]/i.test(parts[0] ?? "");
      const firstIsCode = /^[A-Z\u0110]{2,6}$/.test(parts[0] ?? "");

      if (firstLooksLikeSubject && !firstIsCode && parts.length >= 2) {
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

export function extractScheduleForClass(
  wb: XLSX.WorkBook,
  sheetName: string,
  className: string,
  headerRowIndex: number
): ScheduleMatrix | null {
  const ws = wb.Sheets[sheetName];
  if (!ws) return null;
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as SheetData;
  const headerRow = data[headerRowIndex];
  if (!headerRow) return null;

  let classColumnIndex = -1;
  for (let col = 3; col < headerRow.length; col++) {
    const cell = headerRow[col];
    if (cell && typeof cell === "string" && cell.trim() === className) {
      classColumnIndex = col;
      break;
    }
  }

  if (classColumnIndex === -1) return null;

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
      } else {
        schedule[periodIndex][currentDay] = null;
      }
    }
  }

  return schedule;
}
