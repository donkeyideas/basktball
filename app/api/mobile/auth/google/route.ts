import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db/prisma";

const JWT_SECRET =
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "basktball-jwt-secret";
const FIREBASE_API_KEY = "AIzaSyAc6bTd2eOnMSmltb8B_dSZtX_kEsxVrCQ";

async function verifyFirebaseToken(idToken: string) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const user = data.users?.[0];
  if (!user) return null;

  return {
    email: user.email as string,
    name: user.displayName as string | undefined,
    image: user.photoUrl as string | undefined,
    emailVerified: user.emailVerified as boolean,
  };
}

export async function POST(request: Request) {
  try {
    const { firebaseToken } = await request.json();

    if (!firebaseToken) {
      return NextResponse.json(
        { message: "Firebase token is required" },
        { status: 400 }
      );
    }

    const firebaseUser = await verifyFirebaseToken(firebaseToken);
    if (!firebaseUser || !firebaseUser.email) {
      return NextResponse.json(
        { message: "Invalid Google sign-in token" },
        { status: 401 }
      );
    }

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email: firebaseUser.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        image: true,
        avatarUrl: true,
        role: true,
        status: true,
        bio: true,
        takeCount: true,
        followerCount: true,
        followingCount: true,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: firebaseUser.email.toLowerCase(),
          name: firebaseUser.name || null,
          image: firebaseUser.image || null,
          emailVerified: firebaseUser.emailVerified ? new Date() : null,
          role: "USER",
        },
        select: {
          id: true,
          email: true,
          name: true,
          displayName: true,
          image: true,
          avatarUrl: true,
          role: true,
          status: true,
          bio: true,
          takeCount: true,
          followerCount: true,
          followingCount: true,
        },
      });
    } else {
      // Update image from Google if not set
      if (!user.image && firebaseUser.image) {
        await prisma.user.update({
          where: { id: user.id },
          data: { image: firebaseUser.image },
        });
        user.image = firebaseUser.image;
      }
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

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName || user.name,
        displayName: user.displayName,
        image: user.avatarUrl || user.image,
        avatarUrl: user.avatarUrl,
        role: user.role,
        bio: user.bio,
        takeCount: user.takeCount,
        followerCount: user.followerCount,
        followingCount: user.followingCount,
      },
    });
  } catch (error) {
    console.error("Mobile Google auth error:", error);
    return NextResponse.json(
      { message: "Google sign-in failed. Please try again." },
      { status: 500 }
    );
  }
}
