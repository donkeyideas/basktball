// Google Gemini AI Client for content generation and fact-checking
// Docs: https://ai.google.dev/api

import { trackApiCall, ApiProvider, type ApiProviderType } from "@/lib/api/tracker";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export interface GeminiOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export class GeminiClient {
  private apiKey: string;
  private defaultModel: string = "gemini-2.0-flash";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
    if (!this.apiKey) {
      console.warn("Gemini API key not configured. AI features will be limited.");
    }
  }

  async chat(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    options: GeminiOptions = {}
  ): Promise<{ content: string; tokenUsage: number; promptTokens: number; completionTokens: number }> {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const {
      model = this.defaultModel,
      temperature = 0.7,
      maxTokens = 500,
      topP = 1,
    } = options;

    const startTime = Date.now();

    // Separate system instruction from conversation messages
    const systemMessage = messages.find((m) => m.role === "system");
    const conversationMessages = messages.filter((m) => m.role !== "system");

    // Build Gemini request body
    const body: Record<string, unknown> = {
      contents: conversationMessages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        topP,
      },
    };

    if (systemMessage) {
      body.systemInstruction = {
        parts: [{ text: systemMessage.content }],
      };
    }

    try {
      const response = await fetch(
        `${GEMINI_API_URL}/${model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        trackApiCall({
          provider: "GEMINI" as ApiProviderType,
          endpoint: `/${model}:generateContent`,
          method: "POST",
          statusCode: response.status,
          responseTime: Date.now() - startTime,
          error: `${response.status} - ${errorText}`,
        });
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const usage = data.usageMetadata || {};
      const promptTokens = usage.promptTokenCount || 0;
      const completionTokens = usage.candidatesTokenCount || 0;
      const totalTokens = usage.totalTokenCount || promptTokens + completionTokens;

      trackApiCall({
        provider: "GEMINI" as ApiProviderType,
        endpoint: `/${model}:generateContent`,
        method: "POST",
        statusCode: 200,
        responseTime: Date.now() - startTime,
        tokensUsed: totalTokens,
        promptTokens,
        completionTokens,
        metadata: { model },
      });

      return {
        content,
        tokenUsage: totalTokens,
        promptTokens,
        completionTokens,
      };
    } catch (error) {
      if (!(error instanceof Error && error.message.startsWith("Gemini API error:"))) {
        trackApiCall({
          provider: "GEMINI" as ApiProviderType,
          endpoint: `/${model}:generateContent`,
          method: "POST",
          statusCode: 0,
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      console.error("Gemini API error:", error);
      throw error;
    }
  }

  // Helper for simple prompts
  async generate(
    prompt: string,
    systemPrompt?: string,
    options?: GeminiOptions
  ): Promise<{ content: string; tokenUsage: number; promptTokens: number; completionTokens: number }> {
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }

    messages.push({ role: "user", content: prompt });

    return this.chat(messages, options);
  }
}

// Export singleton
export const gemini = new GeminiClient();
