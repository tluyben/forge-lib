import { Queue, QueueConfig, QueueImplementation } from "./types";
import { validateConfig, getImplementation } from "./config";

const implementations: { [key: string]: QueueImplementation } = {};

// Dynamic import of implementations
export async function registerImplementation(
  name: string,
  implementation: QueueImplementation
) {
  implementations[name] = implementation;
}

// Import the BullMQ implementation by default
import { implementation as bullMQImplementation } from "./node/bullmq/implementation";
registerImplementation("bullmq", bullMQImplementation);

export function createQueue(config: QueueConfig, name: string): Queue {
  validateConfig(config);
  const implementationName = getImplementation(config);

  const implementation = implementations[implementationName];
  if (!implementation) {
    throw new Error(`Implementation ${implementationName} not found`);
  }

  return implementation.createQueue(config, name);
}
