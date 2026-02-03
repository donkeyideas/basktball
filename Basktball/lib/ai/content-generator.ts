// AI Content Generator
// Generates basketball content using DeepSeek API

import { deepseek, DeepSeekOptions } from "./deepseek";
import {
  SYSTEM_PROMPTS,
  PROMPT_TEMPLATES,
  TOKEN_LIMITS,
  TEMPERATURE_SETTINGS,
} from "./prompts";
import { prisma } from "@/lib/db/prisma";

export type ContentType =
  | "GAME_RECAP"
  | "PLAYER_ANALYSIS"
  | "BETTING"
  | "FANTASY"
  | "TRENDING";

interface GeneratedContent {
  content: string;
  summary?: string;
  tokenUsage: number;
  tokensUsed: number; // Alias for tokenUsage
  confidence: number;
  metadata?: Record<string, unknown>;
}

interface ContentValidation {
  isValid: boolean;
  confidence: number;
  issues: string[];
}

// Validate generated content quality
function validateContent(content: string, type: ContentType): ContentValidation {
  const issues: string[] = [];
  let confidence = 1.0;

  // Check minimum length
  const minLength = type === "GAME_RECAP" ? 200 : 150;
  if (content.length < minLength) {
    issues.push("Content too short");
    confidence -= 0.2;
  }

  // Check for placeholder text
  const placeholders = ["[", "]", "{", "}", "INSERT", "TBD", "N/A"];
  for (const placeholder of placeholders) {
    if (content.includes(placeholder)) {
      issues.push(`Contains placeholder: ${placeholder}`);
      confidence -= 0.1;
    }
  }

  // Check for repetition
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const uniqueSentences = new Set(sentences.map((s) => s.trim().toLowerCase()));
  if (uniqueSentences.size < sentences.length * 0.8) {
    issues.push("Contains repetitive content");
    confidence -= 0.15;
  }

  // Check for inappropriate content flags
  const inappropriateTerms = ["fuck", "shit", "damn", "hell"];
  for (const term of inappropriateTerms) {
    if (content.toLowerCase().includes(term)) {
      issues.push("Contains inappropriate language");
      confidence -= 0.3;
    }
  }

  // Ensure betting content has disclaimer
  if (type === "BETTING" && !content.toLowerCase().includes("risk")) {
    issues.push("Missing betting disclaimer");
    confidence -= 0.1;
  }

  return {
    isValid: confidence >= 0.6,
    confidence: Math.max(0, Math.min(1, confidence)),
    issues,
  };
}

// Game Recap Generator
export async function generateGameRecap(game: {
  id?: string;
  homeTeam: string | { name: string; abbreviation: string };
  awayTeam: string | { name: string; abbreviation: string };
  homeScore: number;
  awayScore: number;
  isPlayoffs?: boolean;
  topPerformers?: Array<{ name: string; stats: string }>;
  keyMoments?: string[];
  context?: string;
}): Promise<GeneratedContent> {
  const homeTeamName = typeof game.homeTeam === "string" ? game.homeTeam : game.homeTeam.name;
  const awayTeamName = typeof game.awayTeam === "string" ? game.awayTeam : game.awayTeam.name;

  const prompt = PROMPT_TEMPLATES.gameRecap({
    homeTeam: homeTeamName,
    awayTeam: awayTeamName,
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    topPerformers: game.topPerformers || [
      { name: "Top Scorer", stats: `${Math.max(game.homeScore, game.awayScore) > 100 ? "25" : "20"} PTS` },
    ],
    keyMoments: game.keyMoments,
    context: game.context || (game.isPlayoffs ? "Playoff game" : undefined),
  });

  const options: DeepSeekOptions = {
    temperature: TEMPERATURE_SETTINGS.gameRecap,
    maxTokens: TOKEN_LIMITS.gameRecap,
  };

  const result = await deepseek.generate(prompt, SYSTEM_PROMPTS.gameRecap, options);

  const validation = validateContent(result.content, "GAME_RECAP");

  // Extract a summary (first 2 sentences)
  const sentences = result.content.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const summary = sentences.slice(0, 2).join(". ").trim() + ".";

  return {
    content: result.content,
    summary,
    tokenUsage: result.tokenUsage,
    tokensUsed: result.tokenUsage,
    confidence: validation.confidence,
    metadata: {
      gameId: game.id,
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      validation,
    },
  };
}

// Player Analysis Generator
export async function generatePlayerAnalysis(player: {
  id: string;
  name: string;
  team: string;
  position: string;
  recentStats: string;
  seasonAverages: string;
  careerAverages?: string;
  context?: string;
}): Promise<GeneratedContent> {
  const prompt = PROMPT_TEMPLATES.playerAnalysis({
    name: player.name,
    team: player.team,
    position: player.position,
    recentStats: player.recentStats,
    seasonAverages: player.seasonAverages,
    careerAverages: player.careerAverages,
    context: player.context,
  });

  const options: DeepSeekOptions = {
    temperature: TEMPERATURE_SETTINGS.playerAnalysis,
    maxTokens: TOKEN_LIMITS.playerAnalysis,
  };

  const result = await deepseek.generate(prompt, SYSTEM_PROMPTS.playerAnalysis, options);

  const validation = validateContent(result.content, "PLAYER_ANALYSIS");

  return {
    content: result.content,
    tokenUsage: result.tokenUsage,
    tokensUsed: result.tokenUsage,
    confidence: validation.confidence,
    metadata: {
      playerId: player.id,
      validation,
    },
  };
}

