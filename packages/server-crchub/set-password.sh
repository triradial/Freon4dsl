#!/bin/bash
# Utility script to set user passwords
# Usage: ./set-password.sh <email> <password>

if [ "$#" -ne 2 ]; then
    echo "Usage: ./set-password.sh <email> <password>"
    echo "Example: ./set-password.sh user@example.com MyPassword123"
    exit 1
fi

EMAIL="$1"
PASSWORD="$2"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to script directory
cd "$SCRIPT_DIR"

# Load environment from .env file first
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Run the TypeScript file directly with node and the compiled service
node --input-type=module -e "
// Load dotenv to ensure environment variables are available
import('./dist/config/load-environment.js').then(async () => {
    const authService = await import('./dist/service/auth-service.js');
    const dbModule = await import('./dist/service/db-connection.js');
    const pool = dbModule.getDbPool();
    
    const passwordHash = await authService.hashPassword('$PASSWORD');
    
    const result = await pool.query(
        'UPDATE person SET password_hash = \$1, active = true WHERE email = \$2 RETURNING oid, email, name, active',
        [passwordHash, '$EMAIL']
    );
    
    if (result.rows.length === 0) {
        console.error('❌ User not found with email: $EMAIL');
        console.log('Make sure the user exists in the person table.');
        process.exit(1);
    }
    
    const user = result.rows[0];
    console.log('✅ Password set successfully for user:');
    console.log('   OID:', user.oid);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Active:', user.active);
    
    await pool.end();
    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
});
"
