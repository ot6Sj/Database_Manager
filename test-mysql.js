// Quick test script to check what MySQL returns
const mysql = require('mysql2/promise');

async function testMySQL() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'admin',
        database: 'nomad_db'
    });

    const [columns] = await pool.query(`
    SELECT 
      COLUMN_NAME,
      COLUMN_TYPE,
      IS_NULLABLE
    FROM information_schema.COLUMNS
    WHERE table_schema = 'nomad_db' AND table_name = 'categories'
    LIMIT 1
  `);

    console.log('Raw MySQL result:');
    console.log(JSON.stringify(columns, null, 2));
    console.log('\nFirst column object keys:');
    console.log(Object.keys(columns[0]));

    await pool.end();
}

testMySQL().catch(console.error);
