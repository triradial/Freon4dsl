# Study Loader Utility

A utility to load test studies from the `modelstore` directory into the database, using the same API endpoints that the UI uses.

## Overview

This utility reads study configuration files from `modelstore/` and creates studies in the database via the `/addStudyWithSite` API endpoint, exactly as the UI does when creating a new study.

## Prerequisites

1. **Database**: PostgreSQL database must be running and accessible
2. **Server**: The CRCHub server must be running (default: `http://localhost:8080`)
3. **User**: You must have a valid Azure OID for a user that exists in the database
4. **Node.js**: TypeScript and ts-node must be available

## Installation

No installation needed - the script uses the existing project dependencies.

## Usage

### Basic Usage

Load all studies from modelstore:

```bash
cd packages/languages/study-configuration/src/custom/__tests__
node --loader ts-node/esm load-studies-to-db.ts --user-oid <your-azure-oid>
```

### Load a Specific Study

```bash
cd packages/languages/study-configuration/src/custom/__tests__
node --loader ts-node/esm load-studies-to-db.ts --user-oid ef70e49b-4715-4e4d-998e-51a569fcf7aa --study TwoP3V
```

### Dry Run (Preview Only)

See what would be loaded without actually saving:

```bash
cd packages/languages/study-configuration/src/custom/__tests__
node --loader ts-node/esm load-studies-to-db.ts --user-oid <your-azure-oid> --dry-run
```

### Custom Server URL

If your server is running on a different URL:

```bash
cd packages/languages/study-configuration/src/custom/__tests__
node --loader ts-node/esm load-studies-to-db.ts --user-oid <your-azure-oid> --server-url http://localhost:4000
```

### Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `--user-oid <oid>` | User's Azure OID | Yes | - |
| `--study <name>` | Load specific study only | No | All studies |
| `--server-url <url>` | Server URL | No | `http://localhost:8080` |
| `--dry-run` | Preview without saving | No | `false` |
| `--help`, `-h` | Show help message | No | - |

## How It Works

### 1. Study Discovery

The utility scans the `modelstore/` directory for study folders. Each folder should contain:

- `StudyConfiguration.json` or `StudyConfigurationPublic.json` (required)
- `PatientInfo.json` or `PatientInfoPublic.json` (optional)
- `Availability.json` or `AvailabilityPublic.json` (optional)
- `PatientHistoryUnit.json` (optional)

The utility prefers "Public" versions if both exist.

### 2. Study Metadata Extraction

The utility creates a basic `Study` object from the study name:

```typescript
{
    name: "ScheduleExample1",
    title: "Schedule Example 1",
    phase: "Phase 3",
    status: "Active",
    therapeuticArea: "Oncology",
    siteNumber: "001"
}
```

### 3. API Call

The study is saved via:

```http
POST /addStudyWithSite?uid=<user-oid>
Content-Type: application/json

{
    "name": "ScheduleExample1",
    "title": "Schedule Example 1",
    "phase": "Phase 3",
    "status": "Active",
    "therapeutic_area": "Oncology",
    "siteNumber": "001"
}
```

This creates:
- Study record in the database
- Default protocol and protocol version
- Site associated with the user's organization
- User added to the site

### 4. Database Operations

The server performs these operations (matching the UI flow):

```sql
BEGIN;
  INSERT INTO study (...) VALUES (...);
  INSERT INTO protocol (...) VALUES (...);
  INSERT INTO protocol_version (...) VALUES (...);
  INSERT INTO site (...) VALUES (...);
  INSERT INTO site_persons (...) VALUES (...);
COMMIT;
```

## Output

The utility provides detailed output:

