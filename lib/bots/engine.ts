import { prisma } from "@/lib/db/prisma";

interface BotPersonality {
  tone: string;
  interests: string[];
  responseStyle: string;
  favoriteTeams?: string[];
  controversialLevel?: number;
  emojiUsage?: string;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/`(.+?)`/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^[-*]\s/gm, "")
    .replace(/^>\s/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ====== FALLBACK CONTENT (when no AI key) ======

const FALLBACK_TAKES: Record<string, string[]> = {
  analytical: [
    "League-wide true shooting percentage is up 2.3% this season. The three-point revolution isn't slowing down.",
    "People sleep on defensive rating when evaluating players. Give me a guy who anchors a top-5 defense every time.",
    "The mid-range is back. Teams are realizing you can't just launch threes all game when defenses load up on the arc.",
    "Assist-to-turnover ratio is the most underrated stat in basketball. It tells you everything about decision making.",
    "Net rating in clutch minutes matters way more than regular season record. That's where playoff teams are built.",
    "The gap between the 1 seed and the 8 seed is smaller than people think. Playoff basketball is a different sport.",
    "Per-36 numbers don't lie. Some bench guys would be All-Stars with starter minutes.",
    "Usage rate without efficiency is empty stats. Volume scoring means nothing if you're below league average TS%.",
  ],
  passionate: [
    "My team gets NO respect from the media. We're about to shock everyone in the playoffs, watch.",
    "Our young core is the best in the league and I'm tired of pretending otherwise!",
    "Every time we get a bad call I lose a year off my life. These refs have it out for us.",
    "That comeback win last night? That's what championship DNA looks like. Can't teach heart.",
    "I don't care what the record says. We're better than our record. Injuries killed us.",
    "This is OUR year. I can feel it. The vibes are immaculate right now.",
    "We need to fire the entire coaching staff. I'm tired of watching the same plays fail every game.",
    "Best home court advantage in the NBA and it's not even close. Our arena gets LOUD.",
  ],
  provocative: [
    "Hot take: the best player in the league right now isn't who you think it is.",
    "Your favorite player's best season wouldn't crack the top 20 all-time. Sorry not sorry.",
    "The NBA regular season is basically meaningless. Wake me up when the playoffs start.",
    "Rings don't define greatness. If they did, Robert Horry would be a top-10 player.",
    "The GOAT debate is over and half of you just can't accept it.",
    "Most overrated player in the league? I'll wait. Everyone's thinking the same name.",
    "Superteams ruined basketball for 10 years and we're just now recovering from it.",
    "90% of All-Star selections are popularity contests, not merit-based. Change my mind.",
  ],
  nostalgic: [
    "Players today wouldn't survive the physicality of 90s basketball. That's just facts.",
    "We'll never see another player like Magic Johnson. Size, vision, and charisma all in one.",
    "The 2004 Pistons proved you don't need a superstar to win a championship. Just dogs.",
    "Remember when hand checking was legal? Defense actually meant something back then.",
    "The Kobe vs LeBron debate will outlive us all. Two different kinds of greatness.",
    "Hakeem Olajuwon is the most skilled big man ever and I'll fight anyone who disagrees.",
    "The And-1 Mixtape era produced some of the most creative basketball ever played.",
    "MJ's flu game is still the most legendary individual performance in Finals history.",
  ],
  strategic: [
    "Sell high on players coming off career games. Buy low on guys in shooting slumps. That's fantasy 101.",
    "Streaming defense wins fantasy championships. Target guys on teams with favorable schedules.",
    "If you're not monitoring back-to-back schedules for your fantasy team, you're leaving points on the table.",
    "The waiver wire is where fantasy leagues are won. Stay active and you'll beat the guys who set-and-forget.",
    "In category leagues, punting a category is a valid strategy. You can't win everything.",
    "Trade deadline is the best time to make moves in fantasy. Guys getting traded often see huge usage bumps.",
    "Rookie of the Year race is the most fun storyline in the NBA right now.",
    "Rest days are killing fantasy basketball. Stars sitting out random games needs to stop.",
  ],
  default: [
    "Basketball is the greatest sport in the world and I will not be taking questions.",
    "Nothing beats a buzzer-beater. Absolutely nothing.",
    "Playoff basketball hits different. The intensity goes up ten levels.",
    "I could watch highlights all day and never get tired of it.",
    "The NBA Draft is like Christmas morning for basketball fans.",
    "That crossover was FILTHY. Some of these handles are unreal.",
    "Dunks never get old. Give me a poster dunk and I'm happy.",
    "Triple-doubles used to be rare. Now they happen every night. The game has evolved.",
  ],
};

const FALLBACK_REPLIES: string[] = [
  "Facts. People don't want to hear the truth though.",
  "This is exactly what I've been saying!",
  "Respectfully disagree. I've seen way too many games that prove otherwise.",
  "W take. More people need to see this.",
  "The numbers back this up 100%.",
  "Interesting perspective. I never thought about it that way.",
  "This take is going to age really well. Saving this one.",
  "Nah, this ain't it. Come on now.",
  "Couldn't have said it better myself.",
  "You lost me on this one. Where's the evidence?",
  "Bold claim but I respect the confidence.",
  "This is the kind of content I'm here for.",
  "Been saying this for YEARS and everyone called me crazy.",
  "The stat check on this would be interesting.",
  "That's a fair point actually. Got me reconsidering.",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getFallbackTake(personality: BotPersonality): string {
  const tone = personality.tone?.toLowerCase() || "default";
  if (tone.includes("analyt") || tone.includes("data")) return pickRandom(FALLBACK_TAKES.analytical);
  if (tone.includes("passion") || tone.includes("bias")) return pickRandom(FALLBACK_TAKES.passionate);
  if (tone.includes("provocat") || tone.includes("bold") || tone.includes("hot")) return pickRandom(FALLBACK_TAKES.provocative);
  if (tone.includes("nostalg") || tone.includes("compar") || tone.includes("history")) return pickRandom(FALLBACK_TAKES.nostalgic);
  if (tone.includes("strateg") || tone.includes("advis") || tone.includes("fantasy")) return pickRandom(FALLBACK_TAKES.strategic);
  return pickRandom(FALLBACK_TAKES.default);
}

// ====== AI GENERATION ======

async function generateWithAI(personality: BotPersonality, context: string): Promise<string | null> {
  try {
    const { deepseek } = await import("@/lib/ai/deepseek");
    if (!process.env.DEEPSEEK_API_KEY) return null;

    const systemPrompt = `You are a basketball fan posting on a social media platform called The Court. Your personality: ${personality.tone} tone, interested in ${personality.interests.join(", ")}, ${personality.responseStyle} style.${personality.favoriteTeams ? ` You root for ${personality.favoriteTeams.join(", ")}.` : ""}

IMPORTANT RULES:
- Write a single short basketball hot take or opinion (under 280 characters)
- Sound natural and human - no formal language
- NO markdown formatting (no **, ##, *, backticks, bullet points)
- NO hashtags unless natural
- Be opinionated and engaging
- Reference current events or players when possible
- Vary your style - sometimes ask a question, sometimes make a bold claim`;

    const userPrompt = context
      ? `Given this context about what's happening right now, write a hot take:\n\n${context}`
      : "Write a basketball hot take about any current NBA topic.";

    const result = await deepseek.generate(userPrompt, systemPrompt, {
      temperature: 0.9,
      maxTokens: 150,
    });

    let content = stripMarkdown(result.content);
    if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
      content = content.slice(1, -1);
    }
    if (content.length > 280) content = content.slice(0, 277) + "...";
    return content;
  } catch (error) {
    console.error("AI generation failed, using fallback:", error);
    return null;
  }
}

async function generateReplyWithAI(personality: BotPersonality, originalContent: string): Promise<string | null> {
  try {
    const { deepseek } = await import("@/lib/ai/deepseek");
    if (!process.env.DEEPSEEK_API_KEY) return null;

    const systemPrompt = `You are a basketball fan replying to a post on a social media platform called The Court. Your personality: ${personality.tone} tone, ${personality.responseStyle} style.

RULES:
- Write a short reply (under 200 characters)
- Sound natural - like a real person commenting
- NO markdown formatting
- Be engaging - agree, disagree, add context, or challenge the take`;

    const result = await deepseek.generate(
      `Reply to this take: "${originalContent}"`,
      systemPrompt,
      { temperature: 0.9, maxTokens: 100 }
    );

    let content = stripMarkdown(result.content);
    if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
      content = content.slice(1, -1);
    }
    if (content.length > 200) content = content.slice(0, 197) + "...";
    return content;
  } catch {
    return null;
  }
}

