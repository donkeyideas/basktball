// DeepSeek AI Client for content generation
// Docs: https://platform.deepseek.com/api-docs

import { trackApiCall, ApiProvider } from "@/lib/api/tracker";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekClient {
  private apiKey: string;
  private defaultModel: string = "deepseek-chat";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || "";
    if (!this.apiKey) {
      console.warn("DeepSeek API key not configured. AI features will be limited.");
    }
  }

  async chat(
    messages: DeepSeekMessage[],
    options: DeepSeekOptions = {}
  ): Promise<{ content: string; tokenUsage: number; promptTokens: number; completionTokens: number }> {
    if (!this.apiKey) {
      throw new Error("DeepSeek API key not configured");
    }

    const {
      model = this.defaultModel,
      temperature = 0.7,
      maxTokens = 500,
      topP = 1,
    } = options;

    const startTime = Date.now();

    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        trackApiCall({
          provider: ApiProvider.DEEPSEEK,
          endpoint: "/v1/chat/completions",
          method: "POST",
          statusCode: response.status,
          responseTime: Date.now() - startTime,
          error: `${response.status} - ${errorText}`,
        });
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
      }

      const data: DeepSeekResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from DeepSeek");
      }

      trackApiCall({
        provider: ApiProvider.DEEPSEEK,
        endpoint: "/v1/chat/completions",
        method: "POST",
        statusCode: 200,
        responseTime: Date.now() - startTime,
        tokensUsed: data.usage.total_tokens,
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        metadata: { model },
      });

      return {
        content: data.choices[0].message.content,
        tokenUsage: data.usage.total_tokens,
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
      };
    } catch (error) {
      if (!(error instanceof Error && error.message.startsWith("DeepSeek API error:"))) {
        trackApiCall({
          provider: ApiProvider.DEEPSEEK,
          endpoint: "/v1/chat/completions",
          method: "POST",
          statusCode: 0,
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      console.error("DeepSeek API error:", error);
      throw error;
    }
  }

  // Helper for simple prompts
  async generate(
    prompt: string,
    systemPrompt?: string,
    options?: DeepSeekOptions
  ): Promise<{ content: string; tokenUsage: number; promptTokens: number; completionTokens: number }> {
    const messages: DeepSeekMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }

    messages.push({ role: "user", content: prompt });

    return this.chat(messages, options);
  }
}

// Export singleton
export const deepseek = new DeepSeekClient();
