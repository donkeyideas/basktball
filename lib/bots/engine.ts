import { prisma } from "@/lib/db/prisma";
import { getNbaTeam, getTeamFullName, type NbaTeamInfo } from "@/lib/bots/nba-teams";

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

// ====== LENGTH VARIATION ======

type LengthTier = "short" | "medium" | "long";

interface LengthConfig {
  tier: LengthTier;
  maxChars: number;
  maxTokens: number;
  promptHint: string;
}

function getRandomPostLength(): LengthConfig {
  const roll = Math.random();
  if (roll < 0.4) {
    return {
      tier: "short",
      maxChars: 280,
      maxTokens: 150,
      promptHint: "Write a single short basketball hot take or opinion (under 280 characters, 1-2 sentences max)",
    };
  } else if (roll < 0.75) {
    return {
      tier: "medium",
      maxChars: 800,
      maxTokens: 400,
      promptHint: "Write a basketball take or opinion (2-4 sentences, around 300-700 characters). Go into some detail - explain your reasoning or add context to your point",
    };
  } else {
    return {
      tier: "long",
      maxChars: 2000,
      maxTokens: 900,
      promptHint: "Write a longer, detailed basketball take or mini-rant (5-10 sentences, around 800-1800 characters). Really go in depth - break down your argument, reference specific stats or moments, compare players or eras, and make your case thoroughly. This is your chance to go OFF",
    };
  }
}

