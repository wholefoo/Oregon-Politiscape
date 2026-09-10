import { Link } from "wouter";
import type { Article } from "@shared/schema";
import { stripHtml } from "@/lib/utils";

interface ArticleCardProps {
  article: Article;
  categoryName?: string;
  categorySlug?: string;
}

export default function ArticleCard({ article, categoryName, categorySlug }: ArticleCardProps) {
  return (
    <article className="group" data-testid={`card-article-${article.id}`}>
      <Link
        href={`/article/${article.slug}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
      >
        {article.featuredImage && (
          <div className="aspect-[16/10] overflow-hidden rounded-md mb-4">
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              data-testid={`img-article-${article.id}`}
            />
          </div>
        )}
      </Link>
      {categoryName && categorySlug && (
        <Link
          href={`/category/${categorySlug}`}
          className="inline-block text-xs font-sans uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2 hover:text-amber-900 dark:hover:text-amber-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm"
          data-testid={`link-category-${article.id}`}
        >
          {categoryName}
        </Link>
      )}
      <Link
        href={`/article/${article.slug}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm"
      >
        <h3
          className="font-serif text-xl leading-snug mb-2 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors text-foreground"
          data-testid={`text-article-title-${article.id}`}
        >
          {article.title}
        </h3>
      </Link>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3" data-testid={`text-article-excerpt-${article.id}`}>
        {stripHtml(article.excerpt || "")}
      </p>
    </article>
  );
}
