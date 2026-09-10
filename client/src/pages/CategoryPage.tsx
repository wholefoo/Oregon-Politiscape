import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import type { Article, Category } from "@shared/schema";
import Layout from "@/components/Layout";
import HeroBanner from "@/components/HeroBanner";
import ArticleCard from "@/components/ArticleCard";
import { ArticleListSkeleton } from "@/components/LoadingSkeleton";
import SEOHead, { buildBreadcrumbList, SITE_URL_BASE } from "@/components/SEOHead";

const categoryImages: Record<string, string> = {
  "founding-documents": "/images/founding-documents.png",
  "founding-fathers": "/images/founding-fathers.png",
  "hamilton-legacy": "/images/hamilton.png",
  "political-spectrum": "/images/oregon-landscape.png",
  "essential-patriot": "/images/essential-patriot.png",
};

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: category, isLoading: catLoading, isError: catError } = useQuery<Category>({
    queryKey: ["/api/categories", slug],
    queryFn: async () => {
      const res = await fetch(`/api/categories/${slug}`);
      if (!res.ok) throw new Error("Category not found");
      return res.json();
    },
  });

  const { data: articles, isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: ["/api/categories", slug, "articles"],
    queryFn: async () => {
      const res = await fetch(`/api/categories/${slug}/articles`);
      if (!res.ok) throw new Error("Failed to fetch articles");
      return res.json();
    },
    enabled: !!slug && !catError,
  });

  const heroImage = categoryImages[slug] || "/images/header-banner.png";

  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: SITE_URL_BASE },
    { name: category?.name ?? "Category", url: `${SITE_URL_BASE}/category/${slug}` },
  ]);

  if (catError) {
    return (
      <Layout>
        <SEOHead title="Category Not Found" noIndex={true} canonicalPath={`/category/${slug}`} />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center" data-testid="category-not-found">
          <h1 className="font-serif text-3xl mb-4 text-foreground">Category Not Found</h1>
          <p className="text-muted-foreground mb-6">The category you're looking for doesn't exist.</p>
          <Link
            href="/"
            className="text-amber-700 dark:text-amber-400 hover:underline font-serif text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm"
            data-testid="link-go-home"
          >
            Return Home
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title={category?.name}
        description={
          category?.description ||
          `Browse articles about ${category?.name ?? slug} on Oregon Politiscape.`
        }
        canonicalPath={`/category/${slug}`}
        ogImage={heroImage}
        structuredData={breadcrumbs}
      />

      <HeroBanner
        image={heroImage}
        alt={category?.name || "Category"}
        title={category?.name}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="section-category-articles">
        {category?.description && (
          <p className="text-muted-foreground mb-8 max-w-2xl leading-relaxed" data-testid="text-category-description">
            {category.description}
          </p>
        )}

        {catLoading || articlesLoading ? (
          <ArticleListSkeleton count={4} />
        ) : articles && articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                categoryName={category?.name}
                categorySlug={slug}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20" data-testid="text-no-articles">
            <p className="text-muted-foreground text-lg font-serif">No articles in this category yet.</p>
          </div>
        )}
      </section>
    </Layout>
  );
}
