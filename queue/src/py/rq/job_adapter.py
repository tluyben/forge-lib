"""
Adapter for converting RQ jobs to our job interface.
"""

from datetime import datetime
from typing import Optional, cast

from rq.job import Job as RQJob

from ..types import Job, JobState, JobOptions


def get_job_state(rq_job: RQJob) -> JobState:
    """Convert RQ job status to our JobState enum."""
    status = rq_job.get_status()
    
    if status == 'queued':
        return JobState.WAITING
    elif status == 'started':
        return JobState.ACTIVE
    elif status == 'finished':
        return JobState.COMPLETED
    elif status == 'failed':
        return JobState.FAILED
    elif status == 'scheduled':
        return JobState.DELAYED
    elif status == 'deferred':
        return JobState.DELAYED
    else:
        # If the job has been retried, it will be in 'queued' state but with retry count > 0
        if rq_job.retries_left is not None and rq_job.retries_left < rq_job.retries:
            return JobState.RETRYING
        return JobState.WAITING


def adapt_rq_job(rq_job: RQJob) -> Job:
    """Convert an RQ job to our Job interface."""
    # Extract the original options that were passed when creating the job
    options = cast(JobOptions, getattr(rq_job, 'meta', {}).get('options', {}))
    
    # Get the error message if job failed
    error: Optional[str] = None
    if rq_job.exc_info:
        error = str(rq_job.exc_info)

    # Convert timestamps
    finished_on: Optional[datetime] = None
    if rq_job.ended_at:
        finished_on = datetime.fromtimestamp(float(rq_job.ended_at))
        
    processed_on: Optional[datetime] = None
    if rq_job.started_at:
        processed_on = datetime.fromtimestamp(float(rq_job.started_at))

    # Create our Job instance
    return Job(
        id=rq_job.id,
        name=rq_job.func_name,
        state=get_job_state(rq_job),
        data=rq_job.func,  # The actual function
        args=rq_job.args,
        options=options,
        attemptsMade=rq_job.retries - (rq_job.retries_left or 0) if rq_job.retries else 0,
        progress=getattr(rq_job, 'meta', {}).get('progress'),
        result=rq_job.result,
        error=error,
        finishedOn=finished_on,
        processedOn=processed_on
    )
