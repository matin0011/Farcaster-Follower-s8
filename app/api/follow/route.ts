import { type NextRequest, NextResponse } from "next/server"
import { createUser, getUserStats, updateUserStats, createFollowAction, hasUserFollowed } from "@/lib/db"
import { followUserOnFarcaster } from "@/lib/farcaster"

export async function POST(request: NextRequest) {
  try {
    const { followerFid, targetFid, followerUsername, followerDisplayName, followerPfpUrl } = await request.json()

    if (!followerFid || !targetFid || !followerUsername || !followerDisplayName || !followerPfpUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Ensure follower exists in our users table
    await createUser(followerFid, followerUsername, followerDisplayName, followerPfpUrl)

    // Check if user has already followed this target in our system
    const alreadyFollowedInDb = await hasUserFollowed(followerFid, targetFid)
    if (alreadyFollowedInDb) {
      return NextResponse.json({ success: true, coinsEarned: 0, message: "Already followed" })
    }

    // Perform the actual follow action via Farcaster API
    const farcasterFollowSuccess = await followUserOnFarcaster(followerFid, targetFid)

    if (!farcasterFollowSuccess) {
      // If Farcaster follow failed, we don't record it in our DB or give coins
      return NextResponse.json({ error: "Failed to perform Farcaster follow" }, { status: 500 })
    }

    const coinsEarned = 1 // Each successful follow earns 1 coin

    // Update follower's stats
    const followerStats = await getUserStats(followerFid)
    const updatedFollowerStats = await updateUserStats(followerFid, {
      coins: followerStats.coins + coinsEarned,
      follows_given: followerStats.follows_given + 1,
    })

    // Record the follow action in our database
    await createFollowAction(followerFid, targetFid, coinsEarned)

    return NextResponse.json({ success: true, coinsEarned: 1, updatedStats: updatedFollowerStats })
  } catch (error: any) {
    console.error("Error processing follow request:", error)
    return NextResponse.json({ error: error.message || "Failed to process follow request" }, { status: 500 })
  }
}
