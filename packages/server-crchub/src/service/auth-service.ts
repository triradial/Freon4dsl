import * as msal from "@azure/msal-node";
import { getDbPool } from './db-connection.js';
import { consoleLogError, consoleLogInfo, consoleLogSuccess, consoleLogWarning } from '../server/logging.js';

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

// ---------------------------------------------------------------------------
// Admin functions — used by admin UI to look up users in Azure AD (Graph API)
// These require the User.Read.All application permission + admin consent.
// ---------------------------------------------------------------------------

/**
 * Get Azure AD user by OID (Object ID)
 * Used by admin features to retrieve user details from Azure AD.
 * Requires ConfidentialClientApplication with client credentials (client secret)
 * and the User.Read.All application permission.
 */
export async function getADUserByOID(oid: string): Promise<ADUser | undefined> {
    const action = moduleName + ' getADUserByOID';
    try {
        const msalConfig = {
            auth: {
                clientId: process.env.AZURE_CLIENT_ID!,
                clientSecret: process.env.AZURE_CLIENT_SECRET!,
                authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`
            }
        };

        const cca = new msal.ConfidentialClientApplication(msalConfig);

        const tokenResponse = await cca.acquireTokenByClientCredential({
            scopes: ['https://graph.microsoft.com/.default']
        });

        if (!tokenResponse || !tokenResponse.accessToken) {
            consoleLogError(action, 'Failed to acquire access token');
            return undefined;
        }

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
 * Used by admin features to look up a user in Azure AD and retrieve their
 * display name and OID for storage in the local database.
 * Requires ConfidentialClientApplication with client credentials (client secret)
 * and the User.Read.All application permission.
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
            const emailDomain = username.includes('@') ? username.split('@')[1] : '';
            const escapedIssuer = emailDomain.replace(/'/g, "''");
            
            // Search for user by identities collection — requires both issuer and issuerAssignedId
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

            if (userData.value && userData.value.length > 0) {
                const user = userData.value[0];
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

// ---------------------------------------------------------------------------
// Login — Entra External ID Native Authentication API
// Verifies the user's email + password directly against the CIAM token endpoint.
// No Graph API call, no User.Read.All permission, no local password storage.
// Requires "Allow public client flows" = Yes and "Enable native authentication" = Yes
// on the app registration, plus a user flow associated with the app.
// ---------------------------------------------------------------------------

/**
 * Authenticate user with username and password via the Entra Native Authentication API.
 *
 * 1. Looks up user in the local database by email
 * 2. Checks the active flag
 * 3. Verifies credentials against Azure Entra (Native Authentication API)
 * 4. Updates the OID in the database if it was not previously stored
 * 5. Returns a JWT token
 */
export async function authenticateUser(username: string, password: string): Promise<AuthResult> {
    const action = moduleName + ' authenticateUser';
    
    try {
        consoleLogInfo(action, `Authentication attempt for: ${username}`);

        // Step 1: Look up user in local database by email
        const dbUser = await getDbUserByEmail(username);

        if (!dbUser) {
            consoleLogError(action, `User not found in database: ${username}`);
            return {
                success: false,
                error: 'User not found',
                errorType: 'not_found'
            };
        }

        consoleLogInfo(action, `Database user found — person_id: ${dbUser.person_id}, OID: ${dbUser.oid || '(none)'}`);

        // Step 2: Check active flag
        if (!dbUser.active) {
            consoleLogError(action, `User account is inactive: ${username}`);
            return {
                success: false,
                error: 'User account is inactive',
                errorType: 'inactive'
            };
        }

        // Step 3: Verify credentials against Azure Entra (Native Authentication API)
        consoleLogInfo(action, `Verifying credentials with Entra for: ${username}`);
        const entraResult = await verifyCredentialsWithEntra(username, password);

        if (!entraResult.success) {
            consoleLogError(action, `Entra authentication failed for ${username}: ${entraResult.error}`);
            return {
                success: false,
                error: 'Incorrect username or password',
                errorType: 'invalid_password'
            };
        }

        consoleLogSuccess(action, `Entra authentication succeeded for: ${username} (OID: ${entraResult.oid || 'n/a'})`);

        // Step 4: If the database record has no OID yet, store the one returned by Entra
        if (!dbUser.oid && entraResult.oid) {
            consoleLogInfo(action, `Storing OID from Entra into database for person_id: ${dbUser.person_id}`);
            await updatePersonOid(dbUser.person_id, entraResult.oid);
            dbUser.oid = entraResult.oid;
        }

        // Use the database OID (or the one we just stored from Entra)
        const oid = dbUser.oid || entraResult.oid || '';

        // Step 5: Generate JWT token
        const adUser: ADUser = {
            user_id: username,
            name: dbUser.name || username,
            email: username,
            oid
        };
        const token = generateFakeToken(adUser);
        
        consoleLogSuccess(action, `Authentication successful for: ${username}`);
        return {
            success: true,
            token,
            oid
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
 * Verify a user's credentials against Azure Entra External ID using the
 * Native Authentication API (email + password sign-in).
 *
 * This is a three-step REST flow:
 *   1. POST /oauth2/v2.0/initiate   — start sign-in, get continuation_token
 *   2. POST /oauth2/v2.0/challenge   — request password challenge, get new continuation_token
 *   3. POST /oauth2/v2.0/token       — submit password with continuation_token, get tokens
 *
 * Prerequisites in Azure Portal (entra.microsoft.com):
 *   - App registration > Authentication > Advanced settings:
 *       "Allow public client flows" = Yes
 *       "Enable native authentication" = Yes
 *   - A user flow (email + password) must be created and associated with the app
 *
 * Requires AZURE_CIAM_SUBDOMAIN in .env (e.g., "crchubappusers").
 */
async function verifyCredentialsWithEntra(
    username: string,
    password: string
): Promise<{ success: boolean; oid?: string; name?: string; error?: string }> {
    const action = moduleName + ' verifyCredentialsWithEntra';

    const ciamSubdomain = process.env.AZURE_CIAM_SUBDOMAIN;
    const clientId = process.env.AZURE_CLIENT_ID!;

    if (!ciamSubdomain) {
        consoleLogError(action, 'AZURE_CIAM_SUBDOMAIN is not set — cannot use native authentication');
        return { success: false, error: 'AZURE_CIAM_SUBDOMAIN is not configured' };
    }

    const baseUrl = `https://${ciamSubdomain}.ciamlogin.com/${ciamSubdomain}.onmicrosoft.com`;

    try {
        // ------------------------------------------------------------------
        // Step 1: Initiate sign-in
        // ------------------------------------------------------------------
        const initiateUrl = `${baseUrl}/oauth2/v2.0/initiate`;
        consoleLogInfo(action, `Step 1 (initiate) — POST ${initiateUrl} for: ${username}`);

        const initiateBody = new URLSearchParams({
            client_id: clientId,
            challenge_type: 'password redirect',
            username
        });

        const initiateResp = await fetch(initiateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: initiateBody.toString()
        });

        const initiateData = await initiateResp.json();

        if (!initiateResp.ok) {
            const errDesc = initiateData.error_description || initiateData.error || 'Unknown error';
            consoleLogError(action, `Initiate failed (${initiateResp.status}): ${errDesc}`);
            return { success: false, error: errDesc };
        }

        // If Entra returns challenge_type=redirect, native auth is not available for this user
        if (initiateData.challenge_type === 'redirect') {
            consoleLogError(action, 'Entra returned challenge_type=redirect — native auth not available');
            return { success: false, error: 'Native authentication not available for this user' };
        }

        if (!initiateData.continuation_token) {
            consoleLogError(action, 'No continuation_token in initiate response');
            return { success: false, error: 'Missing continuation token from Entra' };
        }

        consoleLogInfo(action, `Initiate succeeded — challenge_type: ${initiateData.challenge_type || 'n/a'}`);

        // ------------------------------------------------------------------
        // Step 2: Request challenge (password)
        // This tells Entra we want to authenticate with a password and
        // returns a new continuation_token authorized for password submission.
        // ------------------------------------------------------------------
        const challengeUrl = `${baseUrl}/oauth2/v2.0/challenge`;
        consoleLogInfo(action, `Step 2 (challenge) — POST ${challengeUrl}`);

        const challengeBody = new URLSearchParams({
            client_id: clientId,
            challenge_type: 'password redirect',
            continuation_token: initiateData.continuation_token
        });

        const challengeResp = await fetch(challengeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: challengeBody.toString()
        });

        const challengeData = await challengeResp.json();

        if (!challengeResp.ok) {
            const errDesc = challengeData.error_description || challengeData.error || 'Unknown error';
            consoleLogError(action, `Challenge failed (${challengeResp.status}): ${errDesc}`);
            return { success: false, error: errDesc };
        }

        if (challengeData.challenge_type === 'redirect') {
            consoleLogError(action, 'Challenge returned redirect — password auth not available');
            return { success: false, error: 'Password authentication not available for this user' };
        }

        if (!challengeData.continuation_token) {
            consoleLogError(action, 'No continuation_token in challenge response');
            return { success: false, error: 'Missing continuation token from challenge' };
        }

        consoleLogInfo(action, `Challenge succeeded — challenge_type: ${challengeData.challenge_type || 'n/a'}`);

        // ------------------------------------------------------------------
        // Step 3: Submit password and get tokens
        // ------------------------------------------------------------------
        const tokenUrl = `${baseUrl}/oauth2/v2.0/token`;
        consoleLogInfo(action, `Step 3 (token) — POST ${tokenUrl}`);

        const tokenBody = new URLSearchParams({
            client_id: clientId,
            continuation_token: challengeData.continuation_token,
            grant_type: 'password',
            password,
            scope: 'openid profile offline_access'
        });

        const tokenResp = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenBody.toString()
        });

        const tokenData = await tokenResp.json();

        if (!tokenResp.ok) {
            const errCode = tokenData.error || '';
            const errDesc = tokenData.error_description || tokenData.error || 'Unknown error';
            const suberror = tokenData.suberror || '';

            if (errCode === 'invalid_grant') {
                consoleLogWarning(action, `Credential validation failed: ${suberror || errCode}`);
            } else {
                consoleLogError(action, `Token request failed (${tokenResp.status}): ${errCode} / ${suberror} — ${errDesc}`);
            }
            return { success: false, error: errDesc };
        }

        // ------------------------------------------------------------------
        // Step 4: Parse the ID token to extract OID and name
        // ------------------------------------------------------------------
        let oid: string | undefined;
        let name: string | undefined;

        if (tokenData.id_token) {
            try {
                // Decode the JWT payload (second segment) without verification —
                // we trust it because it came directly from the Entra token endpoint over HTTPS.
                const payloadBase64 = tokenData.id_token.split('.')[1];
                const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
                const claims = JSON.parse(payloadJson);
                oid = claims.oid || claims.sub;
                name = claims.name;
            } catch (decodeErr) {
                consoleLogWarning(action, `Could not decode id_token: ${decodeErr}`);
            }
        }

        consoleLogSuccess(action, `Native auth succeeded — OID: ${oid || 'n/a'}, Name: ${name || 'n/a'}`);
        return { success: true, oid, name };

    } catch (error: any) {
        consoleLogError(action, `Native auth error: ${error.message || String(error)}`);
        return { success: false, error: error.message || String(error) };
    }
}