function getRandomReplyLength(): LengthConfig {
  const roll = Math.random();
  if (roll < 0.45) {
    return {
      tier: "short",
      maxChars: 200,
      maxTokens: 100,
      promptHint: "Write a short reply (under 200 characters, 1 sentence)",
    };
  } else if (roll < 0.8) {
    return {
      tier: "medium",
      maxChars: 600,
      maxTokens: 300,
      promptHint: "Write a reply (2-3 sentences, around 200-500 characters). Explain your agreement or disagreement with some reasoning",
    };
  } else {
    return {
      tier: "long",
      maxChars: 1500,
      maxTokens: 600,
      promptHint: "Write a detailed reply (4-6 sentences, around 500-1200 characters). Really engage with the take - break down why you agree or disagree, add your own perspective, reference specific examples or stats",
    };
  }
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

// ====== AI GENERATION (Google Gemini) ======

async function fetchRecentNewsHeadlines(): Promise<string[]> {
  try {
    const res = await fetch("https://www.espn.com/espn/rss/nba/news", { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const xml = await res.text();
      const titles: string[] = [];
      // Try CDATA-wrapped titles first
      const cdataMatches = xml.matchAll(/<title><!\[CDATA\[(.+?)\]\]><\/title>/g);
      for (const match of cdataMatches) {
        if (titles.length >= 8) break;
        const title = match[1].trim();
        if (title && title !== "NBA" && !title.includes("ESPN")) {
          titles.push(title);
        }
      }
      // Fallback to plain title tags
      if (titles.length < 3) {
        const plainMatches = xml.matchAll(/<title>([^<]+)<\/title>/g);
        for (const match of plainMatches) {
          if (titles.length >= 8) break;
          const title = match[1].trim();
          if (title && title !== "NBA" && !title.includes("ESPN") && !titles.includes(title)) {
            titles.push(title);
          }
        }
      }
      return titles;
    }
  } catch {
    // Context is optional - silently fail
  }
  return [];
}

function buildTakePrompt(personality: BotPersonality, context: string, newsContext: string, favoriteTeam?: NbaTeamInfo | null): { systemPrompt: string; userPrompt: string; lengthConfig: LengthConfig } {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const lengthConfig = getRandomPostLength();

  // 90% of the time, focus on the bot's favorite team
  const shouldFocusTeam = favoriteTeam && Math.random() < 0.9;
  const teamName = favoriteTeam ? getTeamFullName(favoriteTeam) : "";
  const teamDirective = shouldFocusTeam
    ? `\n- You are a DIE-HARD ${teamName} fan. This take MUST be about the ${teamName} (${favoriteTeam!.abbreviation}) and their CURRENT ${new Date().getFullYear()} season. Talk about their current roster, recent wins or losses, their playoff chances this year, specific players on the team RIGHT NOW, coaching decisions, trades, or matchups happening THIS season. You live and breathe this team.`
    : favoriteTeam
      ? `\n- You are a ${teamName} fan but this time talk about the broader NBA landscape, other teams, or league-wide topics. You can still mention the ${teamName} in passing.`
      : "";

  const systemPrompt = `You are a basketball fan posting on a social media platform called The Court. Your personality: ${personality.tone} tone, interested in ${personality.interests.join(", ")}, ${personality.responseStyle} style.${favoriteTeam ? ` You are a ${getTeamFullName(favoriteTeam)} fan.` : ""}

Today's date is ${today}.

IMPORTANT RULES:
- ${lengthConfig.promptHint}
- Sound natural and human - no formal language
- NO markdown formatting (no **, ##, *, backticks, bullet points)
- NO hashtags unless natural
- Be opinionated and engaging
- You MUST reference current events, recent games, or recent news from the current NBA season
- DO NOT write generic basketball opinions - be specific about players, teams, and recent happenings
- NEVER repeat or paraphrase something already posted on the timeline (listed below)
- Your take must be UNIQUE and ORIGINAL - not something anyone else has said
- Vary your style - sometimes ask a question, sometimes make a bold claim, sometimes a hot prediction
- Reference specific player names, game scores, stats, or dates when possible${teamDirective}`;

  const userPrompt = `Given this context about what's happening in basketball RIGHT NOW, write a fresh, timely hot take:\n\n${context}${newsContext}`;

  return { systemPrompt, userPrompt, lengthConfig };
}

function cleanAIContent(raw: string, maxChars: number): string {
  let content = stripMarkdown(raw);
  if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
    content = content.slice(1, -1);
  }
  if (content.length > maxChars) content = content.slice(0, maxChars - 3) + "...";
  return content;
}

async function generateWithAI(personality: BotPersonality, context: string, favoriteTeam?: NbaTeamInfo | null): Promise<string | null> {
  // Fetch current news headlines for up-to-date context
  const newsHeadlines = await fetchRecentNewsHeadlines();
  let newsContext = "";
  if (newsHeadlines.length > 0) {
    newsContext = "\n\nCurrent basketball news headlines from this week:\n" + newsHeadlines.map((h) => `- ${h}`).join("\n");
  }

  const { systemPrompt, userPrompt, lengthConfig } = buildTakePrompt(personality, context, newsContext, favoriteTeam);

  // Try Gemini first
  if (process.env.GEMINI_API_KEY) {
    try {
      const { gemini } = await import("@/lib/ai/gemini");
      const result = await gemini.generate(userPrompt, systemPrompt, {
        temperature: 0.9,
        maxTokens: lengthConfig.maxTokens,
      });
      const content = cleanAIContent(result.content, lengthConfig.maxChars);
      if (content.length > 10) {
        console.log(`[BOT] Gemini generated take (${lengthConfig.tier}, ${content.length} chars): "${content.slice(0, 80)}..."`);
        return content;
      }
    } catch (error) {
      console.error("[BOT] Gemini failed:", error instanceof Error ? error.message : error);
    }
  }

  // Fallback to DeepSeek
  if (process.env.DEEPSEEK_API_KEY) {
    try {
      const { deepseek } = await import("@/lib/ai/deepseek");
      const result = await deepseek.generate(userPrompt, systemPrompt, {
        temperature: 0.9,
        maxTokens: lengthConfig.maxTokens,
      });
      const content = cleanAIContent(result.content, lengthConfig.maxChars);
      if (content.length > 10) {
        console.log(`[BOT] DeepSeek generated take (${lengthConfig.tier}, ${content.length} chars): "${content.slice(0, 80)}..."`);
        return content;
      }
    } catch (error) {
      console.error("[BOT] DeepSeek failed:", error instanceof Error ? error.message : error);
    }
  }

  console.error("[BOT] All AI providers failed. GEMINI_API_KEY set:", !!process.env.GEMINI_API_KEY, "DEEPSEEK_API_KEY set:", !!process.env.DEEPSEEK_API_KEY);
  return null;
}

async function generateReplyWithAI(personality: BotPersonality, originalContent: string, favoriteTeam?: NbaTeamInfo | null): Promise<string | null> {
  const lengthConfig = getRandomReplyLength();
  const teamContext = favoriteTeam ? ` You are a ${getTeamFullName(favoriteTeam)} fan, and your perspective is colored by that loyalty.` : "";

  const systemPrompt = `You are a basketball fan replying to a post on a social media platform called The Court. Your personality: ${personality.tone} tone, ${personality.responseStyle} style.${teamContext}

RULES:
- ${lengthConfig.promptHint}
- Sound natural - like a real person commenting
- NO markdown formatting
- Be engaging - agree, disagree, add context, or challenge the take`;

  const userPrompt = `Reply to this take: "${originalContent}"`;

  // Try Gemini first
  if (process.env.GEMINI_API_KEY) {
    try {
      const { gemini } = await import("@/lib/ai/gemini");
      const result = await gemini.generate(userPrompt, systemPrompt, {
        temperature: 0.9,
        maxTokens: lengthConfig.maxTokens,
      });
      const content = cleanAIContent(result.content, lengthConfig.maxChars);
      if (content.length > 5) return content;
    } catch {
      // Fall through to DeepSeek
    }
  }

  // Fallback to DeepSeek
  if (process.env.DEEPSEEK_API_KEY) {
    try {
      const { deepseek } = await import("@/lib/ai/deepseek");
      const result = await deepseek.generate(userPrompt, systemPrompt, {
        temperature: 0.9,
        maxTokens: lengthConfig.maxTokens,
      });
      const content = cleanAIContent(result.content, lengthConfig.maxChars);
      if (content.length > 5) return content;
    } catch {
      // Both failed
    }
  }

  return null;
}

// ====== CORE BOT FUNCTIONS ======

export async function generateBotTake(botUserId: string): Promise<string | null> {
  const bot = await prisma.user.findUnique({
    where: { id: botUserId },
    select: {
      id: true, displayName: true, name: true, botPersonality: true, botActive: true, isBot: true,
      favoriteTeamId: true,
    },
  });

  if (!bot || !bot.isBot || !bot.botActive) return null;

  let personality: BotPersonality;
  try {
    personality = JSON.parse(bot.botPersonality || "{}");
  } catch {
    personality = { tone: "casual", interests: ["basketball"], responseStyle: "concise" };
  }

  // Gather context - recent takes (from others AND this bot) to avoid duplicates
  const recentTakes = await prisma.take.findMany({
    where: { isDeleted: false, parentId: null, authorId: { not: botUserId } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { content: true },
  });

  // Fetch this bot's own recent takes to prevent duplicates
  const ownRecentTakes = await prisma.take.findMany({
    where: { isDeleted: false, parentId: null, authorId: botUserId },
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

  // Also get recent completed games from the past 2 days for context
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const recentGames = await prisma.game.findMany({
    where: { status: "FINAL", gameDate: { gte: twoDaysAgo } },
    include: {
      homeTeam: { select: { name: true, abbreviation: true } },
      awayTeam: { select: { name: true, abbreviation: true } },
    },
    orderBy: { gameDate: "desc" },
    take: 5,
  });

  let context = "";
  if (recentTakes.length > 0) {
    context += "Recent takes on the timeline (DO NOT repeat or paraphrase any of these):\n" + recentTakes.map((t) => `- ${t.content.slice(0, 150)}`).join("\n");
  }
  if (ownRecentTakes.length > 0) {
    context += "\n\nYour own previous takes (you MUST NOT repeat or rephrase these - say something completely NEW and DIFFERENT):\n" + ownRecentTakes.map((t) => `- ${t.content.slice(0, 150)}`).join("\n");
  }
  if (liveGames.length > 0) {
    context += "\n\nLive games right now:\n" + liveGames.map((g) => `- ${g.awayTeam.name} ${g.awayScore || 0} @ ${g.homeTeam.name} ${g.homeScore || 0} (${g.quarter || "Q1"} ${g.clock || ""})`).join("\n");
  }
  if (recentGames.length > 0) {
    context += "\n\nRecent game results:\n" + recentGames.map((g) => `- ${g.awayTeam.name} ${g.awayScore || 0} @ ${g.homeTeam.name} ${g.homeScore || 0} (FINAL)`).join("\n");
  }

  // Look up bot's favorite team from hardcoded NBA teams
  const favoriteTeam = bot.favoriteTeamId ? getNbaTeam(bot.favoriteTeamId) || null : null;

  // Try AI generation (up to 2 attempts)
  const aiContent = await generateWithAI(personality, context, favoriteTeam);
  if (aiContent) return aiContent;

  // First attempt failed, retry once
  console.log(`[BOT] AI generation failed for bot ${botUserId}, retrying...`);
  const retry = await generateWithAI(personality, context, favoriteTeam);
  if (retry) return retry;

  // AI completely failed - use fallback but NEVER post a duplicate
  console.log(`[BOT] AI retry failed for bot ${botUserId}, trying fallback...`);
  return null; // Let postBotTake handle the fallback with DB-level dedup
}

export async function postBotTake(botUserId: string): Promise<string | null> {
  let content = await generateBotTake(botUserId);

  // If AI failed, try fallback content
  if (!content) {
    const bot = await prisma.user.findUnique({
      where: { id: botUserId },
      select: { botPersonality: true },
    });
    let personality: BotPersonality;
    try {
      personality = JSON.parse(bot?.botPersonality || "{}");
    } catch {
      personality = { tone: "casual", interests: ["basketball"], responseStyle: "concise" };
    }

    // Try all fallbacks from this personality, then all categories
    const allFallbacks = [
      ...(() => {
        const tone = personality.tone?.toLowerCase() || "";
        if (tone.includes("analyt") || tone.includes("data")) return FALLBACK_TAKES.analytical;
        if (tone.includes("passion") || tone.includes("bias")) return FALLBACK_TAKES.passionate;
        if (tone.includes("provocat") || tone.includes("bold")) return FALLBACK_TAKES.provocative;
        if (tone.includes("nostalg") || tone.includes("compar")) return FALLBACK_TAKES.nostalgic;
        if (tone.includes("strateg") || tone.includes("advis")) return FALLBACK_TAKES.strategic;
        return FALLBACK_TAKES.default;
      })(),
      ...Object.values(FALLBACK_TAKES).flat(),
    ];

    // Shuffle so we don't always try in the same order
    for (let i = allFallbacks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allFallbacks[i], allFallbacks[j]] = [allFallbacks[j], allFallbacks[i]];
    }

    // Find one that doesn't exist anywhere in the DB
    for (const candidate of allFallbacks) {
      const exists = await prisma.take.findFirst({
        where: { content: candidate, isDeleted: false },
        select: { id: true },
      });
      if (!exists) {
        content = candidate;
        break;
      }
    }
  }

  if (!content) {
    console.log(`[BOT] No unique content available for bot ${botUserId}, skipping post`);
    return null;
  }

  // HARD duplicate check: never post content that already exists ANYWHERE in DB
  const duplicate = await prisma.take.findFirst({
    where: { content, isDeleted: false },
    select: { id: true },
  });
  if (duplicate) {
    console.log(`[BOT] Duplicate content detected for bot ${botUserId}, skipping post`);
    return null;
  }

  const take = await prisma.take.create({
    data: { content, authorId: botUserId, tags: [] },
  });

  await prisma.user.update({
    where: { id: botUserId },
    data: { takeCount: { increment: 1 } },
  });

  console.log(`[BOT] Posted take ${take.id} for bot ${botUserId} (${content.length} chars)`);
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
    select: { botPersonality: true, isBot: true, botActive: true, favoriteTeamId: true },
  });
  if (!bot || !bot.isBot || !bot.botActive) return;

  let personality: BotPersonality;
  try {
    personality = JSON.parse(bot.botPersonality || "{}");
  } catch {
    personality = { tone: "casual", interests: ["basketball"], responseStyle: "concise" };
  }

  // Look up favorite team from hardcoded NBA teams
  const favoriteTeam = bot.favoriteTeamId ? getNbaTeam(bot.favoriteTeamId) || null : null;

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
    const aiReply = await generateReplyWithAI(personality, take.content, favoriteTeam);
    let replyContent = aiReply;

    // If AI failed, find a fallback reply not already used on this take
    if (!replyContent) {
      const existingReplies = await prisma.take.findMany({
        where: { parentId: take.id, isDeleted: false },
        select: { content: true },
      });
      const usedContents = new Set(existingReplies.map((r) => r.content.toLowerCase().trim()));
      const unusedReply = FALLBACK_REPLIES.find((f) => !usedContents.has(f.toLowerCase().trim()));
      if (!unusedReply) continue; // All fallback replies already used on this take, skip
      replyContent = unusedReply;
    }

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
