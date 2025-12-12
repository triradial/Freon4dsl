import { IRouterContext } from "koa-router";
import { consoleLogInfo, consoleLogError, consoleLogSuccess, consoleLogWarning } from './logging.js';
import * as authService from '../service/auth-service.js';

const moduleName = '[auth-handler]';

export class AuthHandler {

    /**
     * Sign in endpoint - authenticates user with username and password
     * Uses new authentication flow:
     * 1. Validates username in Azure AD
     * 2. Gets OID from Azure AD
     * 3. Checks database with OID and password
     * 4. Checks active flag
     * 5. Returns fake JWT token
     */
    public static async signIn(username: string, password: string, ctx: IRouterContext) {
        try {
            consoleLogInfo(moduleName, `Sign in attempt for user: ${username}`);
            
            // Use the new authentication service
            const result = await authService.authenticateUser(username, password);
            
            ctx.response.type = 'application/json';
            
            if (result.success && result.token && result.oid) {
                ctx.status = 200;
                ctx.response.body = { 
                    token: result.token, 
                    oid: result.oid, 
                    username: username 
                };
                consoleLogSuccess(moduleName, `Sign in successful for user: ${username}`);
            } else {
                // Map error types to appropriate HTTP status codes
                switch (result.errorType) {
                    case 'not_found':
                        ctx.status = 404;
                        break;
                    case 'inactive':
                        ctx.status = 403;
                        break;
                    case 'invalid_password':
                        ctx.status = 401;
                        break;
                    case 'auth':
                    default:
                        ctx.status = 500;
                        break;
                }
                ctx.response.body = { 
                    error: result.error || "Authentication failed", 
                    username 
                };
                consoleLogWarning(moduleName, `Sign in failed for user: ${username} - ${result.error}`);
            }
        } catch (e) {
            ctx.status = 500;
            ctx.response.body = { error: "Error during authentication", details: String(e) };
            consoleLogError(moduleName, `Sign in error: ${String(e)}`);
        }
    }

    /**
     * Sign out endpoint
     */
    public static async signOut(ctx: IRouterContext) {
        ctx.response.type = 'application/json';
        ctx.status = 200;
        ctx.response.body = { message: "Sign out successful" };
    }

    /**
     * Get Azure AD user information by username (email)
     * This endpoint is used for validating users during authentication
     */
    public static async getADUserByUsername(username: string, ctx: IRouterContext) {
        const action = moduleName + ' getADUserByUsername';
        try {
            consoleLogInfo(action, `Looking up AD user: ${username}`);
            
            const result = await authService.getADUserByUsername(username);
            
            ctx.response.type = 'application/json';
            
            if (result.error && result.errorType === 'auth') {
                ctx.status = 500;
                ctx.response.body = { error: "Authentication error", details: result.error };
                consoleLogError(action, `Auth error: ${result.error}`);
            } else if (result.user) {
                ctx.status = 200;
                ctx.response.body = { ADUser: result.user };
                consoleLogSuccess(action, `User found: ${result.user.email}`);
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "User not found", username };
                consoleLogWarning(action, `User not found: ${username}`);
            }
        } catch (ex) {
            ctx.status = 500;
            ctx.response.body = { error: "Error looking up user", details: String(ex) };
            consoleLogError(action, `Error: ${String(ex)}`);
        }
    }

    /**
     * Get Azure AD user information by OID
     */
    public static async getADUserByOID(oid: string, ctx: IRouterContext) {
        const action = moduleName + ' getADUserByOID';
        try {
            consoleLogInfo(action, `Looking up AD user by OID: ${oid}`);
            
            const user = await authService.getADUserByOID(oid);
            
            ctx.response.type = 'application/json';
            
            if (user) {
                ctx.status = 200;
                ctx.response.body = { ADUser: user };
                consoleLogSuccess(action, `User found: ${user.email}`);
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "User not found", oid };
                consoleLogWarning(action, `User not found with OID: ${oid}`);
            }
        } catch (ex) {
            ctx.status = 500;
            ctx.response.body = { error: "Error looking up user", details: String(ex) };
            consoleLogError(action, `Error: ${String(ex)}`);
        }
    }
}
