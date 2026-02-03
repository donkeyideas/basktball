import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Job definitions - these define what jobs exist and their schedules
const jobDefinitions = [
  {
    name: "fetch-live-scores",
    description: "Fetch live game scores from APIs",
    schedule: "*/2 * * * *",
    enabled: true,
  },
  {
    name: "daily-sync",
    description: "Full daily data synchronization",
    schedule: "0 5 * * *",
    enabled: true,
  },
  {
    name: "generate-insights",
    description: "Generate AI content for recent games",
    schedule: "0 6 * * *",
    enabled: true,
  },
  {
    name: "update-standings",
    description: "Update league standings",
    schedule: "0 */4 * * *",
    enabled: true,
  },
  {
    name: "cleanup-cache",
    description: "Clean expired cache entries",
    schedule: "0 */6 * * *",
    enabled: true,
  },
];

export async function GET() {
  try {
    // Get all job runs from the database
    const jobRuns = await prisma.jobRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 100,
    });

    // Build job status by finding the most recent run for each job
    const jobs = jobDefinitions.map((def) => {
      const runs = jobRuns.filter((r) => r.jobName === def.name);
      const lastRun = runs[0];

      // Calculate next run time based on cron schedule (simplified)
      const nextRun = calculateNextRun(def.schedule, lastRun?.startedAt);

      return {
        id: def.name,
        name: def.name,
        description: def.description,
        schedule: def.schedule,
        lastRun: lastRun?.startedAt?.toISOString() || null,
        nextRun: nextRun?.toISOString() || null,
        status: lastRun?.status?.toLowerCase() || "idle",
        duration: lastRun?.endedAt && lastRun?.startedAt
          ? lastRun.endedAt.getTime() - lastRun.startedAt.getTime()
          : null,
        enabled: def.enabled,
        error: lastRun?.error || null,
      };
    });

    // Get recent job history (last 20 runs)
    const history = jobRuns.slice(0, 20).map((run) => ({
      id: run.id,
      jobName: run.jobName,
      status: run.status.toLowerCase(),
      startedAt: run.startedAt.toISOString(),
      duration: run.endedAt && run.startedAt
        ? run.endedAt.getTime() - run.startedAt.getTime()
        : null,
      error: run.error || null,
    }));

    return NextResponse.json({
      success: true,
      jobs,
      history,
    });
  } catch (error) {
    console.error("Jobs API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch jobs data" },
      { status: 500 }
    );
  }
}

// Simple cron parser to calculate next run time
function calculateNextRun(schedule: string, lastRun?: Date | null): Date {
  const now = new Date();
  const parts = schedule.split(" ");

  // Handle common patterns
  if (parts[0].startsWith("*/")) {
    // Every X minutes
    const minutes = parseInt(parts[0].slice(2));
    const next = new Date(now);
    next.setMinutes(Math.ceil(next.getMinutes() / minutes) * minutes);
    next.setSeconds(0);
    next.setMilliseconds(0);
    if (next <= now) {
      next.setMinutes(next.getMinutes() + minutes);
    }
    return next;
  }

  if (parts[1].startsWith("*/")) {
    // Every X hours
    const hours = parseInt(parts[1].slice(2));
    const next = new Date(now);
    next.setHours(Math.ceil(next.getHours() / hours) * hours);
    next.setMinutes(parseInt(parts[0]) || 0);
    next.setSeconds(0);
    next.setMilliseconds(0);
    if (next <= now) {
      next.setHours(next.getHours() + hours);
    }
    return next;
  }

  // Daily at specific time (e.g., "0 5 * * *")
  if (parts[0] !== "*" && parts[1] !== "*" && parts[2] === "*") {
    const next = new Date(now);
    next.setHours(parseInt(parts[1]));
    next.setMinutes(parseInt(parts[0]));
    next.setSeconds(0);
    next.setMilliseconds(0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  // Default: return next hour
  const next = new Date(now);
  next.setHours(next.getHours() + 1);
  next.setMinutes(0);
  next.setSeconds(0);
  next.setMilliseconds(0);
  return next;
}
