import { prisma } from "@/lib/db/prisma";
import { getMessagingInstance } from "@/lib/firebase/admin";

interface BatchPushResult {
  totalRecipients: number;
  successCount: number;
  failureCount: number;
}

export async function sendBatchPushNotifications(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<BatchPushResult> {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.error("FCM not configured — skipping batch push");
      return { totalRecipients: userIds.length, successCount: 0, failureCount: 0 };
    }

    const tokens = await prisma.deviceToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true },
    });

    if (tokens.length === 0) {
      return { totalRecipients: userIds.length, successCount: 0, failureCount: 0 };
    }

    // FCM data values must all be strings
    const dataPayload: Record<string, string> = {};
    if (data) {
      for (const [k, v] of Object.entries(data)) {
        if (v != null) dataPayload[k] = String(v);
      }
    }

    const tokenStrings = tokens.map((t) => t.token);

    // FCM sendEachForMulticast supports up to 500 tokens per batch
    const batchSize = 500;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < tokenStrings.length; i += batchSize) {
      const batch = tokenStrings.slice(i, i + batchSize);

      try {
        const response = await messaging.sendEachForMulticast({
          tokens: batch,
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

        successCount += response.successCount;
        failureCount += response.failureCount;

        // Clean up invalid tokens
        response.responses.forEach((resp, index) => {
          if (!resp.success && resp.error) {
            const code = resp.error.code;
            if (
              code === "messaging/invalid-registration-token" ||
              code === "messaging/registration-token-not-registered"
            ) {
              prisma.deviceToken
                .delete({ where: { token: batch[index] } })
                .catch(() => {});
            }
          }
        });
      } catch (error) {
        console.error("FCM batch send error:", error);
        failureCount += batch.length;
      }
    }

    return { totalRecipients: userIds.length, successCount, failureCount };
  } catch (error) {
    console.error("Batch push notification error:", error);
    return { totalRecipients: userIds.length, successCount: 0, failureCount: 0 };
  }
}
