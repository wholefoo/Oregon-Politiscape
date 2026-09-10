import { db } from "./db";
import { categories, articles } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

interface ArticleData {
  title: string;
  slug: string;
  excerpt: string;
  categorySlug: string;
  featuredImage: string;
  publishedAt: string;
}

const articleMetadata: ArticleData[] = [
  {
    title: "The Farmer Refuted",
    slug: "the-farmer-refuted",
    excerpt: "I flatter myself, I shall find no difficulty in obviating the objections you have produced, against the Full Vindication.",
    categorySlug: "hamilton-legacy",
    featuredImage: "/images/hamilton.png",
    publishedAt: "2023-11-16",
  },
  {
    title: "Federalist Papers 81-85",
    slug: "federalist-papers-81-85",
    excerpt: "The Federalist, commonly referred to as the Federalist Papers, is a series of 85 essays written by Alexander Hamilton, John Jay, and James Madison between October 1787 and May 1788.",
    categorySlug: "founding-documents",
    featuredImage: "/images/federalist-papers.png",
    publishedAt: "2023-11-16",
  },
  {
    title: "Federalist Papers 71-80",
    slug: "federalist-papers-71-80",
    excerpt: "The Federalist, commonly referred to as the Federalist Papers, is a series of 85 essays written by Alexander Hamilton, John Jay, and James Madison between October 1787 and May 1788.",
    categorySlug: "founding-documents",
    featuredImage: "/images/federalist-papers.png",
    publishedAt: "2023-11-16",
  },
  {
    title: "Federalist Papers 61-70",
    slug: "federalist-papers-61-70",
    excerpt: "The Federalist, commonly referred to as the Federalist Papers, is a series of 85 essays written by Alexander Hamilton, John Jay, and James Madison between October 1787 and May 1788.",
    categorySlug: "founding-documents",
    featuredImage: "/images/federalist-papers.png",
    publishedAt: "2023-11-16",
  },
  {
    title: "Federalist Papers 51-60",
    slug: "federalist-papers-51-60",
    excerpt: "The Federalist, commonly referred to as the Federalist Papers, is a series of 85 essays written by Alexander Hamilton, John Jay, and James Madison between October 1787 and May 1788.",
    categorySlug: "founding-documents",
    featuredImage: "/images/federalist-papers.png",
    publishedAt: "2023-11-16",
  },
  {
    title: "Federalist Papers 41-50",
    slug: "federalist-papers-41-50",
    excerpt: "The Federalist, commonly referred to as the Federalist Papers, is a series of 85 essays written by Alexander Hamilton, John Jay, and James Madison between October 1787 and May 1788.",
    categorySlug: "founding-documents",
    featuredImage: "/images/federalist-papers.png",
    publishedAt: "2023-11-16",
  },
  {
    title: "Federalist Papers 31-40",
    slug: "federalist-papers-31-40",
    excerpt: "The Federalist, commonly referred to as the Federalist Papers, is a series of 85 essays written by Alexander Hamilton, John Jay, and James Madison between October 1787 and May 1788.",
    categorySlug: "founding-documents",
    featuredImage: "/images/federalist-papers.png",
    publishedAt: "2023-11-16",
  },
  {
    title: "Federalist Papers 21-30",
    slug: "federalist-papers-21-30",
    excerpt: "The Federalist, commonly referred to as the Federalist Papers, is a series of 85 essays written by Alexander Hamilton, John Jay, and James Madison between October 1787 and May 1788.",
    categorySlug: "founding-documents",
    featuredImage: "/images/federalist-papers.png",
    publishedAt: "2023-11-16",
  },
  {
    title: "Federalist Papers 11-20",
    slug: "federalist-papers-11-20",
    excerpt: "The Federalist, commonly referred to as the Federalist Papers, is a series of 85 essays written by Alexander Hamilton, John Jay, and James Madison between October 1787 and May 1788.",
    categorySlug: "founding-documents",
    featuredImage: "/images/federalist-papers.png",
    publishedAt: "2023-11-16",
  },
  {
    title: "Federalist Papers 1-10",
    slug: "federalist-papers-1-10",
    excerpt: "The Federalist, commonly referred to as the Federalist Papers, is a series of 85 essays written by Alexander Hamilton, John Jay, and James Madison between October 1787 and May 1788.",
    categorySlug: "founding-documents",
    featuredImage: "/images/federalist-papers.png",
    publishedAt: "2023-11-16",
  },
  {
    title: "The Federalist Papers",
    slug: "the-federalist-papers",
    excerpt: "The Federalist, commonly referred to as the Federalist Papers, is a series of 85 essays written by Alexander Hamilton, John Jay, and James Madison between October 1787 and May 1788.",
    categorySlug: "founding-documents",
    featuredImage: "/images/federalist-papers.png",
    publishedAt: "2023-11-15",
  },
  {
    title: "United States Founding Documents",
    slug: "united-states-founding-documents",
    excerpt: "Life, Liberty and the pursuit of Happiness.--That to secure these rights, Governments are instituted among Men, deriving their just powers from the consent of the governed.",
    categorySlug: "founding-documents",
    featuredImage: "/images/founding-documents.png",
    publishedAt: "2023-11-15",
  },
  {
    title: "Federal System Architect",
    slug: "federal-system-architect",
    excerpt: "Turning from structures of brick and stone to an edifice of a nobler kind, we of America have but to look around us to see in the mighty fabric of our national government the monument of Alexander Hamilton.",
    categorySlug: "hamilton-legacy",
    featuredImage: "/images/hamilton.png",
    publishedAt: "2023-11-14",
  },
  {
    title: "Alexander Hamilton Biography",
    slug: "alexander-hamilton-biography",
    excerpt: "The life of Alexander Hamilton is an essential chapter in the story of the formation of the American Union. Hamilton's work was of that constructive sort which is vital for laying the foundations of new states.",
    categorySlug: "hamilton-legacy",
    featuredImage: "/images/hamilton.png",
    publishedAt: "2023-11-14",
  },
  {
    title: "Constitution of the United States - A History",
    slug: "constitution-of-the-united-states-history",
    excerpt: "Explore the profound journey of the US Constitution, from its inception to present day amendments. Dive into the cornerstone of American democracy.",
    categorySlug: "founding-fathers",
    featuredImage: "/images/founding-documents.png",
    publishedAt: "2023-06-27",
  },
  {
    title: "Practical Guide For Disaster Preparedness",
    slug: "practical-guide-for-disaster-preparedness",
    excerpt: "Disaster preparedness involves planning and preparation to ensure safety and survival in the event of an emergency or disaster. Here's a practical guide that can help.",
    categorySlug: "essential-patriot",
    featuredImage: "/images/essential-patriot.png",
    publishedAt: "2023-06-25",
  },
  {
    title: "Enduring Wisdom of George Washington",
    slug: "the-enduring-wisdom-of-george-washington",
    excerpt: "The best way to resolve this conundrum is by referring to the original founding documents, or documents written by the founders themselves.",
    categorySlug: "founding-fathers",
    featuredImage: "/images/george-washington.png",
    publishedAt: "2023-06-25",
  },
  {
    title: "Revolutionary Era and George Washington's Pivotal Role",
    slug: "george-washington-father-and-founder-of-the-republic",
    excerpt: "Among the multitude who in different lands and times have won fame in varying degrees, a few stand out so distinct, so far above the rest, that they mark the eras of the world's progress.",
    categorySlug: "founding-fathers",
    featuredImage: "/images/george-washington.png",
    publishedAt: "2023-06-24",
  },
  {
    title: "This Land, Oregon",
    slug: "this-land-oregon",
    excerpt: "This article presents a comprehensive account of the political and social changes in Oregon from 1860 to 1920.",
    categorySlug: "political-spectrum",
    featuredImage: "/images/this-land-oregon.png",
    publishedAt: "2023-06-02",
  },
  {
    title: "The Last Will and Testaments of the Founders Reveal Their Christian Faith",
    slug: "last-will-and-testaments-of-the-founders-reveal-their-christian-faith",
    excerpt: "The evidence of the Christian Foundation of America is great. The Providence Foundation has presented much of this in our books and publications.",
    categorySlug: "founding-fathers",
    featuredImage: "/images/founding-fathers.png",
    publishedAt: "2023-06-01",
  },
  {
    title: "Practical Ways To Survive An Economic Recession",
    slug: "practical-ways-to-survive-an-economic-recession",
    excerpt: "The economy is known for its unpredictability, and it is not uncommon for financial recessions to occur.",
    categorySlug: "essential-patriot",
    featuredImage: "/images/essential-patriot.png",
    publishedAt: "2023-06-25",
  },
  {
    title: "Constitution of Oregon - 2022 Edition",
    slug: "state-constitution",
    excerpt: "The complete text of the Oregon State Constitution as amended through 2022, providing the foundational legal framework for governance in the state.",
    categorySlug: "political-spectrum",
    featuredImage: "/images/state-constitution.png",
    publishedAt: "2023-06-01",
  },
  {
    title: "Pastoral Teaching on the Sanctity of Life",
    slug: "pastoral-teaching-on-the-sanctity-of-life",
    excerpt: "Archbishop Alexander K. Sample's Response to Oregon Governor Tina Kotek's Proclamation of Abortion Provider Appreciation Day.",
    categorySlug: "political-spectrum",
    featuredImage: "/images/oregon-landscape.png",
    publishedAt: "2025-05-19",
  },
];

