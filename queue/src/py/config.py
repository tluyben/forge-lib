from typing import Dict, Any, cast

from .types import Queue, QueueConfig, QueueImplementation

# Registry of queue implementations
implementations: Dict[str, QueueImplementation] = {}


def register_implementation(name: str, implementation: QueueImplementation) -> None:
    """Register a queue implementation."""
    implementations[name] = implementation


def create_config(config: Any) -> QueueConfig:
    """Create a queue configuration."""
    return cast(QueueConfig, config)


def validate_config(config: QueueConfig) -> None:
    """Validate queue configuration."""
    if not config.get('implementation'):
        raise ValueError("Queue implementation must be specified")
    
    if not isinstance(config['implementation'], list):
        raise ValueError("Implementation must be a list of strings")
    
    if not config['implementation']:
        raise ValueError("At least one implementation must be specified")


def get_implementation(config: QueueConfig) -> str:
    """Get the implementation name from config."""
    impls = config['implementation']
    for impl in impls:
        if impl in implementations:
            return impl
    raise ValueError(f"No available implementation found in {impls}")
