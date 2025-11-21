#!/usr/bin/env node
import { spawnSync } from 'child_process';
import path from 'path';

const schemaPath = path.resolve(process.cwd(), 'supabase', 'schema.sql');
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.SUPABASE_URL;

function printUsage() {
  console.error('\nApply database schema helper');
  console.error('This script attempts to run `psql` with your $DATABASE_URL.');
  console.error('If you do not have `psql` installed or $DATABASE_URL is not set, follow the instructions in `docs/DEPLOY_DB.md`.\n');
  console.error('Examples:');
  console.error('  PowerShell: psql -d $env:DATABASE_URL -f supabase/schema.sql');
  console.error('  cmd.exe:    psql -d %DATABASE_URL% -f supabase/schema.sql');
  console.error('  POSIX:      psql "$DATABASE_URL" -f supabase/schema.sql\n');
}

if (!databaseUrl) {
  console.error('ERROR: No DATABASE_URL or SUPABASE_DATABASE_URL found in environment.');
  printUsage();
  process.exit(2);
}

console.log('Using database URL from env. Running psql...');
const result = spawnSync('psql', ['-d', databaseUrl, '-f', schemaPath], { stdio: 'inherit' });

if (result.error) {
  console.error('\nFailed to execute `psql`.');
  console.error(result.error.message);
  printUsage();
  process.exit(3);
}

if (result.status !== 0) {
  console.error('\n`psql` exited with non-zero status', result.status);
  process.exit(result.status || 4);
}

console.log('\nSchema applied successfully.');
process.exit(0);
