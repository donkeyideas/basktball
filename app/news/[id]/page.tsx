import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components";
import { getArticleById } from "@/lib/news/articles";

// Re-fetch the RSS-derived article set at most every 10 minutes
export const revalidate = 600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://basktball.com";

const LEAGUE_COLORS: Record<string, string> = {
  nba: "var(--orange)",
  wnba: "#ff6b00",
  ncaam: "#4a90d9",
  ncaaw: "#9b59b6",
  euro: "#27ae60",
};

const LEAGUE_LABELS: Record<string, string> = {
  nba: "NBA",
  wnba: "WNBA",
  ncaam: "NCAAM",
  ncaaw: "NCAAW",
  euro: "EURO",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const article = await getArticleById(id);
    if (!article) {
      return {
        title: "Article Not Found",
        description: "The requested news article could not be found.",
        robots: { index: false, follow: true },
      };
    }

    const leagueLabel = LEAGUE_LABELS[article.league] || article.league.toUpperCase();
    const title = `${article.title} | ${leagueLabel} News`;
    const description = (article.description || article.content || "").substring(0, 160);
    const canonicalUrl = `${BASE_URL}/news/${id}`;

    return {
      title,
      description,
      alternates: { canonical: `/news/${id}` },
      openGraph: {
        title: article.title,
        description,
        url: canonicalUrl,
        type: "article",
        publishedTime: new Date(article.pubDate).toISOString(),
        ...(article.imageUrl && { images: [{ url: article.imageUrl, alt: article.title }] }),
      },
      twitter: {
        card: article.imageUrl ? "summary_large_image" : "summary",
        title: article.title,
        description,
        ...(article.imageUrl && { images: [article.imageUrl] }),
      },
    };
  } catch {
    return {
      title: "Basketball News",
      description: "Latest NBA, WNBA, college and international basketball news.",
    };
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticleById(id);

  if (!article) notFound();

  const leagueColor = LEAGUE_COLORS[article.league] || "var(--orange)";
  const leagueLabel = LEAGUE_LABELS[article.league] || article.league.toUpperCase();
  const body = article.content || article.description || "";
  const publishedISO = (() => {
    const d = new Date(article.pubDate);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  })();

  // NewsArticle JSON-LD
  const newsArticleJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.description || body.substring(0, 200),
    url: `${BASE_URL}/news/${id}`,
    ...(article.imageUrl && { image: [article.imageUrl] }),
    ...(publishedISO && { datePublished: publishedISO, dateModified: publishedISO }),
    publisher: {
      "@type": "Organization",
      name: article.source,
      ...(article.sourceLogo && {
        logo: { "@type": "ImageObject", url: article.sourceLogo },
      }),
    },
    isBasedOn: article.link,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/news/${id}` },
    articleSection: leagueLabel,
  };

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "News", item: `${BASE_URL}/news` },
      { "@type": "ListItem", position: 3, name: article.title, item: `${BASE_URL}/news/${id}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Header />
      <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {/* Back link */}
          <Link
            href="/news"
            style={{
              color: "var(--text-muted)",
              textDecoration: "none",
              fontSize: "14px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "30px",
            }}
          >
            &larr; Back to News
          </Link>

          {/* Hero image */}
          {article.imageUrl && (
            <div
              style={{
                width: "100%",
                height: "400px",
                overflow: "hidden",
                marginBottom: "30px",
                background: "var(--input-bg)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.imageUrl}
                alt={article.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          )}

          {/* League badge + date */}
          <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px", flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-block",
                padding: "5px 14px",
                background: leagueColor,
                color: "var(--black)",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              {leagueLabel}
            </span>
            <span style={{ color: "var(--text-faint)", fontSize: "13px", fontFamily: "var(--font-roboto-mono), monospace" }}>
              {formatDate(article.pubDate)}
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: "var(--font-anton), Anton, sans-serif",
              fontSize: "clamp(28px, 5vw, 48px)",
              lineHeight: "1.2",
              marginBottom: "25px",
            }}
          >
            {article.title}
          </h1>

          {/* Source */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "30px" }}>
            <span style={{ color: "var(--text-faint)", fontSize: "14px" }}>via</span>
            <span style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: 600 }}>{article.source}</span>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "var(--border-color)", marginBottom: "30px" }} />

          {/* Article content */}
          <div style={{ marginBottom: "40px" }}>
            {body.split("\n\n").map((paragraph, i) => (
              <p
                key={i}
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "17px",
                  lineHeight: "1.8",
                  marginBottom: "20px",
                }}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Read full article button */}
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              width: "100%",
              padding: "18px",
              background: "var(--orange)",
              color: "var(--black)",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "16px",
              letterSpacing: "1px",
            }}
          >
            READ FULL ARTICLE AT {article.source.toUpperCase()} &rarr;
          </a>

          {/* Bottom back link */}
          <div style={{ textAlign: "center", marginTop: "40px", paddingBottom: "40px" }}>
            <Link
              href="/news"
              style={{
                color: "var(--text-faint)",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              &larr; Back to News
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
