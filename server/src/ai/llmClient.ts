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

class LLMClient {
  private apiKey: string | null = process.env.OPENAI_API_KEY || null;
  private baseUrl = "https://api.openai.com/v1";

  configure(options: { apiKey?: string; baseUrl?: string }): void {
    if (options.apiKey) this.apiKey = options.apiKey;
    if (options.baseUrl) this.baseUrl = options.baseUrl;
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    if (this.apiKey) {
      return this.openAIComplete(request);
    }
    return this.smartMockComplete(request);
  }

  private async openAIComplete(request: LLMRequest): Promise<LLMResponse> {
    const messages: { role: string; content: string }[] = [];
    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }
    messages.push({ role: "user", content: request.prompt });

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: request.maxTokens || 300,
        temperature: request.temperature ?? 0.8,
      }),
    });

    if (!res.ok) {
      console.warn(`[LLMClient] OpenAI error ${res.status}, falling back to mock`);
      return this.smartMockComplete(request);
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    return {
      text: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }

  private smartMockComplete(request: LLMRequest): LLMResponse {
    // Context-aware mock: parse hints from prompt
    const prompt = request.prompt.toLowerCase();

    let text = "";

    if (prompt.includes("instagram")) {
      text = this.pickRandom([
        "Behind the scenes: every great outcome starts with consistent effort. Double tap if you agree! ✨\n\n#motivation #creator #behindthescenes #content",
        "The secret? Showing up every single day, even when it's hard. Here's what I learned this week...\n\n#growthmindset #creator #instagram #trending",
        "Not every post has to be perfect. Sometimes authenticity beats aesthetics. What do you think? 👇\n\n#authentic #contenttips #creatorlife",
      ]);
    } else if (prompt.includes("linkedin")) {
      text = this.pickRandom([
        "3 things I wish I knew before scaling my content strategy:\n\n1. Consistency > perfection\n2. Engagement beats reach\n3. Your audience teaches you everything\n\nWhat would you add?",
        "The biggest mistake content creators make? Posting for algorithms instead of people.\n\nHere's what changed when I flipped the script:\n\n#contentmarketing #growth #leadership",
        "After analyzing 100+ high-performing posts, here's the pattern I found: authentic vulnerability outperforms polished perfection every time.\n\n#insights #contentcreation #marketing",
      ]);
    } else if (prompt.includes("twitter") || prompt.includes(" x ")) {
      text = this.pickRandom([
        "Hot take: the best content strategy is the one you'll actually stick to. That's it. That's the tweet.",
        "Everyone talks about going viral. Nobody talks about staying consistent for 18 months first.",
        "Your audience doesn't want perfect. They want real. Biggest unlock of my content career.",
      ]);
    } else if (prompt.includes("tiktok")) {
      text = this.pickRandom([
        "POV: You finally figured out the content formula that works for your brand ✨ #fyp #contentcreator #viral",
        "Things nobody tells you about growing on social media (the honest version) 👀 #facts #creator #tiktok",
        "The thing about consistency is… it's boring until suddenly it isn't. #growthhack #creator #fyp",
      ]);
    } else if (prompt.includes("decision") || prompt.includes("should post")) {
      const decisions = [
        JSON.stringify({
          shouldPost: true,
          topic: "Behind-the-scenes content",
          reasoning: "6-hour gap detected on Instagram. Audience engagement peaks at this time. Behind-the-scenes content drives 34% higher saves for your profile.",
          confidence: 0.87,
        }),
        JSON.stringify({
          shouldPost: true,
          topic: "Industry insight thread",
          reasoning: "LinkedIn has been quiet for 18 hours. Professional insight posts on Tuesday afternoon get 2x engagement for your audience segment.",
          confidence: 0.91,
        }),
        JSON.stringify({
          shouldPost: false,
          topic: null,
          reasoning: "All platforms posted within the last 3 hours. Posting now would exceed optimal gap and risk reducing reach. Recommended next window: in 4 hours.",
          confidence: 0.95,
        }),
      ];
      text = this.pickRandom(decisions);
    } else if (prompt.includes("topic")) {
      text = this.pickRandom([
        "Behind-the-scenes content",
        "Industry insights & trends",
        "Quick tips for your audience",
        "Community spotlight",
        "Product showcase",
        "Personal story / lesson learned",
        "Hot take / controversial opinion",
      ]);
    } else {
      text = this.pickRandom([
        "Consistency is the most underrated growth hack. Here's what happens when you commit to showing up every day...",
        "The gap between where you are and where you want to be is filled with the work you're not doing yet.",
        "Three things that changed my approach to content: listening more, posting less, and caring about the right metrics.",
      ]);
    }

    return {
      text,
      usage: {
        promptTokens: Math.ceil(request.prompt.split(" ").length * 1.3),
        completionTokens: Math.ceil(text.split(" ").length * 1.3),
        totalTokens: Math.ceil((request.prompt.split(" ").length + text.split(" ").length) * 1.3),
      },
    };
  }

  private pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  isConfigured(): boolean {
    return this.apiKey !== null;
  }
}

export const llmClient = new LLMClient();
