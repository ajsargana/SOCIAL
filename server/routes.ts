import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWaitlistSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/waitlist", async (req, res) => {
    try {
      const parsed = insertWaitlistSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid email" });
      }

      const existing = await storage.getWaitlistEntry(parsed.data.email);
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const entry = await storage.createWaitlistEntry(parsed.data);
      return res.status(201).json(entry);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/waitlist", async (_req, res) => {
    try {
      const entries = await storage.getAllWaitlistEntries();
      return res.json(entries);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/social-accounts/:userId", async (req, res) => {
    try {
      const accounts = await storage.getSocialAccountsByUserId(req.params.userId);
      return res.json(accounts);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/social-accounts", async (req, res) => {
    try {
      const account = await storage.createSocialAccount(req.body);
      return res.status(201).json(account);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/posts/:userId", async (req, res) => {
    try {
      const posts = await storage.getPostsByUserId(req.params.userId);
      return res.json(posts);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const post = await storage.createPost(req.body);
      return res.status(201).json(post);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.updatePost(req.params.id, req.body);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      return res.json(post);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/autopilot/:userId", async (req, res) => {
    try {
      const settings = await storage.getAutopilotSettings(req.params.userId);
      if (!settings) {
        return res.status(404).json({ error: "Settings not found" });
      }
      return res.json(settings);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/autopilot", async (req, res) => {
    try {
      const settings = await storage.createAutopilotSettings(req.body);
      return res.status(201).json(settings);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/autopilot/:userId", async (req, res) => {
    try {
      const settings = await storage.updateAutopilotSettings(req.params.userId, req.body);
      if (!settings) {
        return res.status(404).json({ error: "Settings not found" });
      }
      return res.json(settings);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/decisions/:userId", async (req, res) => {
    try {
      const decisions = await storage.getDecisionsByUserId(req.params.userId);
      return res.json(decisions);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/decisions", async (req, res) => {
    try {
      const decision = await storage.createDecision(req.body);
      return res.status(201).json(decision);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/decisions/:id", async (req, res) => {
    try {
      const decision = await storage.updateDecision(req.params.id, req.body);
      if (!decision) {
        return res.status(404).json({ error: "Decision not found" });
      }
      return res.json(decision);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
