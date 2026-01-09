#!/bin/bash
# Run a database migration
# Usage: ./run-migration.sh <migration-file>

if [ "$#" -ne 1 ]; then
    echo "Usage: ./run-migration.sh <migration-file>"
    echo "Example: ./run-migration.sh database/migrations/004_remove_upn_username_from_person.sql"
    exit 1
fi

MIGRATION_FILE="$1"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to script directory
cd "$SCRIPT_DIR"

# Load environment from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Read the SQL file
SQL_CONTENT=$(cat "$MIGRATION_FILE")

# Run the migration using Node.js
node --input-type=module -e "
import('./dist/config/load-environment.js').then(async () => {
    const dbModule = await import('./dist/service/db-connection.js');
    const pool = dbModule.getDbPool();
    
    const sql = \`$SQL_CONTENT\`;
    
    console.log('Running migration: $MIGRATION_FILE');
    console.log('----------------------------------------');
    
    try {
        await pool.query(sql);
        console.log('✅ Migration completed successfully!');
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        await pool.end();
        process.exit(1);
    }
}).catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
"

