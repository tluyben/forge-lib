"""
Type definitions for the queue interface.
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Callable, List, Optional, Protocol, Union
from typing_extensions import TypedDict


class JobState(str, Enum):
    """Possible states of a job."""
    WAITING = "waiting"
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"
    DELAYED = "delayed"
    RETRYING = "retrying"


class BackoffOptions(TypedDict):
    """Configuration for retry backoff strategy."""
    type: str  # "linear" | "exponential" | "custom"
    delay: int


class JobOptions(TypedDict, total=False):
    """Options for job enqueuing."""
    id: str
    name: str
    tags: List[str]
    at: datetime
    cron: str
    repeat: int
    priority: int
    timeout: int
    retry: List[int]
    dlq: Union[str, 'Queue']
    keep_results: bool
    ttl: int
    backoff: BackoffOptions
    on_start: Callable[['Job'], None]
    on_complete: Callable[['Job', Any], None]
    on_progress: Callable[['Job', Any], None]
    on_retry: Callable[['Job', Exception], None]
    on_failed: Callable[['Job', Exception], None]


@dataclass
class Job:
    """Represents a job in the queue."""
    id: str
    name: str
    state: JobState
    data: Any
    args: List[Any]
    options: JobOptions
    attemptsMade: int
    progress: Optional[Any] = None
    result: Optional[Any] = None
    error: Optional[str] = None
    finishedOn: Optional[datetime] = None
    processedOn: Optional[datetime] = None


class QueueConfig(TypedDict, total=False):
    """Configuration for queue initialization."""
    implementation: List[str]
    redis: str
    is_dlq: bool


class Queue(Protocol):
    """Queue interface protocol."""
    async def enqueue(
        self,
        func: Callable,
        args: Optional[List[Any]] = None,
        options: Optional[JobOptions] = None
    ) -> Job:
        """Enqueues a job in the queue."""
        ...

    async def pause(self) -> None:
        """Pauses job processing on the queue."""
        ...

    async def resume(self) -> None:
        """Resumes job processing on the queue."""
        ...

    async def getJob(self, jobId: str) -> Optional[Job]:
        """Retrieves a specific job by ID."""
        ...

    async def getJobs(self, status: JobState) -> List[Job]:
        """Retrieves jobs by status."""
        ...


class QueueImplementation(Protocol):
    """Plugin interface for queue implementations."""
    def createQueue(self, config: QueueConfig, name: str) -> Queue:
        """Factory function to create queue instances."""
        ...
