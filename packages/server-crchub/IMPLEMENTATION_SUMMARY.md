# Authentication Implementation Summary

## Overview

This document summarizes the implementation of the new authentication system for CRCHub. The system validates users against Azure AD, stores temporary passwords in the database, and generates fake JWT tokens that work with the existing middleware.

## Architecture

```
┌─────────────────┐
│   Web Client    │
│  (LoginPart)    │
└────────┬────────┘
         │ 1. POST /signIn
         │    {username, password}
         ↓
┌─────────────────┐
│  Auth Handler   │ 2. Validate username in Azure AD
│  (Koa Router)   │ 3. Get OID from Azure AD
└────────┬────────┘
         │ 4. Check database
         ↓
┌─────────────────┐
│  Auth Service   │ 5. Verify password hash
│   (MSAL + DB)   │ 6. Check active flag
└────────┬────────┘
         │ 7. Generate fake JWT
         ↓
┌─────────────────┐
│    Middleware   │ 8. Validate token on requests
│ (auth-middleware)│ 9. Allow fake or real tokens
└─────────────────┘
```

## Files Created

### Database

1. **`database/migrations/003_add_password_active_to_person.sql`**
   - Adds `password_hash` column (TEXT)
   - Adds `active` column (BOOLEAN, default true)
   - Creates indexes for performance
   - Adds documentation comments

### Server-Side

2. **`src/service/auth-service.ts`** (NEW)
   - `getADUserByOID()`: Lookup user in Azure AD by Object ID
   - `getADUserByUsername()`: Validate username in Azure AD and get OID
   - `authenticateUser()`: Complete authentication flow
   - `generateFakeToken()`: Create JWT token with fake signature
   - `hashPassword()`: Utility for hashing passwords

3. **`src/server/auth-handler.ts`** (UPDATED)
   - `signIn()`: Updated to use new auth service
   - `getADUserByUsername()`: New endpoint for AD lookups
   - `getADUserByOID()`: New endpoint for AD lookups
   - Proper HTTP status code mapping

4. **`src/server/routes.ts`** (UPDATED)
   - Added `/getADUserByUsername` route
   - Added `/getADUserByOID` route
   - Both routes support the authentication flow

### Client-Side

5. **`packages/webapp-crchub/src/services/security/auth.ts`** (UPDATED)
   - `authenticate()`: Updated to store token from server
   - `signOut()`: Clear all auth data
   - `getAuthToken()`: Get current token
   - `checkAuth()`: Verify auth state
   - `initializeAuth()`: Restore auth from session

### Scripts & Documentation

6. **`scripts/set-user-password.ts`** (NEW)
   - Command-line utility to set user passwords
   - Hashes passwords with bcrypt
   - Sets active flag to true
   - Validates input

7. **`AUTH_SETUP.md`** (NEW)
   - Complete setup guide
   - Environment variable documentation
   - API reference
   - Troubleshooting guide

8. **`.env.example`** (NEW)
   - Template for environment variables
   - All required Azure AD settings
   - Optional B2C settings

9. **`package.json`** (UPDATED)
   - Added `set-password` script
   - Added required dependencies

## Dependencies Added

```json
{
  "@azure/msal-node": "^2.16.2",
  "@types/bcryptjs": "^2.4.6",
  "@types/jsonwebtoken": "^9.0.7",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "jwks-rsa": "^3.1.0"
}
```

## Authentication Flow

### 1. User Login

```typescript
// Client sends credentials
POST /signIn
{
  "username": "user@example.com",
  "password": "MyPassword123"
}
```

### 2. Server Validates

```typescript
// AuthService.authenticateUser()
1. Validate username in Azure AD using MSAL
2. Get user's OID from Azure AD
3. Query database: SELECT * FROM person WHERE oid = <oid>
4. Check active flag is true
5. Verify password: bcrypt.compare(password, password_hash)
6. Generate fake JWT token
```

### 3. Token Generation

```typescript
// Fake JWT token format
{
  header: {
    alg: 'RS256',
    kid: 'fake-key-id',  // Middleware recognizes this
    typ: 'JWT'
  },
  payload: {
    exp: <12 hours from now>,
    iss: 'https://fake-auth.local/fake-issuer/v2.0/',
    oid: '<user's Azure AD OID>',
    name: '<user's display name>',
    email: '<user's email>'
  },
  signature: '<fake signature>'
}
```

### 4. Token Validation

```typescript
// auth-middleware.ts
1. Extract token from Authorization: Bearer header
2. Decode token to check issuer and kid
3. If fake token (kid === 'fake-key-id'):
   - Verify token structure
   - Check expiration
   - Validate required fields (oid)
4. If real B2C token:
   - Get signing key from JWKS
   - Verify signature
   - Check issuer and audience
5. Add verified payload to ctx.state.user
```

## Environment Setup

### Required Azure AD Configuration

```bash
# Azure AD App Registration
1. Go to Azure Portal > Azure Active Directory > App registrations
2. Create new registration or use existing
3. Copy Application (client) ID → AZURE_CLIENT_ID
4. Copy Directory (tenant) ID → AZURE_TENANT_ID
5. Certificates & secrets > New client secret → AZURE_CLIENT_SECRET
6. API permissions > Add Microsoft Graph > User.Read.All
7. Grant admin consent
```

