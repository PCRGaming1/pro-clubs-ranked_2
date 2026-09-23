import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
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
          background: "#0a0f14",
          borderRadius: 7,
          border: "2px solid #2f8fe0",
        }}
      >
        <div
          style={{
            fontSize: 17,
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
