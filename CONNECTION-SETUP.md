# CRCHub Connection Setup Guide

This document describes how the `webapp-islr` and `server-islr` packages connect to each other.

## Overview

The CRCHub project consists of two main components:
- **webapp-islr**: The frontend web application (SvelteKit + Vite)
- **server-islr**: The backend server (Koa.js)

## Connection Configuration

### Server (server-islr)

**Location**: `/packages/server-islr/src/config/environments.ts`

The server runs on different configurations based on the environment:

| Environment | Server URL | Port | Storage | CORS Origins |
|------------|-----------|------|---------|--------------|
| `local` | `http://localhost:8080` | 8080 | local | `http://localhost:5173`, `http://localhost:8004`, `http://127.0.0.1:8004`, `http://127.0.0.1:8000`, `http://localhost:8000` |
| `development` | `https://crchub-server.azurewebsites.net` | 8080 | azure | `https://crchub-webapp.azurewebsites.net`, `http://localhost:8004`, `http://127.0.0.1:8004` |
| `staging` | `https://crchub-server.azurewebsites.net` | 8080 | azure | Same as development |
| `production` | `https://crchub-server.azurewebsites.net` | 8080 | azure | Same as development |

**Key Configuration Points:**
- Server listens on port `8080` in all environments
- CORS is configured to allow requests from the webapp origins
- Storage can be `local` (file system) or `azure` (cloud storage)
- In local mode, the server automatically kills any process using port 8080 before starting

### Webapp (webapp-islr)

**Location**: `/packages/webapp-islr/src/config/environments.ts`

The webapp connects to different server URLs based on the environment:

| Environment | Server URL | Timeout |
|------------|-----------|---------|
| `local` | `http://localhost:8080` | 2000ms |
| `development` | `https://crchub-server.azurewebsites.net` | 5000ms |
| `staging` | `https://crchub-server.azurewebsites.net` | 5000ms |
| `production` | `https://crchub-server.azurewebsites.net` | 5000ms |

**Key Configuration Points:**
- In dev mode (Vite), the webapp runs on port `5173` by default
- In production build, it runs on port `8004` (using `sirv`)
- Environment is set via `VITE_AZURE_ENVIRONMENT` environment variable
- Defaults to `local` if not specified

## API Endpoints

The webapp calls the following server endpoints:

### Authentication
- `POST /signIn` - User sign in (rate-limited)
- `POST /signOut` - User sign out

### Study Management
- `GET /getStudies?uid={userId}` - Get all studies for a user
- `GET /getStudy?id={studyId}&uid={userId}` - Get a specific study
- `POST /addStudy?uid={userId}` - Add a new study
- `PUT /updateStudy?id={studyId}&uid={userId}` - Update a study
- `DELETE /deleteStudy?id={studyId}&uid={userId}` - Delete a study

### User Management
- `GET /getUser?id={userId}` - Get user by ID
- `GET /getUserByEmail?email={email}` - Get user by email
- `GET /getUsers` - Get all users

### Patient Management
- `GET /getPatients?uid={userId}` - Get all patients for a user
- `GET /getPatient?id={patientId}&uid={userId}` - Get a specific patient
- `GET /getStudyPatients?id={studyId}&uid={userId}` - Get patients for a study
- `POST /addPatient?uid={userId}` - Add a new patient
- `PUT /updatePatient?id={patientId}&uid={userId}` - Update a patient
- `DELETE /deletePatient?id={patientId}&uid={userId}` - Delete a patient

### Model Management
- `GET /getModelList` - Get list of models
- `GET /getModelUnit?model={modelName}&unit={unitName}` - Get a model unit
- `GET /getModelUnitList?model={modelName}` - Get list of units for a model
- `PUT /saveModelUnit?model={modelName}&unit={unitName}` - Save a model unit
- `GET /deleteModel?model={modelName}` - Delete a model
- `GET /deleteModelUnit?model={modelName}&unit={unitName}` - Delete a model unit

## Running Locally

### 1. Start the Server

```bash
cd /home/jonwd/projects/CRCHub/packages/server-islr

# First, build the server
npm run build

# Then start the server in local mode
npm run start:local
# or simply
npm start
```

The server will:
- Kill any existing process on port 8080
- Start listening on `http://localhost:8080`
- Use local file storage (in the `datastore` directory)
- Allow CORS from localhost:5173 and localhost:8004

### 2. Start the Webapp

In a separate terminal:

```bash
cd /home/jonwd/projects/CRCHub/packages/webapp-islr

# Development mode (Vite dev server on port 5173)
npm run dev

# OR build and preview (on port 8004)
npm run build
npm run preview
```

The webapp will:
- Connect to `http://localhost:8080` (server)
- Make API calls to the server endpoints
- Handle authentication and data management

## Environment Variables

### Server (server-islr)

Set via environment variables or `.env` file in the project root:

- `AZURE_ENVIRONMENT` - Environment name (`local`, `development`, `staging`, `production`)
- `AZURE_STORAGE_CONNECTION_STRING` - Azure storage connection string (for cloud storage)
- `AZURE_STORAGE_SHARE_NAME` - Azure file share name
- `AD_B2C_TENANT` - Azure AD B2C tenant
- `AD_B2C_CLIENT_ID` - Azure AD B2C client ID

Example:
```bash
export AZURE_ENVIRONMENT=local
npm start
```

### Webapp (webapp-islr)

Set via environment variables:

- `VITE_AZURE_ENVIRONMENT` - Environment name (defaults to `local`)

Example:
```bash
export VITE_AZURE_ENVIRONMENT=local
npm run dev
```

## Build Commands

### Server
```bash
npm run build          # Compile TypeScript
npm run build-dev      # Development build
npm run build-verbose  # Verbose build output
```

### Webapp
```bash
npm run build   # Build for production
npm run dev     # Start development server
npm run preview # Preview production build
```

## Verification

To verify the connection is working:

1. Start the server (should see: "Server now listening on port 8080")
2. Start the webapp
3. Open the webapp in your browser (`http://localhost:5173` or `http://localhost:8004`)
4. Check the browser console for any connection errors
5. Try logging in or accessing data - API calls should succeed

## CORS Configuration

The server's CORS middleware allows:
- **Origins**: Configured per environment (see table above)
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization
- **Credentials**: true (allows cookies/auth headers)

If you get CORS errors, verify:
1. The webapp is running on an allowed origin
2. The server environment matches your setup
3. Both services are using the correct protocol (http/https)

## Troubleshooting

### Connection Refused
- Ensure the server is running on port 8080
- Check if another process is using port 8080: `lsof -i :8080`
- Verify firewall settings

### CORS Errors
- Check the webapp URL matches the server's CORS configuration
- Ensure credentials are being sent with requests
- Verify the server environment is correct

### API Errors
- Check server logs for error messages
- Verify the API endpoint URL is correct
- Ensure authentication tokens are valid
- Check that the data format matches expected schemas

## Status

✅ Both packages build successfully
✅ Server configuration verified (port 8080)
✅ CORS properly configured for local development
✅ Webapp environment configuration set correctly
✅ API endpoints match between client and server

Last verified: October 23, 2025

