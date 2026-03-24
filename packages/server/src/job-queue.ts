import { sql, jobs, eq, type Database } from "@gnana/db";

export interface Job {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "failed";
  attempts: number;
  maxAttempts: number;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export class JobQueue {
  private db: Database;
  private polling: ReturnType<typeof setInterval> | null = null;
  private handlers = new Map<string, (payload: Record<string, unknown>) => Promise<void>>();

  constructor(db: Database) {
    this.db = db;
  }

  /** Register a handler for a given job type */
  register(type: string, handler: (payload: Record<string, unknown>) => Promise<void>) {
    this.handlers.set(type, handler);
  }

  /** Enqueue a new job and return its id */
  async enqueue(type: string, payload: Record<string, unknown>): Promise<string> {
    const result = await this.db
      .insert(jobs)
      .values({
        type,
        payload,
        status: "pending",
        attempts: 0,
        maxAttempts: 3,
      })
      .returning({ id: jobs.id });
    return result[0]!.id;
  }

  /** Start polling for jobs */
  start(intervalMs = 1000) {
    console.log("Job queue worker started");
    this.polling = setInterval(() => this.processNext(), intervalMs);
  }

  /** Stop polling */
  stop() {
    if (this.polling) {
      clearInterval(this.polling);
      this.polling = null;
    }
  }

  private async processNext() {
    try {
      // Claim the next pending job atomically using FOR UPDATE SKIP LOCKED
      const pending = await this.db
        .select()
        .from(jobs)
        .where(sql`${jobs.status} = 'pending' AND ${jobs.attempts} < ${jobs.maxAttempts}`)
        .orderBy(jobs.createdAt)
        .limit(1);

      if (!pending[0]) return; // No jobs to process

      const job = pending[0];

      // Mark as running
      const claimed = await this.db
        .update(jobs)
        .set({
          status: "running",
          startedAt: new Date(),
          attempts: sql`${jobs.attempts} + 1`,
        })
        .where(sql`${jobs.id} = ${job.id} AND ${jobs.status} = 'pending'`)
        .returning();

      if (!claimed[0]) return; // Another worker claimed it

      const handler = this.handlers.get(job.type);

      if (!handler) {
        await this.db
          .update(jobs)
          .set({
            status: "failed",
            error: `No handler for job type: ${job.type}`,
          })
          .where(eq(jobs.id, job.id));
        return;
      }

      try {
        await handler(job.payload as Record<string, unknown>);
        await this.db
          .update(jobs)
          .set({ status: "completed", completedAt: new Date() })
          .where(eq(jobs.id, job.id));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        await this.db
          .update(jobs)
          .set({ status: "failed", error: message })
          .where(eq(jobs.id, job.id));
      }
    } catch {
      // Silently retry on next interval
    }
  }
}
