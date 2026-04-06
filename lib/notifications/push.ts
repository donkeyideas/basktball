import { prisma } from "@/lib/db/prisma";
import { getMessagingInstance } from "@/lib/firebase/admin";

interface PushResult {
  successCount: number;
  failureCount: number;
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<PushResult> {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.error("FCM not configured — skipping push");
      return { successCount: 0, failureCount: 0 };
    }

    const tokens = await prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true, platform: true },
    });

    if (tokens.length === 0) return { successCount: 0, failureCount: 0 };

    // FCM data values must all be strings
    const dataPayload: Record<string, string> = {};
    if (data) {
      for (const [k, v] of Object.entries(data)) {
        if (v != null) dataPayload[k] = String(v);
      }
    }

    let successCount = 0;
    let failureCount = 0;

    for (const t of tokens) {
      try {
        await messaging.send({
          token: t.token,
          notification: { title, body },
          data: dataPayload,
          android: {
            priority: "high",
            notification: { channelId: "default", sound: "default" },
          },
          apns: {
            payload: {
              aps: {
                alert: { title, body },
                sound: "default",
              },
            },
          },
        });
        successCount++;
      } catch (error: unknown) {
        failureCount++;
        const err = error as { code?: string; message?: string };

        // Clean up invalid tokens
        if (
          err.code === "messaging/invalid-registration-token" ||
          err.code === "messaging/registration-token-not-registered"
        ) {
          await prisma.deviceToken
            .delete({ where: { token: t.token } })
            .catch(() => {});
        }

        console.error(`FCM push error [${err.code}]:`, err.message, "token:", t.token);
      }
    }

    return { successCount, failureCount };
  } catch (error) {
    console.error("Push notification error:", error);
    return { successCount: 0, failureCount: 0 };
  }
}
