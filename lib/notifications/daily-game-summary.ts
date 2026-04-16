import { prisma } from "@/lib/db/prisma";
import { sendBatchPushNotifications } from "./batch";

interface DailySummaryResult {
  totalGames: number;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  skipped?: boolean;
  reason?: string;
}

/**
 * Send ONE daily push notification to every active user summarizing all
 * basketball games scheduled for today (across all leagues).
 *
 * Replaces the previous per-game LIVE/FINAL notifications, which could spam
 * users with dozens of pushes per day. This is idempotent for a given date —
 * if it has already run today, it short-circuits.
 */
export async function sendDailyGameSummary(): Promise<DailySummaryResult> {
  // Today's date window in UTC. We treat "today" as the calendar day in UTC,
  // which roughly aligns with the cron schedule run time.
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  const dateKey = startOfDay.toISOString().slice(0, 10); // YYYY-MM-DD

  // Idempotency: if we already sent a summary today, skip.
  const existing = await prisma.notificationLog.findFirst({
    where: {
      type: "SYSTEM",
      data: { path: ["kind"], equals: "daily_game_summary" },
      createdAt: { gte: startOfDay, lte: endOfDay },
    },
    select: { id: true },
  });
  if (existing) {
    return {
      totalGames: 0,
      totalRecipients: 0,
      successCount: 0,
      failureCount: 0,
      skipped: true,
      reason: "Already sent today",
    };
  }

  // Pull every game scheduled for today, regardless of league or status.
  const games = await prisma.game.findMany({
    where: { gameDate: { gte: startOfDay, lte: endOfDay } },
    include: {
      homeTeam: { select: { abbreviation: true, name: true } },
      awayTeam: { select: { abbreviation: true, name: true } },
    },
    orderBy: { gameDate: "asc" },
  });

  if (games.length === 0) {
    return {
      totalGames: 0,
      totalRecipients: 0,
      successCount: 0,
      failureCount: 0,
      skipped: true,
      reason: "No games scheduled today",
    };
  }

  // Compose the message. Keep it short — push notification body limits.
  // Show up to the first 4 matchups inline, then "+N more" if there are extras.
  const matchups = games.map(
    (g) => `${g.awayTeam.abbreviation} @ ${g.homeTeam.abbreviation}`
  );
  const preview = matchups.slice(0, 4).join(", ");
  const extra = matchups.length > 4 ? ` +${matchups.length - 4} more` : "";

  const title = `${games.length} ${games.length === 1 ? "game" : "games"} today`;
  const body = `${preview}${extra}`;

  // Target every active human user. Users can manage opt-out at the device
  // level (notification settings); this is the firehose for game day.
  const users = await prisma.user.findMany({
    where: { isBot: false, status: "ACTIVE" },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);

  // Bulk write notification rows so they appear in-app as well.
  if (userIds.length > 0) {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: "SYSTEM" as const,
        title,
        body,
        data: { kind: "daily_game_summary", date: dateKey, gameCount: games.length },
      })),
    });
  }

  // Send a single batched push to every device with a token.
  const result =
    userIds.length > 0
      ? await sendBatchPushNotifications(userIds, title, body, {
          type: "DAILY_GAMES",
          kind: "daily_game_summary",
          date: dateKey,
        })
      : { totalRecipients: 0, successCount: 0, failureCount: 0 };

  // Mark in-app notifications as pushed for users that actually had a token.
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
          data: { path: ["kind"], equals: "daily_game_summary" },
          createdAt: { gte: startOfDay },
        },
        data: { pushed: true },
      });
    }
  }

  // Audit log so admin dashboard can render this run.
  await prisma.notificationLog.create({
    data: {
      type: "SYSTEM",
      title,
      body,
      data: { kind: "daily_game_summary", date: dateKey, gameCount: games.length },
      targetAudience: "all",
      totalRecipients: userIds.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
    },
  });

  return {
    totalGames: games.length,
    totalRecipients: userIds.length,
    successCount: result.successCount,
    failureCount: result.failureCount,
  };
}