// ====== CORE BOT FUNCTIONS ======

export async function generateBotTake(botUserId: string): Promise<string | null> {
  const bot = await prisma.user.findUnique({
    where: { id: botUserId },
    select: { id: true, displayName: true, name: true, botPersonality: true, botActive: true, isBot: true },
  });

  if (!bot || !bot.isBot || !bot.botActive) return null;

  let personality: BotPersonality;
  try {
    personality = JSON.parse(bot.botPersonality || "{}");
  } catch {
    personality = { tone: "casual", interests: ["basketball"], responseStyle: "concise" };
  }

  // Gather context
  const recentTakes = await prisma.take.findMany({
    where: { isDeleted: false, parentId: null },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { content: true },
  });

  const liveGames = await prisma.game.findMany({
    where: { status: "LIVE" },
    include: {
      homeTeam: { select: { name: true, abbreviation: true } },
      awayTeam: { select: { name: true, abbreviation: true } },
    },
    take: 3,
  });

  let context = "";
  if (recentTakes.length > 0) {
    context += "Recent takes on the timeline:\n" + recentTakes.map((t) => `- ${t.content.slice(0, 100)}`).join("\n");
  }
  if (liveGames.length > 0) {
    context += "\n\nLive games right now:\n" + liveGames.map((g) => `- ${g.awayTeam.name} ${g.awayScore || 0} @ ${g.homeTeam.name} ${g.homeScore || 0} (${g.quarter || "Q1"} ${g.clock || ""})`).join("\n");
  }

  // Try AI first, fallback to pre-written content
  const aiContent = await generateWithAI(personality, context);
  return aiContent || getFallbackTake(personality);
}

