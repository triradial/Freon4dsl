# Service Layer

This folder contains the database service layer that provides SQL access to the PostgreSQL database and returns JSON structures similar to GraphQL responses.

## Structure

- **db-connection.ts**: Database connection pool management using `pg` (node-postgres)
- **study-service.ts**: CRUD operations for studies
- **patient-service.ts**: CRUD operations for patients
- **user-service.ts**: CRUD operations for users/staff
- **model-service.ts**: Operations for model data (StudyConfiguration, Availability, PatientInfo)

## Data Storage Locations

Based on the database schema:

- **StudyConfiguration**: Stored in `site_protocol_versions.study_configuration` (JSONB)
- **Availability**: Stored in `organization.staff_availability` (JSONB)
- **PatientInfo**: Stored in `site.patient_availability_and_history` (JSONB)

## Environment Variables

The database connection uses the following environment variables (set in `.env` for local development, or Azure environment variables for production):

- `DATABASE_URL`: Full PostgreSQL connection string (optional)
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `DB_NAME`: Database name (default: crchub)
- `DB_USER`: Database user (default: postgres)
- `DB_PASSWORD`: Database password
- `DB_SSL`: Enable SSL (default: false)

## Usage

Services are imported and used by the handlers in `src/server/`:

```typescript
import * as studyService from '../service/study-service.js';

const studies = await studyService.getStudies(uid);
```

