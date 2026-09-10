import Parser from "rss-parser";

export const rssParser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "OregonPolitiscape/1.0 RSS Reader" },
});

const youtubeParser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "OregonPolitiscape/1.0 RSS Reader" },
  customFields: {
    item: [
      ["media:group", "mediaGroup"],
      ["yt:videoId", "videoId"],
    ],
  },
});

export interface RssItem {
  title: string;
  link: string;
  content: string;
  summary: string;
  pubDate: string;
  source: string;
}

export interface FeedConfig {
  name: string;
  url: string;
  sourceType?: string;
}

export const DEFAULT_FEEDS: FeedConfig[] = [
  { name: "The Daily Wire", url: "https://www.dailywire.com/feeds/rss.xml" },
  { name: "The Federalist", url: "https://thefederalist.com/feed/" },
  { name: "Just The News", url: "https://justthenews.com/feed" },
  { name: "Breitbart", url: "https://feeds.feedburner.com/breitbart" },
  { name: "Oregon Catalyst", url: "https://oregoncatalyst.com/feed" },
  { name: "Washington Times", url: "https://www.washingtontimes.com/rss/headlines/news/" },
  { name: "The Epoch Times", url: "https://www.theepochtimes.com/c-us-politics/feed" },
  { name: "Election Integrity Network", url: "https://electionintegritynetwork.com/feed/" },
];

const RELEVANCE_KEYWORDS = [
  "election", "ballot", "vote", "voting", "fraud",
  "conservative", "constitution", "constitutional", "liberty", "freedom",
  "republican", "gop", "maga", "trump",
  "christian", "faith", "biblical", "church", "prayer",
  "second amendment", "gun rights", "border", "immigration",
  "oregon", "portland", "salem", "legislature",
  "pro-life", "abortion", "family values",
  "woke", "crt", "critical race",
  "deep state", "globalist", "sovereignty",
  "candidate", "primary", "senator", "representative", "governor",
  "inflation", "economy", "taxes", "deficit",
];

function isRecent(pubDate: string): boolean {
  try {
    const pub = new Date(pubDate);
    const now = new Date();
    const diffHours = (now.getTime() - pub.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
  } catch {
    return true;
  }
}

function isRelevant(item: { title: string; content?: string; summary?: string }): boolean {
  const text = `${item.title} ${item.content || ""} ${item.summary || ""}`.toLowerCase();
  return RELEVANCE_KEYWORDS.some((kw) => text.includes(kw));
}

function isYoutubeFeedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === "www.youtube.com" && u.pathname === "/feeds/videos.xml";
  } catch {
    return false;
  }
}

function extractYouTubeDescription(mediaGroup: any): string {
  if (!mediaGroup) return "";
  const descField = mediaGroup["media:description"];
  if (Array.isArray(descField)) return descField[0] ?? "";
  if (typeof descField === "string") return descField;
  return "";
}

export async function fetchRssItems(feeds: FeedConfig[]): Promise<{ items: RssItem[]; sourcesChecked: number; feedsFailed: number }> {
  const allItems: RssItem[] = [];
  let sourcesChecked = 0;

  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const isYT = feed.sourceType === "youtube" || isYoutubeFeedUrl(feed.url);
      const parser = isYT ? youtubeParser : rssParser;
      const parsed = await parser.parseURL(feed.url);
      return { feed, items: parsed.items || [], isYouTube: isYT };
    })
  );

  for (const result of results) {
    sourcesChecked++;
    if (result.status === "fulfilled") {
      const { feed, items, isYouTube } = result.value;
      for (const item of items) {
        if (!item.title || !item.link) continue;
        if (item.pubDate && !isRecent(item.pubDate)) continue;

        let content = "";
        let summary = "";

        if (isYouTube) {
          const desc = extractYouTubeDescription((item as any).mediaGroup);
          content = desc;
          summary = desc.substring(0, 300);
        } else {
          content = (item as any)["content:encoded"] || item.content || "";
          summary = item.contentSnippet || item.summary || "";
        }

        const rssItem: RssItem = {
          title: item.title,
          link: item.link,
          content,
          summary,
          pubDate: item.pubDate || new Date().toISOString(),
          source: feed.name,
        };
        if (isRelevant(rssItem)) {
          allItems.push(rssItem);
        }
      }
    } else {
      console.warn(`[pipeline] Failed to fetch feed:`, result.reason?.message || result.reason);
    }
  }

  const feedsFailed = results.filter((r) => r.status === "rejected").length;
  return { items: allItems, sourcesChecked, feedsFailed };
}
