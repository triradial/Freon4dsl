<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { mount, unmount } from "svelte";
    import { browser } from '$app/environment';
    import { simulationService } from "../services/simulation/simulation-service.js";
    import { dataStore } from "../services/data/data-store.js";
    import { Timeline, getTimelineAsOfADate, type StudyConfiguration, Day } from "@freon4dsl/study-configuration"; // Unscheduled, AnyDay removed - EventStart concepts commented out
    import { ModelManager } from "../services/dsl/model-manager.js";
    import { get } from "svelte/store";
    import dayjs from "dayjs";
    // @ts-ignore
    import { CircleChevronLeft as IconChevronCircleLeft, CircleChevronRight as IconChevronCircleRight, Calendar as IconCalendar, Calendar1 as IconCalendar1, CalendarCheck as IconCalendarCheck, Grid2x2 as IconWindow, Check as IconCheck, X as IconX, Plus as IconPlus, Minus as IconMinus, Pencil as IconPencil, Trash2 as IconTrash, ArrowRightToLine as IconArrowRightToLine, Info as IconInfo, RefreshCw as IconRefresh } from '@lucide/svelte';
    import { editObject, addObject, objectDrawerStore } from "../services/stores/object-drawer-store.js";
    import { staffAvailabilityStore } from "../services/stores/staff-availability-store.js";
    import DeleteObjectDialog from "../components/dialogs/DeleteObjectDialog.svelte";
    import DayCellPopup, { type PopupType, type EventOption, type DayEvent, type DayData, type PopupResult } from '../components/content/patient/DayCellPopup.svelte';
    import TimelineCalendarHeader, { type MonthGroup } from '../components/content/patient/TimelineCalendarHeader.svelte';
    import StaffTimelineSection from '../components/content/facility/StaffTimelineSection.svelte';
    import PatientTimelineSection from '../components/content/patient/PatientTimelineSection.svelte';

    let { studyId, active = true } = $props<{ studyId: string; active?: boolean }>();
    
    // Splitter constants and state
    const SPLITTER_STORAGE_KEY = 'timeline-patient-staff-split';
    const DEFAULT_SPLIT_RATIO = 0.6;
    const MIN_SPLIT_RATIO = 0.2;
    const MAX_SPLIT_RATIO = 0.8;
    
    let splitRatio = $state(DEFAULT_SPLIT_RATIO);
    let isDraggingSplitter = $state(false);
    let timelineSectionsRef = $state<HTMLElement | null>(null);
    
    // Show Availability preference (only applies in scheduling mode)
    const SHOW_AVAILABILITY_STORAGE_KEY = 'timeline-show-availability';
    let showAvailability = $state(true); // Default to true (on)
    
    // Show Windows preference (toggles visibility of window indicator days)
    const SHOW_WINDOWS_STORAGE_KEY = 'timeline-show-windows';
    let showWindows = $state(true); // Default to true (on)
    
    // Info popup state (shown on hover)
    let showInfoPopup = $state(false);
    
    // Staff timeline visibility (controlled from NavBar user profile)
    let showStaffTimeline = $derived($staffAvailabilityStore);
    
    // Load splitter setting from localStorage
    function loadSplitterSetting() {
        if (!browser) return;
        try {
            const saved = localStorage.getItem(SPLITTER_STORAGE_KEY);
            if (saved) {
                const parsed = parseFloat(saved);
                if (!isNaN(parsed) && parsed >= MIN_SPLIT_RATIO && parsed <= MAX_SPLIT_RATIO) {
                    splitRatio = parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to load splitter setting:', e);
        }
    }
    
    // Save splitter setting to localStorage
    function saveSplitterSetting() {
        if (!browser) return;
        try {
            localStorage.setItem(SPLITTER_STORAGE_KEY, splitRatio.toString());
        } catch (e) {
            console.warn('Failed to save splitter setting:', e);
        }
    }
    
    // Load show availability setting from localStorage
    function loadShowAvailabilitySetting() {
        if (!browser) return;
        try {
            const saved = localStorage.getItem(SHOW_AVAILABILITY_STORAGE_KEY);
            if (saved !== null) {
                showAvailability = saved === 'true';
            }
        } catch (e) {
            console.warn('Failed to load show availability setting:', e);
        }
    }
    
    // Save show availability setting to localStorage
    function saveShowAvailabilitySetting() {
        if (!browser) return;
        try {
            localStorage.setItem(SHOW_AVAILABILITY_STORAGE_KEY, showAvailability.toString());
        } catch (e) {
            console.warn('Failed to save show availability setting:', e);
        }
    }
    
    // Load show windows setting from localStorage
    function loadShowWindowsSetting() {
        if (!browser) return;
        try {
            const saved = localStorage.getItem(SHOW_WINDOWS_STORAGE_KEY);
            if (saved !== null) {
                showWindows = saved === 'true';
            }
        } catch (e) {
            console.warn('Failed to load show windows setting:', e);
        }
    }
    
    // Save show windows setting to localStorage
    function saveShowWindowsSetting() {
        if (!browser) return;
        try {
            localStorage.setItem(SHOW_WINDOWS_STORAGE_KEY, showWindows.toString());
        } catch (e) {
            console.warn('Failed to save show windows setting:', e);
        }
    }
    
    
    // Splitter mouse handlers
    function handleSplitterMouseDown(event: MouseEvent) {
        if (!browser) return;
        event.preventDefault();
        isDraggingSplitter = true;
        document.addEventListener('mousemove', handleSplitterMouseMove);
        document.addEventListener('mouseup', handleSplitterMouseUp);
    }
    
    function handleSplitterMouseMove(event: MouseEvent) {
        if (!isDraggingSplitter || !timelineSectionsRef) return;
        
        const rect = timelineSectionsRef.getBoundingClientRect();
        const newRatio = (event.clientY - rect.top) / rect.height;
        
        // Constrain to min/max
        splitRatio = Math.max(MIN_SPLIT_RATIO, Math.min(MAX_SPLIT_RATIO, newRatio));
    }
    
    function handleSplitterMouseUp() {
        if (!browser) return;
        isDraggingSplitter = false;
        document.removeEventListener('mousemove', handleSplitterMouseMove);
        document.removeEventListener('mouseup', handleSplitterMouseUp);
        saveSplitterSetting();
    }

    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let timeline = $state<Timeline | null>(null);
    let patients = $state<any[]>([]);
    let containerRef = $state<HTMLElement | null>(null);
    let rawSimulationData = $state<any>(null);
    // NOTE: patientInfo DSL model is no longer used - patient data is fully database-driven
    
    // Model/study design error state - separate from fatal errors
    // When modelError is set, the page can still display patient schedules from the database
    // but operations requiring the model (like adding first visit) will show an error popup
    let modelError = $state<string | null>(null);
    
    // Track if we need to reload patients after drawer closes
    let needsPatientReload = $state(false);
    
    // Quick filter for patients
    let patientQuickFilter = $state('');
    
    // Quick filter for staff
    let staffQuickFilter = $state('');
    
    // Scroll sync refs for patient/staff rows
    let patientLabelsScrollRef = $state<HTMLElement | null>(null);
    let patientRowsScrollRef = $state<HTMLElement | null>(null);
    let staffLabelsScrollRef = $state<HTMLElement | null>(null);
    let staffRowsScrollRef = $state<HTMLElement | null>(null);
    
    // Scroll sync function - syncs labels with rows
    function syncPatientScroll(source: 'labels' | 'rows') {
        if (!patientLabelsScrollRef || !patientRowsScrollRef) return;
        if (source === 'rows') {
            patientLabelsScrollRef.scrollTop = patientRowsScrollRef.scrollTop;
        } else {
            patientRowsScrollRef.scrollTop = patientLabelsScrollRef.scrollTop;
        }
    }
    
    function syncStaffScroll(source: 'labels' | 'rows') {
        if (!staffLabelsScrollRef || !staffRowsScrollRef) return;
        if (source === 'rows') {
            staffLabelsScrollRef.scrollTop = staffRowsScrollRef.scrollTop;
        } else {
            staffRowsScrollRef.scrollTop = staffLabelsScrollRef.scrollTop;
        }
    }
    
    // View mode: 'scheduling' or 'availability'
    type ViewMode = 'scheduling' | 'availability';
    let viewMode = $state<ViewMode>('scheduling');
    
    // Date range control - range shows start/end of entire timeline
    let dateRangeStart = $state(0);
    let dateRangeEnd = $state(0);
    let visibleStartDay = $state(0);
    let visibleEndDay = $state(0);
    
    // Zoom control - 4 discrete sizes
    const ZOOM_LEVELS = [20, 40, 60, 80]; // 4 different day widths
    let zoomLevel = $state(0); // Index into ZOOM_LEVELS (0 = smallest)
    let dayWidth = $derived(ZOOM_LEVELS[zoomLevel]);
    
    // Patient/staff scrolling - tied together
    let patientScrollOffset = $state(0);
    let staffScrollOffset = $state(0);
    const PATIENTS_PER_PAGE = 4;
    const STAFF_PER_PAGE = 2;

    // Tooltip state
    let tooltipVisible = $state(false);
    let tooltipPosition = $state({ x: 0, y: 0 });
    let tooltipContent = $state<{ day: number | null; date: string; patientId: string; events: Array<{ name: string; status: string }> } | null>(null);
    let tooltipTimeout: ReturnType<typeof setTimeout> | null = null;

    // Popup state
    let popupOpen = $state(false);
    let popupDate = $state<Date>(new Date());
    let popupPatientId = $state<string>('');
    let popupDayData = $state<DayData | null>(null);
    let popupType = $state<PopupType>('no-event');
    let day0Events = $state<EventOption[]>([]);
    let unscheduledEvents = $state<EventOption[]>([]);
    let popupScheduledEvents = $state<DayEvent[]>([]);
    let studyConfig = $state<StudyConfiguration | null>(null);
    let popupAnchorElement = $state<HTMLElement | null>(null);
    let popupModelError = $state<string | null>(null); // Set when popup should show model error message
    
    // Derived: Get patient reference date for popup
    let popupPatientRefDate = $derived.by(() => {
        if (!patientCentricData?.patients) return null;
        const patient = (patientCentricData.patients as any[]).find((p: any) => p.patientId === popupPatientId);
        return patient?.referenceDate || null;
    });
    
    // Patient unavailable dates from database
    // Key: patient ID (UUID), Value: Set of YYYY-MM-DD date strings
    let patientUnavailableDatesFromDB = $state<Map<string, Set<string>>>(new Map());
    
    // Copy button state for JSON sidebar
    let copyButtonText = $state('Copy');
    
    // Availability overrides - separate state to track user changes that need to persist
    // Key format: "patientId-YYYY-MM-DD", value: boolean (true = available, false = unavailable)
    let availabilityOverrides = $state<Map<string, boolean>>(new Map());
    
    // Debounce timer for patient availability save
    let patientSaveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingPatientSaves = $state<Set<string>>(new Set()); // Set of patient IDs with pending saves
    
    // Staff data - real staff members from the organization
    interface StaffMember {
        id: string;
        name: string;
        unavailableDates: Set<string>; // Set of YYYY-MM-DD date strings
    }
    let staffMembers = $state<StaffMember[]>([]);
    let staffScrollOffset2 = $state(0); // Separate scroll offset for real staff (not tied to simulation staff)
    const STAFF_MEMBERS_PER_PAGE = 4;
    let organizationId = $state<string | null>(null);
    let siteStartDate = $state<string | null>(null); // Site/org start date for calendar origin (YYYY-MM-DD)
    
    // Staff availability overrides - for unsaved changes
    // Key format: "staffId-YYYY-MM-DD", value: boolean (true = available, false = unavailable)
    let staffAvailabilityOverrides = $state<Map<string, boolean>>(new Map());
    
    // Debounce timer for staff availability save
    let staffSaveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingStaffSaves = $state<Set<string>>(new Set()); // Set of staff IDs with pending saves
    
    // Delete dialog state (for staff - patients use inline popup)
    let deleteDialogOpen = $state(false);
    let objectToDelete = $state<any>(null);
    let objectTypeToDelete = $state<'patient' | 'person'>('patient');
    
    // Delete confirmation popover state
    let deleteConfirmInstance: any = null;
    let deleteConfirmContainer: HTMLDivElement | null = null;
    let deleteConfirmTriggerElement: HTMLElement | null = null;
    let deleteConfirmItemId: string | null = null;
    let deleteConfirmItemType: 'patient' | 'staff' | null = null;
    
    // Hover state for row labels
    let hoveredPatientId = $state<string | null>(null);
    let hoveredStaffId = $state<string | null>(null);

    // Calculate how many days fit in visible area
    function calculateVisibleDays(): number {
        if (!containerRef) return 31; // Default to one month
        const containerWidth = containerRef.clientWidth;
        const labelsColumnWidth = 120; // Fixed width for labels column
        const availableWidth = containerWidth - labelsColumnWidth;
        if (availableWidth <= 0) return 31; // Fallback
        const daysThatFit = Math.floor(availableWidth / dayWidth);
        return Math.max(28, daysThatFit); // At least 4 weeks
    }

    // Format date helper using dayjs
    function formatDateString(date: Date | string): string {
        return dayjs(date).format('YYYY-MM-DD');
    }

    // Helper to calculate calendar day difference using dayjs
    function getCalendarDayDiff(date1: Date | string, date2: Date | string): number {
        return dayjs(date1).startOf('day').diff(dayjs(date2).startOf('day'), 'day');
    }

    // Get the fallback reference date from database patient schedules
    // Used when timeline is not available (model errors)
    function getFallbackReferenceDate(): Date {
        let fallbackDate = new Date();
        fallbackDate.setHours(0, 0, 0, 0);
        
        for (const patient of patients) {
            const schedule = patientSchedulesFromDB.get(patient.id);
            if (schedule && schedule.referenceDate) {
                const [year, month, day] = schedule.referenceDate.split('-').map(Number);
                const patientRefDate = new Date(year, month - 1, day);
                if (patientRefDate < fallbackDate) {
                    fallbackDate = patientRefDate;
                }
            }
        }
        return fallbackDate;
    }

    // Get date from day offset using dayjs
    function getDateFromDay(day: number): Date {
        let refDate: Date;
        if (timeline) {
            refDate = timeline.getReferenceDate();
        } else {
            // Fallback: use the earliest patient reference date from database
            refDate = getFallbackReferenceDate();
        }
        // Normalize to start of day for consistent date calculations
        return dayjs(refDate).startOf('day').add(day, 'day').toDate();
    }

    // Check if date is weekend
    function isWeekend(date: Date): boolean {
        const day = date.getDay();
        return day === 0 || day === 6;
    }

    // Check if a day number is today
    function isToday(day: number): boolean {
        let refDate: Date;
        if (timeline) {
            refDate = timeline.getReferenceDate();
        } else {
            // Fallback: use the earliest patient reference date from database
            refDate = getFallbackReferenceDate();
        }
        const todayDay = getCalendarDayDiff(new Date(), refDate);
        return day === todayDay;
    }

    // Get month name
    function getMonthName(date: Date): string {
        const months = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        return months[date.getMonth()];
    }

    // Get month abbreviation
    function getMonthAbbr(date: Date): string {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months[date.getMonth()];
    }

    // Get day of week abbreviation
    function getDayOfWeekAbbr(date: Date): string {
        const days = ["S", "M", "T", "W", "T", "F", "S"];
        return days[date.getDay()];
    }

    // Load timeline data - fully database-driven (no PatientInfo DSL model dependency)
    // IMPORTANT: This function is designed to show patient schedules even when the study design
    // model has errors. The model is only needed for operations like adding first visit or
    // modifying schedules that require simulation.
    async function loadTimeline() {
        isLoading = true;
        error = null;
        modelError = null; // Reset model error state
        
        try {
            // STEP 1: Get patients for the study (database-driven, always works)
            await dataStore.getStudyPatients(studyId);
            const storeState = get(dataStore);
            const allPatients = storeState.studyPatients.filter(p => p.studyId === studyId);
            patients = allPatients;

            // Note: We no longer throw an error if there are no patients
            // Instead, we show an empty timeline starting from the site start date
            
            // STEP 2: Load patient unavailable dates and schedules from database (always works)
            if (allPatients.length > 0) {
                await loadPatientUnavailableDates();
                await loadPatientSchedules();
            }

            // STEP 3: Try to load the StudyConfiguration DSL model
            // This may fail if there are errors in the study design, but we should still
            // be able to display patient schedules from the database
            let loadedStudyConfig: StudyConfiguration | null = null;
            let modelLoadError: string | null = null;
            
            try {
                const modelManager = ModelManager.getInstance();
                loadedStudyConfig = await modelManager.getModelUnitWithoutOpening(studyId, "StudyConfiguration") as StudyConfiguration;
                
                if (loadedStudyConfig) {
                    // Try to create a timeline - this may throw if the model has invalid data
                    // We wrap this in a separate try-catch to isolate model-related errors
                    try {
                        // Determine reference date from DATABASE patient schedules
                        let referenceDateForTimeline = new Date();
                        referenceDateForTimeline.setHours(0, 0, 0, 0);
                        
                        const patientRefDates: Date[] = [];
                        for (const patient of allPatients) {
                            const schedule = patientSchedulesFromDB.get(patient.id);
                            if (schedule && schedule.referenceDate) {
                                const [year, month, day] = schedule.referenceDate.split('-').map(Number);
                                patientRefDates.push(new Date(year, month - 1, day, 0, 0, 0));
                            }
                        }
                        
                        if (patientRefDates.length > 0) {
                            referenceDateForTimeline = patientRefDates.reduce((earliest, date) => 
                                date < earliest ? date : earliest, patientRefDates[0]);
                            console.log("[loadTimeline] Reference date from database schedules:", formatDateString(referenceDateForTimeline));
                        } else {
                            console.log("[loadTimeline] No patient schedules found, using today as reference date");
                        }

                        // Create timeline with study configuration
                        const createdTimeline = getTimelineAsOfADate(loadedStudyConfig, referenceDateForTimeline, undefined);
                        timeline = createdTimeline;
                        studyConfig = loadedStudyConfig;
                        
                        console.log("[loadTimeline] Model loaded successfully, timeline created");
                    } catch (timelineErr: unknown) {
                        // Timeline creation failed - model has invalid data
                        const errMsg = timelineErr instanceof Error ? timelineErr.message : String(timelineErr);
                        modelLoadError = "timeline_error";
                        console.warn("[loadTimeline] Timeline creation failed:", errMsg);
                        loadedStudyConfig = null;
                    }
                } else {
                    modelLoadError = "config_not_found";
                }
            } catch (modelErr: unknown) {
                const errMsg = modelErr instanceof Error ? modelErr.message : String(modelErr);
                modelLoadError = "model_load_error";
                console.warn("[loadTimeline] Model loading failed:", errMsg);
            }
            
            // Set model error if there was one (but don't fail the page)
            if (modelLoadError) {
                modelError = modelLoadError;
                console.warn("[loadTimeline] Model error set (patient schedules will still display):", modelLoadError);
            }
            
            // STEP 4: Calculate date range - use database patient schedules as source of truth
            // This should work even if the model failed to load
            let referenceDateForTimeline = new Date();
            referenceDateForTimeline.setHours(0, 0, 0, 0);
            
            const patientRefDates: Date[] = [];
            for (const patient of allPatients) {
                const schedule = patientSchedulesFromDB.get(patient.id);
                if (schedule && schedule.referenceDate) {
                    const [year, month, day] = schedule.referenceDate.split('-').map(Number);
                    patientRefDates.push(new Date(year, month - 1, day, 0, 0, 0));
                }
            }
            
            if (patientRefDates.length > 0) {
                referenceDateForTimeline = patientRefDates.reduce((earliest, date) => 
                    date < earliest ? date : earliest, patientRefDates[0]);
            }
            
            // Store raw simulation data for debugging
            rawSimulationData = {
                referenceDate: formatDateString(referenceDateForTimeline),
                studyId,
                patientCount: allPatients.length,
                dataSource: 'database',
                modelAvailable: !modelError
            };
            
            // Calculate date range based on reference date
            const refDate = timeline?.getReferenceDate() ?? referenceDateForTimeline;
            let studyRefDate: Date = refDate;
            
            if (patientRefDates.length > 0) {
                studyRefDate = patientRefDates.reduce((earliest, date) => 
                    date < earliest ? date : earliest, patientRefDates[0]);
                console.log("[loadTimeline] Calculated studyReferenceDate from database:", formatDateString(studyRefDate));
            }
            
            let firstDataDate: Date = studyRefDate;
            let lastDataDate: Date = studyRefDate;
            
            // Handle case with no patients - show 1 year starting from today (or site start date if available later)
            if (allPatients.length === 0) {
                console.log("[loadTimeline] No patients - using today as reference with 1-year range");
                firstDataDate = new Date();
                firstDataDate.setHours(0, 0, 0, 0);
                // Set last data date to 1 year from now
                lastDataDate = new Date(firstDataDate);
                lastDataDate.setFullYear(lastDataDate.getFullYear() + 1);
            } else if (timeline) {
                // If timeline exists, use its days for date range
                const days = timeline.getDays();
                const sortedDays = [...days].sort((a, b) => a.day - b.day);
                
                // Debug: Log scheduled events from timeline
                console.log("=== TIMELINE EVENTS DEBUG (Database-driven) ===");
                for (const day of sortedDays) {
                    const date = getDateFromDay(day.day);
                    const scheduledEvents = day.getEventInstances();
                    if (scheduledEvents.length > 0) {
                        console.log(`Day ${day.day} (${formatDateString(date)}):`);
                        for (const event of scheduledEvents) {
                            console.log(`  Scheduled: ${event.getName()} - ${event.getTitle ? event.getTitle() : ''}`);
                        }
                    }
                }
                console.log("=== END TIMELINE EVENTS DEBUG ===");
                
                if (sortedDays.length > 0) {
                    const lastDataDay = sortedDays[sortedDays.length - 1].day;
                    lastDataDate = getDateFromDay(lastDataDay);
                }
            } else {
                // No timeline - extend date range based on database patient schedules
                // Look at all patient days to find the last date
                console.log("[loadTimeline] No timeline - calculating range from database schedules");
                console.log("[loadTimeline] patientSchedulesFromDB size:", patientSchedulesFromDB.size);
                
                for (const patient of allPatients) {
                    const schedule = patientSchedulesFromDB.get(patient.id);
                    if (schedule && schedule.days) {
                        console.log(`[loadTimeline] Patient ${patient.patientNumber}: ${schedule.days.length} days`);
                        for (const day of schedule.days) {
                            // Each day has a 'date' property (YYYY-MM-DD)
                            if (day.date) {
                                const [year, month, dayNum] = day.date.split('-').map(Number);
                                const dayDate = new Date(year, month - 1, dayNum);
                                if (dayDate > lastDataDate) {
                                    lastDataDate = dayDate;
                                    console.log(`[loadTimeline] New lastDataDate: ${formatDateString(dayDate)} from ${patient.patientNumber}`);
                                }
                            }
                        }
                    }
                }
                console.log("[loadTimeline] Final lastDataDate:", formatDateString(lastDataDate));
            }
            
            // Start range at the first day of the month containing the first data
            const firstMonthStart = new Date(firstDataDate.getFullYear(), firstDataDate.getMonth(), 1);
            const firstMonthStartDay = getCalendarDayDiff(firstMonthStart, refDate);
            
            // End range at the last day of the month containing the last data
            const lastMonthEnd = new Date(lastDataDate.getFullYear(), lastDataDate.getMonth() + 1, 0);
            const lastMonthEndDay = getCalendarDayDiff(lastMonthEnd, refDate);
            
            dateRangeStart = firstMonthStartDay;
            dateRangeEnd = lastMonthEndDay;
            
            console.log("Date range calculated:", {
                timelineRefDate: formatDateString(refDate),
                studyRefDate: formatDateString(studyRefDate),
                firstDataDate: firstDataDate.toISOString().split('T')[0],
                lastDataDate: lastDataDate.toISOString().split('T')[0],
                firstMonthStart: firstMonthStart.toISOString().split('T')[0],
                lastMonthEnd: lastMonthEnd.toISOString().split('T')[0],
                dateRangeStart,
                dateRangeEnd,
                rangeDays: dateRangeEnd - dateRangeStart,
                modelAvailable: !modelError
            });
            
            // Calculate initial visible window based on container width
            const daysThatFit = containerRef ? calculateVisibleDays() : 31;
            visibleStartDay = firstMonthStartDay;
            visibleEndDay = Math.min(visibleStartDay + daysThatFit - 1, dateRangeEnd);
            
            console.log("Initial visible window:", {
                visibleStartDay,
                visibleEndDay,
                daysThatFit,
                firstDate: getDateFromDay(visibleStartDay).toISOString().split('T')[0],
                lastDate: getDateFromDay(visibleEndDay).toISOString().split('T')[0]
            });
            
            // Extend date range based on actual patient schedules in database
            updateDateRangeFromPatientData();
        } catch (err: unknown) {
            // Only set fatal error for things that truly prevent displaying any data
            // (like no patients found)
            console.error("Error loading timeline:", err);
            error = err instanceof Error ? err.message : "Failed to load timeline data";
        } finally {
            isLoading = false;
            
            // Schedule recalculation after DOM has updated with the chart content
            setTimeout(() => {
                requestAnimationFrame(() => {
                    if (containerRef && containerRef.clientWidth > 0) {
                        const actualDaysThatFit = calculateVisibleDays();
                        console.log("[loadTimeline] Post-render check:", {
                            actualDaysThatFit,
                            currentVisibleDays: visibleEndDay - visibleStartDay + 1,
                            containerWidth: containerRef.clientWidth
                        });
                        if (actualDaysThatFit > (visibleEndDay - visibleStartDay + 1)) {
                            visibleEndDay = Math.min(visibleStartDay + actualDaysThatFit - 1, dateRangeEnd);
                            console.log("[loadTimeline] Recalculated after layout:", {
                                actualDaysThatFit,
                                visibleStartDay,
                                visibleEndDay
                            });
                        }
                    }
                });
            }, 0);
        }
    }

    // Load staff data from the organization (follows same pattern as Facility.svelte)
    async function loadStaffData() {
        try {
            // Get the site for this study to find the organization
            const site = await dataStore.getUserStudySite(studyId);
            if (!site || !site.orgId) {
                console.log("[loadStaffData] No site or organization found for study");
                return;
            }
            
            organizationId = site.orgId;
            console.log("[loadStaffData] Organization ID:", organizationId);
            
            // Get site/org start date for calendar origin
            // Note: orgStartDate is returned by getUserStudySite but not in the Site interface
            // This will be used when the staff timeline is moved to the facility view
            const siteAny = site as any;
            if (siteAny.orgStartDate) {
                siteStartDate = typeof siteAny.orgStartDate === 'string' 
                    ? siteAny.orgStartDate.split('T')[0] 
                    : null;
                console.log("[loadStaffData] Site start date:", siteStartDate);
                // Note: Site start date is stored but not used for patient timeline
                // It will be used when staff timeline is moved to the facility view
            }
            
            // Load all persons into the store (getPersons returns boolean, data goes to store)
            await dataStore.getPersons();
            
            // Access persons from the store
            const storeState = get(dataStore);
            const allPersons = storeState.persons || [];
            
            console.log("[loadStaffData] Total persons loaded:", allPersons.length);
            
            // Filter persons who belong to this organization (same pattern as Facility.svelte)
            const orgPersons = allPersons.filter((person: any) => {
                const belongsToOrg = person.organizations?.some((org: any) => org.org_id === organizationId);
                return belongsToOrg;
            });
            
            console.log("[loadStaffData] Found", orgPersons.length, "staff members in organization");
            
            // Load unavailable dates for each staff member
            const loadedStaffMembers: StaffMember[] = [];
            
            for (const person of orgPersons) {
                try {
                    const unavailableDatesArray = await dataStore.getPersonUnavailableDates(person.id, organizationId!);
                    const unavailableDates = new Set<string>(unavailableDatesArray);
                    
                    loadedStaffMembers.push({
                        id: person.id,
                        name: person.name,
                        unavailableDates
                    });
                    
                    console.log(`[loadStaffData] Staff ${person.name}: ${unavailableDates.size} unavailable dates`);
                } catch (err) {
                    console.error(`[loadStaffData] Error loading unavailable dates for ${person.name}:`, err);
                    loadedStaffMembers.push({
                        id: person.id,
                        name: person.name,
                        unavailableDates: new Set()
                    });
                }
            }
            
            staffMembers = loadedStaffMembers;
            console.log("[loadStaffData] Loaded staff members:", staffMembers.map(s => s.name));
        } catch (err) {
            console.error("[loadStaffData] Error loading staff data:", err);
        }
    }
    
    // Update date range to start from site start date
    function updateDateRangeFromSiteStart() {
        if (!timeline || !siteStartDate) return;
        
        const refDate = timeline.getReferenceDate();
        
        // Parse site start date
        const [year, month, day] = siteStartDate.split('-').map(Number);
        const siteStart = new Date(year, month - 1, day);
        
        // Calculate the first of the month containing the site start date
        const siteStartMonthFirst = new Date(siteStart.getFullYear(), siteStart.getMonth(), 1);
        const siteStartDay = getCalendarDayDiff(siteStartMonthFirst, refDate);
        
        // Only update if site start is earlier than current range start
        if (siteStartDay < dateRangeStart) {
            dateRangeStart = siteStartDay;
            
            // Recalculate visible window
            const daysThatFit = calculateVisibleDays();
            visibleStartDay = siteStartDay;
            visibleEndDay = Math.min(visibleStartDay + daysThatFit - 1, dateRangeEnd);
        }
    }
    
    // Check if staff member is unavailable on a given day
    function isStaffUnavailable(day: number, staffId: string): boolean {
        const dateStr = formatDateString(getDateFromDay(day));
        const key = `${staffId}-${dateStr}`;
        
        // Check overrides first (unsaved changes take precedence)
        if (staffAvailabilityOverrides.has(key)) {
            return !staffAvailabilityOverrides.get(key); // Map stores "available", we return "unavailable"
        }
        
        // Fall back to loaded data
        const staffMember = staffMembers.find(s => s.id === staffId);
        if (!staffMember) return false;
        
        return staffMember.unavailableDates.has(dateStr);
    }
    
    // Handle staff cell click to toggle availability directly
    function handleStaffCellClick(event: MouseEvent, day: number, staffId: string) {
        event.stopPropagation();
        
        // Get date and staff info
        const date = getDateFromDay(day);
        const staffMember = staffMembers.find(s => s.id === staffId);
        if (!staffMember) return;
        
        // Toggle availability: if currently unavailable, make available; if available, make unavailable
        const currentlyUnavailable = isStaffUnavailable(day, staffId);
        const newAvailable = currentlyUnavailable; // If unavailable, set to available (true); if available, set to unavailable (false)
        
        // Apply the change
        toggleStaffAvailability(staffId, date, newAvailable);
    }
    
    // Toggle staff availability for a specific date
    function toggleStaffAvailability(staffId: string, date: Date, available: boolean) {
        const dateStr = formatDateString(date);
        const key = `${staffId}-${dateStr}`;
        
        // Create a new Map to trigger reactivity
        const newOverrides = new Map(staffAvailabilityOverrides);
        newOverrides.set(key, available);
        staffAvailabilityOverrides = newOverrides;
        
        // Also update the staffMembers state to reflect the change immediately
        staffMembers = staffMembers.map(member => {
            if (member.id === staffId) {
                const newUnavailableDates = new Set(member.unavailableDates);
                if (available) {
                    newUnavailableDates.delete(dateStr);
                } else {
                    newUnavailableDates.add(dateStr);
                }
                return { ...member, unavailableDates: newUnavailableDates };
            }
            return member;
        });
        
        // Track that this staff member has pending saves
        pendingStaffSaves = new Set([...pendingStaffSaves, staffId]);
        
        // Debounce the save
        debouncedSaveStaffAvailability();
        
        console.log(`[toggleStaffAvailability] Toggled ${staffId} on ${dateStr}: now ${available ? 'available' : 'unavailable'}`);
    }
    
    // Debounced save for staff availability
    function debouncedSaveStaffAvailability() {
        if (staffSaveDebounceTimer) {
            clearTimeout(staffSaveDebounceTimer);
        }
        
        staffSaveDebounceTimer = setTimeout(async () => {
            await saveStaffAvailability();
        }, 1000); // 1 second debounce
    }
    
    // Save staff availability to database
    async function saveStaffAvailability() {
        if (!organizationId || pendingStaffSaves.size === 0) return;
        
        console.log("[saveStaffAvailability] Saving changes for staff:", Array.from(pendingStaffSaves));
        
        for (const staffId of pendingStaffSaves) {
            const staffMember = staffMembers.find(s => s.id === staffId);
            if (!staffMember) continue;
            
            try {
                // Convert Set to sorted array
                const unavailableDatesArray = Array.from(staffMember.unavailableDates).sort();
                
                // Save to database
                const success = await dataStore.setPersonUnavailableDates(staffId, organizationId, unavailableDatesArray);
                
                if (success) {
                    console.log(`[saveStaffAvailability] Saved ${staffMember.name}: ${unavailableDatesArray.length} unavailable dates`);
                } else {
                    console.error(`[saveStaffAvailability] Failed to save ${staffMember.name}`);
                }
            } catch (err) {
                console.error(`[saveStaffAvailability] Error saving ${staffMember.name}:`, err);
            }
        }
        
        // Clear pending saves
        pendingStaffSaves = new Set();
        
        // Clear overrides (they're now saved)
        staffAvailabilityOverrides = new Map();
    }

    // Patient schedules loaded from database
    let patientSchedulesFromDB = $state<Map<string, any>>(new Map());
    
    // Load patient unavailable dates from database
    async function loadPatientUnavailableDates() {
        try {
            const newUnavailableDates = new Map<string, Set<string>>();
            
            for (const patient of patients) {
                try {
                    const dates = await dataStore.getPatientUnavailableDates(patient.id);
                    newUnavailableDates.set(patient.id, new Set(dates));
                    console.log(`[loadPatientUnavailableDates] Patient ${patient.patientNumber}: ${dates.length} unavailable dates`);
                } catch (err) {
                    console.error(`[loadPatientUnavailableDates] Error loading unavailable dates for ${patient.patientNumber}:`, err);
                    newUnavailableDates.set(patient.id, new Set());
                }
            }
            
            patientUnavailableDatesFromDB = newUnavailableDates;
            console.log("[loadPatientUnavailableDates] Loaded unavailable dates for", patients.length, "patients");
        } catch (err) {
            console.error("[loadPatientUnavailableDates] Error:", err);
        }
    }
    
    // Load patient schedules from database
    async function loadPatientSchedules() {
        try {
            const newSchedules = new Map<string, any>();
            
            for (const patient of patients) {
                try {
                    const schedule = await dataStore.getPatientSchedule(patient.id);
                    if (schedule) {
                        newSchedules.set(patient.id, schedule);
                        console.log(`[loadPatientSchedules] Patient ${patient.patientNumber}: loaded schedule with ${schedule.days?.length || 0} days`);
                    } else {
                        console.log(`[loadPatientSchedules] Patient ${patient.patientNumber}: no schedule found`);
                    }
                } catch (err) {
                    console.error(`[loadPatientSchedules] Error loading schedule for ${patient.patientNumber}:`, err);
                }
            }
            
            patientSchedulesFromDB = newSchedules;
            console.log("[loadPatientSchedules] Loaded schedules for", newSchedules.size, "patients");
        } catch (err) {
            console.error("[loadPatientSchedules] Error:", err);
        }
    }
    
    // Toggle patient availability for a specific date
    function togglePatientAvailability(patientId: string, date: Date, available: boolean) {
        const dateStr = formatDateString(date);
        const key = `${patientId}-${dateStr}`;
        
        // Create a new Map to trigger reactivity
        const newOverrides = new Map(availabilityOverrides);
        newOverrides.set(key, available);
        availabilityOverrides = newOverrides;
        
        // Also update the patientUnavailableDatesFromDB state to reflect the change immediately
        const newUnavailableDates = new Map(patientUnavailableDatesFromDB);
        const patientDates = new Set(newUnavailableDates.get(patientId) || []);
        
        if (available) {
            patientDates.delete(dateStr);
        } else {
            patientDates.add(dateStr);
        }
        newUnavailableDates.set(patientId, patientDates);
        patientUnavailableDatesFromDB = newUnavailableDates;
        
        // Track that this patient has pending saves
        pendingPatientSaves = new Set([...pendingPatientSaves, patientId]);
        
        // Debounce the save
        debouncedSavePatientAvailability();
        
        console.log(`[togglePatientAvailability] Toggled ${patientId} on ${dateStr}: now ${available ? 'available' : 'unavailable'}`);
    }
    
    // Debounced save for patient availability
    function debouncedSavePatientAvailability() {
        if (patientSaveDebounceTimer) {
            clearTimeout(patientSaveDebounceTimer);
        }
        
        patientSaveDebounceTimer = setTimeout(async () => {
            await savePatientAvailability();
        }, 1000); // 1 second debounce
    }
    
    // Save patient availability to database
    async function savePatientAvailability() {
        if (pendingPatientSaves.size === 0) return;
        
        console.log("[savePatientAvailability] Saving changes for patients:", Array.from(pendingPatientSaves));
        
        for (const patientId of pendingPatientSaves) {
            const patient = patients.find(p => p.id === patientId);
            if (!patient) continue;
            
            try {
                // Get unavailable dates from state
                const unavailableDates = patientUnavailableDatesFromDB.get(patientId) || new Set();
                const unavailableDatesArray = Array.from(unavailableDates).sort();
                
                // Save to database
                const success = await dataStore.setPatientUnavailableDates(patientId, unavailableDatesArray);
                
                if (success) {
                    console.log(`[savePatientAvailability] Saved ${patient.patientNumber}: ${unavailableDatesArray.length} unavailable dates`);
                } else {
                    console.error(`[savePatientAvailability] Failed to save ${patient.patientNumber}`);
                }
            } catch (err) {
                console.error(`[savePatientAvailability] Error saving ${patient.patientNumber}:`, err);
            }
        }
        
        // Clear pending saves
        pendingPatientSaves = new Set();
        
        // Clear overrides (they're now saved)
        availabilityOverrides = new Map();
    }

    // Get unique patient identifiers - include ALL patients from database, sorted by created date
    let uniquePatientIds = $derived.by(() => {
        // Start with all patients from the database
        const dbPatientIds = patients.map(p => p.patientNumber).filter(Boolean);
        
        // Also get any patient identifiers from the timeline (in case there are extras)
        const timelinePatientIds = timeline ? timeline.getUniquePatientIdentifiers() : [];
        
        // Combine and deduplicate
        const combined = [...dbPatientIds];
        for (const id of timelinePatientIds) {
            if (!combined.includes(id)) {
                combined.push(id);
            }
        }
        
        // Sort by created date (earliest first) so patient order remains stable
        // Patients with no created date go to the end
        combined.sort((a, b) => {
            // Find patient records by patientNumber
            const patientRecordA = patients.find(p => p.patientNumber === a);
            const patientRecordB = patients.find(p => p.patientNumber === b);
            
            const dateA = patientRecordA?.createdAt || null;
            const dateB = patientRecordB?.createdAt || null;
            
            // Patients without dates go to end
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            
            // Sort by date string (ISO format sorts correctly) - earliest first
            return dateA.localeCompare(dateB);
        });
        
        return combined;
    });

    // Get visible patients - filtered by quick filter (scrolling handles overflow)
    let visiblePatientIds = $derived.by(() => {
        if (!patientQuickFilter.trim()) {
            return uniquePatientIds;
        }
        
        const filter = patientQuickFilter.toLowerCase().trim();
        return uniquePatientIds.filter(patientId => {
            // Search in patient number
            if (patientId.toLowerCase().includes(filter)) {
                return true;
            }
            // Search in initials if available
            const patient = patients.find(p => p.patientNumber === patientId);
            if (patient?.initials && patient.initials.toLowerCase().includes(filter)) {
                return true;
            }
            return false;
        });
    });

    // Build patient-centric data structure purely from database schedules
    // Used when timeline is not available (model errors) to still display existing patient data
    function buildPatientCentricDataFromDatabase(): any {
        console.log("[buildPatientCentricDataFromDatabase] Building patient data from database schedules");
        const allPatientRecords = patients;
        const patientIds = uniquePatientIds;
        
        console.log("[buildPatientCentricDataFromDatabase] Patients:", allPatientRecords.length, "Patient IDs:", patientIds.length);
        console.log("[buildPatientCentricDataFromDatabase] Schedule map size:", patientSchedulesFromDB.size);
        
        // Find earliest reference date (FPFV) from database schedules
        let studyReferenceDate: Date | null = null;
        for (const patient of allPatientRecords) {
            const schedule = patientSchedulesFromDB.get(patient.id);
            console.log(`[buildPatientCentricDataFromDatabase] Patient ${patient.patientNumber} (${patient.id}): schedule =`, schedule ? `${schedule.days?.length || 0} days` : 'none');
            if (schedule && schedule.referenceDate) {
                const [year, month, day] = schedule.referenceDate.split('-').map(Number);
                const patientRefDate = new Date(year, month - 1, day, 0, 0, 0);
                if (!studyReferenceDate || patientRefDate < studyReferenceDate) {
                    studyReferenceDate = patientRefDate;
                }
            }
        }
        
        // Use today as fallback if no schedules
        if (!studyReferenceDate) {
            studyReferenceDate = new Date();
            studyReferenceDate.setHours(0, 0, 0, 0);
        }
        
        // Build patient data from database schedules
        const patientDataMap: any = {};
        
        for (const patientId of patientIds) {
            const patientRecord = allPatientRecords.find(p => p.patientNumber === patientId);
            if (!patientRecord) continue;
            
            const schedule = patientSchedulesFromDB.get(patientRecord.id);
            
            if (schedule && schedule.referenceDate) {
                // Patient has a schedule - use it directly
                const [year, month, day] = schedule.referenceDate.split('-').map(Number);
                const patientRefDate = new Date(year, month - 1, day, 0, 0, 0);
                const patientRefDateStr = schedule.referenceDate;
                
                // Convert database days format to the format expected by the UI
                const days: any[] = [];
                const dayWindowsMap = new Map<number, Array<{eventId: string, eventName: string}>>();
                
                for (const dbDay of (schedule.days || [])) {
                    const dayDate = dbDay.date || dayjs(patientRefDateStr).add(dbDay.day, 'day').format('YYYY-MM-DD');
                    
                    // Process events and collect window days
                    const events = (dbDay.events || []).map((event: any) => {
                        // Add window days for scheduled events
                        if (event.window && event.scheduledDay !== undefined) {
                            const windowStart = event.scheduledDay - (event.window.daysBefore || 0);
                            const windowEnd = event.scheduledDay + (event.window.daysAfter || 0);
                            for (let wd = windowStart; wd <= windowEnd; wd++) {
                                if (wd !== event.scheduledDay && wd !== dbDay.day) {
                                    if (!dayWindowsMap.has(wd)) {
                                        dayWindowsMap.set(wd, []);
                                    }
                                    dayWindowsMap.get(wd)!.push({
                                        eventId: event.id,
                                        eventName: event.name
                                    });
                                }
                            }
                        }
                        return event;
                    });
                    
                    days.push({
                        day: dbDay.day,
                        date: dayDate,
                        events
                    });
                }
                
                // Add window-only days (days that don't have events but are in a window)
                for (const [windowDay, windowEvents] of dayWindowsMap) {
                    // Check if this day already exists
                    const existingDay = days.find(d => d.day === windowDay);
                    if (!existingDay) {
                        const windowDate = dayjs(patientRefDateStr).add(windowDay, 'day').format('YYYY-MM-DD');
                        days.push({
                            day: windowDay,
                            date: windowDate,
                            events: [],
                            windows: windowEvents
                        });
                    } else if (!existingDay.windows) {
                        existingDay.windows = windowEvents;
                    }
                }
                
                // Sort days by day number
                days.sort((a, b) => a.day - b.day);
                
                patientDataMap[patientId] = {
                    patientId,
                    referenceDate: patientRefDateStr,
                    days
                };
            } else {
                // Patient doesn't have a schedule yet
                patientDataMap[patientId] = {
                    patientId,
                    referenceDate: null,
                    days: []
                };
            }
        }
        
        const result = {
            studyReferenceDate: formatDateString(studyReferenceDate),
            initialDayNumber: 0,
            patients: Object.values(patientDataMap)
        };
        
        console.log("[buildPatientCentricDataFromDatabase] Result:", {
            studyReferenceDate: result.studyReferenceDate,
            patientCount: result.patients.length,
            patientsWithDays: result.patients.filter((p: any) => p.days && p.days.length > 0).length
        });
        
        // Log details for first patient with days
        const firstPatientWithDays = result.patients.find((p: any) => p.days && p.days.length > 0) as any;
        if (firstPatientWithDays) {
            console.log("[buildPatientCentricDataFromDatabase] First patient with data:", {
                patientId: firstPatientWithDays.patientId,
                referenceDate: firstPatientWithDays.referenceDate,
                dayCount: firstPatientWithDays.days.length,
                firstDay: firstPatientWithDays.days[0],
                lastDay: firstPatientWithDays.days[firstPatientWithDays.days.length - 1]
            });
        }
        
        return result;
    }

    // Patient-centric data structure (simplified format)
    // IMPORTANT: This should work even when timeline is not available (model errors)
    // by using the database schedules directly
    let patientCentricData = $derived.by(() => {
        // Track dependencies: patientSchedulesFromDB, patients, uniquePatientIds
        // This ensures the derived recomputes when these change
        const schedules = patientSchedulesFromDB;
        const patientList = patients;
        const patientIdList = uniquePatientIds;
        
        // If no patients, return null
        if (patientList.length === 0) return null;
        
        // If no timeline but we have patients with database schedules, build from database
        if (!timeline) {
            console.log("[patientCentricData] No timeline available, building from database schedules");
            console.log("[patientCentricData] Patients:", patientList.length, "Schedules:", schedules.size);
            return buildPatientCentricDataFromDatabase();
        }
        
        const timelineRefDate = timeline.getReferenceDate();
        const patientIds = uniquePatientIds; // Array of patient ID strings
        const allPatientRecords = patients; // Array of patient objects from database
        const allDays = timeline.getDays();
        
        // Helper to get simplified window info from scheduled event (no hasBefore/hasAfter)
        const getWindowInfo = (scheduledEvent: any) => {
            try {
                const daysBefore = scheduledEvent.getStartDayOfWindow ? scheduledEvent.getStartDayOfWindow() : 0;
                const daysAfter = scheduledEvent.getEndDayOfWindow ? scheduledEvent.getEndDayOfWindow() : 0;
                return { daysBefore, daysAfter };
            } catch (e) {
                return { daysBefore: 0, daysAfter: 0 };
            }
        };
        
        // Helper to determine status from state (was stateClass)
        const getStatusFromState = (state: string | null): string => {
            if (!state) return 'pending';
            if (state === 'on-scheduled-date' || state === 'in-window' || state === 'out-of-window') {
                return 'completed';
            }
            if (state === 'canceled-visit') return 'cancelled';
            if (state === 'missed-visit') return 'missed';
            return 'pending';
        };
        
        // Helper to calculate state based on actualDay vs scheduledDay and window
        const calculateState = (actualDay: number, scheduledDay: number, window: any): string => {
            if (actualDay === scheduledDay) {
                return 'on-scheduled-date';
            }
            const windowStart = scheduledDay - (window?.daysBefore || 0);
            const windowEnd = scheduledDay + (window?.daysAfter || 0);
            if (actualDay >= windowStart && actualDay <= windowEnd) {
                return 'in-window';
            }
            return 'out-of-window';
        };
        
        // Helper to generate event ID
        const generateEventId = (eventName: string, index: number): string => {
            const slug = eventName.toLowerCase().replace(/\s+/g, '-');
            return `${slug}-${index}`;
        };
        
        // Helper to determine event type
        const getEventType = (status: string, isFromSchedule: boolean): string => {
            if (status === 'completed' || status === 'cancelled' || status === 'missed') {
                return 'actual-event';
            }
            return isFromSchedule ? 'scheduled-event' : 'unscheduled-event';
        };
        
        // First pass: Collect all scheduled events and patient events by patient
        const patientScheduledEvents = new Map<string, Map<string, any[]>>();
        const patientPatientEvents = new Map<string, Map<number, any[]>>();
        
        // Determine which patients have started the study using DATABASE schedules
        // A patient has started if they have a schedule with a referenceDate in the database
        const patientsWithHistory = new Set<string>();
        for (const patient of allPatientRecords) {
            const schedule = patientSchedulesFromDB.get(patient.id);
            if (schedule && schedule.referenceDate) {
                // Use patientNumber as the identifier (matches patientIds array)
                patientsWithHistory.add(patient.patientNumber);
            }
        }
        
        // Get all scheduled events - ONLY for patients who have started the study
        allDays.forEach(day => {
            const scheduledEvents = day.getEventInstances();
            scheduledEvents.forEach((e: any) => {
                const eventName = e.getName();
                const windowInfo = getWindowInfo(e);
                
                // Only add scheduled events to patients who have history (have started the study)
                patientIds.forEach(patientId => {
                    if (!patientsWithHistory.has(patientId)) {
                        return; // Skip patients without history - they haven't set day 0 yet
                    }
                    
                    if (!patientScheduledEvents.has(patientId)) {
                        patientScheduledEvents.set(patientId, new Map());
                    }
                    const patientEvents = patientScheduledEvents.get(patientId)!;
                    if (!patientEvents.has(eventName)) {
                        patientEvents.set(eventName, []);
                    }
                    patientEvents.get(eventName)!.push({
                        name: eventName,
                        scheduledDay: e.startDay,
                        window: windowInfo
                    });
                });
            });
        });
        
        // Get all patient events (but NOT unavailable days - those come from database now)
        allDays.forEach(day => {
            const patientEvents = day.getPatientEventInstances();
            patientEvents.forEach((e: any) => {
                const patientId = e.getPatientIdentifier ? e.getPatientIdentifier() : 'unknown';
                const eventName = e.getName();
                const eventTitle = e.getTitle ? e.getTitle() : null;
                const eventDay = e.startDay;
                
                // Skip unavailable events from DSL - we now use database for unavailability
                if (eventTitle === "Patient Unavailable" || eventName === "Patient Not Available") {
                    return; // Don't process DSL unavailable events
                }
                
                if (!patientPatientEvents.has(patientId)) {
                    patientPatientEvents.set(patientId, new Map());
                }
                const patientDayEvents = patientPatientEvents.get(patientId)!;
                if (!patientDayEvents.has(eventDay)) {
                    patientDayEvents.set(eventDay, []);
                }
                patientDayEvents.get(eventDay)!.push({
                    name: eventName,
                    actualDay: eventDay,
                    state: e.getClassForDisplay ? e.getClassForDisplay(timeline) : null
                });
            });
        });
        
        // Build patient-centric structure
        const patientData: any = {};
        const patientRefDates = new Map<string, Date>();
        const patientsWithDbReferenceDate = new Set<string>(); // Track patients with actual database reference dates
        
        // First pass: Calculate correct reference date for each patient from DATABASE schedules
        // Only patients with schedules in the database get a reference date
        patientIds.forEach(patientId => {
            let patientRefDate = timelineRefDate; // Default fallback for timeline calculations
            
            // Find patient record by patientNumber to get UUID
            const patientRecord = allPatientRecords.find(p => p.patientNumber === patientId);
            if (patientRecord) {
                const schedule = patientSchedulesFromDB.get(patientRecord.id);
                if (schedule && schedule.referenceDate) {
                    const [year, month, day] = schedule.referenceDate.split('-').map(Number);
                    patientRefDate = new Date(year, month - 1, day, 0, 0, 0);
                    patientsWithDbReferenceDate.add(patientId); // Mark as having actual reference date
                }
            }
            
            patientRefDates.set(patientId, patientRefDate);
        });
        
        // Calculate study reference date (earliest patient reference date - FPFV)
        // Only use patients who have actual reference dates from the database
        let studyReferenceDate: Date | null = null;
        if (patientsWithDbReferenceDate.size > 0) {
            const dbPatientDates = Array.from(patientsWithDbReferenceDate)
                .map(patientId => patientRefDates.get(patientId)!)
                .filter(date => date !== null);
            if (dbPatientDates.length > 0) {
                studyReferenceDate = dbPatientDates.reduce((earliest, date) => 
                    date < earliest ? date : earliest, dbPatientDates[0]);
            }
        }
        
        // Event ID counters per event name
        const eventIdCounters = new Map<string, number>();
        const getNextEventId = (eventName: string): string => {
            const count = (eventIdCounters.get(eventName) || 0) + 1;
            eventIdCounters.set(eventName, count);
            return generateEventId(eventName, count);
        };
        
        // Second pass: Build patient data with new simplified structure
        patientIds.forEach(patientId => {
            const patientRefDate = patientRefDates.get(patientId)!;
            const scheduledEvents = patientScheduledEvents.get(patientId) || new Map();
            const patientEvents = patientPatientEvents.get(patientId) || new Map();
            
            // Reset event ID counters for each patient
            eventIdCounters.clear();
            
            // Calculate day offset to convert timeline days to patient days
            // Uses shared getCalendarDayDiff to avoid timezone issues
            const dayOffset = getCalendarDayDiff(timelineRefDate, patientRefDate);
            const toPatientDay = (timelineDay: number) => timelineDay + dayOffset;
            
            const eventDays = new Set<number>(); // Patient days with events
            const dayEvents = new Map<number, any[]>(); // day -> events
            const dayWindowsMap = new Map<number, Array<{eventId: string, eventName: string}>>(); // Patient days that are windows -> event info
            const dayUnavailable = new Set<number>(); // Patient days that are unavailable
            
            // Get unavailable dates from database (by patient UUID) and convert to day numbers
            const patientRecord = allPatientRecords.find(p => p.patientNumber === patientId);
            if (patientRecord) {
                const unavailableDates = patientUnavailableDatesFromDB.get(patientRecord.id) || new Set();
                unavailableDates.forEach(dateStr => {
                    // Convert date string to day number relative to patient reference date
                    const [year, month, day] = dateStr.split('-').map(Number);
                    const unavailableDate = new Date(year, month - 1, day);
                    const dayNum = getCalendarDayDiff(unavailableDate, patientRefDate);
                    dayUnavailable.add(dayNum);
                });
            }
            
            // Process scheduled events and mark status
            scheduledEvents.forEach((events, eventName) => {
                events.forEach((scheduledEvent: any) => {
                    const scheduledDayInStudy = scheduledEvent.scheduledDay;
                    const scheduledTimelineDay = scheduledEvent.scheduledDay;
                    
                    let status = 'pending';
                    let actualDay: number | null = null;
                    let state: string | null = null;
                    
                    const window = scheduledEvent.window;
                    const windowStart = scheduledTimelineDay - window.daysBefore;
                    const windowEnd = scheduledTimelineDay + window.daysAfter;
                    
                    const patientEventEntries = Array.from(patientEvents.entries());
                    
                    // First pass: look within window
                    for (const [eventTimelineDay, evts] of patientEventEntries) {
                        const matchingEvent = evts.find((e: any) => e.name === eventName);
                        if (matchingEvent && eventTimelineDay >= windowStart && eventTimelineDay <= windowEnd) {
                            status = getStatusFromState(matchingEvent.state);
                            actualDay = toPatientDay(eventTimelineDay);
                            state = calculateState(actualDay, scheduledDayInStudy, scheduledEvent.window);
                            
                            eventDays.add(actualDay);
                            if (!dayEvents.has(actualDay)) {
                                dayEvents.set(actualDay, []);
                            }
                            // For completed events, include actualDay (immutable, from source data)
                            dayEvents.get(actualDay)!.push({
                                id: getNextEventId(eventName),
                                type: getEventType(status, true),
                                name: eventName,
                                actualDay: actualDay, // Immutable: only set from source data or popup
                                scheduledDay: scheduledDayInStudy,
                                status,
                                state,
                                window: scheduledEvent.window
                            });
                            break;
                        }
                    }
                    
                    // Second pass: if not found in window, look for ANY completed event
                    if (status === 'pending') {
                        for (const [eventTimelineDay, evts] of patientEventEntries) {
                            const matchingEvent = evts.find((e: any) => e.name === eventName);
                            if (matchingEvent) {
                                const eventStatus = getStatusFromState(matchingEvent.state);
                                if (eventStatus === 'completed') {
                                    status = eventStatus;
                                    actualDay = toPatientDay(eventTimelineDay);
                                    state = calculateState(actualDay, scheduledDayInStudy, scheduledEvent.window);
                                    
                                    eventDays.add(actualDay);
                                    if (!dayEvents.has(actualDay)) {
                                        dayEvents.set(actualDay, []);
                                    }
                                    // For completed events, include actualDay (immutable, from source data)
                                    dayEvents.get(actualDay)!.push({
                                        id: getNextEventId(eventName),
                                        type: getEventType(status, true),
                                        name: eventName,
                                        actualDay: actualDay, // Immutable: only set from source data or popup
                                        scheduledDay: scheduledDayInStudy,
                                        status,
                                        state,
                                        window: scheduledEvent.window
                                    });
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Show scheduled event if status is pending
                    if (status === 'pending') {
                        eventDays.add(scheduledDayInStudy);
                        if (!dayEvents.has(scheduledDayInStudy)) {
                            dayEvents.set(scheduledDayInStudy, []);
                        }
                        // Generate the event ID once and reuse for both event and windows
                        const eventId = getNextEventId(eventName);
                        dayEvents.get(scheduledDayInStudy)!.push({
                            id: eventId,
                            type: 'scheduled-event',
                            name: eventName,
                            scheduledDay: scheduledDayInStudy,
                            status: 'pending',
                            state: 'on-scheduled-date',
                            window: scheduledEvent.window
                        });
                        
                        // Add window days for future days
                        const today = getCalendarDayDiff(new Date(), patientRefDate);
                        if (scheduledDayInStudy >= today) {
                            for (let d = scheduledDayInStudy - window.daysBefore; d <= scheduledDayInStudy + window.daysAfter; d++) {
                                if (d !== scheduledDayInStudy && d >= today && !eventDays.has(d)) {
                                    if (!dayWindowsMap.has(d)) {
                                        dayWindowsMap.set(d, []);
                                    }
                                    // Add this event to the windows array for this day (use same eventId)
                                    dayWindowsMap.get(d)!.push({ eventId, eventName });
                                }
                            }
                        }
                    }
                });
            });
            
            // Add patient events that don't have corresponding scheduled events (unscheduled events)
            patientEvents.forEach((events, eventTimelineDay) => {
                const eventPatientDay = toPatientDay(eventTimelineDay);
                events.forEach((event: any) => {
                    // Check if this event was already added as a scheduled event
                    const existingEvents = dayEvents.get(eventPatientDay) || [];
                    const alreadyAdded = existingEvents.some((e: any) => e.name === event.name);
                    
                    if (!alreadyAdded) {
                        eventDays.add(eventPatientDay);
                        if (!dayEvents.has(eventPatientDay)) {
                            dayEvents.set(eventPatientDay, []);
                        }
                        const status = getStatusFromState(event.state);
                        const isCompleted = status === 'completed' || status === 'cancelled' || status === 'missed';
                        
                        const eventObj: any = {
                            id: getNextEventId(event.name),
                            type: getEventType(status, false), // Not from schedule
                            name: event.name,
                            scheduledDay: eventPatientDay,
                            status,
                            state: event.state || 'on-scheduled-date',
                            window: { daysBefore: 0, daysAfter: 0 }
                        };
                        
                        // For completed events, include actualDay (immutable, from source data)
                        if (isCompleted) {
                            eventObj.actualDay = eventPatientDay;
                        }
                        
                        dayEvents.get(eventPatientDay)!.push(eventObj);
                    }
                });
            });
            
            // Build days array - include event days and window days only
            // NOTE: Availability is stored separately and NOT included in schedule data
            const allDaysForPatient = new Set<number>();
            eventDays.forEach(d => allDaysForPatient.add(d));
            dayWindowsMap.forEach((_, d) => allDaysForPatient.add(d));
            // dayUnavailable is NOT added here - availability is separate from schedule
            const sortedDays = Array.from(allDaysForPatient).sort((a, b) => a - b);
            
            const patientDays = sortedDays.map(day => {
                const date = new Date(patientRefDate);
                date.setDate(date.getDate() + day);
                // Use local date formatting to avoid timezone shifts
                const dayStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                
                const eventsForDay = dayEvents.get(day) || [];
                const windowsForDay = dayWindowsMap.get(day) || [];
                
                // Build day object - schedule data only, no availability
                const dayObj: any = {
                    day,
                    date: dayStr
                };
                
                // Add events if any
                if (eventsForDay.length > 0) {
                    dayObj.events = eventsForDay;
                }
                
                // Add windows array if it's a window day with no events
                if (windowsForDay.length > 0 && eventsForDay.length === 0) {
                    dayObj.windows = windowsForDay;
                }
                
                return dayObj;
            });
            
            // Check if patient has schedule data from database
            const patientUUID = patientRecord?.id;
            const dbSchedule = patientUUID ? patientSchedulesFromDB.get(patientUUID) : null;
            
            if (dbSchedule && dbSchedule.referenceDate) {
                // Patient has a reference date - merge database schedule with projected events
                console.log(`[patientCentricData] Merging database schedule with projected events for patient ${patientId}`);
                
                // Create a map of database events by day for merging
                const dbDayMap = new Map<number, any>();
                for (const dbDay of (dbSchedule.days || [])) {
                    dbDayMap.set(dbDay.day, dbDay);
                }
                
                // IMPORTANT: Build a set of all event IDs that exist in the database
                // This prevents re-adding projected events that have been rescheduled to a different day
                const dbEventIds = new Set<string>();
                for (const dbDay of (dbSchedule.days || [])) {
                    for (const event of (dbDay.events || [])) {
                        if (event.id) {
                            dbEventIds.add(event.id);
                        }
                    }
                }
                
                // Merge: database events take priority, then add projected events for days not in database
                const mergedDays: any[] = [];
                const processedDays = new Set<number>();
                
                // Track window days for rescheduled events - these need to be added dynamically
                // Key: day number, Value: array of { eventId, eventName }
                const rescheduledWindowDays = new Map<number, Array<{eventId: string, eventName: string}>>();
                
                // First, add all database days (these have actual/recorded status)
                for (const dbDay of (dbSchedule.days || [])) {
                    mergedDays.push(dbDay);
                    processedDays.add(dbDay.day);
                    
                    // Check for rescheduled events - if originalScheduledDay !== scheduledDay,
                    // we need to add the original day (and window range) as window days
                    for (const event of (dbDay.events || [])) {
                        if (event.originalScheduledDay !== undefined && event.originalScheduledDay !== event.scheduledDay) {
                            const originalDay = event.originalScheduledDay;
                            const window = event.window || { daysBefore: 0, daysAfter: 0 };
                            const windowStart = originalDay - (window.daysBefore || 0);
                            const windowEnd = originalDay + (window.daysAfter || 0);
                            
                            // Add all days in the original window range as window days
                            // (excluding the current scheduled day where the event now is)
                            for (let d = windowStart; d <= windowEnd; d++) {
                                if (d !== event.scheduledDay) {
                                    if (!rescheduledWindowDays.has(d)) {
                                        rescheduledWindowDays.set(d, []);
                                    }
                                    // Check if this event is already in the windows for this day
                                    const existing = rescheduledWindowDays.get(d)!.find(w => w.eventId === event.id);
                                    if (!existing) {
                                        rescheduledWindowDays.get(d)!.push({
                                            eventId: event.id,
                                            eventName: event.name
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Then, add projected days that aren't already in the database
                // BUT filter out any projected events whose IDs already exist in the database
                // (this handles rescheduled events - they exist on a different day in DB)
                for (const projectedDay of patientDays) {
                    if (!processedDays.has(projectedDay.day)) {
                        // Filter projected events to exclude any that already exist in database
                        const filteredEvents = (projectedDay.events || []).filter((event: any) => {
                            const eventExists = event.id && dbEventIds.has(event.id);
                            if (eventExists) {
                                console.log(`[patientCentricData] Skipping projected event ${event.id} on day ${projectedDay.day} - already exists in database`);
                            }
                            return !eventExists;
                        });
                        
                        // Merge rescheduled window entries with projected windows
                        let mergedWindows = projectedDay.windows ? [...projectedDay.windows] : [];
                        const rescheduledWindows = rescheduledWindowDays.get(projectedDay.day);
                        if (rescheduledWindows) {
                            for (const rw of rescheduledWindows) {
                                const existing = mergedWindows.find(w => w.eventId === rw.eventId);
                                if (!existing) {
                                    mergedWindows.push(rw);
                                }
                            }
                            // Remove from map since we've processed it
                            rescheduledWindowDays.delete(projectedDay.day);
                        }
                        
                        // Only add the day if it has events or windows after filtering
                        if (filteredEvents.length > 0 || mergedWindows.length > 0) {
                            mergedDays.push({
                                ...projectedDay,
                                events: filteredEvents.length > 0 ? filteredEvents : undefined,
                                windows: mergedWindows.length > 0 ? mergedWindows : undefined
                            });
                            processedDays.add(projectedDay.day);
                        }
                    }
                }
                
                // Add any remaining rescheduled window days that weren't in projected days
                for (const [dayNum, windowEntries] of rescheduledWindowDays) {
                    if (!processedDays.has(dayNum)) {
                        // Calculate the date for this day
                        const date = new Date(dbSchedule.referenceDate + 'T00:00:00');
                        date.setDate(date.getDate() + dayNum);
                        const dayStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        
                        mergedDays.push({
                            day: dayNum,
                            date: dayStr,
                            windows: windowEntries
                        });
                        processedDays.add(dayNum);
                    }
                }
                
                // Sort by day number
                mergedDays.sort((a, b) => a.day - b.day);
                
                patientData[patientId] = {
                    patientId,
                    referenceDate: dbSchedule.referenceDate,
                    days: mergedDays
                };
            } else {
                // Patient has no schedule in database - don't set referenceDate
                // referenceDate is only set when patient has a planned or completed day 0 event
                const patientObj: any = {
                    patientId,
                    days: patientDays
                };
                // Only include referenceDate if patient has one from database
                if (patientsWithDbReferenceDate.has(patientId)) {
                    patientObj.referenceDate = formatDateString(patientRefDate);
                }
                patientData[patientId] = patientObj;
            }
        });
        
        // Build result object - only include studyReferenceDate if at least one patient has one
        const result: any = {
            initialDayNumber: 0, // Some studies use Day 0, others use Day 1 as the first day
            patients: Object.values(patientData)
        };
        
        // Only include studyReferenceDate if at least one patient has a reference date
        if (studyReferenceDate !== null) {
            result.studyReferenceDate = formatDateString(studyReferenceDate);
        }
        
        return result;
    });

    // Get staff availability data
    let staffData = $derived.by(() => {
        if (!timeline) return new Map<string, Map<number, number>>();
        
        const staffMap = new Map<string, Map<number, number>>();
        const days = timeline.getDays();
        
        let baselineStaff = 0;
        try {
            const timelineAny = timeline as any;
            if (timelineAny.availability && timelineAny.availability.baselineStaff !== undefined) {
                baselineStaff = Number(timelineAny.availability.baselineStaff) || 0;
            }
        } catch (e) {
            baselineStaff = 0;
        }
        const staffName = baselineStaff > 0 ? `Staff(${baselineStaff})` : "Staff";
        
        for (const day of days) {
            const staffEvents = day.getStaffAvailabilityEventInstances();
            if (staffEvents.length > 0) {
                if (!staffMap.has(staffName)) {
                    staffMap.set(staffName, new Map());
                }
                const dayMap = staffMap.get(staffName)!;
                const staffCount = staffEvents[0]?.getStaffAvailable() ?? baselineStaff;
                dayMap.set(day.day, staffCount);
            } else if (baselineStaff > 0) {
                if (!staffMap.has(staffName)) {
                    staffMap.set(staffName, new Map());
                }
                const dayMap = staffMap.get(staffName)!;
                dayMap.set(day.day, baselineStaff);
            }
        }
        
        return staffMap;
    });

    // Get filtered staff (from real staff members, filtered by quick filter)
    let filteredStaffMembers = $derived.by(() => {
        if (!staffQuickFilter.trim()) {
            return staffMembers;
        }
        
        const filter = staffQuickFilter.toLowerCase().trim();
        return staffMembers.filter(staff => 
            staff.name.toLowerCase().includes(filter)
        );
    });
    
    // Get visible staff (filtered and paginated)
    let visibleStaff = $derived.by(() => {
        const start = staffScrollOffset2;
        const end = Math.min(start + STAFF_MEMBERS_PER_PAGE, filteredStaffMembers.length);
        return filteredStaffMembers.slice(start, end);
    });

    // Get day data for a specific patient and date from the patient-centric structure
    // Uses date string (YYYY-MM-DD) for lookup since patient days are relative to patient reference date
    function getPatientDayData(day: number, patientId: string): any {
        if (!patientCentricData || !patientCentricData.patients) {
            // Only log once per patient to avoid spam
            if (day === 0) {
                console.log(`[getPatientDayData] No patientCentricData for ${patientId}`);
            }
            return null;
        }
        const patient = (patientCentricData.patients as any[]).find((p: any) => p.patientId === patientId);
        if (!patient || !patient.days) {
            if (day === 0) {
                console.log(`[getPatientDayData] No patient or days for ${patientId}, patients:`, patientCentricData.patients?.length);
            }
            return null;
        }
        
        // Convert timeline day to date string for lookup
        const dateForDay = getDateFromDay(day);
        const dateStr = formatDateString(dateForDay);
        
        // Find patient day by date (not by day number, since patient days are relative to patient's reference)
        const dayData = (patient.days as any[]).find((d: any) => d.date === dateStr);
        
        // Log found data for debugging (only for day 0 to avoid spam)
        if (day === 0 && patientId === 'ARCX-1001') {
            console.log(`[getPatientDayData] ${patientId} day ${day} (${dateStr}):`, dayData ? `found ${dayData.events?.length || 0} events` : 'not found');
            console.log(`[getPatientDayData] ${patientId} has ${patient.days.length} days, ref: ${patient.referenceDate}`);
            if (!dayData && patient.days.length > 0) {
                console.log(`[getPatientDayData] First 3 days:`, patient.days.slice(0, 3).map((d: any) => d.date));
            }
        }
        
        return dayData;
    }

    // Get event rendering info for a day (uses simplified structure)
    function getDayRenderingInfo(day: number, patientId: string): { isWindow: boolean; event: any | null; state: string; isActual: boolean; eventType: string; isUnscheduledEvent: boolean } {
        const dayData = getPatientDayData(day, patientId);
        if (!dayData) {
            return { isWindow: false, event: null, state: '', isActual: false, eventType: '', isUnscheduledEvent: false };
        }
        
        // If it's a window day with no events (check both new windows array and legacy isWindow)
        if ((dayData.windows && dayData.windows.length > 0) || dayData.isWindow) {
            return { isWindow: true, event: null, state: '', isActual: false, eventType: '', isUnscheduledEvent: false };
        }
        
        // Get the first event (unavailable days are now handled via available: false flag)
        const event = dayData.events && dayData.events.length > 0 ? dayData.events[0] : null;
        if (!event) {
            return { isWindow: false, event: null, state: '', isActual: false, eventType: '', isUnscheduledEvent: false };
        }
        
        // Determine if it's actual based on event type
        const isActual = event.type === 'actual-event';
        const eventType = event.type || 'scheduled-event';
        
        // Check if event is an unscheduled event (via flag or type)
        const isUnscheduledEvent = event.isUnscheduledEvent === true || eventType === 'unscheduled-event';
        
        // Get state directly from event (already computed in data)
        let state = event.state || 'on-scheduled-date';
        
        // Handle cancelled/missed status with specific state values
        if (event.status === 'cancelled') {
            state = 'canceled-visit';
        } else if (event.status === 'missed') {
            state = 'missed-visit';
        }
        
        return { isWindow: false, event, state, isActual, eventType, isUnscheduledEvent };
    }

    // Get events for a specific day and patient (legacy function, kept for compatibility)
    function getPatientEventsForDay(day: number, patientId: string): any[] {
        if (!timeline) return [];
        const timelineDay = timeline.getDays().find(d => d.day === day);
        if (!timelineDay) return [];
        
        return timelineDay.getPatientEventInstances().filter((event: any) => {
            const id = event.getPatientIdentifier();
            return id === patientId;
        });
    }

    // Get scheduled events for a day (windows)
    function getScheduledEventsForDay(day: number): any[] {
        if (!timeline) return [];
        const timelineDay = timeline.getDays().find(d => d.day === day);
        if (!timelineDay) return [];
        return timelineDay.getEventInstances();
    }

    // Get staff availability for a day
    function getStaffAvailabilityForDay(day: number, staffName: string): number | null {
        const staffDayMap = staffData.get(staffName);
        if (!staffDayMap) return null;
        return staffDayMap.get(day) ?? null;
    }

    // Get event state class
    function getEventStateClass(event: any): string {
        if (!timeline) return "";
        
        if (event.getTitle && event.getTitle() === "Patient Unavailable") {
            return "not-available";
        }
        
        if (event.getClassForDisplay) {
            const className = event.getClassForDisplay(timeline);
            return className;
        }
        
        return "";
    }

    // Check if patient is unavailable on a day (checks overrides first, then database, then derived data)
    function isPatientUnavailable(day: number, patientId: string): boolean {
        // Check overrides first (user changes take precedence)
        const dateStr = formatDateString(getDateFromDay(day));
        const key = `${patientId}-${dateStr}`;
        if (availabilityOverrides.has(key)) {
            return !availabilityOverrides.get(key); // Map stores "available", we return "unavailable"
        }
        
        // Check database state directly (for patientId which is patientNumber)
        // Find the patient record to get UUID
        const patientRecord = patients.find(p => p.patientNumber === patientId || p.id === patientId);
        if (patientRecord) {
            const dbUnavailableDates = patientUnavailableDatesFromDB.get(patientRecord.id);
            if (dbUnavailableDates && dbUnavailableDates.has(dateStr)) {
                return true;
            }
        }
        
        // Fall back to derived data
        const dayData = getPatientDayData(day, patientId);
        if (!dayData) return false;
        return dayData.available === false;
    }

    // Check if a day is day 0 (first visit / reference day) for a patient
    function isPatientDayZero(day: number, patientId: string): boolean {
        // Get the patient's day data for this timeline day
        const dayData = getPatientDayData(day, patientId);
        
        // Day 0 is when the patient's day number equals 0
        // Check that dayData exists and has a day property
        return dayData !== null && dayData !== undefined && typeof dayData.day === 'number' && dayData.day === 0;
    }

    // Format status for tooltip display
    // Status should be: Planned, Completed, Cancelled, or Missed
    function formatStatus(status: string, state: string): string {
        if (status === 'completed') {
            if (state === 'on-scheduled-date') return 'Completed (on schedule)';
            if (state === 'in-window') return 'Completed (in window)';
            if (state === 'out-of-window') return 'Completed (out of window)';
            return 'Completed';
        }
        if (status === 'cancelled') return 'Cancelled';
        if (status === 'missed') return 'Missed';
        // For planned/pending events, show "Planned" with state info if rescheduled
        if (status === 'planned' || status === 'pending') {
            if (state === 'on-scheduled-date') return 'Planned';
            if (state === 'in-window') return 'Planned (in window)';
            if (state === 'out-of-window') return 'Planned (out of window)';
            return 'Planned';
        }
        return status;
    }

    // Format date for tooltip display: d-MMM-yyyy
    function formatTooltipDate(dateStr: string): string {
        const [year, month, dayNum] = dateStr.split('-').map(Number);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${dayNum}-${months[month - 1]}-${year}`;
    }

    // Handle mouse enter for tooltip
    function handleCellMouseEnter(e: MouseEvent, day: number, patientId: string) {
        // Don't show tooltip if popup is open
        if (popupOpen) return;
        
        const dayData = getPatientDayData(day, patientId);
        
        // Get date for this cell using dayjs (consistent with handleCellClick)
        const timelineRefDateStr = timeline ? dayjs(timeline.getReferenceDate()).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
        const dateStr = dayData?.date ?? dayjs(timelineRefDateStr).add(day, 'day').format('YYYY-MM-DD');
        
        // Check if patient has any scheduled/actual events (not empty days array)
        let patientHasData = false;
        if (patientCentricData && patientCentricData.patients) {
            const patientData = (patientCentricData.patients as any[]).find((p: any) => p.patientId === patientId);
            patientHasData = patientData && patientData.days && patientData.days.length > 0;
        }
        
        // Calculate patient day number only if patient has data
        // Account for initialDayNumber (Day 0 vs Day 1 as first day)
        let patientDay: number | null = null;
        if (patientHasData) {
            patientDay = dayData?.day ?? day; // Default fallback
            if (patientCentricData && patientCentricData.patients) {
                const patientData = (patientCentricData.patients as any[]).find((p: any) => p.patientId === patientId);
                if (patientData && patientData.referenceDate) {
                    const initialDay = (patientCentricData as any).initialDayNumber ?? 0;
                    patientDay = dayjs(dateStr).diff(dayjs(patientData.referenceDate), 'day') + initialDay;
                }
            }
        }
        
        const tooltipEvents: Array<{ name: string; status: string }> = [];
        
        // If there are events, show them (events take precedence over windows)
        if (dayData && dayData.events && dayData.events.length > 0) {
            for (const event of dayData.events) {
                // Calculate state for this event
                let state = event.state || 'on-scheduled-date';
                if (event.status === 'cancelled') {
                    state = 'canceled-visit';
                } else if (event.status === 'missed') {
                    state = 'missed-visit';
                }
                
                const status = formatStatus(event.status, state);
                tooltipEvents.push({
                    name: event.name || 'Unknown',
                    status: status
                });
            }
        } 
        // Only show windows if there are NO events for this day
        else if (dayData && dayData.windows && dayData.windows.length > 0) {
            // New windows array format
            for (const window of dayData.windows) {
                tooltipEvents.push({
                    name: window.eventName || 'Unknown',
                    status: 'Window'
                });
            }
        } else if (dayData && dayData.isWindow) {
            // Legacy isWindow boolean format (for generated data)
            tooltipEvents.push({
                name: 'Window',
                status: 'Scheduled window'
            });
        }
        // For empty days (no dayData or no events/windows), tooltipEvents remains empty
        // and tooltip will just show date and patient ID
        
        // Always set tooltip content (for empty days too, just show date and patient ID)
        tooltipContent = {
            day: patientDay,
            date: formatTooltipDate(dateStr),
            patientId: patientId,
            events: tooltipEvents
        };
        tooltipPosition = { x: e.clientX, y: e.clientY };
        
        // Clear any existing timeout
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
        }
        
        // Show tooltip after short delay
        tooltipTimeout = setTimeout(() => {
            tooltipVisible = true;
        }, 300);
    }

    // Handle mouse move for tooltip - position is now static, set on enter
    function handleCellMouseMove(e: MouseEvent) {
        // Position is set once on mouseenter, no longer follows mouse
    }

    // Handle mouse leave for tooltip
    function handleCellMouseLeave() {
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = null;
        }
        tooltipVisible = false;
        tooltipContent = null;
    }

    // Determine popup type based on patient state and day data
    function determinePopupType(patientIdParam: string, day: number): PopupType {
        if (!patientCentricData || !patientCentricData.patients) return 'no-event';
        
        const patientData = (patientCentricData.patients as any[]).find((p: any) => p.patientId === patientIdParam);
        if (!patientData || !patientData.days) return 'initial';
        
        // Check if patient has a reference date (meaning they have a day 0 event set)
        const hasReferenceDate = !!patientData.referenceDate;
        
        // Check if clicked day has events
        const dayData = getPatientDayData(day, patientIdParam);
        const hasEvents = dayData?.events && dayData.events.length > 0;
        
        // If patient doesn't have a reference date yet, show initial popup
        if (!hasReferenceDate) return 'initial';
        
        // If clicked day has events, show event-day popup to edit them
        if (hasEvents) return 'event-day';
        
        // Patient has started but this day has no events - show no-event popup
        return 'no-event';
    }

    // Get Day 0 events from the timeline (computed by the simulator)
    // The simulator already computes which events are scheduled on which days
    function getDay0Events(): EventOption[] {
        if (!timeline) return [];
        
        const events: EventOption[] = [];
        const seenEventNames = new Set<string>();
        
        // Get all scheduled events from the timeline and find ones on day 0
        const allDays = timeline.getDays();
        for (const day of allDays) {
            const dayEvents = day.getEventInstances();
            for (const event of dayEvents) {
                // The event's startDay is the scheduled day number
                const scheduledDay = (event as any).startDay;
                const eventName = event.getName();
                
                // Day 0 event - add to list if not already seen
                if (scheduledDay === 0 && !seenEventNames.has(eventName)) {
                    seenEventNames.add(eventName);
                    events.push({
                        name: eventName,
                        id: eventName.toLowerCase().replace(/\s+/g, '-')
                    });
                }
            }
        }
        
        return events;
    }

    // Get unscheduled events from study configuration
    // Collects from both study-level and period-level unscheduledEvents arrays
    function getUnscheduledEvents(): EventOption[] {
        if (!studyConfig) return [];
        
        const events: EventOption[] = [];
        
        // Get study-level unscheduled events
        for (const unscheduledEvent of studyConfig.unscheduledEvents || []) {
            events.push({
                name: unscheduledEvent.name,
                id: unscheduledEvent.name.toLowerCase().replace(/\s+/g, '-')
            });
        }
        
        // Get period-level unscheduled events
        for (const period of studyConfig.periods || []) {
            for (const unscheduledEvent of period.unscheduledEvents || []) {
                events.push({
                    name: unscheduledEvent.name,
                    id: unscheduledEvent.name.toLowerCase().replace(/\s+/g, '-')
                });
            }
        }
        
        return events;
    }

    // Handle cell click to open popup
    function handleCellClick(event: MouseEvent, day: number, patientIdParam: string) {
        // Stop propagation to prevent the popup's window click handler from 
        // immediately closing the popup when clicking on a different day cell
        event.stopPropagation();
        
        // Hide tooltip immediately
        handleCellMouseLeave();
        
        // Get date for this day using dayjs (no Date objects, no timezone issues)
        // Use a fallback reference date if timeline is not available (model errors)
        let timelineRefDateStr: string;
        if (timeline) {
            timelineRefDateStr = dayjs(timeline.getReferenceDate()).format('YYYY-MM-DD');
        } else {
            // Fallback: use the earliest patient reference date from database, or today
            let fallbackDate = dayjs();
            for (const patient of patients) {
                const schedule = patientSchedulesFromDB.get(patient.id);
                if (schedule && schedule.referenceDate) {
                    const patientRefDate = dayjs(schedule.referenceDate);
                    if (patientRefDate.isBefore(fallbackDate)) {
                        fallbackDate = patientRefDate;
                    }
                }
            }
            timelineRefDateStr = fallbackDate.format('YYYY-MM-DD');
        }
        const dateStr = dayjs(timelineRefDateStr).add(day, 'day').format('YYYY-MM-DD');
        
        // In AVAILABILITY mode: toggle availability directly and save to database
        // This works even when the model is not available
        if (viewMode === 'availability') {
            // Find patient UUID from patientNumber
            const patientRecord = patients.find(p => p.patientNumber === patientIdParam || p.id === patientIdParam);
            if (!patientRecord) {
                console.error('[handleCellClick] Patient not found:', patientIdParam);
                return;
            }
            
            // Check current availability status
            const isCurrentlyUnavailable = isPatientUnavailable(day, patientIdParam);
            
            // Toggle: if unavailable, make available (true); if available, make unavailable (false)
            const [year, month, dayNum] = dateStr.split('-').map(Number);
            const clickedDate = new Date(year, month - 1, dayNum);
            togglePatientAvailability(patientRecord.id, clickedDate, isCurrentlyUnavailable);
            
            console.log(`[handleCellClick] Availability mode: toggled ${patientIdParam} on ${dateStr} to ${isCurrentlyUnavailable ? 'available' : 'unavailable'}`);
            return;
        }
        
        // In SCHEDULING mode: open popup for event scheduling
        // Determine popup type first to check if we should show popup at all
        const type = determinePopupType(patientIdParam, day);
        
        // Get unscheduled events to check if there are any actions available for 'no-event' days
        // NOTE: When there's a model error, this will return empty because studyConfig is not available
        const availableUnscheduledEvents = getUnscheduledEvents();
        
        // For 'no-event' days when there's NO model error and no unscheduled events,
        // don't show popup - there are truly no actions available
        // But when there IS a model error, we assume there might be unscheduled events we can't see
        if (!modelError && type === 'no-event' && availableUnscheduledEvents.length === 0) {
            return;
        }
        
        // Capture the clicked element as anchor for the popover
        popupAnchorElement = event.currentTarget as HTMLElement;
        
        // Set the model error state for the popup
        popupModelError = modelError;
        
        // Calculate patient day number (relative to patient's reference date, not timeline)
        let patientDayNumber = day; // Default fallback
        if (patientCentricData && patientCentricData.patients) {
            const patientData = (patientCentricData.patients as any[]).find((p: any) => p.patientId === patientIdParam);
            if (patientData && patientData.referenceDate) {
                // Use dayjs diff on date strings only (no Date objects)
                patientDayNumber = dayjs(dateStr).diff(dayjs(patientData.referenceDate), 'day');
            }
        }
        
        // Get day data from derived data
        const dayData = getPatientDayData(day, patientIdParam);
        
        // Check for availability override and merge it into dayData
        // Use existing day number from dayData if available, otherwise use calculated patientDayNumber
        const overrideKey = `${patientIdParam}-${dateStr}`;
        let mergedDayData: any;
        if (dayData) {
            // Use existing dayData with its day number (already correctly calculated)
            mergedDayData = { ...dayData };
        } else {
            // No existing dayData, create new with calculated day number
            mergedDayData = { day: patientDayNumber, date: dateStr };
        }
        
        if (availabilityOverrides.has(overrideKey)) {
            const isAvailable = availabilityOverrides.get(overrideKey);
            if (!isAvailable) {
                // Unavailable - set available: false
                mergedDayData.available = false;
            } else {
                // Available - remove available property if it exists
                if ('available' in mergedDayData) {
                    delete mergedDayData.available;
                }
            }
        }
        
        // Get scheduled events for this day (if any)
        const scheduledEvts: DayEvent[] = mergedDayData?.events || [];
        
        // Set popup state - parse dateStr back to Date for the popup (required by popup interface)
        const [year, month, dayNum] = dateStr.split('-').map(Number);
        popupDate = new Date(year, month - 1, dayNum);
        popupPatientId = patientIdParam;
        popupDayData = mergedDayData;
        popupType = type;
        popupScheduledEvents = scheduledEvts;
        day0Events = getDay0Events();
        unscheduledEvents = getUnscheduledEvents();
        
        // Open popup
        popupOpen = true;
    }

    // Handle popup apply (for event changes - availability is handled immediately via availabilityChange event)
    function handlePopupApply(result: PopupResult) {
        console.log('[handlePopupApply] Result:', result);
        console.log('[handlePopupApply] For patient:', popupPatientId, 'date:', popupDate);
        
        const dateString = formatDateString(popupDate);
        
        // Get the patient data from patientCentricData for event updates
        if (!patientCentricData || !patientCentricData.patients) {
            console.error('[handlePopupApply] No patient data available');
            popupOpen = false;
            return;
        }
        
        const patientData = (patientCentricData.patients as any[]).find((p: any) => p.patientId === popupPatientId);
        if (!patientData) {
            console.error('[handlePopupApply] Patient not found:', popupPatientId);
            popupOpen = false;
            return;
        }
        
        // Handle initial event (Popup 1) - this sets the reference date for the patient
        // For initial events (day 0), the reference date IS the popup date, and day number is always 0
        if (result.initialEvent?.enabled) {
            console.log('[handlePopupApply] Initial event:', result.initialEvent);
            
            // For initial events, the popup date becomes the patient's reference date
            // and the day number is always 0 (this is the definition of day 0)
            const dayNumber = 0;
            patientData.referenceDate = dateString; // Set the reference date to the popup date
            
            console.log('[handlePopupApply] Setting referenceDate to:', dateString, '(day 0 event)');
            
            // Find existing day 0 data or prepare to create new
            let existingDayIndex = patientData.days.findIndex((d: any) => d.day === dayNumber);
            let dayDataToUpdate = existingDayIndex >= 0 ? { ...patientData.days[existingDayIndex] } : null;
            
            if (!dayDataToUpdate) {
                dayDataToUpdate = {
                    day: dayNumber,
                    date: dateString
                };
                existingDayIndex = -1;
            }
            
            // Create or update events array
            if (!dayDataToUpdate.events) {
                dayDataToUpdate.events = [];
            }
            
            // Add the initial event
            const isCompleted = ['completed', 'cancelled', 'missed'].includes(result.initialEvent.status);
            const newEvent: any = {
                id: `${result.initialEvent.eventName.toLowerCase().replace(/\s+/g, '-')}-1`,
                type: isCompleted ? 'actual-event' : 'scheduled-event',
                name: result.initialEvent.eventName,
                scheduledDay: dayNumber,
                status: result.initialEvent.status,
                state: 'on-scheduled-date',
                window: { daysBefore: 0, daysAfter: 0 }
            };
            
            // For completed events, set actualDay (immutable, set by popup)
            if (isCompleted) {
                newEvent.actualDay = dayNumber;
            }
            
            dayDataToUpdate.events.push(newEvent);
            console.log('[handlePopupApply] Added initial event:', newEvent);
            
            // Also handle unscheduled event if included with initial popup
            if (result.unscheduledEvent?.enabled) {
                console.log('[handlePopupApply] Unscheduled event with initial:', result.unscheduledEvent);
                
                const isCompletedUnscheduled = ['completed', 'cancelled', 'missed'].includes(result.unscheduledEvent.status);
                const unscheduledNewEvent: any = {
                    id: `${result.unscheduledEvent.eventName.toLowerCase().replace(/\s+/g, '-')}-1`,
                    type: isCompletedUnscheduled ? 'actual-event' : 'unscheduled-event',
                    name: result.unscheduledEvent.eventName,
                    scheduledDay: dayNumber,
                    status: result.unscheduledEvent.status,
                    state: 'on-scheduled-date',
                    window: { daysBefore: 0, daysAfter: 0 },
                    isUnscheduledEvent: true  // Track that this is an unscheduled event for styling
                };
                
                // For completed events, set actualDay (immutable, set by popup)
                if (isCompletedUnscheduled) {
                    unscheduledNewEvent.actualDay = dayNumber;
                }
                
                dayDataToUpdate.events.push(unscheduledNewEvent);
                console.log('[handlePopupApply] Added unscheduled event with initial:', unscheduledNewEvent);
            }
            
            // Apply the day 0 changes
            if (existingDayIndex >= 0) {
                patientData.days[existingDayIndex] = dayDataToUpdate;
            } else {
                patientData.days.push(dayDataToUpdate);
                patientData.days.sort((a: any, b: any) => a.day - b.day);
            }
            
            // Save and close
            console.log('[handlePopupApply] Updated patient days:', JSON.stringify(patientData.days, null, 2));
            savePatientScheduleToDatabase(popupPatientId, patientData);
            popupOpen = false;
            return; // Initial events are handled separately
        }
        
        // For non-initial events, patient must have a reference date
        if (!patientData.referenceDate) {
            console.error('[handlePopupApply] Patient has no referenceDate - cannot process non-initial events');
            popupOpen = false;
            return;
        }
        
        // Calculate the patient day number for this date
        // Pass referenceDate string directly to dayjs (via getCalendarDayDiff) to avoid timezone issues
        // new Date('YYYY-MM-DD') parses as UTC, but dayjs('YYYY-MM-DD') parses as local time
        const dayNumber = getCalendarDayDiff(popupDate, patientData.referenceDate);
        
        console.log('[handlePopupApply] Day number:', dayNumber, 'Date string:', dateString);
        
        // Find existing day data or prepare to create new
        // IMPORTANT: Make a deep copy of the day data including events array to avoid mutating original
        let existingDayIndex = patientData.days.findIndex((d: any) => d.day === dayNumber);
        let dayDataToUpdate = existingDayIndex >= 0 ? { 
            ...patientData.days[existingDayIndex],
            events: patientData.days[existingDayIndex].events 
                ? [...patientData.days[existingDayIndex].events.map((e: any) => ({ ...e }))]
                : undefined
        } : null;
        
        // Handle scheduled events status changes (Popup 2)
        // result.scheduledEvents is an array of { eventId, eventName, action, newStatus?, rescheduleDate? }
        if (result.scheduledEvents && result.scheduledEvents.length > 0 && dayDataToUpdate?.events) {
            console.log('[handlePopupApply] Scheduled events:', result.scheduledEvents);
            
            for (const scheduledEventResult of result.scheduledEvents) {
                // Only process events with 'change-status' action
                if (scheduledEventResult.action === 'change-status' && scheduledEventResult.newStatus) {
                    console.log('[handlePopupApply] Processing status change for:', scheduledEventResult.eventName, 'to:', scheduledEventResult.newStatus);
                    
                    // Find the event by id or name
                    const eventIndex = dayDataToUpdate.events.findIndex(
                        (e: any) => e.id === scheduledEventResult.eventId || e.name === scheduledEventResult.eventName
                    );
                    
                    if (eventIndex >= 0) {
                        const event = dayDataToUpdate.events[eventIndex];
                        const isCompleted = ['completed', 'cancelled', 'missed'].includes(scheduledEventResult.newStatus);
                        event.status = scheduledEventResult.newStatus;
                        event.type = isCompleted ? 'actual-event' : 'scheduled-event';
                        
                        // For completed events, set actualDay if not already set (immutable, set by popup)
                        if (isCompleted && event.actualDay === undefined) {
                            event.actualDay = dayNumber;
                        }
                        
                        console.log('[handlePopupApply] Updated scheduled event:', event);
                    } else {
                        console.warn('[handlePopupApply] Event not found:', scheduledEventResult.eventId, scheduledEventResult.eventName);
                    }
                } else if (scheduledEventResult.action === 'reschedule' && scheduledEventResult.rescheduleDate) {
                    console.log('[handlePopupApply] Processing reschedule for:', scheduledEventResult.eventName, 'to:', scheduledEventResult.rescheduleDate);
                    
                    // Find the event in the current day
                    const eventIndex = dayDataToUpdate.events.findIndex(
                        (e: any) => e.id === scheduledEventResult.eventId || e.name === scheduledEventResult.eventName
                    );
                    
                    if (eventIndex >= 0) {
                        // Get the event and remove it from current day (dayDataToUpdate is already a deep copy)
                        const event = { ...dayDataToUpdate.events[eventIndex] };
                        dayDataToUpdate.events.splice(eventIndex, 1);
                        console.log('[handlePopupApply] Removed event from day', dayNumber);
                        
                        // Calculate the new day number from the reschedule date
                        // Use the date string directly with dayjs to avoid timezone issues
                        const newDayNumber = getCalendarDayDiff(scheduledEventResult.rescheduleDate, patientData.referenceDate);
                        console.log('[handlePopupApply] New day number:', newDayNumber, 'from date:', scheduledEventResult.rescheduleDate);
                        
                        // Update the event properties
                        // Store original scheduled day if not already stored (first reschedule)
                        const originalDay = event.originalScheduledDay !== undefined 
                            ? event.originalScheduledDay 
                            : event.scheduledDay;
                        if (event.originalScheduledDay === undefined) {
                            event.originalScheduledDay = event.scheduledDay;
                        }
                        event.scheduledDay = newDayNumber;
                        
                        // Calculate the correct state based on new day relative to original + window
                        const window = event.window || { daysBefore: 0, daysAfter: 0 };
                        const windowStart = originalDay - (window.daysBefore || 0);
                        const windowEnd = originalDay + (window.daysAfter || 0);
                        
                        if (newDayNumber === originalDay) {
                            event.state = 'on-scheduled-date';
                        } else if (newDayNumber >= windowStart && newDayNumber <= windowEnd) {
                            event.state = 'in-window';
                        } else {
                            event.state = 'out-of-window';
                        }
                        console.log('[handlePopupApply] Calculated state:', event.state, 
                            '(newDay:', newDayNumber, 'originalDay:', originalDay, 
                            'window:', windowStart, '-', windowEnd, ')');
                        
                        // Keep type as 'scheduled-event' since it's still scheduled
                        event.type = 'scheduled-event';
                        
                        // Note: Window days for rescheduled events are now calculated on-the-fly
                        // in patientCentricData based on originalScheduledDay !== scheduledDay
                        
                        // IMPORTANT: Update the source day in patientData.days IMMEDIATELY
                        // This must happen BEFORE we push/sort to avoid stale index issues
                        if (existingDayIndex >= 0) {
                            patientData.days[existingDayIndex] = dayDataToUpdate;
                            console.log('[handlePopupApply] Updated source day', dayNumber, 'at index', existingDayIndex);
                        }
                        
                        // Find or create the target day
                        let targetDayIndex = patientData.days.findIndex((d: any) => d.day === newDayNumber);
                        let targetDayData: any;
                        
                        if (targetDayIndex >= 0) {
                            // Day exists - make a deep copy for modification
                            targetDayData = { 
                                ...patientData.days[targetDayIndex],
                                events: patientData.days[targetDayIndex].events 
                                    ? [...patientData.days[targetDayIndex].events]
                                    : []
                            };
                            // If target day has window entries for this event, remove them since we're adding the actual event
                            if (targetDayData.windows) {
                                targetDayData.windows = targetDayData.windows.filter(
                                    (w: any) => w.eventId !== event.id
                                );
                                if (targetDayData.windows.length === 0) {
                                    delete targetDayData.windows;
                                }
                            }
                        } else {
                            // Create new day data
                            targetDayData = {
                                day: newDayNumber,
                                date: scheduledEventResult.rescheduleDate,
                                events: []
                            };
                        }
                        
                        // Add the event to the target day
                        targetDayData.events.push(event);
                        console.log('[handlePopupApply] Added event to day', newDayNumber, ':', event);
                        
                        // Update the patient data for target day
                        if (targetDayIndex >= 0) {
                            patientData.days[targetDayIndex] = targetDayData;
                        } else {
                            patientData.days.push(targetDayData);
                            // Sort days by day number
                            patientData.days.sort((a: any, b: any) => a.day - b.day);
                        }
                        
                        // Mark that we've already handled the source day update
                        // by re-finding the existingDayIndex (it may have changed after sort)
                        existingDayIndex = patientData.days.findIndex((d: any) => d.day === dayNumber);
                    } else {
                        console.warn('[handlePopupApply] Event not found for reschedule:', scheduledEventResult.eventId, scheduledEventResult.eventName);
                    }
                } else if (scheduledEventResult.action === 'move' && scheduledEventResult.rescheduleDate) {
                    // MOVE action: For day 0 and unscheduled events
                    // Key differences from reschedule:
                    // 1. Does NOT set originalScheduledDay (no window days created)
                    // 2. Day 0 events: reference date changes, event STAYS at day 0
                    // 3. Unscheduled events: move to new day, recalculate dependents
                    console.log('[handlePopupApply] Processing MOVE for:', scheduledEventResult.eventName, 'to:', scheduledEventResult.rescheduleDate);
                    
                    // Find the event in the current day
                    const eventIndex = dayDataToUpdate.events.findIndex(
                        (e: any) => e.id === scheduledEventResult.eventId || e.name === scheduledEventResult.eventName
                    );
                    
                    if (eventIndex >= 0) {
                        // Get the event and remove it from current day
                        const event = { ...dayDataToUpdate.events[eventIndex] };
                        dayDataToUpdate.events.splice(eventIndex, 1);
                        console.log('[handlePopupApply] Removed event from day', dayNumber, 'for move');
                        
                        // Check if this is a day 0 event (original scheduled day is 0)
                        const originalDay = event.originalScheduledDay !== undefined 
                            ? event.originalScheduledDay 
                            : event.scheduledDay;
                        const isDay0Event = originalDay === 0;
                        const isUnscheduledEvent = event.isUnscheduledEvent || event.type === 'unscheduled-event';
                        
                        // State is always 'on-scheduled-date' for moved events
                        event.state = 'on-scheduled-date';
                        
                        // Keep type consistent
                        if (isUnscheduledEvent) {
                            event.type = 'unscheduled-event';
                        } else {
                            event.type = 'scheduled-event';
                        }
                        
                        // Update the source day in patientData.days IMMEDIATELY
                        if (existingDayIndex >= 0) {
                            patientData.days[existingDayIndex] = dayDataToUpdate;
                            console.log('[handlePopupApply] Updated source day', dayNumber, 'at index', existingDayIndex);
                        }
                        
                        // SPECIAL HANDLING: Day 0 events
                        if (isDay0Event) {
                            console.log('[handlePopupApply] MOVE - Day 0 event moved! Event stays at day 0, reference date changes.');
                            
                            // Day 0 event ALWAYS stays at day 0 - only the reference date changes
                            event.scheduledDay = 0;
                            
                            // Update the reference date to the new date
                            const oldReferenceDate = patientData.referenceDate;
                            patientData.referenceDate = scheduledEventResult.rescheduleDate;
                            console.log('[handlePopupApply] MOVE - Reference date changed from', oldReferenceDate, 'to', scheduledEventResult.rescheduleDate);
                            
                            // Find or create day 0
                            let day0Index = patientData.days.findIndex((d: any) => d.day === 0);
                            let day0Data: any;
                            
                            if (day0Index >= 0) {
                                // Day 0 exists - make a deep copy
                                day0Data = { 
                                    ...patientData.days[day0Index],
                                    date: scheduledEventResult.rescheduleDate, // Update date
                                    events: patientData.days[day0Index].events 
                                        ? [...patientData.days[day0Index].events]
                                        : []
                                };
                            } else {
                                // Create day 0
                                day0Data = {
                                    day: 0,
                                    date: scheduledEventResult.rescheduleDate,
                                    events: []
                                };
                            }
                            
                            // Add the event to day 0
                            day0Data.events.push(event);
                            console.log('[handlePopupApply] MOVE - Added Day 0 event:', event);
                            
                            // Update the patient data for day 0
                            if (day0Index >= 0) {
                                patientData.days[day0Index] = day0Data;
                            } else {
                                patientData.days.push(day0Data);
                                patientData.days.sort((a: any, b: any) => a.day - b.day);
                            }
                            
                            // Recalculate all other days' dates based on new reference date
                            recalculateScheduleFromDay0(patientData, scheduledEventResult.rescheduleDate);
                        } else {
                            // Non-Day-0 events (unscheduled events): calculate new day number and move
                            const newDayNumber = getCalendarDayDiff(scheduledEventResult.rescheduleDate, patientData.referenceDate);
                            console.log('[handlePopupApply] MOVE - Unscheduled event new day number:', newDayNumber);
                            
                            event.scheduledDay = newDayNumber;
                            
                            // Find or create the target day
                            let targetDayIndex = patientData.days.findIndex((d: any) => d.day === newDayNumber);
                            let targetDayData: any;
                            
                            if (targetDayIndex >= 0) {
                                targetDayData = { 
                                    ...patientData.days[targetDayIndex],
                                    events: patientData.days[targetDayIndex].events 
                                        ? [...patientData.days[targetDayIndex].events]
                                        : []
                                };
                            } else {
                                targetDayData = {
                                    day: newDayNumber,
                                    date: scheduledEventResult.rescheduleDate,
                                    events: []
                                };
                            }
                            
                            // Add the event to the target day
                            targetDayData.events.push(event);
                            console.log('[handlePopupApply] MOVE - Added unscheduled event to day', newDayNumber, ':', event);
                            
                            // Update the patient data for target day
                            if (targetDayIndex >= 0) {
                                patientData.days[targetDayIndex] = targetDayData;
                            } else {
                                patientData.days.push(targetDayData);
                                patientData.days.sort((a: any, b: any) => a.day - b.day);
                            }
                            
                            // Recalculate any events that depend on this unscheduled event
                            console.log('[handlePopupApply] MOVE - Unscheduled event moved! Checking for dependent events...');
                            recalculateDependentEvents(patientData, event, newDayNumber);
                        }
                        
                        // Re-find existingDayIndex after potential changes
                        existingDayIndex = patientData.days.findIndex((d: any) => d.day === dayNumber);
                    } else {
                        console.warn('[handlePopupApply] Event not found for move:', scheduledEventResult.eventId, scheduledEventResult.eventName);
                    }
                } else if (scheduledEventResult.action === 'delete') {
                    console.log('[handlePopupApply] Processing delete for:', scheduledEventResult.eventName);
                    
                    // Find and remove the event from the current day
                    const eventIndex = dayDataToUpdate.events.findIndex(
                        (e: any) => e.id === scheduledEventResult.eventId || e.name === scheduledEventResult.eventName
                    );
                    
                    if (eventIndex >= 0) {
                        const deletedEvent = dayDataToUpdate.events[eventIndex];
                        dayDataToUpdate.events.splice(eventIndex, 1);
                        console.log('[handlePopupApply] Deleted event:', deletedEvent.name, 'from day', dayNumber);
                        
                        // Update the source day immediately
                        if (existingDayIndex >= 0) {
                            patientData.days[existingDayIndex] = dayDataToUpdate;
                        }
                    } else {
                        console.warn('[handlePopupApply] Event not found for delete:', scheduledEventResult.eventId, scheduledEventResult.eventName);
                    }
                }
            }
        }
        
        // Handle unscheduled event (Popup 2 & 3)
        if (result.unscheduledEvent?.enabled) {
            console.log('[handlePopupApply] Unscheduled event:', result.unscheduledEvent);
            
            if (!dayDataToUpdate) {
                dayDataToUpdate = {
                    day: dayNumber,
                    date: dateString
                };
                existingDayIndex = -1;
            }
            
            if (!dayDataToUpdate.events) {
                dayDataToUpdate.events = [];
            }
            
            // Add the unscheduled event
            const isCompletedUnscheduled = ['completed', 'cancelled', 'missed'].includes(result.unscheduledEvent.status);
            const newEvent: any = {
                id: `${result.unscheduledEvent.eventName.toLowerCase().replace(/\s+/g, '-')}-1`,
                type: isCompletedUnscheduled ? 'actual-event' : 'unscheduled-event',
                name: result.unscheduledEvent.eventName,
                scheduledDay: dayNumber,
                status: result.unscheduledEvent.status,
                state: 'on-scheduled-date',
                window: { daysBefore: 0, daysAfter: 0 },
                isUnscheduledEvent: true  // Track that this is an unscheduled event for styling
            };
            
            // For completed events, set actualDay (immutable, set by popup)
            if (isCompletedUnscheduled) {
                newEvent.actualDay = dayNumber;
            }
            
            dayDataToUpdate.events.push(newEvent);
            console.log('[handlePopupApply] Added unscheduled event:', newEvent);
        }
        
        // Apply changes to patient data (in-memory update for event changes)
        if (dayDataToUpdate) {
            if (existingDayIndex >= 0) {
                // Update existing day
                patientData.days[existingDayIndex] = dayDataToUpdate;
                console.log('[handlePopupApply] Updated day in patient data');
            } else {
                // Add new day
                patientData.days.push(dayDataToUpdate);
                // Sort days by day number
                patientData.days.sort((a: any, b: any) => a.day - b.day);
                console.log('[handlePopupApply] Added new day to patient data');
            }
        }
        
        // Log the updated data for debugging
        console.log('[handlePopupApply] Updated patient days:', JSON.stringify(patientData.days, null, 2));
        
        // Save patient schedule to database
        savePatientScheduleToDatabase(popupPatientId, patientData);
        
        popupOpen = false;
    }
    
    // Recalculate all days' calendar dates when a Day 0 event is moved
    // When Day 0 is moved to a new date:
    // - The reference date has already been changed (before this function is called)
    // - Day 0 event stays at day 0 with the new date
    // - All other events maintain their relative day numbers (day 7 stays day 7)
    // - But their calendar dates are recalculated based on the new reference date
    function recalculateScheduleFromDay0(patientData: any, newReferenceDate: string) {
        console.log('[recalculateScheduleFromDay0] Recalculating dates from new reference:', newReferenceDate);
        
        // Update all days: their day numbers stay the same, but dates are recalculated
        for (const day of patientData.days) {
            // Calculate new date based on new reference date and existing day number
            const newDate = new Date(newReferenceDate + 'T00:00:00');
            newDate.setDate(newDate.getDate() + day.day);
            day.date = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
            
            // Update events within this day
            if (day.events) {
                for (const event of day.events) {
                    // For non-actual events, clear any originalScheduledDay
                    // since we're doing a full recalculation from the new reference
                    if (event.type !== 'actual-event') {
                        delete event.originalScheduledDay;
                        event.state = 'on-scheduled-date';
                    }
                }
            }
        }
        
        console.log('[recalculateScheduleFromDay0] All days recalculated with new dates');
    }
    
    // Recalculate events that depend on a moved unscheduled event
    // This handles cases where other events have their scheduling relative to this event
    function recalculateDependentEvents(patientData: any, movedEvent: any, newDayNumber: number) {
        console.log('[recalculateDependentEvents] Checking for events dependent on:', movedEvent.name);
        
        // TODO: In the future, we may need to query the study configuration to find
        // events that have scheduling dependencies on this event (e.g., "X days after Event Y")
        // For now, we log that this would need implementation based on the study's DSL model
        
        // The simulation service would be used here to re-run the schedule calculation
        // for events that depend on the moved event's completion
        
        // Currently, unscheduled events typically don't have dependents in the same way
        // that regular scheduled events do. This is a placeholder for future enhancement.
        
        console.log('[recalculateDependentEvents] Dependency recalculation completed (no dependents found)');
        
        // Note: If there were dependents, we would:
        // 1. Find all events in the DSL model that have schedules relative to movedEvent
        // 2. Calculate their new scheduled days based on newDayNumber
        // 3. Update those events in patientData.days
        // 4. This might involve calling simulationService to re-run partial simulation
    }
    
    // Update the date range based on current patient schedules
    // Called after schedule changes to ensure the timeline shows all relevant dates
    // Works with or without timeline (uses fallback reference date when timeline is null)
    function updateDateRangeFromPatientData() {
        // Use timeline reference date or fallback to database-derived reference date
        const refDate = timeline ? timeline.getReferenceDate() : getFallbackReferenceDate();
        
        // Find the earliest and latest day numbers across all patient schedules
        let earliestDayNumber = 0;
        let latestDayNumber = 0;
        let hasData = false;
        
        // Check patientCentricData if available (reactive derived state)
        if (patientCentricData?.patients) {
            for (const patient of patientCentricData.patients as any[]) {
                if (patient.days && patient.referenceDate) {
                    for (const day of patient.days) {
                        // Get the timeline day number for this patient day
                        // Patient day is relative to patient's reference date
                        // We need to convert to timeline day (relative to timeline reference date)
                        const patientDate = new Date(patient.referenceDate + 'T00:00:00');
                        patientDate.setDate(patientDate.getDate() + day.day);
                        const timelineDayNumber = getCalendarDayDiff(patientDate, refDate);
                        
                        if (!hasData) {
                            earliestDayNumber = timelineDayNumber;
                            latestDayNumber = timelineDayNumber;
                            hasData = true;
                        } else {
                            if (timelineDayNumber < earliestDayNumber) {
                                earliestDayNumber = timelineDayNumber;
                            }
                            if (timelineDayNumber > latestDayNumber) {
                                latestDayNumber = timelineDayNumber;
                            }
                        }
                    }
                }
            }
        }
        
        // Also check the database schedules directly (works during initial load before derived state is ready)
        for (const [patientId, schedule] of patientSchedulesFromDB) {
            if (schedule.referenceDate && schedule.days) {
                for (const day of schedule.days) {
                    const patientDate = new Date(schedule.referenceDate + 'T00:00:00');
                    patientDate.setDate(patientDate.getDate() + day.day);
                    const timelineDayNumber = getCalendarDayDiff(patientDate, refDate);
                    
                    if (!hasData) {
                        earliestDayNumber = timelineDayNumber;
                        latestDayNumber = timelineDayNumber;
                        hasData = true;
                    } else {
                        if (timelineDayNumber < earliestDayNumber) {
                            earliestDayNumber = timelineDayNumber;
                        }
                        if (timelineDayNumber > latestDayNumber) {
                            latestDayNumber = timelineDayNumber;
                        }
                    }
                }
            }
        }
        
        // Only proceed if we found any data
        if (!hasData) {
            console.log('[updateDateRangeFromPatientData] No patient schedule data found');
            return;
        }
        
        // Calculate the start of the month containing the earliest day
        const earliestDate = getDateFromDay(earliestDayNumber);
        const firstMonthStart = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
        const newDateRangeStart = getCalendarDayDiff(firstMonthStart, refDate);
        
        // Calculate the end of the month containing the latest day
        const latestDate = getDateFromDay(latestDayNumber);
        const lastMonthEnd = new Date(latestDate.getFullYear(), latestDate.getMonth() + 1, 0);
        const newDateRangeEnd = getCalendarDayDiff(lastMonthEnd, refDate);
        
        let rangeChanged = false;
        
        // Update start if new range is earlier
        if (newDateRangeStart < dateRangeStart || dateRangeStart === dateRangeEnd) {
            console.log('[updateDateRangeFromPatientData] Updating date range start:', {
                oldStart: dateRangeStart,
                newStart: newDateRangeStart
            });
            dateRangeStart = newDateRangeStart;
            rangeChanged = true;
        }
        
        // Update end if new range is later
        if (newDateRangeEnd > dateRangeEnd || dateRangeStart === dateRangeEnd) {
            console.log('[updateDateRangeFromPatientData] Extending date range end:', {
                oldEnd: dateRangeEnd,
                oldEndDate: dateRangeEnd !== 0 ? getDateFromDay(dateRangeEnd).toISOString().split('T')[0] : 'N/A',
                newEnd: newDateRangeEnd,
                newEndDate: lastMonthEnd.toISOString().split('T')[0],
                latestDayNumber,
                latestDate: latestDate.toISOString().split('T')[0]
            });
            dateRangeEnd = newDateRangeEnd;
            rangeChanged = true;
        }
        
        // If range changed and visible window is unset or out of range, reset it
        if (rangeChanged && (visibleStartDay === visibleEndDay || visibleEndDay < dateRangeStart)) {
            const daysThatFit = containerRef ? calculateVisibleDays() : 31;
            visibleStartDay = dateRangeStart;
            visibleEndDay = Math.min(visibleStartDay + daysThatFit - 1, dateRangeEnd);
            console.log('[updateDateRangeFromPatientData] Reset visible window:', {
                visibleStartDay,
                visibleEndDay,
                daysThatFit
            });
        }
        
        if (!rangeChanged) {
            console.log('[updateDateRangeFromPatientData] Range is already sufficient:', {
                currentStart: dateRangeStart,
                currentEnd: dateRangeEnd,
                earliestDayNumber,
                latestDayNumber
            });
        }
    }
    
    // Save patient schedule to database
    async function savePatientScheduleToDatabase(patientNumber: string, patientData: any) {
        // Find patient UUID from patientNumber
        const patientRecord = patients.find(p => p.patientNumber === patientNumber || p.id === patientNumber);
        if (!patientRecord) {
            console.error('[savePatientScheduleToDatabase] Patient not found:', patientNumber);
            return;
        }
        
        const patientId = patientRecord.id;
        
        // Build the schedule structure for database
        // Only include days that have events - windows are calculated on-the-fly
        const schedule = {
            referenceDate: patientData.referenceDate,
            days: patientData.days
                .filter((day: any) => day.events && day.events.length > 0)
                .map((day: any) => ({
                    day: day.day,
                    date: day.date,
                    events: day.events.map((event: any) => ({
                        id: event.id,
                        type: event.type,
                        name: event.name,
                        actualDay: event.actualDay,
                        scheduledDay: event.scheduledDay,
                        originalScheduledDay: event.originalScheduledDay, // Preserved when event is rescheduled
                        status: event.status,
                        state: event.state,
                        window: event.window
                    }))
                }))
        };
        
        console.log('[savePatientScheduleToDatabase] Saving schedule for patient:', patientId, schedule);
        
        try {
            const success = await dataStore.setPatientSchedule(patientId, schedule);
            if (success) {
                console.log('[savePatientScheduleToDatabase] Schedule saved successfully');
                
                // Update the local cache to reflect the saved data
                const newSchedules = new Map(patientSchedulesFromDB);
                newSchedules.set(patientId, schedule);
                patientSchedulesFromDB = newSchedules;
                console.log('[savePatientScheduleToDatabase] Updated local cache');
                
                // Recalculate the date range to include any new dates
                updateDateRangeFromPatientData();
            } else {
                console.error('[savePatientScheduleToDatabase] Failed to save schedule');
            }
        } catch (error) {
            console.error('[savePatientScheduleToDatabase] Error saving schedule:', error);
        }
    }

    // Handle popup cancel
    function handlePopupCancel() {
        popupOpen = false;
    }

    // Handle immediate availability change from popup - saves to database
    function handleAvailabilityChange(detail: { available: boolean }) {
        console.log('[handleAvailabilityChange] Availability changed to:', detail.available);
        
        // Find patient UUID from patientNumber
        const patientRecord = patients.find(p => p.patientNumber === popupPatientId || p.id === popupPatientId);
        if (!patientRecord) {
            console.error('[handleAvailabilityChange] Patient not found:', popupPatientId);
            return;
        }
        
        // Use togglePatientAvailability which updates state and saves to database
        togglePatientAvailability(patientRecord.id, popupDate, detail.available);
        
        console.log('[handleAvailabilityChange] Availability change triggered for patient:', patientRecord.id);
    }

    // Copy simulation data to clipboard
    async function copySimulationData(data: any) {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            await navigator.clipboard.writeText(jsonString);
            copyButtonText = 'Copied!';
            setTimeout(() => {
                copyButtonText = 'Copy';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            copyButtonText = 'Failed';
            setTimeout(() => {
                copyButtonText = 'Copy';
            }, 2000);
        }
    }

    // Patient CRUD handlers
    function handleAddPatient() {
        needsPatientReload = true;
        addObject("patient", studyId);
    }
    
    // Refresh handlers
    async function handleRefreshPatients() {
        console.log('[handleRefreshPatients] Refreshing patient data');
        try {
            // Reload from database
            await dataStore.getStudyPatients(studyId);
            const storeState = get(dataStore);
            const updatedPatients = storeState.studyPatients.filter(p => p.studyId === studyId);
            patients = updatedPatients;
            
            // Reload patient unavailable dates and schedules
            await loadPatientUnavailableDates();
            await loadPatientSchedules();
            
            console.log('[handleRefreshPatients] Refreshed', patients.length, 'patients');
        } catch (err) {
            console.error('[handleRefreshPatients] Error:', err);
        }
    }
    
    async function handleRefreshStaff() {
        console.log('[handleRefreshStaff] Refreshing staff data');
        await loadStaffData();
        console.log('[handleRefreshStaff] Refreshed', staffMembers.length, 'staff members');
    }
    
    // Quick filter handler for patients
    function handlePatientQuickFilterChange(value: string) {
        patientQuickFilter = value;
    }
    
    // Quick filter handler for staff
    function handleStaffQuickFilterChange(value: string) {
        staffQuickFilter = value;
    }
    
    function handleEditPatient(patientId: string) {
        // Find patient data from the patients array
        const patientData = patients.find(p => p.patientNumber === patientId || p.id === patientId);
        if (patientData) {
            needsPatientReload = true;
            editObject("patient", patientData);
        }
    }
    
    async function handleDeletePatient(patientId: string, triggerElement: HTMLElement) {
        // Close any existing delete confirm popover
        handleDeleteConfirmCancel();
        
        // Store item info
        deleteConfirmItemId = patientId;
        deleteConfirmItemType = 'patient';
        deleteConfirmTriggerElement = triggerElement;
        
        // Create container and mount component
        deleteConfirmContainer = document.createElement('div');
        document.body.appendChild(deleteConfirmContainer);
        
        // Find patient name for display
        const patientData = patients.find(p => p.patientNumber === patientId || p.id === patientId);
        const patientName = patientData?.patientNumber || patientId;
        
        // Dynamic import to avoid module loading issues
        const { default: DeleteConfirmPopover } = await import("../components/popovers/DeleteConfirmPopover.svelte");
        
        deleteConfirmInstance = mount(DeleteConfirmPopover, {
            target: deleteConfirmContainer,
            props: {
                open: true,
                triggerElement: deleteConfirmTriggerElement,
                itemName: patientName,
                itemType: 'patient',
                onClose: handleDeleteConfirmCancel,
                onConfirm: handleDeleteConfirmConfirm
            }
        });
    }
    
    function handleDeleteConfirmCancel() {
        if (deleteConfirmInstance) {
            try {
                unmount(deleteConfirmInstance);
            } catch (e) {
                console.warn('[StudyPatients] Error unmounting delete confirm popover:', e);
            }
            deleteConfirmInstance = null;
        }
        if (deleteConfirmContainer && deleteConfirmContainer.parentNode) {
            deleteConfirmContainer.parentNode.removeChild(deleteConfirmContainer);
            deleteConfirmContainer = null;
        }
        deleteConfirmItemId = null;
        deleteConfirmItemType = null;
        deleteConfirmTriggerElement = null;
    }
    
    async function handleDeleteConfirmConfirm() {
        if (!deleteConfirmItemId || !deleteConfirmItemType) {
            handleDeleteConfirmCancel();
            return;
        }
        
        const itemId = deleteConfirmItemId;
        const itemType = deleteConfirmItemType;
        handleDeleteConfirmCancel();
        
        if (itemType === 'patient') {
            // Find patient data from the patients array
            const patientData = patients.find(p => p.patientNumber === itemId || p.id === itemId);
            if (patientData) {
                try {
                    await dataStore.deletePatient(patientData.id);
                    // Remove patient from local arrays (surgical update, no full reload)
                    patients = patients.filter(p => p.id !== patientData.id);
                    patientSchedulesFromDB.delete(patientData.id);
                    // Force reactivity by reassigning the Map
                    patientSchedulesFromDB = new Map(patientSchedulesFromDB);
                    // Update the patient count in the study data so the study grid stays in sync
                    dataStore.updateStudyPatientCount(studyId, patients.length);
                } catch (error) {
                    console.error('Error deleting patient:', error);
                }
            }
        } else if (itemType === 'staff') {
            try {
                await dataStore.deletePerson(itemId);
                // Refresh staff list
                await refreshStaff();
            } catch (error) {
                console.error('Error deleting staff:', error);
            }
        }
    }
    
    function handlePatientDeleted() {
        deleteDialogOpen = false;
        objectToDelete = null;
    }
    
    function handleDeleteCancel() {
        deleteDialogOpen = false;
        objectToDelete = null;
    }
    
    // Check if a patient has at least one scheduled or actual visit
    function patientHasFirstVisit(patientId: string): boolean {
        if (!patientCentricData || !patientCentricData.patients) return false;
        
        const patientData = (patientCentricData.patients as any[]).find((p: any) => p.patientId === patientId);
        if (!patientData || !patientData.days || patientData.days.length === 0) return false;
        
        // Check if there's at least one day with events
        return patientData.days.some((d: any) => d.events && d.events.length > 0);
    }
    
    // Jump to first visit month for a patient
    function handleJumpToFirstVisit(patientId: string) {
        if (!patientCentricData || !patientCentricData.patients || !timeline) return;
        
        const patientData = (patientCentricData.patients as any[]).find((p: any) => p.patientId === patientId);
        if (!patientData || !patientData.days || patientData.days.length === 0) return;
        
        // Find the first day with an actual event (not just a window or unavailable)
        const firstEventDay = patientData.days.find((d: any) => d.events && d.events.length > 0);
        if (!firstEventDay) return;
        
        const firstEventDateStr = firstEventDay.date;
        const refDate = timeline.getReferenceDate();
        
        // Calculate the timeline day for this date
        const targetDay = dayjs(firstEventDateStr).diff(dayjs(refDate), 'day');
        
        // Get the month start for this day
        const monthStart = getMonthStartDay(targetDay);
        
        // Update visible range to start at this month
        const daysThatFit = calculateVisibleDays();
        visibleStartDay = monthStart;
        visibleEndDay = Math.min(monthStart + daysThatFit - 1, dateRangeEnd);
        
        console.log('[handleJumpToFirstVisit] Jumped to first visit for', patientId, 'at', firstEventDateStr);
    }
    
    // Staff CRUD handlers
    function handleAddStaff() {
        addObject("person");
    }
    
    function handleEditStaff(staffId: string) {
        // Get the full person data from the store (not the simplified staffMembers array)
        // The staffMembers array only has id, name, and unavailableDates
        const storeState = get(dataStore);
        const personData = storeState.persons?.find((p: any) => p.id === staffId);
        if (personData) {
            editObject("person", personData);
        }
    }
    
    async function handleDeleteStaff(staffId: string, triggerElement: HTMLElement) {
        // Close any existing delete confirm popover
        handleDeleteConfirmCancel();
        
        // Store item info
        deleteConfirmItemId = staffId;
        deleteConfirmItemType = 'staff';
        deleteConfirmTriggerElement = triggerElement;
        
        // Create container and mount component
        deleteConfirmContainer = document.createElement('div');
        document.body.appendChild(deleteConfirmContainer);
        
        // Find staff name for display
        const staffMember = staffMembers.find(s => s.id === staffId);
        const staffName = staffMember?.name || staffId;
        
        // Dynamic import to avoid module loading issues
        const { default: DeleteConfirmPopover } = await import("../components/popovers/DeleteConfirmPopover.svelte");
        
        deleteConfirmInstance = mount(DeleteConfirmPopover, {
            target: deleteConfirmContainer,
            props: {
                open: true,
                triggerElement: deleteConfirmTriggerElement,
                itemName: staffName,
                itemType: 'staff member',
                onClose: handleDeleteConfirmCancel,
                onConfirm: handleDeleteConfirmConfirm
            }
        });
    }
    
    function handleStaffDeleted() {
        deleteDialogOpen = false;
        objectToDelete = null;
    }

    // Check if there's a scheduled window on a day (only for scheduled, not completed events)
    function hasScheduledWindow(day: number, patientId: string): boolean {
        // First check if there's a completed event for this patient on this day
        const patientEvents = getPatientEventsForDay(day, patientId);
        const completedEvent = patientEvents.find((e: any) => {
            if (e.getTitle && e.getTitle() === "Patient Unavailable") {
                return false;
            }
            const stateClass = getEventStateClass(e);
            // Completed events: on-scheduled-date, in-window, canceled-visit, missed-visit
            return stateClass === "on-scheduled-date" || 
                   stateClass === "in-window" || 
                   stateClass === "canceled-visit" || 
                   stateClass === "missed-visit";
        });
        
        // If there's a completed event, don't show window
        if (completedEvent) {
            return false;
        }
        
        // Check if there's a scheduled event (window) for this day
        const scheduledEvents = getScheduledEventsForDay(day);
        return scheduledEvents.length > 0;
    }

    // Get visible days - includes all days in visible months, even if no data
    let visibleDays = $derived.by(() => {
        const days: number[] = [];
        // Always include all days from visibleStartDay to visibleEndDay
        // This ensures we show complete months even if there's no data
        for (let day = visibleStartDay; day <= visibleEndDay && day <= dateRangeEnd; day++) {
            days.push(day);
        }
        
        return days;
    });

    // Update visible window when zoom or container size changes
    // Effect to recalculate visible window when container or date range changes
    // Works with or without timeline (uses date range from database schedules)
    $effect(() => {
        if (containerRef && dateRangeStart !== dateRangeEnd && dateRangeEnd > dateRangeStart) {
            // Always ensure we start at the beginning of a month
            const monthStart = getMonthStartDay(visibleStartDay);
            if (visibleStartDay !== monthStart) {
                visibleStartDay = monthStart;
            }
            
            // Recalculate end day based on how many days fit
            const daysThatFit = calculateVisibleDays();
            visibleEndDay = Math.min(visibleStartDay + daysThatFit - 1, dateRangeEnd);
        }
    });

    // Get all month starts in the date range (based on dateRangeStart and dateRangeEnd)
    // Works with or without timeline (uses fallback reference date when timeline is null)
    function getAllMonthStarts(): number[] {
        // Check for uninitialized or invalid range
        if (dateRangeStart === dateRangeEnd && dateRangeStart === 0) return [];
        if (dateRangeEnd <= dateRangeStart) return [];
        const monthStarts: number[] = [];
        const refDate = timeline ? timeline.getReferenceDate() : getFallbackReferenceDate();
        // Normalize to start of day to ensure consistent day calculations
        // This matches how getCalendarDayDiff() calculates day differences
        const refDateDayjs = dayjs(refDate).startOf('day');
        
        // Use the actual date range (from patient events, not all timeline days)
        const firstDataDate = getDateFromDay(dateRangeStart);
        const lastDataDate = getDateFromDay(dateRangeEnd);
        
        // Get the first month (1st of the month containing first data)
        const startYear = firstDataDate.getFullYear();
        const startMonth = firstDataDate.getMonth() + 1; // 1-based (1 = January)
        
        // Get the last month (1st of the month containing last data)
        const endYear = lastDataDate.getFullYear();
        const endMonth = lastDataDate.getMonth() + 1; // 1-based (1 = January)
        
        // Iterate through years and months
        // Start year: from startMonth to 12
        // Middle years: from 1 to 12
        // End year: from 1 to endMonth
        for (let year = startYear; year <= endYear; year++) {
            const monthStart = (year === startYear) ? startMonth : 1;
            const monthEnd = (year === endYear) ? endMonth : 12;
            
            for (let month = monthStart; month <= monthEnd; month++) {
                // Create the 1st of this month using dayjs
                const monthStartDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
                
                // Calculate day difference using dayjs
                const monthStartDay = monthStartDate.diff(refDateDayjs, 'day');
                monthStarts.push(monthStartDay);
            }
        }
        
        return monthStarts;
    }

    // Date range slider handlers - acts as scrollbar, snaps to month starts
    // Works with or without timeline (uses date range from database schedules)
    function onRangeChange(event: Event) {
        // Check for uninitialized or invalid range
        if (dateRangeStart === dateRangeEnd && dateRangeStart === 0) return;
        if (dateRangeEnd <= dateRangeStart) return;
        
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        
        // Get all month starts in range
        const monthStarts = getAllMonthStarts();
        if (monthStarts.length === 0) return;
        
        // Value is already the month index (0 to number of months - 1)
        const monthIndex = Math.min(Math.max(0, value), monthStarts.length - 1);
        const targetMonthStart = monthStarts[monthIndex];
        
        const daysThatFit = calculateVisibleDays();
        visibleStartDay = targetMonthStart;
        visibleEndDay = Math.min(targetMonthStart + daysThatFit - 1, dateRangeEnd);
    }

    // Zoom handler - 4 discrete levels
    function onZoomChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        zoomLevel = Math.min(3, Math.max(0, Math.floor(value / 25))); // 0-25 = level 0, 26-50 = level 1, etc.
        
        // Recalculate visible days when zoom changes
        if (containerRef) {
            const daysThatFit = calculateVisibleDays();
            visibleEndDay = Math.min(visibleStartDay + daysThatFit - 1, dateRangeEnd);
        }
    }

    // Get the first day of the month containing a given day
    // Get the month start day for a given day, using the month starts array
    function getMonthStartDay(day: number): number {
        // Works with or without timeline (getAllMonthStarts uses fallback reference date)
        const monthStarts = getAllMonthStarts();
        if (monthStarts.length === 0) return day;
        
        // Find the month start that is <= day, or the first one if day is before all
        for (let i = monthStarts.length - 1; i >= 0; i--) {
            if (monthStarts[i] <= day) {
                return monthStarts[i];
            }
        }
        return monthStarts[0];
    }

    // Get the first day of the next month, using the month starts array
    function getNextMonthStartDay(day: number): number {
        // Works with or without timeline (getAllMonthStarts uses fallback reference date)
        const monthStarts = getAllMonthStarts();
        if (monthStarts.length === 0) return day;
        
        // Find the current month start
        const currentMonthStart = getMonthStartDay(day);
        
        // Find the index of the current month start
        const currentIndex = monthStarts.indexOf(currentMonthStart);
        if (currentIndex === -1) return day;
        
        // Return the next month start, or the last one if we're at the end
        if (currentIndex < monthStarts.length - 1) {
            return monthStarts[currentIndex + 1];
        }
        return monthStarts[monthStarts.length - 1];
    }

    // Get the first day of the previous month, using the month starts array
    function getPreviousMonthStartDay(day: number): number {
        // Works with or without timeline (getAllMonthStarts uses fallback reference date)
        const monthStarts = getAllMonthStarts();
        if (monthStarts.length === 0) return day;
        
        // Find the current month start
        const currentMonthStart = getMonthStartDay(day);
        
        // Find the index of the current month start
        const currentIndex = monthStarts.indexOf(currentMonthStart);
        if (currentIndex === -1) return day;
        
        // Return the previous month start, or the first one if we're at the start
        if (currentIndex > 0) {
            return monthStarts[currentIndex - 1];
        }
        return monthStarts[0];
    }

    // Prev/Next navigation - moves by whole months, always starting at 1st of month
    function navigatePrevious() {
        // Works with or without timeline (uses date range from database schedules)
        if (dateRangeStart === dateRangeEnd) return;
        
        // Always move to the previous month start
        const currentMonthStart = getMonthStartDay(visibleStartDay);
        const prevMonthStart = getPreviousMonthStartDay(currentMonthStart);
        
        // Ensure we don't go before the range start
        if (prevMonthStart >= dateRangeStart) {
            const daysThatFit = calculateVisibleDays();
            visibleStartDay = prevMonthStart;
            visibleEndDay = Math.min(prevMonthStart + daysThatFit - 1, dateRangeEnd);
        }
    }

    function navigateNext() {
        // Works with or without timeline (uses date range from database schedules)
        if (dateRangeStart === dateRangeEnd) return;
        
        // Always move to the next month start
        const currentMonthStart = getMonthStartDay(visibleStartDay);
        const nextMonthStart = getNextMonthStartDay(currentMonthStart);
        
        if (nextMonthStart <= dateRangeEnd) {
            const daysThatFit = calculateVisibleDays();
            visibleStartDay = nextMonthStart;
            visibleEndDay = Math.min(nextMonthStart + daysThatFit - 1, dateRangeEnd);
        }
    }
    
    // Derived: Can navigate to previous month?
    let canNavigatePrevious = $derived.by(() => {
        if (dateRangeStart === dateRangeEnd) return false;
        const currentMonthStart = getMonthStartDay(visibleStartDay);
        const prevMonthStart = getPreviousMonthStartDay(currentMonthStart);
        // Must be strictly less than current to be a valid previous month
        return prevMonthStart < currentMonthStart && prevMonthStart >= dateRangeStart;
    });
    
    // Derived: Can navigate to next month?
    let canNavigateNext = $derived.by(() => {
        if (dateRangeStart === dateRangeEnd) return false;
        const currentMonthStart = getMonthStartDay(visibleStartDay);
        const nextMonthStart = getNextMonthStartDay(currentMonthStart);
        // Must be strictly greater than current to be a valid next month
        return nextMonthStart > currentMonthStart && nextMonthStart <= dateRangeEnd;
    });

    // Navigate to today - moves to the month containing today
    // Works with or without timeline (uses fallback reference date when timeline is null)
    function navigateToToday() {
        // Check for uninitialized or invalid range
        if (dateRangeStart === dateRangeEnd && dateRangeStart === 0) return;
        if (dateRangeEnd <= dateRangeStart) return;
        
        const refDate = timeline ? timeline.getReferenceDate() : getFallbackReferenceDate();
        const today = new Date();
        const todayDay = getCalendarDayDiff(today, refDate);
        
        // Get the first day of the month containing today
        const todayMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const todayMonthStartDay = getCalendarDayDiff(todayMonthStart, refDate);
        
        // Ensure we stay within the date range
        const targetDay = Math.max(dateRangeStart, Math.min(todayMonthStartDay, dateRangeEnd));
        const daysThatFit = calculateVisibleDays();
        
        visibleStartDay = targetDay;
        visibleEndDay = Math.min(targetDay + daysThatFit - 1, dateRangeEnd);
    }

    // Patient/staff navigation - tied together
    function scrollPatientsLeft() {
        if (patientScrollOffset > 0) {
            patientScrollOffset = Math.max(0, patientScrollOffset - PATIENTS_PER_PAGE);
            staffScrollOffset = Math.max(0, staffScrollOffset - STAFF_PER_PAGE);
        }
    }

    function scrollPatientsRight() {
        if (patientScrollOffset + PATIENTS_PER_PAGE < uniquePatientIds.length) {
            patientScrollOffset = Math.min(uniquePatientIds.length - PATIENTS_PER_PAGE, patientScrollOffset + PATIENTS_PER_PAGE);
            const staffNames = Array.from(staffData.keys());
            staffScrollOffset = Math.min(staffNames.length - STAFF_PER_PAGE, staffScrollOffset + STAFF_PER_PAGE);
        }
    }

    // Get range slider value (0 to number of months - 1) - based on month positions
    // Works with or without timeline (uses date range from database schedules)
    let rangeSliderValue = $derived.by(() => {
        if (dateRangeEnd === dateRangeStart) return 0;
        
        const monthStarts = getAllMonthStarts();
        if (monthStarts.length === 0) return 0;
        
        // Find which month we're currently viewing
        const currentMonthStart = getMonthStartDay(visibleStartDay);
        const monthIndex = monthStarts.findIndex(ms => ms === currentMonthStart);
        
        if (monthIndex === -1) {
            // If current month not found, find closest
            const closestIndex = monthStarts.reduce((closest, ms, idx) => {
                return Math.abs(ms - currentMonthStart) < Math.abs(monthStarts[closest] - currentMonthStart) ? idx : closest;
            }, 0);
            return closestIndex;
        }
        
        return monthIndex;
    });
    
    // Get max slider value (number of months - 1)
    let rangeSliderMax = $derived.by(() => {
        const monthStarts = getAllMonthStarts();
        return Math.max(0, monthStarts.length - 1);
    });

    // Get start/end month labels for range
    // Works with or without timeline (uses date range from database schedules)
    let startMonthLabel = $derived.by(() => {
        if (dateRangeStart === dateRangeEnd && dateRangeStart === 0) return "";
        if (dateRangeEnd <= dateRangeStart) return "";
        const date = getDateFromDay(dateRangeStart);
        return `${getMonthAbbr(date)} ${date.getFullYear()}`;
    });

    let endMonthLabel = $derived.by(() => {
        if (dateRangeStart === dateRangeEnd && dateRangeStart === 0) return "";
        if (dateRangeEnd <= dateRangeStart) return "";
        const date = getDateFromDay(dateRangeEnd);
        return `${getMonthAbbr(date)} ${date.getFullYear()}`;
    });

    // Get month for a day
    function getMonthForDay(day: number): { month: number; year: number } {
        const date = getDateFromDay(day);
        return { month: date.getMonth(), year: date.getFullYear() };
    }

    // Get month background color using CSS variable based on month number (1-12)
    function getMonthBackgroundColor(month: number): string {
        // month is 0-11 (JavaScript Date month), convert to 1-12
        const monthNum = month + 1;
        const monthStr = String(monthNum).padStart(2, '0');
        return `var(--timeline-month-${monthStr})`;
    }

    // Group days by month for background coloring
    let monthGroups = $derived.by(() => {
        const groups: Array<{ month: number; year: number; startIndex: number; endIndex: number; backgroundColor: string }> = [];
        let currentMonth: { month: number; year: number } | null = null;
        let startIndex = 0;

        for (let i = 0; i < visibleDays.length; i++) {
            const dayMonth = getMonthForDay(visibleDays[i]);
            if (!currentMonth || currentMonth.month !== dayMonth.month || currentMonth.year !== dayMonth.year) {
                if (currentMonth !== null) {
                    groups.push({ 
                        ...currentMonth, 
                        startIndex, 
                        endIndex: i - 1,
                        backgroundColor: getMonthBackgroundColor(currentMonth.month)
                    });
                }
                currentMonth = dayMonth;
                startIndex = i;
            }
        }
        if (currentMonth !== null) {
            groups.push({ 
                ...currentMonth, 
                startIndex, 
                endIndex: visibleDays.length - 1,
                backgroundColor: getMonthBackgroundColor(currentMonth.month)
            });
        }
        return groups;
    });

    $effect(() => {
        if (studyId) {
            loadSplitterSetting();
            loadShowAvailabilitySetting();
            loadShowWindowsSetting();
            loadTimeline();
            loadStaffData();
        }
    });
    
    // Check model validity when tab becomes active (e.g., after switching from Study Design tab)
    // This allows the model error state to be refreshed after the user fixes or introduces design issues
    async function checkModelValidity() {
        if (!studyId || isLoading) return;
        
        try {
            // Try to get the study configuration from the model manager
            const unit = ModelManager.getInstance().getCurrentUnit();
            if (unit && unit.freLanguageConcept?.() === 'StudyConfiguration') {
                const loadedStudyConfig = unit as StudyConfiguration;
                
                // Try to create a timeline - this validates the model
                const testTimeline = getTimelineAsOfADate(loadedStudyConfig, new Date(), undefined);
                
                // If we get here, the model is valid - clear any error
                if (modelError) {
                    console.log('[checkModelValidity] Model is now valid, clearing error');
                }
                modelError = null;
                timeline = testTimeline;
                studyConfig = loadedStudyConfig;
            } else {
                // No valid study configuration found
                if (!modelError) {
                    console.log('[checkModelValidity] No valid study configuration found');
                    modelError = "config_not_found";
                }
            }
        } catch (err) {
            // Model has errors - set error state
            const errMsg = err instanceof Error ? err.message : String(err);
            console.log('[checkModelValidity] Model has errors:', errMsg);
            modelError = "timeline_error";
            timeline = null;
        }
    }
    
    // Track previous active state to detect tab switch
    let wasActive = $state(false);
    
    // Check model validity when tab becomes active
    $effect(() => {
        if (active && !wasActive) {
            // Tab just became active - check if model is now valid
            console.log('[StudyPatients] Tab became active, checking model validity');
            checkModelValidity();
        }
        wasActive = active;
    });
    
    // Watch for drawer close to reload patients if needed
    // Using a derived value from the store to track open state
    let drawerOpen = $derived($objectDrawerStore.open);
    let previousDrawerOpen = $state(false);
    
    $effect(() => {
        // Detect drawer closing (was open, now closed)
        if (previousDrawerOpen && !drawerOpen && needsPatientReload) {
            console.log('[PatientRefresh] Drawer closed, reloading patients');
            needsPatientReload = false;
            
            // Reload patients from the store (which was already updated by ObjectDrawerSystem)
            const storeState = get(dataStore);
            const updatedPatients = storeState.studyPatients.filter(p => p.studyId === studyId);
            console.log('[PatientRefresh] Loaded', updatedPatients.length, 'patients from store');
            patients = updatedPatients;
            
            // Update the patient count in the study data so the study grid stays in sync
            dataStore.updateStudyPatientCount(studyId, updatedPatients.length);
        }
        previousDrawerOpen = drawerOpen;
    });
    
    // Track whether we've already applied the site start date
    let siteStartDateApplied = $state(false);
    
    // Update date range to use site start date when there are no patients
    // This effect runs ONCE after loadStaffData sets the siteStartDate
    $effect(() => {
        if (siteStartDate && patients.length === 0 && !isLoading && !siteStartDateApplied) {
            
            // Mark as applied so this effect doesn't run again
            siteStartDateApplied = true;
            
            // Parse site start date
            const [year, month, day] = siteStartDate.split('-').map(Number);
            const siteStart = new Date(year, month - 1, day);
            siteStart.setHours(0, 0, 0, 0);
            
            // Calculate 1 year from today (upper limit)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const oneYearFromToday = new Date(today);
            oneYearFromToday.setFullYear(oneYearFromToday.getFullYear() + 1);
            
            // Calculate date range using today as reference (since we don't have patients)
            const refDate = today;
            
            // Start range at the first day of the month containing site start
            const firstMonthStart = new Date(siteStart.getFullYear(), siteStart.getMonth(), 1);
            const firstMonthStartDay = getCalendarDayDiff(firstMonthStart, refDate);
            
            // End range at the last day of the month containing one year from today
            const lastMonthEnd = new Date(oneYearFromToday.getFullYear(), oneYearFromToday.getMonth() + 1, 0);
            const lastMonthEndDay = getCalendarDayDiff(lastMonthEnd, refDate);
            
            dateRangeStart = firstMonthStartDay;
            dateRangeEnd = lastMonthEndDay;
            
            // Update visible window
            const daysThatFit = containerRef ? calculateVisibleDays() : 31;
            visibleStartDay = firstMonthStartDay;
            visibleEndDay = Math.min(visibleStartDay + daysThatFit - 1, dateRangeEnd);
        }
    });
</script>

<div class="timeline-chart-wrapper">
    <!-- Main Content: Timeline Chart -->
    <div class="timeline-chart" bind:this={containerRef}>
        {#if isLoading}
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Loading timeline data...</p>
            </div>
        {:else if error}
            <div class="error-container">
                <p class="error-message">{error}</p>
            </div>
        {:else}
            <!-- Model Error Warning Banner - shown when study design has issues but patients can still be displayed -->
            {#if modelError}
                <div class="timeline-error-toast">
                    There is a study design issue, so the timelines are based on a previous stable model, please correct the design to see updates for patients.
                </div>
            {/if}
            <!-- Controls -->
            <div class="timeline-controls">
                <div class="control-group">
                    <div class="range-control">
                        <span class="range-label">{startMonthLabel}</span>
                        <input 
                            type="range" 
                            min="0" 
                            max={rangeSliderMax}
                            step="1"
                            value={rangeSliderValue}
                            oninput={onRangeChange}
                            class="range-slider position-only"
                            id="range-slider"
                        />
                        <span class="range-label">{endMonthLabel}</span>
                    </div>
                    <button class="today-button" onclick={navigateToToday} title="Go to today">
                        Goto Today
                    </button>
                </div>
                <div class="control-group">
                    <span class="control-label">Mode</span>
                    <button  class="mode-toggle-btn {viewMode}" onclick={() => viewMode = viewMode === 'scheduling' ? 'availability' : 'scheduling'}>
                        {viewMode === 'scheduling' ? 'Scheduling' : 'Availability'}
                    </button>
                </div>
                {#if viewMode === 'scheduling'}
                    <div class="control-group">
                        <label class="checkbox-control">
                            <input class="toolbar-checkbox" type="checkbox" bind:checked={showAvailability} onchange={saveShowAvailabilitySetting} />
                            <span class="control-label">Show Availability</span>
                        </label>
                    </div>
                {/if}
                <div class="control-group">
                    <label class="checkbox-control">
                        <input class="toolbar-checkbox" type="checkbox"  bind:checked={showWindows} onchange={saveShowWindowsSetting} />
                        <span class="control-label">Show Windows</span>
                    </label>
                </div>
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div class="control-group info-control" onmouseenter={() => showInfoPopup = true} onmouseleave={() => showInfoPopup = false}>
                    <button class="info-button" aria-label="Show legend">
                        <IconInfo size={22} />
                    </button>
                    {#if showInfoPopup}
                        <div class="timeline-info-popup">
                            <h4>Timeline Legend</h4>
                            <div class="legend-columns">
                                <div class="legend-column">
                                    <h5>Events</h5>
                                    <div class="legend-item">
                                        <div class="legend-swatch day-zero"></div>
                                        <span>Day 0 (First Visit)</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-swatch planned-on-scheduled"></div>
                                        <span>On Scheduled Date</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-swatch planned-in-window"></div>
                                        <span>In Window</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-swatch planned-out-of-window"></div>
                                        <span>Out of Window</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-swatch unscheduled"></div>
                                        <span>Unscheduled</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-swatch canceled"></div>
                                        <span>Canceled</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-swatch missed"></div>
                                        <span>Missed</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-swatch window"></div>
                                        <span>Window Day</span>
                                    </div>
                                </div>
                                <div class="legend-column">
                                    <h5>Status</h5>
                                    <div class="legend-item">
                                        <div class="legend-swatch status-planned"></div>
                                        <span>Planned</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-swatch status-completed"></div>
                                        <span>Completed</span>
                                    </div>
                                    <h5>Icons</h5>
                                    <div class="legend-item">
                                        <div class="legend-icon"><IconCalendar size={14} /></div>
                                        <span>Scheduled</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-icon"><IconCheck size={14} /></div>
                                        <span>Completed</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-icon"><IconX size={14} /></div>
                                        <span>Canceled / Missed</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-icon"><IconWindow size={14} /></div>
                                        <span>Window Day</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

        <!-- Timeline Sections Container (Patients + Staff with splitter) -->
        <div class="timeline-sections-container" class:dragging={isDraggingSplitter} bind:this={timelineSectionsRef}>
        
        <!-- Patients Section (uses shared component) -->
        <div class="patient-section-wrapper" style="flex: {showStaffTimeline ? splitRatio : 1}; min-height: 0;">
            <PatientTimelineSection
                {studyId}
                {visibleDays}
                {visiblePatientIds}
                {patients}
                {monthGroups}
                {dayWidth}
                {viewMode}
                {showAvailability}
                {showWindows}
                {getDateFromDay}
                {isWeekend}
                {isToday}
                getMonthName={getMonthAbbr}
                {getDayOfWeekAbbr}
                {getMonthForDay}
                {getPatientDayData}
                {getDayRenderingInfo}
                {isPatientUnavailable}
                {isPatientDayZero}
                {patientHasFirstVisit}
                onPatientCellClick={handleCellClick}
                onPatientCellMouseEnter={handleCellMouseEnter}
                onPatientCellMouseMove={handleCellMouseMove}
                onPatientCellMouseLeave={handleCellMouseLeave}
                onAddPatient={handleAddPatient}
                onRefreshPatients={handleRefreshPatients}
                onEditPatient={handleEditPatient}
                onDeletePatient={handleDeletePatient}
                onJumpToFirstVisit={handleJumpToFirstVisit}
                onNavigatePrevious={navigatePrevious}
                onNavigateNext={navigateNext}
                {canNavigatePrevious}
                {canNavigateNext}
                bind:quickFilter={patientQuickFilter}
                onQuickFilterChange={handlePatientQuickFilterChange}
                bind:hoveredPatientId
                bind:patientLabelsScrollRef
                bind:patientRowsScrollRef
                onPatientScroll={syncPatientScroll}
            />
        </div>

        <!-- Tooltip -->
        {#if tooltipVisible && tooltipContent}
            <div class="day-tooltip below" style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px;">
                <div class="tooltip-content">
                    <div class="tooltip-header">
                        {#if tooltipContent.day !== null}
                            <span class="tooltip-day">Day {tooltipContent.day}</span>
                        {/if}
                        <span class="tooltip-date">{tooltipContent.date}</span>
                    </div>
                    <div class="tooltip-text">{tooltipContent.patientId}</div>
                    {#if tooltipContent.events.length > 0}
                        {#each tooltipContent.events as event, index}
                            <div class="tooltip-separator"></div>
                            <div class="tooltip-item">
                                <div class="tooltip-name">{event.name}</div>
                                <div class="tooltip-status">{event.status}</div>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        {/if}

        {#if showStaffTimeline}
        <!-- Horizontal Splitter between Patients and Staff - used as drag handle for resizing sections -->
        <!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
        <button 
            type="button"
            class="timeline-splitter-handle horizontal"
            onmousedown={handleSplitterMouseDown}
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize patient and staff sections"
        ></button>
        {/if}

        <!-- Day Cell Popup -->
        <DayCellPopup
            open={popupOpen}
            date={popupDate}
            patientId={popupPatientId}
            patientReferenceDate={popupPatientRefDate}
            dayData={popupDayData}
            popupType={popupType}
            day0Events={day0Events}
            unscheduledEvents={unscheduledEvents}
            scheduledEvents={popupScheduledEvents}
            anchorElement={popupAnchorElement}
            modelError={popupModelError}
            on:apply={(e) => handlePopupApply(e.detail)}
            on:cancel={handlePopupCancel}
            on:availabilityChange={(e) => handleAvailabilityChange(e.detail)}
        />

        {#if showStaffTimeline}
        <!-- Staff Section (uses shared component) -->
        <div class="staff-section-wrapper" style="flex: {1 - splitRatio}; min-height: 0;">
            <StaffTimelineSection
                {visibleDays}
                visibleStaff={visibleStaff}
                {monthGroups}
                {dayWidth}
                {getDateFromDay}
                {isWeekend}
                {isToday}
                getMonthName={getMonthAbbr}
                {getDayOfWeekAbbr}
                {getMonthForDay}
                isStaffUnavailable={(day, staffId) => isStaffUnavailable(day, staffId)}
                onStaffCellClick={handleStaffCellClick}
                onAddStaff={handleAddStaff}
                onRefreshStaff={handleRefreshStaff}
                onEditStaff={handleEditStaff}
                onDeleteStaff={handleDeleteStaff}
                onNavigatePrevious={navigatePrevious}
                onNavigateNext={navigateNext}
                {canNavigatePrevious}
                {canNavigateNext}
                bind:quickFilter={staffQuickFilter}
                onQuickFilterChange={handleStaffQuickFilterChange}
                bind:hoveredStaffId
                bind:staffLabelsScrollRef
                bind:staffRowsScrollRef
                onStaffScroll={syncStaffScroll}
            />
        </div>
        {/if}
        
        </div><!-- End of timeline-sections-container -->
        
        <!-- Delete Object Dialog -->
        <DeleteObjectDialog
            open={deleteDialogOpen}
            objectType={objectTypeToDelete}
            object={objectToDelete}
            on:delete={() => {
                if (objectTypeToDelete === 'patient') {
                    handlePatientDeleted();
                } else {
                    handleStaffDeleted();
                }
            }}
            on:cancel={handleDeleteCancel}
        />
        
    {/if}
    </div>

    <!-- Right Sidebar: JSON Data (Schedule Only - Availability is stored separately) -->
    {#if rawSimulationData && patientCentricData}
        {@const scheduleData = {
            ...patientCentricData,
            note: "Schedule data only. Availability is stored separately in patient.availability column."
        }}
        <div class="json-sidebar">
            <div class="sidebar-header">
                <h3>Schedule Data</h3>
                <button 
                    class="copy-btn"
                    onclick={() => copySimulationData(scheduleData)}
                    title="Copy JSON to clipboard"
                >
                    {copyButtonText}
                </button>
            </div>
            <pre>{JSON.stringify(scheduleData, null, 2)}</pre>
        </div>
    {/if}
</div>
