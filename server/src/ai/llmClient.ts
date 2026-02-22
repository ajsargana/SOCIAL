export interface LLMRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface LLMResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface EmbeddingRequest {
  text: string;
  model?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  dimensions: number;
}

class LLMClient {
  private apiKey: string | null = null;
  private baseUrl: string = "https://api.openai.com/v1";

  configure(options: { apiKey?: string; baseUrl?: string }): void {
    if (options.apiKey) {
      this.apiKey = options.apiKey;
    }
    if (options.baseUrl) {
      this.baseUrl = options.baseUrl;
    }
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    // TODO: Implement actual API call when API key is available
    // For now, return a mock response
    if (!this.apiKey) {
      console.warn("[LLMClient] No API key configured, using mock response");
      return this.mockComplete(request);
    }

    // Actual implementation would use fetch to call the API
    return this.mockComplete(request);
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    // TODO: Implement actual embedding API call
    if (!this.apiKey) {
      console.warn("[LLMClient] No API key configured, using mock embeddings");
      return this.mockEmbed(request);
    }

    return this.mockEmbed(request);
  }

  private mockComplete(request: LLMRequest): LLMResponse {
    const mockResponses = [
      "Here's a great caption for your post!",
      "Engaging content that resonates with your audience.",
      "Share your story with authenticity and impact.",
    ];

    return {
      text: mockResponses[Math.floor(Math.random() * mockResponses.length)],
      usage: {
        promptTokens: request.prompt.split(" ").length,
        completionTokens: 20,
        totalTokens: request.prompt.split(" ").length + 20,
      },
    };
  }

  private mockEmbed(request: EmbeddingRequest): EmbeddingResponse {
    const dimensions = 1536;
    const embedding = Array.from({ length: dimensions }, () => Math.random() * 2 - 1);

    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalized = embedding.map((val) => val / magnitude);

    return {
      embedding: normalized,
      dimensions,
    };
  }

  async streamComplete(
    request: LLMRequest,
    onToken: (token: string) => void
  ): Promise<void> {
    // TODO: Implement streaming when API is available
    const response = await this.complete(request);
    const words = response.text.split(" ");

    for (const word of words) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      onToken(word + " ");
    }
  }

  isConfigured(): boolean {
    return this.apiKey !== null;
  }
}

export const llmClient = new LLMClient();
