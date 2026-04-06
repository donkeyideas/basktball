import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendSystemBroadcast } from "@/lib/notifications/system-broadcast";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, body, targetAudience, data } = await request.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    const result = await sendSystemBroadcast({
      title,
      body,
      targetAudience: targetAudience || "all",
      sentByUserId: session.user.id,
      data,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Broadcast error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send broadcast" },
      { status: 500 }
    );
  }
}
