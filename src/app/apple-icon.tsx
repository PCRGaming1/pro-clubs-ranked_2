import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0f14",
          border: "8px solid #2f8fe0",
        }}
      >
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: "#eef7f0",
            fontFamily: "Impact, sans-serif",
          }}
        >
          CR
        </div>
      </div>
    ),
    { ...size }
  );
}
