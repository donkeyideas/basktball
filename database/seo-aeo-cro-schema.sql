-- SEO/AEO/CRO Audit History Tables
-- Run against Supabase PostgreSQL for historical score tracking

-- Stores each audit run (triggered from admin dashboard)
CREATE TABLE IF NOT EXISTS seo_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type VARCHAR(10) NOT NULL CHECK (audit_type IN ('SEO', 'GEO', 'AEO', 'CRO', 'FULL')),
  overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  pages_analyzed INTEGER NOT NULL DEFAULT 0,
  dimension_scores JSONB NOT NULL DEFAULT '{}',
  recommendations_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stores per-page scores for each audit
CREATE TABLE IF NOT EXISTS seo_page_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES seo_audits(id) ON DELETE CASCADE,
  page_url VARCHAR(500) NOT NULL,
  page_path VARCHAR(255) NOT NULL,

  -- Core scores
  seo_score INTEGER CHECK (seo_score BETWEEN 0 AND 100),
  geo_score INTEGER CHECK (geo_score BETWEEN 0 AND 100),
  aeo_score INTEGER CHECK (aeo_score BETWEEN 0 AND 100),
  cro_score INTEGER CHECK (cro_score BETWEEN 0 AND 100),

  -- AEO dimension scores
  schema_richness_score INTEGER CHECK (schema_richness_score BETWEEN 0 AND 100),
  faq_coverage_score INTEGER CHECK (faq_coverage_score BETWEEN 0 AND 100),
  direct_answer_readiness_score INTEGER CHECK (direct_answer_readiness_score BETWEEN 0 AND 100),
  entity_markup_score INTEGER CHECK (entity_markup_score BETWEEN 0 AND 100),
  speakable_content_score INTEGER CHECK (speakable_content_score BETWEEN 0 AND 100),
  ai_snippet_compatibility_score INTEGER CHECK (ai_snippet_compatibility_score BETWEEN 0 AND 100),

  -- CRO dimension scores
  cta_presence_score INTEGER CHECK (cta_presence_score BETWEEN 0 AND 100),
  form_accessibility_score INTEGER CHECK (form_accessibility_score BETWEEN 0 AND 100),
  load_speed_impact_score INTEGER CHECK (load_speed_impact_score BETWEEN 0 AND 100),
  trust_signals_score INTEGER CHECK (trust_signals_score BETWEEN 0 AND 100),
  social_proof_score INTEGER CHECK (social_proof_score BETWEEN 0 AND 100),
  value_proposition_score INTEGER CHECK (value_proposition_score BETWEEN 0 AND 100),
  mobile_cro_score INTEGER CHECK (mobile_cro_score BETWEEN 0 AND 100),

  -- CRO metadata
  cta_count INTEGER DEFAULT 0,
  cta_texts JSONB DEFAULT '[]',
  form_count INTEGER DEFAULT 0,
  has_trust_badges BOOLEAN DEFAULT FALSE,
  has_testimonials BOOLEAN DEFAULT FALSE,
  has_social_proof BOOLEAN DEFAULT FALSE,
  has_value_prop BOOLEAN DEFAULT FALSE,

  -- Page metadata
  word_count INTEGER DEFAULT 0,
  response_time_ms INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_seo_audits_type ON seo_audits(audit_type);
CREATE INDEX IF NOT EXISTS idx_seo_audits_created ON seo_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_page_scores_audit ON seo_page_scores(audit_id);
CREATE INDEX IF NOT EXISTS idx_seo_page_scores_path ON seo_page_scores(page_path);
