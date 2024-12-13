import { Queue as BullQueue, QueueOptions, Job } from "bullmq";
import { adaptBullJob } from "./job-adapter";
import {
  Queue,
  QueueConfig,
  JobOptions,
  QueueImplementation,
} from "../../types";

class BullMQQueue implements Queue {
  private bullQueue: BullQueue;
  private config: QueueConfig;

  constructor(config: QueueConfig, name: string) {
    this.config = config;

    const queueOptions: QueueOptions = {
      connection: {
        host: new URL(config.redis || "redis://localhost:6379").hostname,
      },
    };

    if (config.is_dlq) {
      queueOptions.defaultJobOptions = {
        attempts: 1,
        removeOnComplete: false,
      };
    }

    this.bullQueue = new BullQueue(name, queueOptions);
  }

  async enqueue(
    func: Function,
    args: any[] = [],
    options: JobOptions = {}
  ): Promise<Job> {
    const jobData = {
      function: func.toString(),
      arguments: args,
    };

    const bullJobOptions: any = {
      jobId: options.id,
      priority: options.priority,
      delay: options.at
        ? Math.max(0, options.at.getTime() - Date.now())
        : undefined,
      attempts: options.retry ? options.retry.length + 1 : 1,
      backoff: this.configureBackoff(options),
      removeOnComplete: !options.keep_results,
      removeOnFail: false,
    };

    if (options.timeout) {
      bullJobOptions.timeout = options.timeout;
    }

    if (options.cron) {
      bullJobOptions.repeat = {
        pattern: options.cron,
        limit: options.repeat || undefined,
      };
    }

    if (options.dlq) {
      const dlqName =
        typeof options.dlq === "string"
          ? options.dlq
          : (options.dlq as Queue as any).bullQueue.name;
      bullJobOptions.moveToQueueOnFailed = dlqName;
    }

    const job = await this.bullQueue.add(
      options.name || "default",
      jobData,
      bullJobOptions
    );

    this.setupJobEvents(job, options);
    return job;
  }

  private setupJobEvents(job: Job, options: JobOptions): void {
    if (options.on_start) {
      job.on("active", () => options.on_start!(adaptBullJob(job)));
    }
    if (options.on_complete) {
      job.on("completed", (result) =>
        options.on_complete!(adaptBullJob(job), result)
      );
    }
    if (options.on_progress) {
      job.on("progress", (progress) =>
        options.on_progress!(adaptBullJob(job), progress)
      );
    }
    if (options.on_retry) {
      job.on("failed", (error) => {
        if (job.attemptsMade < (options.retry?.length || 0)) {
          options.on_retry!(adaptBullJob(job), error);
        }
      });
    }
    if (options.on_failed) {
      job.on("failed", (error) => {
        if (job.attemptsMade >= (options.retry?.length || 0)) {
          options.on_failed!(adaptBullJob(job), error);
        }
      });
    }
  }

  private configureBackoff(options: JobOptions): any {
    if (!options.backoff) {
      return options.retry
        ? {
            type: "fixed",
            delay: options.retry[0] * 1000,
          }
        : undefined;
    }

    return {
      type: options.backoff.type,
      delay: options.backoff.delay,
    };
  }

  async pause(): Promise<void> {
    await this.bullQueue.pause();
  }

  async resume(): Promise<void> {
    await this.bullQueue.resume();
  }

  async getJob(jobId: string): Promise<Job | null> {
    const bullJob = await this.bullQueue.getJob(jobId);
    return bullJob ? adaptBullJob(bullJob) : null;
  }

  async getJobs(
    status:
      | "waiting"
      | "active"
      | "completed"
      | "failed"
      | "delayed"
      | "retrying"
  ): Promise<Job[]> {
    let bullJobs: any;
    switch (status) {
      case "waiting":
        bullJobs = await this.bullQueue.getWaiting();
        break;
      case "active":
        bullJobs = await this.bullQueue.getActive();
        break;
      case "completed":
        bullJobs = await this.bullQueue.getCompleted();
        break;
      case "failed":
        bullJobs = await this.bullQueue.getFailed();
        break;
      case "delayed":
        bullJobs = await this.bullQueue.getDelayed();
        break;
      case "retrying":
        bullJobs = await this.bullQueue.getWaiting();
        break;
      default:
        throw new Error(`Invalid status: ${status}`);
    }
    return bullJobs!.map(adaptBullJob);
  }
}

export const implementation: QueueImplementation = {
  createQueue: (config: QueueConfig, name: string): Queue => {
    return new BullMQQueue(config, name);
  },
};
