import { storage } from "../../storage";

export interface BrandProfile {
  userId: string;
  topTopics: string[];
  avgEngagement: number;
  preferredPlatforms: string[];
  postingFrequency: number;
  bestPostingTimes: number[];
  voiceCharacteristics: string[];
}

export interface PostMemory {
  postId: string;
  caption: string;
  platform: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  } | null;
  postedAt: Date | null;
  topics: string[];
}

class MemoryReader {
  private brandProfiles: Map<string, BrandProfile> = new Map();
  private postMemories: Map<string, PostMemory[]> = new Map();

  async getBrandProfile(userId: string): Promise<BrandProfile | null> {
    const cached = this.brandProfiles.get(userId);
    if (cached) {
      return cached;
    }

    const posts = await storage.getPostsByUserId(userId);
    if (posts.length === 0) {
      return null;
    }

    const profile = await this.buildBrandProfile(userId, posts);
    this.brandProfiles.set(userId, profile);

    return profile;
  }

  async getSimilarPosts(
    userId: string,
    topic: string,
    limit: number = 5
  ): Promise<PostMemory[]> {
    const memories = this.postMemories.get(userId) || [];

    const topicLower = topic.toLowerCase();
    const similar = memories.filter((m) =>
      m.topics.some((t) => t.toLowerCase().includes(topicLower) || topicLower.includes(t.toLowerCase()))
    );

    return similar
      .sort((a, b) => {
        const aEng = a.engagement?.likes ?? 0;
        const bEng = b.engagement?.likes ?? 0;
        return bEng - aEng;
      })
      .slice(0, limit);
  }

  async getTopPerformingPosts(
    userId: string,
    platform?: string,
    limit: number = 10
  ): Promise<PostMemory[]> {
    const posts = await storage.getPostsByUserId(userId);

    let filtered = posts.filter((p) => p.postedAt && p.engagement);
    if (platform) {
      filtered = filtered.filter((p) => p.platform === platform);
    }

    return filtered
      .map((p) => ({
        postId: p.id,
        caption: p.caption,
        platform: p.platform,
        engagement: p.engagement as PostMemory["engagement"],
        postedAt: p.postedAt,
        topics: this.extractTopics(p.caption),
      }))
      .sort((a, b) => {
        const aScore = this.calculateEngagementScore(a.engagement);
        const bScore = this.calculateEngagementScore(b.engagement);
        return bScore - aScore;
      })
      .slice(0, limit);
  }

  async getPostingPatterns(userId: string): Promise<{
    hourlyDistribution: number[];
    weekdayDistribution: number[];
    avgGapHours: number;
  }> {
    const posts = await storage.getPostsByUserId(userId);
    const postedPosts = posts.filter((p) => p.postedAt);

    const hourlyDistribution = Array(24).fill(0);
    const weekdayDistribution = Array(7).fill(0);

    for (const post of postedPosts) {
      const date = new Date(post.postedAt!);
      hourlyDistribution[date.getHours()]++;
      weekdayDistribution[date.getDay()]++;
    }

    let totalGap = 0;
    const sortedPosts = postedPosts.sort(
      (a, b) => new Date(a.postedAt!).getTime() - new Date(b.postedAt!).getTime()
    );

    for (let i = 1; i < sortedPosts.length; i++) {
      const gap = new Date(sortedPosts[i].postedAt!).getTime() - new Date(sortedPosts[i - 1].postedAt!).getTime();
      totalGap += gap / (1000 * 60 * 60);
    }

    const avgGapHours = sortedPosts.length > 1 ? totalGap / (sortedPosts.length - 1) : 24;

    return {
      hourlyDistribution,
      weekdayDistribution,
      avgGapHours,
    };
  }

  private async buildBrandProfile(userId: string, posts: Array<{ caption: string; platform: string; engagement: unknown; postedAt: Date | null }>): Promise<BrandProfile> {
    const allTopics: string[] = [];
    const platforms: Record<string, number> = {};
    let totalEngagement = 0;
    let engagementCount = 0;
    const postingHours: number[] = [];

    for (const post of posts) {
      const topics = this.extractTopics(post.caption);
      allTopics.push(...topics);

      platforms[post.platform] = (platforms[post.platform] || 0) + 1;

      if (post.engagement && typeof post.engagement === "object") {
        const eng = post.engagement as { likes?: number; comments?: number; shares?: number };
        totalEngagement += (eng.likes || 0) + (eng.comments || 0) * 2 + (eng.shares || 0) * 3;
        engagementCount++;
      }

      if (post.postedAt) {
        postingHours.push(new Date(post.postedAt).getHours());
      }
    }

    const topicCounts: Record<string, number> = {};
    for (const topic of allTopics) {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    }

    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic);

    const preferredPlatforms = Object.entries(platforms)
      .sort((a, b) => b[1] - a[1])
      .map(([platform]) => platform);

    const bestPostingTimes = this.findBestPostingTimes(postingHours);

    return {
      userId,
      topTopics,
      avgEngagement: engagementCount > 0 ? totalEngagement / engagementCount : 0,
      preferredPlatforms,
      postingFrequency: posts.length / 30,
      bestPostingTimes,
      voiceCharacteristics: this.analyzeVoice(posts.map((p) => p.caption)),
    };
  }

  private extractTopics(caption: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [];
    let match;

    while ((match = hashtagRegex.exec(caption)) !== null) {
      hashtags.push(match[1].toLowerCase());
    }

    const keywords = caption
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .slice(0, 5);

    return [...new Set([...hashtags, ...keywords])];
  }

  private calculateEngagementScore(engagement: PostMemory["engagement"]): number {
    if (!engagement) return 0;
    return engagement.likes + engagement.comments * 2 + engagement.shares * 3 + engagement.views * 0.01;
  }

  private findBestPostingTimes(hours: number[]): number[] {
    if (hours.length === 0) return [9, 12, 17, 20];

    const hourCounts: Record<number, number> = {};
    for (const hour of hours) {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }

    return Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([hour]) => parseInt(hour))
      .sort((a, b) => a - b);
  }

  private analyzeVoice(captions: string[]): string[] {
    const characteristics: string[] = [];

    const avgLength = captions.reduce((sum, c) => sum + c.length, 0) / captions.length;
    if (avgLength < 100) characteristics.push("concise");
    else if (avgLength > 300) characteristics.push("detailed");

    const questionCount = captions.filter((c) => c.includes("?")).length;
    if (questionCount > captions.length * 0.3) characteristics.push("inquisitive");

    const exclamationCount = captions.filter((c) => c.includes("!")).length;
    if (exclamationCount > captions.length * 0.5) characteristics.push("enthusiastic");

    return characteristics.length > 0 ? characteristics : ["balanced"];
  }

  clearCache(userId?: string): void {
    if (userId) {
      this.brandProfiles.delete(userId);
      this.postMemories.delete(userId);
    } else {
      this.brandProfiles.clear();
      this.postMemories.clear();
    }
  }
}

export const memoryReader = new MemoryReader();
