import { NextRequest, NextResponse } from "next/server";
import { type NewsArticle, getCachedArticles, setCachedArticles } from "@/lib/news/cache";

// Cache at Vercel CDN level — revalidate every 5 minutes
export const revalidate = 300;

interface FeedSource {
  name: string;
  url: string;
  defaultLeague: string;
  logo?: string;
}

// RSS feeds — defaultLeague is only used as fallback when content analysis can't determine league
const RSS_FEEDS: FeedSource[] = [
  // NBA
  { name: "ESPN NBA", url: "https://www.espn.com/espn/rss/nba/news", defaultLeague: "nba", logo: "https://a.espncdn.com/combiner/i?img=/i/espn/espn_logos/espn_red.png&w=40" },
  { name: "NBA.com", url: "https://www.nba.com/feeds/rss", defaultLeague: "nba", logo: "https://cdn.nba.com/logos/leagues/logo-nba.svg" },
  { name: "Bleacher Report NBA", url: "https://bleacherreport.com/articles/feed?tag_id=19", defaultLeague: "nba" },
  { name: "Yahoo Sports NBA", url: "https://sports.yahoo.com/nba/rss/", defaultLeague: "nba" },
  { name: "CBS Sports NBA", url: "https://www.cbssports.com/rss/headlines/nba/", defaultLeague: "nba" },
  { name: "HoopsHype", url: "https://hoopshype.com/feed/", defaultLeague: "nba" },
  // WNBA
  { name: "ESPN WNBA", url: "https://www.espn.com/espn/rss/wnba/news", defaultLeague: "wnba" },
  { name: "CBS Sports WNBA", url: "https://www.cbssports.com/rss/headlines/wnba/", defaultLeague: "wnba" },
  { name: "Yahoo Sports WNBA", url: "https://sports.yahoo.com/wnba/rss/", defaultLeague: "wnba" },
  { name: "Bleacher Report WNBA", url: "https://bleacherreport.com/articles/feed?tag_id=88", defaultLeague: "wnba" },
  { name: "Just Women's Sports", url: "https://justwomenssports.com/rss/", defaultLeague: "wnba" },
  { name: "Swish Appeal", url: "https://www.swishappeal.com/rss/index.xml", defaultLeague: "wnba" },
  // College Basketball
  { name: "ESPN NCAAM", url: "https://www.espn.com/espn/rss/ncb/news", defaultLeague: "ncaam" },
  { name: "CBS Sports NCAAM", url: "https://www.cbssports.com/rss/headlines/college-basketball/", defaultLeague: "ncaam" },
  // EuroLeague / International
  { name: "EuroHoops", url: "https://www.eurohoops.net/feed/", defaultLeague: "euro" },
];

// =============================================================================
// LEAGUE DETECTION — Content-based. Every article gets classified by what's IN it.
// =============================================================================

// All 30 NBA teams — team names, nicknames, city names unique to NBA
const NBA_TERMS = [
  "nba", "hawks", "celtics", "nets", "hornets", "bulls", "cavaliers", "cavs",
  "mavericks", "mavs", "nuggets", "pistons", "warriors", "rockets", "pacers",
  "clippers", "lakers", "grizzlies", "heat", "bucks", "timberwolves", "wolves",
  "pelicans", "knicks", "thunder", "magic", "76ers", "sixers", "suns",
  "trail blazers", "blazers", "kings", "spurs", "raptors", "jazz", "wizards",
  // Star players whose names are unambiguous
  "lebron", "steph curry", "stephen curry", "kevin durant", "giannis",
  "antetokounmpo", "jokic", "embiid", "jayson tatum", "luka doncic",
  "ja morant", "wembanyama", "wemby", "anthony edwards", "shai gilgeous",
  "donovan mitchell", "devin booker", "jimmy butler", "paul george",
  "kawhi leonard", "damian lillard", "bam adebayo", "tyrese haliburton",
  "lamelo ball", "zion williamson", "chet holmgren", "victor wembanyama",
  // NBA-specific terms
  "all-star game", "nba draft", "nba trade", "nba free agency", "nba finals",
  "western conference", "eastern conference", "nba playoff", "nba season",
  "slam dunk contest", "three-point contest", "nba all-star",
];

