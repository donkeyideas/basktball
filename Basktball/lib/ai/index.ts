// AI Content System
// Exports all AI-related functionality

export { deepseek, DeepSeekClient } from "./deepseek";
export type { DeepSeekMessage, DeepSeekOptions, DeepSeekResponse } from "./deepseek";

export {
  generateGameRecap,
  generatePlayerAnalysis,
  generateBettingInsights,
  generateFantasyTips,
  generateTrendingStory,
  generateGamePrediction,
  saveGeneratedContent,
  getPendingContent,
  reviewContent,
} from "./content-generator";
export type { ContentType } from "./content-generator";

export { SYSTEM_PROMPTS, PROMPT_TEMPLATES, TOKEN_LIMITS, TEMPERATURE_SETTINGS } from "./prompts";
