import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { requireMobileUser, AuthError } from "@/lib/mobile-auth";

export async function POST(request: Request) {
  try {
    const user = await requireMobileUser(request);
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "Both passwords required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!fullUser?.passwordHash) {
      return NextResponse.json(
        { message: "Cannot change password for accounts signed in with Google" },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, fullUser.passwordHash);
    if (!isValid) {
      return NextResponse.json({ message: "Current password is incorrect" }, { status: 401 });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    console.error("Change password error:", error);
    return NextResponse.json({ message: "Failed to change password" }, { status: 500 });
  }
}
