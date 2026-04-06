import { prisma } from "@/lib/db/prisma";
import { sendBatchPushNotifications } from "./batch";

interface GameTransitionData {
  gameId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number | null;
  awayScore?: number | null;
  league: string;
}

async function getInterestedUserIds(homeTeamId: string, awayTeamId: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      isBot: false,
      status: "ACTIVE",
      OR: [
        { favoriteTeams: { has: homeTeamId } },
        { favoriteTeams: { has: awayTeamId } },
      ],
    },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

export async function notifyGameLive(game: GameTransitionData): Promise<void> {
  try {
    // Dedup check
    const existing = await prisma.gameNotificationLog.findUnique({
      where: { gameId_status: { gameId: game.gameId, status: "LIVE" } },
    });
    if (existing) return;

    const userIds = await getInterestedUserIds(game.homeTeamId, game.awayTeamId);

    // Always log, even with zero recipients
    await prisma.gameNotificationLog.create({
      data: { gameId: game.gameId, status: "LIVE", userCount: userIds.length },
    });

    if (userIds.length === 0) return;

    const title = "Game Starting!";
    const body = `${game.awayTeamName} @ ${game.homeTeamName} is now live!`;
    const data = { gameId: game.gameId, league: game.league };

    // Bulk create notification records
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: "GAME_LIVE" as const,
        title,
        body,
        data,
      })),
    });

    // Send push notifications
    const result = await sendBatchPushNotifications(userIds, title, body, {
      type: "GAME_LIVE",
      gameId: game.gameId,
    });

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
            type: "GAME_LIVE",
            data: { path: ["gameId"], equals: game.gameId },
          },
          data: { pushed: true },
        });
      }
    }
  } catch (error) {
    console.error("Failed to send GAME_LIVE notifications:", error);
  }
}

export async function notifyGameFinal(game: GameTransitionData): Promise<void> {
  try {
    // Dedup check
    const existing = await prisma.gameNotificationLog.findUnique({
      where: { gameId_status: { gameId: game.gameId, status: "FINAL" } },
    });
    if (existing) return;

    const userIds = await getInterestedUserIds(game.homeTeamId, game.awayTeamId);

    await prisma.gameNotificationLog.create({
      data: { gameId: game.gameId, status: "FINAL", userCount: userIds.length },
    });

    if (userIds.length === 0) return;

    const title = "Final Score";
    const body = `${game.awayTeamName} ${game.awayScore ?? 0} - ${game.homeTeamName} ${game.homeScore ?? 0}`;
    const data = {
      gameId: game.gameId,
      league: game.league,
      homeScore: String(game.homeScore ?? 0),
      awayScore: String(game.awayScore ?? 0),
    };

    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: "GAME_FINAL" as const,
        title,
        body,
        data,
      })),
    });

    const result = await sendBatchPushNotifications(userIds, title, body, {
      type: "GAME_FINAL",
      gameId: game.gameId,
    });

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
            type: "GAME_FINAL",
            data: { path: ["gameId"], equals: game.gameId },
          },
          data: { pushed: true },
        });
      }
    }
  } catch (error) {
    console.error("Failed to send GAME_FINAL notifications:", error);
  }
}
