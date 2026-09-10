import sanitizeHtml from "sanitize-html";
import { fetchRssItems } from "./scraper";
import { generateArticle } from "./generator";
import { pickBestCategory } from "./categoryMatcher";
import { storage } from "../storage";
import { sendDraftNotification, sendErrorNotification } from "./emailNotifier";

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "strong", "em", "b", "i", "u", "s",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "a", "img",
  "div", "span", "section", "article",
  "table", "thead", "tbody", "tr", "th", "td",
];

function sanitizeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https"],
    allowedSchemesByTag: { img: ["http", "https", "/"] },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: "noopener noreferrer", target: "_blank" },
      }),
    },
  });
}

function dedupeKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 60);
}

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with",
  "is","are","was","were","be","been","being","have","has","had","do","does",
  "did","will","would","could","should","may","might","shall","can",
  "that","this","these","those","it","its","by","from","as","into","about",
  "how","why","what","when","where","who","which","not","no","new","says",
  "said","after","before","over","more","than","up","out","if","their",
]);

function significantWords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
  );
}

function isTooSimilar(rssTitle: string, existingTitles: string[]): boolean {
  const rssWords = significantWords(rssTitle);
  if (rssWords.size === 0) return false;
  for (const existing of existingTitles) {
    const existingWords = significantWords(existing);
    let shared = 0;
    for (const w of rssWords) {
      if (existingWords.has(w)) shared++;
    }
    const overlap = shared / Math.min(rssWords.size, existingWords.size || 1);
    if (overlap >= 0.5 && shared >= 2) {
      return true;
    }
  }
  return false;
}

