-- Migration: Add schedule and availability columns to patient table
-- schedule: stores the computed schedule projection for each patient
-- availability: stores patient unavailable dates

ALTER TABLE patient ADD COLUMN IF NOT EXISTS schedule JSONB;
ALTER TABLE patient ADD COLUMN IF NOT EXISTS availability JSONB;

-- Add availability column to org_persons for staff availability
ALTER TABLE org_persons ADD COLUMN IF NOT EXISTS availability JSONB;

-- Add comment explaining the patient.schedule column structure
COMMENT ON COLUMN patient.schedule IS 'Patient schedule projection data stored as JSON. Structure:
{
    "referenceDate": "YYYY-MM-DD",
    "days": [
        {
            "day": 0,
            "date": "YYYY-MM-DD",
            "events": [
                {
                    "id": "prescreen-1",
                    "type": "actual-event",
                    "name": "Prescreen",
                    "actualDay": 0,
                    "scheduledDay": 0,
                    "status": "completed",
                    "state": "on-scheduled-date",
                    "window": { "daysBefore": 0, "daysAfter": 0 }
                }
            ]
        }
    ]
}';

-- Add comment explaining the patient.availability column structure
COMMENT ON COLUMN patient.availability IS 'Patient availability data stored as JSON. Structure:
{
    "unavailable": ["YYYY-MM-DD", "YYYY-MM-DD", ...]
}';

-- Add comment explaining the org_persons.availability column structure
COMMENT ON COLUMN org_persons.availability IS 'Staff availability data stored as JSON. Structure:
{
    "unavailable": ["YYYY-MM-DD", "YYYY-MM-DD", ...]
}';
