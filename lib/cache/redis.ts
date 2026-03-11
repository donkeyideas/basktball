// Redis Cache Layer with Upstash
// Provides caching for API responses with TTL support
// Falls back to in-memory cache if Redis is not configured

import { Redis } from "@upstash/redis";

// Cache TTL presets (in seconds)
export const CacheTTL = {
  LIVE_SCORES: 30, // 30 seconds for live game data
  GAME_STATS: 60, // 1 minute for game statistics
  PLAYER_STATS: 900, // 15 minutes for player stats
  TEAM_DATA: 3600, // 1 hour for team data
  STANDINGS: 3600, // 1 hour for standings
  AI_INSIGHTS: 86400, // 24 hours for AI-generated content
  STATIC_DATA: 86400 * 7, // 1 week for static data
} as const;

// In-memory fallback cache
interface MemoryCacheEntry {
  value: unknown;
  expiresAt: number;
}

const memoryCache = new Map<string, MemoryCacheEntry>();

// Cleanup expired entries periodically
function cleanupMemoryCache() {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt < now) {
      memoryCache.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupMemoryCache, 5 * 60 * 1000);
}

// Initialize Redis client
let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("Upstash Redis not configured, using in-memory cache");
    return null;
  }

  try {
    redisClient = new Redis({ url, token });
    return redisClient;
  } catch (error) {
    console.error("Failed to initialize Redis client:", error);
    return null;
  }
}

// Cache class with Redis + memory fallback
export class Cache {
  private prefix: string;

  constructor(prefix = "basktball") {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  // Get a value from cache
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);
    const redis = getRedisClient();

    if (redis) {
      try {
        const value = await redis.get<T>(fullKey);
        return value;
      } catch (error) {
        console.error("Redis get error:", error);
        // Fall through to memory cache
      }
    }

    // Memory fallback
    const entry = memoryCache.get(fullKey);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value as T;
    }

    memoryCache.delete(fullKey);
    return null;
  }

  // Set a value in cache
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const fullKey = this.getKey(key);
    const redis = getRedisClient();

    if (redis) {
      try {
        await redis.set(fullKey, value, { ex: ttlSeconds });
        return;
      } catch (error) {
        console.error("Redis set error:", error);
        // Fall through to memory cache
      }
    }

    // Memory fallback
    memoryCache.set(fullKey, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  // Delete a value from cache
  async delete(key: string): Promise<void> {
    const fullKey = this.getKey(key);
    const redis = getRedisClient();

    if (redis) {
      try {
        await redis.del(fullKey);
      } catch (error) {
        console.error("Redis delete error:", error);
      }
    }

    memoryCache.delete(fullKey);
  }

  // Delete all keys matching a pattern
  async deletePattern(pattern: string): Promise<void> {
    const fullPattern = this.getKey(pattern);
    const redis = getRedisClient();

    if (redis) {
      try {
        const keys = await redis.keys(fullPattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (error) {
        console.error("Redis deletePattern error:", error);
      }
    }

    // Memory fallback - delete matching keys
    const regex = new RegExp(fullPattern.replace("*", ".*"));
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
  }

  // Get or set - fetch from cache or compute and store
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  // Check if a key exists
  async exists(key: string): Promise<boolean> {
    const fullKey = this.getKey(key);
    const redis = getRedisClient();

    if (redis) {
      try {
        const result = await redis.exists(fullKey);
        return result === 1;
      } catch (error) {
        console.error("Redis exists error:", error);
      }
    }

    const entry = memoryCache.get(fullKey);
    return entry !== undefined && entry.expiresAt > Date.now();
  }

  // Get TTL remaining for a key
  async ttl(key: string): Promise<number> {
    const fullKey = this.getKey(key);
    const redis = getRedisClient();

    if (redis) {
      try {
        return await redis.ttl(fullKey);
      } catch (error) {
        console.error("Redis ttl error:", error);
      }
    }

    const entry = memoryCache.get(fullKey);
    if (entry) {
      return Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000));
    }

    return -2; // Key doesn't exist
  }

  // Increment a counter
  async incr(key: string): Promise<number> {
    const fullKey = this.getKey(key);
    const redis = getRedisClient();

    if (redis) {
      try {
        return await redis.incr(fullKey);
      } catch (error) {
        console.error("Redis incr error:", error);
      }
    }

    // Memory fallback
    const entry = memoryCache.get(fullKey);
    const newValue = (typeof entry?.value === "number" ? entry.value : 0) + 1;
    memoryCache.set(fullKey, {
      value: newValue,
      expiresAt: entry?.expiresAt || Date.now() + 86400000,
    });
    return newValue;
  }

  // Store list items
  async lpush<T>(key: string, ...values: T[]): Promise<number> {
    const fullKey = this.getKey(key);
    const redis = getRedisClient();

    if (redis) {
      try {
        return await redis.lpush(fullKey, ...values);
      } catch (error) {
        console.error("Redis lpush error:", error);
      }
    }

    // Memory fallback
    const entry = memoryCache.get(fullKey);
    const list = Array.isArray(entry?.value) ? [...values, ...(entry.value as T[])] : values;
    memoryCache.set(fullKey, {
      value: list,
      expiresAt: entry?.expiresAt || Date.now() + 86400000,
    });
    return list.length;
  }

  // Get list range
  async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    const fullKey = this.getKey(key);
    const redis = getRedisClient();

    if (redis) {
      try {
        return await redis.lrange(fullKey, start, stop);
      } catch (error) {
        console.error("Redis lrange error:", error);
      }
    }

    // Memory fallback
    const entry = memoryCache.get(fullKey);
    if (Array.isArray(entry?.value)) {
      const list = entry.value as T[];
      const end = stop === -1 ? list.length : stop + 1;
      return list.slice(start, end);
    }

    return [];
  }
}

// Export default cache instance
export const cache = new Cache();

// Specialized cache instances for different data types
export const gamesCache = new Cache("games");
export const playersCache = new Cache("players");
export const teamsCache = new Cache("teams");
export const statsCache = new Cache("stats");
export const insightsCache = new Cache("insights");

// Cache key builders
export const CacheKeys = {
  liveGames: (league: string) => `live:${league}`,
  gamesByDate: (league: string, date: string) => `games:${league}:${date}`,
  gameStats: (gameId: string) => `game:${gameId}:stats`,
  player: (playerId: string) => `player:${playerId}`,
  playerStats: (playerId: string, season?: string) =>
    `player:${playerId}:stats${season ? `:${season}` : ""}`,
  team: (teamId: string) => `team:${teamId}`,
  teamRoster: (teamId: string) => `team:${teamId}:roster`,
  standings: (league: string) => `standings:${league}`,
  leagueLeaders: (category: string) => `leaders:${category}`,
  insight: (type: string, id: string) => `insight:${type}:${id}`,
  searchResults: (query: string) => `search:${query.toLowerCase().replace(/\s+/g, "_")}`,
};
