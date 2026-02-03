import { NextRequest, NextResponse } from "next/server";
import { reviewContent } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { insightId, approved, editedContent } = body as {
      insightId: string;
      approved: boolean;
      editedContent?: string;
    };

    if (!insightId || typeof approved !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Missing insightId or approved status" },
        { status: 400 }
      );
    }

    const updated = await reviewContent(insightId, approved, editedContent);

    return NextResponse.json({
      success: true,
      insight: {
        id: updated.id,
        approved: updated.approved,
        published: updated.published,
      },
    });
  } catch (error) {
    console.error("Review error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to review content",
      },
      { status: 500 }
    );
  }
}
