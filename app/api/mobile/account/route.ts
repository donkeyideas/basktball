import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireMobileUser, AuthError } from "@/lib/mobile-auth";

export async function DELETE(request: Request) {
  try {
    const user = await requireMobileUser(request);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: "BANNED",
        banReason: "Account deleted by user",
        email: `deleted_${user.id}@deleted.basktball.com`,
      },
    });

    return NextResponse.json({ message: "Account deleted" });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    console.error("Delete account error:", error);
    return NextResponse.json({ message: "Failed to delete account" }, { status: 500 });
  }
}
