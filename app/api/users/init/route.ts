import { type NextRequest, NextResponse } from "next/server"
import { createUser, getUserStats } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { fid, username, displayName, pfpUrl } = await request.json()

    if (!fid || !username || !displayName || !pfpUrl) {
      return NextResponse.json({ error: "Missing required user data for initialization" }, { status: 400 })
    }

    // Create or update user in the 'users' table
    const user = await createUser(fid, username, displayName, pfpUrl)

    // Get or initialize user stats in the 'user_stats' table
    const stats = await getUserStats(fid)

    return NextResponse.json({ success: true, user, stats })
  } catch (error) {
    console.error("Error initializing user:", error)
    return NextResponse.json({ error: "Failed to initialize user" }, { status: 500 })
  }
}
