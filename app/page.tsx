"use client";

import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import {
  Save,
  Upload,
  FileSpreadsheet,
  Image as ImageIcon,
  Settings,
  RefreshCw,
  Palette,
} from "lucide-react";
import { saveAs } from "file-saver";

// --- Types ---
type ScheduleCell = {
  subject: string;
  teacher: string;
  originalText: string;
};

// Mảng 2 chiều: [Tiết (0-9)][Thứ (2-7, CN)]
// Tiết 0-4: Sáng (Tiết 1-5), Tiết 5-9: Chiều (Tiết 1-5)
type ScheduleMatrix = (ScheduleCell | null)[][];

const THEMES = [
  {
    name: "Hiện đại (Xanh dương)",
    bg: "bg-blue-50",
    header: "bg-blue-600 text-white",
    border: "border-blue-200",
    cell: "hover:bg-blue-100",
    text: "text-blue-900",
  },
  {
    name: "Năng động (Cam)",
    bg: "bg-orange-50",
    header: "bg-orange-500 text-white",
    border: "border-orange-200",
    cell: "hover:bg-orange-100",
    text: "text-orange-900",
  },
  {
    name: "Thiên nhiên (Xanh lá)",
    bg: "bg-green-50",
    header: "bg-emerald-600 text-white",
    border: "border-emerald-200",
    cell: "hover:bg-green-100",
    text: "text-emerald-900",
  },
  {
    name: "Tối giản (Xám)",
    bg: "bg-gray-50",
    header: "bg-gray-700 text-white",
    border: "border-gray-300",
    cell: "hover:bg-gray-200",
    text: "text-gray-900",
  },
  {
    name: "Nữ tính (Hồng)",
    bg: "bg-pink-50",
    header: "bg-pink-500 text-white",
    border: "border-pink-200",
    cell: "hover:bg-pink-100",
    text: "text-pink-900",
  },
];

