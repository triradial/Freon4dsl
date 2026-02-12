/**
 * Utility script to set a permanent (non-temporary) password for a user in Azure AD
 * via the Microsoft Graph API using client credentials.
 *
 * This uses the app's AZURE_CLIENT_ID / AZURE_CLIENT_SECRET / AZURE_TENANT_ID
 * from the .env file. The app registration must have the
 * User-PasswordProfile.ReadWrite.All application permission with admin consent.
 *
 * NOTE: The User.ReadWrite.All permission alone is NOT sufficient for password
 * updates — the more specific User-PasswordProfile.ReadWrite.All is required.
 * This applies to both application and delegated permission flows.
 *
 * Usage:
 *   npm run build
 *   node dist/scripts/set-user-password.js <oid> <password>
 *
 * Example:
 *   node dist/scripts/set-user-password.js ddabd431-a0a6-4853-ba21-bcd8cd758bf9 MyPassword123
 */

import '../config/load-environment.js';
import * as msal from '@azure/msal-node';

async function setUserPassword(oid: string, password: string) {
    try {
        console.log(`\nSetting password for user OID: ${oid}`);
        console.log(`Tenant: ${process.env.AZURE_TENANT_ID}`);
        console.log(`Client: ${process.env.AZURE_CLIENT_ID}\n`);

        // Acquire an access token using client credentials
        const cca = new msal.ConfidentialClientApplication({
            auth: {
                clientId: process.env.AZURE_CLIENT_ID!,
                clientSecret: process.env.AZURE_CLIENT_SECRET!,
                authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`
            }
        });

        const tokenResponse = await cca.acquireTokenByClientCredential({
            scopes: ['https://graph.microsoft.com/.default']
        });

        if (!tokenResponse || !tokenResponse.accessToken) {
            console.error('❌ Failed to acquire access token');
            process.exit(1);
        }

        console.log('✅ Access token acquired');

        // Update the user's password via Graph API
        const graphUrl = `https://graph.microsoft.com/v1.0/users/${oid}`;
        console.log(`   PATCH ${graphUrl}`);

        const response = await fetch(graphUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${tokenResponse.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                passwordProfile: {
                    password: password,
                    forceChangePasswordNextSignIn: false
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Graph API error: ${response.status} ${response.statusText}`);
            console.error(`   ${errorText}`);
            process.exit(1);
        }

        console.log(`\n✅ Password set successfully for OID: ${oid}`);
        console.log(`   forceChangePasswordNextSignIn: false`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length !== 2) {
    console.error('Usage: node dist/scripts/set-user-password.js <oid> <password>');
    console.error('Example: node dist/scripts/set-user-password.js ddabd431-a0a6-4853-ba21-bcd8cd758bf9 MyPassword123');
    process.exit(1);
}

const [oid, password] = args;

// Validate OID format (should be a GUID)
if (!oid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    console.error('❌ Invalid OID format (expected a GUID like ddabd431-a0a6-4853-ba21-bcd8cd758bf9)');
    process.exit(1);
}

// Validate password length
if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters long');
    process.exit(1);
}

setUserPassword(oid, password);
