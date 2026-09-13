export type ThemeCategory = "classic" | "current" | "bw" | "handdrawn";

export interface ThemeDefinition {
  id: string;
  name: string;
  shortName: string;
  category: ThemeCategory;
  description: string;
  previewColors: [string, string];
  
  // Canvas & Visual Styling
  bgType: "mesh" | "chalkboard" | "notebook" | "paper" | "clean" | "dark";
  canvasBg: string;
  meshColors?: [string, string];
  
  // Panel
  panelFill: string;
  panelBorder: string;
  panelRadius: number; // in pixels (or 0 for sharp)
  isHandDrawn?: boolean; // uses wobbly irregular borders & sketch style
  shadowOffset?: number; // e.g. 4 for 4px 4px 0px solid shadow
  shadowColor?: string;

  // Typography
  fontHeading: string; // e.g. "Kalam", "Outfit", "Inter"
  fontBody: string; // e.g. "Patrick Hand", "JetBrains Mono", "system-ui"
  
  // Colors
  titleColor: string;
  subtitleColor: string;
  textPrimary: string;
  textMuted: string;
  badgeBg: string;
  badgeText: string;
  
  // Day & Time
  dayColor: string;
  dayBorderColor: string;
  timeColor: string;
  timeBorderColor: string;
  
  // Cells
  cellFill: string;
  cellBorder: string;
  cellEmptyFill: string;
  cellEmptyBorder: string;
  subjectColor: string;
  teacherColor: string;
  highlightDefault: string; // fallback color for NN2 highlight
  
  // Web UI helper classes
  uiAccentBg: string;
  uiCardBg: string;
  uiBorder: string;
}