// College basketball — school names that don't overlap with NBA
const COLLEGE_TERMS = [
  "ncaam", "ncaa", "march madness", "final four", "sweet sixteen", "elite eight",
  "big east", "big ten", "big 12", "big twelve", "acc", "sec", "pac-12", "pac-10",
  "american athletic", "mountain west", "wcc", "big sky", "colonial",
  // Major programs
  "duke", "north carolina", "unc", "tar heels", "kentucky", "wildcats",
  "kansas", "jayhawks", "gonzaga", "bulldogs", "villanova",
  "michigan state", "spartans", "uconn", "huskies", "purdue", "boilermakers",
  "baylor", "bears", "houston cougars", "alabama", "crimson tide",
  "auburn", "tigers", "tennessee", "volunteers", "vols",
  "arkansas", "razorbacks", "lsu", "oregon", "ducks",
  "ucla", "bruins", "stanford", "cardinal", "georgia tech", "yellow jackets",
  "clemson", "nc state", "wolfpack", "notre dame", "fighting irish",
  "virginia tech", "hokies", "florida state", "seminoles", "syracuse", "orange",
  "louisville", "cardinals", "wake forest", "demon deacons", "boston college",
  "ohio state", "buckeyes", "iowa state", "cyclones", "texas tech", "red raiders",
  "tcu", "horned frogs", "west virginia", "mountaineers", "cincinnati", "bearcats",
  "byu", "cougars", "colorado", "buffaloes", "arizona", "arizona state",
  "creighton", "bluejays", "marquette", "golden eagles", "xavier", "musketeers",
  "seton hall", "pirates", "georgetown", "hoyas", "providence", "friars",
  "st. john's", "st john's", "red storm", "butler", "vanderbilt", "commodores",
  "rutgers", "scarlet knights", "penn state", "nittany lions",
  "pitt", "pittsburgh", "panthers", "dayton", "flyers",
  "san diego state", "aztecs", "michigan", "wolverines",
  "wisconsin", "badgers", "illinois", "fighting illini",
  "maryland", "terrapins", "iowa", "hawkeyes", "indiana", "hoosiers",
  "wichita state", "shockers", "ole miss", "rebels",
  "south carolina", "gamecocks", "texas a&m", "aggies",
  "mississippi state",
  // Coach names commonly in college headlines
  "coach k", "izzo", "calipari", "self", "jay wright", "mark few",
  "hubert davis", "jon scheyer",
];

// WNBA terms
const WNBA_TERMS = [
  "wnba", "aces", "liberty", "storm", "lynx", "connecticut sun", "chicago sky",
  "mercury", "mystics", "fever", "sparks", "wings", "dream", "valkyries",
  "tigers", "golden state valkyries", "las vegas aces", "new york liberty",
  "seattle storm", "minnesota lynx", "indiana fever", "los angeles sparks",
  "dallas wings", "atlanta dream", "phoenix mercury", "washington mystics",
  // Star players
  "caitlin clark", "a'ja wilson", "aja wilson", "breanna stewart", "angel reese",
  "sabrina ionescu", "alyssa thomas", "kelsey plum", "chelsea gray",
  "jewell loyd", "napheesa collier", "paige bueckers", "cameron brink",
  "kamilla cardoso", "rickea jackson", "rhyne howard", "arike ogunbowale",
  "kahleah copper", "skylar diggins", "diana taurasi", "brittney griner",
  "jackie young", "candace parker", "nneka ogwumike", "elena delle donne",
  "dearica hamby", "satou sabally", "natasha cloud", "courtney vandersloot",
  "jonquel jones", "kelsey mitchell", "aliyah boston", "azura stevens",
  // WNBA-specific terms
  "wnba draft", "wnba season", "wnba playoff", "wnba finals",
  "commissioner's cup", "wnba all-star", "wnba mvp", "wnba rookie",
  "wnba championship", "wnba trade", "wnba free agency",
];

// Women's college basketball
const NCAAW_TERMS = [
  "ncaaw", "women's basketball", "womens basketball", "women's ncaa",
  "women's final four", "women's tournament", "women's march madness",
  "women's elite eight", "women's sweet sixteen",
  "lady vols", "lady bears", "gamecocks women",
  "dawn staley", "geno auriemma", "kim mulkey", "tara vanderveer",
  "juju watkins", "paige bueckers", "flau'jae johnson",
];

