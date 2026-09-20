import { NextRequest, NextResponse } from "next/server";
import { ScheduleMatrix, ScheduleCell, ScheduleCellType } from "@/types/schedule";
import { getCurrentAcademicYear } from "@/utils/academicYear";

const BASE_URL = "http://14.225.211.159/tkb-web";

export interface VersionInfo {
  id: string;
  label: string;
  date: string;
  draft?: boolean;
  tag?: string;
}

// Fetch and parse available versions from tkb-web app.js
async function fetchAvailableVersions(): Promise<VersionInfo[]> {
  try {
    const res = await fetch(`${BASE_URL}/app.js`, {
      cache: "no-store",
      headers: { "User-Agent": "TKB-Generator-App/1.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch app.js: ${res.status}`);
    }

    const text = await res.text();
    const match = text.match(/const VERSIONS = (\[[\s\S]*?\]);/);
    if (match) {
      const parsedVersions = Function(`"use strict"; return (${match[1]});`)();
      if (Array.isArray(parsedVersions) && parsedVersions.length > 0) {
        return parsedVersions;
      }
    }
  } catch (err) {
    console.warn("[sync-tkb-web] Could not fetch versions from app.js, using fallback:", err);
  }

  // Fallback defaults
  return [
    { id: "v3", label: "TKB 3", date: "21/09/2026", tag: "MỚI" },
    { id: "v2", label: "TKB 2", date: "14/09/2026", tag: "" },
    { id: "v1", label: "TKB 1", date: "07/09/2026", tag: "" },
  ];
}

// Convert data_classes.json items into ScheduleMatrix
function convertClassDataToMatrix(
  lessons: [string, string, number, string, string][]
): ScheduleMatrix {
  // 10 periods (rows) x 6 days (columns: Mon to Sat)
  const matrix: ScheduleMatrix = Array.from({ length: 10 }, () =>
    Array.from({ length: 6 }, () => null)
  );

  if (!Array.isArray(lessons)) return matrix;

  for (const item of lessons) {
    if (!Array.isArray(item) || item.length < 4) continue;
    const [dayStr, sessionStr, periodNum, subjectStr, teacherStr] = item;

    const day = parseInt(dayStr, 10);
    // Day 2 (Monday) -> 0, Day 7 (Saturday) -> 5
    const col = day - 2;
    if (col < 0 || col >= 6) continue;

    const isAfternoon = sessionStr && sessionStr.trim().toUpperCase() === "C";
    const offset = isAfternoon ? 5 : 0;
    const period = typeof periodNum === "number" ? periodNum : parseInt(periodNum, 10);
    const row = period - 1 + offset;
    if (row < 0 || row >= 10) continue;

    const subject = (subjectStr || "").trim();
    const teacher = (teacherStr || "").trim();
    const originalText = teacher ? `${subject} - ${teacher}` : subject;

    let type: ScheduleCellType = "main";
    const lowerSub = subject.toLowerCase();
    if (
      lowerSub.startsWith("nn2") ||
      lowerSub.includes("ngoại ngữ 2") ||
      lowerSub.startsWith("nn2-")
    ) {
      type = "nn2";
    } else if (
      lowerSub.startsWith("shđt") ||
      lowerSub.startsWith("shcn") ||
      lowerSub.includes("chào cờ") ||
      lowerSub.includes("sinh hoạt")
    ) {
      type = "activity";
    }

    const cell: ScheduleCell = {
      subject,
      teacher,
      originalText,
      type,
    };

    matrix[row][col] = cell;
  }

  return matrix;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedVersion = searchParams.get("version");
    const onlyVersions = searchParams.get("action") === "versions";

    // 1. Fetch available versions
    const versions = await fetchAvailableVersions();

    if (onlyVersions) {
      return NextResponse.json({
        success: true,
        versions,
      });
    }

    // Determine which version to load (default to first/latest)
    const targetVersion =
      versions.find((v) => v.id === requestedVersion) || versions[0] || {
        id: "v3",
        label: "TKB 3",
        date: "21/09/2026",
      };

    // 2. Fetch data_classes.json for target version
    const dataUrl = `${BASE_URL}/data/${targetVersion.id}/data_classes.json`;
    const res = await fetch(dataUrl, {
      cache: "no-store",
      headers: { "User-Agent": "TKB-Generator-App/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Không thể tải dữ liệu từ ${dataUrl} (Mã lỗi HTTP: ${res.status})`,
        },
        { status: 502 }
      );
    }

    const rawData: Record<string, [string, string, number, string, string][]> =
      await res.json();

    const classes = Object.keys(rawData).sort();
    if (classes.length === 0) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu trả về không có lớp học nào" },
        { status: 500 }
      );
    }

    // Convert each class into ScheduleMatrix
    const scheduleByClass: Record<string, ScheduleMatrix> = {};
    for (const cls of classes) {
      scheduleByClass[cls] = convertClassDataToMatrix(rawData[cls]);
    }

    const schedulePackage = {
      fileName: `tkb-web (${targetVersion.label || targetVersion.id})`,
      sheetName: `${targetVersion.label || targetVersion.id} - ${targetVersion.date || ""}`.trim(),
      classes,
      headerRowIndex: 0,
      uploadedAt: targetVersion.date || new Date().toLocaleDateString("vi-VN"),
      scheduleByClass,
      academicYear: getCurrentAcademicYear(),
      sourceUrl: dataUrl,
      versionInfo: targetVersion,
    };

    return NextResponse.json({
      success: true,
      versions,
      currentVersion: targetVersion,
      data: schedulePackage,
    });
  } catch (error: any) {
    console.error("[API GET /api/sync-tkb-web] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Không thể kết nối đến máy chủ thời khóa biểu (http://14.225.211.159/tkb-web/)",
      },
      { status: 500 }
    );
  }
}
