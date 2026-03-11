import { storage } from "../../storage";
import { decisionEngine } from "./decisionEngine";
import type { Post } from "@shared/schema";

export interface ScheduledJob {
  id: string;
  userId: string;
  type: "evaluate" | "post" | "analyze";
  scheduledAt: Date;
  status: "pending" | "processing" | "completed" | "failed";
  data?: Record<string, unknown>;
}

class Scheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private intervalId: NodeJS.Timeout | null = null;

  start(intervalMs: number = 60000): void {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.processJobs();
      this.processJobs_extra();
    }, intervalMs);

    console.log(`[Scheduler] Started with interval ${intervalMs}ms`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("[Scheduler] Stopped");
    }
  }

  async scheduleEvaluation(userId: string, scheduledAt: Date): Promise<ScheduledJob> {
    const job: ScheduledJob = {
      id: `eval_${userId}_${Date.now()}`,
      userId,
      type: "evaluate",
      scheduledAt,
      status: "pending",
    };

    this.jobs.set(job.id, job);
    return job;
  }

  async schedulePost(post: Post, scheduledAt: Date): Promise<ScheduledJob> {
    const job: ScheduledJob = {
      id: `post_${post.id}_${Date.now()}`,
      userId: post.userId,
      type: "post",
      scheduledAt,
      status: "pending",
      data: { postId: post.id },
    };

    this.jobs.set(job.id, job);
    return job;
  }

  private async processJobs(): Promise<void> {
    const now = new Date();

    for (const [id, job] of this.jobs.entries()) {
      if (job.status !== "pending") continue;
      if (job.scheduledAt > now) continue;

      job.status = "processing";

      try {
        switch (job.type) {
          case "evaluate":
            await this.processEvaluationJob(job);
            break;
          case "post":
            await this.processPostJob(job);
            break;
          case "analyze":
            await this.processAnalyzeJob(job);
            break;
        }

        job.status = "completed";
      } catch (error) {
        console.error(`[Scheduler] Job ${id} failed:`, error);
        job.status = "failed";
      }
    }

    this.cleanupCompletedJobs();
  }

  private async processEvaluationJob(job: ScheduledJob): Promise<void> {
    const result = await decisionEngine.evaluatePostingNeed(job.userId);

    if (result.shouldPost && result.scheduledTime) {
      console.log(`[Scheduler] User ${job.userId} needs a post. Decision: ${result.reasoning}`);
    }
  }

  private async processPostJob(job: ScheduledJob): Promise<void> {
    const postId = job.data?.postId as string;
    if (!postId) return;

    const post = await storage.getPost(postId);
    if (!post || post.status !== "scheduled") return;

    await storage.updatePost(postId, {
      status: "posted",
      postedAt: new Date(),
    });

    console.log(`[Scheduler] Posted content for user ${job.userId}: ${post.caption.substring(0, 50)}...`);
  }

  private async processAnalyzeJob(_job: ScheduledJob): Promise<void> {
    console.log("[Scheduler] Analyze job - not yet implemented");
  }

  // Reset monthly post usage for users whose reset date has passed
  private async resetMonthlyUsage(): Promise<void> {
    try {
      const { db } = await import("../../db");
      const { users } = await import("@shared/schema");
      const { lte } = await import("drizzle-orm");
      const now = new Date();
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      await db
        .update(users)
        .set({ postsUsedThisMonth: 0, usageResetAt: nextReset })
        .where(lte(users.usageResetAt, now));
    } catch (err) {
      console.error("[Scheduler] Monthly reset error:", err);
    }
  }

  private async processJobs_extra(): Promise<void> {
    await this.resetMonthlyUsage();
  }

  private cleanupCompletedJobs(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    for (const [id, job] of this.jobs.entries()) {
      if (
        (job.status === "completed" || job.status === "failed") &&
        job.scheduledAt.getTime() < oneHourAgo
      ) {
        this.jobs.delete(id);
      }
    }
  }

  getJobStatus(jobId: string): ScheduledJob | undefined {
    return this.jobs.get(jobId);
  }

  getPendingJobs(userId?: string): ScheduledJob[] {
    const jobs = Array.from(this.jobs.values()).filter((j) => j.status === "pending");
    if (userId) {
      return jobs.filter((j) => j.userId === userId);
    }
    return jobs;
  }
}

export const scheduler = new Scheduler();
