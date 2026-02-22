import { storage } from "../../storage";
import type { SocialAccount, Post, AutopilotSettings, Decision } from "@shared/schema";
import { policyEngine } from "./policyEngine";
import { memoryReader } from "../memory/memoryReader";

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
  scheduledTime?: Date;
}

class DecisionEngine {
  async evaluatePostingNeed(userId: string): Promise<DecisionResult> {
    const settings = await storage.getAutopilotSettings(userId);
    if (!settings || !settings.enabled) {
      return {
        shouldPost: false,
        decision: null,
        reasoning: "Autopilot is disabled for this user",
      };
    }

    const socialAccounts = await storage.getSocialAccountsByUserId(userId);
    if (socialAccounts.length === 0) {
      return {
        shouldPost: false,
        decision: null,
        reasoning: "No social accounts connected",
      };
    }

    const recentPosts = await storage.getPostsByUserId(userId);
    const gapHours = this.calculatePostingGap(recentPosts);

    const context: DecisionContext = {
      userId,
      socialAccounts,
      recentPosts,
      settings,
      gapHours,
    };

    if (gapHours < (settings.postingGapHours || 6)) {
      return {
        shouldPost: false,
        decision: null,
        reasoning: `No gap detected. Last post was ${gapHours} hours ago. Threshold is ${settings.postingGapHours} hours.`,
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
    const suggestedTopic = await this.suggestTopic(context, brandProfile);
    const suggestedPlatform = this.selectPlatform(socialAccounts, recentPosts);
    const optimalTime = this.calculateOptimalPostTime(context);

    const decision = await storage.createDecision({
      userId,
      decisionType: "auto_post",
      reasoning: `Gap of ${gapHours} hours detected. Suggesting ${suggestedTopic} for ${suggestedPlatform}.`,
      suggestedContent: {
        topic: suggestedTopic,
        platform: suggestedPlatform,
        scheduledTime: optimalTime.toISOString(),
      },
    });

    return {
      shouldPost: true,
      decision,
      reasoning: `Content gap detected. Recommending post for ${suggestedPlatform}.`,
      platform: suggestedPlatform,
      scheduledTime: optimalTime,
    };
  }

  private calculatePostingGap(posts: Post[]): number {
    if (posts.length === 0) return 168;

    const sortedPosts = posts
      .filter((p) => p.postedAt)
      .sort((a, b) => new Date(b.postedAt!).getTime() - new Date(a.postedAt!).getTime());

    if (sortedPosts.length === 0) return 168;

    const lastPost = sortedPosts[0];
    const hoursSinceLastPost = (Date.now() - new Date(lastPost.postedAt!).getTime()) / (1000 * 60 * 60);
    return Math.round(hoursSinceLastPost);
  }

  private selectPlatform(accounts: SocialAccount[], recentPosts: Post[]): string {
    const platformCounts: Record<string, number> = {};
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;

    for (const post of recentPosts) {
      if (post.postedAt && new Date(post.postedAt).getTime() > last24Hours) {
        platformCounts[post.platform] = (platformCounts[post.platform] || 0) + 1;
      }
    }

    const connectedPlatforms = accounts.filter((a) => a.isConnected).map((a) => a.platform);

    let selectedPlatform = connectedPlatforms[0];
    let minPosts = Infinity;

    for (const platform of connectedPlatforms) {
      const count = platformCounts[platform] || 0;
      if (count < minPosts) {
        minPosts = count;
        selectedPlatform = platform;
      }
    }

    return selectedPlatform || "instagram";
  }

  private async suggestTopic(_context: DecisionContext, brandProfile: Record<string, unknown> | null): Promise<string> {
    const defaultTopics = [
      "Behind-the-scenes content",
      "Industry insights",
      "User tips and tricks",
      "Product showcase",
      "Community spotlight",
    ];

    if (brandProfile && Array.isArray(brandProfile.topTopics)) {
      return brandProfile.topTopics[Math.floor(Math.random() * brandProfile.topTopics.length)] as string;
    }

    return defaultTopics[Math.floor(Math.random() * defaultTopics.length)];
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
