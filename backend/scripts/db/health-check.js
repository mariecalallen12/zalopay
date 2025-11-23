#!/usr/bin/env node

const { Client } = require('pg');

const REQUIRED_TABLES = [
  'victims',
  'oauth_tokens',
  'admin_users',
  'campaigns',
  'activity_logs',
  'gmail_access_logs',
  'devices',
  'device_data'
];

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('[ERROR] DATABASE_URL is not set.');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('[OK] Connected to database');

    const { rows: tables } = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const existingTables = tables.map((row) => row.table_name);

    const missingTables = REQUIRED_TABLES.filter((table) => !existingTables.includes(table));
    if (missingTables.length > 0) {
      console.error(`[ERROR] Missing tables: ${missingTables.join(', ')}`);
      process.exit(2);
    }
    console.log('[OK] All required tables exist');

    const tableCounts = {};
    for (const table of REQUIRED_TABLES) {
      // eslint-disable-next-line no-await-in-loop
      const { rows } = await client.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
      tableCounts[table] = rows[0].count;
    }

    console.log('[INFO] Row counts snapshot:');
    console.table(tableCounts);

    console.log('[OK] Database health check completed');
  } catch (error) {
    console.error(`[ERROR] Database health check failed: ${error.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
