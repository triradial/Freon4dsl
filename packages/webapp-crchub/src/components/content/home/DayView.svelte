<script lang="ts">
    import { onMount } from "svelte";
    import { createGrid } from "ag-grid-community";
    import type { GridOptions, GridApi } from "ag-grid-community";
    import "ag-grid-enterprise";
    import { theme } from "../../../services/stores/theme-store.js";
    import { staffAvailabilityStore } from "../../../services/stores/staff-availability-store.js";
    import { dataStore } from "../../../services/data/data-store.js";
    import { ModelManager } from "../../../services/dsl/model-manager.js";
    import type { PatientInfo, PatientHistory, PatientVisit } from "@freon4dsl/study-configuration";
    import type { StaffAvailability } from "../../../services/data/availability-service.js";
    import { convertToModel } from "../../../services/data/availability-interpreter.js";
    import { env } from "../../../config/env.js";
    import { navigateTo } from "../../../services/routing/route-action.js";
    // @ts-ignore
    import { ChevronLeft as IconChevronLeft, ChevronRight as IconChevronRight, Check as IconCheck, ArrowRightFromLine as IconArrowRightFromLine, ArrowLeftFromLine as IconArrowLeftFromLine } from '@lucide/svelte';

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
        studyName: string;
        visitNumber: string;
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
    let staffAvailabilityData = $state<Map<string, StaffAvailability>>(new Map());
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    let showStaffAvailability = $derived($staffAvailabilityStore);

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
        
        const staffAvail = staffAvailabilityData.get(personId);
        if (!staffAvail) {
            console.error(`[DayView] No availability data found for person: ${personId}`);
            return;
        }
        
        // Check if person is already unavailable for this date
        const isUnavailable = staffAvail.unavailableDates.some(range => 
            range.startDate <= dateStr && range.endDate >= dateStr
        );
        
        let newUnavailableDates: { startDate: string; endDate: string }[];
        if (isUnavailable) {
            // Remove this date from unavailable dates
            newUnavailableDates = staffAvail.unavailableDates.filter(range => 
                !(range.startDate <= dateStr && range.endDate >= dateStr)
            );
        } else {
            // Add this date to unavailable dates
            newUnavailableDates = [...staffAvail.unavailableDates, { startDate: dateStr, endDate: dateStr }];
        }
        
        // Update staffAvailabilityData
        staffAvailabilityData.set(personId, {
            ...staffAvail,
            unavailableDates: newUnavailableDates
        });
        staffAvailabilityData = new Map(staffAvailabilityData);
        
        // Save person unavailability and availability model
        await savePersonAndAvailabilityModel(personId);
        
        // Reload day data to refresh grids
        await loadDayData();
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
            // Step 1: Save individual person unavailability
            const staffAvail = staffAvailabilityData.get(personId);
            if (!staffAvail) {
                console.error(`[DayView] No availability data found for person: ${personId}`);
                return;
            }
            
            // Convert DateRange[] to string[] (YYYY-MM-DD format)
            const unavailableDatesSet = new Set<string>();
            for (const range of staffAvail.unavailableDates) {
                const startParts = range.startDate.split('-');
                const endParts = range.endDate.split('-');
                const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
                const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
                
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
            await dataStore.setPersonUnavailableDates(personId, organizationId, unavailableDates);
            
            // Step 2: Calculate and save the Availability model (aggregated staff levels)
            const staffAvailArray: StaffAvailability[] = Array.from(staffAvailabilityData.values());
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
        // Today uses future color with checkmark icon
        if (isToday(date)) return 'day-future';
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

    function previousDay() {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        selectedDate = newDate;
        updateWeekDays();
        loadDayData();
    }

    function nextDay() {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        selectedDate = newDate;
        updateWeekDays();
        loadDayData();
    }

    function previousWeek() {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 7);
        selectedDate = newDate;
        updateWeekDays();
        loadDayData();
    }

    function nextWeek() {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 7);
        selectedDate = newDate;
        updateWeekDays();
        loadDayData();
    }

    function selectDay(date: Date) {
        selectedDate = new Date(date);
        updateWeekDays();
        loadDayData();
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

    async function loadDayData() {
        const dateStr = formatDateString(selectedDate);
        console.log('[DayView] Loading data for date:', dateStr);

        // Load patients and their visits
        await dataStore.getPatients();
        await dataStore.getStudies();
        const allPatients = $dataStore.patients;
        
        // Get all studies to map patient to study
        const studies = $dataStore.studies || [];
        console.log('[DayView] Loaded', studies.length, 'studies');
        const studyMap = new Map<string, string>();
        for (const study of studies) {
            studyMap.set(study.id, study.name || study.id);
        }

        const patientVisits: PatientVisitRow[] = [];
        
        // For each patient, get their PatientInfo model to find visits
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
                                studyName: studyName,
                                visitNumber: visit.name || `Visit ${visit.visitInstanceNumber || ''}`
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(`[DayView] Error loading patient info for ${patient.id}:`, error);
            }
        }

        patientsData = patientVisits;

        // Load studies data
        const studiesRows: StudyRow[] = [];
        for (const study of studies) {
            // Count patients for this study
            const studyPatients = allPatients.filter(p => p.studyId === study.id);
            studiesRows.push({
                studyName: study.name || study.id,
                studyId: study.id,
                patientCount: studyPatients.length
            });
        }
        studiesData = studiesRows;

        // Load organization dates FIRST (independent of studies)
        // Facility dates are needed for date filtering even if there are no studies
        // Check if we haven't loaded organization dates yet (both are null)
        if (organizationStartDate === null && organizationEndDate === null && organizationId === null) {
            await loadOrganizationDates();
        }

        // Load staff availability
        // Get organization from first study
        const firstStudy = studies[0];
        if (!firstStudy) {
            staffInData = [];
            staffOutData = [];
            return;
        }

        const site = await dataStore.getUserStudySite(firstStudy.id);
        if (!site || !site.orgId) {
            staffInData = [];
            staffOutData = [];
            organizationId = site?.orgId || null;
            return;
        }

        organizationId = site.orgId;
        studyId = firstStudy.id;

        // Get all persons for the organization (same approach as Facility.svelte)
        await dataStore.getPersons();
        const allPersons = $dataStore.persons;
        const orgPersons = allPersons.filter(person => 
            person.organizations?.some((org: any) => org.org_id === site.orgId)
        );
        
        totalStaff = orgPersons.length;
        
        // Load all staff availability data (for saving availability model)
        const newStaffAvailabilityData = new Map<string, StaffAvailability>();
        for (const person of orgPersons) {
            const unavailableDatesStrings = await dataStore.getPersonUnavailableDates(person.id, site.orgId);
            const unavailableDates = unavailableDatesStrings.map(dateStr => ({
                startDate: dateStr,
                endDate: dateStr
            }));
            newStaffAvailabilityData.set(person.id, {
                personId: person.id,
                personName: person.name,
                unavailableDates
            });
        }
        staffAvailabilityData = newStaffAvailabilityData;

        // Load staff for selected date
        const staffIn: StaffRow[] = [];
        const staffOut: StaffRow[] = [];

        // Only show staff as available/unavailable if date is within org range
        const isDateInRange = isDateInOrgRange(dateStr);

        for (const person of orgPersons) {
            try {
                // If date is outside org range, don't show staff as available
                if (!isDateInRange) {
                    // Don't add to either list - they're not available outside the org date range
                    continue;
                }
                
                // Use the same method as Facility.svelte
                const unavailableDatesStrings = await dataStore.getPersonUnavailableDates(person.id, site.orgId);
                const isUnavailable = unavailableDatesStrings.includes(dateStr);
                
                if (isUnavailable) {
                    staffOut.push({ name: person.name, personId: person.id });
                } else {
                    staffIn.push({ name: person.name, personId: person.id });
                }
            } catch (error) {
                console.error(`[DayView] Error loading availability for ${person.name}:`, error);
                // Only add to "In" if date is in range
                if (isDateInRange) {
                    staffIn.push({ name: person.name, personId: person.id });
                }
            }
        }

        console.log('[DayView] Loaded staff for date', dateStr, ':', staffIn.length, 'in,', staffOut.length, 'out');
        console.log('[DayView] Staff in:', staffIn);
        console.log('[DayView] Staff out:', staffOut);
        
        staffInData = staffIn;
        staffOutData = staffOut;
        
        // Manually update grids after data loads (in case reactive effects haven't fired yet)
        if (studiesGridApi) {
            console.log('[DayView] Manually updating studies grid with', studiesData.length, 'rows');
            studiesGridApi.setGridOption("rowData", studiesData);
        }
        if (staffInGridApi) {
            console.log('[DayView] Manually updating staff in grid with', staffIn.length, 'rows');
            staffInGridApi.setGridOption("rowData", staffIn);
        }
        if (staffOutGridApi) {
            console.log('[DayView] Manually updating staff out grid with', staffOut.length, 'rows');
            staffOutGridApi.setGridOption("rowData", staffOut);
        }
        
        // Load staff counts for all days in the week
        await loadWeekStaffData(orgPersons, site.orgId);
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
        } else {
            organizationStartDate = null;
            organizationEndDate = null;
        }
    }

    async function loadWeekStaffData(orgPersons: any[], orgId: string) {
        const newWeekStaffData = new Map<string, DayStaffData>();
        
        // Load availability for all persons
        const personAvailabilityMap = new Map<string, string[]>();
        for (const person of orgPersons) {
            try {
                const unavailableDates = await dataStore.getPersonUnavailableDates(person.id, orgId);
                personAvailabilityMap.set(person.id, unavailableDates);
            } catch (error) {
                console.error(`[DayView] Error loading availability for ${person.name}:`, error);
                personAvailabilityMap.set(person.id, []);
            }
        }
        
        // Load all patients and studies for visit counts
        await dataStore.getPatients();
        const allPatients = $dataStore.patients;
        const studies = $dataStore.studies || [];
        
        // Calculate counts for each day in the week
        for (const day of weekDays) {
            const dateStr = formatDateString(day);
            let staffIn = 0;
            let staffOut = 0;
            let visitCount = 0;
            
            // Check if date is within organization date range
            const isDateInRange = isDateInOrgRange(dateStr);
            
            // Count staff (only if date is within org range)
            if (isDateInRange) {
                for (const person of orgPersons) {
                    const unavailableDates = personAvailabilityMap.get(person.id) || [];
                    if (unavailableDates.includes(dateStr)) {
                        staffOut++;
                    } else {
                        staffIn++;
                    }
                }
            }
            // If date is outside org range, staffIn and staffOut remain 0
            
            // Count patient visits for this day
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
                                visitCount++;
                            }
                        }
                    }
                } catch (error) {
                    // Silently continue if patient info can't be loaded
                }
            }
            
            newWeekStaffData.set(dateStr, {
                dateStr,
                staffIn,
                staffOut,
                visitCount
            });
        }
        
        weekStaffData = newWeekStaffData;
    }

    // Reload week staff data when weekDays or organizationId changes
    $effect(() => {
        if (weekDays.length > 0 && organizationId) {
            dataStore.getPersons().then(() => {
                const allPersons = $dataStore.persons;
                const orgPersons = allPersons.filter(person => 
                    person.organizations?.some((org: any) => org.org_id === organizationId)
                );
                loadWeekStaffData(orgPersons, organizationId);
            });
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
        updateWeekDays();
        
        // Initialize grids first (they'll be empty initially)
        // Initialize studies grid
        const studiesGridElement = document.querySelector("#studiesGrid") as HTMLElement;
        if (studiesGridElement) {
            function createStudyNameCellRenderer(params: any) {
                const container = document.createElement('div');
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.width = '100%';
                
                const button = document.createElement('button');
                button.textContent = params.data?.studyName || '';
                button.style.background = 'none';
                button.style.border = 'none';
                button.style.cursor = 'pointer';
                button.style.padding = '0';
                button.style.textAlign = 'left';
                button.style.color = 'var(--color-link, var(--color-text))';
                button.style.textDecoration = 'underline';
                button.style.font = 'inherit';
                button.title = 'Open study';
                button.onclick = (e) => {
                    e.stopPropagation();
                    if (params.data?.studyId) {
                        navigateTo("study", params.data.studyId);
                    }
                };
                container.appendChild(button);
                
                return container;
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
                    { field: "patientCount", headerName: "Patient Number", flex: 1, minWidth: 100 }
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
        if (patientsGridElement) {
            const patientsGridOptions: GridOptions = {
                columnDefs: [
                    { field: "patientId", headerName: "Patient ID", flex: 1, minWidth: 100 },
                    { field: "studyName", headerName: "Study", flex: 1, minWidth: 150 },
                    { field: "visitNumber", headerName: "Visit", flex: 1, minWidth: 100 }
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
        
        // Load organization dates first (needed for date filtering)
        await loadOrganizationDates();
        
        // Now load the data (reactive effects will update the grids)
        await loadDayData();
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
            {:else if isYesterday(selectedDate)}
                <div class="date-label">YESTERDAY</div>
            {:else if isTomorrow(selectedDate)}
                <div class="date-label">TOMORROW</div>
            {/if}
        </div>
    </div>

    <!-- Main Content: Studies, Patients and Staff -->
    <div class="main-content" style:grid-template-columns={showStaffAvailability ? '1fr 1fr 1fr' : '1fr 1fr'}>
        <div class="studies-section">
            <h3>Studies</h3>
            {#if isSelectedDateBeforeOrgStart()}
                <div class="not-applicable-message">Not Applicable</div>
            {/if}
            <div id="studiesGrid" class="{gridTheme} ag-grid" style:display={isSelectedDateBeforeOrgStart() ? 'none' : 'block'}></div>
        </div>

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
                                <div class="day-visit-count">{dayData.visitCount} patient visit{dayData.visitCount !== 1 ? 's' : ''}</div>
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

