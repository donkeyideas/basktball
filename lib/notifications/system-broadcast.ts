import { prisma } from "@/lib/db/prisma";
import { sendBatchPushNotifications } from "./batch";

interface BroadcastParams {
  title: string;
  body: string;
  targetAudience?: string; // "all" | "team:<teamId>" | "role:<ROLE>"
  sentByUserId: string;
  data?: Record<string, string>;
}

export async function sendSystemBroadcast(params: BroadcastParams) {
  const { title, body, targetAudience = "all", sentByUserId, data } = params;

  // Build user query based on target audience
  const where: Record<string, unknown> = {
    isBot: false,
    status: "ACTIVE",
  };

  if (targetAudience.startsWith("team:")) {
    const teamId = targetAudience.slice(5);
    where.favoriteTeams = { has: teamId };
  } else if (targetAudience.startsWith("role:")) {
    const role = targetAudience.slice(5);
    where.role = role;
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  const userIds = users.map((u) => u.id);

  // Create notification records
  if (userIds.length > 0) {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: "SYSTEM" as const,
        title,
        body,
        data: { ...data, targetAudience },
      })),
    });
  }

  // Send push notifications
  const result =
    userIds.length > 0
      ? await sendBatchPushNotifications(userIds, title, body, {
          type: "SYSTEM",
          ...data,
        })
      : { totalRecipients: 0, successCount: 0, failureCount: 0 };

  // Mark pushed notifications
  if (result.successCount > 0) {
    const usersWithTokens = await prisma.deviceToken.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true },
      distinct: ["userId"],
    });
    if (usersWithTokens.length > 0) {
      await prisma.notification.updateMany({
        where: {
          userId: { in: usersWithTokens.map((u) => u.userId) },
          type: "SYSTEM",
          createdAt: { gte: new Date(Date.now() - 60000) }, // Last 60 seconds
        },
        data: { pushed: true },
      });
    }
  }

  // Log the broadcast
  const log = await prisma.notificationLog.create({
    data: {
      type: "SYSTEM",
      title,
      body,
      data: data || undefined,
      targetAudience,
      totalRecipients: userIds.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
      sentByUserId,
    },
  });

  return {
    logId: log.id,
    totalRecipients: userIds.length,
    successCount: result.successCount,
    failureCount: result.failureCount,
  };
}
