import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});

export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  platform: text("platform").notNull(),
  handle: text("handle").notNull(),
  accessToken: text("access_token"),
  isConnected: boolean("is_connected").default(true),
  lastSync: timestamp("last_sync"),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  socialAccountId: varchar("social_account_id").notNull(),
  caption: text("caption").notNull(),
  imageUrl: text("image_url"),
  platform: text("platform").notNull(),
  status: text("status").notNull().default("pending"),
  scheduledAt: timestamp("scheduled_at"),
  postedAt: timestamp("posted_at"),
  engagement: jsonb("engagement"),
});

export const autopilotSettings = pgTable("autopilot_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  enabled: boolean("enabled").default(false),
  autoApprove: boolean("auto_approve").default(false),
  maxPostsPerDay: integer("max_posts_per_day").default(3),
  postingGapHours: integer("posting_gap_hours").default(6),
  brandVoice: text("brand_voice"),
  noGoTopics: text("no_go_topics").array(),
});

export const decisions = pgTable("decisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  decisionType: text("decision_type").notNull(),
  status: text("status").notNull().default("pending"),
  reasoning: text("reasoning"),
  suggestedContent: jsonb("suggested_content"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const waitlistEntries = pgTable("waitlist_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).pick({
  userId: true,
  platform: true,
  handle: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  userId: true,
  socialAccountId: true,
  caption: true,
  imageUrl: true,
  platform: true,
  scheduledAt: true,
});

export const insertAutopilotSettingsSchema = createInsertSchema(autopilotSettings).pick({
  userId: true,
  enabled: true,
  autoApprove: true,
  maxPostsPerDay: true,
  postingGapHours: true,
  brandVoice: true,
});

export const insertDecisionSchema = createInsertSchema(decisions).pick({
  userId: true,
  decisionType: true,
  reasoning: true,
  suggestedContent: true,
});

export const insertWaitlistSchema = createInsertSchema(waitlistEntries).pick({
  email: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export type InsertAutopilotSettings = z.infer<typeof insertAutopilotSettingsSchema>;
export type AutopilotSettings = typeof autopilotSettings.$inferSelect;

export type InsertDecision = z.infer<typeof insertDecisionSchema>;
export type Decision = typeof decisions.$inferSelect;

export type InsertWaitlistEntry = z.infer<typeof insertWaitlistSchema>;
export type WaitlistEntry = typeof waitlistEntries.$inferSelect;
