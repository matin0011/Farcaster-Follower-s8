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

export async function POST(request: Request) {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    const { fid } = await request.json();

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
        coins: 5,
        followsGiven: 0,
        followersReceived: 0,
        referrals: 1,
      });
    } else {
      userStats.referrals += 1;
      userStats.coins += 5;
      userStats.updatedAt = new Date();
    }
    await userStats.save();

    return NextResponse.json({ success: true, stats: userStats });
  } catch (error) {
    console.error("Error in POST /api/referrals:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}