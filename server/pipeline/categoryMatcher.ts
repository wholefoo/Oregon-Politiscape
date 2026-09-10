import type { Category } from "@shared/schema";

const FALLBACK_KEYWORDS: Record<string, string[]> = {
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

function getKeywordsForCategory(category: Category): string[] {
  if (category.keywords && category.keywords.trim().length > 0) {
    return category.keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
  }
  return FALLBACK_KEYWORDS[category.slug] || [];
}

export interface CategoryTestResult {
  scores: { id: number; name: string; slug: string; score: number }[];
  winner: { id: number; name: string; slug: string; score: number } | null;
}

export function testCategoryMatch(
  categories: { id: number; slug: string; name: string; keywords: string | null }[],
  title: string,
  summary: string
): CategoryTestResult {
  const text = `${title} ${summary}`.toLowerCase();

  const scores = categories.map((cat) => {
    const kwList =
      cat.keywords && cat.keywords.trim().length > 0
        ? cat.keywords.split(",").map((k) => k.trim()).filter((k) => k.length > 0)
        : FALLBACK_KEYWORDS[cat.slug] || [];
    let score = 0;
    for (const kw of kwList) {
      if (text.includes(kw.toLowerCase())) {
        score += kw.split(" ").length;
      }
    }
    return { id: cat.id, name: cat.name, slug: cat.slug, score };
  });

  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const topScore = sorted[0]?.score ?? 0;

  let winner = topScore > 0 ? sorted[0] : null;
  if (!winner) {
    const fallback =
      scores.find((s) => s.slug.includes("political") || s.slug.includes("spectrum")) ||
      scores[0];
    winner = fallback ? { ...fallback, score: 0 } : null;
  }

  return { scores, winner };
}

export function pickBestCategory(
  categories: Category[],
  title: string,
  summary: string
): Category {
  const text = `${title} ${summary}`.toLowerCase();

  let bestCategory: Category | null = null;
  let bestScore = -1;

  for (const category of categories) {
    const keywords = getKeywordsForCategory(category);
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) {
        score += kw.split(" ").length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  if (!bestCategory || bestScore === 0) {
    bestCategory =
      categories.find((c) => c.slug.includes("political") || c.slug.includes("spectrum")) ||
      categories[0];
  }

  return bestCategory!;
}
