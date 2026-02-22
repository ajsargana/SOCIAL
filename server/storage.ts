import {
  users,
  socialAccounts,
  posts,
  autopilotSettings,
  decisions,
  waitlistEntries,
  type User,
  type InsertUser,
  type SocialAccount,
  type InsertSocialAccount,
  type Post,
  type InsertPost,
  type AutopilotSettings,
  type InsertAutopilotSettings,
  type Decision,
  type InsertDecision,
  type WaitlistEntry,
  type InsertWaitlistEntry,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  incrementPostUsage(id: string): Promise<void>;

  getSocialAccountsByUserId(userId: string): Promise<SocialAccount[]>;
  getSocialAccount(id: string): Promise<SocialAccount | undefined>;
  createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount>;
  updateSocialAccount(id: string, updates: Partial<SocialAccount>): Promise<SocialAccount | undefined>;
  deleteSocialAccount(id: string): Promise<boolean>;

  getPostsByUserId(userId: string): Promise<Post[]>;
  getPost(id: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, updates: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: string): Promise<boolean>;

  getAutopilotSettings(userId: string): Promise<AutopilotSettings | undefined>;
  createAutopilotSettings(settings: InsertAutopilotSettings): Promise<AutopilotSettings>;
  updateAutopilotSettings(userId: string, updates: Partial<AutopilotSettings>): Promise<AutopilotSettings | undefined>;

  getDecisionsByUserId(userId: string): Promise<Decision[]>;
  getDecision(id: string): Promise<Decision | undefined>;
  createDecision(decision: InsertDecision): Promise<Decision>;
  updateDecision(id: string, updates: Partial<Decision>): Promise<Decision | undefined>;

  getWaitlistEntry(email: string): Promise<WaitlistEntry | undefined>;
  createWaitlistEntry(entry: InsertWaitlistEntry): Promise<WaitlistEntry>;
  getAllWaitlistEntries(): Promise<WaitlistEntry[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async incrementPostUsage(id: string): Promise<void> {
    const user = await this.getUser(id);
    if (user) {
      await db
        .update(users)
        .set({ postsUsedThisMonth: (user.postsUsedThisMonth || 0) + 1 })
        .where(eq(users.id, id));
    }
  }

  async getSocialAccountsByUserId(userId: string): Promise<SocialAccount[]> {
    return db.select().from(socialAccounts).where(eq(socialAccounts.userId, userId));
  }

  async getSocialAccount(id: string): Promise<SocialAccount | undefined> {
    const [account] = await db.select().from(socialAccounts).where(eq(socialAccounts.id, id));
    return account || undefined;
  }

  async createSocialAccount(insertAccount: InsertSocialAccount): Promise<SocialAccount> {
    const [account] = await db.insert(socialAccounts).values(insertAccount).returning();
    return account;
  }

  async updateSocialAccount(id: string, updates: Partial<SocialAccount>): Promise<SocialAccount | undefined> {
    const [account] = await db.update(socialAccounts).set(updates).where(eq(socialAccounts.id, id)).returning();
    return account || undefined;
  }

  async deleteSocialAccount(id: string): Promise<boolean> {
    const result = await db.delete(socialAccounts).where(eq(socialAccounts.id, id)).returning();
    return result.length > 0;
  }

  async getPostsByUserId(userId: string): Promise<Post[]> {
    return db.select().from(posts).where(eq(posts.userId, userId));
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db.insert(posts).values(insertPost).returning();
    return post;
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post | undefined> {
    const [post] = await db.update(posts).set(updates).where(eq(posts.id, id)).returning();
    return post || undefined;
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id)).returning();
    return result.length > 0;
  }

  async getAutopilotSettings(userId: string): Promise<AutopilotSettings | undefined> {
    const [settings] = await db.select().from(autopilotSettings).where(eq(autopilotSettings.userId, userId));
    return settings || undefined;
  }

  async createAutopilotSettings(insertSettings: InsertAutopilotSettings): Promise<AutopilotSettings> {
    const [settings] = await db.insert(autopilotSettings).values(insertSettings).returning();
    return settings;
  }

  async updateAutopilotSettings(userId: string, updates: Partial<AutopilotSettings>): Promise<AutopilotSettings | undefined> {
    const [settings] = await db.update(autopilotSettings).set(updates).where(eq(autopilotSettings.userId, userId)).returning();
    return settings || undefined;
  }

  async getDecisionsByUserId(userId: string): Promise<Decision[]> {
    return db.select().from(decisions).where(eq(decisions.userId, userId));
  }

  async getDecision(id: string): Promise<Decision | undefined> {
    const [decision] = await db.select().from(decisions).where(eq(decisions.id, id));
    return decision || undefined;
  }

  async createDecision(insertDecision: InsertDecision): Promise<Decision> {
    const [decision] = await db.insert(decisions).values(insertDecision).returning();
    return decision;
  }

  async updateDecision(id: string, updates: Partial<Decision>): Promise<Decision | undefined> {
    const [decision] = await db.update(decisions).set(updates).where(eq(decisions.id, id)).returning();
    return decision || undefined;
  }

  async getWaitlistEntry(email: string): Promise<WaitlistEntry | undefined> {
    const [entry] = await db.select().from(waitlistEntries).where(eq(waitlistEntries.email, email));
    return entry || undefined;
  }

  async createWaitlistEntry(insertEntry: InsertWaitlistEntry): Promise<WaitlistEntry> {
    const [entry] = await db.insert(waitlistEntries).values(insertEntry).returning();
    return entry;
  }

  async getAllWaitlistEntries(): Promise<WaitlistEntry[]> {
    return db.select().from(waitlistEntries);
  }
}

export const storage = new DatabaseStorage();
