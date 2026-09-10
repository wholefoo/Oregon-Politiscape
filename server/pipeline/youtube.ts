const CHANNEL_FEED_BASE = "https://www.youtube.com/feeds/videos.xml?channel_id=";

function isChannelId(s: string): boolean {
  return /^UC[\w-]{22}$/.test(s);
}

function isYouTubeHostname(hostname: string): boolean {
  return hostname === "www.youtube.com" || hostname === "youtube.com";
}

function extractChannelIdFromFeedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (isYouTubeHostname(u.hostname) && u.pathname === "/feeds/videos.xml") {
      const id = u.searchParams.get("channel_id");
      if (id && isChannelId(id)) return id;
    }
  } catch {}
  return null;
}

function extractChannelIdFromChannelUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (isYouTubeHostname(u.hostname)) {
      const m = u.pathname.match(/^\/channel\/(UC[\w-]{22})/);
      if (m) return m[1];
    }
  } catch {}
  return null;
}

async function resolveHandleToChannelId(handle: string): Promise<string> {
  const normalizedHandle = handle.startsWith("@") ? handle : `@${handle}`;
  const pageUrl = `https://www.youtube.com/${normalizedHandle}`;

  const res = await fetch(pageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; OregonPolitiscape/1.0)",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!res.ok) {
    throw new Error(`Could not load YouTube channel page (HTTP ${res.status})`);
  }

  const html = await res.text();

  const externalIdMatch = html.match(/"externalId"\s*:\s*"(UC[\w-]{22})"/);
  if (externalIdMatch) return externalIdMatch[1];

  const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/);
  if (canonicalMatch) return canonicalMatch[1];

  const browseIdMatch = html.match(/"browseId"\s*:\s*"(UC[\w-]{22})"/);
  if (browseIdMatch) return browseIdMatch[1];

  throw new Error(`Could not resolve YouTube channel ID for handle "${normalizedHandle}". The channel may not exist or YouTube's page structure has changed.`);
}

export async function resolveYouTubeFeedUrl(input: string): Promise<string> {
  const trimmed = input.trim();

  const fromFeedUrl = extractChannelIdFromFeedUrl(trimmed);
  if (fromFeedUrl) return `${CHANNEL_FEED_BASE}${fromFeedUrl}`;

  const fromChannelUrl = extractChannelIdFromChannelUrl(trimmed);
  if (fromChannelUrl) return `${CHANNEL_FEED_BASE}${fromChannelUrl}`;

  if (isChannelId(trimmed)) {
    return `${CHANNEL_FEED_BASE}${trimmed}`;
  }

  let handle = trimmed;
  try {
    const u = new URL(trimmed);
    if (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") {
      const pathParts = u.pathname.split("/").filter(Boolean);
      if (pathParts[0]?.startsWith("@")) {
        handle = pathParts[0];
      } else if (pathParts[0] === "c" || pathParts[0] === "user") {
        handle = pathParts[1] || trimmed;
      }
    }
  } catch {}

  const channelId = await resolveHandleToChannelId(handle);
  return `${CHANNEL_FEED_BASE}${channelId}`;
}
