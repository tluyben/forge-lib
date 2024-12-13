import { Pool, PoolClient } from "pg";
import {
  Database,
  DatabaseConfig,
  DatabaseImplementation,
  QueryResult,
  Transaction,
  QueryOptions,
  BatchQuery,
  Field,
} from "../../types";

class PostgresDatabase implements Database {
  private pool: Pool;
  private name: string;

  constructor(config: DatabaseConfig, name: string) {
    this.name = name;
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      min: config.pool?.min,
      max: config.pool?.max,
      idleTimeoutMillis: config.pool?.idle_timeout,
    });
  }

  private adaptField(pgField: any): Field {
    return {
      name: pgField.name,
      tableId: pgField.tableID,
      columnId: pgField.columnID,
      dataType: pgField.dataTypeID,
      dataTypeName: pgField.dataTypeName,
      length: pgField.length,
      nullable: !pgField.required,
    };
  }

  private adaptResult(pgResult: any): QueryResult {
    return {
      rows: pgResult.rows,
      rowCount: pgResult.rowCount,
      fields: pgResult.fields.map(this.adaptField),
    };
  }

  async query(
    sql: string,
    parameters: any[] = [],
    options: QueryOptions = {}
  ): Promise<QueryResult> {
    const client = await this.pool.connect();
    try {
      const result = await client.query({
        text: sql,
        values: parameters,
        timeout: options.timeout,
      });
      return this.adaptResult(result);
    } finally {
      client.release();
    }
  }

  async batchQuery(
    queries: BatchQuery[],
    useTransaction: boolean = false,
    options: QueryOptions = {}
  ): Promise<QueryResult[]> {
    const client = await this.pool.connect();
    try {
      if (useTransaction) {
        await client.query("BEGIN");
      }

      const results = [];
      for (const query of queries) {
        const result = await client.query({
          text: query.sql,
          values: query.parameters,
          timeout: options.timeout,
        });
        results.push(this.adaptResult(result));
      }

      if (useTransaction) {
        await client.query("COMMIT");
      }

      return results;
    } catch (error) {
      if (useTransaction) {
        await client.query("ROLLBACK");
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async startTransaction(): Promise<Transaction> {
    const client = await this.pool.connect();
    await client.query("BEGIN");

    return {
      id: `${this.name}-${Date.now()}`,
      status: "active",
      startTime: new Date(),
      // Store client reference internally
      _client: client,
    } as Transaction;
  }

  async commit(transaction: Transaction): Promise<void> {
    if (transaction.status !== "active") {
      throw new Error("Transaction is not active");
    }

    const client = (transaction as any)._client as PoolClient;
    try {
      await client.query("COMMIT");
      transaction.status = "committed";
    } finally {
      client.release();
    }
  }

  async rollback(transaction: Transaction): Promise<void> {
    if (transaction.status !== "active") {
      throw new Error("Transaction is not active");
    }

    const client = (transaction as any)._client as PoolClient;
    try {
      await client.query("ROLLBACK");
      transaction.status = "rolled_back";
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const implementation: DatabaseImplementation = {
  createDatabase: async (
    config: DatabaseConfig,
    name: string
  ): Promise<Database> => {
    return new PostgresDatabase(config, name);
  },
};
