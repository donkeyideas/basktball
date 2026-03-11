// AEO dimension weights (sum = 1.0)
export const AEO_WEIGHTS = {
  schemaRichness: 0.20,
  faqCoverage: 0.15,
  directAnswerReadiness: 0.20,
  entityMarkup: 0.15,
  speakableContent: 0.10,
  aiSnippetCompatibility: 0.20,
} as const;

// CRO dimension weights (sum = 1.0)
export const CRO_WEIGHTS = {
  ctaPresence: 0.20,
  formAccessibility: 0.10,
  loadSpeedImpact: 0.15,
  trustSignals: 0.15,
  socialProof: 0.15,
  valueProposition: 0.15,
  mobileCro: 0.10,
} as const;

// Score thresholds
export const SCORE_EXCELLENT = 80;
export const SCORE_GOOD = 60;
export const SCORE_NEEDS_WORK = 40;
export const SCORE_POOR = 20;

// CTA detection patterns (lowercase)
export const CTA_KEYWORDS = [
  "get started", "sign up", "try free", "request demo", "subscribe",
  "apply now", "learn more", "start now", "join", "download",
  "buy now", "add to cart", "book", "contact us", "schedule",
  "register", "create account", "claim", "unlock", "explore",
  "watch now", "play now", "start free", "try now",
] as const;

// Trust signal keywords (lowercase)
export const TRUST_KEYWORDS = [
  "secure", "encrypted", "guarantee", "certified", "official",
  "verified", "trusted", "privacy", "protected", "safe",
] as const;

// Social proof keywords (lowercase)
export const SOCIAL_PROOF_KEYWORDS = [
  "users", "members", "reviews", "ratings", "testimonials",
  "community", "trusted by", "join", "fans", "followers",
] as const;

// Value proposition keywords (lowercase)
export const VALUE_PROP_KEYWORDS = [
  "free", "best", "top", "premier", "comprehensive", "exclusive",
  "advanced", "real-time", "live", "instant", "fast", "easy",
  "save", "unlimited", "powerful", "smart", "pro",
] as const;

// JSON-LD schema types to detect for AEO
export const SCHEMA_TYPES = [
  "Organization", "WebSite", "FAQPage", "HowTo", "Product",
  "BreadcrumbList", "Person", "SportsTeam", "SportsEvent",
  "SpeakableSpecification", "SearchAction", "QAPage",
  "Dataset", "Article", "NewsArticle",
  "CollectionPage", "WebPage", "ContactPage", "ItemList",
  "SoftwareApplication", "ContactPoint",
] as const;

// Pages to crawl
export const CRAWL_PAGES = [
  "/",
  "/scores",
  "/standings",
  "/stats",
  "/teams",
  "/players",
  "/news",
  "/tools",
  "/contact",
  "/court",
] as const;

// Crawl settings
export const CRAWL_TIMEOUT_MS = 15000;
export const CRAWL_DELAY_MS = 500;
export const MAX_HTML_SIZE = 500 * 1024; // 500KB

// Cache settings
export const AEO_CRO_CACHE_KEY = "admin:seo:aeo-cro:v1";
export const AEO_CRO_CACHE_TTL = 3600; // 1 hour

// Legal pages (excluded from CRO CTA checks)
export const LEGAL_PAGES = ["/privacy", "/terms", "/cookies"] as const;
