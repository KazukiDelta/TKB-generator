"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  Shield,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileSpreadsheet,
  Trash2,
  ArrowLeft,
  School,
  Sparkles,
  LogOut,
  Globe,
  RefreshCw,
  Download,
  Database,
  ExternalLink,
} from "lucide-react";
import {
  analyzeWorkbookSheet,
  extractScheduleForClass,
} from "@/utils/excelParser";
import { ScheduleMatrix } from "@/types/schedule";
import { getCurrentAcademicYear } from "@/utils/academicYear";

const TARGET_PASS = "Nevada2807!";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [authChecking, setAuthChecking] = useState(true);

  // Upload & Schedule States
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [parsedClasses, setParsedClasses] = useState<string[]>([]);
  const [headerRowIndex, setHeaderRowIndex] = useState<number>(-1);

  // Current School Schedule on Server
  const [currentSchoolSchedule, setCurrentSchoolSchedule] = useState<{
    fileName: string;
    sheetName: string;
    classes: string[];
    uploadedAt: string;
    academicYear?: string;
  } | null>(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Online TKB Sync States
  const [onlinePackage, setOnlinePackage] = useState<any | null>(null);
  const [isSyncingFromWeb, setIsSyncingFromWeb] = useState(false);
  const [webVersions, setWebVersions] = useState<
    Array<{ id: string; label: string; date: string; tag?: string }>
  >([]);
  const [selectedWebVersion, setSelectedWebVersion] = useState<string>("v3");
  const [cloudStorageGuidance, setCloudStorageGuidance] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check existing session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAuth = sessionStorage.getItem("admin_auth_tkb");
      if (savedAuth === "true") {
        setIsAuthenticated(true);
      }
      setAuthChecking(false);
    }
  }, []);

  // Fetch current school schedule from API
  const fetchSchoolSchedule = async () => {
    try {
      const res = await fetch("/api/schedule");
      const json = await res.json();
      if (json.success && json.data) {
        setCurrentSchoolSchedule(json.data);
      } else {
        setCurrentSchoolSchedule(null);
      }
    } catch (err) {
      console.error("Failed to fetch school schedule:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSchoolSchedule();
      // Fetch available versions from tkb-web
      fetch("/api/sync-tkb-web?action=versions")
        .then((r) => r.json())
        .then((json) => {
          if (json.success && json.versions) {
            setWebVersions(json.versions);
            if (json.versions[0]) {
              setSelectedWebVersion(json.versions[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Special Password Check Logic (Entering "Nevada2807!" 3 consecutive times unlocks admin)
  // No warning/hint shown to maintain secrecy!
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordInput === TARGET_PASS) {
      if (attemptCount === 0) {
        setAttemptCount(1);
        setErrorMessage("Mật khẩu không chính xác!");
        setPasswordInput("");
      } else if (attemptCount === 1) {
        setAttemptCount(2);
        setErrorMessage("Mật khẩu không chính xác!");
        setPasswordInput("");
      } else if (attemptCount >= 2) {
        // Success on 3rd consecutive correct entry!
        setIsAuthenticated(true);
        setAttemptCount(0);
        setErrorMessage("");
        sessionStorage.setItem("admin_auth_tkb", "true");
      }
    } else {
      // Wrong password resets streak
      setAttemptCount(0);
      setErrorMessage("Mật khẩu không chính xác!");
      setPasswordInput("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_auth_tkb");
    setAttemptCount(0);
    setPasswordInput("");
  };

  // Excel Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setPublishSuccess(false);

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

        const res = analyzeWorkbookSheet(wb, likelySheet);
        if (res) {
          setParsedClasses(res.classes);
          setHeaderRowIndex(res.headerRowIndex);
        } else {
          alert("Không tìm thấy hàng chứa tên các lớp trong sheet này!");
        }
      } catch (err) {
        console.error("Parse error:", err);
        alert("Lỗi khi đọc file Excel!");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSheetChange = (sheet: string) => {
    setSelectedSheet(sheet);
    if (!workbook) return;
    const res = analyzeWorkbookSheet(workbook, sheet);
    if (res) {
      setParsedClasses(res.classes);
      setHeaderRowIndex(res.headerRowIndex);
    } else {
      setParsedClasses([]);
    }
  };

  // Sync directly from online tkb-web
  const handleSyncFromWeb = async (versionId?: string) => {
    const ver = versionId || selectedWebVersion || "v3";
    setIsSyncingFromWeb(true);
    setCloudStorageGuidance(null);
    setPublishSuccess(false);

    try {
      const res = await fetch(`/api/sync-tkb-web?version=${encodeURIComponent(ver)}`);
      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || "Không thể tải dữ liệu từ web trường");
      }

      setOnlinePackage(json.data);
      setParsedClasses(json.data.classes);
      // Reset local file so online package is used
      setUploadedFile(null);
      setWorkbook(null);
      alert(
        `Đã nạp thành công ${json.data.classes.length} lớp học từ web trường (${ver.toUpperCase()})!\nBạn có thể nhấn "Xuất Bản" hoặc "Tải file JSON".`
      );
    } catch (err: any) {
      alert("Lỗi khi tải từ web trường: " + (err?.message || "Không xác định"));
    } finally {
      setIsSyncingFromWeb(false);
    }
  };

  // Get current active payload from either Online Sync or Excel Upload
  const getPayloadToPublish = () => {
    if (onlinePackage) {
      return onlinePackage;
    }

    if (workbook && selectedSheet && parsedClasses.length > 0 && uploadedFile) {
      const scheduleByClass: Record<string, ScheduleMatrix> = {};
      for (const cls of parsedClasses) {
        const matrix = extractScheduleForClass(
          workbook,
          selectedSheet,
          cls,
          headerRowIndex
        );
        if (matrix) {
          scheduleByClass[cls] = matrix;
        }
      }

      return {
        fileName: uploadedFile.name,
        sheetName: selectedSheet,
        classes: parsedClasses,
        headerRowIndex,
        uploadedAt:
          new Date().toLocaleDateString("vi-VN") +
          " " +
          new Date().toLocaleTimeString("vi-VN"),
        scheduleByClass,
        academicYear: getCurrentAcademicYear(),
      };
    }

    return null;
  };

  // Publish to the entire school
  const handlePublishSchoolSchedule = async () => {
    const payload = getPayloadToPublish();
    if (!payload) {
      alert("Vui lòng tải file Excel hợp lệ hoặc đồng bộ từ web trường trước khi xuất bản!");
      return;
    }

    setIsPublishing(true);
    setCloudStorageGuidance(null);

    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setPublishSuccess(true);
        setCloudStorageGuidance(null);
        await fetchSchoolSchedule();
      } else {
        if (json.needsCloudStorage) {
          setCloudStorageGuidance(json.error);
        } else {
          alert("Không thể xuất bản: " + json.error);
        }
      }
    } catch (err) {
      console.error("Publish error:", err);
      alert("Lỗi khi gửi dữ liệu lên máy chủ!");
    } finally {
      setIsPublishing(false);
    }
  };

  // Download parsed schedule directly as school_schedule.json
  const handleDownloadJson = () => {
    const payload = getPayloadToPublish();
    if (!payload) {
      alert("Vui lòng tải file Excel hoặc đồng bộ từ web trường trước khi tải JSON!");
      return;
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "school_schedule.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Delete current school schedule
  const handleDeleteSchoolSchedule = async () => {
    if (!confirm("Bạn có chắc chắn muốn gỡ bỏ Thời Khóa Biểu chung của trường?"))
      return;

    try {
      const res = await fetch("/api/schedule", { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setCurrentSchoolSchedule(null);
        alert("Đã gỡ bỏ TKB của trường!");
      }
    } catch (err) {
      alert("Lỗi khi gỡ bỏ TKB!");
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center text-[#2d2d2d]">
        <div className="w-10 h-10 border-4 border-[#2d2d2d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. LOGIN SCREEN (SPECIAL 3-ATTEMPT SYSTEM)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] text-[#2d2d2d] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#fff9c4] border-[3px] border-[#2d2d2d] rounded-3xl p-8 shadow-[8px_8px_0px_0px_#2d2d2d] space-y-6 relative hand-wobbly-1">
          {/* Tape decoration */}
          <div className="hand-tape -top-2 left-1/2 -translate-x-1/2 !w-36 z-10" />

          <div className="text-center space-y-2 pt-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white border-2 border-[#2d2d2d] text-[#ff4d4d] shadow-[3px_3px_0px_0px_#2d2d2d] flex items-center justify-center mb-3">
              <Lock className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h2 className="text-3xl font-black font-kalam tracking-tight text-[#2d2d2d]">
              Cổng Quản Trị Hệ Thống
            </h2>
            <p className="text-base font-patrick text-[#2d2d2d]/80">
              Khu vực bảo mật dành riêng cho quản trị viên trường
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-base font-bold font-patrick text-[#2d2d2d] block mb-1.5">
                Mật khẩu quản trị:
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Nhập mật khẩu bí mật..."
                className="hand-input w-full px-4 py-3 bg-white font-patrick font-bold text-lg text-[#2d2d2d] focus:bg-[#fffde7]"
                autoFocus
              />
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-[#ffebee] border-2 border-[#ff4d4d] text-[#c62828] font-patrick font-bold text-base flex items-center gap-2 shadow-[2px_2px_0px_0px_#ff4d4d]">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="hand-btn hand-btn-yellow w-full py-3 rounded-2xl font-kalam font-bold text-xl text-[#2d2d2d] shadow-[4px_4px_0px_0px_#2d2d2d]"
            >
              Xác Thực Quản Trị
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="text-base font-patrick font-bold text-[#2d2d2d]/70 hover:text-[#ff4d4d] transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Quay lại trang chủ học sinh</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#2d2d2d] flex flex-col font-patrick">
      {/* Admin Header */}
      <header className="border-b-[3px] border-[#2d2d2d] bg-[#fff9c4] sticky top-0 z-30 shadow-[0_3px_0_0_#2d2d2d]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white border-2 border-[#2d2d2d] text-[#2d5da1] shadow-[2px_2px_0px_0px_#2d2d2d]">
              <Shield className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black font-kalam text-[#2d2d2d] leading-tight">
                  Quản Trị TKB Trường
                </h1>
                <span className="px-2.5 py-0.5 rounded-xl bg-[#c8e6c9] text-[#1b5e20] text-xs font-bold border-2 border-[#2d2d2d] font-kalam shadow-[1.5px_1.5px_0_0_#2d2d2d]">
                  ADMIN AUTH
                </span>
              </div>
              <p className="text-sm font-bold text-[#2d2d2d]/75">
                Tải lên và đồng bộ thời khóa biểu cho toàn trường
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hand-btn bg-white font-kalam font-bold text-base px-4 py-2 rounded-xl flex items-center gap-2 text-[#2d2d2d]"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Xem Trang Chủ</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="hand-btn bg-[#ffcdd2] hover:bg-[#ff4d4d] hover:text-white text-[#b71c1c] font-kalam font-bold text-base px-4 py-2 rounded-xl flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4 stroke-[2.5]" />
              <span>Đăng Xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Status Card: Currently Published Schedule */}
        <div className="hand-card-yellow p-6 border-[3px] border-[#2d2d2d] rounded-3xl shadow-[6px_6px_0px_0px_#2d2d2d] space-y-4 hand-wobbly-1 relative">
          <div className="hand-tape -top-2 left-8 !w-28 z-10" />

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <School className="w-6 h-6 text-[#2d5da1] stroke-[2.5]" />
              <h2 className="text-xl font-black font-kalam text-[#2d2d2d]">
                TKB Hiện Đang Được Đồng Bộ Cho Cả Trường
              </h2>
            </div>

            {currentSchoolSchedule && (
              <button
                type="button"
                onClick={handleDeleteSchoolSchedule}
                className="hand-btn bg-white hover:bg-[#ff4d4d] hover:text-white text-[#ff4d4d] font-kalam font-bold text-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5]" />
                <span>Gỡ TKB Trường</span>
              </button>
            )}
          </div>

          {currentSchoolSchedule ? (
            <div className="p-5 rounded-2xl bg-white border-2 border-[#2d2d2d] shadow-[3px_3px_0px_0px_#2d2d2d] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xl font-bold font-kalam text-[#2d2d2d]">
                    {currentSchoolSchedule.fileName}
                  </p>
                  <p className="text-base font-bold text-[#2d5da1]">
                    Sheet: {currentSchoolSchedule.sheetName}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-[#c8e6c9] text-[#1b5e20] text-sm font-bold font-kalam border-2 border-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d]">
                  ✓ ĐANG PHÁT HÀNH
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-[#fdfbf7] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d]">
                  <span className="text-sm font-bold text-[#2d2d2d]/60 block">Tổng số lớp:</span>
                  <span className="text-lg font-black font-kalam text-[#2d2d2d]">
                    {currentSchoolSchedule.classes.length} Lớp
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#fdfbf7] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d]">
                  <span className="text-sm font-bold text-[#2d2d2d]/60 block">Cập nhật lúc:</span>
                  <span className="text-base font-bold text-[#2d2d2d]">
                    {currentSchoolSchedule.uploadedAt}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#fdfbf7] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d]">
                  <span className="text-sm font-bold text-[#2d2d2d]/60 block">Trạng thái:</span>
                  <span className="text-base font-bold text-[#2e7d32]">
                    Tất cả học sinh tự động nhận
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-white border-2 border-[#2d2d2d] text-center space-y-2 shadow-[3px_3px_0px_0px_#2d2d2d]">
              <p className="text-lg font-bold text-[#2d2d2d]">
                Chưa có Thời Khóa Biểu nào được phát hành chung cho trường.
              </p>
              <p className="text-base text-[#2d2d2d]/70">
                Hãy tải lên file Excel bên dưới và bấm "Xuất Bản & Đồng Bộ" để toàn bộ giáo viên và học sinh đều có thể xem ngay lập tức.
              </p>
            </div>
          )}
        </div>

        {/* Option 1: Sync directly from tkb-web online card */}
        <div className="hand-card p-6 border-[3px] border-[#2d2d2d] rounded-3xl shadow-[6px_6px_0px_0px_#2d2d2d] space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#e0f2fe] border-2 border-[#2d2d2d] text-[#0284c7] shadow-[2px_2px_0px_0px_#2d2d2d]">
                <Globe className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-xl font-black font-kalam text-[#2d2d2d]">
                  Cách 1: Lấy Dữ Liệu Trực Tuyến Từ Web Trường
                </h2>
                <p className="text-xs font-patrick text-[#2d2d2d]/70">
                  Nguồn: <code>http://14.225.211.159/tkb-web/</code>
                </p>
              </div>
            </div>
            <a
              href="http://14.225.211.159/tkb-web/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold font-patrick text-[#2d5da1] hover:underline flex items-center gap-1"
            >
              <span>Xem trang gốc</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <label className="text-sm font-bold text-[#2d2d2d] block mb-1">
                Chọn phiên bản TKB trực tuyến:
              </label>
              <select
                value={selectedWebVersion}
                onChange={(e) => setSelectedWebVersion(e.target.value)}
                className="hand-input w-full px-3 py-2 bg-[#fdfbf7] font-patrick font-bold text-base text-[#2d2d2d]"
              >
                {(webVersions.length > 0
                  ? webVersions
                  : [
                      { id: "v3", label: "TKB 3", date: "21/09/2026", tag: "MỚI" },
                      { id: "v2", label: "TKB 2", date: "14/09/2026", tag: "" },
                      { id: "v1", label: "TKB 1", date: "07/09/2026", tag: "" },
                    ]
                ).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label} (Áp dụng từ: {v.date}) {v.tag ? `[${v.tag}]` : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleSyncFromWeb()}
              disabled={isSyncingFromWeb}
              className="hand-btn hand-btn-blue font-kalam font-bold text-lg px-6 py-2.5 rounded-xl self-end flex items-center justify-center gap-2 bg-[#0284c7] text-white disabled:opacity-50"
            >
              {isSyncingFromWeb ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Đang tải...</span>
                </>
              ) : (
                <>
                  <Globe className="w-5 h-5" />
                  <span>Lấy Dữ Liệu Web (37 Lớp)</span>
                </>
              )}
            </button>
          </div>

          {onlinePackage && (
            <div className="p-3.5 rounded-2xl bg-[#f0fdf4] border-2 border-[#16a34a] text-[#166534] text-sm font-patrick font-semibold flex items-center justify-between">
              <span>
                ✓ Đang chọn nguồn trực tuyến: <b>{onlinePackage.fileName}</b> ({onlinePackage.classes.length} lớp học sẵn sàng xuất bản hoặc tải về)
              </span>
            </div>
          )}
        </div>

        {/* Option 2: Upload New School Schedule Card */}
        <div className="hand-card p-6 border-[3px] border-[#2d2d2d] rounded-3xl shadow-[6px_6px_0px_0px_#2d2d2d] space-y-5 hand-wobbly-2 bg-white">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-[#9c27b0] stroke-[2.5]" />
            <h2 className="text-xl font-black font-kalam text-[#2d2d2d]">
              Cách 2: Tải Lên File Excel TKB Trường (.xlsx)
            </h2>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />

          {!uploadedFile ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full group p-10 rounded-3xl border-3 border-dashed border-[#2d2d2d] hover:border-[#ff4d4d] transition-all bg-[#fdfbf7] hover:bg-[#fffde7] flex flex-col items-center gap-3 text-center cursor-pointer shadow-[3px_3px_0px_0px_#2d2d2d]"
            >
              <div className="p-4 rounded-2xl bg-[#fff9c4] border-2 border-[#2d2d2d] text-[#2d5da1] shadow-[2px_2px_0px_0px_#2d2d2d] group-hover:scale-110 transition-transform">
                <Upload className="w-10 h-10 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-xl font-bold font-kalam text-[#2d2d2d]">
                  Chọn file Excel TKB trường (.xlsx, .xls)
                </p>
                <p className="text-base text-[#2d2d2d]/75 mt-1 font-patrick">
                  Hệ thống sẽ tự động quét danh sách 30-40 lớp và bóc tách toàn bộ các tiết học
                </p>
              </div>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#fdfbf7] border-2 border-[#2d2d2d] shadow-[3px_3px_0px_0px_#2d2d2d] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#c8e6c9] border-2 border-[#2d2d2d] text-[#1b5e20] shadow-[2px_2px_0px_0px_#2d2d2d]">
                    <FileSpreadsheet className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#2d2d2d]">{uploadedFile.name}</p>
                    <p className="text-sm font-bold text-[#2d2d2d]/60">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="hand-btn bg-white font-kalam font-bold text-sm px-4 py-2 rounded-xl"
                >
                  Đổi file khác
                </button>
              </div>

              {/* Sheet selector */}
              {sheetNames.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-base font-bold text-[#2d2d2d]">
                    Chọn Sheet dữ liệu:
                  </label>
                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="hand-input w-full px-4 py-2.5 bg-[#fdfbf7] font-patrick font-bold text-base text-[#2d2d2d] focus:outline-none"
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

        {/* Card 3: Action Center - Publish & Download JSON (Always available when data is ready) */}
        <div className="hand-card p-6 border-[3px] border-[#2d2d2d] rounded-3xl shadow-[6px_6px_0px_0px_#2d2d2d] space-y-5 hand-wobbly-1 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#fff9c4] border-2 border-[#2d2d2d] text-[#b45309] shadow-[2px_2px_0px_0px_#2d2d2d]">
                <Sparkles className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-xl font-black font-kalam text-[#2d2d2d]">
                  Khu Vực Xuất Bản & Tải Về
                </h2>
                <p className="text-xs font-patrick text-[#2d2d2d]/70">
                  Phát hành TKB trực tiếp cho học sinh hoặc tải file JSON để lưu trữ
                </p>
              </div>
            </div>

            {parsedClasses.length > 0 && (
              <span className="px-3 py-1 rounded-xl bg-[#c8e6c9] text-[#1b5e20] text-sm font-bold font-kalam border-2 border-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d]">
                ✓ SẴN SÀNG ({parsedClasses.length} LỚP)
              </span>
            )}
          </div>

          {parsedClasses.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#fdfbf7] border-2 border-dashed border-[#2d2d2d]/40 text-center space-y-2">
              <p className="text-lg font-bold font-kalam text-[#2d2d2d]">
                Chưa có dữ liệu nào được nạp
              </p>
              <p className="text-base font-patrick text-[#2d2d2d]/70 max-w-md mx-auto">
                Hãy nhấn nút <b>"Lấy Dữ Liệu Web"</b> ở Cách 1 (khuyên dùng) hoặc tải file Excel ở Cách 2 ở trên để hiển thị nút Xuất Bản và Tải File.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Data Source Banner */}
              <div className="p-4 rounded-2xl bg-[#fdfbf7] border-2 border-[#2d2d2d] shadow-[2px_2px_0px_0px_#2d2d2d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-[#2d2d2d]/60 uppercase tracking-wider block">
                    Nguồn dữ liệu đang chọn:
                  </span>
                  <span className="text-base font-black font-kalam text-[#2d5da1]">
                    {onlinePackage ? `🌐 Web Trường: ${onlinePackage.fileName}` : `📄 File Excel: ${uploadedFile?.name}`}
                  </span>
                </div>
                <div className="text-sm font-bold text-[#2d2d2d]/70">
                  Tổng cộng: <b className="text-[#2e7d32]">{parsedClasses.length} Lớp</b>
                </div>
              </div>

              {/* Scanned Classes Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-[#2d2d2d]">
                    Danh sách {parsedClasses.length} lớp học:
                  </span>
                  <span className="text-base font-bold text-[#2e7d32]">
                    ✓ Tất cả hợp lệ
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 rounded-2xl bg-[#fdfbf7] border-2 border-[#2d2d2d] shadow-[3px_3px_0px_0px_#2d2d2d] custom-scrollbar">
                  {parsedClasses.map((cls) => (
                    <span
                      key={cls}
                      className="px-3 py-1 rounded-xl bg-[#fff9c4] border-2 border-[#2d2d2d] text-[#2d2d2d] text-base font-bold font-patrick shadow-[1.5px_1.5px_0_0_#2d2d2d]"
                    >
                      {cls}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Publish or Download JSON */}
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={handlePublishSchoolSchedule}
                  disabled={isPublishing}
                  className="hand-btn hand-btn-red w-full py-4 rounded-2xl font-kalam font-bold text-2xl text-white shadow-[4px_4px_0px_0px_#2d2d2d] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-6 h-6 stroke-[2.5]" />
                  <span>
                    {isPublishing
                      ? "Đang xuất bản..."
                      : "Xuất Bản & Đồng Bộ Cho Toàn Trường"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="hand-btn w-full py-3.5 rounded-2xl font-kalam font-bold text-xl bg-[#fff9c4] hover:bg-[#fff59d] text-[#2d2d2d] border-2 border-[#2d2d2d] shadow-[3px_3px_0px_0px_#2d2d2d] flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5 text-[#2d5da1]" />
                  <span>Tải File school_schedule.json (Lưu thủ công vào project)</span>
                </button>
              </div>

              {/* Cloud Storage guidance if Vercel serverless read-only occurs */}
              {cloudStorageGuidance && (
                <div className="p-5 rounded-2xl bg-[#fff8e1] border-[2.5px] border-[#f59e0b] text-[#78350f] space-y-2.5 shadow-[3px_3px_0px_0px_#f59e0b] animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold font-kalam text-lg text-[#b45309]">
                    <Database className="w-5 h-5" />
                    <span>Lưu ý triển khai trên Vercel:</span>
                  </div>
                  <p className="text-sm font-patrick font-semibold leading-relaxed">
                    {cloudStorageGuidance}
                  </p>
                  <div className="pt-2 border-t border-[#f59e0b]/30 text-xs font-patrick font-bold space-y-1 text-[#92400e]">
                    <p>👉 <b>Cách 1 (Nhanh nhất - Không cần Database):</b> Bấm nút màu vàng <b>"Tải File school_schedule.json"</b> ở trên, chép đè vào thư mục <code>data/school_schedule.json</code> trong project rồi <code>git push</code> lên GitHub.</p>
                    <p>👉 <b>Cách 2 (Tự động 100% qua web):</b> Vào Vercel Dashboard ➔ Tab <b>Storage</b> ➔ Thêm <b>Upstash Redis</b> (miễn phí). Sau đó nút "Xuất Bản" sẽ lưu trực tiếp lên đám mây!</p>
                  </div>
                </div>
              )}

              {publishSuccess && (
                <div className="p-4 rounded-2xl bg-[#c8e6c9] border-2 border-[#2e7d32] text-[#1b5e20] text-base font-bold flex items-center gap-3 animate-in fade-in shadow-[3px_3px_0px_0px_#2e7d32]">
                  <CheckCircle2 className="w-7 h-7 flex-shrink-0 stroke-[2.5]" />
                  <div>
                    <p className="font-kalam font-bold text-xl">Đã xuất bản thành công!</p>
                    <p className="font-patrick text-sm text-[#1b5e20]/90 mt-0.5">
                      Bây giờ, bất kỳ học sinh hay giáo viên nào truy cập vào trang chủ sẽ thấy ngay danh sách {parsedClasses.length} lớp và TKB tương ứng.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
