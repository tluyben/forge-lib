# Forge-lib 🛠️

**Universal Cross-Language APIs with Guaranteed Stability**

## What is Forge-lib? 🤔

Forge-lib is a revolutionary approach to building truly cross-language, cross-platform libraries with guaranteed API stability. Our philosophy is simple: define once, implement everywhere, use forever. We provide a rigorous type system and function specification that works across any programming language, from C to Lisp to TypeScript.

## Core Type System 🎯

Every type in Forge-lib is defined by the following structure:

```json
{
  "basetype": "<type-name>",
  "description": "Human readable description",
  "default": null, // define a default for this, is of the same basetype / dimension etc of course
  "dimension": 0, // 0 = scalar, 1 = array, 2 = matrix, etc.
  "is-async": false, // Whether the type represents an async value
  "size": null, // Optional size constraint
  "required": true, // true/false or array of implementations
  "by-reference": null // Relevant for languages like C, C++, Rust
  "unsigned": false // mostly not needed but again for low level
}
```

### Base Types

The following base types are available across all implementations:

- `string`: UTF-8 string representation
- `float`: Single-precision floating point
- `int`: Integer
- `double`: Double-precision floating point
- `date`: Calendar date without time
- `datetime`: Calendar date with time
- `time`: Time without date
- `empty`: Represents void/unit
- `null`: Null value (note: undefined is not supported)
- `bool`: Boolean value
- `binary`: Raw binary data
- `stream`: Stream of any type
- `*`/`any`: any type
- `function': a function (always by reference)

## Specification Format 📋

### Type Definitions

```json
{
  "types": {
    "QueueConfig": {
      "description": "Configuration for queue service",
      "properties": {
        "implementation": {
          "basetype": "string",
          "dimension": 1,
          "required": true,
          "description": "List of enabled implementations"
        },
        "redis": [
          {
            "basetype": "string",
            "dimension": 0,
            "required": ["bullmq"],
            "description": "Redis connection string"
          },
          {
            "basetype": "string",
            "dimension": 1,
            "required": ["bullmq"],
            "description": "Redis sentinel addresses"
          }
        ]
      }
    }
  }
}
```

### Function Definitions

Functions are defined in two categories:

1. Constructor functions (e.g., `createQueue`)
2. Member functions (prefixed with `$`, e.g., `$enqueue`)

```json
{
  "functions": {
    "createQueue": {
      "description": "Creates a new queue instance",
      "parameters": [
        {
          "name": "config",
          "basetype": "QueueConfig",
          "required": true
        }
      ],
      "returns": {
        "basetype": "Queue",
        "is-async": false
      }
    },
    "$enqueue": {
      "description": "Enqueues a job in the queue",
      "parameters": [
        {
          "name": "function",
          "basetype": "Function",
          "required": true
        },
        {
          "name": "args",
          "basetype": "any",
          "dimension": 1,
          "required": true
        }
      ],
      "returns": {
        "basetype": "empty",
        "is-async": true
      }
    }
  }
}
```

## Cross-Language Usage 💻

The same API is expressed idiomatically in each language:

### C

```c
QueueConfig* config = create_queue_config();
config->implementation = "bullmq";
config->redis = "redis://localhost:6379";

Queue* q = create_queue(config);
enqueue(q, &my_function, args, opts);
```

### Lisp

```lisp
(let* ((config (create-queue-config
                :implementation '("bullmq")
                :redis "redis://localhost:6379"))
       (q (create-queue config)))
  (enqueue q #'my-function args opts))
```

### TypeScript

```typescript
const config = createQueueConfig({
  implementation: ["bullmq"],
  redis: "redis://localhost:6379",
});

const q = createQueue(config);
await q.enqueue(myFunction, args, opts);
```

## Directory Structure 📁

```
{service}/
  ├── spec.json           # Universal API specification
  └── src/
      └── {language}/
          ├── {target}/   # Platform-specific code
          │   └── {implementation}/
          ├── types.{ext}      # Language-specific type definitions
          ├── implementation.{ext}
          └── config.{ext}
```

## Implementation Requirements 📝

1. **Type Mapping**: Each implementation must map the universal types to language-specific types
2. **Function Signatures**: Must match the spec exactly, using language-appropriate idioms
3. **Validation**: Must validate all required fields based on the spec
4. **Memory Management**: Must follow language conventions for memory/resource management
5. **Error Handling**: Must use language-appropriate error handling mechanisms

## Validation Tools 🔍

Our validation tools ensure implementations match the spec:

- Type compatibility checking
- Function signature validation
- Required field validation
- Cross-language consistency verification

## Contributing 🤝

When contributing:

1. Start with the spec.json
2. Implement language-specific type mappings
3. Follow language idioms while maintaining API consistency
4. Provide comprehensive tests
5. Document memory management and error handling

## License 📄

MIT

---

Built with ❤️ by Tycho Luyben (https://tycho.blue) the Forge-lib team
