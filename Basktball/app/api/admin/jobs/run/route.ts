import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Map job names to their handler imports
const jobHandlers: Record<string, () => Promise<{ success: boolean; message?: string; error?: string }>> = {
  "live-scores": async () => {
    const { fetchLiveScores } = await import("@/lib/jobs/handlers");
    return fetchLiveScores();
  },
  "daily-sync": async () => {
    const { dailyDataSync } = await import("@/lib/jobs/handlers");
    return dailyDataSync();
  },
  "generate-insights": async () => {
    const { generateAiInsights } = await import("@/lib/jobs/handlers");
    return generateAiInsights();
  },
  "generate-previews": async () => {
    const { generateGamePreviews } = await import("@/lib/jobs/handlers");
    return generateGamePreviews();
  },
  "update-standings": async () => {
    const { updateStandings } = await import("@/lib/jobs/handlers");
    return updateStandings();
  },
  "cleanup-cache": async () => {
    const { cleanupCache } = await import("@/lib/jobs/handlers");
    return cleanupCache();
  },
  "sync-players": async () => {
    const { syncPlayers } = await import("@/lib/jobs/handlers");
    return syncPlayers();
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobName } = body;

    if (!jobName) {
      return NextResponse.json(
        { success: false, error: "Job name is required" },
        { status: 400 }
      );
    }

    const handler = jobHandlers[jobName];
    if (!handler) {
      return NextResponse.json(
        { success: false, error: `Unknown job: ${jobName}` },
        { status: 400 }
      );
    }

    // Record job start
    const jobRun = await prisma.jobRun.create({
      data: {
        jobName,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    try {
      // Execute the job
      const result = await handler();

      // Update job run with result
      await prisma.jobRun.update({
        where: { id: jobRun.id },
        data: {
          status: result.success ? "SUCCESS" : "FAILED",
          endedAt: new Date(),
          error: result.error || null,
        },
      });

      return NextResponse.json({
        success: true,
        jobName,
        result,
      });
    } catch (jobError) {
      // Update job run with error
      await prisma.jobRun.update({
        where: { id: jobRun.id },
        data: {
          status: "FAILED",
          endedAt: new Date(),
          error: jobError instanceof Error ? jobError.message : "Unknown error",
        },
      });

      return NextResponse.json(
        { success: false, error: jobError instanceof Error ? jobError.message : "Job failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Job run error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to run job" },
      { status: 500 }
    );
  }
}
