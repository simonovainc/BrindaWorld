require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

const MIGRATION_FILES = [
  '001_operational.sql',
  '002_compliance.sql',
  '003_analytics.sql',
  '004_learning.sql',
  '005_warehouse.sql',
  '006_governance.sql',
  '007_auth.sql',
  '009_children_identity.sql',
  '010_pricing_v2.sql',
  '011_feedback.sql',
];

async function runMigrations() {
  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'u171187877_brindaworld_db',
    user:     process.env.DB_USER || 'u171187877_brindaworld_us',
    password: process.env.DB_PASS || '',
    multipleStatements: true,
  });

  console.log('Connected to MySQL. Running migrations...\n');

  let allPassed = true;

  for (const file of MIGRATION_FILES) {
    const filePath = path.join(MIGRATIONS_DIR, file);

    if (!fs.existsSync(filePath)) {
      console.error(`  MISSING  ${file}`);
      allPassed = false;
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      await connection.query(sql);
      console.log(`  OK       ${file}`);
    } catch (err) {
      console.error(`  FAILED   ${file}`);
      console.error(`           ${err.message}\n`);
      allPassed = false;
    }
  }

  await connection.end();

  console.log('');
  if (allPassed) {
    console.log('All migrations completed successfully.');
  } else {
    console.error('One or more migrations failed. See errors above.');
    process.exit(1);
  }
}

runMigrations().catch(err => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
