import { NextResponse } from "next/server";
import mongoose from "mongoose";

const UserStatsSchema = new mongoose.Schema({
  fid: Number,
  coins: Number,
  followsGiven: Number,
  followersReceived: Number,
  referrals: Number,
  updatedAt: { type: Date, default: Date.now },
});
const UserStats = mongoose.models.UserStats || mongoose.model("UserStats", UserStatsSchema);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const fid = url.searchParams.get("fid");
    if (!fid) {
      return NextResponse.json(
        { success: false, message: "Missing user FID." },
        { status: 400 }
      );
    }

    await mongoose.connect(process.env.MONGODB_URI!);
    let userStats = await UserStats.findOne({ fid: Number(fid) });

    if (!userStats) {
      userStats = new UserStats({
        fid: Number(fid),
        coins: 0,
        followsGiven: 0,
        followersReceived: 0,
        referrals: 0,
      });
      await userStats.save();
    }

    return NextResponse.json({ success: true, stats: userStats });
  } catch (error) {
    console.error("Error in GET /api/user-stats:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    const { fid, coins, followsGiven, followersReceived, referrals } = await request.json();

    if (!fid) {
      return NextResponse.json(
        { success: false, message: "Missing user FID." },
        { status: 400 }
      );
    }

    let userStats = await UserStats.findOne({ fid: Number(fid) });

    if (!userStats) {
      userStats = new UserStats({
        fid: Number(fid),
        coins: coins || 0,
        followsGiven: followsGiven || 0,
        followersReceived: followersReceived || 0,
        referrals: referrals || 0,
      });
    } else {
      if (coins !== undefined) userStats.coins = coins;
      if (followsGiven !== undefined) userStats.followsGiven = followsGiven;
      if (followersReceived !== undefined) userStats.followersReceived = followersReceived;
      if (referrals !== undefined) userStats.referrals = referrals;
      userStats.updatedAt = new Date();
    }

    await userStats.save();
    return NextResponse.json({ success: true, stats: userStats });
  } catch (error) {
    console.error("Error in POST /api/user-stats:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}