# Quick Start Guide - Authentication Setup

## TL;DR

New authentication system implemented that:
1. Validates usernames against Azure AD
2. Stores passwords temporarily in database
3. Generates fake JWT tokens
4. Works with existing middleware
5. Ready for future Azure Entra External ID migration

## Next Steps (5 minutes)

### 1. Install Dependencies

```bash
cd packages/server-crchub
npm install
```

### 2. Add Environment Variables

Create/update your `.env` file with Azure AD credentials:

```bash
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id
```

See `.env.example` for full template.

### 3. Run Database Migration

```bash
psql -d crchub -f database/migrations/003_add_password_active_to_person.sql
```

### 4. Build the Server

```bash
npm run build
```

### 5. Set a Test User Password

```bash
# Make sure the user exists in both Azure AD and the person table
# Make sure PostgreSQL is running and .env is configured
./set-password.sh user@example.com TestPassword123
```

### 6. Start the Server

```bash
npm run start:local
```

### 7. Test Login

Open your webapp and log in with the username and password you just set!

## What Changed?

### New Files
- ✅ `src/service/auth-service.ts` - Authentication logic with MSAL
- ✅ `src/server/auth-handler.ts` - Updated with new auth flow
- ✅ `src/server/routes.ts` - Added AD lookup endpoints
- ✅ `scripts/set-user-password.ts` - Password management utility
- ✅ `database/migrations/003_add_password_active_to_person.sql` - Schema changes
- ✅ `.env.example` - Environment variable template

### Updated Files
- ✅ `packages/webapp-crchub/src/services/security/auth.ts` - Token storage
- ✅ `package.json` - New dependencies and scripts

### Documentation
- 📚 `AUTH_SETUP.md` - Detailed setup guide
- 📚 `IMPLEMENTATION_SUMMARY.md` - Technical documentation
- 📚 `QUICK_START.md` - This file

## Authentication Flow

```
User Login (webapp)
  ↓
POST /signIn {username, password}
  ↓
Validate username in Azure AD (MSAL)
  ↓
Get OID from Azure AD
  ↓
Check database (person table)
  ↓
Verify password hash (bcrypt)
  ↓
Check active flag
  ↓
Generate fake JWT token
  ↓
Return token to client
  ↓
Client stores token
  ↓
All requests include: Authorization: Bearer <token>
  ↓
Middleware validates token
```

## Getting Azure AD Credentials

1. Go to [Azure Portal](https://portal.azure.com)
2. Azure Active Directory → App registrations
3. Create new or select existing
4. Copy **Application (client) ID** → `AZURE_CLIENT_ID`
5. Copy **Directory (tenant) ID** → `AZURE_TENANT_ID`
6. Certificates & secrets → New client secret → Copy value → `AZURE_CLIENT_SECRET`
7. API permissions → Add → Microsoft Graph → Application permissions → `User.Read.All`
8. Grant admin consent ✓

## Verification Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file has Azure AD credentials
- [ ] Database migration applied
- [ ] Project built (`npm run build`)
- [ ] Test user has password set
- [ ] Test user is active in database
- [ ] Server starts without errors
- [ ] Can log in through webapp
- [ ] Token is stored in sessionStorage
- [ ] Authenticated requests work

## Common Commands

```bash
# Install dependencies
npm install

# Build project
npm run build

# Start server (local)
npm run start:local

# Set user password
npm run set-password user@email.com password123

# Run database migration
psql -d crchub -f database/migrations/003_add_password_active_to_person.sql

# Check user in database
psql -d crchub -c "SELECT oid, email, name, active, password_hash IS NOT NULL as has_password FROM person WHERE email = 'user@example.com';"

# Activate user
psql -d crchub -c "UPDATE person SET active = true WHERE email = 'user@example.com';"
```

## Troubleshooting

### "User not found in Azure AD"
→ User must exist in your Azure AD tenant with the email you're using

### "User not found in database"
→ User must exist in person table with oid = Azure AD OID

### "Invalid password"
→ Run `npm run set-password` again to reset

### "User account is inactive"
→ Run: `UPDATE person SET active = true WHERE email = 'user@email.com';`

### "Token expired"
→ Tokens last 12 hours, log in again

## Need Help?

- **Setup Guide**: See `AUTH_SETUP.md`
- **Technical Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Environment Variables**: See `.env.example`

## Migration to Azure Entra External ID

When ready to switch to real Azure Entra External ID:

1. Set up Azure Entra External ID tenant
2. Update `/signIn` endpoint to use Entra authentication
3. Remove fake token generation
4. Remove `password_hash` column from database
5. Update client to use MSAL browser library

The middleware already supports both fake and real tokens, so the transition will be smooth!

## What Gets Deleted Later

These are temporary for development:

- ❌ `password_hash` column (removed when switching to Entra)
- ❌ Fake token generation logic
- ❌ Password management script
- ❌ Fake token verification in middleware

Everything else stays! The authentication flow, middleware, and token validation logic will work with real Azure tokens.

