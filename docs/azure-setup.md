# Azure Setup Guide

This guide covers the Azure services required by the CRCHub application:

1. [Azure Entra External ID (Authentication)](#1-azure-entra-external-id-authentication)
2. [Azure Database for PostgreSQL (Database)](#2-azure-database-for-postgresql)

---

## 1. Azure Entra External ID (Authentication)

Azure Entra External ID (CIAM) is used to manage user identities and passwords. The application uses three distinct flows:

- **Login (Native Authentication API)** — When a user signs in with email + password, the server verifies their credentials against Azure Entra External ID using the Native Authentication API. This is a three-step REST flow (initiate → challenge → token) that runs against `{subdomain}.ciamlogin.com`. It does **not** require Graph API permissions.
- **Admin user lookup (Graph API)** — When an admin adds a new user by email, the server calls the Microsoft Graph API to retrieve the user's display name and OID. This requires the `User.Read.All` application permission.
- **Password management (Graph API)** — A utility script sets permanent (non-temporary) passwords for users via the Graph API. This requires the `User-PasswordProfile.ReadWrite.All` application permission.

### 1.1 Create an Azure Entra External ID Tenant

1. Sign in to the [Azure Portal](https://portal.azure.com)
2. Search for **Microsoft Entra External ID** in the top search bar
3. Click **Create a tenant**
4. Select **Customer** as the tenant type
5. Fill in the tenant details:
   - **Tenant name**: Choose a name (e.g., `CRCHub App Users`)
   - **Domain name**: Choose a domain (e.g., `crchubappusers.onmicrosoft.com`)
   - **Location**: Select your region
6. Click **Review + Create**, then **Create**
7. Once created, note the **Tenant ID** — this is your `AZURE_TENANT_ID`
8. Note the **subdomain** from the domain name (e.g., `crchubappusers` from `crchubappusers.onmicrosoft.com`) — this is your `AZURE_CIAM_SUBDOMAIN`

### 1.2 Register an Application

1. Switch to your new External ID tenant (click your profile icon top-right, then **Switch directory**)
2. Navigate to **Microsoft Entra ID** > **App registrations**
3. Click **New registration**
4. Fill in the registration form:
   - **Name**: `crchub-webapp` (or your preferred app name)
   - **Supported account types**: Select **Accounts in this organizational directory only**
   - **Redirect URI**: Leave blank (the app uses Native Authentication and client credentials, not interactive browser sign-in)
5. Click **Register**
6. On the app overview page, copy the **Application (client) ID** — this is your `AZURE_CLIENT_ID`

### 1.3 Enable Public Client Flows and Native Authentication

The login flow uses the Native Authentication API, which requires the app to be configured as a public client with native authentication enabled.

1. In your app registration, navigate to **Authentication**
2. Scroll down to **Advanced settings**
3. Set **Allow public client flows** to **Yes**
4. Set **Enable native authentication** to **Yes**
5. Click **Save**

> **Why?** The Native Authentication API sends the user's email and password directly to the Entra CIAM token endpoint (`{subdomain}.ciamlogin.com`) for verification. This is a public client flow. Without these settings, Entra will reject the authentication requests.

### 1.4 Create a Client Secret (Required for Graph API Calls)

The admin user-lookup and password management features use the client credentials flow to call the Microsoft Graph API. This requires a client secret.

1. In your app registration, navigate to **Certificates & secrets**
2. Click **New client secret**
3. Enter a description (e.g., `crchub-server-secret`)
4. Select an expiration period (recommended: 12 or 24 months)
5. Click **Add**
6. **Immediately copy the secret Value** (not the Secret ID) — this is your `AZURE_CLIENT_SECRET`
   > **Warning**: The secret value is only shown once. If you navigate away without copying it, you will need to create a new secret.

### 1.5 Configure Microsoft Graph API Permissions

The application requires two Graph API application permissions:

| Permission | Purpose |
|---|---|
| `User.Read.All` | Admin user lookup — query users by email to retrieve display name and OID |
| `User-PasswordProfile.ReadWrite.All` | Password management — set permanent (non-temporary) passwords via the `set-user-password` script |

> **Note**: Neither of these permissions is used by the login flow. The Native Authentication API login does not call the Graph API.

To add the permissions:

1. In your app registration, navigate to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Application permissions** (not Delegated permissions)
5. Search for and check the following permissions:
   - **`User.Read.All`** — Read all users' full profiles
   - **`User-PasswordProfile.ReadWrite.All`** — Read and write the password profile for all users
6. Click **Add permissions**
7. Back on the API permissions page, click **Grant admin consent for [your tenant]**
   > **Important**: This step requires a Global Administrator or Privileged Role Administrator. Without admin consent, the Graph API will return `403 Authorization_RequestDenied`.
8. Verify the **Status** column shows a green checkmark with **Granted for [your tenant]** for both permissions

### 1.6 Create a User Flow (Required for Native Authentication)

The Native Authentication API requires a user flow to be configured and associated with the app registration.

1. In the Entra admin center, navigate to **External Identities** > **User flows**
2. Click **New user flow**
3. Select **Sign up and sign in**
4. Configure the flow:
   - **Name**: e.g., `SignUpSignIn`
   - **Identity providers**: Select **Email with password**
5. Click **Create**
6. After the flow is created, click on it to open its settings
7. Under **Applications**, click **Add application**
8. Select your app registration (`crchub-webapp`)
9. Click **Add**

> **Why?** Without a user flow associated with the app, the Native Authentication API will return `challenge_type=redirect`, indicating that native authentication is not available.

### 1.7 Add Users to the Tenant

Users must exist in the Azure AD tenant before they can sign in. Their passwords are managed by Azure AD.

1. Navigate to **Microsoft Entra ID** > **Users**
2. Click **New user** > **Create new user**
3. Fill in the user details:
   - **Display name**: e.g., `Jane Doe`
   - **Email**: The user's actual email address (e.g., `jane.doe@triradial.com`)
   - **Password**: Set an initial password
4. Under **Identities**, ensure the user has an identity with:
   - **Sign in type**: `emailAddress`
   - **Issuer**: Your email domain (e.g., `triradial.com`)
   - **Issuer Assigned ID**: The user's email (e.g., `jane.doe@triradial.com`)
5. Click **Create**
6. Note the user's **Object ID (OID)** from their profile page — you will need this to set their permanent password

> **Important**: Passwords created or reset via the Entra admin center are marked as **temporary** (requiring change on next interactive sign-in). Since the CRCHub application uses a custom login UI, you must set a permanent password using the `set-user-password` script (see [section 1.9](#19-set-a-permanent-password-for-a-user)).

### 1.8 Add the User to the Local Database

After the user exists in Azure AD, they must also be added to the local `person` table so the application recognises them on login.

**Option A — Via the Admin UI** (recommended):
1. An admin enters the user's email in the admin UI
2. The server calls the Graph API to retrieve the user's display name and OID
3. The server stores the name, email, and OID in the `person` table

**Option B — Manually**:
1. Note the user's **Object ID (OID)** from Azure AD (found on the user's profile page)
2. Insert a row into the `person` table:
   ```sql
   INSERT INTO person (oid, email, name, active)
   VALUES ('<oid-from-azure>', 'jane.doe@triradial.com', 'Jane Doe', true);
   ```

> **Note**: If the OID is not set at the time of first login, the Native Authentication API will return it in the ID token and the server will automatically store it in the database.

### 1.9 Set a Permanent Password for a User

Passwords created or reset via the Entra admin center are always temporary. The `set-user-password` script uses the Graph API to set a permanent password with `forceChangePasswordNextSignIn: false`.

**Prerequisites**:
- The app registration must have the `User-PasswordProfile.ReadWrite.All` application permission with admin consent ([step 1.5](#15-configure-microsoft-graph-api-permissions))
- The server package must be built (`npm run build` in `packages/server-crchub`)

**Usage**:

```bash
cd packages/server-crchub
npm run build
node dist/scripts/set-user-password.js <oid> <password>
```

**Example**:

```bash
node dist/scripts/set-user-password.js ddabd431-a0a6-4853-ba21-bcd8cd758bf9 MySecurePassword123!
```

**Parameters**:
- `<oid>` — The user's Object ID (GUID) from Azure AD. Find this on the user's profile page in the Entra admin center.
- `<password>` — The new permanent password (minimum 8 characters). Must meet Azure AD password complexity requirements.

The script will:
1. Acquire an access token using the app's client credentials (`AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET`)
2. Call `PATCH https://graph.microsoft.com/v1.0/users/{oid}` with `passwordProfile.forceChangePasswordNextSignIn: false`
3. Report success or failure

> **Alternative (Graph Explorer)**: If the script fails, you can also set the password via [Graph Explorer](https://developer.microsoft.com/en-us/graph-explorer):
> 1. Sign in as a **Global Administrator** on the CIAM tenant
> 2. Consent to the `User-PasswordProfile.ReadWrite.All` delegated permission
> 3. Send a PATCH request to `https://graph.microsoft.com/v1.0/users/{oid}` with body:
>    ```json
>    { "passwordProfile": { "password": "...", "forceChangePasswordNextSignIn": false } }
>    ```

### 1.10 Update the Server Environment Variables

Add the following values to your `packages/server-crchub/.env` file:

```env
# Auth settings
AZURE_CLIENT_ID=<Application (client) ID from step 1.2>
AZURE_CLIENT_SECRET=<Client secret Value from step 1.4>
AZURE_TENANT_ID=<Tenant ID from step 1.1>
# CIAM subdomain for Entra External ID Native Authentication API
# Used for email + password sign-in (e.g., "crchubappusers" → crchubappusers.ciamlogin.com)
AZURE_CIAM_SUBDOMAIN=<subdomain from step 1.1>
```

### Authentication Flow Summary

```
LOGIN (Native Authentication API — no Graph API)
──────────────────────────────────────────────────
  User enters email + password
        │
        ▼
  Server: SELECT FROM person WHERE email = ?
        │ (user found, active = true)
        ▼
  Server → Entra: POST /oauth2/v2.0/initiate  (get continuation_token)
        │
        ▼
  Server → Entra: POST /oauth2/v2.0/challenge (request password challenge)
        │
        ▼
  Server → Entra: POST /oauth2/v2.0/token     (submit password, get id_token)
        │
        ▼
  Server: Parse id_token for OID, store if missing in DB
        │
        ▼
  Server: Return JWT token to client
```

```
ADMIN USER LOOKUP (Graph API — requires User.Read.All)
──────────────────────────────────────────────────────
  Admin enters email
        │
        ▼
  Server: Acquire token via client credentials (AZURE_CLIENT_SECRET)
        │
        ▼
  Server: GET /v1.0/users?$filter=identities/any(...)
        │ (returns displayName, OID)
        ▼
  Server: INSERT INTO person (oid, email, name, active)
```

```
PASSWORD MANAGEMENT (Graph API — requires User-PasswordProfile.ReadWrite.All)
─────────────────────────────────────────────────────────────────────────────
  Admin runs: node dist/scripts/set-user-password.js <oid> <password>
        │
        ▼
  Script: Acquire token via client credentials (AZURE_CLIENT_SECRET)
        │
        ▼
  Script: PATCH /v1.0/users/{oid}
          { "passwordProfile": { "password": "...", "forceChangePasswordNextSignIn": false } }
        │
        ▼
  User can now sign in with the new permanent password
```

---

## 2. Azure Database for PostgreSQL

CRCHub uses Azure Database for PostgreSQL Flexible Server for its database.

### 2.1 Create the PostgreSQL Flexible Server

1. Sign in to the [Azure Portal](https://portal.azure.com)
2. Search for **Azure Database for PostgreSQL flexible servers** in the top search bar
3. Click **Create**
4. Fill in the **Basics** tab:
   - **Subscription**: Select your subscription
   - **Resource group**: Select or create a resource group (e.g., `crchub-rg`)
   - **Server name**: Choose a name (e.g., `crchub-d-ds`)
     > This determines your host: `crchub-d-ds.postgres.database.azure.com`
   - **Region**: Select your region
   - **PostgreSQL version**: Select **16** (or latest stable)
   - **Workload type**: Select **Development** for dev/test environments
   - **Authentication method**: Select **PostgreSQL authentication only**
   - **Admin username**: `crchubadmin` (or your preferred admin user)
   - **Password**: Set a strong password
5. Click **Next: Networking**

### 2.2 Configure Networking

1. On the **Networking** tab:
   - **Connectivity method**: Select **Public access (allowed IP addresses)**
   - **Firewall rules**: Click **Add current client IP address** to allow your development machine
   - Check **Allow public access from any Azure service within Azure to this server** if your app is hosted on Azure (e.g., Azure App Service)
2. Click **Next: Security**

### 2.3 Configure Security

1. On the **Security** tab:
   - Leave defaults unless you need specific encryption settings
2. Click **Review + Create**, then **Create**
3. Wait for the deployment to complete

### 2.4 Create the Database

1. Once the server is created, navigate to the resource
2. In the left sidebar, click **Databases**
3. Click **Add**
4. Enter the database name: `crchubdb`
5. Click **Save**

### 2.5 Configure SSL

Azure PostgreSQL Flexible Server enforces SSL by default. The server application is configured to use SSL when `DB_SSL=true` is set. To verify:

1. In your PostgreSQL server resource, navigate to **Server parameters**
2. Search for `require_secure_transport`
3. Ensure it is set to **ON**

### 2.6 Update the Server Environment Variables

Add the following values to your `packages/server-crchub/.env` file:

```env
# Database Settings
DB_HOST=<server-name>.postgres.database.azure.com
DB_PORT=5432
DB_NAME=crchubdb
DB_USER=crchubadmin
DB_PASSWORD="<your-password>"
DB_SSL=true
```

> **Note**: If your password contains special characters (especially `#`), you **must** wrap it in double quotes in the `.env` file. The `#` character is treated as a comment delimiter by dotenv if unquoted.

---

## Environment Variable Reference

The complete set of Azure-related environment variables for `packages/server-crchub/.env`:

| Variable | Description | Example |
|---|---|---|
| `AZURE_ENVIRONMENT` | Environment identifier | `local`, `development`, `production` |
| `AZURE_CLIENT_ID` | App registration Client ID (used by login and admin Graph API) | `1ef0d428-c39e-42f0-bb6a-8d463f4dc388` |
| `AZURE_CLIENT_SECRET` | App registration Client Secret (used by admin Graph API and password script) | `YZy8Q~...` |
| `AZURE_TENANT_ID` | Entra External ID Tenant ID | `8f68f42e-96b3-4c77-9d02-2bcf458b6fbc` |
| `AZURE_CIAM_SUBDOMAIN` | CIAM subdomain for Native Authentication API | `crchubappusers` |
| `DB_HOST` | PostgreSQL server hostname | `crchub-d-ds.postgres.database.azure.com` |
| `DB_PORT` | PostgreSQL server port | `5432` |
| `DB_NAME` | Database name | `crchubdb` |
| `DB_USER` | Database admin username | `crchubadmin` |
| `DB_PASSWORD` | Database password (quote if contains `#`) | `"#2Pencil"` |
| `DB_SSL` | Enable SSL for database connection | `true` |
| `GLOBAL_ADMIN` | Comma-separated OIDs of global admin users | `737dd1c3-...,ef70e49b-...` |

---

## Troubleshooting

### Login: Native Authentication Not Available (`challenge_type=redirect`)

**Error**: Server logs `Entra returned challenge_type=redirect — native auth not available`

**Cause**: Native authentication is not enabled for the app, or no user flow is associated with the app registration.

**Fix**:
1. Verify **Allow public client flows** and **Enable native authentication** are both set to **Yes** ([step 1.3](#13-enable-public-client-flows-and-native-authentication))
2. Verify a user flow with **Email with password** is created and associated with the app ([step 1.6](#16-create-a-user-flow-required-for-native-authentication))

### Login: `invalid_grant` or Credentials Rejected

**Error**: `invalid_grant` or `Credential validation failed`

**Cause**: The email/password combination is incorrect, or the password is expired/temporary.

**Fix**:
1. Verify the user exists in Azure AD ([step 1.7](#17-add-users-to-the-tenant))
2. Verify the password is permanent (not temporary) using the `set-user-password` script ([step 1.9](#19-set-a-permanent-password-for-a-user))

### Login: `AZURE_CIAM_SUBDOMAIN is not configured`

**Error**: Server logs `AZURE_CIAM_SUBDOMAIN is not set — cannot use native authentication`

**Cause**: The `AZURE_CIAM_SUBDOMAIN` environment variable is missing from `.env`.

**Fix**: Add `AZURE_CIAM_SUBDOMAIN=<your-subdomain>` to `packages/server-crchub/.env` ([step 1.10](#110-update-the-server-environment-variables))

### Login: Password Expired (`AADSTS50055`)

**Error**: `AADSTS50055: The password is expired`

**Cause**: The password was set as temporary via the Entra admin center. Temporary passwords require an interactive change which is not possible with a custom login UI.

**Fix**: Set a permanent password using the `set-user-password` script ([step 1.9](#19-set-a-permanent-password-for-a-user))

### Admin Lookup: 403 Authorization_RequestDenied

**Error**: `Graph API Error: 403 Forbidden {"error":{"code":"Authorization_RequestDenied","message":"Insufficient privileges to complete the operation."}}`

**Cause**: The app registration is missing the `User.Read.All` application permission, or admin consent has not been granted.

**Fix**: Follow [step 1.5](#15-configure-microsoft-graph-api-permissions) to add the permission and grant admin consent.

### Password Script: 403 Authorization_RequestDenied

**Error**: `Graph API error: 403 Forbidden` when running `set-user-password.js`

**Cause**: The app registration is missing the `User-PasswordProfile.ReadWrite.All` application permission. The `User.ReadWrite.All` permission alone is **not** sufficient for password updates.

**Fix**: Add the `User-PasswordProfile.ReadWrite.All` application permission with admin consent ([step 1.5](#15-configure-microsoft-graph-api-permissions))

### Database Connection Fails with SSL Error

**Error**: `no pg_hba.conf entry ... no encryption`

**Cause**: The Azure PostgreSQL server requires SSL, but `DB_SSL` is not enabled.

**Fix**: Set `DB_SSL=true` in your `.env` file.

### Database Password Not Recognized

**Error**: `password must be a string` or `SASL` authentication error

**Cause**: The password in `.env` starts with `#`, which dotenv interprets as a comment, causing the value to be empty.

**Fix**: Wrap the password in double quotes: `DB_PASSWORD="#2Pencil"`
