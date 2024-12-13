import { QueueConfig } from "./types";

export function validateConfig(config: QueueConfig): void {
  if (
    !config.implementation ||
    !Array.isArray(config.implementation) ||
    config.implementation.length === 0
  ) {
    throw new Error("At least one implementation must be specified");
  }

  // Validate Redis configuration for implementations that require it
  if (config.implementation.includes("bullmq") && !config.redis) {
    config.redis = "redis://localhost:6379"; // Set default as per spec
  }
}

export function getImplementation(config: QueueConfig): string {
  // Return the first valid implementation
  const impl = config.implementation[0];
  if (!impl) {
    throw new Error("No valid implementation found");
  }
  return impl;
}
