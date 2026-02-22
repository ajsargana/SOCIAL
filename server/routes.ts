import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth } from "./auth";
import { insertWaitlistSchema, PLAN_LIMITS } from "@shared/schema";
import { decisionEngine } from "./src/core/decisionEngine";
import { actionOrchestrator } from "./src/core/actionOrchestrator";
import { scheduler } from "./src/core/scheduler";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Start the background scheduler
  scheduler.start(60_000);

  // ─── Waitlist (public) ─────────────────────────────────────────────────────
  app.post("/api/waitlist", async (req, res) => {
    try {
      const parsed = insertWaitlistSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid email" });

      const existing = await storage.getWaitlistEntry(parsed.data.email);
      if (existing) return res.status(409).json({ error: "Email already registered" });

      const entry = await storage.createWaitlistEntry(parsed.data);
      return res.status(201).json(entry);
    } catch {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Social accounts ──────────────────────────────────────────────────────
  app.get("/api/social-accounts", requireAuth, async (req, res) => {
    try {
      const accounts = await storage.getSocialAccountsByUserId(req.session.userId!);
      return res.json(accounts);
    } catch {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/social-accounts", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const limits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS];
      const existing = await storage.getSocialAccountsByUserId(user.id);
      if (limits.maxSocialAccounts !== Infinity && existing.length >= limits.maxSocialAccounts) {
        return res.status(403).json({
          error: `Your ${user.plan} plan supports up to ${limits.maxSocialAccounts} social accounts. Upgrade to add more.`,
        });
      }

      const account = await storage.createSocialAccount({
        ...req.body,
        userId: user.id,
      });
      return res.status(201).json(account);
    } catch (err) {
      console.error("[POST /api/social-accounts]", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/social-accounts/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteSocialAccount(req.params.id);
      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Posts ────────────────────────────────────────────────────────────────
  app.get("/api/posts", requireAuth, async (req, res) => {
    try {
      const posts = await storage.getPostsByUserId(req.session.userId!);
      return res.json(posts);
    } catch {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const limits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS];
      if (user.postsUsedThisMonth >= limits.maxPostsPerMonth) {
        return res.status(403).json({
          error: `Monthly post limit reached for your ${user.plan} plan. Upgrade to post more.`,
        });
      }

      const post = await storage.createPost({ ...req.body, userId: user.id });
      await storage.incrementPostUsage(user.id);
      return res.status(201).json(post);
    } catch {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const post = await storage.updatePost(req.params.id, req.body);
      if (!post) return res.status(404).json({ error: "Post not found" });
      return res.json(post);
    } catch {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Post approval / rejection / publish
  app.post("/api/posts/:id/approve", requireAuth, async (req, res) => {
    try {
      const result = await actionOrchestrator.approvePost(req.params.id);
      if (!result.success) return res.status(400).json({ error: result.error });
      return res.json(result);
    } catch {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/posts/:id/reject", requireAuth, async (req, res) => {
    try {
      const result = await actionOrchestrator.rejectPost(req.params.id);
      if (!result.success) return res.status(400).json({ error: result.error });
      return res.json(result);
    } catch {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/posts/:id/publish", requireAuth, async (req, res) => {
    try {
      const result = await actionOrchestrator.publishNow(req.params.id);
      if (!result.success) return res.status(400).json({ error: result.error });
      return res.json(result);
    } catch {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Autopilot settings ───────────────────────────────────────────────────
  app.get("/api/autopilot", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getAutopilotSettings(req.session.userId!);
      return res.json(settings || null);
    } catch {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/autopilot", requireAuth, async (req, res) => {
    try {
      const settings = await storage.createAutopilotSettings({
        ...req.body,
        userId: req.session.userId!,
      });
      return res.status(201).json(settings);
    } catch {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/autopilot", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      let settings = await storage.getAutopilotSettings(userId);

      if (!settings) {
        settings = await storage.createAutopilotSettings({ ...req.body, userId });
      } else {
        settings = await storage.updateAutopilotSettings(userId, req.body) ?? settings;
      }
      return res.json(settings);
    } catch {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Decision engine ──────────────────────────────────────────────────────
  app.get("/api/decisions", requireAuth, async (req, res) => {
    try {
      const decisions = await storage.getDecisionsByUserId(req.session.userId!);
      return res.json(decisions);
    } catch {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Trigger a real on-demand evaluation
  app.post("/api/decisions/evaluate", requireAuth, async (req, res) => {
    try {
      const result = await decisionEngine.evaluatePostingNeed(req.session.userId!);

      if (result.shouldPost && result.decision) {
        const accounts = await storage.getSocialAccountsByUserId(req.session.userId!);
        const account = accounts.find((a) => a.platform === result.platform) || accounts[0];
        const settings = await storage.getAutopilotSettings(req.session.userId!);

        if (account && settings) {
          const actionResult = await actionOrchestrator.executeDecision({
            userId: req.session.userId!,
            decision: result.decision,
            socialAccount: account,
            settings,
          });
          return res.json({ ...result, actionResult });
        }
      }

      return res.json(result);
    } catch (err) {
      console.error("[evaluate]", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/decisions/:id", requireAuth, async (req, res) => {
    try {
      const decision = await storage.updateDecision(req.params.id, req.body);
      if (!decision) return res.status(404).json({ error: "Decision not found" });
      return res.json(decision);
    } catch {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Onboarding ───────────────────────────────────────────────────────────
  app.post("/api/onboarding/complete", requireAuth, async (req, res) => {
    try {
      await storage.updateUser(req.session.userId!, { onboardingCompleted: true });
      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Analytics ────────────────────────────────────────────────────────────
  app.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const [posts, decisions, accounts] = await Promise.all([
        storage.getPostsByUserId(userId),
        storage.getDecisionsByUserId(userId),
        storage.getSocialAccountsByUserId(userId),
      ]);

      const now = Date.now();
      const last30Days = now - 30 * 24 * 60 * 60 * 1000;
      const last7Days = now - 7 * 24 * 60 * 60 * 1000;

      const postedPosts = posts.filter((p) => p.status === "posted");
      const recentPosts = postedPosts.filter((p) => p.postedAt && new Date(p.postedAt).getTime() > last30Days);
      const weekPosts = postedPosts.filter((p) => p.postedAt && new Date(p.postedAt).getTime() > last7Days);

      const totalEngagement = recentPosts.reduce((sum, p) => {
        const eng = p.engagement as { likes?: number; comments?: number; shares?: number } | null;
        if (!eng) return sum;
        return sum + (eng.likes || 0) + (eng.comments || 0) + (eng.shares || 0);
      }, 0);

      const platformBreakdown = recentPosts.reduce((acc: Record<string, number>, p) => {
        acc[p.platform] = (acc[p.platform] || 0) + 1;
        return acc;
      }, {});

      const pendingDecisions = decisions.filter((d) => d.status === "pending").length;
      const autoPosted = decisions.filter((d) => d.status === "approved").length;

      return res.json({
        totalPosts: postedPosts.length,
        postsLast30Days: recentPosts.length,
        postsLast7Days: weekPosts.length,
        totalEngagement,
        avgEngagement: recentPosts.length > 0 ? Math.round(totalEngagement / recentPosts.length) : 0,
        platformBreakdown,
        connectedAccounts: accounts.filter((a) => a.isConnected).length,
        pendingDecisions,
        autoPosted,
        pendingApproval: posts.filter((p) => p.status === "pending_approval").length,
        scheduled: posts.filter((p) => p.status === "scheduled").length,
      });
    } catch {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
