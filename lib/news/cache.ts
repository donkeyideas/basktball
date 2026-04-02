export interface NewsArticle {
  id: string;
  title: string;
  link: string;
  description: string;
  content?: string; // Longer text from content:encoded or article scrape
  pubDate: string;
  source: string;
  sourceLogo?: string;
  league: string;
  imageUrl?: string;
}

let cachedArticles: { articles: NewsArticle[]; timestamp: number } | null = null;
const CACHE_TTL = 300000; // 5 minutes

export function getCachedArticles(): NewsArticle[] | null {
  if (cachedArticles && Date.now() - cachedArticles.timestamp < CACHE_TTL) {
    return cachedArticles.articles;
  }
  return null;
}

export function setCachedArticles(articles: NewsArticle[]) {
  cachedArticles = { articles, timestamp: Date.now() };
}

export function findArticleById(id: string): NewsArticle | undefined {
  return cachedArticles?.articles.find((a) => a.id === id);
}