/**
 * Look up a user in the local database by email address.
 */
async function getDbUserByEmail(email: string): Promise<{
    person_id: string;
    oid: string;
    name: string;
    email: string;
    active: boolean;
} | null> {
    const action = moduleName + ' getDbUserByEmail';
    const pool = getDbPool();

    try {
        const result = await pool.query(
            `SELECT person_id, oid, email, name, active
             FROM person
             WHERE LOWER(email) = LOWER($1)`,
            [email]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];

        // Normalize the active flag (handles boolean, text "True"/"true", null)
        let active = false;
        if (row.active === true || row.active === 'true' || row.active === 'True' ||
            (typeof row.active === 'string' && row.active.toLowerCase() === 'true')) {
            active = true;
        }

        return { ...row, active };
    } catch (e: any) {
        consoleLogError(action, `Database error: ${e.message}`);
        throw e;
    }
}

/**
 * Update a person's OID in the database.
 * Called on first login when the OID was not previously stored.
 */
async function updatePersonOid(personId: string, oid: string): Promise<void> {
    const action = moduleName + ' updatePersonOid';
    const pool = getDbPool();

    try {
        await pool.query(
            `UPDATE person SET oid = $1, updated_at = CURRENT_TIMESTAMP WHERE person_id = $2`,
            [oid, personId]
        );
        consoleLogSuccess(action, `Updated OID for person_id ${personId}`);
    } catch (e: any) {
        consoleLogError(action, `Failed to update OID: ${e.message}`);
        throw e;
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

// Note: hashPassword() has been removed.
// Passwords are now managed by Azure AD and verified via the Native Authentication API.
// The set-user-password.ts script is used to set permanent passwords via Graph API.
