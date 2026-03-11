"use client";

import { useState, useEffect, useCallback } from "react";
import OverviewTab from "./tabs/OverviewTab";
import SeoAnalysisTab from "./tabs/SeoAnalysisTab";
import GeoAnalysisTab from "./tabs/GeoAnalysisTab";
import AeoAnalysisTab from "./tabs/AeoAnalysisTab";
import CroAnalysisTab from "./tabs/CroAnalysisTab";
import TechnicalTab from "./tabs/TechnicalTab";
import ContentTab from "./tabs/ContentTab";
import RecommendationsTab from "./tabs/RecommendationsTab";
import SearchTrafficTab from "./tabs/SearchTrafficTab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "search-traffic", label: "Search & Traffic" },
  { id: "seo", label: "SEO Analysis" },
  { id: "geo", label: "GEO Analysis" },
  { id: "aeo", label: "AEO Analysis" },
  { id: "cro", label: "CRO Analysis" },
  { id: "technical", label: "Technical" },
  { id: "content", label: "Content" },
  { id: "recommendations", label: "Recommendations" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface OverviewData {
  seoScore: number;
  geoScore: number;
  aeoScore?: number | null;
  croScore?: number | null;
  pagesAnalyzed: number;
  issues: { critical: number; warning: number; info: number };
  seoRadar: Array<{ axis: string; value: number }>;
  geoRadar: Array<{ axis: string; value: number }>;
  trendData: Array<{ date: string; seoScore: number; geoScore: number; responseTime: number }>;
  quickStats: {
    avgResponseTime: number;
    errorRate: number;
    totalArticles: number;
    publishedArticles: number;
    totalPlayers: number;
    totalTeams: number;
    totalInsights: number;
  };
}

interface PageAudit {
  id: string;
  path: string;
  title: string;
  hasMetaTitle: boolean;
  hasMetaDesc: boolean;
  hasKeywords: boolean;
  hasOgTags: boolean;
  indexStatus: string;
  seoScore: number;
  geoScore: number;
  geoBreakdown: {
    total: number;
    aiFriendliness: number;
    citationWorthiness: number;
    entityCoverage: number;
    faqStructure: number;
    eeat: number;
  };
  metaDescLength: number;
  titleLength: number;
  wordCount: number;
  keywords: string[];
  viewCount: number;
  lastUpdated: string;
  issues: string[];
}

interface AnalysisData {
  pages: PageAudit[];
  topKeywords: Array<{ keyword: string; count: number }>;
  targetKeywords: Array<{ keyword: string; covered: boolean }>;
  missingKeywords: string[];
  metaCompleteness: { complete: number; partial: number; missing: number; staticMissing: number };
  summary: { totalPages: number; avgSeoScore: number; avgGeoScore: number; pagesWithIssues: number };
}

interface Recommendation {
  id: string;
  severity: "critical" | "warning" | "info";
  category: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  fix: string;
  affectedPages?: string[];
}

interface RecommendationsData {
  recommendations: Recommendation[];
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
    categories: Array<{ category: string; count: number }>;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AeoCroData = Record<string, any>;

export default function AdminSeoGeoPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [recsData, setRecsData] = useState<RecommendationsData | null>(null);
  const [googleData, setGoogleData] = useState<{ gsc: unknown; ga4: unknown } | null>(null);
  const [aeoCroData, setAeoCroData] = useState<AeoCroData | null>(null);
  const [aeoCroLoading, setAeoCroLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewRes, analysisRes, recsRes, googleRes] = await Promise.all([
        fetch("/api/admin/seo/overview"),
        fetch("/api/admin/seo/analysis"),
        fetch("/api/admin/seo/recommendations"),
        fetch("/api/admin/seo/google").catch(() => null),
      ]);
      const [overviewJson, analysisJson, recsJson] = await Promise.all([
        overviewRes.json(),
        analysisRes.json(),
        recsRes.json(),
      ]);

      if (overviewJson.success) setOverviewData(overviewJson);
      if (analysisJson.success) setAnalysisData(analysisJson);
      if (recsJson.success) setRecsData(recsJson);

      if (googleRes) {
        const googleJson = await googleRes.json();
        if (googleJson.success) setGoogleData(googleJson);
      }

      if (!overviewJson.success && !analysisJson.success && !recsJson.success) {
        setError("Failed to load SEO & GEO data");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAeoCro = useCallback(async (forceRescan = false) => {
    setAeoCroLoading(true);
    try {
      const res = forceRescan
        ? await fetch("/api/admin/seo/aeo-cro", { method: "POST" })
        : await fetch("/api/admin/seo/aeo-cro");
      const json = await res.json();
      if (json.success) {
        setAeoCroData(json);
        // Update overview scores if available
        if (overviewData) {
          setOverviewData({ ...overviewData, aeoScore: json.aeoScore, croScore: json.croScore });
        }
      }
    } catch {
      // Silently fail - tabs show "not scanned" state
    } finally {
      setAeoCroLoading(false);
    }
  }, [overviewData]);

  const handleTabClick = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    // Lazy-load AEO/CRO data when those tabs are first clicked
    if ((tabId === "aeo" || tabId === "cro") && !aeoCroData && !aeoCroLoading) {
      fetchAeoCro();
    }
  }, [aeoCroData, aeoCroLoading, fetchAeoCro]);

  const handleRescan = useCallback(() => {
    fetchAeoCro(true);
  }, [fetchAeoCro]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getScoreColor = (score: number) =>
    score >= 70 ? "var(--green)" : score >= 40 ? "var(--yellow)" : "var(--red)";

  return (
    <>
      <div className="admin-header">
        <h1>SEO & GEO INTELLIGENCE</h1>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {overviewData && (
            <div style={{ display: "flex", gap: "12px", marginRight: "15px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  fontFamily: "var(--font-roboto-mono), monospace",
                  color: getScoreColor(overviewData.seoScore)
                }}>
                  {overviewData.seoScore}
                </div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>SEO</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  fontFamily: "var(--font-roboto-mono), monospace",
                  color: getScoreColor(overviewData.geoScore)
                }}>
                  {overviewData.geoScore}
                </div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>GEO</div>
              </div>
              {aeoCroData && (
                <>
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      fontFamily: "var(--font-roboto-mono), monospace",
                      color: getScoreColor(aeoCroData.aeoScore)
                    }}>
                      {aeoCroData.aeoScore}
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>AEO</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      fontFamily: "var(--font-roboto-mono), monospace",
                      color: getScoreColor(aeoCroData.croScore)
                    }}>
                      {aeoCroData.croScore}
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>CRO</div>
                  </div>
                </>
              )}
            </div>
          )}
          <button className="btn btn-primary" onClick={fetchAll}>
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="seo-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`seo-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
            {tab.id === "recommendations" && recsData && (
              <span className="seo-tab-badge">{recsData.summary.total}</span>
            )}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Analyzing SEO & GEO data...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "var(--red)" }}>{error}</p>
          </div>
        ) : (
          <>
            {activeTab === "overview" && overviewData && (
              <OverviewTab data={overviewData} recsData={recsData} aeoCroData={aeoCroData} />
            )}
            {activeTab === "search-traffic" && (
              <SearchTrafficTab
                gsc={googleData?.gsc as Parameters<typeof SearchTrafficTab>[0]["gsc"]}
                ga4={googleData?.ga4 as Parameters<typeof SearchTrafficTab>[0]["ga4"]}
              />
            )}
            {activeTab === "seo" && analysisData && (
              <SeoAnalysisTab data={analysisData} />
            )}
            {activeTab === "geo" && analysisData && (
              <GeoAnalysisTab data={analysisData} />
            )}
            {activeTab === "aeo" && (
              aeoCroLoading ? (
                <div style={{ textAlign: "center", padding: "60px" }}>
                  <p style={{ color: "rgba(255,255,255,0.5)" }}>Scanning pages for AEO analysis...</p>
                </div>
              ) : (
                <AeoAnalysisTab data={aeoCroData as Parameters<typeof AeoAnalysisTab>[0]["data"]} onRescan={handleRescan} />
              )
            )}
            {activeTab === "cro" && (
              aeoCroLoading ? (
                <div style={{ textAlign: "center", padding: "60px" }}>
                  <p style={{ color: "rgba(255,255,255,0.5)" }}>Scanning pages for CRO analysis...</p>
                </div>
              ) : (
                <CroAnalysisTab data={aeoCroData as Parameters<typeof CroAnalysisTab>[0]["data"]} onRescan={handleRescan} />
              )
            )}
            {activeTab === "technical" && overviewData && (
              <TechnicalTab data={overviewData} analysisData={analysisData} />
            )}
            {activeTab === "content" && analysisData && (
              <ContentTab data={analysisData} />
            )}
            {activeTab === "recommendations" && recsData && (
              <RecommendationsTab data={recsData} />
            )}
          </>
        )}
      </div>
    </>
  );
}