// Betting Insights Generator
export async function generateBettingInsights(game: {
  homeTeam: string;
  awayTeam: string;
  spread: string;
  overUnder: string;
  homeRecord: string;
  awayRecord: string;
  homeAtsRecord?: string;
  awayAtsRecord?: string;
  injuries?: string[];
  trends?: string[];
}): Promise<GeneratedContent> {
  const prompt = PROMPT_TEMPLATES.bettingInsights(game);

  const options: DeepSeekOptions = {
    temperature: TEMPERATURE_SETTINGS.bettingInsights,
    maxTokens: TOKEN_LIMITS.bettingInsights,
  };

  const result = await deepseek.generate(prompt, SYSTEM_PROMPTS.bettingInsights, options);

  const validation = validateContent(result.content, "BETTING");

  return {
    content: result.content,
    tokenUsage: result.tokenUsage,
    tokensUsed: result.tokenUsage,
    confidence: validation.confidence,
    metadata: { validation },
  };
}

// Fantasy Tips Generator
export async function generateFantasyTips(slate: {
  date: string;
  topPlays: Array<{ name: string; salary: string; matchup: string; projection?: string }>;
  valueTargets: Array<{ name: string; salary: string; reason: string }>;
  fades: Array<{ name: string; reason: string }>;
}): Promise<GeneratedContent> {
  const prompt = PROMPT_TEMPLATES.fantasyTips(slate);

  const options: DeepSeekOptions = {
    temperature: TEMPERATURE_SETTINGS.fantasyTips,
    maxTokens: TOKEN_LIMITS.fantasyTips,
  };

  const result = await deepseek.generate(prompt, SYSTEM_PROMPTS.fantasyTips, options);

  const validation = validateContent(result.content, "FANTASY");

  return {
    content: result.content,
    tokenUsage: result.tokenUsage,
    tokensUsed: result.tokenUsage,
    confidence: validation.confidence,
    metadata: { date: slate.date, validation },
  };
}

// Trending Story Generator
export async function generateTrendingStory(topic: {
  headline: string;
  summary: string;
  keyStats?: string[];
  quotes?: string[];
  context?: string;
}): Promise<GeneratedContent> {
  const prompt = PROMPT_TEMPLATES.trending(topic);

  const options: DeepSeekOptions = {
    temperature: TEMPERATURE_SETTINGS.trending,
    maxTokens: TOKEN_LIMITS.trending,
  };

  const result = await deepseek.generate(prompt, SYSTEM_PROMPTS.trending, options);

  const validation = validateContent(result.content, "TRENDING");

  return {
    content: result.content,
    tokenUsage: result.tokenUsage,
    tokensUsed: result.tokenUsage,
    confidence: validation.confidence,
    metadata: { headline: topic.headline, validation },
  };
}

// Game Prediction Generator
export async function generateGamePrediction(game: {
  homeTeam: string;
  awayTeam: string;
  homeRecord: string;
  awayRecord: string;
  homeStats: string;
  awayStats: string;
  injuries?: string[];
  context?: string;
}): Promise<{
  winner: string;
  score: string;
  confidence: string;
  keyFactor: string;
  tokenUsage: number;
}> {
  const prompt = PROMPT_TEMPLATES.gamePrediction(game);

  const options: DeepSeekOptions = {
    temperature: TEMPERATURE_SETTINGS.gamePrediction,
    maxTokens: TOKEN_LIMITS.gamePrediction,
  };

  const result = await deepseek.generate(prompt, SYSTEM_PROMPTS.base, options);

  // Parse JSON response
  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        winner: parsed.winner || "Unknown",
        score: parsed.score || "N/A",
        confidence: parsed.confidence || "medium",
        keyFactor: parsed.keyFactor || "Team performance",
        tokenUsage: result.tokenUsage,
      };
    }
  } catch {
    // If JSON parsing fails, return defaults
  }

  return {
    winner: game.homeTeam,
    score: "105-100",
    confidence: "medium",
    keyFactor: "Home court advantage",
    tokenUsage: result.tokenUsage,
  };
}

// Save generated content to database
export async function saveGeneratedContent(
  type: ContentType,
  content: string,
  options: {
    playerId?: string;
    gameId?: string;
    confidence: number;
    tokenUsage: number;
    metadata?: Record<string, unknown>;
    autoApprove?: boolean;
  }
): Promise<string> {
  // Auto-approve if confidence is high enough
  const shouldApprove = options.autoApprove !== false && options.confidence >= 0.8;

  const insight = await prisma.aiInsight.create({
    data: {
      type,
      content,
      playerId: options.playerId,
      gameId: options.gameId,
      confidence: options.confidence,
      tokenUsage: options.tokenUsage,
      approved: shouldApprove,
      published: shouldApprove,
      metadata: options.metadata as Record<string, unknown> | undefined,
    },
  });

  return insight.id;
}

// Get pending content for review
export async function getPendingContent() {
  return prisma.aiInsight.findMany({
    where: {
      approved: false,
    },
    include: {
      player: true,
      game: {
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      },
    },
    orderBy: {
      generatedAt: "desc",
    },
  });
}

// Approve or reject content
export async function reviewContent(
  insightId: string,
  approved: boolean,
  editedContent?: string
) {
  return prisma.aiInsight.update({
    where: { id: insightId },
    data: {
      approved,
      published: approved,
      content: editedContent || undefined,
    },
  });
}
