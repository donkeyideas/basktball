"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { cn } from "@/lib/utils";

interface PendingContent {
  id: string;
  type: "GAME_RECAP" | "PLAYER_ANALYSIS" | "BETTING" | "FANTASY" | "TRENDING";
  content: string;
  confidence: number;
  generatedAt: string;
  metadata?: {
    playerName?: string;
    gameInfo?: string;
    issues?: string[];
  };
}

interface ContentData {
  success: boolean;
  pendingContent: PendingContent[];
  stats: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

const typeColors: Record<PendingContent["type"], string> = {
  GAME_RECAP: "bg-blue-500/20 text-blue-400",
  PLAYER_ANALYSIS: "bg-green-500/20 text-green-400",
  BETTING: "bg-yellow-500/20 text-yellow-400",
  FANTASY: "bg-purple-500/20 text-purple-400",
  TRENDING: "bg-orange-500/20 text-[var(--orange)]",
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ContentReviewPage() {
  const { data, isLoading } = useSWR<ContentData>("/api/admin/content", fetcher);
  const [selectedContent, setSelectedContent] = useState<PendingContent | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingContent = data?.pendingContent || [];
  const stats = data?.stats || { pending: 0, approved: 0, rejected: 0 };

  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    try {
      await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve", content: editedContent }),
      });
      mutate("/api/admin/content");
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
      mutate("/api/admin/content");
      setSelectedContent(null);
    } catch (error) {
      console.error("Reject error:", error);
    }
    setIsProcessing(false);
  };

  const handleSelect = (content: PendingContent) => {
    setSelectedContent(content);
    setEditedContent(content.content);
  };

  const avgConfidence = pendingContent.length > 0
    ? ((pendingContent.reduce((sum, c) => sum + c.confidence, 0) / pendingContent.length) * 100).toFixed(0)
    : 0;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col p-3 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-16 bg-white/10 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-1.5">
          <div className="bg-[var(--dark-gray)] rounded animate-pulse" />
          <div className="bg-[var(--dark-gray)] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-3 overflow-hidden">
      {/* Header + Stats */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <h1 className="font-[family-name:var(--font-anton)] text-xl tracking-wider text-white">
            CONTENT REVIEW
          </h1>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">Pending:</span>
              <span className="font-mono text-[var(--orange)]">{stats.pending}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">Approved:</span>
              <span className="font-mono text-green-400">{stats.approved}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">Rejected:</span>
              <span className="font-mono text-red-400">{stats.rejected}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/40">Avg Conf:</span>
              <span className="font-mono text-white">{avgConfidence}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-1.5">
        {/* Queue */}
        <div className="bg-[var(--dark-gray)] rounded flex flex-col overflow-hidden">
          <div className="px-2 py-1.5 border-b border-white/10">
            <h2 className="font-semibold text-white text-xs uppercase tracking-wide">Review Queue</h2>
          </div>
          {pendingContent.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/30 text-xs">No content pending review</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-1.5 space-y-1">
              {pendingContent.map((content) => (
                <div
                  key={content.id}
                  onClick={() => handleSelect(content)}
                  className={cn(
                    "p-2 bg-[var(--black)] cursor-pointer transition-colors rounded border",
                    selectedContent?.id === content.id
                      ? "border-[var(--orange)]"
                      : "border-transparent hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded", typeColors[content.type])}>
                      {content.type.replace("_", " ")}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold",
                        content.confidence >= 0.8 ? "text-green-400"
                          : content.confidence >= 0.6 ? "text-yellow-400"
                          : "text-red-400"
                      )}
                    >
                      {(content.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-white text-[10px] line-clamp-2 mb-1">{content.content}</p>
                  {content.metadata?.issues && content.metadata.issues.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mb-1">
                      {content.metadata.issues.map((issue, i) => (
                        <span key={i} className="text-[8px] bg-red-500/10 text-red-400 px-1 py-0.5 rounded">
                          {issue}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-white/30 text-[9px]">
                    {new Date(content.generatedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="bg-[var(--dark-gray)] rounded flex flex-col overflow-hidden">
          {selectedContent ? (
            <>
              <div className="px-2 py-1.5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded", typeColors[selectedContent.type])}>
                    {selectedContent.type.replace("_", " ")}
                  </span>
                  {selectedContent.metadata?.gameInfo && (
                    <span className="text-[10px] text-white/40">{selectedContent.metadata.gameInfo}</span>
                  )}
                  {selectedContent.metadata?.playerName && (
                    <span className="text-[10px] text-white/40">{selectedContent.metadata.playerName}</span>
                  )}
                </div>
                <button onClick={() => setSelectedContent(null)} className="text-white/40 hover:text-white text-xs">x</button>
              </div>

              <div className="flex-1 p-2 flex flex-col">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="flex-1 w-full bg-[var(--black)] border border-white/10 text-white p-2 text-[10px] leading-relaxed focus:border-[var(--orange)] outline-none resize-none rounded"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-white/40">{editedContent.length} chars</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleReject(selectedContent.id)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-red-500/20 text-red-400 text-[10px] font-semibold rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      REJECT
                    </button>
                    <button
                      onClick={() => handleApprove(selectedContent.id)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-[var(--orange)] text-white text-[10px] font-semibold rounded hover:bg-[var(--orange)]/80 transition-colors disabled:opacity-50"
                    >
                      APPROVE
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/30 text-xs">Select content to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
