import {
  type Category, type InsertCategory,
  type Article, type InsertArticle,
  type ContactMessage, type InsertContactMessage,
  type PipelineRun, type InsertPipelineRun,
  type RssFeed, type InsertRssFeed,
  type PipelineSettings,
  categories, articles, contactMessages, pipelineRuns, rssFeeds, pipelineSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  getArticles(): Promise<Article[]>;
  getAllArticles(): Promise<Article[]>;
  getArticleById(id: number): Promise<Article | undefined>;
  getArticlesByCategory(categoryId: number): Promise<Article[]>;
  getArticleBySlug(slug: string): Promise<Article | undefined>;
  getFeaturedArticles(limit: number): Promise<Article[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: number): Promise<boolean>;

  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;

  createPipelineRun(run: InsertPipelineRun): Promise<PipelineRun>;
  getPipelineRuns(limit?: number): Promise<PipelineRun[]>;

  getRssFeeds(): Promise<RssFeed[]>;
  getEnabledRssFeeds(): Promise<RssFeed[]>;
  createRssFeed(feed: InsertRssFeed): Promise<RssFeed>;
  updateRssFeed(id: number, feed: Partial<InsertRssFeed>): Promise<RssFeed | undefined>;
  deleteRssFeed(id: number): Promise<boolean>;

  getPipelineSettings(): Promise<PipelineSettings>;
  updatePipelineSettings(settings: Partial<Omit<PipelineSettings, "id">>): Promise<PipelineSettings>;
}

export class DatabaseStorage implements IStorage {
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async getArticles(): Promise<Article[]> {
    return db.select().from(articles).where(eq(articles.published, true)).orderBy(desc(articles.publishedAt));
  }

  async getArticlesByCategory(categoryId: number): Promise<Article[]> {
    return db.select().from(articles)
      .where(and(eq(articles.categoryId, categoryId), eq(articles.published, true)))
      .orderBy(desc(articles.publishedAt));
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(and(eq(articles.slug, slug), eq(articles.published, true)));
    return article;
  }

  async getFeaturedArticles(limit: number): Promise<Article[]> {
    return db.select().from(articles)
      .where(eq(articles.published, true))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const [created] = await db.insert(articles).values(article).returning();
    return created;
  }

  async getAllArticles(): Promise<Article[]> {
    return db.select().from(articles).orderBy(desc(articles.publishedAt));
  }

  async getArticleById(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined> {
    const [updated] = await db.update(articles).set(article).where(eq(articles.id, id)).returning();
    return updated;
  }

  async deleteArticle(id: number): Promise<boolean> {
    const result = await db.delete(articles).where(eq(articles.id, id)).returning();
    return result.length > 0;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [created] = await db.insert(contactMessages).values(message).returning();
    return created;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async createPipelineRun(run: InsertPipelineRun): Promise<PipelineRun> {
    const [created] = await db.insert(pipelineRuns).values(run).returning();
    return created;
  }

  async getPipelineRuns(limit = 20): Promise<PipelineRun[]> {
    return db.select().from(pipelineRuns).orderBy(desc(pipelineRuns.ranAt)).limit(limit);
  }

  async getRssFeeds(): Promise<RssFeed[]> {
    return db.select().from(rssFeeds).orderBy(rssFeeds.id);
  }

  async getEnabledRssFeeds(): Promise<RssFeed[]> {
    return db.select().from(rssFeeds).where(eq(rssFeeds.enabled, true)).orderBy(rssFeeds.id);
  }

  async createRssFeed(feed: InsertRssFeed): Promise<RssFeed> {
    const [created] = await db.insert(rssFeeds).values(feed).returning();
    return created;
  }

  async updateRssFeed(id: number, feed: Partial<InsertRssFeed>): Promise<RssFeed | undefined> {
    const [updated] = await db.update(rssFeeds).set(feed).where(eq(rssFeeds.id, id)).returning();
    return updated;
  }

  async deleteRssFeed(id: number): Promise<boolean> {
    const result = await db.delete(rssFeeds).where(eq(rssFeeds.id, id)).returning();
    return result.length > 0;
  }

  async getPipelineSettings(): Promise<PipelineSettings> {
    const [row] = await db.select().from(pipelineSettings).limit(1);
    if (row) return row;
    const [created] = await db.insert(pipelineSettings).values({ maxArticlesPerRun: 5 }).returning();
    return created;
  }

  async updatePipelineSettings(settings: Partial<Omit<PipelineSettings, "id">>): Promise<PipelineSettings> {
    const existing = await this.getPipelineSettings();
    const [updated] = await db.update(pipelineSettings).set(settings).where(eq(pipelineSettings.id, existing.id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
