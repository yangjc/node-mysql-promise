/**
 * YJC <yangjiecong@live.com> @2018-01-11
 */


'use strict';

import { createPool, MysqlQueryData } from '@yjc/mysql';

module.parent === null && (async function () {
    const pool = createPool({
        "host": "127.0.0.1",
        "user": "root",
        "password": "root",
        "database": "test"
    });
    try {
        const sql: string = 'show tables';
        const result: MysqlQueryData = <MysqlQueryData>await pool.query(sql);
        console.log(`sql: ${sql}\n${JSON.stringify(result, null, 2)}`);
    } catch (e) {
        console.error(e);
    }
    await pool.end();
})();
