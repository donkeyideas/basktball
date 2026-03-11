// AEO (Answer Engine Optimization) dimension scores
export interface AeoScores {
  schemaRichness: number;
  faqCoverage: number;
  directAnswerReadiness: number;
  entityMarkup: number;
  speakableContent: number;
  aiSnippetCompatibility: number;
  total: number;
}

// CRO (Conversion Rate Optimization) dimension scores
export interface CroScores {
  ctaPresence: number;
  formAccessibility: number;
  loadSpeedImpact: number;
  trustSignals: number;
  socialProof: number;
  valueProposition: number;
  mobileCro: number;
  total: number;
}

// Pre-parsed HTML structure (parsed once with Cheerio, reused by all analyzers)
export interface ParsedPage {
  url: string;
  path: string;
  html: string;
  jsonLdBlocks: Record<string, unknown>[];
  headings: { level: number; text: string }[];
  paragraphs: string[];
  lists: { type: "ol" | "ul"; items: string[] }[];
  tableCount: number;
  forms: {
    hasLabels: boolean;
    hasPlaceholders: boolean;
    hasSubmit: boolean;
    hasAriaLabels: boolean;
    hasAutocomplete: boolean;
    inputCount: number;
  }[];
  buttons: { text: string; isStyled: boolean }[];
  links: { text: string; href: string }[];
  metaTags: Record<string, string>;
  hasViewport: boolean;
  responseTime: number;
  wordCount: number;
  title: string;
  firstParagraphText: string;
}

// Raw crawl result before parsing
export interface CrawlResult {
  url: string;
  path: string;
  html: string;
  statusCode: number;
  responseTime: number;
  error?: string;
}

// Page analysis with all scores
export interface PageAnalysis {
  url: string;
  path: string;
  title: string;
  responseTime: number;
  wordCount: number;
  aeoScores: AeoScores;
  croScores: CroScores;
  ctaCount: number;
  ctaTexts: string[];
  formCount: number;
  hasTrustBadges: boolean;
  hasTestimonials: boolean;
  hasSocialProof: boolean;
  hasValueProp: boolean;
}

// Recommendation matching existing dashboard pattern
export interface AeoCroRecommendation {
  id: string;
  severity: "critical" | "warning" | "info";
  category: "AEO" | "CRO";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  fix: string;
  affectedPages?: string[];
}

// API response shape for /api/admin/seo/aeo-cro
export interface AeoCroResponse {
  success: boolean;
  aeoScore: number;
  croScore: number;
  pages: PageAnalysis[];
  aeoRadar: { axis: string; value: number }[];
  croBreakdown: { dimension: string; score: number; weight: number }[];
  croFunnel: { stage: string; value: number; fill: string }[];
  aeoRecommendations: AeoCroRecommendation[];
  croRecommendations: AeoCroRecommendation[];
  crawledAt: string;
  pagesAnalyzed: number;
  error?: string;
}