async function loadBatchContent(): Promise<Record<string, string>> {
  const allContent: Record<string, string> = {};
  const dir = path.join(process.cwd(), "server");

  for (let i = 0; i <= 4; i++) {
    const filePath = path.join(dir, `articles_batch${i}.json`);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      Object.assign(allContent, data);
    }
  }

  return allContent;
}

async function migrateContent() {
  console.log("Starting content migration...");

  const allContent = await loadBatchContent();
  console.log(`Loaded content for ${Object.keys(allContent).length} articles`);

  const allCategories = await db.select().from(categories);
  const categoryMap = new Map(allCategories.map(c => [c.slug, c.id]));

  console.log("Categories:", [...categoryMap.entries()].map(([k, v]) => `${k}=${v}`).join(", "));

  await db.delete(articles);
  console.log("Cleared existing articles");

  let inserted = 0;
  let skipped = 0;

  for (const meta of articleMetadata) {
    const categoryId = categoryMap.get(meta.categorySlug);
    if (!categoryId) {
      console.log(`  SKIP: No category found for slug "${meta.categorySlug}" (article: ${meta.slug})`);
      skipped++;
      continue;
    }

    const content = allContent[meta.slug] || "";
    if (!content) {
      console.log(`  WARN: No content for ${meta.slug}, inserting with placeholder`);
    }

    try {
      await db.insert(articles).values({
        title: meta.title,
        slug: meta.slug,
        excerpt: meta.excerpt,
        content: content || `Content for "${meta.title}" is being prepared.`,
        featuredImage: meta.featuredImage,
        categoryId,
        published: true,
        publishedAt: new Date(meta.publishedAt),
      });
      inserted++;
      console.log(`  OK: ${meta.slug} (${content.length} chars)`);
    } catch (err: any) {
      console.error(`  ERR: ${meta.slug}: ${err.message}`);
    }
  }

  console.log(`\nMigration complete: ${inserted} inserted, ${skipped} skipped`);
  process.exit(0);
}

migrateContent().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
