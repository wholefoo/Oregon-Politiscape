import { Helmet } from "react-helmet-async";

const SITE_NAME = "Oregon Politiscape";
const SITE_URL = "https://oregonpolitiscape.com";
const DEFAULT_DESCRIPTION =
  "Oregon Politiscape provides resources for understanding Oregon politics, founding documents, and civic engagement — rooted in conservative, constitutional principles.";
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/header-banner.png`;
const TWITTER_HANDLE = "@OregonPolitiscape";

interface StructuredData {
  [key: string]: unknown;
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  publishedAt?: string | Date | null;
  modifiedAt?: string | Date | null;
  structuredData?: StructuredData | StructuredData[];
  noIndex?: boolean;
}

function absoluteUrl(path: string): string {
  if (!path) return DEFAULT_OG_IMAGE;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export const SITE_URL_BASE = SITE_URL;
export const SITE_NAME_CONST = SITE_NAME;
export const DEFAULT_OG_IMAGE_PATH = DEFAULT_OG_IMAGE;

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = "/",
  ogImage,
  ogType = "website",
  publishedAt,
  modifiedAt,
  structuredData,
  noIndex = false,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Active Citizenship & Political Resources`;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const ogImageAbsolute = ogImage ? absoluteUrl(ogImage) : DEFAULT_OG_IMAGE;

  const schemaArray = structuredData
    ? Array.isArray(structuredData)
      ? structuredData
      : [structuredData]
    : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageAbsolute} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageAbsolute} />

      {/* Article-specific */}
      {ogType === "article" && publishedAt && (
        <meta
          property="article:published_time"
          content={new Date(publishedAt).toISOString()}
        />
      )}
      {ogType === "article" && modifiedAt && (
        <meta
          property="article:modified_time"
          content={new Date(modifiedAt).toISOString()}
        />
      )}
      {ogType === "article" && (
        <meta property="article:publisher" content={`${SITE_URL}`} />
      )}

      {/* JSON-LD structured data */}
      {schemaArray.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

/* ------------------------------------------------------------------ */
/* Shared JSON-LD builders                                              */
/* ------------------------------------------------------------------ */

export function buildOrganization() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/images/header-banner.png`,
      width: 1200,
      height: 630,
    },
    description: DEFAULT_DESCRIPTION,
    sameAs: [
      "https://www.facebook.com/oregonpolitiscape",
      "https://twitter.com/OregonPolitiscape",
    ],
  };
}

export function buildWebSite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    publisher: buildOrganization(),
  };
}

export function buildBreadcrumbList(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildArticleSchema({
  headline,
  description,
  url,
  imageUrl,
  publishedAt,
  modifiedAt,
}: {
  headline: string;
  description: string;
  url: string;
  imageUrl?: string | null;
  publishedAt?: string | Date | null;
  modifiedAt?: string | Date | null;
}) {
  const absUrl = absoluteUrl(url);
  const absImage = imageUrl ? absoluteUrl(imageUrl) : DEFAULT_OG_IMAGE;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url: absUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absUrl,
    },
    image: {
      "@type": "ImageObject",
      url: absImage,
      width: 1200,
      height: 630,
    },
    datePublished: publishedAt ? new Date(publishedAt).toISOString() : undefined,
    dateModified: modifiedAt
      ? new Date(modifiedAt).toISOString()
      : publishedAt
      ? new Date(publishedAt).toISOString()
      : undefined,
    author: buildOrganization(),
    publisher: {
      ...buildOrganization(),
      "@context": "https://schema.org",
    },
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
  };
}
