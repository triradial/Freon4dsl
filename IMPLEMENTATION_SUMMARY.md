# Staff Unavailability Feature Implementation

## Overview
Implemented a dual-storage system for staff availability:
1. **Individual Tracking**: Each person's unavailable dates stored in `org_persons.org_person_attributes` JSONB column
2. **Aggregated Model**: Availability model (staff levels by date range) calculated from individual unavailability and stored in `organization.staff_availability` JSONB column

Both are saved automatically when calendar dates change.

## Changes Made

### 1. Database Migration
**File:** `packages/server-crchub/database/migrations/006_add_org_person_attributes.sql`
- Added `org_person_attributes` JSONB column to `org_persons` table
- Created GIN index for efficient querying of unavailable dates
- Format: `{"unavailable": ["2025-12-20", "2025-12-21", ...]}`

### 2. Backend API

#### Service Layer (`packages/server-crchub/src/service/person-service.ts`)
- `getPersonUnavailableDates(oid, personId, orgId)` - Retrieves unavailable dates array
- `setPersonUnavailableDates(oid, personId, orgId, unavailableDates)` - Saves unavailable dates array

#### Data Handler (`packages/server-crchub/src/server/data-handler.ts`)
- `getPersonUnavailableDates()` - HTTP handler for GET requests
- `setPersonUnavailableDates()` - HTTP handler for POST requests

#### Routes (`packages/server-crchub/src/server/routes.ts`)
- `GET /getPersonUnavailableDates?oid=...&personId=...&orgId=...`
- `POST /setPersonUnavailableDates?oid=...&personId=...&orgId=...`
  - Body: `{"unavailable": ["2025-12-20", "2025-12-21", ...]}`

### 3. Frontend

#### Data Store (`packages/webapp-crchub/src/services/data/data-store.ts`)
- `getPersonUnavailableDates(personId, orgId)` - Fetches dates from backend
- `setPersonUnavailableDates(personId, orgId, unavailableDates)` - Saves dates to backend

#### Facility Component (`packages/webapp-crchub/src/content/Facility.svelte`)
- **Load**: Fetches unavailable dates for each staff member on mount
- **Save**: Debounced save (1 second) when dates change
- **Format Conversion**: Converts between DateRange[] (UI) and string[] (API)
  - UI uses: `{startDate: "2025-12-20", endDate: "2025-12-20"}`
  - API uses: `["2025-12-20", "2025-12-21", ...]`
- Expands date ranges into individual dates before saving

#### Calendar Component (`packages/webapp-crchub/src/components/content/facility/AvailabilityCalendar.svelte`)
- **Visual Feedback**: Added `calendarKey` state to force re-render on date changes
- **Styling**: Enhanced unavailable date visibility with explicit colors
  - Background: `#fee` (light red)
  - Text: `#c00` (dark red)
  - Border: `#fcc` (medium red)
  - Font weight: 600 (bold)
- **Compact Layout**: Reduced spacing and sizes to fit calendar in container
  - Cell min-height: 45px (removed aspect-ratio: 1)
  - Reduced padding and gaps throughout
  - Smaller font sizes

### 4. Visual Improvements
- Calendar cells now have fixed height instead of square aspect ratio
- Unavailable dates are clearly visible with red/pink styling
- Calendar fits properly in container without overflow
- Staff members panel width increased from 400px to 500px
- Calendar uses remaining space efficiently

## Data Flow

### Loading Unavailable Dates
1. User opens Facility page
2. `Facility.svelte` loads organization staff
3. For each staff member, calls `dataStore.getPersonUnavailableDates(personId, orgId)`
4. Backend queries `org_persons.org_person_attributes->>'unavailable'`
5. Returns array of date strings: `["2025-12-20", "2025-12-21", ...]`
6. Frontend converts to DateRange format for calendar display

### Saving Unavailable Dates (Dual Save)
1. User clicks/drags on calendar to mark dates unavailable
2. `AvailabilityCalendar.svelte` calls `onDatesChanged(personId, dates)`
3. `Facility.svelte` triggers debounced save (1 second delay)
4. **Step 1 - Individual Save**:
   - Converts DateRange[] to individual date strings
   - Calls `dataStore.setPersonUnavailableDates(personId, orgId, dates)`
   - Backend updates `org_person_attributes` JSONB column
5. **Step 2 - Aggregate Model Save**:
   - Calculates staff availability model from all staff unavailability
   - Uses `convertToModel(totalStaff, staffAvailArray)` to aggregate
   - Saves to `organization.staff_availability` via `/saveModelUnit` endpoint
6. Calendar re-renders to show visual feedback immediately

## Migration Instructions

### To Apply Database Migration:
```bash
cd packages/server-crchub
psql -d crchub -f database/migrations/006_add_org_person_attributes.sql
```

Or from psql:
```sql
\i database/migrations/006_add_org_person_attributes.sql
```

## Testing

1. **Load Test**: Open Facility page, select a staff member - should see any previously saved unavailable dates highlighted in red
2. **Save Test**: Click on calendar dates to mark them unavailable - should see immediate visual feedback and save confirmation after 1 second
3. **Range Test**: Click and drag to select multiple dates - should mark entire range as unavailable
4. **Toggle Test**: Click on already-unavailable dates to make them available again
5. **Persistence Test**: Refresh page - unavailable dates should persist

## Architecture Notes

### Two-Level Storage
1. **`org_person_attributes.unavailable`** (Individual Level)
   - Array of date strings per person: `["2025-12-20", "2025-12-21", ...]`
   - Stored in `org_persons` table
   - Used for tracking which specific staff members are unavailable

2. **`organization.staff_availability`** (Aggregate Level)
   - Availability model with staff levels by date range
   - Calculated from all individual staff unavailability
   - Used by scheduling/simulation system to know total available staff

### Implementation Details
- Dates stored in ISO 8601 format: `YYYY-MM-DD`
- Date ranges in UI expanded to individual dates before saving
- Debounced save prevents excessive API calls during drag operations
- Calendar key forces re-render for immediate visual feedback
- Access control: Only users with access to the person can view/modify their unavailable dates
- Both individual and aggregate data saved on every change (dual save)

