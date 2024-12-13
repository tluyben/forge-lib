import knex, { Knex } from "knex";
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

class KnexDatabase implements Database {
  private client: Knex;
  private name: string;

  constructor(config: DatabaseConfig, name: string) {
    this.name = name;

    // Map our config to Knex config
    const knexConfig: Knex.Config = {
      client: config.type, // mysql, postgres, sqlite3, clickhouse
      connection: {
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
      },
      pool: config.pool
        ? {
            min: config.pool.min ?? 0,
            max: config.pool.max ?? 10,
            idleTimeoutMillis: config.pool.idle_timeout ?? 10000,
          }
        : undefined,
    };

    this.client = knex(knexConfig);
  }

  private adaptField(field: any): Field {
    return {
      name: field.name || field.column_name,
      tableId: field.tableID,
      columnId: field.ordinal_position,
      dataType: field.dataTypeID || field.data_type,
      dataTypeName: field.dataTypeName || field.data_type,
      length: field.length || field.character_maximum_length,
      nullable: field.nullable || field.is_nullable === "YES",
    };
  }

  private async getFields(sql: string): Promise<Field[]> {
    // For getting field info, we need to do a describe query
    // This varies by database type, so we'll use a simple approach
    // that works across databases - execute the query with LIMIT 0
    // and extract field information from the result
    const result = await this.client.raw(sql + " LIMIT 0");
    const fields =
      result.fields || Object.keys(result[0] || {}).map((name) => ({ name }));
    return fields.map(this.adaptField);
  }

  async query(
    sql: string,
    parameters: any[] = [],
    options: QueryOptions = {}
  ): Promise<QueryResult> {
    const fields = await this.getFields(sql);

    // Execute raw query with parameters
    const result = await this.client.raw(sql, parameters);

    // Normalize result format across different database types
    const rows = Array.isArray(result) ? result : result.rows || result[0];
    const rowCount = rows.length;

    return {
      rows,
      rowCount,
      fields,
    };
  }

  async batchQuery(
    queries: BatchQuery[],
    useTransaction: boolean = false,
    options: QueryOptions = {}
  ): Promise<QueryResult[]> {
    if (useTransaction) {
      const trx = await this.startTransaction();
      try {
        const results = await Promise.all(
          queries.map((query) =>
            this.query(query.sql, query.parameters, options)
          )
        );
        await this.commit(trx);
        return results;
      } catch (error) {
        await this.rollback(trx);
        throw error;
      }
    }

    return Promise.all(
      queries.map((query) => this.query(query.sql, query.parameters, options))
    );
  }

  async startTransaction(): Promise<Transaction> {
    // Instead of using Knex's transaction(), we manage transactions manually
    // to ensure consistent behavior across languages
    await this.client.raw("BEGIN");

    return {
      id: `${this.name}-${Date.now()}`,
      status: "active",
      startTime: new Date(),
    };
  }

  async commit(transaction: Transaction): Promise<void> {
    if (transaction.status !== "active") {
      throw new Error("Transaction is not active");
    }

    await this.client.raw("COMMIT");
    transaction.status = "committed";
  }

  async rollback(transaction: Transaction): Promise<void> {
    if (transaction.status !== "active") {
      throw new Error("Transaction is not active");
    }

    await this.client.raw("ROLLBACK");
    transaction.status = "rolled_back";
  }

  async close(): Promise<void> {
    await this.client.destroy();
  }
}

export const implementation: DatabaseImplementation = {
  createDatabase: async (
    config: DatabaseConfig,
    name: string
  ): Promise<Database> => {
    return new KnexDatabase(config, name);
  },
};