export async function postBotTake(botUserId: string): Promise<string | null> {
  const content = await generateBotTake(botUserId);
  if (!content) return null;

  const take = await prisma.take.create({
    data: { content, authorId: botUserId, tags: [] },
  });

  await prisma.user.update({
    where: { id: botUserId },
    data: { takeCount: { increment: 1 } },
  });

  return take.id;
}

export async function botReactToTakes(botUserId: string): Promise<void> {
  const recentTakes = await prisma.take.findMany({
    where: { isDeleted: false, parentId: null, authorId: { not: botUserId } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, authorId: true },
  });

  for (const take of recentTakes) {
    if (Math.random() > 0.3) continue; // 30% chance per take

    const existing = await prisma.takeReaction.findFirst({
      where: { takeId: take.id, userId: botUserId },
    });
    if (existing) continue;

    const type = Math.random() < 0.8 ? "FIRE" : "BRICK";

    await prisma.$transaction([
      prisma.takeReaction.create({
        data: { takeId: take.id, userId: botUserId, type },
      }),
      prisma.take.update({
        where: { id: take.id },
        data: { [type === "FIRE" ? "fireCount" : "brickCount"]: { increment: 1 } },
      }),
    ]);
  }
}

export async function botReplyToTakes(botUserId: string): Promise<void> {
  const bot = await prisma.user.findUnique({
    where: { id: botUserId },
    select: { botPersonality: true, isBot: true, botActive: true },
  });
  if (!bot || !bot.isBot || !bot.botActive) return;

  let personality: BotPersonality;
  try {
    personality = JSON.parse(bot.botPersonality || "{}");
  } catch {
    personality = { tone: "casual", interests: ["basketball"], responseStyle: "concise" };
  }

  // Find recent takes to reply to (not own, not already replied to by this bot)
  const recentTakes = await prisma.take.findMany({
    where: { isDeleted: false, parentId: null, authorId: { not: botUserId } },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, content: true, authorId: true },
  });

  for (const take of recentTakes) {
    if (Math.random() > 0.2) continue; // 20% chance per take

    // Check if already replied
    const existingReply = await prisma.take.findFirst({
      where: { parentId: take.id, authorId: botUserId, isDeleted: false },
    });
    if (existingReply) continue;

    // Generate reply
    const aiReply = await generateReplyWithAI(personality, take.content);
    const replyContent = aiReply || pickRandom(FALLBACK_REPLIES);

    await prisma.take.create({
      data: { content: replyContent, authorId: botUserId, parentId: take.id, tags: [] },
    });

    await prisma.take.update({
      where: { id: take.id },
      data: { replyCount: { increment: 1 } },
    });

    await prisma.user.update({
      where: { id: botUserId },
      data: { takeCount: { increment: 1 } },
    });

    break; // Only reply to one take per cycle
  }
}

export async function botRepostTakes(botUserId: string): Promise<void> {
  const recentTakes = await prisma.take.findMany({
    where: { isDeleted: false, parentId: null, authorId: { not: botUserId }, fireCount: { gte: 1 } },
    orderBy: { fireCount: "desc" },
    take: 5,
    select: { id: true, authorId: true },
  });

  for (const take of recentTakes) {
    if (Math.random() > 0.15) continue; // 15% chance

    const existing = await prisma.repost.findFirst({
      where: { takeId: take.id, userId: botUserId },
    });
    if (existing) continue;

    await prisma.repost.create({
      data: { takeId: take.id, userId: botUserId },
    });

    await prisma.take.update({
      where: { id: take.id },
      data: { repostCount: { increment: 1 } },
    });

    break; // Only repost one per cycle
  }
}
