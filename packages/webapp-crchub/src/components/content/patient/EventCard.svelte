<script lang="ts">
    import { onMount } from "svelte";
    // @ts-ignore
    import { X as IconX, Printer as IconPrinter, ChevronDown as IconChevronDown, ChevronRight as IconChevronRight, ChevronLeft as IconChevronLeft, ExternalLink as IconExternalLink } from '@lucide/svelte';
    import { ModelManager } from "../../../services/dsl/model-manager.js";
    import { type StudyConfiguration } from "@freon4dsl/study-configuration";

    // Types
    export type EventType = 'initial' | 'scheduled' | 'unscheduled';
    export type CardMode = 'selection' | 'scheduled';

    interface EventOption {
        id: string;
        name: string;
    }

    interface EventData {
        id: string;
        name: string;
        type: string;
        status: string;
        state?: string;
        scheduledDay?: number;
        originalScheduledDay?: number;
        isUnscheduledEvent?: boolean;
        window?: { daysBefore: number; daysAfter: number };
    }

    interface Task {
        name: string;
        description?: string;
        checked: boolean;
        steps: Step[];
    }

    interface Step {
        name: string;
        description?: string;
        checked: boolean;
        people: Person[];
        systems: System[];
        references: Reference[];
    }

    interface Person {
        name: string;
        email?: string;
        phone?: string;
        role?: string;
    }

    interface System {
        name: string;
        description?: string;
        url?: string;
    }

    interface Reference {
        name: string;
        link?: string;
        description?: string;
    }

    // Props
    let { 
        eventType,
        mode = 'scheduled',
        // Selection mode props
        availableEvents = [],
        selectedEventIds = new Set<string>(),
        onToggleSelection,
        onAdd,
        onCancel,
        // Scheduled mode props
        event = null,
        periodName = 'Study',
        dayNumber = 0,
        date = new Date(),
        patientId = '',
        patientReferenceDate = null,
        studyId = '',
        onAction,
        onDelete
    } = $props<{
        eventType: EventType;
        mode?: CardMode;
        // Selection mode
        availableEvents?: EventOption[];
        selectedEventIds?: Set<string>;
        onToggleSelection?: (eventId: string) => void;
        onAdd?: () => void;
        onCancel?: () => void;
        // Scheduled mode
        event?: EventData | null;
        periodName?: string;
        dayNumber?: number;
        date?: Date;
        patientId?: string;
        patientReferenceDate?: string | null;
        studyId?: string;
        onAction?: (eventId: string, action: string, data?: any) => void;
        onDelete?: () => void;
    }>();

    // Checklist data (for scheduled mode)
    let tasks = $state<Task[]>([]);
    let isLoadingChecklist = $state(true);
    let expandedTasks = $state<Set<string>>(new Set());
    let expandedSteps = $state<Set<string>>(new Set());

    // Move calendar state
    let showMoveCalendar = $state(false);
    let calendarYear = $state(new Date().getFullYear());
    let calendarMonth = $state(new Date().getMonth());
    let selectedMoveDay = $state<number | null>(null);

    // Derived: Event type label
    let eventTypeLabel = $derived.by(() => {
        switch (eventType) {
            case 'initial': return 'INITIAL EVENT';
            case 'unscheduled': return 'UNSCHEDULED EVENT';
            case 'scheduled': 
            default: return 'SCHEDULED EVENT';
        }
    });

    // Derived: Has checklist (only in scheduled mode with tasks)
    let hasChecklist = $derived(mode === 'scheduled' && tasks.length > 0);

    // Derived: Can delete (only INITIAL and UNSCHEDULED when pending)
    let canDelete = $derived.by(() => {
        if (mode === 'selection') return false;
        if (!event) return false;
        if (eventType === 'scheduled') return false;
        const isTerminal = ['completed', 'cancelled', 'missed'].includes(event.status);
        return !isTerminal;
    });

    // Derived: Is pending (can perform actions)
    let isPending = $derived.by(() => {
        if (mode === 'selection') return false;
        if (!event) return false;
        return event.status === 'planned' || event.status === 'pending';
    });

    // Derived: Is terminal status (completed/cancelled/missed - shows Reset button)
    let isTerminalStatus = $derived.by(() => {
        if (mode === 'selection') return false;
        if (!event) return false;
        return ['completed', 'cancelled', 'missed'].includes(event.status);
    });

    // Derived: Status badge class (matches popup styling)
    let statusBadgeClass = $derived.by(() => {
        if (!event) return 'status-planned';
        switch (event.status) {
            case 'completed': return 'status-completed';
            case 'cancelled': return 'status-cancelled';
            case 'missed': return 'status-missed';
            default: return 'status-planned';
        }
    });

    // Derived: Status label (matches popup labels)
    let statusLabel = $derived.by(() => {
        if (!event) return 'PLANNED';
        switch (event.status) {
            case 'completed': return 'COMPLETED';
            case 'cancelled': return 'CANCELLED';
            case 'missed': return 'MISSED';
            default: return 'PLANNED';
        }
    });

    // Derived: Has selected events (for Add button enable state)
    let hasSelectedEvents = $derived(selectedEventIds.size > 0);

    // Calendar constants
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Derived: Calendar days grid (null for empty cells before 1st of month)
    let calendarDays = $derived.by(() => {
        const firstDay = new Date(calendarYear, calendarMonth, 1);
        const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
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
        return day === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear();
    }

    function isCalendarWeekend(day: number): boolean {
        const d = new Date(calendarYear, calendarMonth, day);
        const dow = d.getDay();
        return dow === 0 || dow === 6;
    }

    // Helper: convert a day number (relative to reference date) to an actual Date
    function dayNumberToDate(dayNum: number): Date | null {
        if (!patientReferenceDate) return null;
        const [refY, refM, refD] = patientReferenceDate.split('-').map(Number);
        const refDate = new Date(refY, refM - 1, refD);
        refDate.setDate(refDate.getDate() + dayNum);
        return refDate;
    }

    // Helper: check if a calendar day matches a specific date
    function calendarDayMatchesDate(day: number, targetDate: Date): boolean {
        return day === targetDate.getDate() &&
               calendarMonth === targetDate.getMonth() &&
               calendarYear === targetDate.getFullYear();
    }

    // Check if a calendar day falls within the event's scheduling window
    // Uses originalScheduledDay (the original position) to calculate the window, NOT scheduledDay (current position)
    function isCalendarInWindow(day: number): boolean {
        if (!event?.window) return false;
        
        // Use originalScheduledDay for window calculation, fall back to scheduledDay
        const baseDay = event.originalScheduledDay ?? event.scheduledDay;
        const scheduledDate = dayNumberToDate(baseDay);
        if (!scheduledDate) return false;
        
        // Calculate window start/end dates
        const windowStart = new Date(scheduledDate);
        windowStart.setDate(windowStart.getDate() - event.window.daysBefore);
        const windowEnd = new Date(scheduledDate);
        windowEnd.setDate(windowEnd.getDate() + event.window.daysAfter);
        
        // Check if the calendar day falls within the window
        const calDate = new Date(calendarYear, calendarMonth, day);
        return calDate >= windowStart && calDate <= windowEnd;
    }

    // Check if a calendar day is the event's current actual position (scheduledDay)
    // This is where the event currently sits — colored by state:
    //   green = on-scheduled-date, blue = in-window, orange = out-of-window
    function isCalendarCurrentEventDay(day: number): boolean {
        if (!event) return false;
        
        const currentDate = dayNumberToDate(event.scheduledDay);
        if (!currentDate) return false;
        
        return calendarDayMatchesDate(day, currentDate);
    }

    // Get the state-based class for the current event day
    function getCalendarEventDayState(): 'on-scheduled-date' | 'in-window' | 'out-of-window' {
        if (!event) return 'on-scheduled-date';
        
        // Use the event's current state to determine color
        if (event.state === 'out-of-window') return 'out-of-window';
        if (event.state === 'in-window') return 'in-window';
        return 'on-scheduled-date';
    }

    // Check if a calendar day is the original scheduled date (green outline marker)
    function isCalendarOriginalScheduledDay(day: number): boolean {
        if (!event) return false;
        
        const baseDay = event.originalScheduledDay ?? event.scheduledDay;
        const originalDate = dayNumberToDate(baseDay);
        if (!originalDate) return false;
        
        return calendarDayMatchesDate(day, originalDate);
    }

    function navigateCalendarMonth(delta: number) {
        let newMonth = calendarMonth + delta;
        let newYear = calendarYear;
        if (newMonth < 0) {
            newMonth = 11;
            newYear--;
        } else if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        }
        calendarMonth = newMonth;
        calendarYear = newYear;
        selectedMoveDay = null;
    }

    // Load checklist data
    async function loadChecklist() {
        console.log('[EventCard] loadChecklist() called — mode:', mode, 'event:', event?.id, event?.name, 'studyId:', studyId);
        
        if (mode !== 'scheduled' || !event || !studyId) {
            console.log('[EventCard] loadChecklist() skipped — mode:', mode, 'hasEvent:', !!event, 'studyId:', studyId);
            tasks = [];
            isLoadingChecklist = false;
            return;
        }

        isLoadingChecklist = true;
        try {
            const modelManager = ModelManager.getInstance();
            const studyConfig = await modelManager.getModelUnitWithoutOpening(studyId, "StudyConfiguration") as StudyConfiguration;
            
            if (!studyConfig) {
                console.warn('[EventCard] No study configuration found for studyId:', studyId);
                tasks = [];
                return;
            }

            console.log('[EventCard] Study config loaded, searching for event name:', event.name);
            console.log('[EventCard] Periods:', studyConfig.periods?.length, 'Study-level unscheduled:', studyConfig.unscheduledEvents?.length);

            const loadedTasks: Task[] = [];
            let foundIn = '';
            
            // Search in periods for the event
            for (const period of studyConfig.periods || []) {
                for (const configEvent of period.events || []) {
                    if (configEvent.name === event.name) {
                        foundIn = `period "${period.name}" scheduled events`;
                        for (const task of configEvent.tasks || []) {
                            loadedTasks.push(extractTask(task));
                        }
                        break;
                    }
                }
                
                for (const unscheduledEvent of period.unscheduledEvents || []) {
                    if (unscheduledEvent.name === event.name) {
                        foundIn = `period "${period.name}" unscheduled events`;
                        for (const task of unscheduledEvent.tasks || []) {
                            loadedTasks.push(extractTask(task));
                        }
                        break;
                    }
                }
            }
            
            // Check study-level unscheduled events
            if (loadedTasks.length === 0) {
                for (const unscheduledEvent of studyConfig.unscheduledEvents || []) {
                    if (unscheduledEvent.name === event.name) {
                        foundIn = 'study-level unscheduled events';
                        for (const task of unscheduledEvent.tasks || []) {
                            loadedTasks.push(extractTask(task));
                        }
                        break;
                    }
                }
            }
            
            console.log('[EventCard] loadChecklist() result — event:', event.name, 'foundIn:', foundIn || 'NOT FOUND', 'tasks:', loadedTasks.length, loadedTasks.map(t => t.name));
            
            tasks = loadedTasks;
            
            // Expand all tasks and steps by default
            expandedTasks = new Set(loadedTasks.map((_, i) => `task-${i}`));
            const stepIds: string[] = [];
            loadedTasks.forEach((task, taskIndex) => {
                task.steps.forEach((step, stepIndex) => {
                    if (step.people.length > 0 || step.systems.length > 0 || step.references.length > 0) {
                        stepIds.push(`task-${taskIndex}-step-${stepIndex}`);
                    }
                });
            });
            expandedSteps = new Set(stepIds);
            
        } catch (err) {
            console.error('[EventCard] Error loading checklist:', err);
            tasks = [];
        } finally {
            isLoadingChecklist = false;
        }
    }

    function extractTask(task: any): Task {
        const taskData: Task = {
            name: task.name || 'Unnamed Task',
            description: task.description?.content || '',
            checked: false,
            steps: []
        };
        
        const taskSteps = task.steps || [];
        for (const step of taskSteps) {
            const stepData: Step = {
                name: step.name || 'Unnamed Step',
                description: step.description?.content || '',
                checked: false,
                people: [],
                systems: [],
                references: []
            };
            
            for (const person of step.people || []) {
                stepData.people.push({
                    name: person.name || 'Unknown',
                    email: person.email || '',
                    phone: person.phoneNumber || '',
                    role: person.role?.name || ''
                });
            }
            
            for (const system of step.systems || []) {
                stepData.systems.push({
                    name: system.name || 'Unknown',
                    description: system.description?.content || '',
                    url: system.accessedAt || ''
                });
            }
            
            for (const ref of step.references || []) {
                stepData.references.push({
                    name: ref.name || 'Unknown',
                    link: ref.link || '',
                    description: ref.description?.content || ''
                });
            }
            
            taskData.steps.push(stepData);
        }
        
        return taskData;
    }

    function toggleTask(taskId: string) {
        const newExpanded = new Set(expandedTasks);
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId);
        } else {
            newExpanded.add(taskId);
        }
        expandedTasks = newExpanded;
    }

    function toggleStep(stepId: string) {
        const newExpanded = new Set(expandedSteps);
        if (newExpanded.has(stepId)) {
            newExpanded.delete(stepId);
        } else {
            newExpanded.add(stepId);
        }
        expandedSteps = newExpanded;
    }

    function handleComplete() {
        if (event) onAction?.(event.id, 'complete');
    }

    function handleCancel() {
        if (event) onAction?.(event.id, 'cancel');
    }

    function handleMissed() {
        if (event) onAction?.(event.id, 'missed');
    }

    function handleMove() {
        showMoveCalendar = true;
        const d = date || new Date();
        calendarYear = d.getFullYear();
        calendarMonth = d.getMonth();
        selectedMoveDay = null;
    }

    function handleMoveOk() {
        if (selectedMoveDay !== null && event) {
            const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(selectedMoveDay).padStart(2, '0')}`;
            onAction?.(event.id, 'move', { date: dateStr });
        }
        showMoveCalendar = false;
        selectedMoveDay = null;
    }

    function handleMoveCancel() {
        showMoveCalendar = false;
        selectedMoveDay = null;
    }

    function handleReset() {
        if (event) onAction?.(event.id, 'reset');
    }

    function handleDelete() {
        if (canDelete) {
            onDelete?.();
        }
    }

    function handlePrint() {
        if (!event) return;
        
        const printContent = document.createElement('div');
        printContent.innerHTML = `
            <style>
                @media print {
                    body * { visibility: hidden; }
                    .print-content, .print-content * { visibility: visible; }
                    .print-content { position: absolute; left: 0; top: 0; width: 100%; }
                }
                .print-header { margin-bottom: 1rem; }
                .print-header h1 { font-size: 1.5rem; margin: 0; }
                .print-header p { margin: 0.25rem 0; color: #666; }
                .print-task { margin: 1rem 0; }
                .print-task h3 { margin: 0.5rem 0; }
                .print-step { margin-left: 1.5rem; }
                .print-step h4 { margin: 0.25rem 0; }
                .print-meta { margin-left: 2.5rem; font-size: 0.875rem; color: #666; }
                .print-meta h5 { margin: 0.25rem 0; font-weight: 600; }
                .print-meta ul { margin: 0.25rem 0; padding-left: 1.5rem; }
            </style>
            <div class="print-content">
                <div class="print-header">
                    <h1>${event.name}</h1>
                    <p>Patient: ${patientId} | Day ${dayNumber} | ${date.toLocaleDateString()}</p>
                    <p>Period: ${periodName} | Status: ${statusLabel}</p>
                </div>
                ${tasks.map((task, ti) => `
                    <div class="print-task">
                        <h3>☐ Task ${ti + 1}: ${task.name}</h3>
                        ${task.description ? `<p>${task.description}</p>` : ''}
                        ${task.steps.map((step, si) => `
                            <div class="print-step">
                                <h4>☐ Step ${si + 1}: ${step.name}</h4>
                                ${step.description ? `<p>${step.description}</p>` : ''}
                                ${step.people.length > 0 ? `
                                    <div class="print-meta">
                                        <h5>PEOPLE</h5>
                                        <ul>${step.people.map(p => `<li>${p.name}${p.role ? ` (${p.role})` : ''}</li>`).join('')}</ul>
                                    </div>
                                ` : ''}
                                ${step.systems.length > 0 ? `
                                    <div class="print-meta">
                                        <h5>SYSTEMS USED</h5>
                                        <ul>${step.systems.map(s => `<li>${s.name}</li>`).join('')}</ul>
                                    </div>
                                ` : ''}
                                ${step.references.length > 0 ? `
                                    <div class="print-meta">
                                        <h5>REFERENCES</h5>
                                        <ul>${step.references.map(r => `<li>${r.name}${r.link ? ` (${r.link})` : ''}</li>`).join('')}</ul>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `;
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent.innerHTML);
            printWindow.document.close();
            printWindow.print();
        }
    }

    // Track the current event id/name so we can reactively reload the checklist when it changes
    let lastLoadedEventKey = $state<string | null>(null);

    $effect(() => {
        // Build a key from the event's identity
        const currentKey = event ? `${event.id}::${event.name}` : null;
        console.log('[EventCard] $effect checklist check — mode:', mode, 'currentKey:', currentKey, 'lastLoadedKey:', lastLoadedEventKey);
        
        if (mode === 'scheduled' && currentKey && currentKey !== lastLoadedEventKey) {
            console.log('[EventCard] Event changed, reloading checklist. Old key:', lastLoadedEventKey, '→ New key:', currentKey);
            lastLoadedEventKey = currentKey;
            loadChecklist();
        } else if (mode !== 'scheduled' || !currentKey) {
            // Not in scheduled mode or no event — clear tasks
            if (tasks.length > 0) {
                console.log('[EventCard] Clearing tasks (mode:', mode, ', currentKey:', currentKey, ')');
                tasks = [];
            }
            isLoadingChecklist = false;
            lastLoadedEventKey = null;
        }
    });
</script>

<div class="event-card">
    <!-- Header: Type label + context-sensitive buttons -->
    <div class="card-header">
        <span class="event-type-label">{eventTypeLabel}</span>
        <div class="header-actions">
            {#if mode === 'scheduled' && !showMoveCalendar}
                {#if isTerminalStatus}
                    <button class="header-btn reset-btn" onclick={handleReset} title="Reset to pending">
                        Reset
                    </button>
                {:else if isPending}
                    {#if hasChecklist}
                        <button class="header-btn" onclick={handlePrint} title="Print checklist">
                            <IconPrinter size={16} />
                            <span>Print</span>
                        </button>
                    {/if}
                    {#if canDelete}
                        <button class="header-btn delete-btn" onclick={handleDelete} title="Delete event">
                            Delete
                        </button>
                    {/if}
                {/if}
            {/if}
        </div>
    </div>

    <!-- Content: depends on mode -->
    <div class="card-body">
        {#if mode === 'selection'}
            <!-- Selection mode: checkbox list + Ok/Cancel buttons -->
            <div class="selection-content">
                {#each availableEvents as eventOption}
                    <label class="event-option">
                        <input 
                            type="checkbox" 
                            checked={selectedEventIds.has(eventOption.id)}
                            onchange={() => onToggleSelection?.(eventOption.id)}
                        />
                        <span>{eventOption.name}</span>
                    </label>
                {/each}
                <div class="selection-actions">
                    <button 
                        class="selection-ok-btn" 
                        onclick={() => onAdd?.()}
                        disabled={!hasSelectedEvents}
                    >Ok</button>
                    {#if onCancel}
                        <button 
                            class="selection-cancel-btn"
                            onclick={() => onCancel?.()}
                        >Cancel</button>
                    {/if}
                </div>
            </div>
        {:else if mode === 'scheduled' && event}
            <!-- Scheduled mode: name/status + conditional actions/calendar -->
            <div class="scheduled-content">
                <!-- Event name and status badge -->
                <div class="event-info-row">
                    <span class="event-name">{event.name}</span>
                    <span class="status-badge {statusBadgeClass}">{statusLabel}</span>
                </div>

                {#if showMoveCalendar}
                    <!-- Move calendar date picker -->
                    <div class="move-calendar-section">
                        <div class="move-calendar-header">
                            <button class="move-calendar-nav-btn" onclick={() => navigateCalendarMonth(-1)} aria-label="Previous month">
                                <IconChevronLeft size={16} />
                            </button>
                            <span class="move-calendar-month-year">{MONTH_NAMES[calendarMonth]} {calendarYear}</span>
                            <button class="move-calendar-nav-btn" onclick={() => navigateCalendarMonth(1)} aria-label="Next month">
                                <IconChevronRight size={16} />
                            </button>
                        </div>
                        <div class="move-calendar-grid">
                            <div class="move-calendar-weekdays">
                                {#each DAY_NAMES as dayName}
                                    <span class="move-calendar-weekday">{dayName}</span>
                                {/each}
                            </div>
                            <div class="move-calendar-days">
                                {#each calendarDays as day}
                                    {#if day === null}
                                        <span class="move-calendar-day empty"></span>
                                    {:else}
                                        <button 
                                            class="move-calendar-day"
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
                        <div class="move-calendar-actions">
                            <button class="move-calendar-ok-btn" onclick={handleMoveOk} disabled={selectedMoveDay === null}>Ok</button>
                            <button class="move-calendar-cancel-btn" onclick={handleMoveCancel}>Cancel</button>
                        </div>
                    </div>
                {:else if isPending}
                    <!-- Action buttons for pending events -->
                    <div class="action-buttons">
                        <button class="action-btn completed" onclick={handleComplete}>
                            Complete
                        </button>
                        <button class="action-btn canceled" onclick={handleCancel}>
                            Cancel
                        </button>
                        <button class="action-btn missed" onclick={handleMissed}>
                            Missed
                        </button>
                        <button class="action-btn move" onclick={handleMove}>
                            Move
                        </button>
                    </div>
                {/if}

                <!-- Checklist (hidden during calendar view) -->
                {#if !showMoveCalendar}
                    <div class="checklist-section">
                        {#if isLoadingChecklist}
                            <div class="loading-checklist">Loading checklist...</div>
                        {:else if tasks.length === 0}
                            <div class="empty-checklist">No tasks defined for this event.</div>
                        {:else}
                            <div class="checklist-content">
                                {#each tasks as task, taskIndex}
                                    {@const taskId = `task-${taskIndex}`}
                                    {@const isTaskExpanded = expandedTasks.has(taskId)}
                                    <div class="task-item">
                                        <div class="task-header" onclick={() => toggleTask(taskId)}>
                                            <input type="checkbox" bind:checked={task.checked} onclick={(e) => e.stopPropagation()} />
                                            <button class="expand-btn">
                                                {#if isTaskExpanded}
                                                    <IconChevronDown size={14} />
                                                {:else}
                                                    <IconChevronRight size={14} />
                                                {/if}
                                            </button>
                                            <span class="task-name">Task {taskIndex + 1}: {task.name}</span>
                                        </div>
                                        {#if task.description}
                                            <div class="task-description">{task.description}</div>
                                        {/if}
                                        
                                        {#if isTaskExpanded && task.steps.length > 0}
                                            <div class="steps-list">
                                                {#each task.steps as step, stepIndex}
                                                    {@const stepId = `${taskId}-step-${stepIndex}`}
                                                    {@const isStepExpanded = expandedSteps.has(stepId)}
                                                    {@const hasDetails = step.people.length > 0 || step.systems.length > 0 || step.references.length > 0}
                                                    <div class="step-item">
                                                        <div class="step-header" onclick={() => hasDetails && toggleStep(stepId)}>
                                                            <input type="checkbox" bind:checked={step.checked} onclick={(e) => e.stopPropagation()} />
                                                            {#if hasDetails}
                                                                <button class="expand-btn">
                                                                    {#if isStepExpanded}
                                                                        <IconChevronDown size={12} />
                                                                    {:else}
                                                                        <IconChevronRight size={12} />
                                                                    {/if}
                                                                </button>
                                                            {:else}
                                                                <span class="expand-placeholder"></span>
                                                            {/if}
                                                            <span class="step-name">Step {stepIndex + 1}: {step.name}</span>
                                                        </div>
                                                        {#if step.description}
                                                            <div class="step-description">{step.description}</div>
                                                        {/if}
                                                        
                                                        {#if isStepExpanded}
                                                            <div class="step-details">
                                                                {#if step.people.length > 0}
                                                                    <div class="detail-section">
                                                                        <span class="detail-label">PEOPLE</span>
                                                                        <ul class="detail-list">
                                                                            {#each step.people as person}
                                                                                <li class="person-item">
                                                                                    <span class="bullet">●</span>
                                                                                    <span class="person-name">{person.name}</span>
                                                                                    {#if person.role}
                                                                                        <span class="person-role">({person.role})</span>
                                                                                    {/if}
                                                                                </li>
                                                                            {/each}
                                                                        </ul>
                                                                    </div>
                                                                {/if}
                                                                
                                                                {#if step.systems.length > 0}
                                                                    <div class="detail-section">
                                                                        <span class="detail-label">SYSTEMS USED</span>
                                                                        <ul class="detail-list">
                                                                            {#each step.systems as system}
                                                                                <li class="system-item">
                                                                                    <span class="bullet">●</span>
                                                                                    {#if system.url}
                                                                                        <a href={system.url} target="_blank" rel="noopener noreferrer" class="system-link">
                                                                                            {system.name}
                                                                                            <IconExternalLink size={10} />
                                                                                        </a>
                                                                                    {:else}
                                                                                        <span class="system-name">{system.name}</span>
                                                                                    {/if}
                                                                                </li>
                                                                            {/each}
                                                                        </ul>
                                                                    </div>
                                                                {/if}
                                                                
                                                                {#if step.references.length > 0}
                                                                    <div class="detail-section">
                                                                        <span class="detail-label">REFERENCES</span>
                                                                        <ul class="detail-list">
                                                                            {#each step.references as ref}
                                                                                <li class="reference-item">
                                                                                    <span class="bullet">●</span>
                                                                                    {#if ref.link}
                                                                                        <a href={ref.link} target="_blank" rel="noopener noreferrer" class="reference-link">
                                                                                            {ref.name}
                                                                                            <IconExternalLink size={10} />
                                                                                        </a>
                                                                                    {:else}
                                                                                        <span class="reference-name">{ref.name}</span>
                                                                                    {/if}
                                                                                </li>
                                                                            {/each}
                                                                        </ul>
                                                                    </div>
                                                                {/if}
                                                            </div>
                                                        {/if}
                                                    </div>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>
