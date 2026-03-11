import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireMobileUser } from "@/lib/mobile-auth";

// GET /api/mobile/profile - Get current user's profile
export async function GET(request: Request) {
  try {
    const user = await requireMobileUser(request);

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        bio: true,
        avatarUrl: true,
        image: true,
        location: true,
        favoriteTeams: true,
        favoritePlayers: true,
        role: true,
        takeCount: true,
        followerCount: true,
        followingCount: true,
        createdAt: true,
        accounts: {
          select: { provider: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Get mobile profile error:", error);
    return NextResponse.json({ message: "Failed to load profile" }, { status: 500 });
  }
}

// PATCH /api/mobile/profile - Update current user's profile
export async function PATCH(request: Request) {
  try {
    const user = await requireMobileUser(request);
    const body = await request.json();
    const { displayName, bio, location, handle, favoriteTeams } = body;

    // Validate displayName
    if (displayName !== undefined) {
      if (typeof displayName !== "string" || displayName.trim().length < 2 || displayName.trim().length > 30) {
        return NextResponse.json({ message: "Display name must be 2-30 characters" }, { status: 400 });
      }

      const existing = await prisma.user.findFirst({
        where: {
          displayName: { equals: displayName.trim(), mode: "insensitive" },
          id: { not: user.id },
        },
      });
      if (existing) {
        return NextResponse.json({ message: "Display name is already taken" }, { status: 409 });
      }
    }

    // Validate handle
    if (handle !== undefined) {
      if (typeof handle !== "string" || handle.trim().length < 3 || handle.trim().length > 20) {
        return NextResponse.json({ message: "Handle must be 3-20 characters" }, { status: 400 });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(handle.trim())) {
        return NextResponse.json({ message: "Handle can only contain letters, numbers, and underscores" }, { status: 400 });
      }

      const existingHandle = await prisma.user.findFirst({
        where: {
          name: { equals: handle.trim(), mode: "insensitive" },
          id: { not: user.id },
        },
      });
      if (existingHandle) {
        return NextResponse.json({ message: "Handle is already taken" }, { status: 409 });
      }
    }

    if (bio !== undefined && typeof bio === "string" && bio.length > 160) {
      return NextResponse.json({ message: "Bio must be 160 characters or less" }, { status: 400 });
    }

    if (location !== undefined && typeof location === "string" && location.length > 50) {
      return NextResponse.json({ message: "Location must be 50 characters or less" }, { status: 400 });
    }

    if (favoriteTeams !== undefined) {
      if (!Array.isArray(favoriteTeams) || favoriteTeams.length > 5) {
        return NextResponse.json({ message: "Max 5 favorite teams" }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (displayName !== undefined) updateData.displayName = displayName.trim();
    if (handle !== undefined) updateData.name = handle.trim();
    if (bio !== undefined) updateData.bio = bio.trim() || null;
    if (location !== undefined) updateData.location = location.trim() || null;
    if (favoriteTeams !== undefined) updateData.favoriteTeams = favoriteTeams;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        displayName: true,
        bio: true,
        location: true,
        avatarUrl: true,
        image: true,
        favoriteTeams: true,
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    console.error("Update mobile profile error:", error);
    return NextResponse.json({ message: "Failed to update profile" }, { status: 500 });
  }
}
