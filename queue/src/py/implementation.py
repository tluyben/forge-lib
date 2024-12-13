"""
Core implementation of the queue interface.
"""

from typing import Dict, Any, cast

from .types import Queue, QueueConfig, QueueImplementation
from .config import register_implementation, validate_config, get_implementation

# Registry of queue implementations
implementations: Dict[str, QueueImplementation] = {}

def createQueue(config: QueueConfig, name: str) -> Queue:
    """Create a new queue instance."""
    validate_config(config)
    implementation_name = get_implementation(config)

    implementation = implementations.get(implementation_name)
    if not implementation:
        raise ValueError(f"Implementation {implementation_name} not found")

    return implementation.createQueue(config, name)


# Import and register the RQ implementation by default
from .rq.implementation import implementation as rq_implementation
register_implementation("rq", rq_implementation)
