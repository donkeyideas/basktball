import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { basketballApi } from "@/lib/api";
import { NormalizedGame } from "@/lib/api/types";
import { deepseek } from "@/lib/ai/deepseek";
import { sendBatchPushNotifications } from "@/lib/notifications/batch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Schedule: 0 * * * * (every hour — checks admin-configured ET times)

function getCurrentETHour(): number {
  const now = new Date();
  const etString = now.toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hour12: false,
  });
  return parseInt(etString, 10);
}

function formatTime(date: Date): string {
  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ── Fetch real data ─────────────────────────────────────────

async function fetchTodaysGames(): Promise<NormalizedGame[]> {
  const leagues = ["nba", "wnba", "ncaam", "ncaaw"] as const;
  const results = await Promise.allSettled(
    leagues.map((league) => basketballApi.getGames(league))
  );
  const all: NormalizedGame[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }
  return all;
}

interface NewsArticle {
  title: string;
  description?: string;
  source: string;
  league?: string;
}

async function fetchLatestNews(): Promise<NewsArticle[]> {
  try {
    const res = await fetch("https://www.basktball.com/api/news?limit=10", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.articles || [];
  } catch {
    return [];
  }
}

// ── Build message from real data ────────────────────────────

const LEAGUE_NAMES: Record<string, string> = {
  nba: "NBA",
  wnba: "WNBA",
  ncaam: "NCAA",
  ncaaw: "NCAAW",
};

/** Pick the primary league (most games, prefer NBA) */
function getPrimaryLeague(games: NormalizedGame[]): string {
  const counts: Record<string, number> = {};
  for (const g of games) {
    const l = g.league || "nba";
    counts[l] = (counts[l] || 0) + 1;
  }
  // Prefer NBA if it has games, otherwise pick the league with the most games
  if (counts["nba"] && counts["nba"] > 0) return "nba";
  let best = "nba";
  let bestCount = 0;
  for (const [league, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = league;
      bestCount = count;
    }
  }
  return best;
}

function buildGameDayMessage(games: NormalizedGame[]): { title: string; body: string } | null {
  if (games.length === 0) return null;

  // Focus on the primary league (NBA during NBA season)
  const primaryLeague = getPrimaryLeague(games);
  const leagueName = LEAGUE_NAMES[primaryLeague] || "NBA";
  const primaryGames = games.filter((g) => (g.league || "nba") === primaryLeague);

  const live = primaryGames.filter((g) => g.status === "live");
  const scheduled = primaryGames.filter((g) => g.status === "scheduled");
  const final_ = primaryGames.filter((g) => g.status === "final");

  // Detect playoffs
  const hasPlayoffs = primaryGames.some((g) => g.isPlayoffs);

  // ── Live games happening now ──
  if (live.length > 0) {
    const topGame = live[0];
    const score = `${topGame.awayTeam.abbreviation} ${topGame.awayScore} - ${topGame.homeScore} ${topGame.homeTeam.abbreviation}`;
    const extra = live.length > 1 ? ` and ${live.length - 1} more game${live.length > 2 ? "s" : ""}` : "";

    return {
      title: hasPlayoffs ? `${leagueName} Playoff Games LIVE Now` : `${leagueName} Games Are LIVE Right Now`,
      body: `${score}${topGame.quarter ? ` (${topGame.quarter}${topGame.clock ? ` ${topGame.clock}` : ""})` : ""}${extra}. Open BASKTBALL for live scores and stats.`,
    };
  }

  // ── Games coming up today ──
  if (scheduled.length > 0) {
    // Sort by game time
    const sorted = [...scheduled].sort(
      (a, b) => new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime()
    );
    const first = sorted[0];
    const firstTime = formatTime(new Date(first.gameDate));

    if (hasPlayoffs) {
      const matchups = sorted
        .slice(0, 3)
        .map((g) => `${g.awayTeam.abbreviation} @ ${g.homeTeam.abbreviation}`)
        .join(", ");
      return {
        title: `${scheduled.length} ${leagueName} Playoff Game${scheduled.length > 1 ? "s" : ""} Today`,
        body: `Catch ${matchups}${sorted.length > 3 ? ` and ${sorted.length - 3} more` : ""}. First tip at ${firstTime} ET.`,
      };
    }

    const matchups = sorted
      .slice(0, 4)
      .map((g) => `${g.awayTeam.abbreviation}@${g.homeTeam.abbreviation}`)
      .join(", ");
    return {
      title: `${scheduled.length} ${leagueName} Game${scheduled.length > 1 ? "s" : ""} Today`,
      body: `Catch ${matchups}${sorted.length > 4 ? ` and ${sorted.length - 4} more` : ""}. Tip-off starts at ${firstTime} ET.`,
    };
  }

  // ── All games finished today ──
  if (final_.length > 0) {
    // Find the closest / most interesting final
    const closeGames = final_.filter((g) => Math.abs(g.homeScore - g.awayScore) <= 5);
    const highlight = closeGames.length > 0 ? closeGames[0] : final_[0];
    const winner =
      highlight.homeScore > highlight.awayScore
        ? highlight.homeTeam
        : highlight.awayTeam;
    const score = `${highlight.awayTeam.abbreviation} ${highlight.awayScore} - ${highlight.homeScore} ${highlight.homeTeam.abbreviation}`;

    return {
      title: hasPlayoffs ? `${leagueName} Playoff Results Are In` : `Today's ${leagueName} Games Are Final`,
      body: `${winner.name} wins! ${score}${final_.length > 1 ? `. ${final_.length} total games wrapped up today` : ""}. Check box scores on BASKTBALL.`,
    };
  }

  return null;
}

function buildNewsMessage(articles: NewsArticle[]): { title: string; body: string } | null {
  if (articles.length === 0) return null;
  const article = articles[0];
  const desc = article.description || "";
  // Truncate body to fit push notification
  const body = desc.length > 120 ? desc.slice(0, 117) + "..." : desc;
  return {
    title: article.title.length > 60 ? article.title.slice(0, 57) + "..." : article.title,
    body: body || "Read the latest basketball news on BASKTBALL.",
  };
}

// App feature promotions (used occasionally when no games/news)
const FEATURE_MESSAGES = [
  { title: "Make Your Predictions", body: "Lock in your picks before tip-off. Head to BASKTBALL and put your basketball IQ to the test." },
  { title: "Challenge Your Friends", body: "Think you know hoops? Send a challenge on BASKTBALL and prove it. Bragging rights are on the line." },
  { title: "Drop a Hot Take", body: "Got a bold opinion? Post it on BASKTBALL and see if the community gives it a Fire or a Brick." },
  { title: "Check Advanced Stats", body: "Use the Tools section for advanced metrics, game predictions, draft analysis, and fantasy optimization." },
  { title: "Follow Live Games", body: "Real-time scores, box scores, and play-by-play. Open BASKTBALL to follow every game as it happens." },
];

// ── Use DeepSeek to polish message (not generate) ──────────

async function polishWithAI(
  rawTitle: string,
  rawBody: string,
  context: string
): Promise<{ title: string; body: string }> {
  try {
    const result = await deepseek.chat(
      [
        {
          role: "system",
          content: `You are a push notification copywriter for BASKTBALL, a basketball social app. You will be given a draft notification based on real basketball data. Your job is to make it punchier and more engaging while keeping ALL facts 100% accurate.

STRICT RULES:
- Title: 5-12 words max, catchy
- Body: 1-2 sentences, 20-50 words
- NEVER change the game count number — if it says "4 NBA Games", keep it as 4
- NEVER change or add league names — if it says "NBA", keep "NBA", don't change to "Basketball"
- NEVER change team abbreviations or matchups
- NEVER add team matchups that are not in the draft
- Keep every score, stat, and time exactly as provided
- Tone: energetic but factual
- Never use emojis or markdown
- Return ONLY valid JSON: {"title": "...", "body": "..."}`,
        },
        {
          role: "user",
          content: `Context: ${context}\n\nDraft title: ${rawTitle}\nDraft body: ${rawBody}\n\nPolish this notification. Keep all facts accurate.`,
        },
      ],
      { temperature: 0.3, maxTokens: 150 }
    );

    const parsed = JSON.parse(result.content.trim());
    if (parsed.title && parsed.body) {
      const polishedTitle = parsed.title.replace(/[*#_~`>-]{2,}/g, "").trim();
      const polishedBody = parsed.body.replace(/[*#_~`>-]{2,}/g, "").trim();

      // Validate: if the raw title had a number, make sure the AI didn't change it
      const rawNumberMatch = rawTitle.match(/^(\d+)\s/);
      const polishedNumberMatch = polishedTitle.match(/(\d+)/);
      if (rawNumberMatch && polishedNumberMatch && rawNumberMatch[1] !== polishedNumberMatch[1]) {
        console.warn(`[auto-broadcast] AI changed game count from ${rawNumberMatch[1]} to ${polishedNumberMatch[1]}, using raw message`);
        return { title: rawTitle, body: rawBody };
      }

      return { title: polishedTitle, body: polishedBody };
    }
  } catch {
    // AI polish failed — use raw message
  }
  return { title: rawTitle, body: rawBody };
}

// ── Main handler ────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if current ET hour matches configured schedule
    const scheduleSetting = await prisma.setting.findUnique({
      where: { key: "auto_broadcast_schedule" },
    });
    const scheduledHours: number[] = scheduleSetting?.value
      ? JSON.parse(scheduleSetting.value)
      : [12, 18];

    const currentETHour = getCurrentETHour();
    if (!scheduledHours.includes(currentETHour)) {
      return NextResponse.json({
        skipped: true,
        currentETHour,
        scheduledHours,
        message: `Not a scheduled hour (current: ${currentETHour} ET)`,
      });
    }

    // --- 1. Fetch real data ---
    const [games, news] = await Promise.all([fetchTodaysGames(), fetchLatestNews()]);

    // --- 2. Build message from real data ---
    let title = "";
    let body = "";
    let source = "unknown";

    // Priority: live games > scheduled games > final scores > news > feature promo
    const gameMsg = buildGameDayMessage(games);
    if (gameMsg) {
      const polished = await polishWithAI(gameMsg.title, gameMsg.body, "Today's basketball games");
      title = polished.title;
      body = polished.body;
      source = "games";
    } else {
      const newsMsg = buildNewsMessage(news);
      if (newsMsg) {
        title = newsMsg.title;
        body = newsMsg.body;
        source = "news";
      } else {
        // No games or news — use feature promo
        const promo = FEATURE_MESSAGES[Math.floor(Math.random() * FEATURE_MESSAGES.length)];
        title = promo.title;
        body = promo.body;
        source = "feature-promo";
      }
    }

    if (!title || !body) {
      return NextResponse.json({ skipped: true, message: "No content to broadcast" });
    }

    // --- 3. Check for duplicate (don't send same title twice in 6 hours) ---
    const recentDuplicate = await prisma.notificationLog.findFirst({
      where: {
        title,
        createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      },
    });
    if (recentDuplicate) {
      // Fall back to a feature promo instead
      const promo = FEATURE_MESSAGES[Math.floor(Math.random() * FEATURE_MESSAGES.length)];
      title = promo.title;
      body = promo.body;
      source = "feature-promo-dedup";
    }

    // --- 4. Create in-app notifications ---
    const users = await prisma.user.findMany({
      where: { isBot: false, status: "ACTIVE" },
      select: { id: true },
    });

    if (users.length === 0) {
      return NextResponse.json({ message: "No users found, skipping" });
    }

    const userIds = users.map((u) => u.id);

    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: "SYSTEM" as const,
        title,
        body,
        data: { targetAudience: "all", source: `auto-broadcast:${source}` },
      })),
    });

    // --- 5. Send push notifications ---
    const pushResult = await sendBatchPushNotifications(userIds, title, body, {
      type: "SYSTEM",
    });

    // Mark pushed
    if (pushResult.successCount > 0) {
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
            createdAt: { gte: new Date(Date.now() - 60000) },
          },
          data: { pushed: true },
        });
      }
    }

    // --- 6. Log the broadcast ---
    await prisma.notificationLog.create({
      data: {
        type: "SYSTEM",
        title,
        body,
        targetAudience: "all",
        totalRecipients: userIds.length,
        successCount: pushResult.successCount,
        failureCount: pushResult.failureCount,
        sentByUserId: null,
      },
    });

    console.log(
      `[auto-broadcast] Sent "${title}" (source: ${source}) to ${userIds.length} users (push: ${pushResult.successCount} ok, ${pushResult.failureCount} failed)`
    );

    return NextResponse.json({
      success: true,
      title,
      body,
      source,
      gamesFound: games.length,
      newsFound: news.length,
      usersNotified: userIds.length,
      pushDelivered: pushResult.successCount,
      pushFailed: pushResult.failureCount,
    });
  } catch (error) {
    console.error("[auto-broadcast] Failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
