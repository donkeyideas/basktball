import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Store auth token temporarily for mobile auth flow
// Token expires after 5 minutes
export async function POST(request: Request) {
  try {
    const { sid, token, user } = await request.json();

    if (!sid || !token || !user) {
      return NextResponse.json({ message: "Missing parameters" }, { status: 400 });
    }

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && redisToken) {
      const redis = new Redis({ url, token: redisToken });
      await redis.set(`mobile-auth:${sid}`, JSON.stringify({ token, user }), { ex: 300 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Store auth error:", error);
    return NextResponse.json({ message: "Failed to store auth" }, { status: 500 });
  }
}
