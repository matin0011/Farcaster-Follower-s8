import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

const config = new Configuration({
  apiKey: process.env.NEYNAR_API_KEY,
  baseOptions: {
    headers: {
      "x-neynar-experimental": true,
    },
  },
});
const neynarClient = new NeynarAPIClient(config);

const OrderSchema = new mongoose.Schema({
  warpcastLink: String,
  userFid: Number,
  username: String,
  pfpUrl: String,
  requiredFollows: Number,
  createdAt: { type: Date, default: Date.now },
});
const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

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
    const { warpcastLink, requiredFollows, fid } = await request.json();

    // Validate Warpcast link
    const username = warpcastLink.match(/farcaster\.xyz\/([^/?]+)/)?.[1];
    if (!username) {
      return NextResponse.json(
        { success: false, message: "Invalid Farcaster profile URL." },
        { status: 400 }
      );
    }

    const userResponse = await neynarClient.lookupUserByUsername(username);
    if (!userResponse?.user) {
      return NextResponse.json(
        { success: false, message: "Farcaster user not found." },
        { status: 400 }
      );
    }

    const order = new Order({
      warpcastLink,
      userFid: userResponse.user.fid,
      username: userResponse.user.username,
      pfpUrl: userResponse.user.pfp?.url || "/placeholder.svg",
      requiredFollows,
    });
    await order.save();

    // Update user stats
    let userStats = await UserStats.findOne({ fid });
    if (!userStats) {
      userStats = new UserStats({
        fid,
        coins: 0,
        followsGiven: 0,
        followersReceived: requiredFollows,
        referrals: 0,
      });
    } else {
      userStats.followersReceived += requiredFollows;
      userStats.updatedAt = new Date();
    }
    await userStats.save();

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Error in POST /api/order:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    const orders = await Order.find();
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Error in GET /api/order:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}