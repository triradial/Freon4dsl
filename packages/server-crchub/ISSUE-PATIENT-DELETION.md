# Issue: PatientInfo Data Not Removed When Patient is Deleted

## Problem Description

When a patient is deleted from the system, their `PatientHistory` data remains in the `PatientInfo` JSON stored in the database. This causes:

1. **Data Inconsistency**: The `patient` table no longer contains the deleted patient, but `site.patient_availability_and_history` (which stores the `PatientInfo` JSON) still contains their `PatientHistory` entry.

2. **UI Filtering Required**: The webapp currently works around this by filtering `PatientInfo.patientHistories` to only show entries where `patient_id` matches an existing patient record. However, this is a workaround, not a fix.

## Root Cause

The `deletePatient` function in `packages/server-crchub/src/service/patient-service.ts` (lines 393-440) only deletes the patient record from the `patient` table. It does **not** update the `PatientInfo` JSON stored in `site.patient_availability_and_history` to remove the corresponding `PatientHistory` entry.

## Current Implementation

**File**: `packages/server-crchub/src/service/patient-service.ts`
- Function: `deletePatient(oid: string, patientId: string)`
- Current behavior: Only deletes from `patient` table
- Missing: No cleanup of `PatientInfo` JSON

**File**: `packages/server-crchub/src/service/model-service.ts`
- Function: `savePatientInfo(studyId: string, patientInfo: any)` - exists and can be used to update PatientInfo
- Function: `getPatientInfo(studyId: string)` - exists and can be used to retrieve current PatientInfo

## Required Fix

When a patient is deleted, the system should:

1. **Get the patient's study ID** before deletion (or from the patient record)
2. **Retrieve the current PatientInfo** for that study using `getPatientInfo(studyId)`
3. **Convert PatientInfo JSON to a model unit** (using `FreLionwebSerializer.toTypeScriptInstance()`)
4. **Remove the PatientHistory** entry where `patient_id` matches the deleted patient's `patientNumber` or `id`
5. **Convert back to JSON** (using `FreLionwebSerializer.convertToJSON()`)
6. **Save the updated PatientInfo** using `savePatientInfo(studyId, updatedPatientInfo)`

## Implementation Location

**Primary Fix Location**: `packages/server-crchub/src/service/patient-service.ts`
- Function: `deletePatient(oid: string, patientId: string)`
- Add PatientInfo cleanup logic before or after the patient deletion

**Dependencies Needed**:
- Import `FreLionwebSerializer` from `@freon4dsl/core`
- Import `LanguageEnvironment` from `@freon4dsl/study-configuration` (to initialize the language environment)
- Import `getPatientInfo` and `savePatientInfo` from `../service/model-service.js`
- Import `runInAction` from `mobx` (for modifying observable arrays)

## Implementation Notes

1. **Get Study ID**: Need to query the patient's `studyId` before deletion. This can be done by:
   - Querying `patient` table with `patient_id` to get `site_id`
   - Joining with `site` and `study` tables to get `study_id`

2. **MobX Actions**: When modifying the `patientHistories` array in the model unit, wrap the modification in `runInAction()` to avoid MobX strict-mode warnings.

3. **Error Handling**: If PatientInfo update fails, consider:
   - Rolling back the patient deletion (transaction)
   - Logging the error but allowing deletion to proceed
   - Or failing the entire operation

4. **Edge Cases**:
   - Patient might not have a `PatientHistory` entry in PatientInfo
   - PatientInfo might not exist for the study yet
   - Multiple PatientHistory entries might match (shouldn't happen, but handle gracefully)

## Example Code Structure

```typescript
export async function deletePatient(oid: string, patientId: string): Promise<boolean> {
    const pool = getDbPool();
    
    // 1. Get patient info including studyId BEFORE deletion
    const patientInfo = await pool.query(
        `SELECT p.patient_id, p.patient_number, s.study_id
         FROM patient p
         JOIN site s ON p.site_id = s.site_id
         WHERE p.patient_id = $1`,
        [patientId]
    );
    
    if (patientInfo.rows.length === 0) {
        return false;
    }
    
    const patientNumber = patientInfo.rows[0].patient_number;
    const studyId = patientInfo.rows[0].study_id;
    
    // 2. Delete patient from database
    // ... existing deletion logic ...
    
    // 3. Clean up PatientInfo (if deletion succeeded)
    if (deleted) {
        try {
            await cleanupPatientInfo(studyId, patientNumber, patientId);
        } catch (error) {
            // Log error but don't fail the deletion
            console.error(`Failed to cleanup PatientInfo for deleted patient ${patientId}:`, error);
        }
    }
    
    return deleted;
}

async function cleanupPatientInfo(studyId: string, patientNumber: string, patientId: string): Promise<void> {
    // Get current PatientInfo
    const patientInfoJson = await getPatientInfo(studyId);
    if (!patientInfoJson) {
        return; // No PatientInfo to clean up
    }
    
    // Initialize language environment
    LanguageEnvironment.getInstance();
    
    // Convert JSON to model unit
    const serializer = new FreLionwebSerializer();
    const patientInfoUnit = serializer.toTypeScriptInstance(patientInfoJson, 'PatientInfo');
    
    // Remove PatientHistory for deleted patient
    if (patientInfoUnit && patientInfoUnit.patientHistories) {
        runInAction(() => {
            for (let i = patientInfoUnit.patientHistories.length - 1; i >= 0; i--) {
                const history = patientInfoUnit.patientHistories[i];
                if (history.patient_id === patientNumber || history.patient_id === patientId) {
                    patientInfoUnit.patientHistories.splice(i, 1);
                }
            }
        });
    }
    
    // Convert back to JSON and save
    const updatedJson = serializer.convertToJSON(patientInfoUnit);
    await savePatientInfo(studyId, updatedJson);
}
```

## Testing

After implementing the fix, verify:

1. Delete a patient that has a PatientHistory entry
2. Check that the PatientInfo JSON no longer contains that patient's PatientHistory
3. Verify the webapp still displays correctly (should show fewer/no filtered entries)
4. Test edge cases:
   - Patient with no PatientHistory entry
   - Patient in study with no PatientInfo yet
   - Multiple patients deleted in sequence

## Related Files

- `packages/server-crchub/src/service/patient-service.ts` - Main fix location
- `packages/server-crchub/src/service/model-service.ts` - Helper functions (`getPatientInfo`, `savePatientInfo`)
- `packages/webapp-crchub/src/content/Patient.svelte` - Currently filters PatientInfo (workaround, should still work after fix)