// EuroLeague / international
const EURO_TERMS = [
  "euroleague", "eurobasket", "eurocup", "fiba",
  "real madrid basketball", "fc barcelona basket", "olympiacos",
  "panathinaikos", "fenerbahce", "anadolu efes", "cska moscow",
  "maccabi tel aviv", "baskonia", "zalgiris", "virtus bologna",
  "partizan", "red star belgrade", "alba berlin",
];

function countMatches(text: string, terms: string[]): number {
  let count = 0;
  for (const term of terms) {
    if (text.includes(term)) count++;
  }
  return count;
}

function detectLeague(title: string, description: string, feedDefault: string): string {
  const text = `${title} ${description}`.toLowerCase();

  const nba = countMatches(text, NBA_TERMS);
  const college = countMatches(text, COLLEGE_TERMS);
  const wnba = countMatches(text, WNBA_TERMS);
  const ncaaw = countMatches(text, NCAAW_TERMS);
  const euro = countMatches(text, EURO_TERMS);

  // Pick the league with the most keyword matches
  const scores = [
    { league: "nba", score: nba },
    { league: "ncaam", score: college },
    { league: "wnba", score: wnba },
    { league: "ncaaw", score: ncaaw },
    { league: "euro", score: euro },
  ];

  scores.sort((a, b) => b.score - a.score);

  // If the top score is > 0, use that league
  if (scores[0].score > 0) {
    return scores[0].league;
  }

  // No keywords matched — use the feed's default league
  return feedDefault;
}

// =============================================================================
// NON-BASKETBALL FILTER
// =============================================================================
const REJECT_KEYWORDS = [
  "horse racing", "stakes", "thoroughbred", "jockey", "furlongs",
  "baseball", "mlb", "home run", "pitcher", "batting",
  "football", "nfl", "touchdown", "quarterback", "rushing yards",
  "soccer", "mls", "premier league", "la liga", "champions league",
  "hockey", "nhl", "puck", "goalie",
  "golf", "pga", "birdie", "bogey",
  "tennis", "grand slam", "wimbledon",
  "boxing", "ufc", "mma", "knockout",
  "f1", "formula 1", "nascar", "racing",
  "cricket", "rugby",
];

function isBasketballArticle(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  for (const keyword of REJECT_KEYWORDS) {
    if (text.includes(keyword)) return false;
  }
  return true;
}

// =============================================================================
// RSS PARSING
// =============================================================================
function parseRssXml(xml: string, source: FeedSource): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = extractTag(item, "title");
    const link = extractTag(item, "link") || extractAttr(item, "link", "href");
    const description = extractTag(item, "description");
    const pubDate = extractTag(item, "pubDate") || extractTag(item, "dc:date");

    const contentEncoded = extractTag(item, "content:encoded");
    const imageUrl = extractAttr(item, "media:content", "url")
      || extractAttr(item, "media:thumbnail", "url")
      || extractImageEnclosure(item)
      || extractImageFromContent(description || "")
      || extractImageFromContent(contentEncoded || "");

    if (!title || !link) continue;

    const cleanTitle = cleanHtml(title);
    const cleanDesc = cleanHtml(description || "").substring(0, 300);

    // Extract longer content from content:encoded if available
    const cleanContent = contentEncoded
      ? cleanHtml(contentEncoded).substring(0, 2000)
      : undefined;

    // Detect league from article content — NOT from the feed source
    const league = detectLeague(cleanTitle, cleanDesc, source.defaultLeague);

    const id = Buffer.from(`${source.name}:${link}`).toString("base64url");

    articles.push({
      id,
      title: cleanTitle,
      link,
      description: cleanDesc,
      content: cleanContent && cleanContent.length > cleanDesc.length ? cleanContent : undefined,
      pubDate: pubDate || new Date().toISOString(),
      source: source.name,
      sourceLogo: source.logo,
      league,
      imageUrl: imageUrl || undefined,
    });
  }

  return articles;
}

function extractTag(xml: string, tag: string): string | null {
  const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i");
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(regex);
  return m ? m[1].trim() : null;
}

