import { type NextRequest, NextResponse } from "next/server"
import { createFollowOrder, getPendingFollowOrders, createUser, getUserStats, updateUserStats } from "@/lib/db"
import { validateFarcasterProfile } from "@/lib/farcaster"

export async function GET(request: NextRequest) {
  try {
    const orders = await getPendingFollowOrders()
    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { requesterFid, requesterUsername, requesterDisplayName, requesterPfpUrl, profileUrl, quantity } =
      await request.json()

    if (!requesterFid || !requesterUsername || !requesterDisplayName || !requesterPfpUrl || !profileUrl || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const costPerFollower = 2
    const totalCost = quantity * costPerFollower

    // Ensure the requester user exists in the database
    await createUser(requesterFid, requesterUsername, requesterDisplayName, requesterPfpUrl)

    // Check requester's coins
    const requesterStats = await getUserStats(requesterFid)
    if (requesterStats.coins < totalCost) {
      return NextResponse.json({ error: "Insufficient coins" }, { status: 402 })
    }

    // Validate Farcaster profile URL
    const targetProfile = await validateFarcasterProfile(profileUrl)

    if (!targetProfile) {
      return NextResponse.json({ error: "Invalid Farcaster profile URL or user not found" }, { status: 400 })
    }

    // Ensure the target user exists in our users table (if they don't already)
    await createUser(targetProfile.fid, targetProfile.username, targetProfile.displayName, targetProfile.pfpUrl)

    // Create the follow order
    const order = await createFollowOrder(
      requesterFid,
      targetProfile.fid,
      targetProfile.username,
      targetProfile.displayName,
      targetProfile.pfpUrl,
      quantity,
      totalCost,
    )

    // Deduct coins from requester
    await updateUserStats(requesterFid, {
      coins: requesterStats.coins - totalCost,
      followers_received: requesterStats.followers_received + quantity, // Increment followers received for the requester
    })

    return NextResponse.json({
      success: true,
      order,
      cost: totalCost,
      targetUser: targetProfile,
    })
  } catch (error: any) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 })
  }
}
