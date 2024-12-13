# 🚀 Universal Queue Specification

A cross-language, stable queue API specification for the next century.

## 🎯 Overview

This specification defines a universal queueing interface that works consistently across any programming language or queueing backend. It provides a unified way to work with any type of queue implementation while maintaining strict backward compatibility.

## ✨ Features

- 🔄 Delayed and scheduled jobs
- ⏰ Cron-based recurring jobs
- 🔁 Retry mechanisms with flexible backoff
- 🎯 Job prioritization
- 📦 Dead letter queues (DLQ)
- 🎭 Job lifecycle callbacks
- 🏷️ Job tagging and categorization
- ⚡ Concurrent job processing
- 🔍 Job status tracking
- 🛑 Queue pause/resume capabilities

## 🛠️ Basic Usage

```typescript
// Create a basic queue
const config = createConfig({
  implementation: ["bullmq"],
  redis: "redis://localhost:6379", // default value
});

const queue = createQueue(config, "my-queue");

// Simple job
await queue.enqueue(myFunction, ["arg1", "arg2"]);

// Scheduled job
await queue.enqueue(myFunction, ["arg1"], {
  at: new Date("2024-12-25"),
});

// Recurring job
await queue.enqueue(myFunction, [], {
  cron: "0 9 * * *", // Every day at 9 AM
  repeat: 5, // Repeat 5 times
});

// Job with retries and DLQ
const dlq = createQueue(
  {
    implementation: ["bullmq"],
    is_dlq: true, // Creates a paused queue with DLQ defaults
  },
  "my-dlq"
);

await queue.enqueue(myFunction, [], {
  retry: [0, 2, 5, 30], // Retry after 0s, 2s, 5s, 30s
  dlq: dlq, // Reference to DLQ queue
});
```

## 🎛️ Configuration Options

### ⚙️ Queue Configuration

```typescript
{
    implementation: ['bullmq'],     // Required: Backend implementation
    redis: 'redis://localhost:6379', // Optional: Backend-specific config
    is_dlq: false                   // Optional: DLQ behavior
}
```

### 🎮 Job Options

```typescript
{
    // Identification (all optional with null defaults)
    id: "unique-id",              // Custom job ID
    name: "job-name",             // Job name for grouping
    tags: ["tag1", "tag2"],       // Categorization tags (default: [])

    // Timing (all optional)
    at: new Date(),              // Run at specific time
    cron: "* * * * *",          // Cron schedule
    repeat: 10,                  // Number of repetitions (default: 0)

    // Processing (all optional)
    priority: 1,                 // Priority level (default: 0)
    timeout: 5000,              // Timeout in ms (default: 0)
    retry: [0, 2, 5, 30],       // Retry delays in seconds (default: [])

    // Storage (all optional)
    keep_results: true,         // Keep completed job data (default: true)
    ttl: 3600,                 // Time to live in seconds (default: 0)

    // Error Handling (optional)
    dlq: "dlq-name" | Queue     // DLQ name or instance (default: null)
}
```

## 📦 Dead Letter Queues (DLQ)

DLQs are implemented as regular queues with specific defaults. Here's how to use them:

```typescript
// Create a DLQ
const dlq = createQueue(
  {
    implementation: ["bullmq"],
    is_dlq: true, // This queue starts paused
  },
  "my-dlq"
);

// Use it with a job
await queue.enqueue(myFunction, [], {
  retry: [0, 2, 5, 30],
  dlq: dlq,
});

// Later, process failed jobs
await dlq.resume(); // Start processing failed jobs
```

## 🎮 Queue Control

```typescript
// Pause job processing
await queue.pause();

// Resume job processing
await queue.resume();

// Get specific job
const job = await queue.getJob("job-id");

// Get jobs by status
const jobs = await queue.getJobs("completed");
```

## 🔍 Job States

Jobs can be in the following states:

- 🆕 `waiting`: Waiting to be processed
- ⏳ `delayed`: Scheduled for future processing
- 🏃 `active`: Currently being processed
- ✅ `completed`: Successfully completed
- ❌ `failed`: Failed and won't be retried
- 🔄 `retrying`: Failed and waiting for retry

## 🎯 Implementation Notes

- All numeric values like `timeout`, `ttl`, and elements in `retry` are unsigned
- Time values are in milliseconds for timeouts and seconds for TTL/retry delays
- Queue names must be unique within the same backend
- Job IDs are auto-generated if not provided
- Default values ensure consistent behavior across implementations

## 🤝 Contributing

While the core specification is stable and won't change, we welcome:

- Additional backend implementations
- Language-specific bindings
- Documentation improvements
- Test cases and validation tools

## 📜 License

MIT

---

Built with ❤️ by the Queue Specification Team
