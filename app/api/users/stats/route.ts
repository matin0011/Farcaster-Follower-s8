import { type NextRequest, NextResponse } from "next/server"
import { getUserStats } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fid = searchParams.get("fid")

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 })
    }

    const stats = await getUserStats(Number(fid))

    if (!stats) {
      return NextResponse.json({ error: "User stats not found" }, { status: 404 })
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json({ error: "Failed to fetch user stats" }, { status: 500 })
  }
}
