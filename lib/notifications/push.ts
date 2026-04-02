import { prisma } from "@/lib/db/prisma";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: string;
  channelId?: string;
}

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
    const tokens = await prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true, platform: true },
    });

    if (tokens.length === 0) return { successCount: 0, failureCount: 0 };

    const messages: PushMessage[] = tokens.map((t) => ({
      to: t.token,
      title,
      body,
      data,
      sound: "default",
      // Android requires channelId to match the channel created on the client
      ...(t.platform === "android" ? { channelId: "default" } : {}),
    }));

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.error("Expo push HTTP error:", response.status, await response.text());
      return { successCount: 0, failureCount: messages.length };
    }

    const result = await response.json();
    let successCount = 0;
    let failureCount = 0;

    if (result.data && Array.isArray(result.data)) {
      for (let i = 0; i < result.data.length; i++) {
        const ticket = result.data[i];
        if (ticket.status === "ok") {
          successCount++;
        } else {
          failureCount++;
          const errorType = ticket.details?.error;
          if (errorType === "DeviceNotRegistered") {
            await prisma.deviceToken.delete({
              where: { token: messages[i].to },
            }).catch(() => {});
          }
          console.error(
            `Push ticket error [${errorType}]:`,
            ticket.message,
            "token:",
            messages[i].to
          );
        }
      }
    }

    return { successCount, failureCount };
  } catch (error) {
    console.error("Push notification error:", error);
    return { successCount: 0, failureCount: 0 };
  }
}