```
Study Loader Utility
====================
User OID: abc123
Server URL: http://localhost:8080
Dry Run: No
Modelstore: /path/to/modelstore
Loading all studies...
Found 14 studies in modelstore

Processing ScheduleExample1...
  Found files:
    - StudyConfiguration: StudyConfigurationPublic.json
    - PatientInfo: PatientInfoPublic.json
    - Availability: AvailabilityPublic.json
  Study metadata:
    - Name: ScheduleExample1
    - Title: Schedule Example 1
    - Phase: Phase 3
    - Status: Active
    - Site Number: 001
  Saving ScheduleExample1 to http://localhost:8080/addStudyWithSite...
  ✓ Successfully saved ScheduleExample1 (ID: abc-123-def)
  Uploading model files...
    ✓ Uploaded Availability
    ✓ Uploaded PatientInfo
    ✓ Uploaded StudyConfiguration
  ✓ All model files uploaded successfully

[... more studies ...]

====================
Summary:
  ✓ Success: 12
  ✗ Failed: 2
  Total: 14
```

## Model File Upload

### What Gets Uploaded

The utility uploads DSL model files to the database, matching the UI's behavior:

1. **Availability** - Uploaded from `Availability.json` or `AvailabilityPublic.json` if present, otherwise creates an empty unit
2. **PatientInfo** - Uploaded from `PatientInfo.json` or `PatientInfoPublic.json` if present, otherwise creates an empty unit
3. **StudyConfiguration** - Uploaded from `StudyConfiguration.json` or `StudyConfigurationPublic.json` (required)

The utility uses the same LionWeb JSON format that the files are already stored in, and calls the same `/saveModelUnit` API endpoint that the UI uses.

### Upload Process

For each study, the utility:

1. Creates the study record via `/addStudyWithSite` (returns study ID)
2. Uploads Availability model unit via `PUT /saveModelUnit?model={studyId}&unit=Availability`
3. Uploads PatientInfo model unit via `PUT /saveModelUnit?model={studyId}&unit=PatientInfo`
4. Uploads StudyConfiguration model unit via `PUT /saveModelUnit?model={studyId}&unit=StudyConfiguration`

This matches exactly what the UI does when creating a new study.

## Example Complete Workflow

```bash
# 1. Ensure server is running
cd packages/server-crchub
npm start

# 2. Get your user OID from the database
psql your_database -c "SELECT azure_oid FROM person WHERE email='your@email.com';"

# 3. Preview what will be loaded (dry run)
cd packages/languages/study-configuration/src/custom/__tests__
node --loader ts-node/esm load-studies-to-db.ts --user-oid <your-oid> --dry-run

# 4. Load a single study first (test)
node --loader ts-node/esm load-studies-to-db.ts --user-oid <your-oid> --study TwoP3V

# 5. Load all studies
node --loader ts-node/esm load-studies-to-db.ts --user-oid <your-oid>
```

## Troubleshooting

### Error: "User not found"

The user OID doesn't exist in the database. Check the `person` table:

```sql
SELECT person_id, azure_oid, email FROM person;
```

### Error: "Organization not found"

The user is not associated with an organization. Check `org_persons`:

```sql
SELECT * FROM org_persons WHERE person_id = '<person-id>';
```

### Error: "Connection refused"

The server is not running. Start it:

```bash
cd packages/server-crchub
npm start
```

### Error: "Database connection failed"

Check your database environment variables in `packages/server-crchub/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crchub
DB_USER=postgres
DB_PASSWORD=your-password
```

## Related Files

- **API Routes**: `packages/server-crchub/src/server/routes.ts`
- **Data Handler**: `packages/server-crchub/src/server/data-handler.ts`
- **Study Service**: `packages/server-crchub/src/service/study-service.ts`
- **Database Connection**: `packages/server-crchub/src/service/db-connection.ts`
- **Client Store**: `packages/webapp-crchub/src/services/data/data-store.ts`
- **Model Manager**: `packages/webapp-crchub/src/services/dsl/model-manager.ts`

## Contributing

To extend this utility:

1. Parse StudyConfiguration.json to extract real metadata
2. Add DSL model file upload support
3. Add validation before saving
4. Add rollback capability for failed loads
5. Add support for updating existing studies

## License

Same as the parent project.
