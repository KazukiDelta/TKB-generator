export interface StickerItem {
  id: string;
  src: string; // URL, data URL, or SVG
  name: string;
  x: number; // Base coordinates in 1920x1080 canvas space
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees (-180 to 180)
  opacity: number; // 0 to 1
  isCustom?: boolean;
}

export interface StickerPreset {
  id: string;
  name: string;
  category: "study" | "fun" | "decoration" | "stamps" | "mascot";
  src: string; // data URI or icon SVG path / image URL
  defaultWidth: number;
  defaultHeight: number;
}
