import { NeynarAPIClient } from "@neynar/nodejs-sdk"
import { isApiErrorResponse } from "@neynar/nodejs-sdk"

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!
const NEYNAR_SIGNER_UUID = process.env.NEYNAR_SIGNER_UUID!

const neynarClient = new NeynarAPIClient(NEYNAR_API_KEY)

export interface FarcasterProfile {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
}

export async function validateFarcasterProfile(profileIdentifier: string): Promise<FarcasterProfile | null> {
  try {
    let username: string | null = null

    // Extract username from various URL formats
    if (profileIdentifier.startsWith("https://farcaster.xyz/")) {
      username = profileIdentifier.split("/").pop()?.split("?")[0] || null
    } else if (profileIdentifier.startsWith("https://warpcast.com/")) {
      username = profileIdentifier.split("/").pop()?.split("?")[0] || null
    } else if (profileIdentifier.startsWith("@")) {
      username = profileIdentifier.substring(1)
    } else {
      // Assume it's just a username
      username = profileIdentifier
    }

    if (!username) {
      throw new Error("Invalid Farcaster profile URL or username format.")
    }

    // Fetch user by username
    const { user } = await neynarClient.lookupUserByUsername(username)

    if (!user) {
      return null
    }

    return {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url.url,
    }
  } catch (error) {
    if (isApiErrorResponse(error)) {
      console.error("Neynar API Error validating profile:", error.response.data)
    } else {
      console.error("Error validating Farcaster profile:", error)
    }
    return null
  }
}

export async function followUserOnFarcaster(followerFid: number, targetFid: number): Promise<boolean> {
  try {
    if (!NEYNAR_SIGNER_UUID) {
      console.error("NEYNAR_SIGNER_UUID is not set. Cannot perform follow action.")
      throw new Error("Neynar signer UUID is not configured.")
    }

    // Check if the follower is the same as the target
    if (followerFid === targetFid) {
      console.log("Cannot follow self.")
      return false
    }

    const response = await neynarClient.followUser(NEYNAR_SIGNER_UUID, targetFid)

    if (response.success) {
      console.log(`Successfully followed user ${targetFid} by ${followerFid}`)
      return true
    } else {
      console.error(`Failed to follow user ${targetFid} by ${followerFid}:`, response)
      return false
    }
  } catch (error) {
    if (isApiErrorResponse(error)) {
      console.error("Neynar API Error following user:", error.response.data)
      // Specific error handling for "already following"
      if (error.response.data.message && error.response.data.message.includes("already following")) {
        console.log(`User ${followerFid} is already following ${targetFid}. Considering it a success.`)
        return true // Treat as success if already following
      }
    } else {
      console.error("Error following user:", error)
    }
    return false
  }
}
