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

const FollowerSchema = new mongoose.Schema({
  orderId: mongoose.Schema.Types.ObjectId,
  fid: Number,
  username: String,
  followedByFid: Number,
  followedByUsername: String,
  timestamp: { type: Date, default: Date.now },
});
const Follower = mongoose.models.Follower || mongoose.model("Follower", FollowerSchema);

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
    const { orderId, signerUuid, followedByFid, followedByUsername } = await request.json();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 }
      );
    }

    const followResponse = await neynarClient.followUser(signerUuid, [order.userFid]);
    if (!followResponse.success) {
      return NextResponse.json(
        { success: false, message: "Follow failed." },
        { status: 400 }
      );
    }

    const newFollower = new Follower({
      orderId,
      fid: order.userFid,
      username: order.username,
      followedByFid,
      followedByUsername,
    });
    await newFollower.save();

    // Update user stats
    let userStats = await UserStats.findOne({ fid: followedByFid });
    if (!userStats) {
      userStats = new UserStats({
        fid: followedByFid,
        coins: 1,
        followsGiven: 1,
        followersReceived: 0,
        referrals: 0,
      });
    } else {
      userStats.coins += 1;
      userStats.followsGiven += 1;
      userStats.updatedAt = new Date();
    }
    await userStats.save();

    if (order.requiredFollows > 0) {
      order.requiredFollows -= 1;
      await order.save();
    }

    return NextResponse.json({
      success: true,
      message: `Followed user ${order.username}.`,
      remainingFollows: order.requiredFollows,
    });
  } catch (error) {
    console.error("Error in POST /api/follow:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}