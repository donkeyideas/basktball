// Background Job Runner
// Uses node-cron for scheduling jobs
// Can be run as a separate worker process or triggered via API

import * as cron from "node-cron";
import { prisma } from "@/lib/db/prisma";

export type JobStatus = "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED";

export interface JobDefinition {
  name: string;
  description: string;
  schedule: string; // Cron expression
  enabled: boolean;
  handler: () => Promise<JobResult>;
}

export interface JobResult {
  success: boolean;
  itemsProcessed?: number;
  message?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Track running jobs to prevent overlaps
const runningJobs = new Set<string>();

// Log a job run to the database
async function logJobRun(
  jobName: string,
  status: JobStatus,
  startTime: Date,
  result?: JobResult
): Promise<void> {
  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();

  try {
    await prisma.jobRun.create({
      data: {
        jobName,
        status,
        startedAt: startTime,
        endedAt: endTime,
        duration,
        itemsProcessed: result?.itemsProcessed || 0,
        error: result?.error || null,
        metadata: result?.metadata ? JSON.parse(JSON.stringify(result.metadata)) : undefined,
      },
    });
  } catch (error) {
    console.error(`Failed to log job run for ${jobName}:`, error);
  }
}

// Execute a job with error handling and logging
async function executeJob(job: JobDefinition): Promise<void> {
  // Skip if job is already running
  if (runningJobs.has(job.name)) {
    console.log(`Job ${job.name} is already running, skipping...`);
    await logJobRun(job.name, "SKIPPED", new Date(), {
      success: false,
      message: "Job already running",
    });
    return;
  }

  const startTime = new Date();
  runningJobs.add(job.name);

  console.log(`[${startTime.toISOString()}] Starting job: ${job.name}`);

  try {
    const result = await job.handler();

    if (result.success) {
      console.log(`[${new Date().toISOString()}] Job ${job.name} completed successfully`);
      await logJobRun(job.name, "SUCCESS", startTime, result);
    } else {
      console.error(`[${new Date().toISOString()}] Job ${job.name} failed: ${result.error}`);
      await logJobRun(job.name, "FAILED", startTime, result);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${new Date().toISOString()}] Job ${job.name} threw exception:`, error);
    await logJobRun(job.name, "FAILED", startTime, {
      success: false,
      error: errorMessage,
    });
  } finally {
    runningJobs.delete(job.name);
  }
}

// Schedule all jobs
export function scheduleJobs(jobs: JobDefinition[]): void {
  for (const job of jobs) {
    if (!job.enabled) {
      console.log(`Job ${job.name} is disabled, skipping...`);
      continue;
    }

    if (!cron.validate(job.schedule)) {
      console.error(`Invalid cron expression for job ${job.name}: ${job.schedule}`);
      continue;
    }

    cron.schedule(job.schedule, () => {
      executeJob(job);
    });

    console.log(`Scheduled job: ${job.name} (${job.schedule})`);
  }
}

// Run a job immediately (for manual triggering)
export async function runJobNow(jobs: JobDefinition[], jobName: string): Promise<JobResult> {
  const job = jobs.find((j) => j.name === jobName);

  if (!job) {
    return { success: false, error: `Job not found: ${jobName}` };
  }

  if (runningJobs.has(jobName)) {
    return { success: false, error: "Job is already running" };
  }

  const startTime = new Date();
  runningJobs.add(jobName);

  try {
    const result = await job.handler();
    await logJobRun(jobName, result.success ? "SUCCESS" : "FAILED", startTime, result);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logJobRun(jobName, "FAILED", startTime, { success: false, error: errorMessage });
    return { success: false, error: errorMessage };
  } finally {
    runningJobs.delete(jobName);
  }
}

// Get recent job runs from database
export async function getRecentJobRuns(limit = 50): Promise<unknown[]> {
  try {
    return await prisma.jobRun.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("Failed to get recent job runs:", error);
    return [];
  }
}

// Get job status
export function getRunningJobs(): string[] {
  return Array.from(runningJobs);
}

// Check if a specific job is running
export function isJobRunning(jobName: string): boolean {
  return runningJobs.has(jobName);
}
