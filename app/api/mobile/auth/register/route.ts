import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db/prisma";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "basktball-jwt-secret";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 30) {
      return NextResponse.json(
        { message: "Display name must be 3-30 characters" },
        { status: 400 }
      );
    }

    // Check existing
    const existingEmail = await prisma.user.findUnique({
      where: { email: emailLower },
    });
    if (existingEmail) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const existingName = await prisma.user.findFirst({
      where: { displayName: { equals: trimmedName, mode: "insensitive" } },
    });
    if (existingName) {
      return NextResponse.json(
        { message: "This display name is already taken" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: emailLower,
        passwordHash,
        name: trimmedName,
        displayName: trimmedName,
        role: "USER",
        termsAcceptedAt: new Date(),
      },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName || user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Mobile register error:", error);
    return NextResponse.json(
      { message: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
