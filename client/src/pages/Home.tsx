import { useQuery } from "@tanstack/react-query";
import type { Article, Category } from "@shared/schema";
import Layout from "@/components/Layout";
import ArticleCard from "@/components/ArticleCard";
import { ArticleListSkeleton } from "@/components/LoadingSkeleton";
import { Link } from "wouter";
import { stripHtml } from "@/lib/utils";
import { BookOpen, Scroll, Star, Flag, Shield } from "lucide-react";
import SEOHead, { buildWebSite, buildOrganization } from "@/components/SEOHead";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "founding-documents": <Scroll className="w-6 h-6 text-amber-600" />,
  "founding-fathers": <Star className="w-6 h-6 text-amber-600" />,
  "hamiltons-legacy": <BookOpen className="w-6 h-6 text-amber-600" />,
  "political-spectrum": <Flag className="w-6 h-6 text-amber-600" />,
  "essential-patriot": <Shield className="w-6 h-6 text-amber-600" />,
};

export default function Home() {
  const { data: articles, isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles/featured"],
    queryFn: async () => {
      const res = await fetch("/api/articles/featured?limit=8");
      if (!res.ok) throw new Error("Failed to fetch articles");
      return res.json();
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const getCategoryInfo = (categoryId: number) => {
    const cat = categories?.find((c) => c.id === categoryId);
    return cat ? { name: cat.name, slug: cat.slug } : undefined;
  };

  const featuredArticle = articles?.[0];
  const recentArticles = articles?.slice(1) || [];

  const homeStructuredData = [
    buildWebSite(),
    {
      "@context": "https://schema.org",
      ...buildOrganization(),
    },
  ];

  return (
    <Layout>
      <SEOHead
        title={undefined}
        description="Oregon Politiscape provides clear, principled analysis of Oregon politics rooted in founding ideals, constitutional governance, and Judeo-Christian values."
        canonicalPath="/"
        ogImage="/images/header-banner.png"
        structuredData={homeStructuredData}
      />

      <section
        className="relative w-full py-10 sm:py-14 flex items-center justify-center text-center overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1a2332 0%, #243047 60%, #1a2332 100%)" }}
        data-testid="section-hero"
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('/images/header-banner.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-amber-400 mb-4">
            Oregon Politiscape
          </p>
          <h1
            className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-8"
            data-testid="text-hero-title"
          >
            Faithful Reporting.<br />American Principles.
          </h1>
          <p
            className="font-serif text-lg sm:text-xl italic text-amber-200 leading-relaxed mb-10 opacity-90"
            data-testid="text-hero-quote"
          >
            "Righteousness exalts a nation, but sin is a reproach to any people."
            <span className="not-italic block mt-2 text-sm text-amber-300 tracking-widest uppercase font-sans">
              — Proverbs 14:34
            </span>
          </p>
          <a
            href="#articles"
            className="inline-block font-sans text-xs uppercase tracking-widest border border-amber-500 text-amber-300 hover:bg-amber-500 hover:text-[#1a2332] px-8 py-3 transition-colors duration-200 rounded-sm"
            data-testid="link-hero-cta"
          >
            Read the Latest
          </a>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-[#faf9f5] border-b border-stone-200" data-testid="section-mission">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-amber-700 mb-4">Our Mission</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1a2332] leading-snug mb-6">
            Defending Liberty Through Informed Citizens
          </h2>
          <p className="font-serif text-lg italic text-stone-600 leading-relaxed">
            Oregon Politiscape exists to equip Oregonians with clear, principled analysis of the political
            landscape — rooted in the founding ideals of the American republic, the wisdom of the Founding
            Fathers, and an unwavering commitment to constitutional governance.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16 bg-white border-b border-stone-200" data-testid="section-worldview">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="border-l-4 border-amber-500 pl-6">
            <p className="font-sans text-xs uppercase tracking-[0.3em] text-amber-700 mb-3">Editorial Standards</p>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1a2332] mb-4">A Transparent Worldview</h2>
            <p className="text-stone-600 leading-relaxed mb-4">
              We believe editorial transparency is a mark of integrity. All content on Oregon Politiscape is
              written and curated through a clearly defined worldview:
            </p>
            <ul className="space-y-2 text-stone-700" data-testid="list-worldview">
              <li className="flex items-start gap-3">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                <span><strong className="font-semibold text-[#1a2332]">Politically Conservative</strong> — We uphold limited government, individual liberty, and the constitutional order as established by the Founders.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                <span><strong className="font-semibold text-[#1a2332]">Judeo-Evangelical Christian</strong> — Our moral framework is grounded in the historic Judeo-Christian tradition and an evangelical understanding of Scripture.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                <span><strong className="font-semibold text-[#1a2332]">Biblical / Young Earth Creation</strong> — We affirm the authority of the Bible, including a straightforward reading of the Genesis account of creation.</span>
              </li>
            </ul>
            <p className="mt-4 text-sm text-stone-500 italic">
              Readers deserve to know where we stand. We do not pretend to a neutrality we do not hold.
            </p>
          </div>
        </div>
      </section>

      {categories && categories.length > 0 && (
        <section className="py-16 sm:py-20 bg-[#faf9f5] border-b border-stone-200" data-testid="section-categories">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="font-sans text-xs uppercase tracking-[0.3em] text-amber-700 mb-3">Explore</p>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#1a2332]">Core Topics</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group flex flex-col items-center text-center p-6 bg-white border border-stone-200 rounded-sm hover:border-amber-400 hover:shadow-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  data-testid={`card-category-${cat.id}`}
                >
                  <div className="mb-3 p-2 rounded-full bg-amber-50 group-hover:bg-amber-100 transition-colors">
                    {CATEGORY_ICONS[cat.slug] ?? <BookOpen className="w-6 h-6 text-amber-600" />}
                  </div>
                  <h3 className="font-serif text-base text-[#1a2332] leading-snug mb-2 group-hover:text-amber-800 transition-colors">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-stone-500 leading-relaxed line-clamp-3">{cat.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-14 bg-white border-b border-stone-200" data-testid="section-featured-links">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b-2 border-amber-700 pb-1 mb-8">
            <h2 className="font-serif text-xs uppercase tracking-[0.2em] text-amber-800">
              Essential Reading
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link
              href="/article/constitution-of-oregon-2022"
              className="group relative block overflow-hidden rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              data-testid="link-constitution"
            >
              <div className="aspect-[16/9]">
                <img
                  src="/images/state-constitution.png"
                  alt="Constitution of Oregon"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 border-b-2 border-amber-500">
                <h3 className="font-serif text-lg sm:text-xl text-white leading-snug drop-shadow">
                  Constitution of Oregon 2022 Edition
                </h3>
              </div>
            </Link>
            <Link
              href="/article/this-land-oregon"
              className="group relative block overflow-hidden rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              data-testid="link-this-land"
            >
              <div className="aspect-[16/9]">
                <img
                  src="/images/this-land-oregon.png"
                  alt="This Land, Oregon"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 border-b-2 border-amber-500">
                <h3 className="font-serif text-lg sm:text-xl text-white leading-snug drop-shadow">
                  This Land, Oregon
                </h3>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {featuredArticle && (
        <section className="py-14 bg-[#faf9f5] border-b border-stone-200" data-testid="section-featured-article">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border-b-2 border-amber-700 pb-1 mb-8">
              <h2 className="font-serif text-xs uppercase tracking-[0.2em] text-amber-800">
                Latest
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <Link
                href={`/article/${featuredArticle.slug}`}
                className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm"
              >
                {featuredArticle.featuredImage && (
                  <div className="aspect-[16/10] overflow-hidden rounded-sm">
                    <img
                      src={featuredArticle.featuredImage}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      data-testid="img-featured-article"
                    />
                  </div>
                )}
              </Link>
              <div className="flex flex-col justify-center">
                {(() => {
                  const catInfo = getCategoryInfo(featuredArticle.categoryId);
                  return catInfo ? (
                    <Link
                      href={`/category/${catInfo.slug}`}
                      className="text-xs font-sans uppercase tracking-widest text-amber-700 mb-3 inline-block hover:text-amber-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm"
                      data-testid="text-featured-category"
                    >
                      {catInfo.name}
                    </Link>
                  ) : null;
                })()}
                <Link
                  href={`/article/${featuredArticle.slug}`}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm"
                >
                  <h3
                    className="font-serif text-2xl lg:text-3xl leading-tight mb-4 hover:text-amber-800 transition-colors text-[#1a2332] dark:text-foreground"
                    data-testid="text-featured-title"
                  >
                    {featuredArticle.title}
                  </h3>
                </Link>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-featured-excerpt">
                  {stripHtml(featuredArticle.excerpt || "")}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section id="articles" className="py-14 bg-white" data-testid="section-recent-articles">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b-2 border-amber-700 pb-1 mb-8">
            <h2 className="font-serif text-xs uppercase tracking-[0.2em] text-amber-800">
              Recent Articles
            </h2>
          </div>
          {articlesLoading ? (
            <ArticleListSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
              {recentArticles.map((article) => {
                const catInfo = getCategoryInfo(article.categoryId);
                return (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    categoryName={catInfo?.name}
                    categorySlug={catInfo?.slug}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
