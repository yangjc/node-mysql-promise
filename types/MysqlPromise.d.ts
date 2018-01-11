/**
 * YJC <yangjiecong@live.com> @2018-01-11
 */

import * as mysql from 'mysql';

export declare interface QueryResult {
    insertId: number | string,

    affectedRows: number,
    // "changedRows" differs from "affectedRows" in that
    //  it does not count updated rows whose values were not changed.
    changedRows: number,

    fieldCount: number,
    serverStatus: number,
    warningCount: number,
    message: string,
    protocol41: boolean,

    sql?: string;
    fields?: mysql.FieldInfo[];
}

export declare interface QueryData extends Array<any> {
    sql?: string;
    fields?: mysql.FieldInfo[];
}

// values can be non [], see custom format (https://github.com/mysqljs/mysql#custom-format)
export interface QueryFunction {
    (query: mysql.Query): Promise<void>;

    (options: string | mysql.QueryOptions): Promise<QueryResult | QueryData>;

    (options: string, values: any): Promise<QueryResult | QueryData>;
}

export interface Connection extends mysql.EscapeFunctions {
    config: mysql.ConnectionConfig;

    state: 'connected' | 'authenticated' | 'disconnected' | 'protocol_error' | string;

    threadId: number | null;

    createQuery: QueryFunction;

    connect(options?: any): Promise<any[]>;
    changeUser(options?: mysql.ConnectionOptions): Promise<void>;
    beginTransaction(options?: mysql.QueryOptions): Promise<void>;
    commit(options?: mysql.QueryOptions): Promise<void>;
    rollback(options?: mysql.QueryOptions): Promise<void>;

    query: QueryFunction;

    ping(options?: mysql.QueryOptions): Promise<void>;

    // statistics(options?: mysql.QueryOptions): Promise<void>;

    end(options?: any): Promise<void>;

    destroy(): void;

    pause(): void;

    resume(): void;

    on(ev: 'drain' | 'connect', callback: () => void): Connection;

    on(ev: 'end', callback: (err?: mysql.MysqlError) => void): Connection;

    on(ev: 'fields', callback: (fields: any[]) => void): Connection;

    on(ev: 'error', callback: (err: mysql.MysqlError) => void): Connection;

    on(ev: 'enqueue', callback: (...args: any[]) => void): Connection;

    on(ev: string, callback: (...args: any[]) => void): this;
}

export interface PoolConnection extends Connection {
    release(): void;
}

export interface Pool extends mysql.EscapeFunctions {
    config: mysql.PoolConfig;

    getConnection(): Promise<PoolConnection>;

    // acquireConnection(connection: PoolConnection): Promise<PoolConnection>;

    // releaseConnection(connection: PoolConnection): void;

    end(): Promise<void>;

    query: QueryFunction;

    on(ev: 'connection' | 'acquire' | 'release', callback: (connection: PoolConnection) => void): Pool;

    on(ev: 'error', callback: (err: mysql.MysqlError) => void): Pool;

    on(ev: 'enqueue', callback: (err?: mysql.MysqlError) => void): Pool;

    on(ev: string, callback: (...args: any[]) => void): Pool;
}

export function createConnection(connectionUri: string | mysql.ConnectionConfig): Connection;
export function createPool(config: mysql.PoolConfig | string): Pool;
