"""
RQ implementation of the queue interface.
"""

import asyncio
from datetime import datetime
from typing import Any, Callable, List, Optional, cast
from urllib.parse import urlparse

from redis import Redis
from rq import Queue as RQQueue
from rq.job import Job as RQJob
from rq.registry import (
    FailedJobRegistry,
    FinishedJobRegistry,
    StartedJobRegistry,
    DeferredJobRegistry,
    ScheduledJobRegistry
)

from ..types import Queue, QueueConfig, Job, JobOptions, JobState, QueueImplementation
from .job_adapter import adapt_rq_job


class RQQueueImpl(Queue):
    """RQ implementation of the Queue interface."""
    
    def __init__(self, config: QueueConfig, name: str):
        """Initialize RQ queue."""
        self.config = config
        self.name = name
        
        # Parse Redis connection URL
        url = urlparse(config.get('redis', 'redis://localhost:6379'))
        self.redis = Redis(
            host=url.hostname or 'localhost',
            port=url.port or 6379,
            db=0,
            decode_responses=True
        )
        
        # Create RQ queue
        queue_kwargs = {}
        if config.get('is_dlq'):
            queue_kwargs['is_async'] = False  # Process DLQ jobs immediately
            
        self.queue = RQQueue(
            name=name,
            connection=self.redis,
            **queue_kwargs
        )

    async def enqueue(
        self,
        func: Callable,
        args: Optional[List[Any]] = None,
        options: Optional[JobOptions] = None
    ) -> Job:
        """Enqueue a job."""
        args = args or []
        options = options or {}
        
        # Prepare job options
        job_kwargs = {
            'job_id': options.get('id'),
            'result_ttl': options.get('ttl', 500),  # Default 500s
            'meta': {'options': options},  # Store original options
        }
        
        # Handle scheduling
        if options.get('at'):
            job_kwargs['at_front'] = False
            job_kwargs['scheduled_for'] = options['at']
        
        # Handle priority
        if options.get('priority'):
            job_kwargs['at_front'] = options['priority'] > 0
            
        # Handle timeout
        if options.get('timeout'):
            job_kwargs['job_timeout'] = options['timeout'] / 1000  # Convert ms to seconds
            
        # Handle retries
        if options.get('retry'):
            job_kwargs['retry'] = len(options['retry'])
            # RQ doesn't support custom retry delays, we use exponential backoff
            if options.get('backoff'):
                job_kwargs['retry_interval'] = options['backoff']['delay'] / 1000
        
        # Enqueue the job
        rq_job = self.queue.enqueue_call(
            func=func,
            args=args,
            **job_kwargs
        )
        
        # Set up job event handlers if provided
        if options.get('on_start'):
            self._setup_job_start_handler(rq_job, options['on_start'])
        if options.get('on_complete'):
            self._setup_job_complete_handler(rq_job, options['on_complete'])
        if options.get('on_failed'):
            self._setup_job_failed_handler(rq_job, options['on_failed'])
        
        return adapt_rq_job(rq_job)

    def _setup_job_start_handler(self, job: RQJob, handler: Callable[[Job], None]) -> None:
        """Set up handler for job start event."""
        def on_start():
            handler(adapt_rq_job(job))
        job.started_job_registry.add(job, pipeline=None)
        
    def _setup_job_complete_handler(self, job: RQJob, handler: Callable[[Job, Any], None]) -> None:
        """Set up handler for job completion event."""
        def on_complete():
            handler(adapt_rq_job(job), job.result)
        job.set_meta('on_complete', on_complete)
        
    def _setup_job_failed_handler(self, job: RQJob, handler: Callable[[Job, Exception], None]) -> None:
        """Set up handler for job failure event."""
        def on_failed():
            if job.exc_info:
                handler(adapt_rq_job(job), job.exc_info)
        job.set_meta('on_failed', on_failed)

    async def pause(self) -> None:
        """Pause the queue."""
        # RQ doesn't have built-in pause functionality
        # We implement it by temporarily stopping the workers
        self.redis.set(f'queue:{self.name}:paused', '1')

    async def resume(self) -> None:
        """Resume the queue."""
        self.redis.delete(f'queue:{self.name}:paused')

    async def getJob(self, jobId: str) -> Optional[Job]:
        """Get a job by ID."""
        rq_job = self.queue.fetch_job(jobId)
        return adapt_rq_job(rq_job) if rq_job else None

    async def getJobs(self, status: JobState) -> List[Job]:
        """Get jobs by status."""
        jobs: List[RQJob] = []
        
        if status == JobState.WAITING:
            jobs = self.queue.get_jobs()
        elif status == JobState.ACTIVE:
            registry = StartedJobRegistry(queue=self.queue)
            jobs = [self.queue.fetch_job(job_id) for job_id in registry.get_job_ids()]
        elif status == JobState.COMPLETED:
            registry = FinishedJobRegistry(queue=self.queue)
            jobs = [self.queue.fetch_job(job_id) for job_id in registry.get_job_ids()]
        elif status == JobState.FAILED:
            registry = FailedJobRegistry(queue=self.queue)
            jobs = [self.queue.fetch_job(job_id) for job_id in registry.get_job_ids()]
        elif status == JobState.DELAYED:
            # Combine scheduled and deferred jobs
            scheduled_registry = ScheduledJobRegistry(queue=self.queue)
            deferred_registry = DeferredJobRegistry(queue=self.queue)
            job_ids = scheduled_registry.get_job_ids() + deferred_registry.get_job_ids()
            jobs = [self.queue.fetch_job(job_id) for job_id in job_ids]
        elif status == JobState.RETRYING:
            # Get all jobs and filter for retrying ones
            all_jobs = self.queue.get_jobs()
            jobs = [j for j in all_jobs if j.retries_left is not None and j.retries_left < j.retries]
            
        # Remove None values (jobs that may have been deleted)
        jobs = [j for j in jobs if j is not None]
        return [adapt_rq_job(job) for job in jobs]


# Export the implementation
implementation: QueueImplementation = QueueImplementation(
    createQueue=lambda config, name: RQQueueImpl(config, name)
)
