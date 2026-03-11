import { NextResponse } from "next/server";
import { cache } from "@/lib/cache/redis";
import { crawlPages, parseHtml } from "@/lib/seo/crawler";
import { calculateAeoScore, calculateCroScore } from "@/lib/seo/scoring";
import { generateAeoRecommendations, generateCroRecommendations } from "@/lib/seo/recommendations";
import { AEO_CRO_CACHE_KEY, AEO_CRO_CACHE_TTL, CRO_WEIGHTS, CTA_KEYWORDS } from "@/lib/seo/constants";
import type { PageAnalysis, AeoCroResponse } from "@/lib/seo/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for crawling

async function runAeoCroAnalysis(): Promise<Omit<AeoCroResponse, "success">> {
  const crawlResults = await crawlPages();

  // Filter successful crawls
  const successfulCrawls = crawlResults.filter((r) => r.statusCode >= 200 && r.statusCode < 400 && !r.error);

  if (successfulCrawls.length === 0) {
    return {
      aeoScore: 0,
      croScore: 0,
      pages: [],
      aeoRadar: [],
      croBreakdown: [],
      croFunnel: [],
      aeoRecommendations: [],
      croRecommendations: [],
      crawledAt: new Date().toISOString(),
      pagesAnalyzed: 0,
      error: "Could not crawl any pages. Site may be down.",
    };
  }

  // Parse and score each page
  const pages: PageAnalysis[] = [];

  for (const crawl of successfulCrawls) {
    const parsed = parseHtml(crawl);
    const aeoScores = calculateAeoScore(parsed);
    const croScores = calculateCroScore(parsed);

    // Collect CTA info for CRO details
    const ctaTexts: string[] = [];
    for (const btn of parsed.buttons) {
      if (CTA_KEYWORDS.some((kw) => btn.text.includes(kw))) {
        ctaTexts.push(btn.text);
      }
    }
    for (const link of parsed.links) {
      if (CTA_KEYWORDS.some((kw) => link.text.includes(kw))) {
        ctaTexts.push(link.text);
      }
    }

    pages.push({
      url: crawl.url,
      path: crawl.path,
      title: parsed.title,
      responseTime: crawl.responseTime,
      wordCount: parsed.wordCount,
      aeoScores,
      croScores,
      ctaCount: ctaTexts.length,
      ctaTexts: ctaTexts.slice(0, 10), // Limit stored CTAs
      formCount: parsed.forms.length,
      hasTrustBadges: croScores.trustSignals >= 40,
      hasTestimonials: croScores.socialProof >= 40,
      hasSocialProof: croScores.socialProof >= 30,
      hasValueProp: croScores.valueProposition >= 40,
    });
  }

  // Calculate site-wide averages
  const aeoScore = Math.round(pages.reduce((sum, p) => sum + p.aeoScores.total, 0) / pages.length);
  const croScore = Math.round(pages.reduce((sum, p) => sum + p.croScores.total, 0) / pages.length);

  // Build AEO radar data
  const avgAeo = {
    schemaRichness: Math.round(pages.reduce((s, p) => s + p.aeoScores.schemaRichness, 0) / pages.length),
    faqCoverage: Math.round(pages.reduce((s, p) => s + p.aeoScores.faqCoverage, 0) / pages.length),
    directAnswerReadiness: Math.round(pages.reduce((s, p) => s + p.aeoScores.directAnswerReadiness, 0) / pages.length),
    entityMarkup: Math.round(pages.reduce((s, p) => s + p.aeoScores.entityMarkup, 0) / pages.length),
    speakableContent: Math.round(pages.reduce((s, p) => s + p.aeoScores.speakableContent, 0) / pages.length),
    aiSnippetCompatibility: Math.round(pages.reduce((s, p) => s + p.aeoScores.aiSnippetCompatibility, 0) / pages.length),
  };

  const aeoRadar = [
    { axis: "Schema Richness", value: avgAeo.schemaRichness },
    { axis: "FAQ Coverage", value: avgAeo.faqCoverage },
    { axis: "Direct Answers", value: avgAeo.directAnswerReadiness },
    { axis: "Entity Markup", value: avgAeo.entityMarkup },
    { axis: "Speakable", value: avgAeo.speakableContent },
    { axis: "AI Snippets", value: avgAeo.aiSnippetCompatibility },
  ];

  // Build CRO breakdown
  const avgCro = {
    ctaPresence: Math.round(pages.reduce((s, p) => s + p.croScores.ctaPresence, 0) / pages.length),
    formAccessibility: Math.round(pages.reduce((s, p) => s + p.croScores.formAccessibility, 0) / pages.length),
    loadSpeedImpact: Math.round(pages.reduce((s, p) => s + p.croScores.loadSpeedImpact, 0) / pages.length),
    trustSignals: Math.round(pages.reduce((s, p) => s + p.croScores.trustSignals, 0) / pages.length),
    socialProof: Math.round(pages.reduce((s, p) => s + p.croScores.socialProof, 0) / pages.length),
    valueProposition: Math.round(pages.reduce((s, p) => s + p.croScores.valueProposition, 0) / pages.length),
    mobileCro: Math.round(pages.reduce((s, p) => s + p.croScores.mobileCro, 0) / pages.length),
  };

  const croBreakdown = [
    { dimension: "CTA Presence", score: avgCro.ctaPresence, weight: CRO_WEIGHTS.ctaPresence },
    { dimension: "Form Accessibility", score: avgCro.formAccessibility, weight: CRO_WEIGHTS.formAccessibility },
    { dimension: "Load Speed", score: avgCro.loadSpeedImpact, weight: CRO_WEIGHTS.loadSpeedImpact },
    { dimension: "Trust Signals", score: avgCro.trustSignals, weight: CRO_WEIGHTS.trustSignals },
    { dimension: "Social Proof", score: avgCro.socialProof, weight: CRO_WEIGHTS.socialProof },
    { dimension: "Value Proposition", score: avgCro.valueProposition, weight: CRO_WEIGHTS.valueProposition },
    { dimension: "Mobile CRO", score: avgCro.mobileCro, weight: CRO_WEIGHTS.mobileCro },
  ];

  // Build CRO funnel
  const totalPages = pages.length;
  const engagedPages = pages.filter((p) => p.wordCount > 100 || p.ctaCount > 0).length;
  const convertPages = pages.filter((p) => p.formCount > 0 || p.croScores.ctaPresence >= 50).length;

  const croFunnel = [
    { stage: "Visit", value: 100, fill: "#4A90D9" },
    { stage: "Engage", value: Math.round((engagedPages / totalPages) * 100), fill: "#FF6B35" },
    { stage: "Convert", value: Math.round((convertPages / totalPages) * 100), fill: "#4CAF50" },
  ];

  // Generate recommendations
  const aeoRecommendations = generateAeoRecommendations(pages);
  const croRecommendations = generateCroRecommendations(pages);

  return {
    aeoScore,
    croScore,
    pages,
    aeoRadar,
    croBreakdown,
    croFunnel,
    aeoRecommendations,
    croRecommendations,
    crawledAt: new Date().toISOString(),
    pagesAnalyzed: pages.length,
  };
}

export async function GET() {
  try {
    // Check cache first
    const cached = await cache.get<Omit<AeoCroResponse, "success">>(AEO_CRO_CACHE_KEY);
    if (cached) {
      return NextResponse.json({ success: true, ...cached });
    }

    const data = await runAeoCroAnalysis();

    // Cache results
    await cache.set(AEO_CRO_CACHE_KEY, data, AEO_CRO_CACHE_TTL);

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("AEO/CRO analysis error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to run AEO/CRO analysis" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Clear all related caches
    await cache.delete(AEO_CRO_CACHE_KEY);
    await cache.delete("admin:seo:overview:v2");
    await cache.delete("admin:seo:recommendations:v2");

    const data = await runAeoCroAnalysis();

    // Cache results
    await cache.set(AEO_CRO_CACHE_KEY, data, AEO_CRO_CACHE_TTL);

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("AEO/CRO re-scan error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to run AEO/CRO scan" },
      { status: 500 }
    );
  }
}
