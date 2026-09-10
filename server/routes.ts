import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactMessageSchema, insertArticleSchema, insertCategorySchema, insertRssFeedSchema, patchRssFeedSchema, patchPipelineSettingsSchema, type Article } from "@shared/schema";
import { isAuthenticated } from "./replit_integrations/auth";
import { objectStorageClient } from "./replit_integrations/object_storage";
import multer from "multer";
import path from "path";
import { z } from "zod";
import { rssParser } from "./pipeline/scraper";
import { resolveYouTubeFeedUrl } from "./pipeline/youtube";

const SOURCE_TYPES = ["rss", "youtube"] as const;
type SourceType = typeof SOURCE_TYPES[number];

const addFeedBodySchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  enabled: z.boolean().optional().default(true),
  sourceType: z.enum(SOURCE_TYPES).default("rss"),
});

const testFeedBodySchema = z.object({
  url: z.string().min(1),
  sourceType: z.enum(SOURCE_TYPES).optional().default("rss"),
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error("Only image files are allowed"));
  },
});

function getArticleImageGcsPath(filename: string): { bucketName: string; objectName: string } {
  const paths = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
  const firstPath = paths.split(",")[0].trim().replace(/^\//, "");
  const slashIdx = firstPath.indexOf("/");
  const bucketName = slashIdx === -1 ? firstPath : firstPath.substring(0, slashIdx);
  const prefix = slashIdx === -1 ? "" : firstPath.substring(slashIdx + 1);
  const objectName = prefix ? `${prefix}/article/image/${filename}` : `article/image/${filename}`;
  return { bucketName, objectName };
}

const isAdmin: RequestHandler = (req, res, next) => {
  const user = req.user as any;
  if (!user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (adminIds.length > 0 && !adminIds.includes(user.claims.sub)) {
    return res.status(403).json({ message: "Forbidden: admin access required" });
  }
  next();
};

function stripContent(article: Article) {
  const { content, ...rest } = article;
  return rest;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/categories", async (_req, res) => {
    const cats = await storage.getCategories();
    res.json(cats);
  });

  app.get("/api/categories/:slug", async (req, res) => {
    const category = await storage.getCategoryBySlug(req.params.slug);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  });

  app.get("/api/categories/:slug/articles", async (req, res) => {
    const category = await storage.getCategoryBySlug(req.params.slug);
    if (!category) return res.status(404).json({ message: "Category not found" });
    const arts = await storage.getArticlesByCategory(category.id);
    res.json(arts.map(stripContent));
  });

  app.get("/api/articles", async (_req, res) => {
    const arts = await storage.getArticles();
    res.json(arts.map(stripContent));
  });

  app.get("/api/articles/featured", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 5;
    const arts = await storage.getFeaturedArticles(limit);
    res.json(arts.map(stripContent));
  });

  app.get("/api/articles/:slug", async (req, res) => {
    const article = await storage.getArticleBySlug(req.params.slug);
    if (!article) return res.status(404).json({ message: "Article not found" });
    res.json(article);
  });

  app.post("/api/contact", async (req, res) => {
    const parsed = insertContactMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid form data", errors: parsed.error.issues });
    }
    const msg = await storage.createContactMessage(parsed.data);
    res.status(201).json(msg);
  });

  const patchArticleSchema = insertArticleSchema.partial();
  const patchCategorySchema = insertCategorySchema.partial();

  app.get("/api/admin/articles", isAuthenticated, isAdmin, async (_req, res) => {
    const arts = await storage.getAllArticles();
    res.json(arts.map(stripContent));
  });

  app.get("/api/admin/articles/:id", isAuthenticated, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const article = await storage.getArticleById(id);
    if (!article) return res.status(404).json({ message: "Article not found" });
    res.json(article);
  });

  app.post("/api/admin/articles", isAuthenticated, isAdmin, async (req, res) => {
    const parsed = insertArticleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }
    const article = await storage.createArticle(parsed.data);
    res.status(201).json(article);
  });

  app.patch("/api/admin/articles/:id", isAuthenticated, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const parsed = patchArticleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }
    const updated = await storage.updateArticle(id, parsed.data);
    if (!updated) return res.status(404).json({ message: "Article not found" });
    res.json(updated);
  });

  app.delete("/api/admin/articles/:id", isAuthenticated, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const deleted = await storage.deleteArticle(id);
    if (!deleted) return res.status(404).json({ message: "Article not found" });
    res.json({ message: "Deleted" });
  });

  app.post("/api/admin/categories", isAuthenticated, isAdmin, async (req, res) => {
    const parsed = insertCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }
    const category = await storage.createCategory(parsed.data);
    res.status(201).json(category);
  });

  app.patch("/api/admin/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const parsed = patchCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }
    const updated = await storage.updateCategory(id, parsed.data);
    if (!updated) return res.status(404).json({ message: "Category not found" });
    res.json(updated);
  });

  app.delete("/api/admin/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const deleted = await storage.deleteCategory(id);
    if (!deleted) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Deleted" });
  });

  app.get("/api/admin/messages", isAuthenticated, isAdmin, async (_req, res) => {
    const msgs = await storage.getContactMessages();
    res.json(msgs);
  });

  app.post("/api/admin/upload", isAuthenticated, isAdmin, upload.single("image"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    try {
      const filename = req.file.originalname;
      const { bucketName, objectName } = getArticleImageGcsPath(filename);
      const gcsFile = objectStorageClient.bucket(bucketName).file(objectName);
      await gcsFile.save(req.file.buffer, { contentType: req.file.mimetype, resumable: false });
      const url = `/article/image/${filename}`;
      res.json({ url, filename, originalName: filename });
    } catch (err: any) {
      console.error("GCS upload error:", err);
      res.status(500).json({ message: "Failed to save image to storage" });
    }
  });

  app.get("/article/image/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const { bucketName, objectName } = getArticleImageGcsPath(filename);
      const gcsFile = objectStorageClient.bucket(bucketName).file(objectName);
      const [exists] = await gcsFile.exists();
      if (!exists) return res.status(404).send("Image not found");
      const [metadata] = await gcsFile.getMetadata();
      res.set({
        "Content-Type": (metadata.contentType as string) || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000",
      });
      gcsFile.createReadStream().pipe(res);
    } catch (err: any) {
      console.error("GCS serve error:", err);
      res.status(500).send("Failed to load image");
    }
  });

  // RSS/YouTube Feed test endpoint
  app.post("/api/admin/feeds/test", isAuthenticated, isAdmin, async (req, res) => {
    const parsed = testFeedBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid request", errors: parsed.error.issues });
    }
    const { url, sourceType } = parsed.data;
    try {
      let feedUrl = url;
      if (sourceType === "youtube") {
        feedUrl = await resolveYouTubeFeedUrl(url);
      }
      const Parser = (await import("rss-parser")).default;
      const parser = new Parser({ timeout: 10000, headers: { "User-Agent": "OregonPolitiscape/1.0 RSS Reader" } });
      const feed = await parser.parseURL(feedUrl);
      const itemCount = feed.items?.length ?? 0;
      const title = feed.title || (sourceType === "youtube" ? "YouTube Channel" : "Untitled Feed");
      res.json({ ok: true, title, itemCount, resolvedUrl: sourceType === "youtube" ? feedUrl : undefined });
    } catch (err: any) {
      const msg: string = err.message || String(err);
      if (msg.includes("ENOTFOUND") || msg.includes("ECONNREFUSED") || msg.includes("ETIMEDOUT") || msg.includes("ECONNRESET")) {
        return res.status(422).json({ ok: false, message: "Could not connect to that URL" });
      }
      if (msg.includes("Invalid XML") || msg.includes("Non-whitespace") || msg.includes("parse")) {
        return res.status(422).json({ ok: false, message: "Not a valid feed" });
      }
      return res.status(422).json({ ok: false, message: `Feed error: ${msg}` });
    }
  });

  // RSS Feed management routes
  app.get("/api/admin/feeds", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const feeds = await storage.getRssFeeds();
      res.json(feeds);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/feeds", isAuthenticated, isAdmin, async (req, res) => {
    const bodyParsed = addFeedBodySchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: bodyParsed.error.issues });
    }
    const { sourceType, url, name, enabled } = bodyParsed.data;
    const isYouTube = sourceType === "youtube";

    let resolvedUrl = url;
    if (isYouTube) {
      try {
        resolvedUrl = await resolveYouTubeFeedUrl(url);
      } catch (err: any) {
        return res.status(422).json({ message: `Could not resolve YouTube channel: ${err.message}` });
      }
    }

    const feedParsed = insertRssFeedSchema.safeParse({ name, url: resolvedUrl, enabled, sourceType });
    if (!feedParsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: feedParsed.error.issues });
    }
    try {
      const feed = await storage.createRssFeed(feedParsed.data);
      res.status(201).json(feed);
    } catch (err: any) {
      if (err.message?.includes("unique")) {
        return res.status(409).json({ message: "A feed with that URL already exists" });
      }
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/feeds/:id", isAuthenticated, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const parsed = patchRssFeedSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }
    const updated = await storage.updateRssFeed(id, parsed.data);
    if (!updated) return res.status(404).json({ message: "Feed not found" });
    res.json(updated);
  });

  app.delete("/api/admin/feeds/:id", isAuthenticated, isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const deleted = await storage.deleteRssFeed(id);
    if (!deleted) return res.status(404).json({ message: "Feed not found" });
    res.json({ message: "Deleted" });
  });

  // Pipeline routes
  app.get("/api/admin/pipeline/runs", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const runs = await storage.getPipelineRuns(20);
      res.json(runs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/pipeline/test-category", isAuthenticated, isAdmin, async (req, res) => {
    const { headline, summary, categories } = req.body;
    if (!headline || typeof headline !== "string" || !Array.isArray(categories)) {
      return res.status(400).json({ message: "headline and categories array are required" });
    }
    const invalid = categories.some(
      (c: any) =>
        typeof c !== "object" ||
        typeof c.id !== "number" ||
        typeof c.slug !== "string" ||
        typeof c.name !== "string" ||
        (c.keywords !== null && typeof c.keywords !== "string")
    );
    if (invalid) {
      return res.status(400).json({ message: "Each category must have id (number), slug (string), name (string), and keywords (string|null)" });
    }
    try {
      const { testCategoryMatch } = await import("./pipeline/categoryMatcher");
      const result = testCategoryMatch(categories, headline, summary || "");
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/pipeline/run", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const { runPipeline } = await import("./pipeline/runner");
      const result = await runPipeline();
      res.json(result);
    } catch (err: any) {
      console.error("Pipeline run error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/pipeline/settings", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const settings = await storage.getPipelineSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/admin/pipeline/settings", isAuthenticated, isAdmin, async (req, res) => {
    const parsed = patchPipelineSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.issues });
    }
    try {
      const data = { ...parsed.data };
      if ("notificationEmail" in data && data.notificationEmail === "") {
        data.notificationEmail = null;
      }
      const settings = await storage.updatePipelineSettings(data);
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  function getSiteBase(req: import("express").Request): string {
    if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
    return `${proto}://${host}`;
  }

  function xmlEscape(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }

  function sitemapUrl(loc: string, priority: string, lastmod?: string): string {
    const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
    return `  <url>\n    <loc>${xmlEscape(loc)}</loc>${lastmodTag}\n    <priority>${priority}</priority>\n  </url>`;
  }

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const [arts, cats] = await Promise.all([storage.getArticles(), storage.getCategories()]);
      const base = getSiteBase(req);

      const entries = [
        sitemapUrl(`${base}/`, "1.0"),
        sitemapUrl(`${base}/posts`, "0.8"),
        sitemapUrl(`${base}/about`, "0.6"),
        sitemapUrl(`${base}/contact`, "0.5"),
        ...cats.map(c => sitemapUrl(`${base}/category/${encodeURIComponent(c.slug)}`, "0.7")),
        ...arts.map(a => sitemapUrl(
          `${base}/article/${encodeURIComponent(a.slug)}`,
          "0.9",
          a.publishedAt ? new Date(a.publishedAt).toISOString().split("T")[0] : undefined,
        )),
      ].join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;

      res.set("Content-Type", "application/xml; charset=utf-8");
      res.send(xml);
    } catch (err: any) {
      console.error("Sitemap error:", err);
      res.status(500).send("Failed to generate sitemap");
    }
  });

  app.get("/robots.txt", (req, res) => {
    const base = getSiteBase(req);
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${base}/sitemap.xml\n`);
  });

  return httpServer;
}
