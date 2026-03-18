import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { prisma } from "@/lib/db/prisma";

const JWT_SECRET =
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "basktball-jwt-secret";

// Apple's public key endpoint for verifying identity tokens
const APPLE_JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys")
);

async function verifyAppleToken(identityToken: string) {
  try {
    const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
      issuer: "https://appleid.apple.com",
      audience: "com.basktball.app", // Must match iOS bundle ID
    });

    return {
      sub: payload.sub as string, // Apple's unique user ID
      email: payload.email as string | undefined,
      emailVerified:
        payload.email_verified === true ||
        payload.email_verified === "true",
    };
  } catch (error) {
    console.error("Apple token verification failed:", error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { identityToken, fullName } = await request.json();

    if (!identityToken) {
      return NextResponse.json(
        { message: "Apple identity token is required" },
        { status: 400 }
      );
    }

    const appleUser = await verifyAppleToken(identityToken);
    if (!appleUser || !appleUser.sub) {
      return NextResponse.json(
        { message: "Invalid Apple sign-in token" },
        { status: 401 }
      );
    }

    // Look up by Apple provider account first, then fall back to email
    let user = null;

    // Check if we already have an account linked to this Apple ID
    const existingAccount = await prisma.account.findFirst({
      where: {
        provider: "apple",
        providerAccountId: appleUser.sub,
      },
      select: { userId: true },
    });

    if (existingAccount) {
      user = await prisma.user.findUnique({
        where: { id: existingAccount.userId },
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
    }

    // If no linked account, try to find by email
    if (!user && appleUser.email) {
      user = await prisma.user.findUnique({
        where: { email: appleUser.email.toLowerCase() },
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

      // Link Apple account to existing user
      if (user) {
        await prisma.account.create({
          data: {
            userId: user.id,
            type: "oauth",
            provider: "apple",
            providerAccountId: appleUser.sub,
          },
        });
      }
    }

    // Create new user if not found
    if (!user) {
      // Apple only sends name on first sign-in
      const givenName = fullName?.givenName || "";
      const familyName = fullName?.familyName || "";
      const displayName =
        [givenName, familyName].filter(Boolean).join(" ") || null;

      user = await prisma.user.create({
        data: {
          email: appleUser.email?.toLowerCase() || `apple-${appleUser.sub}@private.basktball.com`,
          name: displayName || null,
          emailVerified: appleUser.emailVerified ? new Date() : null,
          role: "USER",
          accounts: {
            create: {
              type: "oauth",
              provider: "apple",
              providerAccountId: appleUser.sub,
            },
          },
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
    console.error("Mobile Apple auth error:", error);
    return NextResponse.json(
      { message: "Apple sign-in failed. Please try again." },
      { status: 500 }
    );
  }
}
