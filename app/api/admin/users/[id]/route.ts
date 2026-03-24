import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        image: true,
        role: true,
        status: true,
        location: true,
        favoriteTeamId: true,
        takeCount: true,
        followerCount: true,
        followingCount: true,
        reputation: true,
        banReason: true,
        bannedUntil: true,
        bannedBy: true,
        lastActiveAt: true,
        createdAt: true,
        updatedAt: true,
        takes: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            fireCount: true,
            brickCount: true,
            replyCount: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Admin user GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, status, banReason, bannedUntil } = body;

    const updateData: Record<string, unknown> = {};

    if (role) {
      const validRoles = ["USER", "PREMIUM", "MODERATOR", "EDITOR", "ADMIN"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { success: false, error: "Invalid role" },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    if (status) {
      const validStatuses = ["ACTIVE", "SUSPENDED", "BANNED"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: "Invalid status" },
          { status: 400 }
        );
      }
      updateData.status = status;

      if (status === "BANNED" || status === "SUSPENDED") {
        updateData.banReason = banReason || null;
        updateData.bannedUntil = bannedUntil ? new Date(bannedUntil) : null;
      } else if (status === "ACTIVE") {
        updateData.banReason = null;
        updateData.bannedUntil = null;
        updateData.bannedBy = null;
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        role: true,
        status: true,
        banReason: true,
        bannedUntil: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Admin user PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, newPassword } = body;

    if (action === "resetPassword") {
      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id },
        data: { passwordHash },
      });

      return NextResponse.json({ success: true, message: "Password has been reset" });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin user POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
