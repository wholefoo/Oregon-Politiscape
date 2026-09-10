import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  keywords: text("keywords"),
});

export const insertCategorySchema = createInsertSchema(categories);
export type InsertCategory = typeof categories.$inferInsert;
export type Category = typeof categories.$inferSelect;

export const articles = pgTable("articles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  categoryId: integer("category_id").notNull(),
  published: boolean("published").default(true),
  publishedAt: timestamp("published_at").defaultNow(),
});

export const insertArticleSchema = createInsertSchema(articles);
export type InsertArticle = typeof articles.$inferInsert;
export type Article = typeof articles.$inferSelect;

export const contactMessages = pgTable("contact_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages);
export type InsertContactMessage = typeof contactMessages.$inferInsert;
export type ContactMessage = typeof contactMessages.$inferSelect;

export const pipelineRuns = pgTable("pipeline_runs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  ranAt: timestamp("ran_at").defaultNow().notNull(),
  sourcesChecked: integer("sources_checked").notNull().default(0),
  articlesGenerated: integer("articles_generated").notNull().default(0),
  status: text("status").notNull().default("success"),
  errorMessage: text("error_message"),
  categoriesAssigned: text("categories_assigned"),
});

export const insertPipelineRunSchema = createInsertSchema(pipelineRuns);
export type InsertPipelineRun = typeof pipelineRuns.$inferInsert;
export type PipelineRun = typeof pipelineRuns.$inferSelect;

export const rssFeeds = pgTable("rss_feeds", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  enabled: boolean("enabled").notNull().default(true),
  sourceType: text("source_type").notNull().default("rss"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRssFeedSchema = createInsertSchema(rssFeeds);
export const patchRssFeedSchema = insertRssFeedSchema.pick({ name: true, url: true, enabled: true, sourceType: true }).partial();
export type InsertRssFeed = typeof rssFeeds.$inferInsert;
export type RssFeed = typeof rssFeeds.$inferSelect;

export const pipelineSettings = pgTable("pipeline_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  maxArticlesPerRun: integer("max_articles_per_run").notNull().default(5),
  notificationEmail: text("notification_email"),
});

export const insertPipelineSettingsSchema = createInsertSchema(pipelineSettings);
export const patchPipelineSettingsSchema = z.object({
  maxArticlesPerRun: z.number().int().min(1).max(50),
  notificationEmail: z.string().email().or(z.literal("")).nullable(),
}).partial();
export type InsertPipelineSettings = typeof pipelineSettings.$inferInsert;
export type PipelineSettings = typeof pipelineSettings.$inferSelect;
