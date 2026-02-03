"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { cn } from "@/lib/utils";

interface ContentItem {
  id: string;
  title: string;
  type: "GAME_RECAP" | "PLAYER_ANALYSIS" | "BETTING" | "FANTASY" | "TRENDING";
  content: string;
  confidence: number;
  generatedAt: string;
  status: "pending" | "approved" | "rejected";
  metadata?: {
    playerName?: string;
    gameInfo?: string;
    issues?: string[];
  };
}

interface ContentData {
  success: boolean;
  content: ContentItem[];
  stats: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
}

const typeLabels: Record<ContentItem["type"], string> = {
  GAME_RECAP: "Game Recap",
  PLAYER_ANALYSIS: "Player Analysis",
  BETTING: "Betting Insight",
  FANTASY: "Fantasy Tip",
  TRENDING: "Trending",
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ContentPage() {
  const { data, isLoading } = useSWR<ContentData>("/api/admin/content", fetcher);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const allContent = data?.content || [];
  const stats = data?.stats || { pending: 0, approved: 0, rejected: 0, total: 0 };

  const filteredContent = filter === "all"
    ? allContent
    : allContent.filter(c => c.status === filter);

  const handleGenerateContent = async () => {
    setIsGenerating(true);
    try {
      await fetch("/api/admin/content/generate", { method: "POST" });
      await mutate("/api/admin/content");
    } catch (error) {
      console.error("Generate content error:", error);
    }
    setIsGenerating(false);
  };

  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    try {
      await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve", content: editedContent }),
      });
      await mutate("/api/admin/content");
      setSelectedContent(null);
    } catch (error) {
      console.error("Approve error:", error);
    }
    setIsProcessing(false);
  };

  const handleReject = async (id: string) => {
    setIsProcessing(true);
    try {
      await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "reject" }),
      });
      await mutate("/api/admin/content");
      setSelectedContent(null);
    } catch (error) {
      console.error("Reject error:", error);
    }
    setIsProcessing(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return;
    setIsProcessing(true);
    try {
      await fetch(`/api/admin/content/${id}`, { method: "DELETE" });
      await mutate("/api/admin/content");
      if (selectedContent?.id === id) setSelectedContent(null);
    } catch (error) {
      console.error("Delete error:", error);
    }
    setIsProcessing(false);
  };

  const handleSelect = (content: ContentItem) => {
    setSelectedContent(content);
    setEditedContent(content.content);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 w-64 bg-white/10 rounded animate-pulse" />
          <div className="h-10 w-48 bg-white/10 rounded animate-pulse" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card p-4 animate-pulse">
              <div className="h-8 w-16 bg-white/10 rounded mb-2" />
              <div className="h-4 w-20 bg-white/10 rounded" />
            </div>
          ))}
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-2 gap-6">
          <div className="section">
            <div className="section-header">
              <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-32 bg-white/10 rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div className="section">
            <div className="section-header">
              <div className="h-6 w-24 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="p-4">
              <div className="h-96 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[family-name:var(--font-anton)] text-3xl tracking-wider text-white">
          AI-GENERATED CONTENT
        </h1>
        <button
          onClick={handleGenerateContent}
          disabled={isGenerating}
          className="btn btn-primary"
        >
          {isGenerating ? (
            <>
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Generate New Content
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="stat-card p-4">
          <p className="stat-value text-2xl">{stats.total}</p>
          <p className="stat-label">Total Content</p>
        </div>
        <div className="stat-card p-4">
          <p className="stat-value text-2xl text-[var(--orange)]">{stats.pending}</p>
          <p className="stat-label">Pending Review</p>
        </div>
        <div className="stat-card p-4">
          <p className="stat-value text-2xl text-[var(--green)]">{stats.approved}</p>
          <p className="stat-label">Approved</p>
        </div>
        <div className="stat-card p-4">
          <p className="stat-value text-2xl text-[var(--red)]">{stats.rejected}</p>
          <p className="stat-label">Rejected</p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Content List */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Content Queue</h2>
            <div className="flex gap-2">
              {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded transition-colors capitalize",
                    filter === f
                      ? "bg-[var(--orange)] text-white"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[600px] overflow-auto">
            {filteredContent.length === 0 ? (
              <div className="p-8 text-center text-white/30">
                No content found
              </div>
            ) : (
              filteredContent.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    "content-item cursor-pointer",
                    selectedContent?.id === item.id && "border-l-2 border-[var(--orange)] bg-[var(--orange)]/5"
                  )}
                >
                  <h3 className="content-title">
                    {item.title || typeLabels[item.type]}
                  </h3>
                  <div className="content-meta">
                    <span>{typeLabels[item.type]}</span>
                    <span>{new Date(item.generatedAt).toLocaleString()}</span>
                    <span className={cn(
                      item.confidence >= 0.8 ? "text-[var(--green)]" :
                      item.confidence >= 0.6 ? "text-[var(--yellow)]" :
                      "text-[var(--red)]"
                    )}>
                      Quality: {(item.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="content-preview">{item.content}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className={cn(
                      "text-xs px-2 py-1 rounded",
                      item.status === "pending" && "bg-[var(--orange)]/20 text-[var(--orange)]",
                      item.status === "approved" && "bg-[var(--green)]/20 text-[var(--green)]",
                      item.status === "rejected" && "bg-[var(--red)]/20 text-[var(--red)]"
                    )}>
                      {item.status}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSelect(item); }}
                        className="btn-small"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      {item.status === "pending" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleApprove(item.id); }}
                          className="btn-run"
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="btn-delete"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Editor</h2>
            {selectedContent && (
              <button
                onClick={() => setSelectedContent(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {selectedContent ? (
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Content Type</label>
                <span className="text-[var(--orange)] font-medium">
                  {typeLabels[selectedContent.type]}
                </span>
              </div>
              {selectedContent.metadata?.gameInfo && (
                <div className="mb-4">
                  <label className="block text-white/60 text-sm mb-2">Game Info</label>
                  <span className="text-white">{selectedContent.metadata.gameInfo}</span>
                </div>
              )}
              {selectedContent.metadata?.playerName && (
                <div className="mb-4">
                  <label className="block text-white/60 text-sm mb-2">Player</label>
                  <span className="text-white">{selectedContent.metadata.playerName}</span>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Content</label>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={12}
                  className="w-full bg-[var(--darker-gray)] border border-white/10 text-white p-4 text-sm leading-relaxed focus:border-[var(--orange)] outline-none resize-none rounded"
                />
                <div className="flex justify-between mt-2 text-xs text-white/40">
                  <span>{editedContent.length} characters</span>
                  <span>Quality Score: {(selectedContent.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              {selectedContent.metadata?.issues && selectedContent.metadata.issues.length > 0 && (
                <div className="mb-4 p-3 bg-[var(--red)]/10 rounded border border-[var(--red)]/20">
                  <p className="text-[var(--red)] text-sm font-medium mb-2">Issues Detected:</p>
                  <ul className="space-y-1">
                    {selectedContent.metadata.issues.map((issue, i) => (
                      <li key={i} className="text-[var(--red)]/80 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => handleReject(selectedContent.id)}
                  disabled={isProcessing || selectedContent.status !== "pending"}
                  className="btn-delete flex-1"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedContent.id)}
                  disabled={isProcessing}
                  className="btn btn-primary flex-1"
                >
                  {selectedContent.status === "pending" ? "Approve & Publish" : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-white/30">
              <svg className="w-16 h-16 mx-auto mb-4 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Select content to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
