import { StickerPreset } from "@/types/sticker";

// Helper to encode SVG string to data URI
function svgToUri(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

export const STICKER_PRESETS: StickerPreset[] = [
  {
    id: "sticker-logo",
    name: "TKB Logo",
    category: "stamps",
    src: "/logo.png",
    defaultWidth: 100,
    defaultHeight: 100,
  },
  {
    id: "hust-alien",
    name: "Alien HUST 👽",
    category: "mascot",
    src: "/alien_hust_no_bg.png",
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: "hust-yapping",
    name: "Yapping HUST 💬",
    category: "mascot",
    src: "/yapping_hust_no_bg.png",
    defaultWidth: 120,
    defaultHeight: 120,
  },
  {
    id: "stamp-co-len",
    name: "Cố Lên! 💪",
    category: "study",
    src: svgToUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 60">
        <rect x="4" y="4" width="152" height="52" rx="10" fill="#fef08a" stroke="#ca8a04" stroke-width="4" stroke-dasharray="6,4"/>
        <text x="80" y="31" dominant-baseline="central" font-family="'Segoe UI', Roboto, Arial, sans-serif" font-weight="900" font-size="20" fill="#854d0e" text-anchor="middle">CỐ LÊN! 💪</text>
      </svg>
    `),
    defaultWidth: 150,
    defaultHeight: 56,
  },
  {
    id: "stamp-deadline",
    name: "Deadline! ⏰",
    category: "study",
    src: svgToUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 60">
        <rect x="4" y="4" width="162" height="52" rx="8" fill="#fee2e2" stroke="#ef4444" stroke-width="4"/>
        <text x="85" y="31" dominant-baseline="central" font-family="'Segoe UI', Roboto, Arial, sans-serif" font-weight="900" font-size="19" fill="#b91c1c" text-anchor="middle">DEADLINE ⏰</text>
      </svg>
    `),
    defaultWidth: 160,
    defaultHeight: 56,
  },
  {
    id: "stamp-thi-cu",
    name: "Thi Cử 📝",
    category: "study",
    src: svgToUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 60">
        <rect x="4" y="4" width="142" height="52" rx="12" fill="#e0e7ff" stroke="#4f46e5" stroke-width="3.5"/>
        <text x="75" y="31" dominant-baseline="central" font-family="'Segoe UI', Roboto, Arial, sans-serif" font-weight="900" font-size="19" fill="#3730a3" text-anchor="middle">THI CỬ 📝</text>
      </svg>
    `),
    defaultWidth: 140,
    defaultHeight: 56,
  },
  {
    id: "stamp-aplus",
    name: "Điểm A+ ⭐",
    category: "study",
    src: svgToUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r="40" fill="#fef08a" stroke="#eab308" stroke-width="4"/>
        <text x="45" y="47" dominant-baseline="central" font-family="'Segoe UI', Roboto, Arial, sans-serif" font-weight="900" font-size="32" fill="#ca8a04" text-anchor="middle">A+</text>
      </svg>
    `),
    defaultWidth: 90,
    defaultHeight: 90,
  },
  {
    id: "stamp-nghi",
    name: "Được Nghỉ! 🎉",
    category: "fun",
    src: svgToUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 60">
        <rect x="4" y="4" width="152" height="52" rx="26" fill="#dcfce7" stroke="#16a34a" stroke-width="3.5"/>
        <text x="80" y="31" dominant-baseline="central" font-family="'Segoe UI', Roboto, Arial, sans-serif" font-weight="900" font-size="18" fill="#15803d" text-anchor="middle">ĐƯỢC NGHỈ 🎉</text>
      </svg>
    `),
    defaultWidth: 150,
    defaultHeight: 56,
  },
  {
    id: "deco-thumbtack",
    name: "Ghim Đỏ (Pin)",
    category: "decoration",
    src: svgToUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
        <circle cx="30" cy="26" r="16" fill="#ef4444" stroke="#991b1b" stroke-width="3"/>
        <circle cx="26" cy="22" r="5" fill="#fca5a5"/>
        <polygon points="28,42 32,42 30,56" fill="#71717a"/>
      </svg>
    `),
    defaultWidth: 60,
    defaultHeight: 60,
  },
  {
    id: "deco-tape",
    name: "Băng Dính Washi",
    category: "decoration",
    src: svgToUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 44">
        <rect x="4" y="6" width="152" height="32" fill="rgba(254, 240, 138, 0.75)" stroke="#ca8a04" stroke-width="2" stroke-dasharray="4,2"/>
        <line x1="20" y1="6" x2="15" y2="38" stroke="#ca8a04" stroke-width="1" stroke-dasharray="3,3"/>
        <line x1="140" y1="6" x2="145" y2="38" stroke="#ca8a04" stroke-width="1" stroke-dasharray="3,3"/>
      </svg>
    `),
    defaultWidth: 160,
    defaultHeight: 44,
  },
  {
    id: "deco-star",
    name: "Ngôi Sao Vàng",
    category: "decoration",
    src: svgToUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
        <polygon points="40,6 50,28 74,30 56,47 62,71 40,58 18,71 24,47 6,30 30,28" fill="#facc15" stroke="#ca8a04" stroke-width="3"/>
      </svg>
    `),
    defaultWidth: 70,
    defaultHeight: 70,
  },
  {
    id: "deco-postit",
    name: "Post-it Note",
    category: "decoration",
    src: svgToUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <polygon points="6,6 114,6 114,92 92,114 6,114" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>
        <polygon points="92,92 114,92 92,114" fill="#fde047" stroke="#ca8a04" stroke-width="2"/>
        <line x1="20" y1="36" x2="100" y2="36" stroke="#ca8a04" stroke-width="2.5" stroke-dasharray="3,3"/>
        <line x1="20" y1="60" x2="100" y2="60" stroke="#ca8a04" stroke-width="2.5" stroke-dasharray="3,3"/>
        <line x1="20" y1="84" x2="75" y2="84" stroke="#ca8a04" stroke-width="2.5" stroke-dasharray="3,3"/>
      </svg>
    `),
    defaultWidth: 100,
    defaultHeight: 100,
  },
];