### Environment Variables

```bash
# .env file
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id
```

## Database Setup

### 1. Run Migration

```bash
psql -d crchub -f database/migrations/003_add_password_active_to_person.sql
```

### 2. Set User Password

```bash
# Build the project
npm run build

# Set password for user
npm run set-password user@example.com MyPassword123
```

Or directly:

```bash
node dist/scripts/set-user-password.js user@example.com MyPassword123
```

## Testing the Implementation

### 1. Install Dependencies

```bash
cd packages/server-crchub
npm install
```

### 2. Build the Project

```bash
npm run build
```

### 3. Set Up Database

```bash
# Run migration
psql -d crchub -f database/migrations/003_add_password_active_to_person.sql

# Verify user exists in person table
psql -d crchub -c "SELECT userid, email, name FROM person WHERE email = 'user@example.com';"

# Set password
npm run set-password user@example.com TestPassword123
```

### 4. Start Server

```bash
npm run start:local
```

### 5. Test Authentication

```bash
# Test login
curl -X POST http://localhost:8080/signIn \
  -H "Content-Type: application/json" \
  -d '{"username": "user@example.com", "password": "TestPassword123"}'

# Expected response:
{
  "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImZha2Uta2V5LWlkIiwidHlwIjoiSldUIn0...",
  "oid": "user-object-id",
  "username": "user@example.com"
}
```

### 6. Test Authenticated Request

```bash
# Use the token from login response
curl http://localhost:8080/getStudies?uid=<oid> \
  -H "Authorization: Bearer <token>"
```

## Migration Path to Azure Entra External ID

When ready to migrate to real Azure Entra External ID:

### Phase 1: Preparation
- [ ] Set up Azure Entra External ID tenant
- [ ] Configure user flows and policies
- [ ] Test with a subset of users

### Phase 2: Code Changes
- [ ] Update `/signIn` endpoint to use Azure Entra External ID SDK
- [ ] Remove fake token generation logic
- [ ] Update client to use MSAL browser for authentication
- [ ] Remove password-based authentication

### Phase 3: Database Cleanup
- [ ] Remove `password_hash` column from person table
- [ ] Update documentation

### Phase 4: Middleware Update
- [ ] Remove fake token verification logic from middleware
- [ ] Keep real B2C/Entra token verification
- [ ] Update JWKS URI to Entra External ID

## Security Considerations

### Current Implementation

✅ **Secure:**
- Passwords hashed with bcrypt (10 rounds)
- Azure AD validation for usernames
- Active flag for access control
- Rate limiting on login endpoint

⚠️ **Development Only:**
- Tokens have fake signatures (not cryptographically secure)
- Password storage in database (should be removed for production)

### Future (Azure Entra External ID)

✅ **Production Ready:**
- No password storage
- Cryptographically signed tokens
- Azure-managed authentication
- MFA support
- Password reset flows

## Troubleshooting

### Common Issues

1. **"User not found in Azure AD"**
   - Verify user exists in Azure AD tenant
   - Check email address is correct
   - Ensure app has User.Read.All permission

2. **"User not found in database"**
   - Check person table has user with correct OID
   - Verify `userid` field matches Azure AD OID

3. **"Invalid password"**
   - Try setting password again
   - Check no typos in password

4. **"User account is inactive"**
   - Update: `UPDATE person SET active = true WHERE email = 'user@example.com';`

5. **"Token expired"**
   - Tokens expire after 12 hours
   - User needs to log in again

## Additional Notes

### Middleware Compatibility

The existing `auth-middleware.ts` was designed to handle both fake and real tokens:

```typescript
// Detects token type automatically
const isFakeToken = decodedToken?.payload?.iss?.includes('fake-auth.local') || 
                   decodedToken?.header?.kid === 'fake-key-id';

if (isFakeToken) {
  verified = verifyFakeToken(token);
} else {
  verified = verifyRealB2CToken(token);
}
```

This means you can:
- Test with fake tokens locally
- Use real B2C tokens in production
- Switch between them without code changes
- Mix fake and real tokens during migration

### Token Storage

Tokens are stored in sessionStorage:
- `authToken`: The JWT token
- `auth`: Boolean flag
- `oid`: User's Azure AD Object ID
- `user`: User object with details

This means:
- Tokens persist during browser session
- Cleared when browser closes
- Not accessible to other tabs/windows
- Secure from XSS if properly sanitized

## Summary

✅ **Completed:**
- Database schema updated with password and active fields
- Server-side authentication service with MSAL integration
- Fake JWT token generation
- Middleware token validation (fake and real)
- Client-side token storage and management
- Password hashing utilities
- Comprehensive documentation
- Setup scripts

🎯 **Ready for:**
- Development and testing
- User onboarding with temporary passwords
- Future migration to Azure Entra External ID

📚 **Documentation:**
- `AUTH_SETUP.md`: Setup and usage guide
- `IMPLEMENTATION_SUMMARY.md`: This file
- Inline code comments
- API documentation in setup guide

