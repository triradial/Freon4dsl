<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { browser } from '$app/environment';
    import { dataStore, type Patient } from "../services/data/data-store.js";
    import { Timeline, getTimelineAsOfADate, type StudyConfiguration } from "@freon4dsl/study-configuration";
    import { ModelManager } from "../services/dsl/model-manager.js";
    import dayjs from "dayjs";
    // @ts-ignore
    import { CircleChevronLeft as IconChevronCircleLeft, CircleChevronRight as IconChevronCircleRight, Calendar as IconCalendar, Calendar1 as IconCalendar1, CalendarCheck as IconCalendarCheck, Grid2x2 as IconWindow, Check as IconCheck, X as IconX, Plus as IconPlus, Minus as IconMinus, Pencil as IconPencil, Trash2 as IconTrash, ArrowRightToLine as IconArrowRightToLine, Info as IconInfo, RefreshCw as IconRefresh, Printer as IconPrinter } from '@lucide/svelte';
    import PatientCard from "../components/cards/PatientCard.svelte";
    import { type MonthGroup } from '../components/content/patient/TimelineCalendarHeader.svelte';
    import EventCard from '../components/content/patient/EventCard.svelte';
    import { setAllDrawersVisibility, setDrawerVisibility, setDrawerProps } from "../services/stores/side-drawer-store.js";

    let { patientId, studyId } = $props<{ patientId: string; studyId: string }>();

    // Splitter state
    let isDraggingSplitter = $state(false);
    let splitterContainer: HTMLDivElement | undefined = $state();
    let splitterHandle: HTMLButtonElement | undefined = $state();
    
    // Panel widths in rem
    const PATIENT_CARD_MIN_WIDTH = 12;
    const PATIENT_CARD_MAX_WIDTH = 25;
    const PATIENT_CARD_DEFAULT_WIDTH = 18;
    const SPLITTER_STORAGE_KEY = 'study-patient-card-width';
    
    let patientCardWidth = $state(PATIENT_CARD_DEFAULT_WIDTH);

    // Patient and study data
    let patient = $state<Patient | undefined>(undefined);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let timeline = $state<Timeline | null>(null);
    let studyConfig = $state<StudyConfiguration | null>(null);
    let modelError = $state<string | null>(null);
    let containerRef = $state<HTMLElement | null>(null);

    // Patient schedule from database
    let patientScheduleFromDB = $state<any>(null);
    let patientUnavailableDates = $state<Set<string>>(new Set());

    // Show Windows preference
    const SHOW_WINDOWS_STORAGE_KEY = 'timeline-show-windows';
    let showWindows = $state(true);

    // Show Availability preference
    const SHOW_AVAILABILITY_STORAGE_KEY = 'timeline-show-availability';
    let showAvailability = $state(true);

    // Info popup state
    let showInfoPopup = $state(false);

    // View mode
    type ViewMode = 'scheduling' | 'availability';
    let viewMode = $state<ViewMode>('scheduling');

    // Date range control
    let dateRangeStart = $state(0);
    let dateRangeEnd = $state(0);
    let visibleStartDay = $state(0);
    let visibleEndDay = $state(0);

    // Fixed day width (matches CSS default)
    const DAY_WIDTH = 20;

    // Tooltip state
    let tooltipVisible = $state(false);
    let tooltipPosition = $state({ x: 0, y: 0 });
    let tooltipContent = $state<{ day: number | null; date: string; patientId: string; events: Array<{ name: string; status: string }> } | null>(null);
    let tooltipTimeout: ReturnType<typeof setTimeout> | null = null;

    // Selected event card state - always have a date selected, default to today
    let selectedDay = $state<number | null>(null);
    let selectedDayData = $state<any>(null);
    let selectedEvents = $state<any[]>([]);
    let showUnscheduledPanel = $state(false);
    
    // Track if we've initialized the selected day
    let selectedDayInitialized = $state(false);

    // Track selected initial events for Add button
    let selectedInitialEvents = $state<Set<string>>(new Set());

    // Check if any initial event is selected
    let hasSelectedInitialEvent = $derived(selectedInitialEvents.size > 0);

    // Toggle initial event selection - single selection only (one event at a time)
    function toggleInitialEventSelection(eventId: string) {
        if (selectedInitialEvents.has(eventId)) {
            selectedInitialEvents = new Set();
        } else {
            selectedInitialEvents = new Set([eventId]);
        }
    }

    // Track selected unscheduled events for Add button
    let selectedUnscheduledEvents = $state<Set<string>>(new Set());

    // Toggle unscheduled event selection - single selection only (one event at a time)
    function toggleUnscheduledEventSelection(eventId: string) {
        if (selectedUnscheduledEvents.has(eventId)) {
            selectedUnscheduledEvents = new Set();
        } else {
            selectedUnscheduledEvents = new Set([eventId]);
        }
    }

    // Handle adding selected unscheduled events (adds the single selected event)
    function handleAddSelectedUnscheduledEvents() {
        const eventId = selectedUnscheduledEvents.size > 0 ? [...selectedUnscheduledEvents][0] : null;
        if (eventId) {
            const event = getUnscheduledEvents().find(e => e.id === eventId);
            if (event) handleAddUnscheduledEvent(event.name);
        }
        selectedUnscheduledEvents = new Set();
        showUnscheduledPanel = false;
    }

    function handleOpenUnscheduledPanel() {
        selectedUnscheduledEvents = new Set();
        showUnscheduledPanel = true;
    }

    function handleCancelUnscheduledPanel() {
        selectedUnscheduledEvents = new Set();
        showUnscheduledPanel = false;
    }

    // Format selected date for display: Ddd, d-MMM-yyyy (e.g. Wed, 4-Mar-2026)
    function formatSelectedDate(day: number): string {
        const date = getDateFromDay(day);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayOfWeek = dayNames[date.getDay()];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${dayOfWeek}, ${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
    }

    // Load splitter setting from localStorage
    function loadSplitterSetting() {
        if (!browser) return;
        try {
            const saved = localStorage.getItem(SPLITTER_STORAGE_KEY);
            if (saved) {
                const parsed = parseFloat(saved);
                if (!isNaN(parsed) && parsed >= PATIENT_CARD_MIN_WIDTH && parsed <= PATIENT_CARD_MAX_WIDTH) {
                    patientCardWidth = parsed;
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
            localStorage.setItem(SPLITTER_STORAGE_KEY, patientCardWidth.toString());
        } catch (e) {
            console.warn('Failed to save splitter setting:', e);
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

    // Splitter handlers
    function handleSplitterMouseDown(event: MouseEvent) {
        if (!browser) return;
        event.preventDefault();
        isDraggingSplitter = true;
        document.addEventListener('mousemove', handleSplitterMouseMove);
        document.addEventListener('mouseup', handleSplitterMouseUp);
    }

    function handleSplitterMouseMove(event: MouseEvent) {
        if (!isDraggingSplitter || !splitterContainer) return;
        
        const rect = splitterContainer.getBoundingClientRect();
        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const newWidth = ((event.clientX - rect.left) / rootFontSize);
        
        const constrainedWidth = Math.max(PATIENT_CARD_MIN_WIDTH, Math.min(PATIENT_CARD_MAX_WIDTH, newWidth));
        patientCardWidth = constrainedWidth;
    }

    function handleSplitterMouseUp() {
        if (!browser) return;
        isDraggingSplitter = false;
        document.removeEventListener('mousemove', handleSplitterMouseMove);
        document.removeEventListener('mouseup', handleSplitterMouseUp);
        saveSplitterSetting();
    }

    // Format date helper using dayjs
    function formatDateString(date: Date | string): string {
        return dayjs(date).format('YYYY-MM-DD');
    }

    // Helper to calculate calendar day difference using dayjs
    function getCalendarDayDiff(date1: Date | string, date2: Date | string): number {
        return dayjs(date1).startOf('day').diff(dayjs(date2).startOf('day'), 'day');
    }

    // Get date from day offset
    function getDateFromDay(day: number): Date {
        let refDate: Date;
        if (timeline) {
            refDate = timeline.getReferenceDate();
        } else if (patientScheduleFromDB?.referenceDate) {
            const [year, month, dayNum] = patientScheduleFromDB.referenceDate.split('-').map(Number);
            refDate = new Date(year, month - 1, dayNum);
        } else {
            refDate = new Date();
        }
        return dayjs(refDate).startOf('day').add(day, 'day').toDate();
    }

    // Check if date is weekend
    function isWeekend(date: Date): boolean {
        const day = date.getDay();
        return day === 0 || day === 6;
    }

    // Check if a day number is today
    function isToday(day: number): boolean {
        const refDate = timeline?.getReferenceDate() ?? new Date();
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

    // Get month for day
    function getMonthForDay(day: number): { month: number; year: number } {
        const date = getDateFromDay(day);
        return { month: date.getMonth(), year: date.getFullYear() };
    }

    // Calculate how many days fit in visible area
    function calculateVisibleDays(): number {
        if (!containerRef) return 31;
        const containerWidth = containerRef.clientWidth;
        const availableWidth = containerWidth - 20; // Small padding
        if (availableWidth <= 0) return 31;
        const daysThatFit = Math.floor(availableWidth / DAY_WIDTH);
        return Math.max(28, daysThatFit);
    }

    // Load patient data and timeline
    async function loadPatientData() {
        isLoading = true;
        error = null;
        modelError = null;

        try {
            // Load patient
            patient = await dataStore.getPatient(patientId);
            if (!patient) {
                error = "Patient not found";
                return;
            }

            // Load patient schedule from database
            patientScheduleFromDB = await dataStore.getPatientSchedule(patientId);
            
            // Load patient unavailable dates
            const unavailableDates = await dataStore.getPatientUnavailableDates(patientId);
            patientUnavailableDates = new Set(unavailableDates);

            // Try to load the StudyConfiguration DSL model
            try {
                const modelManager = ModelManager.getInstance();
                const loadedStudyConfig = await modelManager.getModelUnitWithoutOpening(studyId, "StudyConfiguration") as StudyConfiguration;
                
                if (loadedStudyConfig) {
                    studyConfig = loadedStudyConfig;
                    
                    // Create timeline
                    let referenceDateForTimeline = new Date();
                    if (patientScheduleFromDB?.referenceDate) {
                        const [year, month, day] = patientScheduleFromDB.referenceDate.split('-').map(Number);
                        referenceDateForTimeline = new Date(year, month - 1, day, 0, 0, 0);
                    }
                    
                    try {
                        timeline = getTimelineAsOfADate(loadedStudyConfig, referenceDateForTimeline, undefined);
                    } catch (timelineErr) {
                        modelError = "timeline_error";
                        console.warn("[loadPatientData] Timeline creation failed:", timelineErr);
                    }
                }
            } catch (modelErr) {
                modelError = "model_load_error";
                console.warn("[loadPatientData] Model loading failed:", modelErr);
            }

            // Calculate date range
            calculateDateRange();
            
            // Select today by default if not already selected
            if (!selectedDayInitialized) {
                selectToday();
                selectedDayInitialized = true;
            }

        } catch (err: unknown) {
            console.error("Error loading patient data:", err);
            error = err instanceof Error ? err.message : "Failed to load patient data";
        } finally {
            isLoading = false;
        }
    }

    // Calculate date range for timeline
    function calculateDateRange() {
        let refDate = new Date();
        refDate.setHours(0, 0, 0, 0);

        if (patientScheduleFromDB?.referenceDate) {
            const [year, month, day] = patientScheduleFromDB.referenceDate.split('-').map(Number);
            refDate = new Date(year, month - 1, day, 0, 0, 0);
        }

        let firstDataDate = refDate;
        let lastDataDate = refDate;

        // Extend based on patient schedule
        if (patientScheduleFromDB?.days) {
            for (const day of patientScheduleFromDB.days) {
                if (day.date) {
                    const [year, month, dayNum] = day.date.split('-').map(Number);
                    const dayDate = new Date(year, month - 1, dayNum);
                    if (dayDate > lastDataDate) {
                        lastDataDate = dayDate;
                    }
                    if (dayDate < firstDataDate) {
                        firstDataDate = dayDate;
                    }
                }
            }
        }

        // If no patient data, show 1 year from today
        if (!patientScheduleFromDB?.referenceDate) {
            firstDataDate = new Date();
            firstDataDate.setHours(0, 0, 0, 0);
            lastDataDate = new Date(firstDataDate);
            lastDataDate.setFullYear(lastDataDate.getFullYear() + 1);
        }

        // Calculate day numbers
        const firstMonthStart = new Date(firstDataDate.getFullYear(), firstDataDate.getMonth(), 1);
        const firstMonthStartDay = getCalendarDayDiff(firstMonthStart, refDate);
        const lastMonthEnd = new Date(lastDataDate.getFullYear(), lastDataDate.getMonth() + 1, 0);
        const lastMonthEndDay = getCalendarDayDiff(lastMonthEnd, refDate);

        dateRangeStart = firstMonthStartDay;
        dateRangeEnd = lastMonthEndDay;
        
        const daysThatFit = containerRef ? calculateVisibleDays() : 31;
        visibleStartDay = firstMonthStartDay;
        visibleEndDay = Math.min(visibleStartDay + daysThatFit - 1, dateRangeEnd);
    }

    // Visible days array
    let visibleDays = $derived.by(() => {
        const days = [];
        for (let d = visibleStartDay; d <= visibleEndDay; d++) {
            days.push(d);
        }
        return days;
    });

    // Month background color - same as StudyPatients.svelte (per-month CSS variables)
    function getMonthBackgroundColor(month: number): string {
        const monthNum = month + 1;
        const monthStr = String(monthNum).padStart(2, '0');
        return `var(--timeline-month-${monthStr})`;
    }

    // Month groups for header - same coloring logic as StudyPatients.svelte
    let monthGroups = $derived.by(() => {
        const groups: MonthGroup[] = [];
        let currentGroup: MonthGroup | null = null;

        for (let i = 0; i < visibleDays.length; i++) {
            const day = visibleDays[i];
            const { month, year } = getMonthForDay(day);

            if (!currentGroup || currentGroup.month !== month || currentGroup.year !== year) {
                if (currentGroup) {
                    groups.push(currentGroup);
                }
                currentGroup = {
                    month,
                    year,
                    startIndex: i,
                    endIndex: i,
                    backgroundColor: getMonthBackgroundColor(month)
                };
            } else {
                currentGroup.endIndex = i;
            }
        }

        if (currentGroup) {
            groups.push(currentGroup);
        }

        return groups;
    });

    // Fallback reference date when timeline is null (same logic as getDateFromDay)
    function getFallbackReferenceDate(): Date {
        if (patientScheduleFromDB?.referenceDate) {
            const [year, month, day] = patientScheduleFromDB.referenceDate.split('-').map(Number);
            return new Date(year, month - 1, day, 0, 0, 0);
        }
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }

    // Get all month starts in the date range (one notch per month, like StudyPatients.svelte)
    function getAllMonthStarts(): number[] {
        if (dateRangeStart === dateRangeEnd && dateRangeStart === 0) return [];
        if (dateRangeEnd <= dateRangeStart) return [];
        const monthStarts: number[] = [];
        const refDate = timeline ? timeline.getReferenceDate() : getFallbackReferenceDate();
        const refDateDayjs = dayjs(refDate).startOf('day');
        const firstDataDate = getDateFromDay(dateRangeStart);
        const lastDataDate = getDateFromDay(dateRangeEnd);
        const startYear = firstDataDate.getFullYear();
        const startMonth = firstDataDate.getMonth() + 1;
        const endYear = lastDataDate.getFullYear();
        const endMonth = lastDataDate.getMonth() + 1;
        for (let year = startYear; year <= endYear; year++) {
            const monthStart = (year === startYear) ? startMonth : 1;
            const monthEnd = (year === endYear) ? endMonth : 12;
            for (let month = monthStart; month <= monthEnd; month++) {
                const monthStartDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
                const monthStartDay = monthStartDate.diff(refDateDayjs, 'day');
                monthStarts.push(monthStartDay);
            }
        }
        return monthStarts;
    }

    // Get the month start day for a given day (for slider and nav)
    function getMonthStartDay(day: number): number {
        const monthStarts = getAllMonthStarts();
        if (monthStarts.length === 0) return day;
        for (let i = monthStarts.length - 1; i >= 0; i--) {
            if (monthStarts[i] <= day) return monthStarts[i];
        }
        return monthStarts[0];
    }

    function getNextMonthStartDay(day: number): number {
        const monthStarts = getAllMonthStarts();
        if (monthStarts.length === 0) return day;
        const currentMonthStart = getMonthStartDay(day);
        const currentIndex = monthStarts.indexOf(currentMonthStart);
        if (currentIndex === -1) return day;
        if (currentIndex < monthStarts.length - 1) return monthStarts[currentIndex + 1];
        return monthStarts[monthStarts.length - 1];
    }

    function getPreviousMonthStartDay(day: number): number {
        const monthStarts = getAllMonthStarts();
        if (monthStarts.length === 0) return day;
        const currentMonthStart = getMonthStartDay(day);
        const currentIndex = monthStarts.indexOf(currentMonthStart);
        if (currentIndex === -1) return day;
        if (currentIndex > 0) return monthStarts[currentIndex - 1];
        return monthStarts[0];
    }

    // Range slider: one notch per month, snaps to 1st of month (same as StudyPatients.svelte)
    let rangeSliderMax = $derived.by(() => {
        const monthStarts = getAllMonthStarts();
        return Math.max(0, monthStarts.length - 1);
    });

    let rangeSliderValue = $derived.by(() => {
        if (dateRangeEnd === dateRangeStart) return 0;
        const monthStarts = getAllMonthStarts();
        if (monthStarts.length === 0) return 0;
        const currentMonthStart = getMonthStartDay(visibleStartDay);
        const monthIndex = monthStarts.findIndex(ms => ms === currentMonthStart);
        if (monthIndex === -1) {
            const closestIndex = monthStarts.reduce((closest, ms, idx) =>
                Math.abs(ms - currentMonthStart) < Math.abs(monthStarts[closest] - currentMonthStart) ? idx : closest, 0);
            return closestIndex;
        }
        return monthIndex;
    });

    function onRangeChange(e: Event) {
        if (dateRangeStart === dateRangeEnd && dateRangeStart === 0) return;
        if (dateRangeEnd <= dateRangeStart) return;
        const target = e.target as HTMLInputElement;
        const value = parseInt(target.value);
        const monthStarts = getAllMonthStarts();
        if (monthStarts.length === 0) return;
        const monthIndex = Math.min(Math.max(0, value), monthStarts.length - 1);
        const targetMonthStart = monthStarts[monthIndex];
        const daysThatFit = calculateVisibleDays();
        visibleStartDay = targetMonthStart;
        visibleEndDay = Math.min(targetMonthStart + daysThatFit - 1, dateRangeEnd);
    }

    // Month labels for slider
    let startMonthLabel = $derived.by(() => {
        const date = getDateFromDay(dateRangeStart);
        return getMonthAbbr(date) + ' ' + date.getFullYear();
    });

    let endMonthLabel = $derived.by(() => {
        const date = getDateFromDay(dateRangeEnd);
        return getMonthAbbr(date) + ' ' + date.getFullYear();
    });

    // Navigate to today: go to the month containing today and set today as the selected date (same as StudyPatients behavior)
    function navigateToToday() {
        const refDate = timeline?.getReferenceDate() ?? new Date();
        const todayDay = getCalendarDayDiff(new Date(), refDate);
        const daysThatFit = calculateVisibleDays();
        const halfDays = Math.floor(daysThatFit / 2);

        visibleStartDay = Math.max(dateRangeStart, todayDay - halfDays);
        visibleEndDay = Math.min(visibleStartDay + daysThatFit - 1, dateRangeEnd);

        selectToday();
    }
    
    // Select today's date
    function selectToday() {
        const refDate = timeline?.getReferenceDate() ?? (patientScheduleFromDB?.referenceDate ? 
            (() => {
                const [year, month, day] = patientScheduleFromDB.referenceDate.split('-').map(Number);
                return new Date(year, month - 1, day);
            })() : new Date());
        const todayDay = getCalendarDayDiff(new Date(), refDate);
        
        selectedDay = todayDay;
        selectedDayData = getPatientDayData(todayDay);
        selectedEvents = selectedDayData?.events || [];
        
        // Reset unscheduled panel (user must click + Unscheduled to open)
        showUnscheduledPanel = false;
    }

    // Navigation - by whole months, starting at 1st of month (same as StudyPatients.svelte)
    function navigatePrevious() {
        if (dateRangeStart === dateRangeEnd) return;
        const currentMonthStart = getMonthStartDay(visibleStartDay);
        const prevMonthStart = getPreviousMonthStartDay(currentMonthStart);
        if (prevMonthStart >= dateRangeStart) {
            const daysThatFit = calculateVisibleDays();
            visibleStartDay = prevMonthStart;
            visibleEndDay = Math.min(prevMonthStart + daysThatFit - 1, dateRangeEnd);
        }
    }

    function navigateNext() {
        if (dateRangeStart === dateRangeEnd) return;
        const currentMonthStart = getMonthStartDay(visibleStartDay);
        const nextMonthStart = getNextMonthStartDay(currentMonthStart);
        if (nextMonthStart <= dateRangeEnd) {
            const daysThatFit = calculateVisibleDays();
            visibleStartDay = nextMonthStart;
            visibleEndDay = Math.min(nextMonthStart + daysThatFit - 1, dateRangeEnd);
        }
    }

    let canNavigatePrevious = $derived(visibleStartDay > dateRangeStart);
    // Next enabled when there is a next month within the range (same as StudyPatients.svelte)
    let canNavigateNext = $derived.by(() => {
        if (dateRangeStart === dateRangeEnd) return false;
        const currentMonthStart = getMonthStartDay(visibleStartDay);
        const nextMonthStart = getNextMonthStartDay(currentMonthStart);
        return nextMonthStart > currentMonthStart && nextMonthStart <= dateRangeEnd;
    });

    // Process schedule: add window days only for PENDING events (not completed/cancelled/missed).
    // Matches StudyPatients - projected path only adds window days for future events (scheduledDay >= today).
    let processedPatientDays = $derived.by(() => {
        const schedule = patientScheduleFromDB;
        // No reference date means no valid schedule - return empty
        // (days without a reference date are orphaned and can't be mapped to calendar dates)
        if (!schedule?.referenceDate) return [];
        if (!schedule?.days?.length) return [];
        const patientRefDateStr = schedule.referenceDate;
        const refDate = new Date(patientRefDateStr + 'T00:00:00');
        const today = getCalendarDayDiff(new Date(), refDate);

        const days: any[] = [];
        const dayWindowsMap = new Map<number, Array<{ eventId: string; eventName: string }>>();

        for (const dbDay of schedule.days) {
            const dayDate = dbDay.date || dayjs(patientRefDateStr).add(dbDay.day, 'day').format('YYYY-MM-DD');
            const events = (dbDay.events || []).map((event: any) => {
                // Backfill 'category' on events that don't have it yet
                // (events created before the category field was added)
                if (!event.category) {
                    if (event.scheduledDay === 0 || (event.originalScheduledDay !== undefined && event.originalScheduledDay === 0)) {
                        event.category = 'initial';
                    } else if (event.isUnscheduledEvent || event.type === 'unscheduled-event') {
                        event.category = 'unscheduled';
                    } else {
                        event.category = 'scheduled';
                    }
                }
                // Only add window days for PENDING events (matches StudyPatients: future events only)
                // Window is always based on originalScheduledDay, NOT the current scheduledDay
                const isCompleted = event?.status === 'completed' || event?.status === 'cancelled' || event?.status === 'missed';
                if (!isCompleted && event.window && event.scheduledDay !== undefined) {
                    const baseDay = event.originalScheduledDay ?? event.scheduledDay;
                    const windowStart = baseDay - (event.window.daysBefore || 0);
                    const windowEnd = baseDay + (event.window.daysAfter || 0);
                    for (let wd = windowStart; wd <= windowEnd; wd++) {
                        if (wd !== event.scheduledDay && wd !== dbDay.day && wd >= today) {
                            if (!dayWindowsMap.has(wd)) dayWindowsMap.set(wd, []);
                            dayWindowsMap.get(wd)!.push({ eventId: event.id, eventName: event.name });
                        }
                    }
                }
                return event;
            });
            days.push({ day: dbDay.day, date: dayDate, events });
        }

        // Only add windows for a day when that day has no events (same as StudyPatients: "windows array if window day with no events")
        for (const [windowDay, windowEvents] of dayWindowsMap) {
            const existingDay = days.find((d: any) => d.day === windowDay);
            if (!existingDay) {
                const windowDate = dayjs(patientRefDateStr).add(windowDay, 'day').format('YYYY-MM-DD');
                days.push({ day: windowDay, date: windowDate, events: [], windows: windowEvents });
            } else if ((!existingDay.events || existingDay.events.length === 0) && !existingDay.windows) {
                existingDay.windows = windowEvents;
            }
        }
        days.sort((a: any, b: any) => a.day - b.day);
        return days;
    });

    // Get patient day data - uses processed days (with window days for pending events only)
    function getPatientDayData(day: number): any {
        if (!processedPatientDays?.length) return null;
        const dateStr = formatDateString(getDateFromDay(day));
        return processedPatientDays.find((d: any) => d.date === dateStr);
    }

    // Get day rendering info - matches StudyPatients.svelte: events take precedence over windows
    function getDayRenderingInfo(day: number): { isWindow: boolean; event: any | null; state: string; isActual: boolean; eventType: string; isUnscheduledEvent: boolean } {
        const dayData = getPatientDayData(day);
        if (!dayData) {
            return { isWindow: false, event: null, state: '', isActual: false, eventType: '', isUnscheduledEvent: false };
        }

        // Events take precedence over windows (same as StudyPatients tooltip: "If there are events, show them")
        const event = dayData.events && dayData.events.length > 0 ? dayData.events[0] : null;
        if (event) {
            const isActual = event.type === 'actual-event';
            const eventType = event.type || 'scheduled-event';
            const isUnscheduledEvent = event.category === 'unscheduled' || event.isUnscheduledEvent === true || eventType === 'unscheduled-event';
            let state = event.state || 'on-scheduled-date';
            if (event.status === 'cancelled') {
                state = 'canceled-visit';
            } else if (event.status === 'missed') {
                state = 'missed-visit';
            }
            return { isWindow: false, event, state, isActual, eventType, isUnscheduledEvent };
        }

        // Only treat as window when there are no events (check both new windows array and legacy isWindow)
        if ((dayData.windows && dayData.windows.length > 0) || dayData.isWindow) {
            return { isWindow: true, event: null, state: '', isActual: false, eventType: '', isUnscheduledEvent: false };
        }

        return { isWindow: false, event: null, state: '', isActual: false, eventType: '', isUnscheduledEvent: false };
    }

    // Check if patient is unavailable on a day
    function isPatientUnavailable(day: number): boolean {
        const dateStr = formatDateString(getDateFromDay(day));
        return patientUnavailableDates.has(dateStr);
    }

    // Check if day is day 0
    function isPatientDayZero(day: number): boolean {
        const dayData = getPatientDayData(day);
        if (!dayData) return false;
        return typeof dayData.day === 'number' && dayData.day === 0;
    }

    // Format status for tooltip
    function formatStatus(status: string, state: string): string {
        if (status === 'completed') {
            if (state === 'on-scheduled-date') return 'Completed (on schedule)';
            if (state === 'in-window') return 'Completed (in window)';
            if (state === 'out-of-window') return 'Completed (out of window)';
            return 'Completed';
        }
        if (status === 'cancelled') return 'Cancelled';
        if (status === 'missed') return 'Missed';
        if (status === 'planned' || status === 'pending') {
            if (state === 'on-scheduled-date') return 'Planned';
            if (state === 'in-window') return 'Planned (in window)';
            if (state === 'out-of-window') return 'Planned (out of window)';
            return 'Planned';
        }
        return status;
    }

    // Format date for tooltip: Ddd, d-MMM-yyyy (e.g. Wed, 4-Mar-2026)
    function formatTooltipDate(dateStr: string): string {
        const [year, month, dayNum] = dateStr.split('-').map(Number);
        const d = new Date(year, month - 1, dayNum);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayOfWeek = dayNames[d.getDay()];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${dayOfWeek}, ${dayNum}-${months[month - 1]}-${year}`;
    }

    // Handle mouse enter for tooltip - show on timeline hover (same as StudyPatients.svelte)
    function handleCellMouseEnter(e: MouseEvent, day: number) {
        const dayData = getPatientDayData(day);
        const dateStr = formatDateString(getDateFromDay(day));
        
        let patientDay: number | null = null;
        if (patientScheduleFromDB?.referenceDate) {
            patientDay = dayjs(dateStr).diff(dayjs(patientScheduleFromDB.referenceDate), 'day');
        }
        
        const tooltipEvents: Array<{ name: string; status: string }> = [];
        
        if (dayData?.events?.length > 0) {
            for (const event of dayData.events) {
                let state = event.state || 'on-scheduled-date';
                if (event.status === 'cancelled') state = 'canceled-visit';
                else if (event.status === 'missed') state = 'missed-visit';
                
                tooltipEvents.push({
                    name: event.name || 'Unknown',
                    status: formatStatus(event.status, state)
                });
            }
        } else if (dayData?.windows?.length > 0) {
            for (const window of dayData.windows) {
                tooltipEvents.push({
                    name: window.eventName || 'Unknown',
                    status: 'Window'
                });
            }
        }
        
        tooltipContent = {
            day: patientDay,
            date: formatTooltipDate(dateStr),
            patientId: patient?.patientNumber || '',
            events: tooltipEvents
        };
        tooltipPosition = { x: e.clientX, y: e.clientY };
        
        if (tooltipTimeout) clearTimeout(tooltipTimeout);
        tooltipTimeout = setTimeout(() => {
            tooltipVisible = true;
        }, 300);
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

    // Handle cell click: in Availability mode toggle day availability (do not change selected date); in Scheduling mode select the date
    async function handleCellClick(event: MouseEvent, day: number) {
        event.stopPropagation();
        handleCellMouseLeave();

        if (viewMode === 'availability') {
            // Toggle this day's availability; do not change selected date
            const dateStr = formatDateString(getDateFromDay(day));
            const newSet = new Set(patientUnavailableDates);
            if (newSet.has(dateStr)) {
                newSet.delete(dateStr);
            } else {
                newSet.add(dateStr);
            }
            patientUnavailableDates = newSet;
            if (patientId) {
                await dataStore.setPatientUnavailableDates(patientId, Array.from(patientUnavailableDates));
            }
            return;
        }

        // Scheduling mode: select this day
        const dayData = getPatientDayData(day);
        selectedDay = day;
        selectedDayData = dayData;
        selectedEvents = dayData?.events || [];

        // Reset unscheduled panel (user must click + Unscheduled to open)
        showUnscheduledPanel = false;
    }

    // Get Day 0 events from timeline
    function getDay0Events(): Array<{ name: string; id: string }> {
        if (!timeline) return [];
        
        const events: Array<{ name: string; id: string }> = [];
        const seenEventNames = new Set<string>();
        
        const allDays = timeline.getDays();
        for (const day of allDays) {
            const dayEvents = day.getEventInstances();
            for (const event of dayEvents) {
                const scheduledDay = (event as any).startDay;
                const eventName = event.getName();
                
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
    function getUnscheduledEvents(): Array<{ name: string; id: string }> {
        if (!studyConfig) return [];
        
        const events: Array<{ name: string; id: string }> = [];
        
        for (const unscheduledEvent of studyConfig.unscheduledEvents || []) {
            events.push({
                name: unscheduledEvent.name,
                id: unscheduledEvent.name.toLowerCase().replace(/\s+/g, '-')
            });
        }
        
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

    // Get period name for a day
    function getPeriodForDay(day: number): string {
        const dayData = getPatientDayData(day);
        if (dayData?.period) return dayData.period;
        
        // Try to get from first event
        if (dayData?.events?.[0]?.period) return dayData.events[0].period;
        
        return 'Study';
    }

    // Close event card - hide the event cards section
    function closeEventCard() {
        selectedDay = null;
        selectedDayData = null;
        selectedEvents = [];
        showUnscheduledPanel = false;
    }

    // Save the current patient schedule to the database
    async function savePatientSchedule() {
        if (!patientScheduleFromDB) return;
        
        // Build schedule structure matching StudyPatients.svelte save pattern
        const schedule = {
            referenceDate: patientScheduleFromDB.referenceDate,
            days: (patientScheduleFromDB.days || [])
                .filter((day: any) => day.events && day.events.length > 0)
                .map((day: any) => ({
                    day: day.day,
                    date: day.date,
                    events: day.events.map((event: any) => ({
                        id: event.id,
                        type: event.type,
                        category: event.category,
                        name: event.name,
                        actualDay: event.actualDay,
                        scheduledDay: event.scheduledDay,
                        originalScheduledDay: event.originalScheduledDay,
                        status: event.status,
                        state: event.state,
                        window: event.window,
                        isUnscheduledEvent: event.isUnscheduledEvent
                    }))
                }))
        };
        
        console.log('[savePatientSchedule] Saving schedule for patient:', patientId, schedule);
        try {
            const success = await dataStore.setPatientSchedule(patientId, schedule);
            if (success) {
                console.log('[savePatientSchedule] Schedule saved successfully');
            } else {
                console.error('[savePatientSchedule] Failed to save schedule');
            }
        } catch (err) {
            console.error('[savePatientSchedule] Error saving schedule:', err);
        }
    }

    // Refresh the selected day's events from the (mutated) schedule data
    function refreshSelectedDayEvents() {
        if (selectedDay === null) return;
        selectedDayData = getPatientDayData(selectedDay);
        selectedEvents = selectedDayData?.events || [];
    }

    // Handle event action (complete, cancel, miss, move, delete, reset)
    // Modifies patientScheduleFromDB directly and saves to database — same pattern as StudyPatients.svelte handleScheduledAction
    async function handleEventAction(eventId: string, action: string, data?: any) {
        console.log('[handleEventAction]', eventId, action, data);
        
        if (!patientScheduleFromDB?.days) {
            console.error('[handleEventAction] No schedule data');
            return;
        }
        
        // Find the day containing this event
        let dayData: any = null;
        let dayIndex = -1;
        let eventIndex = -1;
        for (let di = 0; di < patientScheduleFromDB.days.length; di++) {
            const d = patientScheduleFromDB.days[di];
            if (!d.events) continue;
            const ei = d.events.findIndex((e: any) => e.id === eventId);
            if (ei >= 0) {
                dayData = d;
                dayIndex = di;
                eventIndex = ei;
                break;
            }
        }
        
        if (!dayData || eventIndex < 0) {
            console.error('[handleEventAction] Event not found:', eventId);
            return;
        }
        
        const event = dayData.events[eventIndex];
        
        if (action === 'complete') {
            event.status = 'completed';
            event.type = 'actual-event';
            if (event.actualDay === undefined) {
                event.actualDay = dayData.day;
            }
            console.log('[handleEventAction] Marked complete:', event);
        } else if (action === 'cancel') {
            event.status = 'cancelled';
            event.type = 'actual-event';
            if (event.actualDay === undefined) {
                event.actualDay = dayData.day;
            }
            console.log('[handleEventAction] Marked cancelled:', event);
        } else if (action === 'missed') {
            event.status = 'missed';
            event.type = 'actual-event';
            if (event.actualDay === undefined) {
                event.actualDay = dayData.day;
            }
            console.log('[handleEventAction] Marked missed:', event);
        } else if (action === 'reset') {
            event.status = 'pending';
            event.type = 'scheduled-event';
            delete event.actualDay;
            // Recalculate state from originalScheduledDay + window
            const origDay = event.originalScheduledDay ?? event.scheduledDay;
            if (event.window) {
                const wStart = origDay - (event.window.daysBefore || 0);
                const wEnd = origDay + (event.window.daysAfter || 0);
                if (event.scheduledDay === origDay) {
                    event.state = 'on-scheduled-date';
                } else if (event.scheduledDay >= wStart && event.scheduledDay <= wEnd) {
                    event.state = 'in-window';
                } else {
                    event.state = 'out-of-window';
                }
            } else {
                event.state = 'on-scheduled-date';
            }
            console.log('[handleEventAction] Reset to pending:', event);
        } else if (action === 'move' && data?.date) {
            if (!patientScheduleFromDB.referenceDate) {
                console.error('[handleEventAction] No reference date for move');
                return;
            }
            const newDayNumber = getCalendarDayDiff(new Date(data.date + 'T00:00:00'), patientScheduleFromDB.referenceDate);
            console.log('[handleEventAction] Moving event from day', dayData.day, 'to day', newDayNumber);
            
            // Remove event from current day
            dayData.events.splice(eventIndex, 1);
            
            // Update the event
            const originalDay = (event.originalScheduledDay !== undefined && event.originalScheduledDay !== null)
                ? event.originalScheduledDay
                : event.scheduledDay;
            if (event.originalScheduledDay === undefined || event.originalScheduledDay === null) {
                event.originalScheduledDay = event.scheduledDay;
            }
            event.scheduledDay = newDayNumber;
            
            // Calculate correct state
            const eventWindow = event.window || { daysBefore: 0, daysAfter: 0 };
            const windowStart = originalDay - (eventWindow.daysBefore || 0);
            const windowEnd = originalDay + (eventWindow.daysAfter || 0);
            if (newDayNumber === originalDay) {
                event.state = 'on-scheduled-date';
            } else if (newDayNumber >= windowStart && newDayNumber <= windowEnd) {
                event.state = 'in-window';
            } else {
                event.state = 'out-of-window';
            }
            
            // Find or create target day
            let targetDay = patientScheduleFromDB.days.find((d: any) => d.day === newDayNumber);
            if (targetDay) {
                if (!targetDay.events) targetDay.events = [];
            } else {
                const targetDate = new Date(patientScheduleFromDB.referenceDate + 'T00:00:00');
                targetDate.setDate(targetDate.getDate() + newDayNumber);
                const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
                targetDay = { day: newDayNumber, date: dateStr, events: [] };
                patientScheduleFromDB.days.push(targetDay);
            }
            targetDay.events.push(event);
            
            // Remove empty source day
            if (dayData.events.length === 0 && (!dayData.windows || dayData.windows.length === 0)) {
                patientScheduleFromDB.days.splice(dayIndex, 1);
            }
            
            console.log('[handleEventAction] Moved event, new state:', event.state);
        } else if (action === 'delete') {
            dayData.events.splice(eventIndex, 1);
            console.log('[handleEventAction] Deleted event:', eventId);
            
            // Remove empty day
            if (dayData.events.length === 0 && (!dayData.windows || dayData.windows.length === 0)) {
                patientScheduleFromDB.days.splice(dayIndex, 1);
            }
        }
        
        // Trigger reactivity by reassigning
        patientScheduleFromDB = { ...patientScheduleFromDB };
        
        // Save to database
        await savePatientSchedule();
        
        // Refresh the displayed events for the selected day
        refreshSelectedDayEvents();
    }

    // Handle add unscheduled event
    async function handleAddUnscheduledEvent(eventName: string) {
        if (selectedDay === null) return;
        
        console.log('[handleAddUnscheduledEvent]', eventName, 'on day', selectedDay);
        
        if (!patientScheduleFromDB) {
            console.error('[handleAddUnscheduledEvent] No schedule data');
            return;
        }
        
        // Generate event ID
        const slug = eventName.toLowerCase().replace(/\s+/g, '-');
        const existingCount = (patientScheduleFromDB.days || []).reduce((count: number, day: any) => {
            return count + (day.events || []).filter((e: any) => e.name === eventName).length;
        }, 0);
        const eventId = `${slug}-${existingCount + 1}`;
        
        // Create the unscheduled event
        const newEvent = {
            id: eventId,
            type: 'unscheduled-event',
            category: 'unscheduled',
            name: eventName,
            scheduledDay: selectedDayData?.day ?? selectedDay,
            status: 'planned',
            state: 'on-scheduled-date',
            window: { daysBefore: 0, daysAfter: 0 },
            isUnscheduledEvent: true
        };
        
        // Find or create the target day
        const dateStr = formatDateString(getDateFromDay(selectedDay));
        let targetDay = (patientScheduleFromDB.days || []).find((d: any) => d.date === dateStr);
        if (targetDay) {
            if (!targetDay.events) targetDay.events = [];
        } else {
            const dayNumber = selectedDayData?.day ?? selectedDay;
            targetDay = { day: dayNumber, date: dateStr, events: [] };
            if (!patientScheduleFromDB.days) patientScheduleFromDB.days = [];
            patientScheduleFromDB.days.push(targetDay);
        }
        targetDay.events.push(newEvent);
        
        // Trigger reactivity
        patientScheduleFromDB = { ...patientScheduleFromDB };
        
        // Save to database
        await savePatientSchedule();
        
        // Refresh the displayed events
        refreshSelectedDayEvents();
        
        // Close the unscheduled panel
        showUnscheduledPanel = false;
    }

    // Initialize
    onMount(async () => {
        loadSplitterSetting();
        loadShowWindowsSetting();
        loadShowAvailabilitySetting();
        await loadPatientData();
        
        // Set up drawer visibility
        setAllDrawersVisibility(false);
        setDrawerVisibility("help", true);
        setDrawerVisibility("visitChecklist", true);
        if (patient && studyId) {
            setDrawerProps("visitChecklist", { patientId: patientId, studyId: studyId, selectedDate: new Date() });
        }
    });

    onDestroy(() => {
        setDrawerVisibility("visitChecklist", false);
    });
</script>

{#if patient}
    <div class="study-patient-container" style="height: calc(100vh - 5.75rem);">
        <div bind:this={splitterContainer} class="splitter-container" class:dragging={isDraggingSplitter} style="height: 100%;">
            <!-- Left Panel: Patient Card -->
            <div class="splitter-panel left" style="width: {patientCardWidth}rem; flex-shrink: 0;">
                <PatientCard patientId={patient.id} />
            </div>
            
            <!-- Splitter Handle -->
            <!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
            <button type="button" bind:this={splitterHandle} class="splitter-handle" onmousedown={handleSplitterMouseDown} role="separator" aria-orientation="vertical" aria-label="Resize patient card panel"></button>
            
            <!-- Right Panel: Timeline Content -->
            <div class="splitter-panel right timeline-chart-wrapper" style="flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden;">
                <div class="timeline-chart mt-2 ml-2" bind:this={containerRef}>
                    <!-- Controls - same as StudyPatients.svelte -->
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
                                />
                                <span class="range-label">{endMonthLabel}</span>
                            </div>
                            <button class="today-button" onclick={navigateToToday} title="Go to today">
                                Goto Today
                            </button>
                        </div>
                        <div class="control-group">
                            <span class="control-label">Mode</span>
                            <button class="mode-toggle-btn {viewMode}" onclick={() => viewMode = viewMode === 'scheduling' ? 'availability' : 'scheduling'}>
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
                                <input class="toolbar-checkbox" type="checkbox" bind:checked={showWindows} onchange={saveShowWindowsSetting} />
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

                    {#if isLoading}
                        <div class="loading-container">
                            <div class="spinner"></div>
                            <p>Loading patient timeline...</p>
                        </div>
                    {:else if error}
                        <div class="error-container">
                            <p class="error-message">{error}</p>
                        </div>
                    {:else}
                        <!-- Single Patient Timeline - just the days grid, no left column (patient info is in PatientCard) -->
                        <div class="single-patient-timeline">
                            <div class="days-container" style="--day-width: {DAY_WIDTH}px;">
                                <!-- Month headers with navigation buttons -->
                                <div class="month-headers-row with-nav">
                                    <div class="month-nav-buttons">
                                        <button 
                                            class="grid-button general-button" 
                                            class:nav-disabled={!canNavigatePrevious}
                                            onclick={navigatePrevious} 
                                            disabled={!canNavigatePrevious} 
                                            aria-label="Previous month"
                                        >
                                            <IconChevronCircleLeft size={20} />
                                        </button>
                                        <button 
                                            class="grid-button general-button" 
                                            class:nav-disabled={!canNavigateNext}
                                            onclick={navigateNext} 
                                            disabled={!canNavigateNext} 
                                            aria-label="Next month"
                                        >
                                            <IconChevronCircleRight size={20} />
                                        </button>
                                    </div>
                                    {#each monthGroups as group}
                                        <div class="month-header" style="grid-column: {group.startIndex + 1} / {group.endIndex + 2}; background-color: {group.backgroundColor};">
                                            {getMonthAbbr(new Date(group.year, group.month, 1))} {group.year}
                                        </div>
                                    {/each}
                                </div>
                                
                                <!-- Day headers - date above day of week -->
                                <div class="day-headers-row">
                                    {#each visibleDays as day}
                                        {@const date = getDateFromDay(day)}
                                        {@const monthGroup = monthGroups.find(g => {
                                            const dayMonth = getMonthForDay(day);
                                            return g.month === dayMonth.month && g.year === dayMonth.year;
                                        })}
                                        <div 
                                            class="day-header" 
                                            class:weekend={isWeekend(date)}
                                            class:today={isToday(day)}
                                            style={monthGroup && !isWeekend(date) && !isToday(day) ? `background-color: ${monthGroup.backgroundColor};` : ''}
                                        >
                                            <span class="day-number">{date.getDate()}</span>
                                            <span class="day-of-week">{getDayOfWeekAbbr(date)}</span>
                                        </div>
                                    {/each}
                                </div>
                                
                                <!-- Single patient row -->
                                <div class="patient-row" class:availability-mode={viewMode === 'availability'}>
                                    {#each visibleDays as day}
                                        {@const date = getDateFromDay(day)}
                                        {@const dayInfo = getDayRenderingInfo(day)}
                                        {@const isUnavailable = isPatientUnavailable(day)}
                                        {@const isDayZero = isPatientDayZero(day)}
                                        {@const shouldShowUnavailable = isUnavailable && (viewMode === 'availability' || showAvailability)}
                                        {@const unavailableOnly = shouldShowUnavailable && !dayInfo.event && (!dayInfo.isWindow || !showWindows)}
                                        {@const isSelected = viewMode === 'scheduling' && selectedDay === day}
                                        <div 
                                            class="timeline-cell clickable" 
                                            class:weekend={isWeekend(date)}
                                            class:today={isToday(day)}
                                            class:day-zero={isDayZero}
                                            class:unavailable={shouldShowUnavailable}
                                            class:unavailable-only={unavailableOnly}
                                            class:selected={isSelected}
                                            role="button"
                                            tabindex="0"
                                            onmousedown={(e) => { if (viewMode === 'availability') e.preventDefault(); }}
                                            onclick={(e) => handleCellClick(e, day)}
                                            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCellClick(e as unknown as MouseEvent, day); }}
                                            onmouseenter={(e) => handleCellMouseEnter(e, day)}
                                            onmouseleave={handleCellMouseLeave}
                                        >
                                            {#if dayInfo && dayInfo.isWindow && showWindows && !dayInfo.event}
                                                <!-- Window day with no events -->
                                                <div class="event-indicator window">
                                                    <IconWindow size={14} />
                                                </div>
                                            {:else if dayInfo && dayInfo.event}
                                                <!-- Event day -->
                                                {@const event = dayInfo.event}
                                                {@const state = dayInfo.state}
                                                {@const isActual = dayInfo.isActual}
                                                {@const isUnscheduled = dayInfo.isUnscheduledEvent}
                                                {@const eventTypeClass = isActual ? 'actual' : (isUnscheduled ? 'unscheduled' : 'scheduled')}
                                                <div class="event-indicator {eventTypeClass} {state}" class:day-zero-indicator={isDayZero}>
                                                    {#if isActual}
                                                        {#if state === "on-scheduled-date" || state === "in-window" || state === "out-of-window"}
                                                            <IconCheck size={18} />
                                                        {:else if state === "canceled-visit" || state === "missed-visit"}
                                                            <IconX size={18} />
                                                        {/if}
                                                    {:else if isDayZero}
                                                        <IconCalendar1 size={16} />
                                                    {:else}
                                                        <IconCalendar size={16} />
                                                    {/if}
                                                </div>
                                            {/if}
                                            {#if shouldShowUnavailable}
                                                <div class="unavailable-overlay"></div>
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        </div>

                        <!-- Event Cards Section -->
                        {#if selectedDay !== null}
                            <div class="event-cards-section">
                                <!-- Day/Date/Patient Header with close button -->
                                <div class="event-cards-header">
                                    <div class="event-cards-header-top">
                                        <div class="event-cards-header-info">
                                            {#if patientScheduleFromDB?.referenceDate}
                                                <span class="day-number-label">Day {selectedDayData?.day !== undefined && selectedDayData?.day !== null ? selectedDayData.day : selectedDay}</span>
                                            {/if}
                                            <span class="date-label">{formatSelectedDate(selectedDay)}</span>
                                        </div>
                                    </div>
                                    <div class="event-cards-patient-row">
                                        <span class="event-cards-patient-id">{patient.patientNumber}</span>
                                        {#if getUnscheduledEvents().length > 0 && patientScheduleFromDB?.referenceDate}
                                            <button class="event-cards-unscheduled-btn" onclick={handleOpenUnscheduledPanel}>
                                                <IconPlus size={14} /> Unscheduled
                                            </button>
                                        {/if}
                                    </div>
                                </div>
                                
                                <div class="event-cards-row">
                                    {#each selectedEvents as event}
                                        {@const eventType = event.category === 'initial' ? 'initial' : event.category === 'unscheduled' ? 'unscheduled' : (event.isUnscheduledEvent || event.type === 'unscheduled-event') ? 'unscheduled' : (event.scheduledDay === 0 || event.originalScheduledDay === 0) ? 'initial' : 'scheduled'}
                                        <EventCard 
                                            {eventType}
                                            mode="scheduled"
                                            {event}
                                            periodName={getPeriodForDay(selectedDay)}
                                            dayNumber={selectedDayData?.day ?? 0}
                                            date={getDateFromDay(selectedDay)}
                                            patientId={patient.patientNumber}
                                            patientReferenceDate={patientScheduleFromDB?.referenceDate ?? null}
                                            {studyId}
                                            onAction={handleEventAction}
                                            onDelete={() => handleEventAction(event.id, 'delete')}
                                        />
                                    {/each}
                                    
                                    {#if selectedEvents.length === 0 && !patientScheduleFromDB?.referenceDate}
                                        <!-- Initial event selection -->
                                        <EventCard 
                                            eventType="initial"
                                            mode="selection"
                                            availableEvents={getDay0Events()}
                                            selectedEventIds={selectedInitialEvents}
                                            onToggleSelection={toggleInitialEventSelection}
                                            onAdd={() => handleAddUnscheduledEvent('PreScreen')}
                                        />
                                    {/if}
                                    
                                    {#if showUnscheduledPanel}
                                        <!-- Unscheduled event selection (shown when + Unscheduled button is clicked) -->
                                        <EventCard 
                                            eventType="unscheduled"
                                            mode="selection"
                                            availableEvents={getUnscheduledEvents()}
                                            selectedEventIds={selectedUnscheduledEvents}
                                            onToggleSelection={toggleUnscheduledEventSelection}
                                            onAdd={handleAddSelectedUnscheduledEvents}
                                            onCancel={handleCancelUnscheduledPanel}
                                        />
                                    {/if}
                                </div>
                            </div>
                        {/if}
                    {/if}
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
                                {#each tooltipContent.events as event}
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
            </div>
        </div>
    </div>
{:else if isLoading}
    <div class="h-full crc-content-width">
        <div class="placeholder animate-pulse"></div>
    </div>
{:else}
    <div class="error-container">
        <p>{error || 'Patient not found'}</p>
    </div>
{/if}

