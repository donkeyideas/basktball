export type DeepSeekRole = "system" | "user" | "assistant";

export interface DeepSeekMessage {
  role: DeepSeekRole;
  content: string;
}

export interface DeepSeekChatRequest {
  model?: string;
  messages: DeepSeekMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}

export interface DeepSeekChatChoice {
  index: number;
  message: {
    role: DeepSeekRole;
    content: string;
  };
  finish_reason: string;
}

export interface DeepSeekChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: DeepSeekChatChoice[];
}

const DEFAULT_MODEL = "deepseek-chat";

export class DeepSeekClient {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor() {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key && process.env.NODE_ENV === "development") {
      console.warn("DEEPSEEK_API_KEY is not set. AI features will be disabled.");
    }

    this.apiKey = key ?? "";
    this.apiUrl = process.env.DEEPSEEK_API_URL ?? "https://api.deepseek.com/v1";
  }

  async chat(request: DeepSeekChatRequest): Promise<DeepSeekChatResponse> {
    if (!this.apiKey) {
      throw new Error("DEEPSEEK_API_KEY is not configured.");
    }

    const body = {
      model: request.model ?? DEFAULT_MODEL,
      messages: request.messages,
      max_tokens: request.max_tokens ?? 500,
      temperature: request.temperature ?? 0.7,
      top_p: request.top_p ?? 0.95,
    };

    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `DeepSeek API request failed with status ${response.status}: ${errorText}`,
      );
    }

    const json = (await response.json()) as DeepSeekChatResponse;
    return json;
  }
}

// Singleton instance to reuse across the app.
export const deepseek = new DeepSeekClient();


