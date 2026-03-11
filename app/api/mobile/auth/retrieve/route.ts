import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Retrieve stored auth token for mobile auth flow
// Deletes the token after retrieval (one-time use)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sid = searchParams.get("sid");

    if (!sid) {
      return NextResponse.json({ message: "Missing sid" }, { status: 400 });
    }

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !redisToken) {
      return NextResponse.json({ message: "Auth service unavailable" }, { status: 503 });
    }

    const redis = new Redis({ url, token: redisToken });
    const data = await redis.get<string>(`mobile-auth:${sid}`);

    if (!data) {
      return NextResponse.json({ found: false });
    }

    // Delete after retrieval (one-time use)
    await redis.del(`mobile-auth:${sid}`);

    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    return NextResponse.json({ found: true, token: parsed.token, user: parsed.user });
  } catch (error) {
    console.error("Retrieve auth error:", error);
    return NextResponse.json({ message: "Failed to retrieve auth" }, { status: 500 });
  }
}
