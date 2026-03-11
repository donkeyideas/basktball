import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const { email, password, name, displayName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Check displayName uniqueness if provided
    const trimmedDisplayName = displayName?.trim() || null;
    if (trimmedDisplayName) {
      if (trimmedDisplayName.length < 3 || trimmedDisplayName.length > 30) {
        return NextResponse.json(
          { error: "Display name must be 3-30 characters" },
          { status: 400 }
        );
      }
      const existingName = await prisma.user.findFirst({
        where: { displayName: { equals: trimmedDisplayName, mode: "insensitive" } },
      });
      if (existingName) {
        return NextResponse.json(
          { error: "This display name is already taken" },
          { status: 409 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: emailLower,
        passwordHash,
        name: name?.trim() || null,
        displayName: trimmedDisplayName,
        role: "USER",
      },
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
