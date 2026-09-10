import { useQuery } from "@tanstack/react-query";
import type { Article, Category } from "@shared/schema";
import Layout from "@/components/Layout";
import ArticleCard from "@/components/ArticleCard";
import { ArticleListSkeleton } from "@/components/LoadingSkeleton";
import SEOHead from "@/components/SEOHead";

export default function Posts() {
  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const getCategoryInfo = (categoryId: number) => {
    const cat = categories?.find((c) => c.id === categoryId);
    return cat ? { name: cat.name, slug: cat.slug } : undefined;
  };

  return (
    <Layout>
      <SEOHead
        title="All Articles"
        description="Browse all articles on Oregon Politiscape — covering founding documents, constitutional history, Oregon politics, and conservative civic resources."
        canonicalPath="/posts"
        ogImage="/images/header-banner.png"
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="section-all-posts">
        <div className="border-b-2 border-amber-700 dark:border-amber-500 pb-1 mb-8">
          <h1 className="font-serif text-xs uppercase tracking-[0.2em] text-amber-800 dark:text-amber-400">
            All Articles
          </h1>
        </div>

        {isLoading ? (
          <ArticleListSkeleton count={6} />
        ) : articles && articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
            {articles.map((article) => {
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
        ) : (
          <div className="text-center py-20" data-testid="text-no-posts">
            <p className="text-muted-foreground text-lg font-serif">No articles published yet.</p>
          </div>
        )}
      </section>
    </Layout>
  );
}
