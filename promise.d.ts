/**
 * YJC <yangjiecong@live.com> @2018-01-11
 */

export { createConnection, createPool } from './types/MysqlPromise';

import { QueryData, QueryResult, Pool, Connection } from './types/MysqlPromise';

export declare type MysqlQueryData = QueryData;
export declare type MysqlQueryResult = QueryResult;
export declare type MysqlPool = Pool;
export declare type MysqlConnection = Connection;
