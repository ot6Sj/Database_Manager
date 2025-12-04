const express = require('express');
const router = express.Router();
const db = require('../utils/database');

/**
 * POST /api/connect - Test connection and save credentials in session
 */
router.post('/connect', async (req, res) => {
    try {
        const { host, user, password, database } = req.body;

        if (!user || !database) {
            return res.status(400).json({
                success: false,
                error: 'Username and database name are required'
            });
        }

        const credentials = { host, user, password, database };
        const result = await db.testConnection(credentials);

        if (result.success) {
            // Store credentials in session
            req.session.dbCredentials = credentials;
            req.session.connected = true;

            res.json({
                success: true,
                message: 'Connected successfully',
                database: database
            });
        } else {
            res.status(401).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/disconnect - Clear session
 */
router.get('/disconnect', async (req, res) => {
    try {
        if (req.session.id) {
            await db.closePool(req.session.id);
        }
        req.session.destroy();
        res.json({ success: true, message: 'Disconnected successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Middleware to check if user is connected
 */
function requireConnection(req, res, next) {
    if (!req.session.connected || !req.session.dbCredentials) {
        return res.status(401).json({
            success: false,
            error: 'Not connected to database'
        });
    }
    next();
}

/**
 * GET /api/dashboard - Get database statistics
 */
router.get('/dashboard', requireConnection, async (req, res) => {
    try {
        const pool = db.getPool(req.session.id, req.session.dbCredentials);
        const stats = await db.getDatabaseStats(pool, req.session.dbCredentials.database);

        res.json({
            success: true,
            stats,
            database: req.session.dbCredentials.database
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/tables - Get list of all tables
 */
router.get('/tables', requireConnection, async (req, res) => {
    try {
        const pool = db.getPool(req.session.id, req.session.dbCredentials);
        const tables = await db.getTableList(pool, req.session.dbCredentials.database);

        res.json({
            success: true,
            tables
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/tables/:name/info - Get table schema
 */
router.get('/tables/:name/info', requireConnection, async (req, res) => {
    try {
        const pool = db.getPool(req.session.id, req.session.dbCredentials);
        const schema = await db.getTableSchema(
            pool,
            req.session.dbCredentials.database,
            req.params.name
        );

        res.json({
            success: true,
            tableName: req.params.name,
            schema
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/tables/:name/content - Get table data
 */
router.get('/tables/:name/content', requireConnection, async (req, res) => {
    try {
        const pool = db.getPool(req.session.id, req.session.dbCredentials);
        const { page, limit, sortBy, sortOrder, search } = req.query;

        const result = await db.getTableContent(pool, req.params.name, {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 50,
            sortBy: sortBy || null,
            sortOrder: sortOrder || 'ASC',
            search: search || null
        });

        res.json({
            success: true,
            tableName: req.params.name,
            ...result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/query/ddl - Execute DDL query
 */
router.post('/query/ddl', requireConnection, async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required'
            });
        }

        const pool = db.getPool(req.session.id, req.session.dbCredentials);
        const result = await db.executeQuery(pool, query, 'DDL');

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/query/dml - Execute DML query
 */
router.post('/query/dml', requireConnection, async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required'
            });
        }

        const pool = db.getPool(req.session.id, req.session.dbCredentials);
        const result = await db.executeQuery(pool, query, 'DML');

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/query/dql - Execute SELECT query
 */
router.post('/query/dql', requireConnection, async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required'
            });
        }

        const pool = db.getPool(req.session.id, req.session.dbCredentials);
        const result = await db.executeQuery(pool, query, 'SELECT');

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
