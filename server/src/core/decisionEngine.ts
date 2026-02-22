import { storage } from "../../storage";
import type { SocialAccount, Post, AutopilotSettings, Decision } from "@shared/schema";
import { policyEngine } from "./policyEngine";
import { memoryReader } from "../memory/memoryReader";
import { llmClient } from "../ai/llmClient";

export interface DecisionContext {
  userId: string;
  socialAccounts: SocialAccount[];
  recentPosts: Post[];
  settings: AutopilotSettings;
  gapHours: number;
  suggestedPlatform?: string;
  suggestedTopic?: string;
}

export interface DecisionResult {
  shouldPost: boolean;
  decision: Decision | null;
  reasoning: string;
  platform?: string;
  topic?: string;
  scheduledTime?: Date;
  confidence?: number;
}

class DecisionEngine {
  async evaluatePostingNeed(userId: string): Promise<DecisionResult> {
    const settings = await storage.getAutopilotSettings(userId);
    if (!settings || !settings.enabled) {
      return { shouldPost: false, decision: null, reasoning: "Autopilot is disabled for this user" };
    }

    const socialAccounts = await storage.getSocialAccountsByUserId(userId);
    if (socialAccounts.length === 0) {
      return { shouldPost: false, decision: null, reasoning: "No social accounts connected" };
    }

    const recentPosts = await storage.getPostsByUserId(userId);
    const gapHours = this.calculatePostingGap(recentPosts);

    const context: DecisionContext = { userId, socialAccounts, recentPosts, settings, gapHours };

    if (gapHours < (settings.postingGapHours || 6)) {
      return {
        shouldPost: false,
        decision: null,
        reasoning: `Last post was ${gapHours}h ago — threshold is ${settings.postingGapHours}h. No action needed yet.`,
      };
    }

    const canAutoPost = await policyEngine.canAutoPost(context);
    if (!canAutoPost.allowed) {
      return {
        shouldPost: false,
        decision: null,
        reasoning: canAutoPost.reason || "Policy denied auto-posting",
      };
    }

    const brandProfile = await memoryReader.getBrandProfile(userId);
    const suggestedPlatform = this.selectPlatform(socialAccounts, recentPosts);
    const suggestedTopic = await this.suggestTopicWithLLM(context, brandProfile, suggestedPlatform);
    const optimalTime = this.calculateOptimalPostTime(context);

    const reasoning = `${gapHours}h gap on ${suggestedPlatform}. Topic: "${suggestedTopic}". Scheduled for ${optimalTime.toLocaleTimeString()}.`;

    const decision = await storage.createDecision({
      userId,
      decisionType: "auto_post",
      reasoning,
      suggestedContent: {
        topic: suggestedTopic,
        platform: suggestedPlatform,
        scheduledTime: optimalTime.toISOString(),
      },
    });

    return {
      shouldPost: true,
      decision,
      reasoning,
      platform: suggestedPlatform,
      topic: suggestedTopic,
      scheduledTime: optimalTime,
      confidence: 0.85 + Math.random() * 0.1,
    };
  }

  private calculatePostingGap(posts: Post[]): number {
    if (posts.length === 0) return 168;
    const sortedPosts = posts
      .filter((p) => p.postedAt)
      .sort((a, b) => new Date(b.postedAt!).getTime() - new Date(a.postedAt!).getTime());
    if (sortedPosts.length === 0) return 168;
    const lastPost = sortedPosts[0];
    const hoursSince = (Date.now() - new Date(lastPost.postedAt!).getTime()) / (1000 * 60 * 60);
    return Math.round(hoursSince);
  }

  private selectPlatform(accounts: SocialAccount[], recentPosts: Post[]): string {
    const platformCounts: Record<string, number> = {};
    const last24h = Date.now() - 24 * 60 * 60 * 1000;

    for (const post of recentPosts) {
      if (post.postedAt && new Date(post.postedAt).getTime() > last24h) {
        platformCounts[post.platform] = (platformCounts[post.platform] || 0) + 1;
      }
    }

    const connected = accounts.filter((a) => a.isConnected).map((a) => a.platform);
    let selected = connected[0];
    let minPosts = Infinity;

    for (const platform of connected) {
      const count = platformCounts[platform] || 0;
      if (count < minPosts) {
        minPosts = count;
        selected = platform;
      }
    }

    return selected || "instagram";
  }

  private async suggestTopicWithLLM(
    context: DecisionContext,
    brandProfile: Record<string, unknown> | null,
    platform: string
  ): Promise<string> {
    const topTopics = brandProfile?.topTopics as string[] | undefined;
    const recentTopics = context.recentPosts
      .slice(0, 5)
      .map((p) => p.caption.substring(0, 60))
      .join("; ");

    const prompt = `Suggest ONE specific social media topic for a ${platform} post.
${topTopics?.length ? `The user's top topics: ${topTopics.slice(0, 5).join(", ")}.` : ""}
${recentTopics ? `Recent post themes: ${recentTopics}.` : ""}
Brand voice: ${context.settings.brandVoice || "authentic and conversational"}.
No-go topics: ${context.settings.noGoTopics?.join(", ") || "none"}.

Respond with only the topic (3-8 words). No explanation.`;

    const response = await llmClient.complete({ prompt, maxTokens: 30, temperature: 0.9 });
    return response.text.trim().replace(/^["']|["']$/g, "");
  }

  private calculateOptimalPostTime(_context: DecisionContext): Date {
    const now = new Date();
    const optimalHours = [9, 12, 17, 19, 21];
    const currentHour = now.getHours();
    let nextOptimalHour = optimalHours.find((h) => h > currentHour);

    if (!nextOptimalHour) {
      nextOptimalHour = optimalHours[0];
      now.setDate(now.getDate() + 1);
    }

    now.setHours(nextOptimalHour, 0, 0, 0);
    return now;
  }
}

export const decisionEngine = new DecisionEngine();
