/**
 * YJC <yangjiecong@live.com> @2018-01-11
 */

'use strict';

/*
 * Forked From
    repository: https://github.com/sidorares/node-mysql2
    version: 1.5.1
    file: promise.js

 * Modified:
    1. Replace core with mysql
    2. Delete methods: execute(), prepare()
    3. Delete classes: PromisePreparedStatementInfo
    4. Use const/let instead of var
    5. Change return of query()
    6. Remove Error.sqlMessage
    7. Use native Promise

 * Todo:
    Connection.statistics
    Pool.acquireConnection, Pool.releaseConnection
 */

const util = require('util');
const EventEmitter = require('events').EventEmitter;

const core = require('mysql');
const PoolConnection = require('mysql/lib/PoolConnection');
const Connection = require('mysql/lib/Connection');
const Pool = require('mysql/lib/Pool');


function inheritEvents(source, target, events) {
    const listeners = {};
    target
        .on('newListener', function(eventName) {
            if (events.indexOf(eventName) >= 0 && !target.listenerCount(eventName)) {
                source.on(
                    eventName,
                    (listeners[eventName] = function() {
                        const args = [].slice.call(arguments);
                        args.unshift(eventName);

                        target.emit.apply(target, args);
                    })
                );
            }
        })
        .on('removeListener', function(eventName) {
            if (events.indexOf(eventName) >= 0 && !target.listenerCount(eventName)) {
                source.removeListener(eventName, listeners[eventName]);
                delete listeners[eventName];
            }
        });
}

function createConnection(opts) {
    const coreConnection = core.createConnection(opts);
    const createConnectionErr = new Error();

    return new Promise(function(resolve, reject) {
        coreConnection.once('connect', function(connectParams) {
            resolve(new PromiseConnection(coreConnection));
        });
        coreConnection.once('error', err => {
            createConnectionErr.message = err.message;
            createConnectionErr.code = err.code;
            createConnectionErr.errno = err.errno;
            createConnectionErr.sqlState = err.sqlState;
            reject(createConnectionErr);
        });
    });
}

function PromiseConnection(connection) {
    this.connection = connection;

    inheritEvents(connection, this, [
        'error',
        'drain',
        'connect',
        'end',
        'enqueue'
    ]);
}
util.inherits(PromiseConnection, EventEmitter);

PromiseConnection.prototype.release = function() {
    this.connection.release();
};

function setError(localError, throwError) {
    localError.message = throwError.message;
    localError.code = throwError.code;
    localError.errno = throwError.errno;
    // localError.sqlStateMarker = throwError.sqlStateMarker;
    localError.sqlState = throwError.sqlState;
    // localError.fieldCount = throwError.fieldCount;
    // localError.fatal = throwError.fatal;
    return localError;
}

function makeDoneCb(resolve, reject, localErr) {
    return function(err) {
        if (err) {
            reject(setError(localErr, err));
        } else {
            resolve();
        }
    };
}

function makeQueryCb(resolve, reject, context) {
    return function(err, results, fields) {
        if (err) {
            const localErr = setError(context.error, err);
            localErr.sql = context.query.sql;
            reject(localErr);
        } else {
            if (results && typeof results === 'object') {
                if (context.query.sql && !results.hasOwnProperty('sql')) {
                    Object.defineProperty(results, 'sql', {
                        configurable: true,
                        enumerable: false,
                        writable: true,
                        value: context.query.sql
                    });
                }
                if (fields && !results.hasOwnProperty('fields')) {
                    Object.defineProperty(results, 'fields', {
                        configurable: true,
                        enumerable: false,
                        writable: true,
                        value: fields
                    });
                }
                resolve(results);
            } else {
                resolve([results, fields]);
            }
        }
    };
}

PromiseConnection.prototype.query = function(query, params) {
    const c = this.connection;
    const context = {error: new Error()};
    return new Promise(function(resolve, reject) {
        const done = makeQueryCb(resolve, reject, context);
        if (params) {
            context.query = c.query(query, params, done);
        } else {
            context.query = c.query(query, done);
        }
    });
};

PromiseConnection.prototype.end = function() {
    const c = this.connection;
    return new Promise(function(resolve, reject) {
        c.end(function() {
            resolve();
        });
    });
};

PromiseConnection.prototype.beginTransaction = function() {
    const c = this.connection;
    const localErr = new Error();
    return new Promise(function(resolve, reject) {
        const done = makeDoneCb(resolve, reject, localErr);
        c.beginTransaction(done);
    });
};

