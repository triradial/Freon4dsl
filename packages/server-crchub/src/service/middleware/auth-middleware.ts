import { Context, Next } from 'koa';
import jsonwebtoken from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { AuthenticationError } from './error-middleware.js';
import { consoleLogError, consoleLogInfo } from '../../server/logging.js';

const moduleName = '[AuthMiddleware]';

// Configure the JWKS client
consoleLogInfo(moduleName, 'Configuring JWKS client with URI: ' + process.env.AZURE_B2C_JWKS_URI);

const client = jwksClient({
    jwksUri: process.env.AZURE_B2C_JWKS_URI || '', // This should be your Azure B2C JWKS URI
    cache: true,
    rateLimit: true,
    requestHeaders: {}, // Add empty headers object
    timeout: 30000 // Increase timeout to 30 seconds
});

// Function to get the signing key
const getSigningKey = async (kid: string): Promise<string> => {
    const action = moduleName + ' getSigningKey';
    try {
        consoleLogInfo(action, 'Attempting to get signing key with kid: ' + kid);
        
        const key = await client.getSigningKey(kid);
        consoleLogInfo(action, 'Successfully retrieved signing key');
        return key.getPublicKey();

    } catch (error: any) {
        // Enhanced error logging
        consoleLogError(action, 'Error getting signing key: ' + JSON.stringify({
            error: error?.message || String(error),   
            errorName: error?.name,
            kid,
            jwksUri: process.env.AZURE_B2C_JWKS_URI
        }));

        // Additional debug information for network errors
        if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
            consoleLogError(action, 'Network error details: ' + JSON.stringify({
                code: error.code,
                syscall: error.syscall,
                hostname: error.hostname,
                port: error.port
            }));
        }

        throw new AuthenticationError('Failed to retrieve authentication key', {
            error: error?.message || String(error),
            kid,
            code: error?.code
        });
    }
};

export async function authMiddleware(ctx: Context, next: Next) {
    const action = moduleName + ' authMiddleware';
    
    try {
        // Skip auth for certain endpoints
        if (
            ctx.path === '/' || 
            ctx.path === '/health' || 
            ctx.path === '/signIn' ||
            ctx.path === '/signOut' ||
            ctx.path === '/getADUserByUsername' ||
            ctx.path === '/getADUserByOID'
        ) {
            return next();
        }

        consoleLogInfo(action, `Processing auth for ${ctx.method} ${ctx.path}`);

        const authHeader = ctx.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            const errorMsg = 'No authorization token provided';
            consoleLogError(action, errorMsg + ' - Path: ' + ctx.path);
            throw new AuthenticationError(errorMsg);
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        let verified: any;

        // Decode token to check if it's a fake token or real B2C token
        const decodedToken: any = jsonwebtoken.decode(token, { complete: true });
        
        // Check if this is a fake token by looking at the issuer or key ID
        const isFakeToken = decodedToken?.payload?.iss?.includes('fake-auth.local') || 
                           decodedToken?.header?.kid === 'fake-key-id';
        
        if (isFakeToken) {
            consoleLogInfo(action, 'Detected fake token, using simplified verification');
            verified = verifyFakeToken(token);
        } else {
            consoleLogInfo(action, 'Using Azure B2C token verification');
            
            if (!decodedToken || !decodedToken.header.kid) {
                throw new AuthenticationError('Invalid token format', { 
                    hasDecodedToken: String(!!decodedToken),
                    hasKid: !!decodedToken?.header?.kid 
                });
            }

            const publicKey = await getSigningKey(decodedToken.header.kid);

            try {
                verified = jsonwebtoken.verify(token, publicKey, {
                    algorithms: ['RS256'],
                    audience: process.env.AZURE_B2C_CLIENT_ID,
                    issuer: process.env.AZURE_B2C_ISSUER
                });
            } catch (error: any) {
                consoleLogError(action, 'Token verification failed: ' + error?.message);
                if (error?.name === 'TokenExpiredError') {
                    throw new AuthenticationError('TokenExpiredError - Token expired');
                }
                if (error?.name === 'JsonWebTokenError') {
                    throw new AuthenticationError('JsonWebTokenError - Invalid token', {
                        error: error?.message
                    });
                }
                throw error;
            }
        }

        // Log successful verification
        consoleLogInfo(action, `Token verification successful for user: ${verified?.oid || 'unknown'}`);

        // Add the verified token payload to the context state
        ctx.state.user = verified; 
        await next();

    } catch (error: any) {
        // Log authentication error
        consoleLogError(action, `Authentication error: ${error?.message || String(error)}`);
        throw error;
    }
}

// Function to verify fake token
const verifyFakeToken = (token: string): any => {
    const action = moduleName + ' verifyFakeToken';
    try {
        consoleLogInfo(action, 'Starting fake token verification');

        // Decode the JWT token using jsonwebtoken library
        const decodedToken: any = jsonwebtoken.decode(token, { complete: true });
        
        if (!decodedToken || !decodedToken.payload) {
            const error = new AuthenticationError('Invalid token structure');
            consoleLogError(action, 'Invalid token structure');
            throw error;
        }
        
        const payload = decodedToken.payload;
        
        // Check if token is expired
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            const error = new AuthenticationError('Token expired');
            consoleLogError(action, 'Token expired');
            throw error;
        }

        // Validate required fields in payload
        if (!payload.oid) {
            const error = new AuthenticationError('Missing object_id in token payload');
            consoleLogError(action, 'Missing OID in token');
            throw error;
        }

        consoleLogInfo(action, `Fake token verification successful for OID: ${payload.oid}`);

        // Return the payload if everything is valid
        return {
            ...payload,
            object_id: payload.oid // Ensure object_id is present
        };

    } catch (error: any) {
        consoleLogError(action, 'Error verifying fake token: ' + (error?.message || String(error)));
        if (error instanceof AuthenticationError) {
            throw error;
        }
        throw new AuthenticationError('Invalid fake token', { error: error?.message || String(error) });
    }
}; 
