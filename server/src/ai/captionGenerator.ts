export interface CaptionOptions {
  topic: string;
  platform: string;
  brandVoice?: string;
  maxLength?: number;
  includeHashtags?: boolean;
  includeEmoji?: boolean;
}

export interface GeneratedCaption {
  caption: string;
  hashtags: string[];
  reasoning: string;
}

class CaptionGenerator {
  private platformTemplates: Record<string, string[]> = {
    instagram: [
      "Just dropped: {topic}! Link in bio for more.",
      "Behind the scenes: {topic}. Double tap if you're loving this!",
      "New content alert: {topic}. Save this for later!",
      "{topic} - because you asked for it. Share your thoughts below!",
    ],
    twitter: [
      "{topic} - a thread:",
      "Hot take: {topic}. Agree or disagree?",
      "Just learned something interesting about {topic}...",
      "{topic}. That's it. That's the tweet.",
    ],
    x: [
      "{topic} - a thread:",
      "Hot take: {topic}. Agree or disagree?",
      "Just learned something interesting about {topic}...",
      "{topic}. That's it. That's the post.",
    ],
    linkedin: [
      "Excited to share my thoughts on {topic}. Here's what I've learned:",
      "3 key insights about {topic} that changed my perspective:",
      "{topic} is transforming the way we work. Here's why:",
      "A deep dive into {topic} - lessons from the field:",
    ],
    tiktok: [
      "POV: You're learning about {topic}",
      "Things nobody tells you about {topic}",
      "The truth about {topic} (nobody's talking about this)",
      "When you finally understand {topic}...",
    ],
  };

  private hashtagsByPlatform: Record<string, string[]> = {
    instagram: ["#content", "#creator", "#fyp", "#viral", "#trending"],
    twitter: [],
    x: [],
    linkedin: ["#business", "#insights", "#leadership", "#growth"],
    tiktok: ["#fyp", "#viral", "#trending", "#learnontiktok"],
  };

  async generate(options: CaptionOptions): Promise<string> {
    const { topic, platform, brandVoice, maxLength = 280, includeHashtags = true } = options;

    const templates = this.platformTemplates[platform.toLowerCase()] || this.platformTemplates.instagram;
    const template = templates[Math.floor(Math.random() * templates.length)];

    let caption = template.replace("{topic}", topic);

    if (brandVoice) {
      caption = this.applyBrandVoice(caption, brandVoice);
    }

    if (includeHashtags) {
      const hashtags = this.getHashtags(platform.toLowerCase(), topic);
      if (hashtags.length > 0) {
        caption += "\n\n" + hashtags.join(" ");
      }
    }

    if (caption.length > maxLength) {
      caption = caption.substring(0, maxLength - 3) + "...";
    }

    return caption;
  }

  async generateWithExplanation(options: CaptionOptions): Promise<GeneratedCaption> {
    const caption = await this.generate(options);
    const hashtags = this.getHashtags(options.platform.toLowerCase(), options.topic);

    return {
      caption,
      hashtags,
      reasoning: `Generated ${options.platform} caption for topic "${options.topic}" using brand voice: ${options.brandVoice || "default"}. Optimized for engagement based on platform best practices.`,
    };
  }

  private applyBrandVoice(caption: string, brandVoice: string): string {
    const voiceModifiers: Record<string, (text: string) => string> = {
      professional: (text) => text.replace(/!/g, "."),
      casual: (text) => text.toLowerCase().replace(/\./g, "!"),
      enthusiastic: (text) => text + " Let's go!",
      minimal: (text) => text.split(".")[0],
    };

    const modifier = voiceModifiers[brandVoice.toLowerCase()];
    return modifier ? modifier(caption) : caption;
  }

  private getHashtags(platform: string, topic: string): string[] {
    const baseHashtags = this.hashtagsByPlatform[platform] || [];
    const topicHashtag = "#" + topic.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");

    return [topicHashtag, ...baseHashtags.slice(0, 4)];
  }

  // TODO: Integrate with actual LLM for better generation
  async generateWithLLM(_options: CaptionOptions): Promise<string> {
    // Placeholder for LLM integration
    // This would call OpenAI/Anthropic API
    throw new Error("LLM integration not yet implemented");
  }
}

export const captionGenerator = new CaptionGenerator();
