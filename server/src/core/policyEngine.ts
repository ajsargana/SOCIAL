import type { DecisionContext } from "./decisionEngine";

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
  requiresApproval?: boolean;
}

class PolicyEngine {
  async canAutoPost(context: DecisionContext): Promise<PolicyResult> {
    const { settings, recentPosts } = context;

    if (!settings.enabled) {
      return {
        allowed: false,
        reason: "Autopilot is disabled",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const postsToday = recentPosts.filter((p) => {
      if (!p.postedAt) return false;
      const postDate = new Date(p.postedAt);
      postDate.setHours(0, 0, 0, 0);
      return postDate.getTime() === today.getTime();
    });

    if (postsToday.length >= (settings.maxPostsPerDay || 3)) {
      return {
        allowed: false,
        reason: `Daily post limit reached (${settings.maxPostsPerDay} posts/day)`,
      };
    }

    if (!settings.autoApprove) {
      return {
        allowed: true,
        requiresApproval: true,
        reason: "Post requires user approval before publishing",
      };
    }

    return {
      allowed: true,
      requiresApproval: false,
    };
  }

  async validateContent(
    content: string,
    context: DecisionContext
  ): Promise<PolicyResult> {
    const { settings } = context;

    if (!content || content.trim().length === 0) {
      return {
        allowed: false,
        reason: "Content cannot be empty",
      };
    }

    if (content.length > 2200) {
      return {
        allowed: false,
        reason: "Content exceeds maximum length (2200 characters)",
      };
    }

    if (settings.noGoTopics && Array.isArray(settings.noGoTopics)) {
      const lowerContent = content.toLowerCase();
      for (const topic of settings.noGoTopics) {
        if (lowerContent.includes(topic.toLowerCase())) {
          return {
            allowed: false,
            reason: `Content contains restricted topic: ${topic}`,
          };
        }
      }
    }

    const blockedPatterns = [
      /\b(buy now|limited offer|act fast)\b/i,
      /\b(guaranteed|100% sure|never fail)\b/i,
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(content)) {
        return {
          allowed: false,
          reason: "Content contains potentially problematic marketing language",
          requiresApproval: true,
        };
      }
    }

    return {
      allowed: true,
    };
  }

  async checkPlatformRules(
    platform: string,
    content: string
  ): Promise<PolicyResult> {
    const platformLimits: Record<string, number> = {
      twitter: 280,
      x: 280,
      instagram: 2200,
      linkedin: 3000,
      tiktok: 2200,
    };

    const limit = platformLimits[platform.toLowerCase()];
    if (limit && content.length > limit) {
      return {
        allowed: false,
        reason: `Content exceeds ${platform} character limit (${limit} chars)`,
      };
    }

    return {
      allowed: true,
    };
  }

  async checkRateLimits(
    userId: string,
    platform: string
  ): Promise<PolicyResult> {
    const rateLimits: Record<string, { perHour: number; perDay: number }> = {
      twitter: { perHour: 5, perDay: 50 },
      x: { perHour: 5, perDay: 50 },
      instagram: { perHour: 3, perDay: 25 },
      linkedin: { perHour: 2, perDay: 20 },
      tiktok: { perHour: 3, perDay: 10 },
    };

    const limits = rateLimits[platform.toLowerCase()];
    if (!limits) {
      return { allowed: true };
    }

    // TODO: Implement actual rate limit checking with Redis/memory cache
    // For now, always allow
    return {
      allowed: true,
    };
  }
}

export const policyEngine = new PolicyEngine();
