import { storage } from "../../storage";
import { policyEngine } from "./policyEngine";
import { captionGenerator } from "../ai/captionGenerator";
import { memoryWriter } from "../memory/memoryWriter";
import { scheduler } from "./scheduler";
import type { Decision, Post, SocialAccount, AutopilotSettings } from "@shared/schema";

export interface ActionContext {
  userId: string;
  decision: Decision;
  socialAccount: SocialAccount;
  settings: AutopilotSettings;
}

export interface ActionResult {
  success: boolean;
  post?: Post;
  error?: string;
  requiresApproval?: boolean;
}

class ActionOrchestrator {
  async executeDecision(context: ActionContext): Promise<ActionResult> {
    const { decision, socialAccount, settings } = context;

    if (!decision.suggestedContent) {
      return {
        success: false,
        error: "No suggested content in decision",
      };
    }

    const suggestedContent = decision.suggestedContent as {
      topic?: string;
      platform?: string;
      scheduledTime?: string;
    };

    const caption = await captionGenerator.generate({
      topic: suggestedContent.topic || "general update",
      platform: suggestedContent.platform || socialAccount.platform,
      brandVoice: settings.brandVoice || undefined,
    });

    const policyResult = await policyEngine.validateContent(caption, {
      userId: context.userId,
      socialAccounts: [socialAccount],
      recentPosts: [],
      settings,
      gapHours: 0,
    });

    if (!policyResult.allowed) {
      return {
        success: false,
        error: policyResult.reason,
      };
    }

    const scheduledAt = suggestedContent.scheduledTime
      ? new Date(suggestedContent.scheduledTime)
      : new Date(Date.now() + 15 * 60 * 1000);

    const post = await storage.createPost({
      userId: context.userId,
      socialAccountId: socialAccount.id,
      caption,
      platform: socialAccount.platform,
      scheduledAt,
    });

    if (policyResult.requiresApproval || !settings.autoApprove) {
      await storage.updatePost(post.id, { status: "pending_approval" });

      await storage.updateDecision(decision.id, {
        status: "awaiting_approval",
        resolvedAt: new Date(),
      });

      return {
        success: true,
        post,
        requiresApproval: true,
      };
    }

    await storage.updatePost(post.id, { status: "scheduled" });
    await scheduler.schedulePost(post, scheduledAt);

    await storage.updateDecision(decision.id, {
      status: "approved",
      resolvedAt: new Date(),
    });

    await memoryWriter.recordPost({
      userId: context.userId,
      postId: post.id,
      caption,
      platform: socialAccount.platform,
      scheduledAt,
    });

    return {
      success: true,
      post,
    };
  }

  async approvePost(postId: string): Promise<ActionResult> {
    const post = await storage.getPost(postId);
    if (!post) {
      return { success: false, error: "Post not found" };
    }

    if (post.status !== "pending_approval") {
      return { success: false, error: "Post is not pending approval" };
    }

    await storage.updatePost(postId, { status: "scheduled" });

    const scheduledAt = post.scheduledAt || new Date(Date.now() + 5 * 60 * 1000);
    await scheduler.schedulePost(post, scheduledAt);

    return { success: true, post };
  }

  async rejectPost(postId: string): Promise<ActionResult> {
    const post = await storage.getPost(postId);
    if (!post) {
      return { success: false, error: "Post not found" };
    }

    await storage.updatePost(postId, { status: "rejected" });

    return { success: true, post };
  }

  async publishNow(postId: string): Promise<ActionResult> {
    const post = await storage.getPost(postId);
    if (!post) {
      return { success: false, error: "Post not found" };
    }

    // TODO: Integrate with actual social media APIs
    // For now, just mark as posted
    await storage.updatePost(postId, {
      status: "posted",
      postedAt: new Date(),
    });

    await memoryWriter.recordPost({
      userId: post.userId,
      postId: post.id,
      caption: post.caption,
      platform: post.platform,
      scheduledAt: new Date(),
    });

    return { success: true, post };
  }

  async recordEngagement(
    postId: string,
    engagement: { likes: number; comments: number; shares: number; views: number }
  ): Promise<void> {
    await storage.updatePost(postId, { engagement });

    const post = await storage.getPost(postId);
    if (post) {
      await memoryWriter.recordEngagement({
        userId: post.userId,
        postId,
        platform: post.platform,
        engagement,
      });
    }
  }
}

export const actionOrchestrator = new ActionOrchestrator();
