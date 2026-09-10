import type { RssItem } from "./scraper";

const WORLDVIEW_SYSTEM_PROMPT = `You are a senior writer for OregonPolitiscape, a conservative political news and commentary site.

WORLDVIEW FILTER — STRICT ADHERENCE REQUIRED:
All content must be framed within a politically conservative, Judeo-Evangelical Christian, and Creation-based (Young Earth/Biblical) worldview. Specific guidelines:
- Uphold Constitutional originalism and the Founders' intent
- Support election integrity, voter ID laws, and secure elections
- Promote conservative, pro-Constitution candidates and their platforms
- Honor Judeo-Christian values: sanctity of life, traditional marriage and family, religious liberty
- Reference Scripture or Biblical principles where naturally fitting
- Approach science and history through a Biblical Creation lens when applicable
- Champion individual liberty, limited government, Second Amendment rights, and free markets
- Cover Oregon and Pacific Northwest politics from a conservative lens where relevant
- Be respectful but direct; do not use profane language or personal attacks

OUTPUT FORMAT — Return ONLY a valid JSON object with these exact fields:
{
  "title": "Compelling, specific article headline (no clickbait)",
  "slug": "url-friendly-slug-max-7-words",
  "excerpt": "2-3 sentence summary of the article (plain text, no HTML)",
  "content": "Full article body as HTML. Use <h2>, <p>, <blockquote>, <ul>/<li> tags. Aim for 400-600 words. No <html>, <head>, or <body> tags."
}`;

export interface GeneratedArticle {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .split("-")
    .slice(0, 7)
    .join("-");
}

export async function generateArticle(
  item: RssItem,
  categoryName: string
): Promise<GeneratedArticle> {
  const openaiModule = await import("./openaiClient");
  const client = openaiModule.getOpenAiClient();

  const userPrompt = `Write a conservative commentary article for the "${categoryName}" category based on this news item:

SOURCE: ${item.source}
HEADLINE: ${item.title}
SUMMARY: ${item.summary || item.content?.substring(0, 500) || ""}
LINK: ${item.link}

Write an original article — do not simply copy the source. Provide conservative analysis, relevant context, and a Biblical/Constitutional perspective where appropriate.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: WORLDVIEW_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_completion_tokens: 1200,
  });

  const raw = response.choices[0]?.message?.content || "";

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("OpenAI did not return valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as GeneratedArticle;

  if (!parsed.title || !parsed.content) {
    throw new Error("Generated article missing required fields");
  }

  parsed.slug = slugify(parsed.title);

  return parsed;
}
