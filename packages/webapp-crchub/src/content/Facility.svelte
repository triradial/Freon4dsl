<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import FacilityPeopleGrid from "../components/content/facility/FacilityPeopleGrid.svelte";
    import AvailabilityCalendar from "../components/content/facility/AvailabilityCalendar.svelte";
    import AvailabilityModelPanel from "../components/content/facility/AvailabilityModelPanel.svelte";
    import { ModelManager } from "../services/dsl/model-manager.js";
    import { dataStore } from "../services/data/data-store.js";
    import type { StaffAvailability, DateRange } from "../services/data/availability-service.js";
    import { convertToModel, convertFromModel } from "../services/data/availability-interpreter.js";
    import { env } from "../config/env.js";
    // @ts-ignore
    import { Save as IconSave, AlertCircle as IconAlertCircle } from '@lucide/svelte';

    let { studyId } = $props<{ studyId: string }>();

    let selectedPersonId = $state<string | null>(null);
    let selectedPersonName = $state<string | null>(null);
    let organizationPeople = $state<any[]>([]);
    let organizationName = $state<string>("");
    let organizationId = $state<string | null>(null);
    let organizationStartDate = $state<string | null>(null);
    let organizationEndDate = $state<string | null>(null);
    let staffAvailabilityData = $state<Map<string, StaffAvailability>>(new Map());
    let totalStaff = $state(0);
    let isLoading = $state(true);
    let isSaving = $state(false);
    let saveMessage = $state<string | null>(null);

    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    let modelPanelRefreshTrigger = $state(0);

    function handlePersonSelected(personId: string | null, personName: string | null) {
        selectedPersonId = personId;
        selectedPersonName = personName;
        console.log('[Facility] Person selected:', personId, personName);
    }

    async function loadFacilityData() {
        console.log('[Facility] loadFacilityData called, setting isLoading=true');
        isLoading = true;
        try {
            // Get the user's organization directly (not through site, since facility management is independent of studies)
            const organization = await dataStore.getUserOrganization();
            console.log('[Facility] User organization loaded:', organization);
            
            if (organization && organization.id) {
                organizationId = organization.id;
                organizationName = organization.name || "Unknown Organization";
                console.log('[Facility] Organization:', organizationName, 'ID:', organizationId);
                
                // Get organization start/end dates
                if (organization.startDate) {
                    organizationStartDate = typeof organization.startDate === 'string' ? organization.startDate.split('T')[0] : null;
                } else {
                    organizationStartDate = null;
                }
                
                if (organization.endDate) {
                    organizationEndDate = typeof organization.endDate === 'string' ? organization.endDate.split('T')[0] : null;
                } else {
                    organizationEndDate = null;
                }
                
                console.log('[Facility] Organization date range:', organizationStartDate, 'to', organizationEndDate);
                
                // Load all persons and filter to this organization
                await dataStore.getPersons();
                const allPersons = $dataStore.persons;
                console.log('[Facility] Total persons loaded:', allPersons.length);
                
                // Filter persons who belong to this organization
                // Note: The organization array has org_id, not organizationId
                organizationPeople = allPersons.filter(person => {
                    const belongsToOrg = person.organizations?.some((org: any) => org.org_id === organizationId);
                    if (belongsToOrg) {
                        console.log('[Facility] Person belongs to org:', person.name, person.id);
                    }
                    return belongsToOrg;
                });

                totalStaff = organizationPeople.length;
                console.log('[Facility] Loaded', totalStaff, 'staff for organization', organizationName);

                // Initialize staff availability data and load unavailable dates from database
                staffAvailabilityData = new Map();
                for (const person of organizationPeople) {
                    // Load unavailable dates for this person from org_person_attributes
                    const unavailableDatesStrings = await dataStore.getPersonUnavailableDates(person.id, organizationId);
                    
                    // Convert date strings (YYYY-MM-DD) to DateRange format
                    const unavailableDates: DateRange[] = unavailableDatesStrings.map(dateStr => ({
                        startDate: dateStr,
                        endDate: dateStr
                    }));
                    
                    staffAvailabilityData.set(person.id, {
                        personId: person.id,
                        personName: person.name,
                        unavailableDates
                    });
                    
                    console.log(`[Facility] Loaded ${unavailableDates.length} unavailable dates for ${person.name}`);
                }
                
                // After loading all unavailable dates, recalculate and save the availability model
                // This ensures the model is up-to-date with the current data
                if (totalStaff > 0 && staffAvailabilityData.size > 0) {
                    console.log('[Facility] Recalculating availability model from loaded data...');
                    try {
                        await saveAvailabilityModel();
                        console.log('[Facility] ✅ Availability model recalculated and saved on load');
                    } catch (error) {
                        console.error('[Facility] ⚠️ Error recalculating availability model on load:', error);
                        // Don't fail the entire load if model save fails
                    }
                }
            } else {
                console.error('[Facility] No organization found for user');
            }
        } catch (error) {
            console.error('[Facility] Error loading facility data:', error);
        } finally {
            console.log('[Facility] loadFacilityData complete, setting isLoading=false');
            isLoading = false;
        }
    }

    // Check if a date is within the organization's valid date range
    function isDateInOrgRange(dateStr: string): boolean {
        // If no start date is set, it means forever to the past
        if (organizationStartDate && dateStr < organizationStartDate) {
            return false;
        }
        // If no end date is set, it means forever to the future
        if (organizationEndDate && dateStr > organizationEndDate) {
            return false;
        }
        return true;
    }

    function handleDatesChanged(personId: string, dates: DateRange[]) {
        console.log('[Facility] Dates changed for person', personId, ':', dates);
        
        // Filter out any dates outside the organization date range
        const filteredDates = dates.filter(range => {
            // Keep range if at least part of it is within org range
            return isDateInOrgRange(range.startDate) || isDateInOrgRange(range.endDate) ||
                   (organizationStartDate && range.endDate >= organizationStartDate && range.startDate <= (organizationEndDate || '9999-12-31')) ||
                   (!organizationStartDate && !organizationEndDate);
        });
        
        // Clip ranges to organization boundaries if needed
        const clippedDates = filteredDates.map(range => {
            let startDate = range.startDate;
            let endDate = range.endDate;
            
            if (organizationStartDate && startDate < organizationStartDate) {
                startDate = organizationStartDate;
            }
            if (organizationEndDate && endDate > organizationEndDate) {
                endDate = organizationEndDate;
            }
            
            return { startDate, endDate };
        }).filter(range => range.startDate <= range.endDate);
        
        const staffAvail = staffAvailabilityData.get(personId);
        if (staffAvail) {
            staffAvail.unavailableDates = clippedDates;
            // Create a new Map to trigger reactivity
            staffAvailabilityData = new Map(staffAvailabilityData.set(personId, staffAvail));
            
            // Trigger a debounced save (saves both individual and aggregate model)
            debouncedSave(personId);
        }
    }

    let pendingPersonIds = $state<Set<string>>(new Set());
    
    function debouncedSave(personId: string) {
        pendingPersonIds.add(personId);
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            // Save all pending person updates
            const personIdsToSave = Array.from(pendingPersonIds);
            pendingPersonIds.clear();
            saveMultiplePersonsAndAggregateModel(personIdsToSave);
        }, 1000); // 1 second debounce
    }

    async function saveBothPersonAndAggregateModel(personId: string) {
        await saveMultiplePersonsAndAggregateModel([personId]);
    }

    async function saveMultiplePersonsAndAggregateModel(personIds: string[]) {
        if (!organizationId) {
            console.error('[Facility] Cannot save: organizationId is null');
            return;
        }
        
        isSaving = true;
        saveMessage = null;
        
        try {
            // Step 1: Save individual person unavailability for all affected persons
            for (const personId of personIds) {
                await savePersonUnavailability(personId);
            }
            
            // Step 2: Calculate and save the Availability model (aggregated staff levels)
            await saveAvailabilityModel();
            
            console.log('[Facility] ✅ Both person unavailability and availability model saved for', personIds.length, 'persons');
            saveMessage = 'Saved successfully';
            setTimeout(() => { saveMessage = null; }, 2000);
        } catch (error) {
            console.error('[Facility] ❌ Error saving:', error);
            saveMessage = 'Error saving data';
            setTimeout(() => { saveMessage = null; }, 5000);
        } finally {
            isSaving = false;
        }
    }

    async function savePersonUnavailability(personId: string) {
        if (!organizationId) {
            throw new Error('organizationId is null');
        }
        
        const staffAvail = staffAvailabilityData.get(personId);
        if (!staffAvail) {
            throw new Error(`No availability data found for person: ${personId}`);
        }
        
        // Convert DateRange[] to string[] (YYYY-MM-DD format)
        // Expand ranges into individual dates
        const unavailableDatesSet = new Set<string>();
        for (const range of staffAvail.unavailableDates) {
            // Parse dates as local dates (no timezone conversion)
            const startParts = range.startDate.split('-');
            const endParts = range.endDate.split('-');
            const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
            const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
            
            // Add all dates in the range
            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(currentDate.getDate()).padStart(2, '0');
                unavailableDatesSet.add(`${year}-${month}-${day}`);
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        
        const unavailableDates = Array.from(unavailableDatesSet).sort();
        
        console.log(`[Facility] Saving ${unavailableDates.length} unavailable dates for person ${personId}:`, unavailableDates);
        
        const success = await dataStore.setPersonUnavailableDates(personId, organizationId, unavailableDates);
        
        if (!success) {
            throw new Error('Failed to save unavailable dates');
        }
    }

    async function saveAvailabilityModel() {
        try {
            console.log('[Facility] Calculating and saving Availability model...');
            console.log('[Facility] Total staff:', totalStaff);
            console.log('[Facility] Staff availability data:', Array.from(staffAvailabilityData.values()));
            
            // Convert staff availability data to array for the model
            const staffAvailArray: StaffAvailability[] = Array.from(staffAvailabilityData.values());
            
            // Convert to Availability model format (aggregates staff levels by date range)
            const model = convertToModel(totalStaff, staffAvailArray);
            
            console.log('[Facility] Generated Availability model:', JSON.stringify(model, null, 2));
            
            // Save to backend (organization.staff_availability)
            const response = await fetch(`${env.serverUrl}/saveModelUnit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: studyId,
                    unit: 'Availability',
                    content: model  // Send as object, not stringified
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Facility] Save failed:', response.status, errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            console.log('[Facility] ✅ Availability model saved successfully');
            
            // Trigger refresh of the model panel
            modelPanelRefreshTrigger++;
        } catch (error) {
            console.error('[Facility] ❌ Error saving availability model:', error);
            throw error;
        }
    }

    function manualSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        if (selectedPersonId) {
            saveBothPersonAndAggregateModel(selectedPersonId);
        }
    }

    onMount(() => {
        loadFacilityData();
    });

    onDestroy(() => {
        if (saveTimeout) clearTimeout(saveTimeout);
    });

    // Get unavailable dates for the selected person
    let selectedPersonUnavailableDates = $derived(
        selectedPersonId && staffAvailabilityData.has(selectedPersonId)
            ? staffAvailabilityData.get(selectedPersonId)!.unavailableDates
            : []
    );

    // Create map of all staff availability for showing counts when no person selected
    let allStaffAvailabilityMap = $derived.by(() => {
        const map = new Map<string, DateRange[]>();
        for (const [personId, staffAvail] of staffAvailabilityData.entries()) {
            map.set(personId, staffAvail.unavailableDates);
        }
        return map;
    });
    
    // Create map of person IDs to names for tooltips
    let staffNamesMap = $derived.by(() => {
        const map = new Map<string, string>();
        for (const [personId, staffAvail] of staffAvailabilityData.entries()) {
            map.set(personId, staffAvail.personName);
        }
        return map;
    });
</script>

<div class="facility-container">
    {#if isLoading}
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Loading facility information...</p>
        </div>
    {:else}
        <div class="facility-content" data-testid="facility-content">
            <div class="people-section" data-testid="people-section">
                <h3>Staff Members</h3>
                <FacilityPeopleGrid 
                    {studyId} 
                    bind:onPersonSelected={handlePersonSelected}
                />
            </div>

            <div class="calendar-section" data-testid="calendar-section">
                <AvailabilityCalendar 
                    bind:selectedPersonId={selectedPersonId}
                    bind:selectedPersonName={selectedPersonName}
                    {totalStaff}
                    unavailableDates={selectedPersonUnavailableDates}
                    onDatesChanged={handleDatesChanged}
                    allStaffAvailability={allStaffAvailabilityMap}
                    staffNames={staffNamesMap}
                    organizationStartDate={organizationStartDate}
                    organizationEndDate={organizationEndDate}
                />
            </div>

            <!-- Model section hidden -->
            <!-- <div class="model-section" data-testid="model-section">
                <AvailabilityModelPanel {studyId} bind:refreshTrigger={modelPanelRefreshTrigger} />
            </div> -->
        </div>
    {/if}
</div>
