import { ImageResponse } from "next/og";

export const alt = "Pro Clubs Ranked — matchmaking and a free XP ladder for EA FC Pro Clubs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "linear-gradient(100deg, #05070a 0%, #0a1726 55%, #05070a 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 130,
            height: 130,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0f14",
            border: "6px solid #2f8fe0",
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 700, color: "#eef7f0" }}>CR</div>
        </div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 700, letterSpacing: 4, color: "#eef7f0" }}>
          CLUBS RANKED
        </div>
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 6, color: "#9fb3c4" }}>
          MATCHMAKING &amp; A FREE XP LADDER FOR EA FC PRO CLUBS
        </div>
      </div>
    ),
    { ...size }
  );
}