export async function runPipeline(): Promise<{
  sourcesChecked: number;
  articlesGenerated: number;
  status: "success" | "partial" | "error";
  errorMessage?: string;
}> {
  console.log("[pipeline] Starting content pipeline run...");

  let sourcesChecked = 0;
  let articlesGenerated = 0;

  try {
    const enabledFeeds = await storage.getEnabledRssFeeds();
    const feedConfigs = enabledFeeds.map((f) => ({ name: f.name, url: f.url, sourceType: f.sourceType }));
    if (feedConfigs.length === 0) {
      console.log("[pipeline] No enabled RSS feeds configured — skipping run");
      await storage.createPipelineRun({ sourcesChecked: 0, articlesGenerated: 0, status: "success", categoriesAssigned: null });
      return { sourcesChecked: 0, articlesGenerated: 0, status: "success" };
    }
    const { maxArticlesPerRun, notificationEmail } = await storage.getPipelineSettings();

    const { items, sourcesChecked: checked, feedsFailed } = await fetchRssItems(feedConfigs);
    sourcesChecked = checked;
    console.log(`[pipeline] Fetched ${items.length} relevant items from ${checked} sources (${feedsFailed} failed)`);

    if (items.length === 0) {
      const allFailed = feedsFailed === feedConfigs.length;
      if (allFailed) {
        const msg = `All ${feedsFailed} RSS feed${feedsFailed === 1 ? "" : "s"} failed to load — no items retrieved`;
        console.warn(`[pipeline] ${msg}`);
        await storage.createPipelineRun({ sourcesChecked, articlesGenerated: 0, status: "error", errorMessage: msg, categoriesAssigned: null });
        await sendErrorNotification("error", msg, 0, notificationEmail);
        return { sourcesChecked, articlesGenerated: 0, status: "error", errorMessage: msg };
      }
      await storage.createPipelineRun({ sourcesChecked, articlesGenerated: 0, status: "success", categoriesAssigned: null });
      return { sourcesChecked, articlesGenerated: 0, status: "success" };
    }

    const existingArticles = await storage.getAllArticles();
    const existingSlugs = new Set(existingArticles.map((a) => a.slug));
    const existingTitles = new Set(existingArticles.map((a) => dedupeKey(a.title)));
    const existingTitleList = existingArticles.map((a) => a.title);

    const categories = await storage.getCategories();

    if (categories.length === 0) {
      const msg = "No categories found — cannot generate articles";
      await storage.createPipelineRun({ sourcesChecked, articlesGenerated: 0, status: "error", errorMessage: msg, categoriesAssigned: null });
      await sendErrorNotification("error", msg, 0, notificationEmail);
      return { sourcesChecked, articlesGenerated: 0, status: "error", errorMessage: msg };
    }

    const shuffled = items.sort(() => Math.random() - 0.5);
    const candidates = shuffled.slice(0, maxArticlesPerRun * 3);

    let errors: string[] = [];
    const assignedCategoryNames = new Set<string>();
    const generatedTitles: string[] = [];

    for (const item of candidates) {
      if (articlesGenerated >= maxArticlesPerRun) break;

      try {
        if (isTooSimilar(item.title, existingTitleList)) {
          console.log(`[pipeline] Skipping (similar topic exists): ${item.title}`);
          continue;
        }

        const bestCategory = pickBestCategory(
          categories,
          item.title,
          item.summary || item.content?.substring(0, 500) || ""
        );

        console.log(`[pipeline] Matched "${item.title}" → category: ${bestCategory.name}`);

        const generated = await generateArticle(item, bestCategory.name);

        if (existingSlugs.has(generated.slug) || existingTitles.has(dedupeKey(generated.title))) {
          console.log(`[pipeline] Skipping duplicate: ${generated.title}`);
          continue;
        }

        const excerpt = `[AI Draft] ${generated.excerpt}`;
        const safeContent = sanitizeContent(generated.content);

        await storage.createArticle({
          title: generated.title,
          slug: generated.slug,
          excerpt,
          content: safeContent,
          featuredImage: null,
          categoryId: bestCategory.id,
          published: false,
          publishedAt: new Date(),
        });

        assignedCategoryNames.add(bestCategory.name);
        existingSlugs.add(generated.slug);
        existingTitles.add(dedupeKey(generated.title));
        existingTitleList.push(generated.title);
        generatedTitles.push(generated.title);
        articlesGenerated++;
        console.log(`[pipeline] Created draft: ${generated.title} [${bestCategory.name}]`);
      } catch (err: any) {
        console.error(`[pipeline] Failed to generate article for "${item.title}":`, err.message);
        errors.push(err.message);
      }
    }

    const status = errors.length > 0 && articlesGenerated === 0 ? "error" : errors.length > 0 ? "partial" : "success";
    const errorMessage = errors.length > 0 ? errors.slice(0, 3).join("; ") : undefined;
    const categoriesAssigned = assignedCategoryNames.size > 0
      ? JSON.stringify(Array.from(assignedCategoryNames))
      : null;

    await storage.createPipelineRun({ sourcesChecked, articlesGenerated, status, errorMessage, categoriesAssigned });
    console.log(`[pipeline] Run complete: ${articlesGenerated} articles created, status=${status}, categories=${categoriesAssigned}`);

    if (generatedTitles.length > 0) {
      await sendDraftNotification(generatedTitles, notificationEmail);
    }

    if ((status === "error" || status === "partial") && errorMessage) {
      await sendErrorNotification(status, errorMessage, articlesGenerated, notificationEmail);
    }

    return { sourcesChecked, articlesGenerated, status, errorMessage };
  } catch (err: any) {
    console.error("[pipeline] Fatal pipeline error:", err.message);
    let notificationEmail: string | null = null;
    try {
      const settings = await storage.getPipelineSettings();
      notificationEmail = settings.notificationEmail ?? null;
    } catch {}
    try {
      await storage.createPipelineRun({ sourcesChecked, articlesGenerated, status: "error", errorMessage: err.message, categoriesAssigned: null });
    } catch {}
    await sendErrorNotification("error", err.message, articlesGenerated, notificationEmail);
    return { sourcesChecked, articlesGenerated, status: "error", errorMessage: err.message };
  }
}
