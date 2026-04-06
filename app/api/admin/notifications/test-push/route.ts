import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getMessagingInstance } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

// POST /api/admin/notifications/test-push — Diagnostic test push
export async function POST() {
  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "EDITOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const diagnostics: Record<string, unknown> = {};

    // 1. Check FIREBASE_SERVICE_ACCOUNT env var
    const envVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!envVar) {
      diagnostics.firebaseEnvVar = "MISSING";
    } else {
      diagnostics.firebaseEnvVar = "PRESENT";
      diagnostics.firebaseEnvVarLength = envVar.length;
      try {
        const parsed = JSON.parse(envVar);
        diagnostics.firebaseProjectId = parsed.project_id || "MISSING_PROJECT_ID";
        diagnostics.firebaseClientEmail = parsed.client_email || "MISSING_CLIENT_EMAIL";
        diagnostics.firebasePrivateKeyPresent = !!parsed.private_key;
        diagnostics.firebasePrivateKeyLength = parsed.private_key?.length || 0;
        diagnostics.firebasePrivateKeyStartsWith = parsed.private_key?.substring(0, 30) || "N/A";
      } catch (e) {
        diagnostics.firebaseEnvVarParseError = (e as Error).message;
      }
    }

    // 2. Check Firebase Admin SDK initialization
    try {
      const messaging = await getMessagingInstance();
      diagnostics.messagingInstance = messaging ? "OK" : "NULL (init failed)";
    } catch (e) {
      diagnostics.messagingInstance = `ERROR: ${(e as Error).message}`;
    }

    // 3. Check DeviceToken table
    const allTokens = await prisma.deviceToken.findMany({
      select: {
        id: true,
        userId: true,
        token: true,
        platform: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    diagnostics.totalDeviceTokens = allTokens.length;
    diagnostics.tokensByPlatform = {
      android: allTokens.filter((t) => t.platform === "android").length,
      ios: allTokens.filter((t) => t.platform === "ios").length,
      web: allTokens.filter((t) => t.platform === "web").length,
      other: allTokens.filter((t) => !["android", "ios", "web"].includes(t.platform)).length,
    };
    diagnostics.tokens = allTokens.map((t) => ({
      id: t.id,
      userId: t.userId,
      platform: t.platform,
      tokenPrefix: t.token.substring(0, 20) + "...",
      tokenLength: t.token.length,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    // 4. Try sending a test push to ALL tokens
    if (allTokens.length > 0) {
      const messaging = await getMessagingInstance();
      if (messaging) {
        const testTime = new Date().toLocaleTimeString();
        const sendResults: Array<{ tokenId: string; platform: string; success: boolean; error?: string }> = [];

        for (const t of allTokens) {
          try {
            await messaging.send({
              token: t.token,
              notification: {
                title: "Test Push — Basktball",
                body: `Diagnostic test at ${testTime}`,
              },
              data: { type: "TEST" },
              android: {
                priority: "high",
                notification: { channelId: "default", sound: "default" },
              },
              apns: {
                payload: {
                  aps: { alert: { title: "Test Push — Basktball", body: `Diagnostic test at ${testTime}` }, sound: "default" },
                },
              },
            });
            sendResults.push({ tokenId: t.id, platform: t.platform, success: true });
          } catch (e) {
            const err = e as { code?: string; message?: string };
            sendResults.push({
              tokenId: t.id,
              platform: t.platform,
              success: false,
              error: `${err.code || "UNKNOWN"}: ${err.message || "No message"}`,
            });
          }
        }

        diagnostics.sendResults = sendResults;
        diagnostics.sendSummary = {
          total: sendResults.length,
          success: sendResults.filter((r) => r.success).length,
          failed: sendResults.filter((r) => !r.success).length,
        };
      } else {
        diagnostics.sendResults = "SKIPPED — messaging instance is null";
      }
    } else {
      diagnostics.sendResults = "SKIPPED — no tokens in database";
    }

    // 5. Count active users (for context)
    const activeUsers = await prisma.user.count({ where: { status: "ACTIVE", isBot: false } });
    diagnostics.activeNonBotUsers = activeUsers;

    return NextResponse.json({ success: true, diagnostics });
  } catch (error) {
    console.error("Test push error:", error);
    return NextResponse.json(
      { error: (error as Error).message, stack: (error as Error).stack },
      { status: 500 }
    );
  }
}

// GET — quick diagnostics without sending
export async function GET() {
  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "EDITOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const envVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    const tokenCount = await prisma.deviceToken.count();
    const tokens = await prisma.deviceToken.findMany({
      select: { id: true, userId: true, platform: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    let messagingOk = false;
    try {
      const m = await getMessagingInstance();
      messagingOk = !!m;
    } catch {}

    return NextResponse.json({
      firebaseConfigured: !!envVar,
      messagingInitialized: messagingOk,
      deviceTokenCount: tokenCount,
      recentTokens: tokens,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
