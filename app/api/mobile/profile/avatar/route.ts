import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireMobileUser, AuthError } from "@/lib/mobile-auth";
import { uploadAvatar } from "@/lib/supabase-storage";

export async function POST(request: Request) {
  try {
    const user = await requireMobileUser(request);
    const body = await request.json();
    const { image, mimeType } = body;

    if (!image || !mimeType) {
      return NextResponse.json({ message: "Image data required" }, { status: 400 });
    }

    if (image.length > 7_000_000) {
      return NextResponse.json({ message: "Image too large (max 5MB)" }, { status: 400 });
    }

    const avatarUrl = await uploadAvatar(user.id, image, mimeType);

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    });

    return NextResponse.json({ avatarUrl });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Avatar upload error:", detail, error);
    return NextResponse.json({ message: `Upload failed: ${detail}` }, { status: 500 });
  }
}
