<script lang="ts">
    import type { GridApi, GridOptions } from "ag-grid-community";
    import { createGrid } from "ag-grid-community";
    import "ag-grid-enterprise";
    import { onMount } from "svelte";
    import { dataStore } from "../../../services/data/data-store.js";
    import { staffAvailabilityStore } from "../../../services/stores/staff-availability-store.js";
    import { theme } from "../../../services/stores/theme-store.js";
// ModelManager no longer needed - using dataStore for patient schedules
    // PatientInfo no longer needed - using patient schedules from database
    import { env } from "../../../config/env.js";
    import { convertToModel } from "../../../services/data/availability-interpreter.js";
    import type { StaffAvailability } from "../../../services/data/availability-service.js";
    import { navigateTo } from "../../../services/routing/route-action.js";
    import { dayViewCache } from "../../../services/stores/day-view-cache.js";
// @ts-ignore
    import { Check as IconCheck, ChevronLeft as IconChevronLeft, ChevronRight as IconChevronRight } from '@lucide/svelte';

    let selectedDate = $state(new Date());
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let studiesGridApi: GridApi;
    let patientsGridApi: GridApi;
    let staffInGridApi: GridApi;
    let staffOutGridApi: GridApi;
    let gridTheme = $derived($theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz");

    interface PatientVisitRow {
        patientId: string;
        patientIdLink: string; // actual patient.id for navigation
        studyName: string;
        studyId: string; // for navigation
        visitNumber: string;
        status?: 'planned' | 'completed' | 'missed' | 'canceled';
    }

    interface StaffRow {
        name: string;
        personId: string;
    }

    interface StudyRow {
        studyName: string;
        studyId: string;
        patientCount: number;
    }

    let studiesData = $state<StudyRow[]>([]);
    let patientsData = $state<PatientVisitRow[]>([]);
    let staffInData = $state<StaffRow[]>([]);
    let staffOutData = $state<StaffRow[]>([]);
    let weekDays = $state<Date[]>([]);
    
    // Staff availability and visit counts for each day in the week
    interface DayStaffData {
        dateStr: string;
        staffIn: number;
        staffOut: number;
        visitCount: number;
    }
    let weekStaffData = $state<Map<string, DayStaffData>>(new Map());
    let organizationId = $state<string | null>(null);
    let organizationStartDate = $state<string | null>(null);
    let organizationEndDate = $state<string | null>(null);
    let studyId = $state<string | null>(null);
    let totalStaff = $state(0);
    let showStaffAvailability = $derived($staffAvailabilityStore);
    let isMounted = $state(false); // Track if component has mounted
    
    // Use persistent cache (survives component destruction)
    // These are reactive wrappers that sync with the persistent cache
    let personUnavailableDates = $state<Map<string, string[]>>(dayViewCache.getAllPersonUnavailableDates());
    let orgPersonsMap = $state<Map<string, any>>(dayViewCache.getAllPersons());
    let patientVisitsCache = $state<Map<string, PatientVisitRow[]>>(new Map());
    
    // Patient schedule cache - stores schedules keyed by patient ID to avoid repeated fetches
    let patientScheduleCache = $state<Map<string, any>>(new Map());
    let patientSchedulesLoaded = $state(false);
    
    // Cache flags to avoid redundant database calls
    let studiesAndPatientsLoaded = $state(false);
    let staffDataLoaded = $state(false);
    let cachedStudyMap = $state<Map<string, string>>(new Map());
    
    // Performance logging helper
    const PERF_ENABLED = true;
    function perf(label: string, startTime?: number): number {
        const now = performance.now();
        if (PERF_ENABLED && startTime !== undefined) {
            const elapsed = Math.round(now - startTime);
            console.log(`[DayView PERF] ${label}: ${elapsed}ms`);
        } else if (PERF_ENABLED) {
            console.log(`[DayView PERF] ${label} started`);
        }
        return now;
    }
    
    // Sync local state with persistent cache
    function syncFromCache() {
        personUnavailableDates = dayViewCache.getAllPersonUnavailableDates();
        orgPersonsMap = dayViewCache.getAllPersons();
        organizationId = dayViewCache.getOrganizationId();
        organizationStartDate = dayViewCache.getOrganizationStartDate();
        organizationEndDate = dayViewCache.getOrganizationEndDate();
        studyId = dayViewCache.getStudyId();
        totalStaff = dayViewCache.getTotalStaff();
        
        // Restore patient visits cache (we'll restore visits as needed)
        patientVisitsCache = new Map<string, PatientVisitRow[]>();
    }
    
    // Sync to persistent cache
    function syncToCache() {
        dayViewCache.setAllPersonUnavailableDates(personUnavailableDates);
        dayViewCache.setAllPersons(orgPersonsMap);
        dayViewCache.setOrganizationId(organizationId);
        dayViewCache.setOrganizationStartDate(organizationStartDate);
        dayViewCache.setOrganizationEndDate(organizationEndDate);
        dayViewCache.setStudyId(studyId);
        dayViewCache.setTotalStaff(totalStaff);
    }

    // Reactive updates for grids
    $effect(() => {
        if (studiesGridApi && studiesData && !isSelectedDateBeforeOrgStart()) {
            console.log('[DayView] Updating studies grid with', studiesData.length, 'rows');
            studiesGridApi.setGridOption("rowData", studiesData);
        }
    });

    $effect(() => {
        if (patientsGridApi && patientsData && !isSelectedDateBeforeOrgStart()) {
            console.log('[DayView] Updating patients grid with', patientsData.length, 'rows');
            patientsGridApi.setGridOption("rowData", patientsData);
        }
    });

    $effect(() => {
        if (staffInGridApi && staffInData && !isSelectedDateBeforeOrgStart()) {
            console.log('[DayView] Updating staff in grid with', staffInData.length, 'rows:', staffInData);
            staffInGridApi.setGridOption("rowData", staffInData);
        }
    });

    $effect(() => {
        if (staffOutGridApi && staffOutData && !isSelectedDateBeforeOrgStart()) {
            console.log('[DayView] Updating staff out grid with', staffOutData.length, 'rows:', staffOutData);
            staffOutGridApi.setGridOption("rowData", staffOutData);
        }
    });

    // Format date as YYYY-MM-DD
    function formatDateString(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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

    async function togglePersonUnavailable(personId: string) {
        if (!organizationId || !studyId) {
            console.error('[DayView] Cannot toggle: missing organizationId or studyId');
            return;
        }
        
        const dateStr = formatDateString(selectedDate);
        
        // Check if date is within organization date range
        if (!isDateInOrgRange(dateStr)) {
            console.warn(`[DayView] Cannot mark staff as unavailable outside organization date range. Org range: ${organizationStartDate || 'no start'} to ${organizationEndDate || 'no end'}, requested date: ${dateStr}`);
            return;
        }
        
        // Get current unavailable dates array
        const currentDates = personUnavailableDates.get(personId) || [];
        const isUnavailable = currentDates.includes(dateStr);
        
        let newUnavailableDates: string[];
        if (isUnavailable) {
            // Remove this date from unavailable dates
            newUnavailableDates = currentDates.filter(d => d !== dateStr);
        } else {
            // Add this date to unavailable dates
            newUnavailableDates = [...currentDates, dateStr].sort();
        }
        
        // Update the map (both local and persistent)
        personUnavailableDates.set(personId, newUnavailableDates);
        personUnavailableDates = new Map(personUnavailableDates);
        dayViewCache.setPersonUnavailableDates(personId, newUnavailableDates);
        
        // Save person unavailability and availability model
        await savePersonAndAvailabilityModel(personId);
        
        // Recompute staff data for current date (instant - no reload needed)
        const staffData = computeStaffDataForDate(dateStr);
        staffInData = staffData.staffIn;
        staffOutData = staffData.staffOut;
        
        // Update week data
        updateWeekData();
        
        // Update grids
        if (staffInGridApi) {
            staffInGridApi.setGridOption("rowData", staffInData);
        }
        if (staffOutGridApi) {
            staffOutGridApi.setGridOption("rowData", staffOutData);
        }
    }

    async function togglePersonAvailable(personId: string) {
        // Same as togglePersonUnavailable - it's just the reverse action
        await togglePersonUnavailable(personId);
    }

    async function savePersonAndAvailabilityModel(personId: string) {
        if (!organizationId || !studyId) {
            console.error('[DayView] Cannot save: missing organizationId or studyId');
            return;
        }
        
        try {
            // Step 1: Save individual person unavailability (already in simple array format)
            const unavailableDates = personUnavailableDates.get(personId) || [];
            await dataStore.setPersonUnavailableDates(personId, organizationId, unavailableDates);
            
            // Step 2: Calculate and save the Availability model (aggregated staff levels)
            // Convert simple arrays back to StaffAvailability format for the model
            const staffAvailArray: StaffAvailability[] = Array.from(orgPersonsMap.entries()).map(([personId, person]) => ({
                personId,
                personName: person.name,
                unavailableDates: (personUnavailableDates.get(personId) || []).map(dateStr => ({
                    startDate: dateStr,
                    endDate: dateStr
                }))
            }));
            const model = convertToModel(totalStaff, staffAvailArray);
            
            const response = await fetch(`${env.serverUrl}/saveModelUnit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: studyId,
                    unit: 'Availability',
                    content: model
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[DayView] Save failed:', response.status, errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            console.log('[DayView] ✅ Person unavailability and availability model saved successfully');
        } catch (error) {
            console.error('[DayView] ❌ Error saving:', error);
            throw error;
        }
    }

    // Format date for display
    function formatDateDisplay(date: Date): string {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }

    function isToday(date: Date): boolean {
        return date.toDateString() === today.toDateString();
    }

    function isYesterday(date: Date): boolean {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return date.toDateString() === yesterday.toDateString();
    }

    function isTomorrow(date: Date): boolean {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return date.toDateString() === tomorrow.toDateString();
    }

    function isWeekend(date: Date): boolean {
        const day = date.getDay();
        return day === 0 || day === 6;
    }

    function isPast(date: Date): boolean {
        return date < today && !isToday(date);
    }

    function isFuture(date: Date): boolean {
        return date > today;
    }

    function isBeforeOrgStart(date: Date): boolean {
        if (!organizationStartDate) {
            return false;
        }
        const dateStr = formatDateString(date);
        return dateStr < organizationStartDate;
    }

    function getDayColorClass(date: Date): string {
        // Check if date is before organization start date - use pink styling
        if (isBeforeOrgStart(date)) return 'day-before-start';
        // Today uses dedicated today styling (#767fce)
        if (isToday(date)) return 'day-today';
        if (isWeekend(date)) return 'day-weekend';
        if (isPast(date)) return 'day-past';
        if (isFuture(date)) return 'day-future';
        return '';
    }

    function getDayBackgroundColor(date: Date): string {
        // Check if date is before organization start date
        if (isBeforeOrgStart(date)) return 'var(--dayview-day-before-after-bg)';
        // Today uses future color
        if (isToday(date)) return 'var(--dayview-date-header-bg-future)';
        if (isWeekend(date)) return 'var(--dayview-date-header-bg-weekend)';
        if (isPast(date)) return 'var(--dayview-date-header-bg-past)';
        if (isFuture(date)) return 'var(--dayview-date-header-bg-future)';
        return 'var(--dayview-date-header-bg-future)';
    }
    
    function getDayDataForDate(date: Date): { visitCount: number; staffOut: number; isBeforeStart: boolean } {
        const dateStr = formatDateString(date);
        const beforeStart = isBeforeOrgStart(date);
        if (beforeStart) {
            return { visitCount: 0, staffOut: 0, isBeforeStart: true };
        }
        const data = weekStaffData.get(dateStr);
        return data ? { visitCount: data.visitCount, staffOut: data.staffOut, isBeforeStart: false } : { visitCount: 0, staffOut: 0, isBeforeStart: false };
    }
    
    function isSelectedDateBeforeOrgStart(): boolean {
        if (!organizationStartDate) return false;
        const dateStr = formatDateString(selectedDate);
        return dateStr < organizationStartDate;
    }

    function updateWeekDays() {
        const startOfWeek = new Date(selectedDate);
        const day = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - day); // Start from Sunday
        
        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            days.push(date);
        }
        weekDays = days;
    }

    function saveSelectedDate() {
        try {
            const dateStr = formatDateString(selectedDate);
            localStorage.setItem('dayview-selected-date', dateStr);
        } catch (error) {
            console.error('[DayView] Error saving selected date:', error);
        }
    }

    function loadSelectedDate(): Date | null {
        try {
            const dateStr = localStorage.getItem('dayview-selected-date');
            if (dateStr) {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
                    const day = parseInt(parts[2], 10);
                    const date = new Date(year, month, day);
                    if (!isNaN(date.getTime())) {
                        return date;
                    }
                }
            }
        } catch (error) {
            console.error('[DayView] Error loading selected date:', error);
        }
        return null;
    }

    // Update UI immediately (staff computed from arrays, visits from cache)
    function updateUIFromCache(dateStr: string) {
        // Update patient visits from cache
        const cachedVisits = patientVisitsCache.get(dateStr) || dayViewCache.getPatientVisits(dateStr);
        if (cachedVisits) {
            patientsData = cachedVisits;
        } else {
            // Clear data if no cache (will be loaded by loadDayData)
            patientsData = [];
        }
        // Manually update grid if initialized
        if (patientsGridApi && !isSelectedDateBeforeOrgStart()) {
            patientsGridApi.setGridOption("rowData", patientsData);
        }
        
        // Compute staff data instantly from arrays
        const staffData = computeStaffDataForDate(dateStr);
        staffInData = staffData.staffIn;
        staffOutData = staffData.staffOut;
        
        // Update week data
        if (weekDays.length > 0) {
            updateWeekData();
        }
    }

    function previousDay() {
        const start = perf('previousDay navigation');
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        selectedDate = newDate;
        saveSelectedDate();
        updateWeekDays();
        
        const dateStr = formatDateString(selectedDate);
        updateUIFromCache(dateStr);
        perf('previousDay UI update (sync)', start);
        loadDayData(); // Async background load
    }

    function nextDay() {
        const start = perf('nextDay navigation');
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        selectedDate = newDate;
        saveSelectedDate();
        updateWeekDays();
        
        const dateStr = formatDateString(selectedDate);
        updateUIFromCache(dateStr);
        perf('nextDay UI update (sync)', start);
        loadDayData(); // Async background load
    }

    function previousWeek() {
        const start = perf('previousWeek navigation');
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 7);
        selectedDate = newDate;
        saveSelectedDate();
        updateWeekDays();
        
        const dateStr = formatDateString(selectedDate);
        updateUIFromCache(dateStr);
        perf('previousWeek UI update (sync)', start);
        loadDayData(); // Async background load
    }

    function nextWeek() {
        const start = perf('nextWeek navigation');
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 7);
        selectedDate = newDate;
        saveSelectedDate();
        updateWeekDays();
        
        const dateStr = formatDateString(selectedDate);
        updateUIFromCache(dateStr);
        perf('nextWeek UI update (sync)', start);
        loadDayData(); // Async background load
    }

    function selectDay(date: Date) {
        const start = perf('selectDay navigation');
        selectedDate = new Date(date);
        saveSelectedDate();
        updateWeekDays();
        
        const dateStr = formatDateString(selectedDate);
        updateUIFromCache(dateStr);
        perf('selectDay UI update (sync)', start);
        loadDayData(); // Async background load
    }

    function gotoToday() {
        const start = perf('gotoToday navigation');
        const newToday = new Date();
        newToday.setHours(0, 0, 0, 0);
        selectedDate = newToday;
        saveSelectedDate();
        updateWeekDays();
        
        const dateStr = formatDateString(selectedDate);
        updateUIFromCache(dateStr);
        perf('gotoToday UI update (sync)', start);
        loadDayData(); // Async background load
    }

    function initializeStaffGrids() {
        // Initialize staff in grid
        const staffInGridElement = document.querySelector("#staffInGrid") as HTMLElement;
        if (staffInGridElement && !staffInGridElement.querySelector('.ag-root')) {
            function createStaffInNameCellRenderer(params: any) {
                const container = document.createElement('div');
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.gap = '0.5rem';
                container.style.width = '100%';
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = params.data?.name || '';
                nameSpan.style.flex = '1';
                nameSpan.style.color = 'var(--dayview-staff-in-header)';
                container.appendChild(nameSpan);
                
                const button = document.createElement('button');
                button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18"></path><path d="M18 6l6 6-6 6"></path></svg>`;
                button.style.background = 'none';
                button.style.border = 'none';
                button.style.cursor = 'pointer';
                button.style.padding = '0.25rem';
                button.style.display = 'flex';
                button.style.alignItems = 'center';
                button.style.color = 'var(--color-text)';
                button.title = 'Mark as unavailable';
                button.onclick = async (e) => {
                    e.stopPropagation();
                    if (params.data?.personId) {
                        await togglePersonUnavailable(params.data.personId);
                    }
                };
                container.appendChild(button);
                
                return container;
            }
            
            const staffInGridOptions: GridOptions = {
                columnDefs: [
                    { 
                        field: "name", 
                        headerName: "Name", 
                        flex: 1, 
                        minWidth: 150,
                        cellRenderer: createStaffInNameCellRenderer
                    }
                ],
                rowData: staffInData,
                defaultColDef: {
                    sortable: false,
                    filter: false,
                    resizable: false,
                    menuTabs: [],
                    suppressHeaderMenuButton: true
                },
                pagination: false,
                suppressRowClickSelection: true,
                domLayout: 'normal',
                overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">No staff in</span>'
            };
            staffInGridApi = createGrid(staffInGridElement, staffInGridOptions);
        }

        // Initialize staff out grid
        const staffOutGridElement = document.querySelector("#staffOutGrid") as HTMLElement;
        if (staffOutGridElement && !staffOutGridElement.querySelector('.ag-root')) {
            function createStaffOutNameCellRenderer(params: any) {
                const container = document.createElement('div');
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.gap = '0.5rem';
                container.style.width = '100%';
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = params.data?.name || '';
                nameSpan.style.flex = '1';
                nameSpan.style.color = 'var(--dayview-staff-out-header)';
                container.appendChild(nameSpan);
                
                const button = document.createElement('button');
                button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12H3"></path><path d="M6 18l-6-6 6-6"></path></svg>`;
                button.style.background = 'none';
                button.style.border = 'none';
                button.style.cursor = 'pointer';
                button.style.padding = '0.25rem';
                button.style.display = 'flex';
                button.style.alignItems = 'center';
                button.style.color = 'var(--color-text)';
                button.title = 'Mark as available';
                button.onclick = async (e) => {
                    e.stopPropagation();
                    if (params.data?.personId) {
                        await togglePersonAvailable(params.data.personId);
                    }
                };
                container.appendChild(button);
                
                return container;
            }
            
            const staffOutGridOptions: GridOptions = {
                columnDefs: [
                    { 
                        field: "name", 
                        headerName: "Name", 
                        flex: 1, 
                        minWidth: 150,
                        cellRenderer: createStaffOutNameCellRenderer
                    }
                ],
                rowData: staffOutData,
                defaultColDef: {
                    sortable: false,
                    filter: false,
                    resizable: false,
                    menuTabs: [],
                    suppressHeaderMenuButton: true
                },
                pagination: false,
                suppressRowClickSelection: true,
                domLayout: 'normal',
                overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">No staff out</span>'
            };
            staffOutGridApi = createGrid(staffOutGridElement, staffOutGridOptions);
        }
    }

    
    // Load all patient schedules in parallel (called once, used for all dates)
    async function loadAllPatientSchedules(allPatients: any[]): Promise<void> {
        if (patientSchedulesLoaded && patientScheduleCache.size > 0) {
            console.log('[DayView PERF] Using cached patient schedules:', patientScheduleCache.size, 'patients (skipping fetch)');
            return;
        }
        
        const patientsWithStudy = allPatients.filter(patient => patient.id && patient.studyId);
        console.log('[DayView] Loading schedules for', patientsWithStudy.length, 'patients in parallel...');
        const startTime = perf('Loading all patient schedules (parallel)');
        
        // Load all schedules in parallel
        const schedulePromises = patientsWithStudy.map(async (patient) => {
            try {
                const schedule = await dataStore.getPatientSchedule(patient.id);
                return { patientId: patient.id, schedule };
            } catch (error) {
                console.error(`[DayView] Error loading schedule for patient ${patient.id}:`, error);
                return { patientId: patient.id, schedule: null };
            }
        });
        
        const results = await Promise.all(schedulePromises);
        
        // Update cache with all results
        const newCache = new Map<string, any>();
        for (const { patientId, schedule } of results) {
            if (schedule) {
                newCache.set(patientId, schedule);
            }
        }
        
        patientScheduleCache = newCache;
        patientSchedulesLoaded = true;
        
        perf('Loading all patient schedules (parallel)', startTime);
        console.log('[DayView] Cached', patientScheduleCache.size, 'patient schedules for future use');
    }
    
    // Load patient visits for a specific date using cached schedule data
    async function loadPatientVisitsForDate(dateStr: string, allPatients: any[], studyMap: Map<string, string>): Promise<PatientVisitRow[]> {
        // Check cache first
        if (patientVisitsCache.has(dateStr)) {
            return patientVisitsCache.get(dateStr)!;
        }
        
        const patientVisits: PatientVisitRow[] = [];
        
        // Use cached schedules (loaded in parallel beforehand)
        for (const patient of allPatients) {
            if (!patient.id || !patient.studyId) continue;
            
            // Get schedule from cache
            const schedule = patientScheduleCache.get(patient.id);
            
            if (schedule && schedule.days) {
                // Find any day that matches the requested date
                const matchingDay = schedule.days.find((day: any) => day.date === dateStr);
                
                if (matchingDay && matchingDay.events && matchingDay.events.length > 0) {
                    const studyName = studyMap.get(patient.studyId) || patient.studyId;
                    
                    // Add each event as a visit row
                        for (const event of matchingDay.events) {
                            // Determine status based on event.status first, then fallback to state
                            let status: 'planned' | 'completed' | 'missed' | 'canceled' = 'planned';
                            
                            // Use event.status if available (primary indicator)
                            if (event.status) {
                                const eventStatus = event.status.toLowerCase();
                                if (eventStatus === 'completed') {
                                    status = 'completed';
                                } else if (eventStatus === 'cancelled' || eventStatus === 'canceled') {
                                    status = 'canceled';
                                } else if (eventStatus === 'missed') {
                                    status = 'missed';
                                } else if (eventStatus === 'pending' || eventStatus === 'planned') {
                                    status = 'planned'; // Planned/pending = future visit
                                }
                            }
                            // Fallback: check state for canceled/missed markers
                            else if (event.state === 'canceled-visit') {
                                status = 'canceled';
                            } else if (event.state === 'missed-visit') {
                                status = 'missed';
                            }
                            // Note: 'on-scheduled-date', 'in-window', 'out-of-window' are window positions,
                            // not completion indicators - keep as 'planned' unless event.status says otherwise
                            
                            patientVisits.push({
                            patientId: patient.patientNumber || patient.id,
                            patientIdLink: patient.id,
                            studyName: studyName,
                            studyId: patient.studyId,
                            visitNumber: event.name || `Visit`,
                            status: status
                        });
                    }
                }
            }
        }
        
        // Cache the result (both local and persistent)
        patientVisitsCache.set(dateStr, patientVisits);
        patientVisitsCache = new Map(patientVisitsCache); // Trigger reactivity
        dayViewCache.setPatientVisits(dateStr, patientVisits); // Persistent cache
        return patientVisits;
    }
    
    // Compute staff data for a specific date (fast - just checks arrays)
    function computeStaffDataForDate(dateStr: string): { staffIn: StaffRow[]; staffOut: StaffRow[] } {
        const staffIn: StaffRow[] = [];
        const staffOut: StaffRow[] = [];
        
        // Only show staff as available/unavailable if date is within org range
        const isDateInRange = isDateInOrgRange(dateStr);
        
        if (!isDateInRange || orgPersonsMap.size === 0) {
            return { staffIn, staffOut };
        }
        
        // Simply check if date is in each person's unavailable dates array
        for (const [personId, person] of orgPersonsMap.entries()) {
            const unavailableDates = personUnavailableDates.get(personId) || [];
            const isUnavailable = unavailableDates.includes(dateStr);
            
            if (isUnavailable) {
                staffOut.push({ name: person.name, personId: person.id });
            } else {
                staffIn.push({ name: person.name, personId: person.id });
            }
        }
        
        return { staffIn, staffOut };
    }
    

    async function loadDayData() {
        const totalStart = perf('loadDayData total');
        const dateStr = formatDateString(selectedDate);
        console.log('[DayView] Loading data for date:', dateStr);

        // Load patients and studies only once (avoid redundant database calls)
        let allPatients: any[];
        let studies: any[];
        
        if (!studiesAndPatientsLoaded) {
            const fetchStart = perf('Fetching studies and patients from database');
            await Promise.all([
                dataStore.getPatients(),
                dataStore.getStudies()
            ]);
            perf('Fetching studies and patients from database', fetchStart);
            
            allPatients = $dataStore.patients;
            studies = $dataStore.studies || [];
            
            // Build study map once
            cachedStudyMap = new Map<string, string>();
            for (const study of studies) {
                cachedStudyMap.set(study.id, study.name || study.id);
            }
            
            studiesAndPatientsLoaded = true;
            console.log('[DayView] Loaded', studies.length, 'studies,', allPatients.length, 'patients (cached for future)');
        } else {
            console.log('[DayView] Using cached studies and patients data');
            allPatients = $dataStore.patients;
            studies = $dataStore.studies || [];
        }

        // Try to get from persistent cache first
        const cacheStart = perf('Checking patient visits cache');
        const cachedVisits = dayViewCache.getPatientVisits(dateStr) || patientVisitsCache.get(dateStr);
        if (cachedVisits) {
            patientsData = cachedVisits;
            patientVisitsCache.set(dateStr, cachedVisits);
            patientVisitsCache = new Map(patientVisitsCache);
            perf('Patient visits loaded from cache', cacheStart);
        } else {
            // Load all patient schedules in parallel first (if not already cached)
            await loadAllPatientSchedules(allPatients);
            // Load for this date and cache it (fast now since schedules are cached)
            const visitStart = perf('Loading patient visits for date');
            const patientVisits = await loadPatientVisitsForDate(dateStr, allPatients, cachedStudyMap);
            patientsData = patientVisits;
            patientVisitsCache.set(dateStr, patientVisits);
            patientVisitsCache = new Map(patientVisitsCache);
            dayViewCache.setPatientVisits(dateStr, patientVisits);
            perf('Loading patient visits for date', visitStart);
        }

        // Load studies data (fast - just transforms existing data)
        const studiesStart = perf('Building studies grid data');
        const studiesRows: StudyRow[] = [];
        for (const study of studies) {
            const studyPatients = allPatients.filter(p => p.studyId === study.id);
            studiesRows.push({
                studyName: study.name || study.id,
                studyId: study.id,
                patientCount: studyPatients.length
            });
        }
        studiesData = studiesRows;
        perf('Building studies grid data', studiesStart);

        // Load organization dates FIRST (independent of studies)
        if (organizationStartDate === null && organizationEndDate === null && organizationId === null) {
            const orgDatesStart = perf('Loading organization dates');
            await loadOrganizationDates();
            perf('Loading organization dates', orgDatesStart);
        }

        // Load staff availability only once (avoid redundant database calls)
        const firstStudy = studies[0];
        if (!firstStudy) {
            staffInData = [];
            staffOutData = [];
            perf('loadDayData total (no studies)', totalStart);
            return;
        }

        if (!staffDataLoaded) {
            const staffStart = perf('Loading staff data from database');
            
            const site = await dataStore.getUserStudySite(firstStudy.id);
            if (!site || !site.orgId) {
                staffInData = [];
                staffOutData = [];
                organizationId = site?.orgId || null;
                perf('loadDayData total (no site)', totalStart);
                return;
            }

            organizationId = site.orgId;
            studyId = firstStudy.id;

            // Get all persons for the organization
            const personsStart = perf('Fetching persons');
            await dataStore.getPersons();
            perf('Fetching persons', personsStart);
            
            const allPersons = $dataStore.persons;
            const orgPersons = allPersons.filter(person => 
                person.organizations?.some((org: any) => org.org_id === site.orgId)
            );
            
            totalStaff = orgPersons.length;
            console.log('[DayView] Found', orgPersons.length, 'org persons');
            
            // Load all person unavailable dates IN PARALLEL (not sequential!)
            const unavailStart = perf('Loading person unavailable dates (parallel)');
            const newPersonUnavailableDates = new Map<string, string[]>();
            const newOrgPersonsMap = new Map<string, any>();
            
            // First, build the persons map (fast)
            for (const person of orgPersons) {
                newOrgPersonsMap.set(person.id, person);
            }
            
            // Load all unavailable dates in parallel
            const unavailablePromises = orgPersons.map(async (person) => {
                const unavailableDates = await dataStore.getPersonUnavailableDates(person.id, site.orgId);
                return { personId: person.id, unavailableDates };
            });
            
            const unavailableResults = await Promise.all(unavailablePromises);
            for (const { personId, unavailableDates } of unavailableResults) {
                newPersonUnavailableDates.set(personId, unavailableDates);
            }
            perf('Loading person unavailable dates (parallel)', unavailStart);
            
            personUnavailableDates = newPersonUnavailableDates;
            orgPersonsMap = newOrgPersonsMap;
            staffDataLoaded = true;
            
            // Sync to persistent cache
            syncToCache();
            console.log('[DayView] Staff data loaded and cached for future');
        } else {
            console.log('[DayView] Using cached staff data');
        }

        // Compute staff for selected date (fast - just checks arrays)
        const computeStart = perf('Computing staff for date');
        const staffData = computeStaffDataForDate(dateStr);
        staffInData = staffData.staffIn;
        staffOutData = staffData.staffOut;
        perf('Computing staff for date', computeStart);

        console.log('[DayView] Staff for date', dateStr, ':', staffInData.length, 'in,', staffOutData.length, 'out');
        
        // Manually update grids after data loads
        const gridStart = perf('Updating grids');
        if (studiesGridApi && !isSelectedDateBeforeOrgStart()) {
            studiesGridApi.setGridOption("rowData", studiesData);
        }
        if (patientsGridApi && !isSelectedDateBeforeOrgStart()) {
            patientsGridApi.setGridOption("rowData", patientsData);
        }
        if (staffInGridApi && !isSelectedDateBeforeOrgStart()) {
            staffInGridApi.setGridOption("rowData", staffInData);
        }
        if (staffOutGridApi && !isSelectedDateBeforeOrgStart()) {
            staffOutGridApi.setGridOption("rowData", staffOutData);
        }
        perf('Updating grids', gridStart);
        
        // Load staff counts for all days in the week
        const weekStart = perf('Loading week staff data');
        await loadWeekStaffData();
        perf('Loading week staff data', weekStart);
        
        perf('loadDayData total', totalStart);
    }
    
    
    // Load organization dates independently (needed for date filtering even without studies)
    async function loadOrganizationDates() {
        const organization = await dataStore.getUserOrganization();
        
        if (organization) {
            organizationId = organization.id;
            
            // Handle different date formats from backend
            let parsedStartDate: string | null = null;
            if (organization.startDate) {
                if (typeof organization.startDate === 'string') {
                    // Handle ISO string format: "2025-12-01T00:00:00.000Z" or "2025-12-01"
                    parsedStartDate = organization.startDate.split('T')[0].split(' ')[0];
                } else if (organization.startDate instanceof Date) {
                    // Handle Date object
                    const year = organization.startDate.getFullYear();
                    const month = String(organization.startDate.getMonth() + 1).padStart(2, '0');
                    const day = String(organization.startDate.getDate()).padStart(2, '0');
                    parsedStartDate = `${year}-${month}-${day}`;
                }
            }
            organizationStartDate = parsedStartDate;
            
            let parsedEndDate: string | null = null;
            if (organization.endDate) {
                if (typeof organization.endDate === 'string') {
                    // Handle ISO string format: "2025-12-01T00:00:00.000Z" or "2025-12-01"
                    parsedEndDate = organization.endDate.split('T')[0].split(' ')[0];
                } else if (organization.endDate instanceof Date) {
                    // Handle Date object
                    const year = organization.endDate.getFullYear();
                    const month = String(organization.endDate.getMonth() + 1).padStart(2, '0');
                    const day = String(organization.endDate.getDate()).padStart(2, '0');
                    parsedEndDate = `${year}-${month}-${day}`;
                }
            }
            organizationEndDate = parsedEndDate;
            
            // Sync to persistent cache
            dayViewCache.setOrganizationStartDate(organizationStartDate);
            dayViewCache.setOrganizationEndDate(organizationEndDate);
        } else {
            organizationStartDate = null;
            organizationEndDate = null;
            dayViewCache.setOrganizationStartDate(null);
            dayViewCache.setOrganizationEndDate(null);
        }
    }

    // Update week data (fast - computes from simple arrays)
    function updateWeekData() {
        const newWeekStaffData = new Map<string, DayStaffData>();
        
        for (const day of weekDays) {
            const dateStr = formatDateString(day);
            
            // Compute staff data (fast - just checks arrays)
            const staffData = computeStaffDataForDate(dateStr);
            
            // Get visit count from persistent cache if available, otherwise 0
            const cachedVisits = dayViewCache.getPatientVisits(dateStr) || patientVisitsCache.get(dateStr);
            const visitCount = cachedVisits ? cachedVisits.length : 0;
            
            newWeekStaffData.set(dateStr, {
                dateStr,
                staffIn: staffData.staffIn.length,
                staffOut: staffData.staffOut.length,
                visitCount
            });
        }
        
        weekStaffData = newWeekStaffData;
    }
    
    async function loadWeekStaffData() {
        const totalStart = perf('loadWeekStaffData total');
        
        // Use cached patients data (already loaded in loadDayData)
        const allPatients = $dataStore.patients;
        
        // Check if any dates need loading
        const datesToLoad: string[] = [];
        for (const day of weekDays) {
            const dateStr = formatDateString(day);
            const cached = dayViewCache.getPatientVisits(dateStr) || patientVisitsCache.get(dateStr);
            if (!cached) {
                datesToLoad.push(dateStr);
            } else {
                // Restore to local cache
                patientVisitsCache.set(dateStr, cached);
            }
        }
        
        // If there are dates to load, first load all patient schedules in parallel
        if (datesToLoad.length > 0) {
            console.log('[DayView] Loading week data for', datesToLoad.length, 'uncached dates');
            
            const scheduleStart = perf('Loading patient schedules for week');
            await loadAllPatientSchedules(allPatients);
            perf('Loading patient schedules for week', scheduleStart);
            
            // Now process each date (fast since schedules are cached)
            const visitsStart = perf('Processing visits for ' + datesToLoad.length + ' dates');
            for (const dateStr of datesToLoad) {
                await loadPatientVisitsForDate(dateStr, allPatients, cachedStudyMap);
            }
            perf('Processing visits for ' + datesToLoad.length + ' dates', visitsStart);
        } else {
            console.log('[DayView] All week dates already cached');
        }
        
        patientVisitsCache = new Map(patientVisitsCache); // Trigger reactivity
        
        // Update week data (staff is computed instantly from arrays)
        const updateStart = perf('Updating week display data');
        updateWeekData();
        perf('Updating week display data', updateStart);
        
        perf('loadWeekStaffData total', totalStart);
    }

    // Update week data when weekDays changes (staff is computed instantly)
    $effect(() => {
        if (weekDays.length > 0 && orgPersonsMap.size > 0) {
            updateWeekData();
        }
    });

    // Save selected date whenever it changes (for persistence)
    $effect(() => {
        // Only save if we've mounted (to avoid saving on initial load before saved date is restored)
        if (isMounted && selectedDate) {
            saveSelectedDate();
        }
    });

    // Initialize staff grids when showStaffAvailability becomes true
    $effect(() => {
        if (showStaffAvailability) {
            // Use setTimeout to ensure DOM is updated
            setTimeout(() => {
                initializeStaffGrids();
            }, 0);
        }
    });

    onMount(async () => {
        const mountStart = perf('onMount total');
        
        // Restore from persistent cache first (instant)
        const cacheRestoreStart = perf('Restoring from cache');
        syncFromCache();
        perf('Restoring from cache', cacheRestoreStart);
        
        // Load saved date from localStorage, or use today
        const savedDate = loadSelectedDate();
        if (savedDate) {
            selectedDate = savedDate;
        }
        
        updateWeekDays();
        
        // Initialize grids first (they'll be empty initially)
        // Check if grids already exist (e.g., when navigating back to this page)
        const studiesGridElement = document.querySelector("#studiesGrid") as HTMLElement;
        if (studiesGridElement && !studiesGridElement.querySelector('.ag-root')) {
            function createStudyNameCellRenderer(params: any) {
                const container = document.createElement('div');
                container.className = 'study-name-cell-container';
                container.style.width = '100%';
                container.style.height = '100%';
                
                const content = document.createElement('div');
                content.className = 'study-name-content';
                
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'name-link';
                button.textContent = params.data?.studyName || '';
                button.title = 'Open study';
                button.setAttribute('data-study-id', params.data?.studyId || '');
                button.onclick = (e) => {
                    e.stopPropagation();
                    if (params.data?.studyId) {
                        navigateTo("study", params.data.studyId);
                    }
                };
                
                content.appendChild(button);
                container.appendChild(content);
                
                return container;
            }
            
            function createPatientCountCellRenderer(params: any) {
                const count = params.value;
                return count && count > 0 ? count : '';
            }
            
            const studiesGridOptions: GridOptions = {
                columnDefs: [
                    { 
                        field: "studyName", 
                        headerName: "Study Name", 
                        flex: 1, 
                        minWidth: 150,
                        cellRenderer: createStudyNameCellRenderer
                    },
                    { 
                        field: "patientCount", 
                        headerName: "Number Patients", 
                        flex: 1, 
                        minWidth: 100, 
                        cellRenderer: createPatientCountCellRenderer
                    }
                ],
                rowData: studiesData,
                defaultColDef: {
                    sortable: false,
                    filter: false,
                    resizable: false,
                    menuTabs: [],
                    suppressHeaderMenuButton: true
                },
                pagination: false,
                suppressRowClickSelection: true,
                domLayout: 'normal',
                overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">No studies</span>'
            };
            studiesGridApi = createGrid(studiesGridElement, studiesGridOptions);
        }

        // Initialize patients grid
        const patientsGridElement = document.querySelector("#patientsGrid") as HTMLElement;
        if (patientsGridElement && !patientsGridElement.querySelector('.ag-root')) {
            function createPatientIdCellRenderer(params: any) {
                const container = document.createElement('div');
                container.className = 'patient-id-cell-container';
                container.style.width = '100%';
                container.style.height = '100%';
                
                const content = document.createElement('div');
                content.className = 'patient-id-content';
                
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'name-link';
                button.textContent = params.data?.patientId || '';
                button.title = 'Open patient';
                button.setAttribute('data-patient-id', params.data?.patientIdLink || '');
                button.onclick = (e) => {
                    e.stopPropagation();
                    if (params.data?.patientIdLink) {
                        navigateTo("patient", params.data.patientIdLink);
                    }
                };
                
                content.appendChild(button);
                container.appendChild(content);
                
                return container;
            }
            
            function createStudyNameCellRendererForPatients(params: any) {
                const container = document.createElement('div');
                container.className = 'study-name-cell-container';
                container.style.width = '100%';
                container.style.height = '100%';
                
                const content = document.createElement('div');
                content.className = 'study-name-content';
                
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'name-link';
                button.textContent = params.data?.studyName || '';
                button.title = 'Open study';
                button.setAttribute('data-study-id', params.data?.studyId || '');
                button.onclick = (e) => {
                    e.stopPropagation();
                    if (params.data?.studyId) {
                        navigateTo("study", params.data.studyId);
                    }
                };
                
                content.appendChild(button);
                container.appendChild(content);
                
                return container;
            }
            
            function createStatusCellRenderer(params: any) {
                const container = document.createElement('div');
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.gap = '0.25rem';
                
                const status = params.value || 'scheduled';
                const statusText = status.charAt(0).toUpperCase() + status.slice(1);
                
                const dot = document.createElement('span');
                dot.style.width = '8px';
                dot.style.height = '8px';
                dot.style.borderRadius = '50%';
                dot.style.display = 'inline-block';
                
                // Color coding for status
                switch (status) {
                    case 'completed':
                        dot.style.backgroundColor = 'var(--color-success, #22c55e)';
                        break;
                    case 'planned':
                        dot.style.backgroundColor = 'var(--color-primary, #3b82f6)';
                        break;
                    case 'missed':
                        dot.style.backgroundColor = 'var(--color-warning, #f59e0b)';
                        break;
                    case 'canceled':
                        dot.style.backgroundColor = 'var(--color-error, #ef4444)';
                        break;
                    default:
                        dot.style.backgroundColor = 'var(--color-text-muted, #9ca3af)';
                }
                
                const text = document.createElement('span');
                text.textContent = statusText;
                
                container.appendChild(dot);
                container.appendChild(text);
                
                return container;
            }
            
            const patientsGridOptions: GridOptions = {
                columnDefs: [
                    { field: "patientId", headerName: "Patient ID", flex: 1, minWidth: 100, cellRenderer: createPatientIdCellRenderer },
                    { field: "studyName", headerName: "Study", flex: 1.5, minWidth: 150, cellRenderer: createStudyNameCellRendererForPatients },
                    { field: "visitNumber", headerName: "Visit", flex: 1, minWidth: 100 },
                    { field: "status", headerName: "Status", flex: 1, minWidth: 100, cellRenderer: createStatusCellRenderer }
                ],
                rowData: patientsData,
                defaultColDef: {
                    sortable: false,
                    filter: false,
                    resizable: false,
                    menuTabs: [],
                    suppressHeaderMenuButton: true
                },
                pagination: false,
                suppressRowClickSelection: true,
                domLayout: 'normal',
                overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">No patients with visits</span>'
            };
            patientsGridApi = createGrid(patientsGridElement, patientsGridOptions);
        }

        // Initialize staff grids if staff availability is enabled
        if (showStaffAvailability) {
            initializeStaffGrids();
        }
        
        // Mark as mounted early so reactive effects can work
        isMounted = true;
        
        // Use cached data immediately if available (non-blocking)
        const dateStr = formatDateString(selectedDate);
        
        // Restore patient visits from persistent cache
        const cachedVisits = dayViewCache.getPatientVisits(dateStr);
        if (cachedVisits) {
            patientsData = cachedVisits;
            patientVisitsCache.set(dateStr, cachedVisits);
            patientVisitsCache = new Map(patientVisitsCache);
        }
        
        // Use cached staff data if available (instant computation from arrays)
        if (orgPersonsMap.size > 0) {
            const staffData = computeStaffDataForDate(dateStr);
            staffInData = staffData.staffIn;
            staffOutData = staffData.staffOut;
        }
        
        // Load studies data immediately if we have studies in dataStore
        if ($dataStore.studies.length > 0) {
            const allPatients = $dataStore.patients;
            const studies = $dataStore.studies || [];
            const studiesRows: StudyRow[] = [];
            for (const study of studies) {
                const studyPatients = allPatients.filter(p => p.studyId === study.id);
                studiesRows.push({
                    studyName: study.name || study.id,
                    studyId: study.id,
                    patientCount: studyPatients.length
                });
            }
            studiesData = studiesRows;
        }
        
        // Update week data if we have cached data
        if (weekDays.length > 0 && orgPersonsMap.size > 0) {
            updateWeekData();
        }
        
        // Update grids immediately with cached data (instant render)
        if (studiesGridApi) {
            studiesGridApi.setGridOption("rowData", studiesData);
        }
        if (patientsGridApi) {
            patientsGridApi.setGridOption("rowData", patientsData);
        }
        if (staffInGridApi) {
            staffInGridApi.setGridOption("rowData", staffInData);
        }
        if (staffOutGridApi) {
            staffOutGridApi.setGridOption("rowData", staffOutData);
        }
        
        // Load organization dates and data in background (don't block render)
        // Only load if we don't have cached data
        const needsDataLoad = !dayViewCache.hasOrganizationData();
        
        perf('onMount sync portion complete', mountStart);
        
        if (needsDataLoad) {
            console.log('[DayView] No cached organization data - loading from database');
            // Load in background
            (async () => {
                const bgStart = perf('Background data load');
                await loadOrganizationDates();
                await loadDayData();
                perf('Background data load', bgStart);
            })();
        } else {
            console.log('[DayView] Using cached organization data');
            // Data already cached - just refresh current date (non-blocking)
            loadDayData();
        }
    });
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@33.3.4/styles/ag-grid.min.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ag-grid-community@33.3.4/styles/ag-theme-quartz.min.css" />
</svelte:head>

<div class="day-view-container">
    <!-- Top Section: Selected Date Display -->
    <div class="date-header">
        <div class="date-nav">
            <button class="nav-button" onclick={previousDay} aria-label="Previous day">
                <IconChevronLeft size={32} />
            </button>
            <div class="date-display">
                {formatDateDisplay(selectedDate)}
            </div>
            <button class="nav-button" onclick={nextDay} aria-label="Next day">
                <IconChevronRight size={32} />
            </button>
            {#if isToday(selectedDate)}
                <div class="date-label">TODAY</div>
            {:else}
                <button class="today-button" onclick={gotoToday} title="Go to today">
                    Goto Today
                </button>
            {/if}
        </div>
    </div>

    <!-- Main Content: Patients, Staff, Studies (ratio 3:2:3) -->
    <div class="main-content" style:grid-template-columns={showStaffAvailability ? '3fr 2fr 3fr' : '3fr 3fr'}>
        <div class="patients-section">
            <h3>Patients</h3>
            {#if isSelectedDateBeforeOrgStart()}
                <div class="not-applicable-message">Not Applicable</div>
            {/if}
            <div id="patientsGrid" class="{gridTheme} ag-grid" style:display={isSelectedDateBeforeOrgStart() ? 'none' : 'block'}></div>
        </div>

        {#if showStaffAvailability}
            <div class="staff-section">
                <h3>Staff</h3>
                <div class="staff-sections-container">
                    <div class="staff-in-section">
                        <h4 class="staff-in-header">Available</h4>
                        {#if isSelectedDateBeforeOrgStart()}
                            <div class="not-applicable-message">Not Applicable</div>
                        {/if}
                        <div id="staffInGrid" class="{gridTheme} ag-grid" style:display={isSelectedDateBeforeOrgStart() ? 'none' : 'block'}></div>
                    </div>
                    <div class="staff-out-section">
                        <h4 class="staff-out-header">Unavailable</h4>
                        {#if isSelectedDateBeforeOrgStart()}
                            <div class="not-applicable-message">Not Applicable</div>
                        {/if}
                        <div id="staffOutGrid" class="{gridTheme} ag-grid" style:display={isSelectedDateBeforeOrgStart() ? 'none' : 'block'}></div>
                    </div>
                </div>
            </div>
        {/if}

        <div class="studies-section">
            <h3>Studies</h3>
            {#if isSelectedDateBeforeOrgStart()}
                <div class="not-applicable-message">Not Applicable</div>
            {/if}
            <div id="studiesGrid" class="{gridTheme} ag-grid" style:display={isSelectedDateBeforeOrgStart() ? 'none' : 'block'}></div>
        </div>
    </div>

    <!-- Bottom Section: Week View -->
    <div class="week-view">
        <button class="week-nav-button" onclick={previousWeek} aria-label="Previous week">
            <IconChevronLeft size={32} />
        </button>
        <div class="week-days">
            {#each weekDays as day}
                {@const isSelected = day.toDateString() === selectedDate.toDateString()}
                {@const dayColorClass = getDayColorClass(day)}
                {@const dayData = getDayDataForDate(day)}
                <div class="week-day-wrapper">
                    <div class="day-name-above">{day.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}</div>
                    <div class="week-day {dayColorClass} {isSelected ? 'selected' : ''}"
                        onclick={() => selectDay(day)}
                        onkeydown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                selectDay(day);
                            }
                        }}
                        role="button"
                        tabindex="0"
                    >
                        <div class="day-month-date-top-left">
                            <span class="day-date">{day.getDate()}</span>
                            <span class="day-month">{day.toLocaleDateString('en-US', { month: 'short' })}</span>
                        </div>
                        {#if isToday(day)}
                            <div class="today-checkmark">
                                <IconCheck size={16} />
                            </div>
                        {/if}
                        {#if dayData.isBeforeStart}
                            <!-- Show only date for dates before org start -->
                        {:else}
                            <div class="day-content-center">
                                <div class="day-visit-count {dayData.visitCount >= 1 ? 'has-visits' : ''}">{dayData.visitCount} patient visit{dayData.visitCount !== 1 ? 's' : ''}</div>
                                {#if showStaffAvailability}
                                    {#if dayData.staffOut > 0}
                                        <div class="day-staff-out staff-out-warning">
                                            {dayData.staffOut} staff unavailable
                                        </div>
                                    {:else}
                                        <div class="day-staff-out staff-out-ok">
                                            all staff available
                                        </div>
                                    {/if}
                                {/if}
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
        <button class="week-nav-button" onclick={nextWeek} aria-label="Next week">
            <IconChevronRight size={32} />
        </button>
    </div>
</div>

