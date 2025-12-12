# Authentication Setup Guide

This guide explains how to set up and use the authentication system in CRCHub.

## Overview

The authentication system uses a hybrid approach:

1. **Username Validation**: Users are validated against Azure Active Directory (Azure AD)
2. **Password Storage**: Passwords are temporarily stored in the database (bcrypt hashed)
3. **Fake JWT Tokens**: The system generates JWT tokens that work with the existing middleware
4. **Active Flag**: Users must have `active = true` in the database to log in

This approach allows for development and testing while preparing for a future migration to Azure Entra External ID.

## Database Setup

### 1. Run the Migration

Apply the database migration to add the `password_hash` and `active` fields to the `person` table:

```bash
psql -d crchub -f database/migrations/003_add_password_active_to_person.sql
```

### 2. Set User Passwords

Use the provided script to set passwords for users:

```bash
# Build the project first
npm run build

# Set a password for a 
cd packages/server-crchub
node dist/scripts/set-user-password.js user@example.com MyPassword123
```

This script will:
- Hash the password using bcrypt
- Update the user's `password_hash` field
- Set the user's `active` flag to `true`
- Display the updated user information

## Environment Variables

Add the following environment variables to your `.env` file (or Azure environment variables):

```bash
# Azure AD Configuration (for user validation)
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id

# Optional: For B2C middleware (if using real Azure B2C tokens)
AZURE_B2C_JWKS_URI=https://your-tenant.b2clogin.com/your-tenant.onmicrosoft.com/discovery/v2.0/keys?p=B2C_1_SignIn
AZURE_B2C_CLIENT_ID=your-b2c-client-id
AZURE_B2C_ISSUER=https://your-tenant.b2clogin.com/your-tenant-id/v2.0/
```

### Getting Azure AD Credentials

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Create a new registration or select an existing one
4. Copy the **Application (client) ID** → `AZURE_CLIENT_ID`
5. Copy the **Directory (tenant) ID** → `AZURE_TENANT_ID`
6. Go to **Certificates & secrets** > **New client secret**
7. Copy the secret value → `AZURE_CLIENT_SECRET`
8. Go to **API permissions** and add:
   - Microsoft Graph > Application permissions > `User.Read.All`
   - Grant admin consent

## Authentication Flow

### Current Flow (Fake Login with Azure AD Validation)

```
1. User enters username (email) and password
2. Client sends credentials to /signIn endpoint
3. Server validates username in Azure AD using MSAL
4. Server retrieves user's OID from Azure AD
5. Server checks database for user with matching OID
6. Server verifies password against stored hash
7. Server checks active flag is true
8. Server generates fake JWT token
9. Client receives token and stores it
10. Client makes authenticated requests with token
```

### Token Format

The fake JWT token includes:

```json
{
  "exp": <expiration timestamp>,
  "iss": "https://fake-auth.local/fake-issuer/v2.0/",
  "oid": "<user's Azure AD Object ID>",
  "name": "<user's display name>",
  "email": "<user's email>",
  "emails": ["<user's email>"]
}
```

The token is signed with a fake signature and includes a special issuer and kid (`fake-key-id`) that the middleware recognizes as a fake token.

## Middleware

The authentication middleware (`auth-middleware.ts`) automatically detects whether a token is:

- **Fake token**: Validated by checking expiration and payload structure
- **Real Azure B2C token**: Validated using JWKS and signature verification

This allows you to switch between fake and real authentication without code changes.

## Security Considerations

### Current Setup (Development/Testing)

- Passwords are stored as bcrypt hashes (secure)
- Tokens are not cryptographically signed (fake signatures)
- User validation requires Azure AD access (secure)
- Active flag provides access control (secure)

### Future Migration to Azure Entra External ID

When migrating to Azure Entra External ID:

1. Remove the `password_hash` field from the database
2. Update the `/signIn` endpoint to use Azure Entra External ID authentication
3. Replace fake token generation with real Azure tokens
4. The middleware will automatically work with real tokens
5. Remove the fake token verification logic from middleware

## Testing

### Test User Setup

1. Ensure the user exists in Azure AD
2. Ensure the user exists in the `person` table with their Azure AD OID as the `userid`
3. Set a password for the user using the script
4. Verify the user can log in through the web interface

### Manual Testing

```bash
# Test authentication endpoint
curl -X POST http://localhost:8080/signIn \
  -H "Content-Type: application/json" \
  -d '{"username": "user@example.com", "password": "MyPassword123"}'

# Expected response:
# {
#   "token": "eyJhbG...",
#   "oid": "user-object-id",
#   "username": "user@example.com"
# }
```

## Troubleshooting

### User Not Found in Azure AD

- Verify the user exists in your Azure AD tenant
- Check the email address matches exactly
- Ensure the app has `User.Read.All` permission with admin consent

### User Not Found in Database

- Verify the user exists in the `person` table
- Check the `oid` field matches the user's Azure AD OID
- Run: `SELECT oid, email, name, active FROM person WHERE email = 'user@example.com';`

### Password Incorrect

- Verify you're using the correct password
- Try setting the password again using the script

### User Inactive

- Check the `active` field: `SELECT active FROM person WHERE email = 'user@example.com';`
- Update if needed: `UPDATE person SET active = true WHERE email = 'user@example.com';`

### Token Not Working

- Check the token is being sent in the Authorization header: `Authorization: Bearer <token>`
- Verify the middleware is not returning authentication errors in the server logs
- Check the token hasn't expired (12 hour default expiration)

## API Reference

### POST /signIn

Authenticate a user with username and password.

**Request:**
```json
{
  "username": "user@example.com",
  "password": "MyPassword123"
}
```

**Response (Success - 200):**
```json
{
  "token": "eyJhbG...",
  "oid": "user-object-id",
  "username": "user@example.com"
}
```

**Response (Error - 401/403/404/500):**
```json
{
  "error": "Error message",
  "username": "user@example.com"
}
```

**Status Codes:**
- `200`: Success
- `401`: Invalid password
- `403`: User account inactive
- `404`: User not found
- `500`: Authentication error

### POST /signOut

Sign out the current user.

**Response:**
```json
{
  "message": "Sign out successful"
}
```

### GET /getADUserByUsername

Look up a user in Azure AD by username (email).

**Query Parameters:**
- `username`: User's email address

**Response (Success - 200):**
```json
{
  "ADUser": {
    "user_id": "user@example.com",
    "name": "User Name",
    "email": "user@example.com",
    "oid": "user-object-id"
  }
}
```

### GET /getADUserByOID

Look up a user in Azure AD by Object ID.

**Query Parameters:**
- `oid`: User's Azure AD Object ID

**Response (Success - 200):**
```json
{
  "ADUser": {
    "user_id": "user@example.com",
    "name": "User Name",
    "email": "user@example.com",
    "oid": "user-object-id"
  }
}
```

