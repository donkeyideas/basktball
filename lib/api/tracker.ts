// API Call Tracker
// Logs external API calls to the ApiTracker table for monitoring
// Uses in-memory batching to avoid exhausting the DB connection pool

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

export const ApiProvider = {
  DEEPSEEK: "DEEPSEEK",
  GEMINI: "GEMINI",
  ESPN: "ESPN",
  BDL: "BDL",
  NBA_CDN: "NBA_CDN",
} as const;

export type ApiProviderType = (typeof ApiProvider)[keyof typeof ApiProvider];

// DeepSeek pricing (per million tokens)
const DEEPSEEK_INPUT_COST_PER_M = 0.14;
const DEEPSEEK_OUTPUT_COST_PER_M = 0.28;

export interface TrackApiCallData {
  provider: ApiProviderType;
  endpoint: string;
  method?: string;
  statusCode?: number;
  responseTime: number;
  tokensUsed?: number;
  promptTokens?: number;
  completionTokens?: number;
  cached?: boolean;
  callerRoute?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

function estimateCost(data: TrackApiCallData): number {
  if (data.provider !== ApiProvider.DEEPSEEK) return 0;
  if (data.cached) return 0;

  const promptCost =
    ((data.promptTokens || 0) / 1_000_000) * DEEPSEEK_INPUT_COST_PER_M;
  const completionCost =
    ((data.completionTokens || 0) / 1_000_000) * DEEPSEEK_OUTPUT_COST_PER_M;

  if (!data.promptTokens && !data.completionTokens && data.tokensUsed) {
    const blendedRate =
      (DEEPSEEK_INPUT_COST_PER_M + DEEPSEEK_OUTPUT_COST_PER_M) / 2;
    return (data.tokensUsed / 1_000_000) * blendedRate;
  }

  return promptCost + completionCost;
}

// Batch queue to reduce DB connection usage
type TrackerRecord = Parameters<typeof prisma.apiTracker.create>[0]["data"];
let batchQueue: TrackerRecord[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;

const BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 30_000; // flush every 30s

async function flushBatch() {
  if (isFlushing || batchQueue.length === 0) return;
  isFlushing = true;
  const batch = batchQueue.splice(0, BATCH_SIZE);
  try {
    await prisma.apiTracker.createMany({ data: batch });
  } catch (err) {
    // Silently discard — tracking is non-critical
    console.error("Failed to flush API tracker batch:", (err as Error).message);
  } finally {
    isFlushing = false;
    // If there are more queued, schedule another flush
    if (batchQueue.length > 0) {
      scheduleFlush();
    }
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushBatch();
  }, FLUSH_INTERVAL_MS);
}

/**
 * Track an external API call. Fire-and-forget — does not block the caller.
 * Cache hits are skipped entirely (no DB write needed for free lookups).
 */
export function trackApiCall(data: TrackApiCallData): void {
  // Skip tracking cache hits — they don't cost anything and flood the DB
  if (data.cached) return;

  const cost = estimateCost(data);

  const record: TrackerRecord = {
    provider: data.provider,
    endpoint: data.endpoint,
    method: data.method || "GET",
    statusCode: data.statusCode || 200,
    responseTime: data.responseTime,
    tokensUsed: data.tokensUsed || null,
    promptTokens: data.promptTokens || null,
    completionTokens: data.completionTokens || null,
    estimatedCost: cost,
    cached: false,
    callerRoute: data.callerRoute || null,
    error: data.error || null,
    metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
  };

  batchQueue.push(record);

  // Flush immediately if batch is full, otherwise schedule
  if (batchQueue.length >= BATCH_SIZE) {
    flushBatch();
  } else {
    scheduleFlush();
  }
}
