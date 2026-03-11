import type { ParsedPage, AeoScores, CroScores } from "./types";
import { AEO_WEIGHTS, CRO_WEIGHTS } from "./constants";
import {
  analyzeSchemaRichness,
  analyzeFaqCoverage,
  analyzeDirectAnswerReadiness,
  analyzeEntityMarkup,
  analyzeSpeakableContent,
  analyzeAiSnippetCompatibility,
  analyzeCtaPresence,
  analyzeFormAccessibility,
  analyzeLoadSpeedImpact,
  analyzeTrustSignals,
  analyzeSocialProof,
  analyzeValueProposition,
  analyzeMobileCro,
} from "./analyzer";

export function calculateAeoScore(page: ParsedPage): AeoScores {
  const schemaRichness = analyzeSchemaRichness(page);
  const faqCoverage = analyzeFaqCoverage(page);
  const directAnswerReadiness = analyzeDirectAnswerReadiness(page);
  const entityMarkup = analyzeEntityMarkup(page);
  const speakableContent = analyzeSpeakableContent(page);
  const aiSnippetCompatibility = analyzeAiSnippetCompatibility(page);

  const total = Math.round(
    schemaRichness * AEO_WEIGHTS.schemaRichness +
    faqCoverage * AEO_WEIGHTS.faqCoverage +
    directAnswerReadiness * AEO_WEIGHTS.directAnswerReadiness +
    entityMarkup * AEO_WEIGHTS.entityMarkup +
    speakableContent * AEO_WEIGHTS.speakableContent +
    aiSnippetCompatibility * AEO_WEIGHTS.aiSnippetCompatibility
  );

  return {
    schemaRichness,
    faqCoverage,
    directAnswerReadiness,
    entityMarkup,
    speakableContent,
    aiSnippetCompatibility,
    total,
  };
}

export function calculateCroScore(page: ParsedPage): CroScores {
  const ctaPresence = analyzeCtaPresence(page);
  const formAccessibility = analyzeFormAccessibility(page);
  const loadSpeedImpact = analyzeLoadSpeedImpact(page.responseTime);
  const trustSignals = analyzeTrustSignals(page);
  const socialProof = analyzeSocialProof(page);
  const valueProposition = analyzeValueProposition(page);
  const mobileCro = analyzeMobileCro(page);

  const total = Math.round(
    ctaPresence * CRO_WEIGHTS.ctaPresence +
    formAccessibility * CRO_WEIGHTS.formAccessibility +
    loadSpeedImpact * CRO_WEIGHTS.loadSpeedImpact +
    trustSignals * CRO_WEIGHTS.trustSignals +
    socialProof * CRO_WEIGHTS.socialProof +
    valueProposition * CRO_WEIGHTS.valueProposition +
    mobileCro * CRO_WEIGHTS.mobileCro
  );

  return {
    ctaPresence,
    formAccessibility,
    loadSpeedImpact,
    trustSignals,
    socialProof,
    valueProposition,
    mobileCro,
    total,
  };
}