PromiseConnection.prototype.commit = function() {
    const c = this.connection;
    const localErr = new Error();
    return new Promise(function(resolve, reject) {
        const done = makeDoneCb(resolve, reject, localErr);
        c.commit(done);
    });
};

PromiseConnection.prototype.rollback = function() {
    const c = this.connection;
    const localErr = new Error();
    return new Promise(function(resolve, reject) {
        const done = makeDoneCb(resolve, reject, localErr);
        c.rollback(done);
    });
};

PromiseConnection.prototype.ping = function() {
    const c = this.connection;
    return new Promise(function(resolve, reject) {
        c.ping(resolve);
    });
};

PromiseConnection.prototype.connect = function() {
    const c = this.connection;
    const localErr = new Error();
    return new Promise(function(resolve, reject) {
        c.connect(function(err, param) {
            if (err) {
                reject(setError(localErr, err));
            } else {
                resolve(param);
            }
        });
    });
};

PromiseConnection.prototype.changeUser = function(options) {
    const c = this.connection;
    const localErr = new Error();
    return new Promise(function(resolve, reject) {
        c.changeUser(options, function(err) {
            if (err) {
                reject(setError(localErr, err));
            } else {
                resolve();
            }
        });
    });
};

// note: the callback of "changeUser" is not called on success
// hence there is no possibility to call "resolve"

// patching PromiseConnection
// create facade functions for prototype functions on "Connection" that are not yet
// implemented with PromiseConnection

// proxy synchronous functions only
(function(functionsToWrap) {
    for (let i = 0; functionsToWrap && i < functionsToWrap.length; i++) {
        const func = functionsToWrap[i];

        if (
            typeof Connection.prototype[func] === 'function' &&
            PromiseConnection.prototype[func] === undefined
        ) {
            PromiseConnection.prototype[func] = (function factory(funcName) {
                return function() {
                    return Connection.prototype[funcName].apply(
                        this.connection,
                        arguments
                    );
                };
            })(func);
        }
    }
})([
    // synchronous functions
    'close',
    'createBinlogStream',
    'destroy',
    'escape',
    'escapeId',
    'format',
    'pause',
    'pipe',
    'resume',
    'unprepare'
]);

(function(functionsToWrap) {
    for (let i = 0; functionsToWrap && i < functionsToWrap.length; i++) {
        const func = functionsToWrap[i];

        if (
            typeof Pool.prototype[func] === 'function' &&
            PromisePool.prototype[func] === undefined
        ) {
            PromisePool.prototype[func] = (function factory(funcName) {
                return function() {
                    return Pool.prototype[funcName].apply(this.pool, arguments);
                };
            })(func);
        }
    }
})([
    // synchronous functions
    'escape',
    'escapeId',
    'format'
]);

function PromisePoolConnection() {
    PromiseConnection.apply(this, arguments);
}

util.inherits(PromisePoolConnection, PromiseConnection);

PromisePoolConnection.prototype.destroy = function() {
    return PoolConnection.prototype.destroy.apply(
        this.connection,
        arguments
    );
};

function PromisePool(pool) {
    this.pool = pool;

    inheritEvents(pool, this, ['acquire', 'connection', 'enqueue', 'release']);
}
util.inherits(PromisePool, EventEmitter);

PromisePool.prototype.getConnection = function() {
    const corePool = this.pool;

    return new Promise(function(resolve, reject) {
        corePool.getConnection(function(err, coreConnection) {
            if (err) {
                reject(err);
            } else {
                resolve(new PromisePoolConnection(coreConnection));
            }
        });
    });
};

PromisePool.prototype.query = function(sql, args) {
    const corePool = this.pool;
    const context = {error: new Error()};
    return new Promise(function(resolve, reject) {
        const done = makeQueryCb(resolve, reject, context);
        if (args) {
            context.query = corePool.query(sql, args, done);
        } else {
            context.query = corePool.query(sql, done);
        }
    });
};

PromisePool.prototype.end = function() {
    const corePool = this.pool;
    const localErr = new Error();
    return new Promise(function(resolve, reject) {
        corePool.end(function(err) {
            if (err) {
                reject(setError(localErr, err));
            } else {
                resolve();
            }
        });
    });
};

function createPool(opts) {
    const corePool = core.createPool(opts);

    return new PromisePool(corePool);
}

module.exports.createConnection = createConnection;
module.exports.createPool = createPool;
