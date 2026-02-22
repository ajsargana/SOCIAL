export interface PostRecord {
  userId: string;
  postId: string;
  caption: string;
  platform: string;
  scheduledAt: Date;
}

export interface EngagementRecord {
  userId: string;
  postId: string;
  platform: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
}

export interface BrandVoiceUpdate {
  userId: string;
  samples: string[];
  preferredTopics?: string[];
  avoidTopics?: string[];
}

class MemoryWriter {
  private postHistory: Map<string, PostRecord[]> = new Map();
  private engagementHistory: Map<string, EngagementRecord[]> = new Map();

  async recordPost(record: PostRecord): Promise<void> {
    const history = this.postHistory.get(record.userId) || [];
    history.push(record);

    if (history.length > 1000) {
      history.shift();
    }

    this.postHistory.set(record.userId, history);

    console.log(`[MemoryWriter] Recorded post ${record.postId} for user ${record.userId}`);
  }

  async recordEngagement(record: EngagementRecord): Promise<void> {
    const history = this.engagementHistory.get(record.userId) || [];

    const existingIndex = history.findIndex((e) => e.postId === record.postId);
    if (existingIndex >= 0) {
      history[existingIndex] = record;
    } else {
      history.push(record);
    }

    if (history.length > 1000) {
      history.shift();
    }

    this.engagementHistory.set(record.userId, history);

    console.log(`[MemoryWriter] Recorded engagement for post ${record.postId}`);
  }

  async updateBrandVoice(update: BrandVoiceUpdate): Promise<void> {
    // TODO: Implement brand voice learning
    // This would analyze the samples and update a brand voice profile
    console.log(`[MemoryWriter] Brand voice update for user ${update.userId} with ${update.samples.length} samples`);
  }

  async recordTopicPerformance(
    userId: string,
    topic: string,
    performance: { impressions: number; engagement: number }
  ): Promise<void> {
    // TODO: Store topic performance for future recommendations
    console.log(`[MemoryWriter] Topic "${topic}" for user ${userId}: ${performance.engagement} engagement`);
  }

  async recordOptimalTiming(
    userId: string,
    platform: string,
    timing: { hour: number; dayOfWeek: number; engagementRate: number }
  ): Promise<void> {
    // TODO: Store timing data for optimal scheduling
    console.log(`[MemoryWriter] Optimal timing for ${platform}: ${timing.hour}:00 on day ${timing.dayOfWeek}`);
  }

  getPostHistory(userId: string): PostRecord[] {
    return this.postHistory.get(userId) || [];
  }

  getEngagementHistory(userId: string): EngagementRecord[] {
    return this.engagementHistory.get(userId) || [];
  }

  async exportUserData(userId: string): Promise<{
    posts: PostRecord[];
    engagement: EngagementRecord[];
  }> {
    return {
      posts: this.getPostHistory(userId),
      engagement: this.getEngagementHistory(userId),
    };
  }

  async clearUserData(userId: string): Promise<void> {
    this.postHistory.delete(userId);
    this.engagementHistory.delete(userId);
    console.log(`[MemoryWriter] Cleared all data for user ${userId}`);
  }
}

export const memoryWriter = new MemoryWriter();
