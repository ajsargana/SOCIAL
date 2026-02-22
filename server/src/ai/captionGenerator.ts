import { llmClient } from "./llmClient";

export interface CaptionOptions {
  topic: string;
  platform: string;
  brandVoice?: string;
  maxLength?: number;
  includeHashtags?: boolean;
}

export interface GeneratedCaption {
  caption: string;
  hashtags: string[];
  reasoning: string;
}

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  x: 280,
  instagram: 2200,
  linkedin: 3000,
  tiktok: 2200,
};

const PLATFORM_HASHTAGS: Record<string, string[]> = {
  instagram: ["#content", "#creator", "#fyp", "#trending"],
  twitter: [],
  x: [],
  linkedin: ["#business", "#insights", "#leadership"],
  tiktok: ["#fyp", "#viral", "#learnontiktok"],
};

class CaptionGenerator {
  async generate(options: CaptionOptions): Promise<string> {
    const result = await this.generateWithExplanation(options);
    return result.caption;
  }

  async generateWithExplanation(options: CaptionOptions): Promise<GeneratedCaption> {
    const { topic, platform, brandVoice, maxLength, includeHashtags = true } = options;
    const limit = maxLength || PLATFORM_LIMITS[platform.toLowerCase()] || 500;

    const systemPrompt = `You are an expert social media copywriter. Write platform-optimised captions that feel authentic, drive engagement, and match the brand voice. ${brandVoice ? `Brand voice: ${brandVoice}.` : ""} Never include explanations — respond with only the caption text.`;

    const prompt = `Write a ${platform} caption about: "${topic}".
Platform: ${platform}
Max length: ${limit} characters
${brandVoice ? `Brand voice / tone: ${brandVoice}` : "Tone: authentic, conversational"}
${includeHashtags && PLATFORM_HASHTAGS[platform.toLowerCase()]?.length ? `Include relevant hashtags.` : ""}

Respond with only the caption. No preamble.`;

    const response = await llmClient.complete({
      prompt,
      systemPrompt,
      maxTokens: 350,
      temperature: 0.85,
    });

    let caption = response.text.trim();

    // Enforce character limit
    if (caption.length > limit) {
      caption = caption.substring(0, limit - 3) + "...";
    }

    // Extract hashtags from the caption
    const hashtagRegex = /#\w+/g;
    const hashtags = caption.match(hashtagRegex) || [];

    return {
      caption,
      hashtags,
      reasoning: `Generated ${platform} caption for "${topic}" using ${brandVoice ? `"${brandVoice}" brand voice` : "default voice"}. Optimised for engagement and platform best practices.`,
    };
  }
}

export const captionGenerator = new CaptionGenerator();
