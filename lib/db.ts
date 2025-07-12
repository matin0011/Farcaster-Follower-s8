import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

interface User {
  fid: number
  username: string
  display_name: string
  pfp_url: string
}

interface UserStats {
  fid: number
  coins: number
  follows_given: number
  followers_received: number
  referrals: number
}

interface FollowOrder {
  id: number
  requester_fid: number
  target_fid: number
  username: string
  display_name: string
  pfp_url: string
  quantity: number
  cost: number
  status: string
  created_at: Date
}

interface FollowAction {
  id: number
  follower_fid: number
  target_fid: number
  coins_earned: number
  action_at: Date
}

export async function createUser(fid: number, username: string, displayName: string, pfpUrl: string): Promise<User> {
  try {
    const [user] = await sql<User[]>`
      INSERT INTO users (fid, username, display_name, pfp_url)
      VALUES (${fid}, ${username}, ${displayName}, ${pfpUrl})
      ON CONFLICT (fid) DO UPDATE SET
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        pfp_url = EXCLUDED.pfp_url,
        created_at = users.created_at -- Keep original created_at
      RETURNING fid, username, display_name, pfp_url;
    `
    return user
  } catch (error) {
    console.error("Error creating/updating user:", error)
    throw error
  }
}

export async function getUserStats(fid: number): Promise<UserStats> {
  try {
    const [stats] = await sql<UserStats[]>`
      INSERT INTO user_stats (fid, coins) -- Explicitly set coins
      VALUES (${fid}, 10) -- Set initial coins to 10
      ON CONFLICT (fid) DO NOTHING
      RETURNING fid, coins, follows_given, followers_received, referrals;
    `
    if (stats) {
      return stats
    } else {
      // If ON CONFLICT DO NOTHING was triggered, fetch the existing stats
      const [existingStats] = await sql<UserStats[]>`
        SELECT fid, coins, follows_given, followers_received, referrals
        FROM user_stats
        WHERE fid = ${fid};
      `
      return existingStats
    }
  } catch (error) {
    console.error("Error getting/initializing user stats:", error)
    throw error
  }
}

export async function updateUserStats(fid: number, updates: Partial<Omit<UserStats, "fid">>): Promise<UserStats> {
  try {
    const setClauses = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ")

    const values = Object.values(updates)

    const [updatedStats] = await sql<UserStats[]>`
      UPDATE user_stats
      SET ${sql(setClauses)}, last_updated = CURRENT_TIMESTAMP
      WHERE fid = ${fid}
      RETURNING fid, coins, follows_given, followers_received, referrals;
    `
    return updatedStats
  } catch (error) {
    console.error("Error updating user stats:", error)
    throw error
  }
}

export async function createFollowOrder(
  requesterFid: number,
  targetFid: number,
  username: string,
  displayName: string,
  pfpUrl: string,
  quantity: number,
  cost: number,
): Promise<FollowOrder> {
  try {
    const [order] = await sql<FollowOrder[]>`
      INSERT INTO follow_orders (requester_fid, target_fid, username, display_name, pfp_url, quantity, cost)
      VALUES (${requesterFid}, ${targetFid}, ${username}, ${displayName}, ${pfpUrl}, ${quantity}, ${cost})
      RETURNING *;
    `
    return order
  } catch (error) {
    console.error("Error creating follow order:", error)
    throw error
  }
}

export async function getPendingFollowOrders(): Promise<FollowOrder[]> {
  try {
    const orders = await sql<FollowOrder[]>`
      SELECT id, requester_fid, target_fid, username, display_name, pfp_url, quantity, cost, status, created_at
      FROM follow_orders
      WHERE status = 'pending'
      ORDER BY created_at ASC;
    `
    return orders
  } catch (error) {
    console.error("Error fetching pending follow orders:", error)
    throw error
  }
}

export async function createFollowAction(
  followerFid: number,
  targetFid: number,
  coinsEarned: number,
): Promise<FollowAction | null> {
  try {
    const [action] = await sql<FollowAction[]>`
      INSERT INTO follow_actions (follower_fid, target_fid, coins_earned)
      VALUES (${followerFid}, ${targetFid}, ${coinsEarned})
      ON CONFLICT (follower_fid, target_fid) DO NOTHING
      RETURNING *;
    `
    return action || null // Returns null if conflict occurred (already followed)
  } catch (error) {
    console.error("Error creating follow action:", error)
    throw error
  }
}

export async function hasUserFollowed(followerFid: number, targetFid: number): Promise<boolean> {
  try {
    const [result] = await sql<{ count: number }[]>`
      SELECT COUNT(*) FROM follow_actions
      WHERE follower_fid = ${followerFid} AND target_fid = ${targetFid};
    `
    return result.count > 0
  } catch (error) {
    console.error("Error checking if user has followed:", error)
    throw error
  }
}
