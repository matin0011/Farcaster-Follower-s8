import { NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Missing token" },
        { status: 401 }
      );
    }

    const token = authorization.split(" ")[1];
    // فرض می‌کنیم توکن از Sign in with Farcaster دریافت شده
    const userResponse = await neynarClient.verifySignInMessage(token);
    if (!userResponse.is_verified) {
      return NextResponse.json(
        { success: false, message: "احراز هویت ناموفق بود." },
        { status: 401 }
      );
    }

    const fid = userResponse.fid;
    const userData = await neynarClient.lookupUserByFid(fid);

    return NextResponse.json({
      success: true,
      fid: fid,
      username: userData.user.username,
      signerUuid: userResponse.signer_uuid, // فرضی
    });
  } catch (error) {
    console.error("Error in GET /api/me:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}