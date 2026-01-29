import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { dataStore } from '../data/data-store.js';
import { ModelManager } from '../dsl/model-manager.js';
import type { PatientInfo, PatientHistory, PatientVisit } from "@freon4dsl/study-configuration";
import type { StaffAvailability } from '../data/availability-service.js';

export interface PatientVisitRow {
    patientId: string;
    patientIdLink: string; // actual patient.id for navigation
    studyName: string;
    studyId: string; // for navigation
    visitNumber: string;
    status?: 'planned' | 'completed' | 'missed' | 'canceled';
}

export interface StaffRow {
    name: string;
    personId: string;
}

export interface DayData {
    dateStr: string;
    patientVisits: PatientVisitRow[];
    staffIn: StaffRow[];
    staffOut: StaffRow[];
    visitCount: number;
    staffInCount: number;
    staffOutCount: number;
}

interface DayViewStoreState {
    // Current selected date
    selectedDate: Date;
    
    // Date range that's currently loaded (2 months before/after selected date)
    dateRange: {
        start: string; // YYYY-MM-DD
        end: string;   // YYYY-MM-DD
    } | null;
    
    // Cached data by date string (YYYY-MM-DD)
    dayData: Map<string, DayData>;
    
    // Organization and study context
    organizationId: string | null;
    studyId: string | null;
    organizationStartDate: string | null;
    organizationEndDate: string | null;
    
    // Staff availability data (loaded once, used for all dates)
    staffAvailability: Map<string, StaffAvailability>;
    totalStaff: number;
    
    // Loading states
    isLoading: boolean;
    isPreloading: boolean;
    
    // Last update timestamp
    lastUpdate: number | null;
}

type SubscriptionCallback = (dateStr: string, data: DayData) => void;
type RangeChangeCallback = (range: { start: string; end: string }) => void;

