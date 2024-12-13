import { Database, DatabaseConfig, DatabaseImplementation } from "./types";
import { validateConfig, getImplementation } from "./config";

const implementations: { [key: string]: DatabaseImplementation } = {};

export async function registerImplementation(
  name: string,
  implementation: DatabaseImplementation
): Promise<void> {
  implementations[name] = implementation;
}

export async function createDatabase(
  config: DatabaseConfig,
  name: string
): Promise<Database> {
  validateConfig(config);

  const implementationName = getImplementation(config);
  const implementation = implementations[implementationName];

  if (!implementation) {
    throw new Error(
      `Database implementation '${implementationName}' not found. Available implementations: ${Object.keys(
        implementations
      ).join(", ")}`
    );
  }

  try {
    return await implementation.createDatabase(config, name);
  } catch (error) {
    throw new Error(`Failed to create database connection: ${error.message}`);
  }
}
