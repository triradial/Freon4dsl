<script lang="ts">
    import { createEventDispatcher } from "svelte";
    // @ts-ignore
    import { Plus as IconPlus, X as IconX, Calendar as IconCalendar, ChevronLeft as IconChevronLeft, ChevronRight as IconChevronRight } from '@lucide/svelte';
    import { DatePicker } from "bits-ui";
    import type { DateValue } from "@internationalized/date";
    import { parseDate, CalendarDate } from "@internationalized/date";

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
    
    // Per-event action state
    interface EventActionState {
        action: EventAction;
        rescheduleDate: string; // YYYY-MM-DD format (used for both reschedule and move actions)
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
    }>();

    // Local state
    let patientAvailable = $state(true);
    let initialPatientAvailable = $state(true);
    
    // Initial event state (Popup 1)
    let selectedInitialEvent = $state('');
    let initialEventStatus = $state<EventStatus>('planned');
    let initialSelectedInitialEvent = $state('');
    let initialInitialEventStatus = $state<EventStatus>('planned');
    
    // Per-event action states (Popup 2)
    let eventActions = $state<Map<string, EventActionState>>(new Map());
    let initialEventActions = $state<Map<string, EventActionState>>(new Map());
    
    // Unscheduled event state
    let unscheduledEventEnabled = $state(false);
    let selectedUnscheduledEvent = $state('');
    let unscheduledEventStatus = $state<EventStatus>('planned');
    let initialUnscheduledEventEnabled = $state(false);
    let initialSelectedUnscheduledEvent = $state('');
    let initialUnscheduledEventStatus = $state<EventStatus>('planned');
    
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
    
    // Parse today as a CalendarDate for date picker minValue
    let todayCalendarDate = $derived.by(() => {
        try {
            return parseDate(todayDateString);
        } catch {
            return undefined;
        }
    });

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
    
    // Helper to compare event action maps
    const eventActionsEqual = (a: Map<string, EventActionState>, b: Map<string, EventActionState>): boolean => {
        if (a.size !== b.size) return false;
        for (const [key, valueA] of a) {
            const valueB = b.get(key);
            if (!valueB) return false;
            if (valueA.action !== valueB.action) return false;
            if (valueA.rescheduleDate !== valueB.rescheduleDate) return false;
        }
        return true;
    };
    
    // Check if anything has changed
    let hasChanges = $derived.by(() => {
        if (popupType === 'initial') {
            return true; // Always allow apply for initial events
        }
        if (popupType === 'event-day') {
            const actionsChanged = !eventActionsEqual(eventActions, initialEventActions);
            const unscheduledChanged = unscheduledEventEnabled !== initialUnscheduledEventEnabled ||
                                       (unscheduledEventEnabled && (
                                           selectedUnscheduledEvent !== initialSelectedUnscheduledEvent ||
                                           unscheduledEventStatus !== initialUnscheduledEventStatus
                                       ));
            return actionsChanged || unscheduledChanged;
        }
        if (popupType === 'no-event') {
            return unscheduledEventEnabled !== initialUnscheduledEventEnabled ||
                   (unscheduledEventEnabled && (
                       selectedUnscheduledEvent !== initialSelectedUnscheduledEvent ||
                       unscheduledEventStatus !== initialUnscheduledEventStatus
                   ));
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
            
            // Initialize availability
            const available = dayData?.available !== false;
            patientAvailable = available;
            initialPatientAvailable = available;
            
            // Initialize initial event (popup 1)
            selectedInitialEvent = day0Events.length > 0 ? day0Events[0].name : '';
            initialEventStatus = 'planned';
            initialSelectedInitialEvent = selectedInitialEvent;
            initialInitialEventStatus = initialEventStatus;
            
            // Initialize per-event actions (popup 2)
            const newEventActions = new Map<string, EventActionState>();
            const newInitialEventActions = new Map<string, EventActionState>();
            for (const event of scheduledEvents) {
                // Use the original scheduled day for the reschedule date default
                const originalDay = event.originalScheduledDay !== undefined 
                    ? event.originalScheduledDay 
                    : event.scheduledDay;
                const defaultRescheduleDate = getDateStringFromDay(originalDay, patientReferenceDate);
                
                const defaultState: EventActionState = {
                    action: 'do-nothing',
                    rescheduleDate: defaultRescheduleDate
                };
                newEventActions.set(event.id, { ...defaultState });
                newInitialEventActions.set(event.id, { ...defaultState });
            }
            eventActions = newEventActions;
            initialEventActions = newInitialEventActions;
            
            // Initialize unscheduled event
            unscheduledEventEnabled = false;
            selectedUnscheduledEvent = unscheduledEvents.length > 0 ? unscheduledEvents[0].name : '';
            unscheduledEventStatus = 'planned';
            initialUnscheduledEventEnabled = false;
            initialSelectedUnscheduledEvent = selectedUnscheduledEvent;
            initialUnscheduledEventStatus = unscheduledEventStatus;
            
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

    // Format date for display: d-MMM-yyyy
    function formatDate(d: Date): string {
        const day = d.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    }

    // Get window date range for an event (returns start and end dates as YYYY-MM-DD strings)
    function getWindowDateRange(event: DayEvent): { scheduledDate: string; windowStart: string; windowEnd: string } | null {
        if (!patientReferenceDate) return null;
        
        const originalDay = event.originalScheduledDay !== undefined 
            ? event.originalScheduledDay 
            : event.scheduledDay;
        const window = event.window || { daysBefore: 0, daysAfter: 0 };
        
        const windowStartDay = originalDay - (window.daysBefore || 0);
        const windowEndDay = originalDay + (window.daysAfter || 0);
        
        return {
            scheduledDate: getDateStringFromDay(originalDay, patientReferenceDate),
            windowStart: getDateStringFromDay(windowStartDay, patientReferenceDate),
            windowEnd: getDateStringFromDay(windowEndDay, patientReferenceDate)
        };
    }
    
    // Check if a date is the scheduled date
    function isScheduledDate(dateValue: DateValue, event: DayEvent): boolean {
        const range = getWindowDateRange(event);
        if (!range) return false;
        const dateStr = `${dateValue.year}-${String(dateValue.month).padStart(2, '0')}-${String(dateValue.day).padStart(2, '0')}`;
        return dateStr === range.scheduledDate;
    }
    
    // Check if a date is within the window (but not the scheduled date itself)
    function isDateInWindow(dateValue: DateValue, event: DayEvent): boolean {
        const range = getWindowDateRange(event);
        if (!range) return false;
        
        const dateStr = `${dateValue.year}-${String(dateValue.month).padStart(2, '0')}-${String(dateValue.day).padStart(2, '0')}`;
        
        // Not in window if it's the scheduled date (that gets different styling)
        if (dateStr === range.scheduledDate) return false;
        
        // Check if within window range
        return dateStr >= range.windowStart && dateStr <= range.windowEnd;
    }
    
    // Parse a YYYY-MM-DD string to DateValue
    function parseDateString(dateStr: string): DateValue | undefined {
        try {
            return parseDate(dateStr);
        } catch {
            return undefined;
        }
    }
    
    // Track open date pickers by event ID
    let openDatePickers = $state<Map<string, boolean>>(new Map());
    
    function setDatePickerOpen(eventId: string, isOpen: boolean) {
        openDatePickers.set(eventId, isOpen);
        openDatePickers = new Map(openDatePickers);
    }
    
    function isDatePickerOpen(eventId: string): boolean {
        return openDatePickers.get(eventId) || false;
    }

    // Update event action
    function updateEventAction(eventId: string, action: EventAction) {
        const current = eventActions.get(eventId);
        if (current) {
            eventActions.set(eventId, {
                ...current,
                action
            });
            eventActions = new Map(eventActions); // Trigger reactivity
        }
    }
    
    // Update event reschedule date
    function updateEventRescheduleDate(eventId: string, dateStr: string) {
        const current = eventActions.get(eventId);
        if (current) {
            eventActions.set(eventId, { ...current, rescheduleDate: dateStr });
            eventActions = new Map(eventActions);
        }
    }

    // Toggle unscheduled event section
    function toggleUnscheduledEvent(event: MouseEvent) {
        event.stopPropagation();
        unscheduledEventEnabled = !unscheduledEventEnabled;
    }

    // Map action to status for the result
    function actionToStatus(action: EventAction): EventStatus | null {
        switch (action) {
            case 'complete': return 'completed';
            case 'cancel': return 'cancelled';
            case 'missed': return 'missed';
            default: return null;
        }
    }

    function handleApply() {
        const availabilityChanged = patientAvailable !== initialPatientAvailable;
        
        const result: PopupResult = {
            patientAvailable,
            availabilityChanged,
        };
        
        if (popupType === 'initial') {
            result.initialEvent = {
                enabled: true,
                eventName: selectedInitialEvent,
                status: initialEventStatus,
            };
            // Also include unscheduled event if enabled
            if (unscheduledEventEnabled) {
                result.unscheduledEvent = {
                    enabled: true,
                    eventName: selectedUnscheduledEvent,
                    status: unscheduledEventStatus,
                };
            }
        }
        
        if (popupType === 'event-day') {
            result.scheduledEvents = [];
            for (const event of scheduledEvents) {
                const actionState = eventActions.get(event.id);
                if (actionState) {
                    const eventResult: PopupResult['scheduledEvents'][0] = {
                        eventId: event.id,
                        eventName: event.name,
                        action: actionState.action,
                    };
                    
                    // Map direct actions to status changes
                    const newStatus = actionToStatus(actionState.action);
                    if (newStatus) {
                        eventResult.newStatus = newStatus;
                        // Convert action to 'change-status' for handler compatibility
                        eventResult.action = 'change-status' as EventAction;
                    }
                    
                    // Both 'reschedule' and 'move' actions include the target date
                    if ((actionState.action === 'reschedule' || actionState.action === 'move') && actionState.rescheduleDate) {
                        eventResult.rescheduleDate = actionState.rescheduleDate;
                    }
                    
                    result.scheduledEvents.push(eventResult);
                }
            }
            if (unscheduledEventEnabled) {
                result.unscheduledEvent = {
                    enabled: true,
                    eventName: selectedUnscheduledEvent,
                    status: unscheduledEventStatus,
                };
            }
        }
        
        if (popupType === 'no-event' && unscheduledEventEnabled) {
            result.unscheduledEvent = {
                enabled: true,
                eventName: selectedUnscheduledEvent,
                status: unscheduledEventStatus,
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
        if (!popupRef.contains(target)) {
            handleCancel();
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            handleCancel();
        }
    }
    
    // Get action options for an event based on its type and status
    // Rules:
    // 1. Only planned/pending events can be rescheduled or moved
    // 2. Day 0 events and unscheduled events use "Move" (no window days created)
    // 3. Regular scheduled events use "Reschedule" (window days created around original date)
    // 4. Completed/cancelled/missed events cannot be rescheduled or moved
    function getActionOptions(event: DayEvent): { value: EventAction; label: string }[] {
        const options: { value: EventAction; label: string }[] = [
            { value: 'do-nothing', label: 'Do nothing' },
            { value: 'complete', label: 'Complete' },
        ];
        
        // Only add reschedule/move option for planned/pending events
        if (canBeRescheduledOrMoved(event)) {
            const isDay0 = isDayZeroEvent(event);
            const isUnscheduled = event.isUnscheduledEvent || event.type === 'unscheduled-event';
            
            if (isDay0 || isUnscheduled) {
                // Day 0 and unscheduled events use "Move" - no windows created
                options.push({ value: 'move', label: 'Move' });
            } else {
                // Regular scheduled events use "Reschedule" - windows created around original date
                options.push({ value: 'reschedule', label: 'Reschedule' });
            }
        }
        
        options.push({ value: 'cancel', label: 'Cancel' });
        options.push({ value: 'missed', label: 'Missed' });
        
        // Add Delete option for unscheduled events that were added
        if (event.isUnscheduledEvent || event.type === 'unscheduled-event') {
            options.push({ value: 'delete', label: 'Delete' });
        }
        
        return options;
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
            <!-- Don't show day number for 'initial' popup type (patient has no reference date yet) -->
            <header class="popup-header">
                <div class="popup-header-info">
                    {#if dayData?.day !== undefined && popupType !== 'initial'}
                        <span class="popup-day-number">Day {dayData.day}</span>
                    {/if}
                    <span class="popup-date">{formatDate(date)}</span>
                </div>
                <button 
                    type="button" 
                    class="popup-close-btn"
                    onclick={handleCancel}
                    aria-label="Close popup"
                >
                    <IconX size={16} />
                </button>
            </header>
            
            <!-- Patient ID -->
            <div class="popup-patient-id">{patientId}</div>
            
            <!-- Model Error Message - shown when there's a study design issue -->
            {#if modelError}
                <div class="popup-error-message">
                    There is a study design issue, so you cannot perform any scheduling actions at this time.
                </div>
            {:else}
                <!-- Separator -->
                <div class="popup-separator"></div>
                
                <!-- ==================== POPUP 1: Initial Event ==================== -->
                {#if popupType === 'initial'}
                    <div class="popup-section">
                        <div class="section-label">Initial Event</div>
                        <div class="event-row">
                            <select 
                                class="popup-select"
                                bind:value={selectedInitialEvent}
                            >
                                {#each day0Events as event}
                                    <option value={event.name}>{event.name}</option>
                                {/each}
                            </select>
                            
                            <select 
                                class="popup-select event-status-select"
                                bind:value={initialEventStatus}
                            >
                                <option value="planned">Planned</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Unscheduled Event section for initial popup - can add unscheduled events when starting patient -->
                    {#if unscheduledEvents.length > 0}
                        <!-- Separator -->
                        <div class="popup-separator"></div>
                        
                        <div class="popup-section">
                            <div class="section-header-row">
                                <span class="section-label">Unscheduled Event</span>
                                <button 
                                    type="button" 
                                    class="toggle-section-btn"
                                    onclick={(e) => toggleUnscheduledEvent(e)}
                                    aria-label={unscheduledEventEnabled ? 'Remove unscheduled event' : 'Add unscheduled event'}
                                >
                                    {#if unscheduledEventEnabled}
                                        <IconX size={16} />
                                    {:else}
                                        <IconPlus size={16} />
                                    {/if}
                                </button>
                            </div>
                            
                            {#if unscheduledEventEnabled}
                                <div class="event-row">
                                    <select class="popup-select" bind:value={selectedUnscheduledEvent}>
                                        {#each unscheduledEvents as event}
                                            <option value={event.name}>{event.name}</option>
                                        {/each}
                                    </select>
                                    
                                    <select class="popup-select event-status-select" bind:value={unscheduledEventStatus}>
                                        <option value="planned">Planned</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            {/if}
                        </div>
                    {/if}
                {/if}
                
                <!-- ==================== POPUP 2: Event Day ==================== -->
                {#if popupType === 'event-day'}
                    <div class="popup-section">
                        <div class="section-label">Scheduled Events</div>
                        
                        {#each scheduledEvents as event (event.id)}
                            {@const actionState = eventActions.get(event.id)}
                            {@const actionOptions = getActionOptions(event)}
                            <div class="scheduled-event-row">
                                <span class="popup-event-name">{event.name}</span>
                                <select 
                                    class="popup-select action-select"
                                    value={actionState?.action || 'do-nothing'}
                                    onchange={(e) => updateEventAction(event.id, e.currentTarget.value as EventAction)}
                                >
                                    {#each actionOptions as opt}
                                        <option value={opt.value}>{opt.label}</option>
                                    {/each}
                                </select>
                                
                                <div class="action-data">
                                    {#if actionState?.action === 'reschedule' || actionState?.action === 'move'}
                                        {@const datePickerValue = parseDateString(actionState.rescheduleDate)}
                                        {@const datePickerOpen = isDatePickerOpen(event.id)}
                                        <DatePicker.Root 
                                            open={datePickerOpen}
                                            onOpenChange={(isOpen) => setDatePickerOpen(event.id, isOpen)}
                                            value={datePickerValue}
                                            minValue={todayCalendarDate}
                                            onValueChange={(newValue) => {
                                                if (newValue) {
                                                    const dateStr = `${newValue.year}-${String(newValue.month).padStart(2, '0')}-${String(newValue.day).padStart(2, '0')}`;
                                                    updateEventRescheduleDate(event.id, dateStr);
                                                }
                                            }}
                                            weekdayFormat="short"
                                            fixedWeeks={false}
                                        >
                                            <div class="reschedule-datepicker">
                                                <DatePicker.Input class="popup-date-input">
                                                    {#snippet children({ segments })}
                                                        {#each segments as { part, value }, i (part + i)}
                                                            <span class="date-segment">
                                                                {#if part === "literal"}
                                                                    <DatePicker.Segment {part} class="date-literal">{value}</DatePicker.Segment>
                                                                {:else}
                                                                    <DatePicker.Segment {part} class="date-part">{value}</DatePicker.Segment>
                                                                {/if}
                                                            </span>
                                                        {/each}
                                                        <DatePicker.Trigger class="date-trigger">
                                                            <IconCalendar size={14} />
                                                        </DatePicker.Trigger>
                                                    {/snippet}
                                                </DatePicker.Input>
                                                <DatePicker.Content sideOffset={6} class="datepicker-popup z-50">
                                                    <DatePicker.Calendar class="datepicker-calendar">
                                                        {#snippet children({ months, weekdays })}
                                                            <DatePicker.Header class="datepicker-header">
                                                                <DatePicker.PrevButton class="datepicker-nav-btn">
                                                                    <IconChevronLeft size={16} />
                                                                </DatePicker.PrevButton>
                                                                <DatePicker.Heading class="datepicker-heading" />
                                                                <DatePicker.NextButton class="datepicker-nav-btn">
                                                                    <IconChevronRight size={16} />
                                                                </DatePicker.NextButton>
                                                            </DatePicker.Header>
                                                            <div class="datepicker-months">
                                                                {#each months as month (month.value)}
                                                                    <DatePicker.Grid class="datepicker-grid">
                                                                        <DatePicker.GridHead>
                                                                            <DatePicker.GridRow class="datepicker-weekdays">
                                                                                {#each weekdays as day (day)}
                                                                                    <DatePicker.HeadCell class="datepicker-weekday">
                                                                                        {day.slice(0, 2)}
                                                                                    </DatePicker.HeadCell>
                                                                                {/each}
                                                                            </DatePicker.GridRow>
                                                                        </DatePicker.GridHead>
                                                                        <DatePicker.GridBody>
                                                                            {#each month.weeks as weekDates (weekDates)}
                                                                                <DatePicker.GridRow class="datepicker-week">
                                                                                    {#each weekDates as dateCell (dateCell)}
                                                                                        {@const inWindow = isDateInWindow(dateCell, event)}
                                                                                        {@const isScheduled = isScheduledDate(dateCell, event)}
                                                                                        <DatePicker.Cell 
                                                                                            date={dateCell} 
                                                                                            month={month.value} 
                                                                                            class="datepicker-cell {isScheduled ? 'scheduled-date' : ''} {inWindow ? 'window-date' : ''}"
                                                                                        >
                                                                                            <DatePicker.Day class="datepicker-day">
                                                                                                {dateCell.day}
                                                                                            </DatePicker.Day>
                                                                                        </DatePicker.Cell>
                                                                                    {/each}
                                                                                </DatePicker.GridRow>
                                                                            {/each}
                                                                        </DatePicker.GridBody>
                                                                    </DatePicker.Grid>
                                                                {/each}
                                                            </div>
                                                        {/snippet}
                                                    </DatePicker.Calendar>
                                                </DatePicker.Content>
                                            </div>
                                        </DatePicker.Root>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                    
                    <!-- Unscheduled Event section - only show if unscheduled events are defined in the model AND day >= 0 -->
                    {#if unscheduledEvents.length > 0 && canAddUnscheduledEvent}
                        <!-- Separator -->
                        <div class="popup-separator"></div>
                        
                        <div class="popup-section">
                            <div class="section-header-row">
                                <span class="section-label">Unscheduled Event</span>
                                <button 
                                    type="button" 
                                    class="toggle-section-btn"
                                    onclick={(e) => toggleUnscheduledEvent(e)}
                                    aria-label={unscheduledEventEnabled ? 'Remove unscheduled event' : 'Add unscheduled event'}
                                >
                                    {#if unscheduledEventEnabled}
                                        <IconX size={16} />
                                    {:else}
                                        <IconPlus size={16} />
                                    {/if}
                                </button>
                            </div>
                            
                            {#if unscheduledEventEnabled}
                                <div class="event-row">
                                    <select class="popup-select" bind:value={selectedUnscheduledEvent}>
                                        {#each unscheduledEvents as event}
                                            <option value={event.name}>{event.name}</option>
                                        {/each}
                                    </select>
                                    
                                    <select class="popup-select event-status-select" bind:value={unscheduledEventStatus}>
                                        <option value="planned">Planned</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            {/if}
                        </div>
                    {/if}
                {/if}
                
                <!-- ==================== POPUP 3: No Event Day ==================== -->
                <!-- Only show this popup type if there are unscheduled events defined in the model AND day >= 0 -->
                {#if popupType === 'no-event' && unscheduledEvents.length > 0 && canAddUnscheduledEvent}
                    <div class="popup-section">
                        <div class="section-header-row">
                            <span class="section-label">Unscheduled Event</span>
                            <button 
                                type="button" 
                                class="toggle-section-btn"
                                onclick={(e) => toggleUnscheduledEvent(e)}
                                aria-label={unscheduledEventEnabled ? 'Remove unscheduled event' : 'Add unscheduled event'}
                            >
                                {#if unscheduledEventEnabled}
                                    <IconX size={16} />
                                {:else}
                                    <IconPlus size={16} />
                                {/if}
                            </button>
                        </div>
                        
                        {#if unscheduledEventEnabled}
                            <div class="event-row">
                                <select 
                                    class="popup-select"
                                    bind:value={selectedUnscheduledEvent}
                                >
                                    {#each unscheduledEvents as event}
                                        <option value={event.name}>{event.name}</option>
                                    {/each}
                                </select>
                                
                                <select 
                                    class="popup-select event-status-select"
                                    bind:value={unscheduledEventStatus}
                                >
                                    <option value="planned">Planned</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        {/if}
                    </div>
                {/if}
                
                <!-- Footer with buttons -->
                {#if hasChanges}
                    <div class="popup-separator"></div>
                    <footer class="popup-footer">
                        <button class="standard-button primary inverted" onclick={handleApply}>Apply</button>
                        <button class="standard-button gray inverted" onclick={handleCancel}>Cancel</button>
                    </footer>
                {/if}
            {/if}
        </div>
    </div>
{/if}
