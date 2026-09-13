export type ScheduleCellType = "main" | "nn2" | "activity" | "empty";

export interface ScheduleCell {
  subject: string;
  teacher: string;
  originalText: string;
  type: ScheduleCellType;
}

export type ScheduleMatrix = (ScheduleCell | null)[][];

export type SheetData = unknown[][];

export interface TimeSlot {
  start: string;
  end: string;
}

export const TIME_SLOTS: TimeSlot[] = [
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

export const DAYS_OF_WEEK = [
  "THỨ 2 (MON)",
  "THỨ 3 (TUE)",
  "THỨ 4 (WED)",
  "THỨ 5 (THU)",
  "THỨ 6 (FRI)",
  "THỨ 7 (SAT)",
];

export const DAYS_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
