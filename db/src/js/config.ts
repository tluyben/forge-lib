import { DatabaseConfig, PoolConfig } from "./types";

const DEFAULT_POOL_CONFIG: PoolConfig = {
  min: 0,
  max: 10,
  idle_timeout: 10000,
};

export function validateConfig(config: DatabaseConfig): void {
  if (
    !config.implementation ||
    !Array.isArray(config.implementation) ||
    config.implementation.length === 0
  ) {
    throw new Error("At least one implementation must be specified");
  }

  if (!config.host) {
    throw new Error("Database host is required");
  }

  if (!config.username) {
    throw new Error("Database username is required");
  }

  if (!config.password) {
    throw new Error("Database password is required");
  }

  if (!config.database) {
    throw new Error("Database name is required");
  }

  // Apply defaults for pool configuration
  if (!config.pool) {
    config.pool = { ...DEFAULT_POOL_CONFIG };
  } else {
    config.pool = {
      ...DEFAULT_POOL_CONFIG,
      ...config.pool,
    };
  }

  // Validate pool configuration
  if (config.pool.min! < 0) {
    throw new Error("Pool minimum connections cannot be negative");
  }

  if (config.pool.max! <= 0) {
    throw new Error("Pool maximum connections must be greater than 0");
  }

  if (config.pool.min! > config.pool.max!) {
    throw new Error(
      "Pool minimum connections cannot be greater than maximum connections"
    );
  }

  if (config.pool.idle_timeout! < 0) {
    throw new Error("Pool idle timeout cannot be negative");
  }
}

export function getImplementation(config: DatabaseConfig): string {
  const impl = config.implementation[0];
  if (!impl) {
    throw new Error("No valid implementation found");
  }
  return impl;
}
