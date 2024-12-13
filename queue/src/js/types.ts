export type JobState =
  | "waiting"
  | "active"
  | "completed"
  | "failed"
  | "delayed"
  | "retrying";

export interface Job {
  id: string;
  name: string;
  state: JobState;
  data: any;
  args: any[];
  options: JobOptions;
  progress?: any;
  result?: any;
  error?: string;
  attemptsMade: number;
  finishedOn?: Date;
  processedOn?: Date;
}

export interface QueueConfig {
  implementation: string[];
  redis?: string;
  is_dlq?: boolean;
}

export interface BackoffOptions {
  type: "linear" | "exponential" | "custom";
  delay: number;
}

export interface JobOptions {
  id?: string;
  name?: string;
  tags?: string[];
  at?: Date;
  cron?: string;
  repeat?: number;
  priority?: number;
  timeout?: number;
  retry?: number[];
  dlq?: string | Queue;
  keep_results?: boolean;
  ttl?: number;
  backoff?: BackoffOptions;
  on_start?: (job: Job) => void;
  on_complete?: (job: Job, result: any) => void;
  on_progress?: (job: Job, progress: any) => void;
  on_retry?: (job: Job, error: Error) => void;
  on_failed?: (job: Job, error: Error) => void;
}

export interface Queue {
  enqueue(func: Function, args?: any[], options?: JobOptions): Promise<Job>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  getJob(jobId: string): Promise<Job | null>;
  getJobs(status: JobState): Promise<Job[]>;
}

export interface QueueImplementation {
  createQueue(config: QueueConfig, name: string): Queue;
}
