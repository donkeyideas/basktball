"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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

// Mock pending content
const mockPendingContent: PendingContent[] = [
  {
    id: "1",
    type: "GAME_RECAP",
    content: "The Los Angeles Lakers secured a thrilling 112-108 victory over the Golden State Warriors in a game that came down to the final seconds. LeBron James led the way with 28 points, 8 rebounds, and 9 assists, showcasing his trademark versatility. Anthony Davis added 24 points and 12 rebounds, dominating the paint on both ends. Stephen Curry kept the Warriors in contention with 32 points, but it wasn't enough as the Lakers' defense clamped down in the fourth quarter.",
    confidence: 0.72,
    generatedAt: "2024-01-15T14:30:00Z",
    metadata: {
      gameInfo: "LAL vs GSW - Jan 15",
      issues: ["Low confidence score"],
    },
  },
  {
    id: "2",
    type: "PLAYER_ANALYSIS",
    content: "Luka Doncic continues his MVP-caliber season with another impressive performance. Over his last 5 games, he's averaging 32.4 points, 9.2 rebounds, and 8.8 assists while shooting 48% from the field. His usage rate of 37.2% leads the league, and his true shooting percentage of 59.1% shows he's doing it efficiently. The Mavericks are 4-1 in this stretch with Doncic as the clear engine of their offense.",
    confidence: 0.65,
    generatedAt: "2024-01-15T12:00:00Z",
    metadata: {
      playerName: "Luka Doncic",
      issues: ["Contains repetitive phrasing"],
    },
  },
  {
    id: "3",
    type: "BETTING",
    content: "For tonight's matchup between the Celtics and Bucks, Boston comes in as 5-point favorites. The Celtics are 8-2 ATS in their last 10 home games, while Milwaukee has struggled on the road going 4-6 ATS. Key injury: Khris Middleton remains questionable. The total is set at 228.5 - these teams have gone OVER in 7 of their last 10 meetings. Consider the Celtics spread and the over. Remember: betting involves significant risk.",
    confidence: 0.78,
    generatedAt: "2024-01-15T10:00:00Z",
    metadata: {
      gameInfo: "BOS vs MIL - Tonight",
    },
  },
];

const typeColors: Record<PendingContent["type"], string> = {
  GAME_RECAP: "bg-blue-500/20 text-blue-400",
  PLAYER_ANALYSIS: "bg-green-500/20 text-green-400",
  BETTING: "bg-yellow-500/20 text-yellow-400",
  FANTASY: "bg-purple-500/20 text-purple-400",
  TRENDING: "bg-orange-500/20 text-[var(--orange)]",
};

export default function ContentReviewPage() {
  const [pendingContent, setPendingContent] = useState(mockPendingContent);
  const [selectedContent, setSelectedContent] = useState<PendingContent | null>(null);
  const [editedContent, setEditedContent] = useState("");

  const handleApprove = async (id: string) => {
    // In production, call API
    setPendingContent((prev) => prev.filter((c) => c.id !== id));
    setSelectedContent(null);
  };

  const handleReject = async (id: string) => {
    // In production, call API
    setPendingContent((prev) => prev.filter((c) => c.id !== id));
    setSelectedContent(null);
  };

  const handleSelect = (content: PendingContent) => {
    setSelectedContent(content);
    setEditedContent(content.content);
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="font-[family-name:var(--font-anton)] text-2xl tracking-wider text-white">
          CONTENT REVIEW
        </h1>
        <p className="text-white/50 text-xs">
          Review and approve AI-generated content before publishing
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <Card variant="default" className="p-3">
          <p className="text-white/50 text-[10px] uppercase mb-1">Pending</p>
          <p className="font-[family-name:var(--font-roboto-mono)] text-lg text-[var(--orange)]">
            {pendingContent.length}
          </p>
        </Card>
        <Card variant="default" className="p-3">
          <p className="text-white/50 text-[10px] uppercase mb-1">Approved Today</p>
          <p className="font-[family-name:var(--font-roboto-mono)] text-lg text-green-400">
            24
          </p>
        </Card>
        <Card variant="default" className="p-3">
          <p className="text-white/50 text-[10px] uppercase mb-1">Rejected Today</p>
          <p className="font-[family-name:var(--font-roboto-mono)] text-lg text-red-400">
            3
          </p>
        </Card>
        <Card variant="default" className="p-3">
          <p className="text-white/50 text-[10px] uppercase mb-1">Avg Confidence</p>
          <p className="font-[family-name:var(--font-roboto-mono)] text-lg text-white">
            {pendingContent.length > 0
              ? (
                  (pendingContent.reduce((sum, c) => sum + c.confidence, 0) /
                    pendingContent.length) *
                  100
                ).toFixed(0)
              : 0}
            %
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Queue */}
        <div>
          <h2 className="font-semibold text-white text-sm mb-2">Review Queue</h2>
          {pendingContent.length === 0 ? (
            <Card variant="default" className="p-4 text-center">
              <p className="text-white/50 text-sm">No content pending review</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {pendingContent.map((content) => (
                <Card
                  key={content.id}
                  variant={selectedContent?.id === content.id ? "bordered" : "default"}
                  hover
                  className={cn(
                    "p-3 cursor-pointer",
                    selectedContent?.id === content.id && "border-[var(--orange)]"
                  )}
                  onClick={() => handleSelect(content)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={cn("text-xs px-2 py-0.5", typeColors[content.type])}>
                      {content.type.replace("_", " ")}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        content.confidence >= 0.8
                          ? "text-green-400"
                          : content.confidence >= 0.6
                            ? "text-yellow-400"
                            : "text-red-400"
                      )}
                    >
                      {(content.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-white text-sm line-clamp-2">{content.content}</p>
                  {content.metadata?.issues && content.metadata.issues.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {content.metadata.issues.map((issue, i) => (
                        <span key={i} className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5">
                          {issue}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-white/40 text-xs mt-2">
                    {new Date(content.generatedAt).toLocaleString()}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        <div>
          <h2 className="font-semibold text-white text-sm mb-2">Content Editor</h2>
          {selectedContent ? (
            <Card variant="bordered" className="p-3">
              <div className="flex items-center justify-between mb-4">
                <span className={cn("text-xs px-2 py-0.5", typeColors[selectedContent.type])}>
                  {selectedContent.type.replace("_", " ")}
                </span>
                {selectedContent.metadata?.gameInfo && (
                  <span className="text-xs text-white/50">
                    {selectedContent.metadata.gameInfo}
                  </span>
                )}
                {selectedContent.metadata?.playerName && (
                  <span className="text-xs text-white/50">
                    {selectedContent.metadata.playerName}
                  </span>
                )}
              </div>

              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-48 bg-[var(--black)] border border-[var(--border)] text-white p-3 text-xs leading-relaxed focus:border-[var(--orange)] outline-none resize-none"
              />

              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-white/50">
                  {editedContent.length} characters
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleReject(selectedContent.id)}
                  >
                    REJECT
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(selectedContent.id)}
                  >
                    APPROVE
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card variant="default" className="p-4 text-center">
              <p className="text-white/50 text-sm">Select content to review</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
