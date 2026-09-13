/**
 * Tự động tính toán niên khóa học tập dựa trên ngày tháng hiện tại.
 * Năm học ở Việt Nam thường bắt đầu từ tháng 8 hoặc tháng 9:
 * - Nếu tháng >= 8: Năm học = [Năm hiện tại] - [Năm hiện tại + 1]
 * - Nếu tháng < 8: Năm học = [Năm hiện tại - 1] - [Năm hiện tại]
 */
export function getCurrentAcademicYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1 - 12

  if (currentMonth >= 8) {
    return `Năm Học ${currentYear}-${currentYear + 1}`;
  } else {
    return `Năm Học ${currentYear - 1}-${currentYear}`;
  }
}