function createDayViewStore() {
    const { subscribe, set, update } = writable<DayViewStoreState>({
        selectedDate: new Date(),
        dateRange: null,
        dayData: new Map(),
        organizationId: null,
        studyId: null,
        organizationStartDate: null,
        organizationEndDate: null,
        staffAvailability: new Map(),
        totalStaff: 0,
        isLoading: false,
        isPreloading: false,
        lastUpdate: null
    });

    // Subscriptions for live updates
    const dataSubscriptions = new Set<SubscriptionCallback>();
    const rangeSubscriptions = new Set<RangeChangeCallback>();
    
    // Polling interval for live updates (can be configured)
    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    let pollingEnabled = false;
    const DEFAULT_POLL_INTERVAL = 30000; // 30 seconds
    let pollIntervalMs = DEFAULT_POLL_INTERVAL;

    // Helper: Format date as YYYY-MM-DD
    function formatDateString(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Helper: Get date range (2 months before/after center date)
    function getDateRange(centerDate: Date): { start: string; end: string } {
        const start = new Date(centerDate);
        start.setMonth(start.getMonth() - 2);
        start.setDate(1); // Start of month
        
        const end = new Date(centerDate);
        end.setMonth(end.getMonth() + 2);
        end.setDate(0); // Last day of previous month (so we get end of target month)
        end.setDate(end.getDate() + 1); // First day of next month
        end.setDate(end.getDate() - 1); // Last day of target month
        
        return {
            start: formatDateString(start),
            end: formatDateString(end)
        };
    }

    // Helper: Check if date is within organization date range
    function isDateInOrgRange(dateStr: string, state: DayViewStoreState): boolean {
        if (state.organizationStartDate && dateStr < state.organizationStartDate) {
            return false;
        }
        if (state.organizationEndDate && dateStr > state.organizationEndDate) {
            return false;
        }
        return true;
    }

    // Load patient visits for a specific date
    async function loadPatientVisitsForDate(dateStr: string): Promise<PatientVisitRow[]> {
        await dataStore.getPatients();
        await dataStore.getStudies();
        const dataStoreState = get(dataStore);
        const allPatients = dataStoreState.patients;
        const studies = dataStoreState.studies || [];
        
        const studyMap = new Map<string, string>();
        for (const study of studies) {
            studyMap.set(study.id, study.name || study.id);
        }

        const patientVisits: PatientVisitRow[] = [];
        
        for (const patient of allPatients) {
            if (!patient.studyId) continue;
            
            try {
                const patientInfo = await ModelManager.getInstance().getModelUnitWithoutOpening(patient.studyId, "PatientInfo") as PatientInfo;
                if (!patientInfo) continue;

                const patientHistory = patientInfo.patientHistories.find(
                    ph => ph.patient_id === patient.patientNumber || ph.patient_id === patient.id
                );

                if (patientHistory) {
                    for (const visit of patientHistory.patientVisits) {
                        if (visit.actualVisitDate?.dateAsString === dateStr) {
                            const studyName = studyMap.get(patient.studyId) || patient.studyId;
                            patientVisits.push({
                                patientId: patient.patientNumber || patient.id,
                                patientIdLink: patient.id,
                                studyName: studyName,
                                studyId: patient.studyId,
                                visitNumber: visit.name || `Visit ${visit.visitInstanceNumber || ''}`
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(`[DayViewStore] Error loading patient info for ${patient.id}:`, error);
            }
        }
        
        return patientVisits;
    }

    // Load staff data for a specific date
    function loadStaffDataForDate(dateStr: string, state: DayViewStoreState): { staffIn: StaffRow[]; staffOut: StaffRow[] } {
        const staffIn: StaffRow[] = [];
        const staffOut: StaffRow[] = [];
        
        const isDateInRange = isDateInOrgRange(dateStr, state);
        
        if (!isDateInRange || state.staffAvailability.size === 0) {
            return { staffIn, staffOut };
        }
        
        // Get all persons from dataStore
        const dataStoreState = get(dataStore);
        const allPersons = dataStoreState.persons;
        const orgPersons = allPersons.filter(person => 
            person.organizations?.some((org: any) => org.org_id === state.organizationId)
        );
        
        for (const person of orgPersons) {
            const staffAvail = state.staffAvailability.get(person.id);
            if (!staffAvail) {
                staffIn.push({ name: person.name, personId: person.id });
                continue;
            }
            
            const isUnavailable = staffAvail.unavailableDates.some(range => 
                range.startDate <= dateStr && range.endDate >= dateStr
            );
            
            if (isUnavailable) {
                staffOut.push({ name: person.name, personId: person.id });
            } else {
                staffIn.push({ name: person.name, personId: person.id });
            }
        }
        
        return { staffIn, staffOut };
    }

    // Load data for a single date
    async function loadDateData(dateStr: string): Promise<DayData | null> {
        const state = get(store);
        
        // Check if already cached
        const cached = state.dayData.get(dateStr);
        if (cached) {
            return cached;
        }
        
        // Load patient visits
        const patientVisits = await loadPatientVisitsForDate(dateStr);
        
        // Load staff data
        const { staffIn, staffOut } = loadStaffDataForDate(dateStr, state);
        
        const dayData: DayData = {
            dateStr,
            patientVisits,
            staffIn,
            staffOut,
            visitCount: patientVisits.length,
            staffInCount: staffIn.length,
            staffOutCount: staffOut.length
        };
        
        // Update store
        update(state => {
            const newDayData = new Map(state.dayData);
            newDayData.set(dateStr, dayData);
            return {
                ...state,
                dayData: newDayData,
                lastUpdate: Date.now()
            };
        });
        
        // Notify subscribers
        dataSubscriptions.forEach(callback => {
            try {
                callback(dateStr, dayData);
            } catch (error) {
                console.error('[DayViewStore] Error in subscription callback:', error);
            }
        });
        
        return dayData;
    }

    // Load data for entire date range
    async function loadDateRange(range: { start: string; end: string }, preload: boolean = false) {
        const state = get(store);
        
        if (preload) {
            update(s => ({ ...s, isPreloading: true }));
        } else {
            update(s => ({ ...s, isLoading: true }));
        }
        
        try {
            // Load organization dates if needed
            if (!state.organizationId) {
                await loadOrganizationContext();
            }
            
            const startDate = new Date(range.start + 'T00:00:00');
            const endDate = new Date(range.end + 'T00:00:00');
            const currentDate = new Date(startDate);
            const datesToLoad: string[] = [];
            
            // Collect dates that need loading
            while (currentDate <= endDate) {
                const dateStr = formatDateString(currentDate);
                if (!state.dayData.has(dateStr)) {
                    datesToLoad.push(dateStr);
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            // Load dates in batches (to avoid overwhelming the system)
            const BATCH_SIZE = 10;
            for (let i = 0; i < datesToLoad.length; i += BATCH_SIZE) {
                const batch = datesToLoad.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map(dateStr => loadDateData(dateStr)));
            }
            
            // Update date range
            update(s => ({
                ...s,
                dateRange: range,
                isLoading: false,
                isPreloading: false
            }));
            
            // Notify range subscribers
            rangeSubscriptions.forEach(callback => {
                try {
                    callback(range);
                } catch (error) {
                    console.error('[DayViewStore] Error in range subscription callback:', error);
                }
            });
            
        } catch (error) {
            console.error('[DayViewStore] Error loading date range:', error);
            update(s => ({
                ...s,
                isLoading: false,
                isPreloading: false
            }));
        }
    }

    // Load organization context (dates, org ID, etc.)
    async function loadOrganizationContext() {
        const state = get(store);
        
        if (state.organizationId) {
            return; // Already loaded
        }
        
        // Load organization dates
        const organization = await dataStore.getUserOrganization();
        if (!organization) {
            return;
        }
        
        let parsedStartDate: string | null = null;
        if (organization.startDate) {
            if (typeof organization.startDate === 'string') {
                parsedStartDate = organization.startDate.split('T')[0].split(' ')[0];
            } else if (organization.startDate instanceof Date) {
                const year = organization.startDate.getFullYear();
                const month = String(organization.startDate.getMonth() + 1).padStart(2, '0');
                const day = String(organization.startDate.getDate()).padStart(2, '0');
                parsedStartDate = `${year}-${month}-${day}`;
            }
        }
        
        let parsedEndDate: string | null = null;
        if (organization.endDate) {
            if (typeof organization.endDate === 'string') {
                parsedEndDate = organization.endDate.split('T')[0].split(' ')[0];
            } else if (organization.endDate instanceof Date) {
                const year = organization.endDate.getFullYear();
                const month = String(organization.endDate.getMonth() + 1).padStart(2, '0');
                const day = String(organization.endDate.getDate()).padStart(2, '0');
                parsedEndDate = `${year}-${month}-${day}`;
            }
        }
        
        // Get organization ID from first study
        await dataStore.getStudies();
        const dataStoreState = get(dataStore);
        const studies = dataStoreState.studies || [];
        const firstStudy = studies[0];
        
        if (firstStudy) {
            const site = await dataStore.getUserStudySite(firstStudy.id);
            if (site?.orgId) {
                // Load staff availability
                await dataStore.getPersons();
                const personsState = get(dataStore);
                const allPersons = personsState.persons;
                const orgPersons = allPersons.filter(person => 
                    person.organizations?.some((org: any) => org.org_id === site.orgId)
                );
                
                const staffAvailability = new Map<string, StaffAvailability>();
                for (const person of orgPersons) {
                    const unavailableDatesStrings = await dataStore.getPersonUnavailableDates(person.id, site.orgId);
                    const unavailableDates = unavailableDatesStrings.map(dateStr => ({
                        startDate: dateStr,
                        endDate: dateStr
                    }));
                    staffAvailability.set(person.id, {
                        personId: person.id,
                        personName: person.name,
                        unavailableDates
                    });
                }
                
                update(s => ({
                    ...s,
                    organizationId: site.orgId,
                    studyId: firstStudy.id,
                    organizationStartDate: parsedStartDate,
                    organizationEndDate: parsedEndDate,
                    staffAvailability,
                    totalStaff: orgPersons.length
                }));
            }
        } else {
            update(s => ({
                ...s,
                organizationStartDate: parsedStartDate,
                organizationEndDate: parsedEndDate
            }));
        }
    }

    // Polling function for live updates
    async function pollForUpdates() {
        if (!pollingEnabled) return;
        
        const state = get(store);
        if (!state.dateRange) return;
        
        console.log('[DayViewStore] Polling for updates...');
        
        // Reload all dates in range
        const dates = Array.from(state.dayData.keys());
        for (const dateStr of dates) {
            // Reload data (will update cache and notify subscribers)
            await loadDateData(dateStr);
        }
    }

    // Start polling for live updates
    function startPolling(intervalMs: number = DEFAULT_POLL_INTERVAL) {
        if (pollingInterval) {
            stopPolling();
        }
        
        pollIntervalMs = intervalMs;
        pollingEnabled = true;
        pollingInterval = setInterval(pollForUpdates, intervalMs);
        console.log(`[DayViewStore] Started polling every ${intervalMs}ms`);
    }

    // Stop polling
    function stopPolling() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
        pollingEnabled = false;
        console.log('[DayViewStore] Stopped polling');
    }

    const store = {
        subscribe,
        
        // Set selected date and update range
        setSelectedDate: async (date: Date) => {
            const dateStr = formatDateString(date);
            const newRange = getDateRange(date);
            const state = get(store);
            
            update(s => ({ ...s, selectedDate: date }));
            
            // Check if we need to expand the range
            if (!state.dateRange || 
                dateStr < state.dateRange.start || 
                dateStr > state.dateRange.end) {
                await loadDateRange(newRange);
            }
        },
        
        // Get data for a specific date (loads if not cached)
        getDateData: async (dateStr: string): Promise<DayData | null> => {
            return await loadDateData(dateStr);
        },
        
        // Initialize: load organization context and initial date range
        initialize: async (selectedDate: Date = new Date()) => {
            await loadOrganizationContext();
            const range = getDateRange(selectedDate);
            await loadDateRange(range);
        },
        
        // Refresh a specific date
        refreshDate: async (dateStr: string) => {
            const state = get(store);
            const newDayData = new Map(state.dayData);
            newDayData.delete(dateStr); // Remove from cache to force reload
            update(s => ({ ...s, dayData: newDayData }));
            return await loadDateData(dateStr);
        },
        
        // Refresh entire range
        refreshRange: async () => {
            const state = get(store);
            if (state.dateRange) {
                update(s => ({ ...s, dayData: new Map() })); // Clear cache
                await loadDateRange(state.dateRange);
            }
        },
        
        // Update staff availability (when toggled)
        updateStaffAvailability: (personId: string, unavailableDates: Array<{ startDate: string; endDate: string }>) => {
            update(state => {
                const newStaffAvailability = new Map(state.staffAvailability);
                newStaffAvailability.set(personId, {
                    personId,
                    personName: state.staffAvailability.get(personId)?.personName || '',
                    unavailableDates
                });
                
                // Invalidate cached staff data for affected dates
                const newDayData = new Map(state.dayData);
                for (const [dateStr, dayData] of newDayData.entries()) {
                    const isAffected = unavailableDates.some(range => 
                        range.startDate <= dateStr && range.endDate >= dateStr
                    );
                    if (isAffected) {
                        // Remove from cache to force reload
                        newDayData.delete(dateStr);
                    }
                }
                
                return {
                    ...state,
                    staffAvailability: newStaffAvailability,
                    dayData: newDayData
                };
            });
        },
        
        // Subscribe to data updates for specific dates
        subscribeToData: (callback: SubscriptionCallback) => {
            dataSubscriptions.add(callback);
            return () => {
                dataSubscriptions.delete(callback);
            };
        },
        
        // Subscribe to range changes
        subscribeToRange: (callback: RangeChangeCallback) => {
            rangeSubscriptions.add(callback);
            return () => {
                rangeSubscriptions.delete(callback);
            };
        },
        
        // Polling controls
        startPolling,
        stopPolling,
        setPollInterval: (intervalMs: number) => {
            pollIntervalMs = intervalMs;
            if (pollingEnabled) {
                startPolling(intervalMs);
            }
        },
        
        // Get current state
        getState: () => get(store)
    };

    return store;
}

export const dayViewStore = createDayViewStore();

