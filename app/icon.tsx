import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          background:
            "linear-gradient(135deg, rgba(34,211,238,1) 0%, rgba(168,85,247,1) 100%)",
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 14,
            background: "rgba(2,6,23,0.35)",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "white",
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: 3,
            fontFamily:
              "system-ui, -apple-system, Segoe UI, Arial, 'Noto Sans', sans-serif",
          }}
        >
          TKB
        </div>
      </div>
    ),
    size,
  );
}

