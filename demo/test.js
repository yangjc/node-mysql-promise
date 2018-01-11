/**
 * YJC <yangjiecong@live.com> @2018-01-11
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_1 = require("@yjc/mysql");
module.parent === null && (async function () {
    const pool = mysql_1.createPool({
        "host": "127.0.0.1",
        "user": "root",
        "password": "root",
        "database": "test"
    });
    try {
        const sql = 'show tables';
        const result = await pool.query(sql);
        console.log(`sql: ${sql}\n${JSON.stringify(result, null, 2)}`);
    }
    catch (e) {
        console.error(e);
    }
    await pool.end();
})();
