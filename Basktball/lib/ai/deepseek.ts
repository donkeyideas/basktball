// DeepSeek AI Client for content generation
// Docs: https://platform.deepseek.com/api-docs

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
  ): Promise<{ content: string; tokenUsage: number }> {
    if (!this.apiKey) {
      throw new Error("DeepSeek API key not configured");
    }

    const {
      model = this.defaultModel,
      temperature = 0.7,
      maxTokens = 500,
      topP = 1,
    } = options;

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
        const error = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
      }

      const data: DeepSeekResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from DeepSeek");
      }

      return {
        content: data.choices[0].message.content,
        tokenUsage: data.usage.total_tokens,
      };
    } catch (error) {
      console.error("DeepSeek API error:", error);
      throw error;
    }
  }

  // Helper for simple prompts
  async generate(
    prompt: string,
    systemPrompt?: string,
    options?: DeepSeekOptions
  ): Promise<{ content: string; tokenUsage: number }> {
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
