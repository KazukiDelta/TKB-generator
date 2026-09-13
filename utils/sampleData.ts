import { ScheduleMatrix } from "@/types/schedule";

// Sample schedule for class "12A1" (10 periods x 6 days Mon-Sat)
export const SAMPLE_CLASS = "12A1";

export const SAMPLE_SCHEDULE: ScheduleMatrix = [
  // Tiết 1: 7:00 - 7:45
  [
    { subject: "Chào cờ", teacher: "BGH", originalText: "Chào cờ", type: "activity" },
    { subject: "Toán", teacher: "Thầy Hưng", originalText: "Toán", type: "main" },
    { subject: "Vật lí", teacher: "Cô Lan", originalText: "Vật lí", type: "main" },
    { subject: "Hóa học", teacher: "Thầy Bình", originalText: "Hóa học", type: "main" },
    { subject: "Ngữ văn", teacher: "Cô Mai", originalText: "Ngữ văn", type: "main" },
    { subject: "Toán", teacher: "Thầy Hưng", originalText: "Toán", type: "main" },
  ],
  // Tiết 2: 7:50 - 8:35
  [
    { subject: "Sinh hoạt lớp", teacher: "Cô Mai", originalText: "SHL", type: "activity" },
    { subject: "Toán", teacher: "Thầy Hưng", originalText: "Toán", type: "main" },
    { subject: "Vật lí", teacher: "Cô Lan", originalText: "Vật lí", type: "main" },
    { subject: "Hóa học", teacher: "Thầy Bình", originalText: "Hóa học", type: "main" },
    { subject: "Ngữ văn", teacher: "Cô Mai", originalText: "Ngữ văn", type: "main" },
    { subject: "Toán", teacher: "Thầy Hưng", originalText: "Toán", type: "main" },
  ],
  // Tiết 3: 9:05 - 9:50
  [
    { subject: "Tiếng Anh", teacher: "Cô Thảo", originalText: "Tiếng Anh", type: "main" },
    { subject: "Ngữ văn", teacher: "Cô Mai", originalText: "Ngữ văn", type: "main" },
    { subject: "Toán", teacher: "Thầy Hưng", originalText: "Toán", type: "main" },
    { subject: "Sinh học", teacher: "Cô Nga", originalText: "Sinh học", type: "main" },
    { subject: "Lịch sử", teacher: "Thầy Tuấn", originalText: "Lịch sử", type: "main" },
    { subject: "Ngoại ngữ 2 (Pháp)", teacher: "Cô Elise", originalText: "NN2 Pháp", type: "nn2" },
  ],
  // Tiết 4: 9:55 - 10:40
  [
    { subject: "Tiếng Anh", teacher: "Cô Thảo", originalText: "Tiếng Anh", type: "main" },
    { subject: "Ngữ văn", teacher: "Cô Mai", originalText: "Ngữ văn", type: "main" },
    { subject: "Tin học", teacher: "Thầy Cường", originalText: "Tin học", type: "main" },
    { subject: "Sinh học", teacher: "Cô Nga", originalText: "Sinh học", type: "main" },
    { subject: "Địa lí", teacher: "Cô Hằng", originalText: "Địa lí", type: "main" },
    { subject: "Ngoại ngữ 2 (Pháp)", teacher: "Cô Elise", originalText: "NN2 Pháp", type: "nn2" },
  ],
  // Tiết 5: 10:45 - 11:30
  [
    null,
    { subject: "GDCD", teacher: "Cô Oanh", originalText: "GDCD", type: "main" },
    { subject: "Tin học", teacher: "Thầy Cường", originalText: "Tin học", type: "main" },
    null,
    { subject: "Công nghệ", teacher: "Thầy Long", originalText: "Công nghệ", type: "main" },
    null,
  ],
  // Tiết 6: 12:50 - 13:35 (Chiều)
  [
    { subject: "Thể dục", teacher: "Thầy Quân", originalText: "Thể dục", type: "activity" },
    null,
    { subject: "Bồi dưỡng Toán", teacher: "Thầy Hưng", originalText: "BD Toán", type: "main" },
    null,
    { subject: "Bồi dưỡng Lí", teacher: "Cô Lan", originalText: "BD Lí", type: "main" },
    null,
  ],
  // Tiết 7: 13:40 - 14:25
  [
    { subject: "Thể dục", teacher: "Thầy Quân", originalText: "Thể dục", type: "activity" },
    null,
    { subject: "Bồi dưỡng Toán", teacher: "Thầy Hưng", originalText: "BD Toán", type: "main" },
    null,
    { subject: "Bồi dưỡng Lí", teacher: "Cô Lan", originalText: "BD Lí", type: "main" },
    null,
  ],
  // Tiết 8: 14:30 - 15:15
  [
    { subject: "GDQP-AN", teacher: "Thầy Thắng", originalText: "GDQP", type: "activity" },
    null,
    null,
    null,
    null,
    null,
  ],
  // Tiết 9: 15:25 - 16:10
  [
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  // Tiết 10: 16:15 - 17:00
  [
    null,
    null,
    null,
    null,
    null,
    null,
  ],
];
