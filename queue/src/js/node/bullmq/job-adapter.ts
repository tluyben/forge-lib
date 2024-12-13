import { Job as BullJob } from "bullmq";
import { Job, JobState } from "../../types";

export function adaptBullJob(bullJob: BullJob): Job {
  let state: JobState = "waiting";

  if (bullJob.isActive()) state = "active";
  else if (bullJob.isCompleted()) state = "completed";
  else if (bullJob.isFailed()) state = "failed";
  else if (bullJob.isDelayed()) state = "delayed";
  else if (bullJob.isWaiting() && bullJob.attemptsMade > 0) state = "retrying";

  return {
    id: bullJob.id!,
    name: bullJob.name,
    state,
    data: bullJob.data.function,
    args: bullJob.data.arguments,
    options: bullJob.opts,
    attemptsMade: bullJob.attemptsMade,
    progress: bullJob.progress,
    result: bullJob.returnvalue,
    error: bullJob.failedReason,
    finishedOn: bullJob.finishedOn ? new Date(bullJob.finishedOn) : undefined,
    processedOn: bullJob.processedOn
      ? new Date(bullJob.processedOn)
      : undefined,
  };
}
