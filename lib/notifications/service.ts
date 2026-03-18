import { prisma } from "@/lib/db/prisma";
import { NotificationType } from "@prisma/client";
import { sendPushNotification } from "./push";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, string>;
  actorId?: string; // The user who triggered the action
}

export async function createNotification({
  userId,
  type,
  title,
  body,
  data,
  actorId,
}: CreateNotificationParams): Promise<void> {
  try {
    // Never notify yourself
    if (actorId && actorId === userId) return;

    // Never notify bot users
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isBot: true },
    });
    if (targetUser?.isBot) return;

    // Create the notification record
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: data || undefined,
      },
    });

    // Send push notification (fire-and-forget)
    sendPushNotification(userId, title, body || title, {
      notificationId: notification.id,
      type,
      ...data,
    }).then(() => {
      prisma.notification.update({
        where: { id: notification.id },
        data: { pushed: true },
      }).catch(() => {});
    }).catch(() => {});
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
