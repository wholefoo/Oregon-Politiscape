import { db } from "./db";
import { categories, rssFeeds } from "@shared/schema";
import { DEFAULT_FEEDS } from "./pipeline/scraper";
import { eq } from "drizzle-orm";

const DEFAULT_KEYWORDS: Record<string, string[]> = {
  "founding-documents": [
    "constitution", "constitutional", "unconstitutional", "bill of rights",
    "amendment", "declaration of independence", "founding document",
    "first amendment", "second amendment", "fourth amendment", "fifth amendment",
    "preamble", "federalist papers", "ratification", "originalism",
    "judicial review", "supreme court", "inalienable rights", "natural rights",
    "enumerated rights", "tenth amendment", "article i", "article ii", "article iii",
    "habeas corpus", "due process", "equal protection",
  ],
  "founding-fathers": [
    "founding father", "founding fathers", "founder", "founders",
    "george washington", "thomas jefferson", "james madison", "john adams",
    "samuel adams", "benjamin franklin", "alexander hamilton", "patrick henry",
    "revolutionary war", "american revolution", "colonial", "continental congress",
    "declaration of independence", "framers", "framers of the constitution",
    "republic was founded", "1776",
  ],
  "hamilton-legacy": [
    "hamilton", "treasury", "monetary policy", "federal reserve",
    "national bank", "central bank", "tariff", "trade policy", "fiscal policy",
    "debt ceiling", "national debt", "budget deficit", "federal budget",
    "economic policy", "inflation", "currency", "financial system",
    "banking", "commerce", "manufacturing", "industrial policy",
  ],
  "political-spectrum": [
    "oregon", "pacific northwest", "democrat", "republican", "conservative",
    "liberal", "progressive", "election", "ballot", "campaign", "senate",
    "congress", "governor", "legislature", "policy", "political party",
    "vote", "politics", "political", "lawmaker", "legislation",
    "representative", "senator", "white house", "administration",
    "biden", "trump", "gop", "dnc", "rnc", "midterm", "polling",
    "woke", "deep state", "border", "immigration", "crime",
  ],
  "essential-patriot": [
    "patriot", "patriotism", "liberty", "freedom", "flag", "military",
    "veteran", "america first", "faith", "church", "bible", "prayer",
    "christian", "judeo-christian", "pro-life", "sanctity of life",
    "traditional family", "religious liberty", "gun rights", "sovereignty",
    "nationalism", "god", "biblical", "creation", "second amendment",
    "firearms", "self-defense", "national sovereignty", "values",
    "parental rights", "free speech", "censorship",
  ],
};

function keywordsString(slug: string): string {
  return (DEFAULT_KEYWORDS[slug] || []).join(", ");
}

export async function seedDatabase() {
  const existingCategories = await db.select().from(categories);
  if (existingCategories.length === 0) {
    await db.insert(categories).values([
      {
        name: "Founding Documents",
        slug: "founding-documents",
        description: "Essential documents that shaped the foundation of the United States of America",
        keywords: keywordsString("founding-documents"),
      },
      {
        name: "Revolutionary Visionary Founding Fathers",
        slug: "founding-fathers",
        description: "The visionary leaders who shaped the birth of a nation",
        keywords: keywordsString("founding-fathers"),
      },
      {
        name: "Alexander Hamilton Life and Legacy",
        slug: "hamilton-legacy",
        description: "Exploring the life, writings, and enduring legacy of Alexander Hamilton",
        keywords: keywordsString("hamilton-legacy"),
      },
      {
        name: "Oregon Political Spectrum",
        slug: "political-spectrum",
        description: "Analysis and commentary on Oregon's political landscape",
        keywords: keywordsString("political-spectrum"),
      },
      {
        name: "Essential Patriot",
        slug: "essential-patriot",
        description: "Updates and resources for engaged citizens",
        keywords: keywordsString("essential-patriot"),
      },
    ]);
    console.log("Categories seeded successfully");
  } else {
    let updated = 0;
    for (const cat of existingCategories) {
      if (!cat.keywords || cat.keywords.trim().length === 0) {
        const kw = keywordsString(cat.slug);
        if (kw.length > 0) {
          await db.update(categories).set({ keywords: kw }).where(eq(categories.id, cat.id));
          updated++;
        }
      }
    }
    if (updated > 0) {
      console.log(`Default keywords back-filled for ${updated} category/categories`);
    }
  }

  const existingFeeds = await db.select().from(rssFeeds);
  if (existingFeeds.length === 0) {
    await db.insert(rssFeeds).values(DEFAULT_FEEDS.map((f) => ({ name: f.name, url: f.url, enabled: true })));
    console.log("Default RSS feeds seeded successfully");
  }
}
