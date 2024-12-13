# 🗄️ Universal Database Specification

A cross-language, stable database API specification designed for long-term stability and universal compatibility.

## 🎯 Overview

This specification defines a universal database interface that works consistently across any programming language or database backend. It provides a unified way to work with any type of database implementation while maintaining strict backward compatibility.

## ✨ Features

- 🔍 Parameterized queries with strong typing
- 📦 Connection pooling and lifecycle management
- 🔄 Transaction support
- 🎯 Batch operations
- 🛡️ Consistent error handling
- 📊 Rich query result metadata
- 🔌 Pluggable implementation system

## 🛠️ Basic Usage

```typescript
// Create a database connection
const config = {
  implementation: ["postgres"],
  host: "localhost",
  username: "user",
  password: "pass",
  database: "mydb",
};

const db = await createDatabase(config, "main");

// Simple query
const users = await db.query("SELECT * FROM users WHERE age > $1", [18]);

// Batch queries in transaction
const results = await db.batchQuery(
  [
    {
      sql: "INSERT INTO orders (user_id, total) VALUES ($1, $2)",
      parameters: [1, 100],
    },
    {
      sql: "UPDATE users SET credits = credits - $1 WHERE id = $2",
      parameters: [100, 1],
    },
  ],
  true
);

// Manual transaction
const tx = await db.startTransaction();
try {
  await db.query("INSERT INTO orders ...", [], { transaction: tx });
  await db.query("UPDATE users ...", [], { transaction: tx });
  await db.commit(tx);
} catch (err) {
  await db.rollback(tx);
  throw err;
}
```

## 🎛️ Configuration Options

### ⚙️ Database Configuration

```typescript
{
    implementation: ['postgres'],    // Required: Backend implementation
    host: "localhost",              // Required: Database host
    port: 5432,                     // Optional: Database port
    username: "user",               // Required: Username
    password: "pass",               // Required: Password
    database: "mydb",              // Required: Database name
    pool: {                        // Optional: Pool configuration
        min: 0,                    // Minimum connections
        max: 10,                   // Maximum connections
        idle_timeout: 10000        // Idle timeout in ms
    }
}
```

### 🎮 Query Options

```typescript
{
    timeout: 5000,         // Query timeout in ms (default: 0)
    prepare: false,        // Prepare statement (default: false)
    cache: true           // Cache query plan (default: true)
}
```

## 📦 Query Results

Query results provide rich metadata about the returned data:

```typescript
{
    rows: [...],           // Array of result rows
    rowCount: 42,         // Number of affected/returned rows
    fields: [             // Information about result columns
        {
            name: "id",
            dataType: 23,
            dataTypeName: "integer",
            nullable: false
        },
        // ... more fields
    ]
}
```

## 🔍 Implementation Notes

- Parameter placeholders are standardized as `$1`, `$2`, etc.
- All numeric values are unsigned where appropriate
- All async operations return promises
- Transactions are isolated by default
- Connection pooling is enabled by default
- Query timeouts are disabled (0) by default

## 🚀 Future Extensions

The specification is designed to be extended with:

- ORM capabilities
- Migration support
- Schema introspection
- Query builders
- Streaming results
- Replication configuration
- Sharding support

## 🤝 Contributing

While the core specification is stable and won't change, we welcome:

- Additional backend implementations
- Language-specific bindings
- Documentation improvements
- Test cases and validation tools

## 📜 License

MIT

---

Built with ❤️ by the Database Specification Team
