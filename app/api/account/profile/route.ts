import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { getCourtUser } from "@/lib/court/auth";

export async function GET() {
  try {
    const session = await auth();
    const user = getCourtUser(session);
    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

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
      },
    });

    if (!profile) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json({ message: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    const user = getCourtUser(session);
    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, bio, location, handle } = body;

    // Validate displayName
    if (displayName !== undefined) {
      if (typeof displayName !== "string" || displayName.trim().length < 2 || displayName.trim().length > 30) {
        return NextResponse.json({ message: "Display name must be 2-30 characters" }, { status: 400 });
      }

      // Check uniqueness (case-insensitive)
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

    // Validate handle (username)
    if (handle !== undefined) {
      if (typeof handle !== "string" || handle.trim().length < 3 || handle.trim().length > 20) {
        return NextResponse.json({ message: "Handle must be 3-20 characters" }, { status: 400 });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(handle.trim())) {
        return NextResponse.json({ message: "Handle can only contain letters, numbers, and underscores" }, { status: 400 });
      }

      // Check uniqueness (case-insensitive)
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

    // Validate bio
    if (bio !== undefined && typeof bio === "string" && bio.length > 160) {
      return NextResponse.json({ message: "Bio must be 160 characters or less" }, { status: 400 });
    }

    // Validate location
    if (location !== undefined && typeof location === "string" && location.length > 50) {
      return NextResponse.json({ message: "Location must be 50 characters or less" }, { status: 400 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (displayName !== undefined) updateData.displayName = displayName.trim();
    if (handle !== undefined) updateData.name = handle.trim();
    if (bio !== undefined) updateData.bio = bio.trim() || null;
    if (location !== undefined) updateData.location = location.trim() || null;

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
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ message: "Failed to update profile" }, { status: 500 });
  }
}
