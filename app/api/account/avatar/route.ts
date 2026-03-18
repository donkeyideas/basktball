import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { uploadAvatar } from "@/lib/supabase-storage";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { image, mimeType } = body;

    if (!image || !mimeType) {
      return NextResponse.json({ message: "Image data required" }, { status: 400 });
    }

    if (image.length > 7_000_000) {
      return NextResponse.json({ message: "Image too large (max 5MB)" }, { status: 400 });
    }

    const userId = (session.user as { id: string }).id;
    const avatarUrl = await uploadAvatar(userId, image, mimeType);

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return NextResponse.json({ avatarUrl });
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Avatar upload error:", detail, error);
    return NextResponse.json({ message: `Upload failed: ${detail}` }, { status: 500 });
  }
}
