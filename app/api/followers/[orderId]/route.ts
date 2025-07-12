import { NextResponse } from "next/server";
import mongoose from "mongoose";

const FollowerSchema = new mongoose.Schema({
  orderId: mongoose.Schema.Types.ObjectId,
  fid: Number,
  username: String,
  followedByFid: Number,
  followedByUsername: String,
  timestamp: { type: Date, default: Date.now },
});
const Follower = mongoose.models.Follower || mongoose.model("Follower", FollowerSchema);

export async function GET(request: Request, { params }: { params: { orderId: string } }) {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    const followers = await Follower.find({ orderId: params.orderId });
    return NextResponse.json({ success: true, followers });
  } catch (error) {
    console.error("Error in GET /api/followers/[orderId]:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}