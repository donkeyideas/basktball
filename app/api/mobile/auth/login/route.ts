import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db/prisma";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "basktball-jwt-secret";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        image: true,
        avatarUrl: true,
        role: true,
        status: true,
        passwordHash: true,
        bio: true,
        takeCount: true,
        followerCount: true,
        followingCount: true,
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.status === "BANNED") {
      return NextResponse.json(
        { message: "This account has been banned" },
        { status: 403 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { message: "This account is temporarily suspended" },
        { status: 403 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      token,
      user: {
        ...userWithoutPassword,
        name: user.displayName || user.name,
        image: user.avatarUrl || user.image,
      },
    });
  } catch (error) {
    console.error("Mobile login error:", error);
    return NextResponse.json(
      { message: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