export default function TkbGenerator() {
  // State quản lý dữ liệu
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetName, setSheetName] = useState<string>("");
  const [allClasses, setAllClasses] = useState<string[]>([]);

  // State quản lý lựa chọn
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [processedSchedule, setProcessedSchedule] =
    useState<ScheduleMatrix | null>(null);

  // State quản lý Option
  const [removeTeacher, setRemoveTeacher] = useState<boolean>(true);
  const [highlightNN2, setHighlightNN2] = useState<boolean>(true);
  const [nn2Color, setNn2Color] = useState<string>("#fef08a"); // Vàng nhạt mặc định
  const [nn2Keywords, setNn2Keywords] = useState<string>(
    "CNNN, Nhật, Hàn, Pháp, Trung",
  ); // Từ khóa để tìm NN2
  const [currentTheme, setCurrentTheme] = useState(THEMES[0]);

  const tableRef = useRef<HTMLDivElement>(null);

  // --- Xử lý đọc file ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      setWorkbook(wb);

      // Tự động tìm sheet có khả năng là TKB nhất (chứa chữ TKB hoặc Sheet lớn nhất)
      const likelySheet =
        wb.SheetNames.find(
          (n) =>
            n.toUpperCase().includes("TKB") || n.toUpperCase().includes("DATA"),
        ) || wb.SheetNames[0];
      setSheetName(likelySheet);
      analyzeSheet(wb, likelySheet);
    };
    reader.readAsBinaryString(uploadedFile);
  };

  // --- Phân tích file để lấy danh sách lớp ---
  const analyzeSheet = (wb: XLSX.WorkBook, sheet: string) => {
    const ws = wb.Sheets[sheet];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

    // Tìm dòng header chứa tên các lớp (thường là dòng có nhiều cột dữ liệu string ngắn như 10A1, 11A1...)
    // Logic: Tìm dòng có chứa chữ "Thứ", "Tiết" và các chuỗi giống tên lớp
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(data.length, 20); i++) {
      const row = data[i];
      if (
        row &&
        row.some(
          (cell) =>
            typeof cell === "string" &&
            (cell.includes("10") || cell.includes("11") || cell.includes("12")),
        )
      ) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex !== -1) {
      const headerRow = data[headerRowIndex];
      // Lọc ra các cột là tên lớp (bỏ qua Thứ, Buổi, Tiết...)
      const classes: string[] = [];
      headerRow.forEach((cell: any) => {
        if (typeof cell === "string" && /^[0-9]{2}[A-Z]/.test(cell)) {
          // Regex đơn giản check tên lớp vd: 10A1
          classes.push(cell);
        }
      });
      setAllClasses(classes);
      if (classes.length > 0) setSelectedClass(classes[0]);
    } else {
      alert(
        "Không tìm thấy dòng tiêu đề chứa tên lớp. Vui lòng kiểm tra file Excel.",
      );
    }
  };

  // --- Xử lý tạo TKB cho lớp đã chọn ---
  useEffect(() => {
    if (!workbook || !selectedClass || !sheetName) return;

    const ws = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

    // Tìm lại index cột của lớp được chọn
    let classColIndex = -1;
    let headerRowIndex = -1;
    let dayColIndex = -1;
    let periodColIndex = -1; // Cột tiết

    // Scan lại để tìm vị trí chính xác
    for (let i = 0; i < Math.min(data.length, 20); i++) {
      const row = data[i];
      if (!row) continue;

      const foundClassIndex = row.findIndex(
        (cell: any) => cell === selectedClass,
      );
      if (foundClassIndex !== -1) {
        headerRowIndex = i;
        classColIndex = foundClassIndex;
        // Tìm cột Thứ và Tiết trên cùng dòng hoặc các dòng lân cận
        dayColIndex = row.findIndex(
          (c: any) =>
            c && typeof c === "string" && c.toUpperCase().includes("THỨ"),
        );
        // Nếu không thấy chữ Thứ ở dòng header, tìm ở các cột đầu tiên của các dòng dữ liệu
        if (dayColIndex === -1) dayColIndex = 0; // Mặc định cột A

        periodColIndex = row.findIndex(
          (c: any) =>
            c && typeof c === "string" && c.toUpperCase().includes("TIẾT"),
        );
        if (periodColIndex === -1) periodColIndex = 2; // Mặc định cột C (thường là A: Thứ, B: Buổi, C: Tiết)
        break;
      }
    }

    if (classColIndex === -1) return;

    // Khởi tạo ma trận rỗng: 10 tiết (5 sáng + 5 chiều) x 6 ngày (2 -> 7)
    // Map: [PeriodIndex][DayIndex] -> Cell Data
    // PeriodIndex: 0-4 (Sáng), 5-9 (Chiều)
    // DayIndex: 0 (Thứ 2) -> 5 (Thứ 7)
    const matrix: ScheduleMatrix = Array(10)
      .fill(null)
      .map(() => Array(6).fill(null));

    // Duyệt dữ liệu từ sau dòng header
    let currentDayStr = "";

    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      // Lấy dữ liệu Thứ (Xử lý việc Merge Cell bằng cách lưu state ngày hiện tại)
      const dayRaw = row[dayColIndex];
      if (dayRaw) currentDayStr = dayRaw.toString();

      // Parse ngày ra index (2->0, 3->1, ...)
      let dayIndex = -1;
      if (currentDayStr.includes("2")) dayIndex = 0;
      else if (currentDayStr.includes("3")) dayIndex = 1;
      else if (currentDayStr.includes("4")) dayIndex = 2;
      else if (currentDayStr.includes("5")) dayIndex = 3;
      else if (currentDayStr.includes("6")) dayIndex = 4;
      else if (currentDayStr.includes("7")) dayIndex = 5;

      // Lấy Tiết
      const periodRaw = row[periodColIndex];
      let periodNum = -1;
      if (typeof periodRaw === "number") periodNum = periodRaw;
      else if (typeof periodRaw === "string") periodNum = parseInt(periodRaw);

      // Xác định buổi (Sáng/Chiều) để map vào index 0-9
      // Logic: Nếu file có cột Buổi thì dùng, nếu không thì đoán dựa trên số tiết reset lại
      // Trong file mẫu của bạn: Tiết chạy 1->5, sau đó lại 1->5 cho buổi chiều? Hay 1->10?
      // CSV Snippet: Có cột "Buổi". "S" = Sáng, "C" = Chiều.
      const sessionColIndex = dayColIndex + 1; // Thường cột Buổi nằm sau cột Thứ
      const sessionRaw = row[sessionColIndex]; // S hoặc C

      let finalPeriodIndex = -1;
      if (periodNum >= 1 && periodNum <= 5) {
        if (sessionRaw === "C" || sessionRaw === "Chiều") {
          finalPeriodIndex = periodNum + 4; // Tiết 1 chiều = index 5
        } else {
          finalPeriodIndex = periodNum - 1; // Tiết 1 sáng = index 0
        }
      } else if (periodNum > 5) {
        finalPeriodIndex = periodNum - 1; // Trường hợp file đánh số liên tục 1-10
      }

      // Lấy nội dung môn học
      const content = row[classColIndex];

      if (dayIndex !== -1 && finalPeriodIndex !== -1 && content) {
        // Tách môn và giáo viên
        // Format thường gặp: "Toán-Hạnh.N"
        const parts = content.toString().split("-");
        let subject = content.toString();
        let teacher = "";

        if (parts.length > 1) {
          // Lấy phần sau dấu gạch ngang cuối cùng làm tên GV
          // Regex: Lấy tất cả trừ phần sau dấu - cuối cùng
          const lastHyphenIndex = content.lastIndexOf("-");
          subject = content.substring(0, lastHyphenIndex);
          teacher = content.substring(lastHyphenIndex + 1);
        }

        matrix[finalPeriodIndex][dayIndex] = {
          subject: subject.trim(),
          teacher: teacher.trim(),
          originalText: content.toString(),
        };
      }
    }

    setProcessedSchedule(matrix);
  }, [workbook, selectedClass, sheetName]); // Re-run khi thay đổi lớp hoặc workbook

  // --- Kiểm tra xem ô có phải NN2 không ---
  const isNN2 = (cell: ScheduleCell | null) => {
    if (!cell || !highlightNN2) return false;
    const keywords = nn2Keywords.split(",").map((k) => k.trim().toUpperCase());
    const text = cell.originalText.toUpperCase();
    return keywords.some((k) => k && text.includes(k));
  };

  // --- Xuất Excel ---
  const exportExcel = () => {
    if (!processedSchedule) return;

    // Tạo dữ liệu cho Excel
    const header = [
      "Tiết",
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
    ];
    const body = processedSchedule.map((row, idx) => {
      const periodName = idx < 5 ? `Sáng ${idx + 1}` : `Chiều ${idx - 4}`;
      const rowData = [periodName];
      row.forEach((cell) => {
        if (cell) {
          rowData.push(removeTeacher ? cell.subject : cell.originalText);
        } else {
          rowData.push("");
        }
      });
      return rowData;
    });

    const ws = XLSX.utils.aoa_to_sheet([
      ["THỜI KHÓA BIỂU LỚP " + selectedClass],
      header,
      ...body,
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TKB");
    XLSX.writeFile(wb, `TKB_${selectedClass}.xlsx`);
  };

  // --- Xuất Ảnh ---
  const exportImage = async () => {
    if (!tableRef.current) return;
    try {
      const canvas = await html2canvas(tableRef.current, {
        scale: 2, // Tăng chất lượng ảnh
        backgroundColor: "#ffffff",
      });
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `TKB_${selectedClass}.png`);
        }
      });
    } catch (err) {
      console.error("Lỗi xuất ảnh:", err);
      alert("Không thể xuất ảnh.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileSpreadsheet className="text-green-600" />
              Công Cụ Tạo Thời Khóa Biểu
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Hỗ trợ xử lý dữ liệu TKB nhà trường & xuất ảnh đẹp
            </p>
          </div>

          <div className="flex gap-2">
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition shadow-sm">
              <Upload size={18} />
              <span>Tải lên file Excel</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {file && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Controls */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white p-5 rounded-xl shadow-sm space-y-4">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Settings size={18} /> Cấu hình
                </h3>

                {/* Chọn Lớp */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Chọn lớp học
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {allClasses.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tùy chọn hiển thị */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={removeTeacher}
                      onChange={(e) => setRemoveTeacher(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Ẩn tên giáo viên
                    </span>
                  </label>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={highlightNN2}
                        onChange={(e) => setHighlightNN2(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Tô màu Ngoại ngữ 2
                      </span>
                    </label>

                    {highlightNN2 && (
                      <div className="pl-6 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={nn2Color}
                            onChange={(e) => setNn2Color(e.target.value)}
                            className="h-8 w-8 rounded cursor-pointer border border-gray-200"
                          />
                          <span className="text-xs text-gray-500">Màu nền</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Từ khóa (phân cách bởi dấu phẩy):
                          </span>
                          <input
                            type="text"
                            value={nn2Keywords}
                            onChange={(e) => setNn2Keywords(e.target.value)}
                            className="w-full text-xs p-1 border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chọn Theme */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                    <Palette size={16} /> Giao diện bảng
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {THEMES.map((theme, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentTheme(theme)}
                        className={`w-full aspect-square rounded-full border-2 ${theme.bg.replace("bg-", "bg-")} ${currentTheme.name === theme.name ? "border-gray-800 scale-110" : "border-transparent"} transition`}
                        title={theme.name}
                      >
                        <div
                          className={`w-full h-full rounded-full ${theme.header.split(" ")[0]}`}
                        ></div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-center mt-1 text-gray-500">
                    {currentTheme.name}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white p-5 rounded-xl shadow-sm space-y-3">
                <button
                  onClick={exportExcel}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <Save size={18} /> Xuất Excel (.xlsx)
                </button>
                <button
                  onClick={exportImage}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  <ImageIcon size={18} /> Xuất Ảnh (.png)
                </button>
              </div>
            </div>

            {/* Preview Area */}
            <div className="lg:col-span-3">
              <div className="bg-white p-1 rounded-xl shadow-sm overflow-auto">
                {processedSchedule ? (
                  <div
                    ref={tableRef}
                    className={`p-8 min-w-[700px] ${currentTheme.bg}`}
                  >
                    <div className="text-center mb-6">
                      <h2
                        className={`text-3xl font-bold uppercase mb-2 ${currentTheme.text}`}
                      >
                        Thời Khóa Biểu
                      </h2>
                      <h3 className="text-xl font-semibold text-gray-600">
                        Lớp: {selectedClass}
                      </h3>
                    </div>

                    <div
                      className={`border-2 rounded-lg overflow-hidden ${currentTheme.border}`}
                    >
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className={`${currentTheme.header}`}>
                            <th className="p-3 border-r border-white/20 w-[10%]">
                              Tiết
                            </th>
                            <th className="p-3 border-r border-white/20 w-[15%]">
                              Thứ 2
                            </th>
                            <th className="p-3 border-r border-white/20 w-[15%]">
                              Thứ 3
                            </th>
                            <th className="p-3 border-r border-white/20 w-[15%]">
                              Thứ 4
                            </th>
                            <th className="p-3 border-r border-white/20 w-[15%]">
                              Thứ 5
                            </th>
                            <th className="p-3 border-r border-white/20 w-[15%]">
                              Thứ 6
                            </th>
                            <th className="p-3 w-[15%]">Thứ 7</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {processedSchedule.map((row, rowIdx) => {
                            // Tách buổi sáng chiều để thêm row ngăn cách nếu cần (tùy chọn)
                            const isAfternoonStart = rowIdx === 5;
                            return (
                              <React.Fragment key={rowIdx}>
                                {isAfternoonStart && (
                                  <tr className="bg-gray-200/50">
                                    <td
                                      colSpan={7}
                                      className="text-center py-1 font-bold text-gray-500 text-xs tracking-widest uppercase"
                                    >
                                      Buổi Chiều
                                    </td>
                                  </tr>
                                )}
                                <tr className="border-b border-gray-200 last:border-0">
                                  <td
                                    className={`p-3 text-center font-bold border-r border-gray-200 ${currentTheme.text}`}
                                  >
                                    {rowIdx < 5 ? rowIdx + 1 : rowIdx - 4}
                                  </td>
                                  {row.map((cell, colIdx) => {
                                    const isCellNN2 = isNN2(cell);
                                    return (
                                      <td
                                        key={colIdx}
                                        className={`p-3 text-center border-r border-gray-200 last:border-0 transition-colors ${currentTheme.cell}`}
                                        style={
                                          isCellNN2
                                            ? { backgroundColor: nn2Color }
                                            : {}
                                        }
                                      >
                                        {cell ? (
                                          <div className="flex flex-col">
                                            <span className="font-semibold text-gray-800 text-base">
                                              {removeTeacher
                                                ? cell.subject
                                                : cell.subject}
                                            </span>
                                            {!removeTeacher && cell.teacher && (
                                              <span className="text-xs text-gray-500 italic mt-1">
                                                {cell.teacher}
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-gray-300">
                                            -
                                          </span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 text-right text-xs text-gray-400 italic">
                      Được tạo tự động vào{" "}
                      {new Date().toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center text-gray-400">
                    <RefreshCw className="animate-spin mb-2" size={32} />
                    <p>Đang xử lý dữ liệu...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!file && (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300">
            <FileSpreadsheet size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-600">
              Chưa có dữ liệu
            </h3>
            <p className="text-gray-500 mb-6">
              Vui lòng tải lên file Excel (TKBCHINH.xlsx) để bắt đầu
            </p>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition shadow-lg">
              <Upload size={20} />
              <span>Chọn File Tải Lên</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