function extractAttr(xml: string, tag: string, attr: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["']`, "i");
  const m = xml.match(regex);
  return m ? m[1] : null;
}

function extractImageEnclosure(xml: string): string | null {
  const r1 = /<enclosure[^>]*type=["']image\/[^"']*["'][^>]*url=["']([^"']+)["']/i;
  const m1 = xml.match(r1);
  if (m1) return m1[1];

  const r2 = /<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image\/[^"']*["']/i;
  const m2 = xml.match(r2);
  if (m2) return m2[1];

  const r3 = /<enclosure[^>]*url=["']([^"']+\.(jpg|jpeg|png|gif|webp)[^"']*)["']/i;
  const m3 = xml.match(r3);
  return m3 ? m3[1] : null;
}

function extractImageFromContent(html: string): string | null {
  const m = html.match(/src=["']([^"']+\.(jpg|jpeg|png|gif|webp)[^"']*)/i);
  return m ? m[1] : null;
}

function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/\s+/g, " ")
    .trim();
}

// =============================================================================
// OG:IMAGE FETCHING
// =============================================================================
const LOGO_PATTERNS = [
  /\/logo[s]?\//i, /yahoo.*ylogo/i, /default[-_]?og/i,
  /site[-_]?logo/i, /brand[-_]?logo/i, /\/favicon/i,
];

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(url, {
      headers: { "User-Agent": "Basktball/1.0", "Accept": "text/html" },
      signal: controller.signal,
      redirect: "follow",
    });

    if (!res.ok) { clearTimeout(timeout); return null; }

    const html = await res.text();
    clearTimeout(timeout);

    const head = html.substring(0, 20000);
    const patterns = [
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
    ];

    for (const pattern of patterns) {
      const m = head.match(pattern);
      if (m) {
        const resolved = m[1].startsWith("http") ? m[1] : (() => { try { return new URL(m[1], url).href; } catch { return m[1]; } })();
        if (!LOGO_PATTERNS.some(p => p.test(resolved))) return resolved;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// =============================================================================
// FEED FETCHING
// =============================================================================
async function fetchFeed(source: FeedSource): Promise<NewsArticle[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(source.url, {
      headers: {
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
        "User-Agent": "Basktball/1.0 (News Aggregator)",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!res.ok) return [];

    const xml = await res.text();
    return parseRssXml(xml, source);
  } catch {
    return [];
  }
}

// =============================================================================
// API HANDLER
// =============================================================================
export async function GET(request: NextRequest) {
  // Cache 5 min at CDN, serve stale up to 10 min while revalidating
  const headers = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" };

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    // Serve from cache if fresh
    const cached = getCachedArticles();
    if (cached) {
      return NextResponse.json({
        success: true,
        articles: cached.slice(0, limit),
        total: cached.length,
      }, { headers });
    }

    // Fetch all feeds in parallel
    const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed));

    // Collect and filter
    let allArticles: NewsArticle[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allArticles.push(...result.value.filter(a => isBasketballArticle(a.title, a.description)));
      }
    }

    // Sort newest first
    allArticles.sort((a, b) => {
      const da = new Date(a.pubDate).getTime();
      const db = new Date(b.pubDate).getTime();
      if (isNaN(da) && isNaN(db)) return 0;
      if (isNaN(da)) return 1;
      if (isNaN(db)) return -1;
      return db - da;
    });

    // Deduplicate by title
    const seen = new Set<string>();
    allArticles = allArticles.filter(a => {
      const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Enrich missing images with og:image (limit to 5 to reduce egress)
    const needImages = allArticles.filter(a => !a.imageUrl).slice(0, 5);
    if (needImages.length > 0) {
      await Promise.allSettled(
        needImages.map(async (article) => {
          const img = await fetchOgImage(article.link);
          if (img) article.imageUrl = img;
        })
      );
    }

    // Cache all articles
    setCachedArticles(allArticles);

    return NextResponse.json({
      success: true,
      articles: allArticles.slice(0, limit),
      total: allArticles.length,
    }, { headers });
  } catch (error) {
    console.error("News aggregation error:", error);
    return NextResponse.json({
      success: false,
      articles: [],
      error: "Failed to fetch news",
    }, { status: 500, headers });
  }
}
