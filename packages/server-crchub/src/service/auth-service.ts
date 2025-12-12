import * as msal from "@azure/msal-node";
import bcrypt from 'bcryptjs';
import { getDbPool } from './db-connection.js';
import { consoleLogError, consoleLogInfo, consoleLogSuccess } from '../server/logging.js';

const moduleName = '[AuthService]';

export interface ADUser {
    user_id: string;
    name: string;
    email: string;
    oid: string;
}

export interface AuthResult {
    success: boolean;
    token?: string;
    oid?: string;
    error?: string;
    errorType?: 'auth' | 'not_found' | 'inactive' | 'invalid_password';
}

/**
 * Get Azure AD user by OID (Object ID)
 */
export async function getADUserByOID(oid: string): Promise<ADUser | undefined> {
    const action = moduleName + ' getADUserByOID';
    try {
        // Initialize MSAL configuration
        const msalConfig = {
            auth: {
                clientId: process.env.AZURE_CLIENT_ID!,
                clientSecret: process.env.AZURE_CLIENT_SECRET!,
                authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`
            }
        };

        // Create confidential client application
        const cca = new msal.ConfidentialClientApplication(msalConfig);

        // Get access token for Microsoft Graph
        const tokenResponse = await cca.acquireTokenByClientCredential({
            scopes: ['https://graph.microsoft.com/.default']
        });

        if (!tokenResponse || !tokenResponse.accessToken) {
            consoleLogError(action, 'Failed to acquire access token');
            return undefined;
        }

        // Fetch user from Microsoft Graph
        const response = await fetch(
            `https://graph.microsoft.com/v1.0/users/${oid}?$select=displayName,mail,id`,
            {
                headers: {
                    Authorization: `Bearer ${tokenResponse.accessToken}`
                }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            consoleLogError(action, `Graph API error: ${response.status} ${response.statusText} ${errorText}`);
            return undefined;
        }

        const userData = await response.json();
        consoleLogInfo(action, `User data retrieved: ${JSON.stringify(userData)}`);

        return {
            user_id: userData.mail,
            name: userData.displayName,
            email: userData.mail,
            oid: userData.id,
        };

    } catch (e) {
        consoleLogError(action, `Error in getADUserByOID: ${e}`);
        return undefined;
    }
}

/**
 * Get Azure AD user by username (email)
 * This validates the user exists in Azure AD and returns their OID
 */
export async function getADUserByUsername(username: string): Promise<{ user?: ADUser; error?: string; errorType?: 'auth' | 'not_found' }> {
    const action = moduleName + ' getADUserByUsername';
    try {
        consoleLogInfo(action, `Looking up user: "${username}"`);

        const msalConfig = {
            auth: {
                clientId: process.env.AZURE_CLIENT_ID!,
                clientSecret: process.env.AZURE_CLIENT_SECRET!,
                authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`
            }
        };

        const cca = new msal.ConfidentialClientApplication(msalConfig);

        try {
            const tokenResponse = await cca.acquireTokenByClientCredential({
                scopes: ['https://graph.microsoft.com/.default']
            });

            if (!tokenResponse || !tokenResponse.accessToken) {
                return { error: 'Failed to acquire Azure AD access token', errorType: 'auth' as const };
            }

            // Properly escape single quotes in username for OData filter (OData uses '' for single quote)
            const escapedUsername = username.replace(/'/g, "''");
            
            // Extract domain from email for issuer (e.g., user@domain.com -> domain.com)
            // For Azure AD, the issuer for email identities is typically the email domain
            const emailDomain = username.includes('@') ? username.split('@')[1] : '';
            const escapedIssuer = emailDomain.replace(/'/g, "''");
            
            // Search for user by identities collection - requires both issuer and issuerAssignedId
            // Graph API requires both fields to be specified when filtering by identities
            const filter = `identities/any(x:x/issuer eq '${escapedIssuer}' and x/issuerAssignedId eq '${escapedUsername}')`;
            const selectFields = 'displayName,mail,userPrincipalName,id,identities';
            const graphUrl = `https://graph.microsoft.com/v1.0/users?$filter=${encodeURIComponent(filter)}&$select=${selectFields}`;
            
            consoleLogInfo(action, `Querying Graph API with filter: ${filter}`);

            const response = await fetch(graphUrl, {
                headers: {
                    Authorization: `Bearer ${tokenResponse.accessToken}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                consoleLogError(action, `Graph API Error: ${response.status} ${response.statusText} ${errorText}`);
                return { error: `Graph API Error: ${response.status} ${response.statusText}`, errorType: 'auth' as const };
            }

            const userData = await response.json();
            consoleLogInfo(action, `Graph API returned ${userData.value?.length || 0} result(s) for identity: ${username}`);

            // Check if user was found
            if (userData.value && userData.value.length > 0) {
                const user = userData.value[0];
                // Use mail property for email
                const userEmail = user.mail || user.userPrincipalName;
                consoleLogSuccess(action, `User found by identity - Email: ${userEmail}, OID: ${user.id}, DisplayName: ${user.displayName}, Identities: ${JSON.stringify(user.identities)}`);
                return {
                    user: {
                        user_id: userEmail,
                        name: user.displayName,
                        email: userEmail,
                        oid: user.id,
                    }
                };
            }

            consoleLogInfo(action, `User not found in Azure AD with identity: ${username}`);
            return { errorType: 'not_found' as const };

        } catch (authError: any) {
            consoleLogError(action, `Azure AD authentication error: ${authError.message}`);
            return {
                error: `Azure AD authentication failed: ${authError.message}`,
                errorType: 'auth' as const
            };
        }

    } catch (e: any) {
        consoleLogError(action, `Unexpected error: ${e.message}`);
        return {
            error: `Unexpected error: ${e.message}`,
            errorType: 'auth' as const
        };
    }
}

/**
 * Authenticate user with username and password
 * 1. Validates username exists in Azure AD and gets OID
 * 2. Checks database for user with matching OID
 * 3. Verifies password against stored hash
 * 4. Checks active flag
 * 5. Generates fake JWT token
 */
export async function authenticateUser(username: string, password: string): Promise<AuthResult> {
    const action = moduleName + ' authenticateUser';
    
    try {
        consoleLogInfo(action, `Authentication attempt for: ${username}`);

        // Step 1: Validate user in Azure AD and get OID
        const adResult = await getADUserByUsername(username);
        
        if (adResult.error || !adResult.user) {
            consoleLogError(action, `User not found in Azure AD: ${username}`);
            return {
                success: false,
                error: adResult.error || 'User not found in Azure AD',
                errorType: adResult.errorType
            };
        }

        const adUser = adResult.user;
        consoleLogInfo(action, `Azure AD user found - OID: ${adUser.oid}`);

        // Step 2: Check database for user with matching OID
        const pool = getDbPool();
        const result = await pool.query(
            `SELECT 
                person_id,
                oid,
                email,
                name,
                password_hash,
                active
             FROM person
             WHERE oid = $1`,
            [adUser.oid]
        );

        if (result.rows.length === 0) {
            consoleLogError(action, `User not found in database with OID: ${adUser.oid}`);
            return {
                success: false,
                error: 'User not found in database',
                errorType: 'not_found'
            };
        }

        const dbUser = result.rows[0];

        // Step 3: Check active flag
        if (!dbUser.active) {
            consoleLogError(action, `User account is inactive: ${username}`);
            return {
                success: false,
                error: 'User account is inactive',
                errorType: 'inactive'
            };
        }

        // Step 4: Verify password
        if (!dbUser.password_hash) {
            consoleLogError(action, `No password set for user: ${username}`);
            return {
                success: false,
                error: 'No password set for this account',
                errorType: 'invalid_password'
            };
        }

        // Verify password using bcrypt
        const passwordValid = await bcrypt.compare(password, dbUser.password_hash);
        if (!passwordValid) {
            consoleLogError(action, `Invalid password for user: ${username}`);
            return {
                success: false,
                error: 'Invalid password',
                errorType: 'invalid_password'
            };
        }

        // Step 5: Generate fake JWT token
        const token = generateFakeToken(adUser);
        
        consoleLogSuccess(action, `Authentication successful for: ${username}`);
        return {
            success: true,
            token,
            oid: adUser.oid
        };

    } catch (e: any) {
        consoleLogError(action, `Error during authentication: ${e.message}`);
        return {
            success: false,
            error: `Authentication error: ${e.message}`,
            errorType: 'auth'
        };
    }
}

/**
 * Generate a fake JWT token that matches the format expected by auth-middleware
 * This token will work with the existing middleware's fake token verification
 */
function generateFakeToken(adUser: ADUser): string {
    const action = moduleName + ' generateFakeToken';
    
    try {
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Create token payload matching Azure B2C format
        const tokenPayload = {
            exp: currentTime + (12 * 60 * 60), // 12 hours
            nbf: currentTime,
            ver: "1.0",
            iss: "https://fake-auth.local/fake-issuer/v2.0/",
            sub: adUser.oid,
            aud: process.env.AZURE_CLIENT_ID || "fake-client-id",
            nonce: "fake-nonce-" + Math.random().toString(36).substring(7),
            iat: currentTime,
            auth_time: currentTime,
            oid: adUser.oid,
            name: adUser.name,
            emails: [adUser.email],
            email: adUser.email,
            tfp: "Fake_SignIn"
        };

        consoleLogInfo(action, `Generated token payload for OID: ${adUser.oid}`);
        
        // Create JWT header
        const header = {
            alg: 'RS256',
            kid: 'fake-key-id',
            typ: 'JWT'
        };
        
        // Encode as base64url (JWT format)
        const encodedHeader = base64UrlEncode(JSON.stringify(header));
        const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
        
        // Create fake signature
        const signature = 'fake-signature-' + Math.random().toString(36).substring(7);
        const encodedSignature = base64UrlEncode(signature);
        
        // Combine into JWT format: header.payload.signature
        const token = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
        
        return token;
        
    } catch (e: any) {
        consoleLogError(action, `Error generating fake token: ${e.message}`);
        throw e;
    }
}

/**
 * Base64 URL encode (JWT standard)
 */
function base64UrlEncode(str: string): string {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Hash a password using bcrypt
 * Utility function for creating password hashes
 */
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}
