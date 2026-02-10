<script lang="ts">
    import { createEventDispatcher } from "svelte";
    // @ts-ignore
    import { Plus as IconPlus, X as IconX, Calendar as IconCalendar, ChevronLeft as IconChevronLeft, ChevronRight as IconChevronRight } from '@lucide/svelte';
    

    // Types for popup data
    export type PopupType = 'initial' | 'event-day' | 'no-event';
    export type EventStatus = 'planned' | 'pending' | 'completed' | 'cancelled' | 'missed';
    // Simplified actions: do-nothing, complete, reschedule, move, cancel, missed, delete (for unscheduled)
    // 'change-status' is kept for handler compatibility (maps from complete/cancel/missed)
    // 'reschedule' - for regular planned events (creates window days around original date)
    // 'move' - for day 0 and unscheduled events (does NOT create window days, triggers recalculation)
    export type EventAction = 'do-nothing' | 'complete' | 'reschedule' | 'move' | 'cancel' | 'missed' | 'delete' | 'change-status';
    
    export interface EventOption {
        name: string;
        id: string;
    }
    
    export interface DayEvent {
        id: string;
        type: string;
        category?: string; // Event origin: 'initial' | 'scheduled' | 'unscheduled'
        name: string;
        scheduledDay: number;
        originalScheduledDay?: number;
        status: EventStatus;
        state: string;
        window?: { daysBefore: number; daysAfter: number };
        isUnscheduledEvent?: boolean; // True if this event was added as an unscheduled event
    }
    
    export interface DayData {
        day: number;
        date: string;
        available?: boolean;
        isWindow?: boolean;
        windows?: Array<{ eventId: string; eventName: string }>;
        events?: DayEvent[];
    }
    
    
    
    // Helper to check if an event is a day 0 event
    function isDayZeroEvent(event: DayEvent): boolean {
        // Day 0 event has scheduledDay === 0 (or originalScheduledDay === 0 if it was moved)
        const originalDay = event.originalScheduledDay !== undefined ? event.originalScheduledDay : event.scheduledDay;
        return originalDay === 0;
    }
    
    // Helper to check if an event can be rescheduled/moved (only planned/pending status)
    function canBeRescheduledOrMoved(event: DayEvent): boolean {
        return event.status === 'planned' || event.status === 'pending';
    }
    
    export interface PopupResult {
        patientAvailable: boolean;
        availabilityChanged: boolean;
        keepOpen?: boolean;
        initialEvent?: {
            enabled: boolean;
            eventName: string;
            status: EventStatus;
        };
        scheduledEvents?: Array<{
            eventId: string;
            eventName: string;
            action: EventAction;
            newStatus?: EventStatus;
            rescheduleDate?: string;
        }>;
        unscheduledEvent?: {
            enabled: boolean;
            eventName: string;
            status: EventStatus;
        };
    }

    // Props
    const { 
        open = false,
        date,
        patientId,
        patientReferenceDate = null,
        dayData = null,
        popupType,
        day0Events = [],
        unscheduledEvents = [],
        scheduledEvents = [],
        anchorElement = null,
        modelError = null
    } = $props<{
        open?: boolean;
        date: Date;
        patientId: string;
        patientReferenceDate?: string | null; // Reference date for calculating scheduled date
        dayData: DayData | null;
        popupType: PopupType;
        day0Events: EventOption[];
        unscheduledEvents: EventOption[];
        scheduledEvents: DayEvent[];
        anchorElement?: HTMLElement | null;
        modelError?: string | null; // When set, shows error message instead of normal popup content
    }>();

    const dispatch = createEventDispatcher<{
        apply: PopupResult;
        cancel: void;
        availabilityChange: { available: boolean };
        initialAction: { action: string; eventName: string; moveDate?: string };
        scheduledAction: { action: string; eventId: string; eventName: string; dayNumber: number; moveDate?: string };
        unscheduledAdd: { eventName: string };
    }>();

    // Local state
    let patientAvailable = $state(true);
    let initialPatientAvailable = $state(true);
    
    // Initial event state (Popup 1)
    let selectedInitialEvent = $state('');
    let initialEventStatus = $state<EventStatus>('planned');
    
    
    // Unscheduled event state
    let unscheduledEventEnabled = $state(false);
    let selectedUnscheduledEvent = $state('');
    let unscheduledEventStatus = $state<EventStatus>('planned');
    
    // Initial event phase tracking (inline state transitions within popup)
    type InitialEventPhase = 'selection' | 'actionable' | 'move-calendar' | 'resolved';
    let initialEventPhase = $state<InitialEventPhase>('selection');
    let checkedInitialEvent = $state('');
    let initialEventName = $state('');
    let initialEventTerminalStatus = $state<EventStatus>('planned');

    // Scheduled event phase tracking (per-event, same pattern as initial event)
    type ScheduledEventPhase = 'actionable' | 'move-calendar' | 'resolved';
    let scheduledEventPhaseMap = $state<Map<string, { phase: ScheduledEventPhase; terminalStatus?: EventStatus }>>(new Map());
    // Track which scheduled event is currently in move-calendar mode (only one at a time)
    let scheduledMoveEventId = $state('');
    let scheduledMoveEventName = $state('');

    // Unscheduled event checkbox selection
    let checkedUnscheduledEvent = $state('');
    // Whether the unscheduled event selector list is visible (toggled by + Unscheduled button)
    let showUnscheduledSelector = $state(false);

    // Move calendar state (shared between initial and scheduled event move modes)
    let moveCalendarYear = $state(new Date().getFullYear());
    let moveCalendarMonth = $state(new Date().getMonth());
    let selectedMoveDay = $state<number | null>(null);
    // Track which context is using the move calendar: 'initial' or 'scheduled'
    let moveCalendarContext = $state<'initial' | 'scheduled'>('initial');

    // Calendar constants
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Derived: Calendar days grid (null for empty cells before 1st of month)
    let calendarDays = $derived.by(() => {
        const firstDay = new Date(moveCalendarYear, moveCalendarMonth, 1);
        const lastDay = new Date(moveCalendarYear, moveCalendarMonth + 1, 0);
        const startDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();
        const days: (number | null)[] = [];
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }
        for (let d = 1; d <= daysInMonth; d++) {
            days.push(d);
        }
        return days;
    });

    function isCalendarToday(day: number): boolean {
        const today = new Date();
        return day === today.getDate() && moveCalendarMonth === today.getMonth() && moveCalendarYear === today.getFullYear();
    }

    function isCalendarWeekend(day: number): boolean {
        const d = new Date(moveCalendarYear, moveCalendarMonth, day);
        const dow = d.getDay();
        return dow === 0 || dow === 6;
    }

    // Helper: get the moving event for calendar highlighting
    function getMovingEvent(): DayEvent | undefined {
        if (moveCalendarContext === 'scheduled' && scheduledMoveEventId) {
            return scheduledEvents.find(e => e.id === scheduledMoveEventId);
        } else if (moveCalendarContext === 'initial') {
            return dayData?.events?.find((e: any) => e.category === 'initial');
        }
        return undefined;
    }

    // Helper: convert a day number (relative to reference date) to an actual Date
    function dayNumberToDate(dayNumber: number): Date | null {
        if (!patientReferenceDate) return null;
        const [refY, refM, refD] = patientReferenceDate.split('-').map(Number);
        const refDate = new Date(refY, refM - 1, refD);
        refDate.setDate(refDate.getDate() + dayNumber);
        return refDate;
    }

    // Helper: check if a calendar day matches a specific date
    function calendarDayMatchesDate(day: number, targetDate: Date): boolean {
        return day === targetDate.getDate() &&
               moveCalendarMonth === targetDate.getMonth() &&
               moveCalendarYear === targetDate.getFullYear();
    }

    // Check if a calendar day falls within the event's scheduling window
    // Uses originalScheduledDay (the original position) to calculate the window, NOT scheduledDay (current position)
    function isCalendarInWindow(day: number): boolean {
        const movingEvent = getMovingEvent();
        if (!movingEvent?.window) return false;
        
        // Use originalScheduledDay for window calculation, fall back to scheduledDay
        const baseDay = movingEvent.originalScheduledDay ?? movingEvent.scheduledDay;
        const scheduledDate = dayNumberToDate(baseDay);
        if (!scheduledDate) return false;
        
        // Calculate window start/end dates
        const windowStart = new Date(scheduledDate);
        windowStart.setDate(windowStart.getDate() - movingEvent.window.daysBefore);
        const windowEnd = new Date(scheduledDate);
        windowEnd.setDate(windowEnd.getDate() + movingEvent.window.daysAfter);
        
        // Check if the calendar day falls within the window
        const calDate = new Date(moveCalendarYear, moveCalendarMonth, day);
        return calDate >= windowStart && calDate <= windowEnd;
    }

    // Check if a calendar day is the event's current actual position (scheduledDay)
    // This is where the event currently sits — colored by state:
    //   green = on-scheduled-date, blue = in-window, orange = out-of-window
    function isCalendarCurrentEventDay(day: number): boolean {
        const movingEvent = getMovingEvent();
        if (!movingEvent) return false;
        
        const currentDate = dayNumberToDate(movingEvent.scheduledDay);
        if (!currentDate) return false;
        
        return calendarDayMatchesDate(day, currentDate);
    }

    // Get the state-based class for the current event day
    function getCalendarEventDayState(): 'on-scheduled-date' | 'in-window' | 'out-of-window' {
        const movingEvent = getMovingEvent();
        if (!movingEvent) return 'on-scheduled-date';
        
        // Use the event's current state to determine color
        if (movingEvent.state === 'out-of-window') return 'out-of-window';
        if (movingEvent.state === 'in-window') return 'in-window';
        return 'on-scheduled-date';
    }

    // Check if a calendar day is the original scheduled date (green outline marker)
    function isCalendarOriginalScheduledDay(day: number): boolean {
        const movingEvent = getMovingEvent();
        if (!movingEvent) return false;
        
        const baseDay = movingEvent.originalScheduledDay ?? movingEvent.scheduledDay;
        const originalDate = dayNumberToDate(baseDay);
        if (!originalDate) return false;
        
        return calendarDayMatchesDate(day, originalDate);
    }

    function navigateCalendarMonth(delta: number) {
        let newMonth = moveCalendarMonth + delta;
        let newYear = moveCalendarYear;
        if (newMonth < 0) {
            newMonth = 11;
            newYear--;
        } else if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        }
        moveCalendarMonth = newMonth;
        moveCalendarYear = newYear;
        selectedMoveDay = null;
    }

    // Status badge helpers for initial event phase display
    function getStatusBadgeClass(status: EventStatus): string {
        switch (status) {
            case 'completed': return 'status-completed';
            case 'cancelled': return 'status-cancelled';
            case 'missed': return 'status-missed';
            default: return 'status-planned';
        }
    }

    function getStatusLabel(status: EventStatus): string {
        switch (status) {
            case 'completed': return 'COMPLETED';
            case 'cancelled': return 'CANCELLED';
            case 'missed': return 'MISSED';
            default: return 'PLANNED';
        }
    }

    // Internal popup type - locked on init so it doesn't change when the parent
    // re-derives popupType after data saves (e.g., initial -> event-day after Add)
    let activePopupType = $state<PopupType>('initial');

    // Popup position state
    let popupStyle = $state('');
    let popupRef = $state<HTMLElement | null>(null);
    let justOpened = $state(false);
    let initialized = $state(false);
    let lastInitDate = $state<string>('');
    let lastInitPatientId = $state<string>('');
    
    // Today's date string for validation (cannot add unscheduled events or reschedule/move before today)
    let todayDateString = $derived.by(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    });
    
    // Get the popup date as YYYY-MM-DD string for comparison
    let popupDateString = $derived.by(() => {
        if (!date) return '';
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
    
    // Restriction: Cannot add unscheduled event before Day 0 OR before today
    // Day 0 is the reference date, so day number must be >= 0
    // Also, the date must be >= today
    let canAddUnscheduledEvent = $derived(
        dayData?.day !== undefined && 
        dayData.day >= 0 && 
        popupDateString >= todayDateString
    );
    
    

    // Helper to get a date string from a day number relative to reference date
    function getDateStringFromDay(dayNumber: number, refDate: string | null): string {
        if (!refDate) {
            // Fallback to today if no reference date
            const today = new Date();
            return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        }
        // Parse reference date and add days
        const ref = new Date(refDate + 'T00:00:00'); // Ensure local time parsing
        ref.setDate(ref.getDate() + dayNumber);
        return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}-${String(ref.getDate()).padStart(2, '0')}`;
    }
    
    // hasChanges is no longer needed for scheduled/unscheduled events (actions are immediate)
    // Kept only for backward compatibility with any remaining footer logic
    let hasChanges = $derived.by(() => {
        if (activePopupType === 'initial') {
            return true;
        }
        return false;
    });

    // Calculate popup position
    function updatePopupPosition() {
        if (!anchorElement || !popupRef) return;
        
        const anchorRect = anchorElement.getBoundingClientRect();
        const popupRect = popupRef.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = anchorRect.left + (anchorRect.width / 2) - (popupRect.width / 2);
        let top = anchorRect.bottom + 4;
        
        if (left + popupRect.width > viewportWidth - 10) {
            left = viewportWidth - popupRect.width - 10;
        }
        if (left < 10) {
            left = 10;
        }
        if (top + popupRect.height > viewportHeight - 10) {
            top = anchorRect.top - popupRect.height - 4;
        }
        
        popupStyle = `left: ${left}px; top: ${top}px;`;
    }

    // Initialize state when popup opens
    $effect(() => {
        const currentDateStr = date ? date.toISOString() : '';
        const currentPatientIdStr = patientId || '';
        
        const needsInit = open && (!initialized || 
            lastInitDate !== currentDateStr || 
            lastInitPatientId !== currentPatientIdStr);
        
        if (needsInit) {
            initialized = true;
            lastInitDate = currentDateStr;
            lastInitPatientId = currentPatientIdStr;
            
            // Lock the popup type at init time so it doesn't change mid-interaction
            activePopupType = popupType;
            
            // Initialize availability
            const available = dayData?.available !== false;
            patientAvailable = available;
            initialPatientAvailable = available;
            
            // Initialize initial event (popup 1)
            selectedInitialEvent = day0Events.length > 0 ? day0Events[0].name : '';
            initialEventStatus = 'planned';
            
            // Initialize initial event phase (for inline transitions)
            // Check if there's already an initial event on this day (re-opening after Add)
            const existingInitialEvent = dayData?.events?.find((e: any) => e.category === 'initial');
            if (existingInitialEvent) {
                // Event already exists - go directly to actionable or resolved phase
                initialEventName = existingInitialEvent.name;
                checkedInitialEvent = existingInitialEvent.name;
                const isTerminal = ['completed', 'cancelled', 'missed'].includes(existingInitialEvent.status);
                if (isTerminal) {
                    initialEventPhase = 'resolved';
                    initialEventTerminalStatus = existingInitialEvent.status;
                } else {
                    initialEventPhase = 'actionable';
                    initialEventTerminalStatus = 'planned';
                }
            } else {
                // No initial event yet - start with selection phase
                initialEventPhase = 'selection';
                // Auto-check if there is only one event in the list
                checkedInitialEvent = day0Events.length === 1 ? day0Events[0].name : '';
                initialEventName = '';
                initialEventTerminalStatus = 'planned';
            }
            
            // Initialize scheduled event phases (popup 2) - per-event phase tracking
            const newPhaseMap = new Map<string, { phase: ScheduledEventPhase; terminalStatus?: EventStatus }>();
            for (const event of scheduledEvents) {
                const isTerminal = ['completed', 'cancelled', 'missed'].includes(event.status);
                if (isTerminal) {
                    newPhaseMap.set(event.id, { phase: 'resolved', terminalStatus: event.status as EventStatus });
                } else {
                    newPhaseMap.set(event.id, { phase: 'actionable' });
                }
            }
            scheduledEventPhaseMap = newPhaseMap;
            scheduledMoveEventId = '';
            scheduledMoveEventName = '';
            
            // Initialize unscheduled event checkbox selection
            checkedUnscheduledEvent = '';
            showUnscheduledSelector = false;
            unscheduledEventEnabled = false;
            selectedUnscheduledEvent = unscheduledEvents.length > 0 ? unscheduledEvents[0].name : '';
            unscheduledEventStatus = 'planned';
            
            requestAnimationFrame(() => {
                updatePopupPosition();
            });
        } else if (!open) {
            initialized = false;
            lastInitDate = '';
            lastInitPatientId = '';
        }
    });

    $effect(() => {
        if (open && popupRef && anchorElement) {
            updatePopupPosition();
        }
    });

    // Format date for display: Ddd, d-MMM-yyyy (e.g. Wed, 4-Mar-2026)
    function formatDate(d: Date): string {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayOfWeek = dayNames[d.getDay()];
        const day = d.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${dayOfWeek}, ${day}-${month}-${year}`;
    }

    
    
    

    

    // handleApply is now only used for initial event Add and unscheduled event Add
    // Scheduled events use immediate scheduledAction dispatch instead
    function handleApply() {
        const availabilityChanged = patientAvailable !== initialPatientAvailable;
        
        const result: PopupResult = {
            patientAvailable,
            availabilityChanged,
        };
        
        if (activePopupType === 'initial') {
            result.initialEvent = {
                enabled: true,
                eventName: selectedInitialEvent,
                status: initialEventStatus,
            };
        }
        
        dispatch("apply", result);
    }

    function handleCancel() {
        dispatch("cancel");
    }

    function handleWindowClick(event: MouseEvent) {
        if (!open || !popupRef) return;
        
        if (justOpened) {
            justOpened = false;
            return;
        }
        
        const target = event.target as Node;
        // If the target was removed from the document (e.g. by a Svelte re-render triggered
        // by an onclick inside the popup), it was originally inside the popup - don't close
        if (!document.contains(target)) return;
        
        if (!popupRef.contains(target)) {
            handleCancel();
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            handleCancel();
        }
    }
    
    // === Initial Event phase handlers (inline transitions) ===
    
    function handleInitialAdd() {
        if (!checkedInitialEvent) return;
        initialEventName = checkedInitialEvent;
        initialEventPhase = 'actionable';
        
        // Dispatch to parent to save (with keepOpen so popup stays open)
        const result: PopupResult = {
            patientAvailable: true,
            availabilityChanged: false,
            keepOpen: true,
            initialEvent: {
                enabled: true,
                eventName: checkedInitialEvent,
                status: 'planned' as EventStatus,
            },
        };
        dispatch("apply", result);
    }

    function handleInitialComplete() {
        initialEventTerminalStatus = 'completed';
        initialEventPhase = 'resolved';
        dispatch("initialAction", { action: 'complete', eventName: initialEventName });
    }

    function handleInitialCancelStatus() {
        initialEventTerminalStatus = 'cancelled';
        initialEventPhase = 'resolved';
        dispatch("initialAction", { action: 'cancel', eventName: initialEventName });
    }

    function handleInitialMissed() {
        initialEventTerminalStatus = 'missed';
        initialEventPhase = 'resolved';
        dispatch("initialAction", { action: 'missed', eventName: initialEventName });
    }

    function handleInitialReset() {
        initialEventPhase = 'actionable';
        dispatch("initialAction", { action: 'reset', eventName: initialEventName });
    }

    function handleInitialDelete() {
        initialEventPhase = 'selection';
        checkedInitialEvent = '';
        dispatch("initialAction", { action: 'delete', eventName: initialEventName });
    }

    function handleInitialMoveStart() {
        initialEventPhase = 'move-calendar';
        moveCalendarContext = 'initial';
        const d = date || new Date();
        moveCalendarYear = d.getFullYear();
        moveCalendarMonth = d.getMonth();
        selectedMoveDay = null;
        // Reposition popup after calendar renders (content size changes)
        requestAnimationFrame(() => updatePopupPosition());
    }

    function handleInitialMoveOk() {
        if (selectedMoveDay !== null) {
            const dateStr = `${moveCalendarYear}-${String(moveCalendarMonth + 1).padStart(2, '0')}-${String(selectedMoveDay).padStart(2, '0')}`;
            dispatch("initialAction", { action: 'move', eventName: initialEventName, moveDate: dateStr });
        }
        // Close popup after move
        dispatch("cancel");
    }

    function handleInitialMoveCancel() {
        initialEventPhase = 'actionable';
        selectedMoveDay = null;
        // Reposition popup after calendar hides (content size changes)
        requestAnimationFrame(() => updatePopupPosition());
    }

    // === Scheduled Event phase handlers (inline transitions, like initial event) ===

    function handleScheduledComplete(eventId: string, eventName: string) {
        scheduledEventPhaseMap.set(eventId, { phase: 'resolved', terminalStatus: 'completed' });
        scheduledEventPhaseMap = new Map(scheduledEventPhaseMap);
        dispatch("scheduledAction", { action: 'complete', eventId, eventName, dayNumber: dayData?.day ?? 0 });
    }

    function handleScheduledCancelStatus(eventId: string, eventName: string) {
        scheduledEventPhaseMap.set(eventId, { phase: 'resolved', terminalStatus: 'cancelled' });
        scheduledEventPhaseMap = new Map(scheduledEventPhaseMap);
        dispatch("scheduledAction", { action: 'cancel', eventId, eventName, dayNumber: dayData?.day ?? 0 });
    }

    function handleScheduledMissed(eventId: string, eventName: string) {
        scheduledEventPhaseMap.set(eventId, { phase: 'resolved', terminalStatus: 'missed' });
        scheduledEventPhaseMap = new Map(scheduledEventPhaseMap);
        dispatch("scheduledAction", { action: 'missed', eventId, eventName, dayNumber: dayData?.day ?? 0 });
    }

    function handleScheduledReset(eventId: string, eventName: string) {
        scheduledEventPhaseMap.set(eventId, { phase: 'actionable' });
        scheduledEventPhaseMap = new Map(scheduledEventPhaseMap);
        dispatch("scheduledAction", { action: 'reset', eventId, eventName, dayNumber: dayData?.day ?? 0 });
    }

    function handleScheduledMoveStart(eventId: string, eventName: string) {
        scheduledEventPhaseMap.set(eventId, { phase: 'move-calendar' });
        scheduledEventPhaseMap = new Map(scheduledEventPhaseMap);
        scheduledMoveEventId = eventId;
        scheduledMoveEventName = eventName;
        moveCalendarContext = 'scheduled';
        const d = date || new Date();
        moveCalendarYear = d.getFullYear();
        moveCalendarMonth = d.getMonth();
        selectedMoveDay = null;
        // Reposition popup after calendar renders (content size changes)
        requestAnimationFrame(() => updatePopupPosition());
    }

    function handleScheduledMoveOk() {
        if (selectedMoveDay !== null && scheduledMoveEventId) {
            const dateStr = `${moveCalendarYear}-${String(moveCalendarMonth + 1).padStart(2, '0')}-${String(selectedMoveDay).padStart(2, '0')}`;
            dispatch("scheduledAction", { action: 'move', eventId: scheduledMoveEventId, eventName: scheduledMoveEventName, dayNumber: dayData?.day ?? 0, moveDate: dateStr });
        }
        // Close popup after move
        dispatch("cancel");
    }

    function handleScheduledMoveCancel() {
        if (scheduledMoveEventId) {
            scheduledEventPhaseMap.set(scheduledMoveEventId, { phase: 'actionable' });
            scheduledEventPhaseMap = new Map(scheduledEventPhaseMap);
        }
        scheduledMoveEventId = '';
        scheduledMoveEventName = '';
        selectedMoveDay = null;
        // Reposition popup after calendar hides (content size changes)
        requestAnimationFrame(() => updatePopupPosition());
    }

    function handleUnscheduledEventDelete(eventId: string, eventName: string) {
        dispatch("scheduledAction", { action: 'delete', eventId, eventName, dayNumber: dayData?.day ?? 0 });
        // Close popup after delete
        dispatch("cancel");
    }

    // === Unscheduled Event handler (checkbox + Add, like initial event selection) ===

    function handleUnscheduledAdd() {
        if (!checkedUnscheduledEvent) return;
        // Dispatch to parent to save the unscheduled event as planned
        const result: PopupResult = {
            patientAvailable: true,
            availabilityChanged: false,
            unscheduledEvent: {
                enabled: true,
                eventName: checkedUnscheduledEvent,
                status: 'planned' as EventStatus,
            },
        };
        dispatch("apply", result);
        // Reset state
        checkedUnscheduledEvent = '';
        showUnscheduledSelector = false;
    }

    function handleUnscheduledSelectorCancel() {
        checkedUnscheduledEvent = '';
        showUnscheduledSelector = false;
        requestAnimationFrame(() => updatePopupPosition());
    }

    function handleUnscheduledSelectorOpen() {
        showUnscheduledSelector = true;
        requestAnimationFrame(() => updatePopupPosition());
    }

    
</script>

<svelte:window onkeydown={handleKeydown} onclick={handleWindowClick} />

{#if open}
    <div 
        class="day-cell-popup"
        bind:this={popupRef}
        style={popupStyle}
        role="dialog"
        aria-modal="true"
    >
        <div class="day-cell-popup-content">
            <!-- Header with day number and date -->
            <!-- Don't show day number for 'initial' popup type in selection phase (patient has no reference date yet) -->
            <!-- DO show day number when re-opening initial popup with existing event (actionable/resolved phase) -->
            <header class="popup-header">
                <div class="popup-header-info">
                    {#if dayData?.day !== undefined && (activePopupType !== 'initial' || initialEventPhase !== 'selection')}
                        <span class="popup-day-number">Day {dayData.day}</span>
                    {/if}
                    <span class="popup-date">{formatDate(date)}</span>
                </div>
                <button type="button" class="popup-close-btn" onclick={handleCancel} aria-label="Close popup">
                    <IconX size={16} />
                </button>
            </header>
            
            <!-- Patient ID + Unscheduled button -->
            <div class="popup-patient-row">
                <span class="popup-patient-id">{patientId}</span>
                {#if activePopupType !== 'initial' && unscheduledEvents.length > 0 && canAddUnscheduledEvent}
                    <button class="popup-unscheduled-btn" onclick={handleUnscheduledSelectorOpen}>
                        <IconPlus size={16} /> Unscheduled
                    </button>
                {/if}
            </div>
            
            <!-- Model Error Message - shown when there's a study design issue -->
            {#if modelError}
                <div class="popup-error-message">
                    There is a study design issue, so you cannot perform any scheduling actions at this time.
                </div>
            {:else}
               
                <!-- ==================== POPUP 1: Initial Event (4-phase inline transitions) ==================== -->
                {#if activePopupType === 'initial'}
                    <div class="popup-separator"></div>
                    <div class="popup-section">
                        {#if initialEventPhase === 'selection'}
                            <!-- Phase 1: Selection - checkbox list + Add button -->
                            <div class="section-label">INITIAL EVENT</div>
                            <div class="popup-selection-content">
                                {#each day0Events as eventOption}
                                    <label class="popup-event-option">
                                        <input 
                                            type="checkbox" 
                                            checked={checkedInitialEvent === eventOption.name}
                                            onchange={() => { checkedInitialEvent = checkedInitialEvent === eventOption.name ? '' : eventOption.name; }}
                                        />
                                        <span>{eventOption.name}</span>
                                    </label>
                                {/each}
                                <button 
                                    class="popup-add-btn" 
                                    onclick={handleInitialAdd}
                                    disabled={!checkedInitialEvent}
                                >Add</button>
                            </div>
                        {:else if initialEventPhase === 'actionable'}
                            <!-- Phase 2: Actionable - event name + status + action buttons -->
                            <div class="section-header-row">
                                <span class="section-label">INITIAL EVENT</span>
                                <button class="popup-header-btn" onclick={handleInitialDelete} title="Delete event">
                                    Delete
                                </button>
                            </div>
                            <div class="popup-event-info-row">
                                <span class="popup-event-name">{initialEventName}</span>
                                <span class="popup-status-badge status-planned">PLANNED</span>
                            </div>
                            <div class="popup-action-buttons">
                                <button class="popup-action-btn completed" onclick={handleInitialComplete}>
                                    Complete
                                </button>
                                <button class="popup-action-btn canceled" onclick={handleInitialCancelStatus}>
                                    Cancel
                                </button>
                                <button class="popup-action-btn missed" onclick={handleInitialMissed}>
                                    Miss
                                </button>
                                <button class="popup-action-btn move" onclick={handleInitialMoveStart}>
                                    Move
                                </button>
                            </div>
                        {:else if initialEventPhase === 'move-calendar'}
                            <!-- Phase 3: Move calendar - inline date picker with Ok/Cancel -->
                            <div class="section-header-row">
                                <span class="section-label">INITIAL EVENT</span>
                                <button class="popup-header-btn" onclick={handleInitialDelete} title="Delete event">
                                    Delete
                                </button>
                            </div>
                            <div class="popup-event-info-row">
                                <span class="popup-event-name">{initialEventName}</span>
                                <span class="popup-status-badge status-planned">PLANNED</span>
                            </div>
                            <div class="popup-move-calendar-section">
                                <div class="popup-move-calendar-header">
                                    <button class="popup-move-calendar-nav-btn" onclick={() => navigateCalendarMonth(-1)} aria-label="Previous month">
                                        <IconChevronLeft size={16} />
                                    </button>
                                    <span class="popup-move-calendar-month-year">{MONTH_NAMES[moveCalendarMonth]} {moveCalendarYear}</span>
                                    <button class="popup-move-calendar-nav-btn" onclick={() => navigateCalendarMonth(1)} aria-label="Next month">
                                        <IconChevronRight size={16} />
                                    </button>
                                </div>
                                <div class="popup-move-calendar-grid">
                                    <div class="popup-move-calendar-weekdays">
                                        {#each DAY_NAMES as dayName}
                                            <span class="popup-move-calendar-weekday">{dayName}</span>
                                        {/each}
                                    </div>
                                    <div class="popup-move-calendar-days">
                                        {#each calendarDays as day}
                                            {#if day === null}
                                                <span class="popup-move-calendar-day empty"></span>
                                            {:else}
                                                <button 
                                                    class="popup-move-calendar-day"
                                                    class:today={isCalendarToday(day)}
                                                    class:weekend={isCalendarWeekend(day)}
                                                    class:selected={selectedMoveDay === day}
                                                    class:in-window={isCalendarInWindow(day)}
                                                    class:original-scheduled-day={isCalendarOriginalScheduledDay(day)}
                                                    class:event-on-scheduled={isCalendarCurrentEventDay(day) && getCalendarEventDayState() === 'on-scheduled-date'}
                                                    class:event-in-window={isCalendarCurrentEventDay(day) && getCalendarEventDayState() === 'in-window'}
                                                    class:event-out-of-window={isCalendarCurrentEventDay(day) && getCalendarEventDayState() === 'out-of-window'}
                                                    onclick={() => selectedMoveDay = day}
                                                >
                                                    {day}
                                                </button>
                                            {/if}
                                        {/each}
                                    </div>
                                </div>
                                <div class="popup-move-calendar-actions">
                                    <button class="popup-move-calendar-ok-btn" onclick={handleInitialMoveOk} disabled={selectedMoveDay === null}>Ok</button>
                                    <button class="popup-move-calendar-cancel-btn" onclick={handleInitialMoveCancel}>Cancel</button>
                                </div>
                            </div>
                        {:else if initialEventPhase === 'resolved'}
                            <!-- Phase 4: Resolved - event name + status badge + Reset -->
                            <div class="section-header-row">
                                <span class="section-label">INITIAL EVENT</span>
                                <button class="popup-header-btn" onclick={handleInitialReset} title="Reset to pending">
                                    Reset
                                </button>
                            </div>
                            <div class="popup-event-info-row">
                                <span class="popup-event-name">{initialEventName}</span>
                                <span class="popup-status-badge {getStatusBadgeClass(initialEventTerminalStatus)}">{getStatusLabel(initialEventTerminalStatus)}</span>
                            </div>
                        {/if}
                    </div>
                {/if}
                
                <!-- ==================== POPUP 2: Event Day (per-event phase-based, like initial event) ==================== -->
                {#if activePopupType === 'event-day'}
                    <div class="popup-separator"></div>
                    {#each scheduledEvents as event (event.id)}
                        {@const isEventUnscheduled = event.category === 'unscheduled' || event.isUnscheduledEvent || event.type === 'unscheduled-event'}
                        {@const eventSectionLabel = isEventUnscheduled ? 'UNSCHEDULED EVENT' : 'SCHEDULED EVENT'}
                        <div class="popup-section">
                            {#if scheduledEventPhaseMap.get(event.id)?.phase === 'actionable'}
                                <!-- Actionable phase: event name + PLANNED badge + action buttons -->
                                <div class="section-header-row">
                                    <span class="section-label">{eventSectionLabel}</span>
                                    {#if isEventUnscheduled}
                                        <button class="popup-header-btn" onclick={() => handleUnscheduledEventDelete(event.id, event.name)} title="Delete event">
                                            Delete
                                        </button>
                                    {/if}
                                </div>
                                <div class="popup-event-info-row">
                                    <span class="popup-event-name">{event.name}</span>
                                    <span class="popup-status-badge status-planned">PLANNED</span>
                                </div>
                                <div class="popup-action-buttons">
                                    <button class="popup-action-btn completed" onclick={() => handleScheduledComplete(event.id, event.name)}>
                                        Complete
                                    </button>
                                    <button class="popup-action-btn canceled" onclick={() => handleScheduledCancelStatus(event.id, event.name)}>
                                        Cancel
                                    </button>
                                    <button class="popup-action-btn missed" onclick={() => handleScheduledMissed(event.id, event.name)}>
                                        Miss
                                    </button>
                                    <button class="popup-action-btn move" onclick={() => handleScheduledMoveStart(event.id, event.name)}>
                                        Move
                                    </button>
                                </div>
                            {:else if scheduledEventPhaseMap.get(event.id)?.phase === 'move-calendar'}
                                <!-- Move calendar phase: inline date picker with Ok/Cancel -->
                                <div class="section-header-row">
                                    <span class="section-label">{eventSectionLabel}</span>
                                    {#if isEventUnscheduled}
                                        <button class="popup-header-btn" onclick={() => handleUnscheduledEventDelete(event.id, event.name)} title="Delete event">
                                            Delete
                                        </button>
                                    {/if}
                                </div>
                                <div class="popup-event-info-row">
                                    <span class="popup-event-name">{event.name}</span>
                                    <span class="popup-status-badge status-planned">PLANNED</span>
                                </div>
                                <div class="popup-move-calendar-section">
                                    <div class="popup-move-calendar-header">
                                        <button class="popup-move-calendar-nav-btn" onclick={() => navigateCalendarMonth(-1)} aria-label="Previous month">
                                            <IconChevronLeft size={16} />
                                        </button>
                                        <span class="popup-move-calendar-month-year">{MONTH_NAMES[moveCalendarMonth]} {moveCalendarYear}</span>
                                        <button class="popup-move-calendar-nav-btn" onclick={() => navigateCalendarMonth(1)} aria-label="Next month">
                                            <IconChevronRight size={16} />
                                        </button>
                                    </div>
                                    <div class="popup-move-calendar-grid">
                                        <div class="popup-move-calendar-weekdays">
                                            {#each DAY_NAMES as dayName}
                                                <span class="popup-move-calendar-weekday">{dayName}</span>
                                            {/each}
                                        </div>
                                        <div class="popup-move-calendar-days">
                                            {#each calendarDays as day}
                                                {#if day === null}
                                                    <span class="popup-move-calendar-day empty"></span>
                                                {:else}
                                                    <button 
                                                        class="popup-move-calendar-day"
                                                        class:today={isCalendarToday(day)}
                                                        class:weekend={isCalendarWeekend(day)}
                                                        class:selected={selectedMoveDay === day}
                                                        class:in-window={isCalendarInWindow(day)}
                                                        class:original-scheduled-day={isCalendarOriginalScheduledDay(day)}
                                                        class:event-on-scheduled={isCalendarCurrentEventDay(day) && getCalendarEventDayState() === 'on-scheduled-date'}
                                                        class:event-in-window={isCalendarCurrentEventDay(day) && getCalendarEventDayState() === 'in-window'}
                                                        class:event-out-of-window={isCalendarCurrentEventDay(day) && getCalendarEventDayState() === 'out-of-window'}
                                                        onclick={() => selectedMoveDay = day}
                                                    >
                                                        {day}
                                                    </button>
                                                {/if}
                                            {/each}
                                        </div>
                                    </div>
                                    <div class="popup-move-calendar-actions">
                                        <button class="popup-move-calendar-ok-btn" onclick={handleScheduledMoveOk} disabled={selectedMoveDay === null}>Ok</button>
                                        <button class="popup-move-calendar-cancel-btn" onclick={handleScheduledMoveCancel}>Cancel</button>
                                    </div>
                                </div>
                            {:else if scheduledEventPhaseMap.get(event.id)?.phase === 'resolved'}
                                <!-- Resolved phase: event name + status badge + Reset (+ Delete for unscheduled) -->
                                <div class="section-header-row">
                                    <span class="section-label">{eventSectionLabel}</span>
                                    {#if isEventUnscheduled}
                                        <button class="popup-header-btn" onclick={() => handleUnscheduledEventDelete(event.id, event.name)} title="Delete event">
                                            Delete
                                        </button>
                                    {/if}
                                    <button class="popup-header-btn" onclick={() => handleScheduledReset(event.id, event.name)} title="Reset to pending">
                                        Reset
                                    </button>
                                </div>
                                <div class="popup-event-info-row">
                                    <span class="popup-event-name">{event.name}</span>
                                    <span class="popup-status-badge {getStatusBadgeClass(scheduledEventPhaseMap.get(event.id)?.terminalStatus || 'completed')}">{getStatusLabel(scheduledEventPhaseMap.get(event.id)?.terminalStatus || 'completed')}</span>
                                </div>
                            {/if}
                        </div>
                        {#if scheduledEvents.indexOf(event) < scheduledEvents.length - 1}
                            <div class="popup-separator"></div>
                        {/if}
                    {/each}
                    
                    <!-- Unscheduled Event selector (shown when + Unscheduled button is clicked) -->
                    {#if showUnscheduledSelector && unscheduledEvents.length > 0 && canAddUnscheduledEvent}
                        <div class="popup-separator"></div>
                        
                        <div class="popup-section">
                            <div class="section-label">UNSCHEDULED EVENT</div>
                            <div class="popup-selection-content">
                                {#each unscheduledEvents as eventOption}
                                    <label class="popup-event-option">
                                        <input 
                                            type="checkbox" 
                                            checked={checkedUnscheduledEvent === eventOption.name}
                                            onchange={() => { checkedUnscheduledEvent = checkedUnscheduledEvent === eventOption.name ? '' : eventOption.name; }}
                                        />
                                        <span>{eventOption.name}</span>
                                    </label>
                                {/each}
                                <div class="popup-selection-actions">
                                    <button 
                                        class="popup-selection-ok-btn" 
                                        onclick={handleUnscheduledAdd}
                                        disabled={!checkedUnscheduledEvent}
                                    >Ok</button>
                                    <button 
                                        class="popup-selection-cancel-btn"
                                        onclick={handleUnscheduledSelectorCancel}
                                    >Cancel</button>
                                </div>
                            </div>
                        </div>
                    {/if}
                {/if}
                
                <!-- ==================== POPUP 3: No Event Day (unscheduled selector shown on button click) ==================== -->
                {#if activePopupType === 'no-event' && showUnscheduledSelector && unscheduledEvents.length > 0 && canAddUnscheduledEvent}
                    <div class="popup-separator"></div>
                    <div class="popup-section">
                        <div class="section-label">UNSCHEDULED EVENT</div>
                        <div class="popup-selection-content">
                            {#each unscheduledEvents as eventOption}
                                <label class="popup-event-option">
                                    <input 
                                        type="checkbox" 
                                        checked={checkedUnscheduledEvent === eventOption.name}
                                        onchange={() => { checkedUnscheduledEvent = checkedUnscheduledEvent === eventOption.name ? '' : eventOption.name; }}
                                    />
                                    <span>{eventOption.name}</span>
                                </label>
                            {/each}
                            <div class="popup-selection-actions">
                                <button 
                                    class="popup-selection-ok-btn" 
                                    onclick={handleUnscheduledAdd}
                                    disabled={!checkedUnscheduledEvent}
                                >Ok</button>
                                <button 
                                    class="popup-selection-cancel-btn"
                                    onclick={handleUnscheduledSelectorCancel}
                                >Cancel</button>
                            </div>
                        </div>
                    </div>
                {/if}
            {/if}
        </div>
    </div>
{/if}
