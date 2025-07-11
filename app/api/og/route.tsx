import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#3b82f6",
        backgroundImage: "linear-gradient(45deg, #3b82f6 0%, #8b5cf6 100%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 60, marginRight: 20 }}>🪙</div>
        <div style={{ fontSize: 48, fontWeight: "bold", color: "white" }}>Follow for Coins</div>
      </div>
      <div style={{ fontSize: 24, color: "white", opacity: 0.9, textAlign: "center" }}>
        Follow users, earn coins, order followers!
      </div>
      <div style={{ fontSize: 18, color: "white", opacity: 0.8, marginTop: 20 }}>
        Each follow = 1 coin • Each follower = 2 coins
      </div>
    </div>,
    {
      width: 1200,
      height: 800,
    },
  )
}
