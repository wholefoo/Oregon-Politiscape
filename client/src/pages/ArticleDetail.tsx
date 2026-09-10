import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import type { Article, Category } from "@shared/schema";
import Layout from "@/components/Layout";
import { ArticleDetailSkeleton } from "@/components/LoadingSkeleton";
import { ArrowLeft } from "lucide-react";
import { processContent, stripHtml } from "@/lib/utils";
import SEOHead, {
  buildArticleSchema,
  buildBreadcrumbList,
  SITE_URL_BASE,
} from "@/components/SEOHead";

export default function ArticleDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: article, isLoading, isError } = useQuery<Article>({
    queryKey: ["/api/articles", slug],
    queryFn: async () => {
      const res = await fetch(`/api/articles/${slug}`);
      if (!res.ok) throw new Error("Article not found");
      return res.json();
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const category = categories?.find((c) => c.id === article?.categoryId);

  if (isLoading) {
    return (
      <Layout>
        <ArticleDetailSkeleton />
      </Layout>
    );
  }

  if (isError || !article) {
    return (
      <Layout>
        <SEOHead title="Article Not Found" noIndex={true} canonicalPath={`/article/${slug}`} />
        <div className="max-w-3xl mx-auto py-20 px-4 text-center" data-testid="article-not-found">
          <h1 className="font-serif text-3xl mb-4 text-foreground">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
          <Link
            href="/posts"
            className="text-amber-700 dark:text-amber-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm"
            data-testid="link-back-to-posts"
          >
            Back to all articles
          </Link>
        </div>
      </Layout>
    );
  }

  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const articlePath = `/article/${article.slug}`;
  const articleUrl = `${SITE_URL_BASE}${articlePath}`;
  const description = article.excerpt
    ? stripHtml(article.excerpt).slice(0, 200)
    : `Read "${article.title}" on Oregon Politiscape.`;

  const breadcrumbs = buildBreadcrumbList([
    { name: "Home", url: SITE_URL_BASE },
    ...(category ? [{ name: category.name, url: `${SITE_URL_BASE}/category/${category.slug}` }] : []),
    { name: article.title, url: articleUrl },
  ]);

  const articleSchema = buildArticleSchema({
    headline: article.title,
    description,
    url: articlePath,
    imageUrl: article.featuredImage,
    publishedAt: article.publishedAt,
  });

  return (
    <Layout>
      <SEOHead
        title={article.title}
        description={description}
        canonicalPath={articlePath}
        ogImage={article.featuredImage ?? undefined}
        ogType="article"
        publishedAt={article.publishedAt}
        structuredData={[articleSchema, breadcrumbs]}
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10" data-testid="article-detail">
        <Link
          href={category ? `/category/${category.slug}` : "/posts"}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm"
          data-testid="link-back"
        >
          <ArrowLeft className="h-4 w-4" />
          {category ? category.name : "All Articles"}
        </Link>

        {category && (
          <Link
            href={`/category/${category.slug}`}
            className="block text-xs font-sans uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-3 hover:text-amber-900 dark:hover:text-amber-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm"
            data-testid="text-article-category"
          >
            {category.name}
          </Link>
        )}

        <h1 className="font-serif text-3xl sm:text-4xl leading-tight mb-4 text-foreground" data-testid="text-article-title">
          {article.title}
        </h1>

        {formattedDate && (
          <p className="text-sm text-muted-foreground mb-8" data-testid="text-article-date">
            {formattedDate}
          </p>
        )}

        {article.featuredImage && (
          <div className="aspect-[16/9] overflow-hidden rounded-md mb-8">
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full h-full object-cover"
              data-testid="img-article-featured"
            />
          </div>
        )}

        <div
          className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-p:leading-relaxed prose-p:text-foreground/90 prose-a:text-amber-700 dark:prose-a:text-amber-400 prose-img:rounded-md"
          data-testid="text-article-content"
          dangerouslySetInnerHTML={{ __html: processContent(article.content || "") }}
        />
      </article>
    </Layout>
  );
}
