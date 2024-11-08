import { IRouterContext } from "koa-router";
import * as path from "node:path";

export class AuthHandler {

    public static async signIn(username: string, password: string, ctx: IRouterContext) {
        try {
            console.log(`[AUTH] Sign in attempt for user: ${username}`);
            const token = await this.authenticate(username, password);
            ctx.response.type = 'application/json';
            if (token) {
                ctx.status = 200;
                ctx.response.body = { token: token, username: username };
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "Authentication failed", username };
            }
        } catch (e) {
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving study", details: e.message };
        }
    }

    public static async signOut(ctx: IRouterContext) {
        ctx.response.type = 'application/json';
        ctx.status = 200;
        ctx.response.body = { message: "Sign out successful" };
    }

    private static async authenticate(username: string, password: string) {
        try {
            // Check if we're in local environment
            if (process.env.ENVIRONMENT === 'local') {
                if (password === '#2Pencil' && username.endsWith('@triradialapps.onmicrosoft.com')) {
                    const localUser = username.split('@')[0].toLowerCase();
                    switch (localUser) {
                        case 'graham': return { token: "fa12eb", uid: "3a165" };
                        case 'mike': return { token: "ea12eb", uid: "3e165" };
                        default: return false;
                    }
                }
                return false;
            }

            // Non-local environment: Use Azure AD authentication
            const tenantID = process.env.AD_B2C_TENANT;
            const clientId = process.env.AD_B2C_CLIENT_ID;
            const clientSecret = process.env.AD_B2C_CLIENT_SECRET;
            const tokenEndpointTemplate = process.env.AD_B2C_URL;
            const tokenEndpoint = tokenEndpointTemplate?.replace('${tenantID}', tenantID ?? '');

            console.log('Auth Environment:', {
                clientId: clientId,
                tokenEndpoint: tokenEndpoint,
                username: username,
                password: password
            });


            const params = new URLSearchParams();
            params.append('grant_type', 'password');
            params.append('client_id', clientId);
            params.append('client_secret', clientSecret);
            params.append('scope', 'openid profile offline_access');
            params.append('username', username);
            params.append('password', password);
            params.append('response_type', 'code');
            params.append('response_mode', 'query');

            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Authentication failed:', errorText);
                return false;
            }

            const data = await response.json();

            if (data.access_token) {
                return {
                    token: data.access_token,
                    uid: data.uid // Assuming the Azure response includes a user ID
                };
            }
            return false;
        } catch (error) {
            console.error('Authentication error:', error);
            return false;
        }
    }
}