const mysql = require('mysql2/promise');

// Store active connection pools per session
const connectionPools = new Map();

/**
 * Create a connection pool for the given credentials
 */
function createPool(credentials) {
  const { host, user, password, database } = credentials;

  return mysql.createPool({
    host: host || 'localhost',
    user: user,
    password: password,
    database: database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

/**
 * Test database connection
 */
async function testConnection(credentials) {
  let connection;
  try {
    const pool = createPool(credentials);
    connection = await pool.getConnection();
    await connection.ping();
    await pool.end();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get or create connection pool for session
 */
function getPool(sessionId, credentials) {
  if (!connectionPools.has(sessionId)) {
    connectionPools.set(sessionId, createPool(credentials));
  }
  return connectionPools.get(sessionId);
}

/**
 * Close and remove connection pool for session
 */
async function closePool(sessionId) {
  if (connectionPools.has(sessionId)) {
    const pool = connectionPools.get(sessionId);
    await pool.end();
    connectionPools.delete(sessionId);
  }
}

/**
 * Get database statistics for dashboard
 */
async function getDatabaseStats(pool, dbName) {
  try {
    const stats = {};

    // Get table count and sizes
    const [tables] = await pool.query(`
      SELECT 
        COUNT(*) as table_count,
        SUM(data_length + index_length) as total_size,
        AVG(data_length + index_length) as avg_size
      FROM information_schema.TABLES 
      WHERE table_schema = ?
    `, [dbName]);

    stats.tableCount = tables[0].table_count;
    stats.totalSize = tables[0].total_size || 0;
    stats.avgSize = tables[0].avg_size || 0;

    // Get individual table sizes for chart
    const [tableSizes] = await pool.query(`
      SELECT 
        table_name,
        (data_length + index_length) as size
      FROM information_schema.TABLES 
      WHERE table_schema = ?
      ORDER BY size DESC
      LIMIT 10
    `, [dbName]);

    stats.tableSizes = tableSizes;

    // Count indexes
    const [indexes] = await pool.query(`
      SELECT COUNT(*) as index_count
      FROM information_schema.STATISTICS
      WHERE table_schema = ?
    `, [dbName]);

    stats.indexCount = indexes[0].index_count;

    // Count primary keys
    const [primaryKeys] = await pool.query(`
      SELECT COUNT(DISTINCT table_name) as pk_count
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE table_schema = ? AND constraint_type = 'PRIMARY KEY'
    `, [dbName]);

    stats.primaryKeyCount = primaryKeys[0].pk_count;

    // Count foreign keys
    const [foreignKeys] = await pool.query(`
      SELECT COUNT(*) as fk_count
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE table_schema = ? AND constraint_type = 'FOREIGN KEY'
    `, [dbName]);

    stats.foreignKeyCount = foreignKeys[0].fk_count;

    return stats;
  } catch (error) {
    throw new Error(`Failed to get database stats: ${error.message}`);
  }
}

/**
 * Get list of all tables
 */
async function getTableList(pool, dbName) {
  try {
    const [tables] = await pool.query(`
      SELECT 
        table_name,
        table_rows,
        (data_length + index_length) as size,
        engine,
        table_collation
      FROM information_schema.TABLES 
      WHERE table_schema = ?
      ORDER BY table_name
    `, [dbName]);

    return tables;
  } catch (error) {
    throw new Error(`Failed to get table list: ${error.message}`);
  }
}

/**
 * Get table schema information
 */
async function getTableSchema(pool, dbName, tableName) {
  try {
    // Helper function to convert object keys to lowercase
    const lowercaseKeys = (obj) => {
      return Object.keys(obj).reduce((acc, key) => {
        acc[key.toLowerCase()] = obj[key];
        return acc;
      }, {});
    };

    // Get column information
    const [columns] = await pool.query(`
      SELECT 
        COLUMN_NAME,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_KEY,
        COLUMN_DEFAULT,
        EXTRA
      FROM information_schema.COLUMNS
      WHERE table_schema = ? AND table_name = ?
      ORDER BY ordinal_position
    `, [dbName, tableName]);

    // Get indexes
    const [indexes] = await pool.query(`
      SELECT 
        INDEX_NAME,
        COLUMN_NAME,
        NON_UNIQUE,
        SEQ_IN_INDEX
      FROM information_schema.STATISTICS
      WHERE table_schema = ? AND table_name = ?
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `, [dbName, tableName]);

    // Get foreign keys
    const [foreignKeys] = await pool.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE table_schema = ? AND table_name = ? AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [dbName, tableName]);

    // Convert all keys to lowercase
    return {
      columns: columns.map(lowercaseKeys),
      indexes: indexes.map(lowercaseKeys),
      foreignKeys: foreignKeys.map(lowercaseKeys)
    };
  } catch (error) {
    throw new Error(`Failed to get table schema: ${error.message}`);
  }
}

/**
 * Get table content with pagination
 */
async function getTableContent(pool, tableName, options = {}) {
  try {
    const { page = 1, limit = 50, sortBy = null, sortOrder = 'ASC', search = null } = options;
    const offset = (page - 1) * limit;

    // Build query
    let query = `SELECT * FROM \`${tableName}\``;
    const params = [];

    // Add search filter if provided
    if (search) {
      // This is a simple search - in production you'd want to search specific columns
      query += ` WHERE CONCAT_WS('', \`${tableName}\`.*)  LIKE ?`;
      params.push(`%${search}%`);
    }

    // Add sorting
    if (sortBy) {
      query += ` ORDER BY \`${sortBy}\` ${sortOrder}`;
    }

    // Add pagination
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM \`${tableName}\``;
    if (search) {
      countQuery += ` WHERE CONCAT_WS('', \`${tableName}\`.*) LIKE ?`;
    }
    const [countResult] = await pool.query(countQuery, search ? [`%${search}%`] : []);
    const total = countResult[0].total;

    return {
      rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new Error(`Failed to get table content: ${error.message}`);
  }
}

/**
 * Execute SQL query
 */
async function executeQuery(pool, query, type = 'SELECT') {
  try {
    const [result] = await pool.query(query);

    if (type === 'SELECT') {
      return {
        success: true,
        rows: result,
        rowCount: result.length
      };
    } else {
      // For INSERT, UPDATE, DELETE, DDL
      return {
        success: true,
        affectedRows: result.affectedRows || 0,
        insertId: result.insertId || null,
        message: `Query executed successfully`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      sqlMessage: error.sqlMessage || error.message
    };
  }
}

module.exports = {
  testConnection,
  getPool,
  closePool,
  getDatabaseStats,
  getTableList,
  getTableSchema,
  getTableContent,
  executeQuery
};
