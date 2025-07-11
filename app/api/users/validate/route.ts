import { type NextRequest, NextResponse } from "next/server"
import { validateFarcasterProfile } from "@/lib/farcaster"

export async function POST(request: NextRequest) {
  try {
    const { profileUrl } = await request.json()

    if (!profileUrl) {
      return NextResponse.json({ error: "Profile URL is required" }, { status: 400 })
    }

    const profile = await validateFarcasterProfile(profileUrl)

    if (!profile) {
      return NextResponse.json({ error: "Invalid Farcaster profile or user not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, profile })
  } catch (error: any) {
    console.error("Error validating profile:", error)
    return NextResponse.json({ error: error.message || "Failed to validate profile" }, { status: 500 })
  }
}
