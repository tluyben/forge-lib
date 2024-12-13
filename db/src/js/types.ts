export interface DatabaseConfig {
  implementation: string[];
  host: string;
  port?: number;
  username: string;
  password: string;
  database: string;
  pool?: PoolConfig;
}

export interface PoolConfig {
  min?: number;
  max?: number;
  idle_timeout?: number;
}

export interface Field {
  name: string;
  tableId?: number;
  columnId?: number;
  dataType: number;
  dataTypeName: string;
  length?: number;
  nullable: boolean;
}

export interface QueryResult {
  rows: any[];
  rowCount: number;
  fields: Field[];
}

export interface Transaction {
  id: string;
  status: "active" | "committed" | "rolled_back";
  startTime: Date;
}

export interface QueryOptions {
  timeout?: number;
  prepare?: boolean;
  cache?: boolean;
}

export interface BatchQuery {
  sql: string;
  parameters?: any[];
}

export interface Database {
  query(
    sql: string,
    parameters?: any[],
    options?: QueryOptions
  ): Promise<QueryResult>;
  batchQuery(
    queries: BatchQuery[],
    useTransaction?: boolean,
    options?: QueryOptions
  ): Promise<QueryResult[]>;
  startTransaction(): Promise<Transaction>;
  commit(transaction: Transaction): Promise<void>;
  rollback(transaction: Transaction): Promise<void>;
  close(): Promise<void>;
}

export interface DatabaseImplementation {
  createDatabase(config: DatabaseConfig, name: string): Promise<Database>;
}
