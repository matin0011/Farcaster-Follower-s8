import { NextResponse } from "next/server";
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

    const userResponse = await neynarClient.lookupUserById(Number(fid));
    if (!userResponse?.user) {
      return NextResponse.json(
        { success: false, message: "Farcaster user not found." },
        { status: 404 }
      );
    }

    const user = {
      fid: userResponse.user.fid,
      username: userResponse.user.username,
      displayName: userResponse.user.display_name,
      pfpUrl: userResponse.user.pfp?.url || "/placeholder.svg",
    };

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error in GET /api/me:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}