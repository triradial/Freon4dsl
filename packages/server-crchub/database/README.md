# Clinical Trial Management Database Schema

This directory contains the PostgreSQL database schema for the Clinical Trial Management system.

## Files

- **schema.sql** - Main database schema with all tables, indexes, constraints, functions, and triggers
- **seed_data.sql** - Initial seed data for lookup tables
- **README.md** - This file

## Setup Instructions

1. **Create the database** (if not already created):
   ```sql
   CREATE DATABASE crchub;
   ```

2. **Run the schema file**:
   ```bash
   psql -d crchub -f schema.sql
   ```
   Or from psql:
   ```sql
   \i schema.sql
   ```

3. **Load seed data** (optional, but recommended):
   ```bash
   psql -d crchub -f seed_data.sql
   ```
   Or from psql:
   ```sql
   \i seed_data.sql
   ```

## Schema Overview

The schema is designed to:
- Map the current JSON file structure to normalized database tables
- Store JSON files (StudyConfiguration.json, Availability.json, PatientInfo.json) as JSONB columns
- Support growth into the full ERD model structure
- Handle facility isolation, protocol versions, and affiliations

### Key Tables

- **organization** - Facilities (stores staff_availability JSONB). Can be designated as a domain with is_domain flag.
- **study** - Studies from studies.json
- **protocol** - One protocol per study
- **protocol_version** - Protocol amendments/versions
- **site** - Intersection of facility + study (stores patient_availability_and_history JSONB)
- **site_protocol_versions** - Links site to protocol version (stores study_configuration JSONB)
- **patient** - Patient records from patients.json
- **person** - Users from users.json. Can have userid for login capability.
- **org_persons** - Links persons to organizations. Roles are added through org_person_roles.
- **org_person_roles** - Links org_persons to roles with temporal validity. Persons can have multiple roles at one organization. Domain admins are designated here via is_domain_admin flag.
- **site_persons** - Links persons to sites with one of their organizational roles (references org_person_roles)

### JSONB Storage

The following JSON files are stored as JSONB columns:
- `organization.staff_availability` - Stores Availability.json (CRC availability across studies/sites)
- `site.patient_availability_and_history` - Stores PatientInfo.json (patient availability and event completion dates)
- `site_protocol_versions.study_configuration` - Stores StudyConfiguration.json (site study configuration tied to protocol version)

## User Management

The system supports three privilege levels:

1. **Global Admins** - Identified via GLOBAL_ADMIN_UIDS environment variable. Have access to all data across all domains.
2. **Domain Admins** - Flagged in org_person_roles table with is_domain_admin=true. Manage users and data within their domain organization.
3. **Regular Users** - Have userid in person table. Access is determined by their org_persons relationships.

### Person-Organization Relationship

- A person is linked to organizations through the `org_persons` table
- Roles are assigned through `org_person_roles` which links org_persons to person_role
- A person can have multiple roles at one organization (multiple org_person_roles rows for the same org_person_id)
- Organizations can be designated as domains (is_domain=true) for data isolation
- When an organization participates in a study, it becomes a Site
- Site persons reference one of their org_person_roles for that specific study

## Migrations

Database migrations are stored in the `migrations/` directory:
- **001_add_user_management.sql** - Adds org_persons and org_person_roles tables, is_domain flag, removes old person_roles table, and updates site_persons FK
- **002_add_is_domain_to_organization.sql** - Idempotent script to add is_domain column if missing
- **QUICK_FIX_add_is_domain.sql** - Quick fix for adding is_domain column

## Features

- **Automatic Timestamps**: All tables have `created_at` and `updated_at` columns with automatic triggers
- **Default Protocol Versions**: When a protocol is created, a default "v1" protocol version is automatically created
- **Comprehensive Indexing**: Indexes on all foreign keys and frequently queried columns
- **JSONB Indexes**: GIN indexes on JSONB columns for efficient querying
- **Data Integrity**: Foreign key constraints, unique constraints, and check constraints ensure data integrity

## Notes

- All primary keys use UUID type
- The schema uses `gen_random_uuid()` which is built-in in PostgreSQL 13+ (no extension required)
- For PostgreSQL < 13, you may need to enable the `pgcrypto` extension before running the schema
- The schema supports the current data model while allowing growth into the full ERD structure
- Facility isolation is maintained through the organization and site structure
- Protocol versions allow tracking of study configuration changes over time

