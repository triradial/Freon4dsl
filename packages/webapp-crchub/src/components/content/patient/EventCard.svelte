<script lang="ts">
    import { onMount } from "svelte";
    // @ts-ignore
    import { X as IconX, ChevronDown as IconChevronDown, ChevronRight as IconChevronRight, ChevronLeft as IconChevronLeft, ExternalLink as IconExternalLink, FileText as IconPdf, FileSpreadsheet as IconWord } from '@lucide/svelte';
    import { ModelManager } from "../../../services/dsl/model-manager.js";
    import { getEventChecklistAsMarkdownByName, getEventChecklistAsMarkdownByNameForPdf, type StudyConfiguration } from "@freon4dsl/study-configuration";
    import { dataStore } from "../../../services/data/data-store.js";
    import { generateWordChecklist } from "../../../services/document/word-checklist-generator.js";
    import MarkdownIt from "markdown-it";
    import pdfMake from "pdfmake/build/pdfmake.js";
    import pdfFonts from "pdfmake/build/vfs_fonts.js";

    pdfMake.vfs = pdfFonts as any;

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
    const md = new MarkdownIt({ html: true });
    let checklistHtml = $state<string>("");
    let isLoadingChecklist = $state(true);
    let isGeneratingPdf = $state(false);
    let isGeneratingWord = $state(false);

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

    // Derived: Has checklist (only in scheduled mode with content)
    let hasChecklist = $derived(mode === 'scheduled' && checklistHtml.length > 0);

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

    // Load checklist data using markdown-based approach (same as VisitChecklistDrawer)
    async function loadChecklist() {
        console.log('[EventCard] loadChecklist() called — mode:', mode, 'event:', event?.id, event?.name, 'studyId:', studyId);

        if (mode !== 'scheduled' || !event || !studyId) {
            console.log('[EventCard] loadChecklist() skipped — mode:', mode, 'hasEvent:', !!event, 'studyId:', studyId);
            checklistHtml = "";
            isLoadingChecklist = false;
            return;
        }

        isLoadingChecklist = true;
        try {
            const modelManager = ModelManager.getInstance();
            const studyConfig = await modelManager.getModelUnitWithoutOpening(studyId, "StudyConfiguration") as StudyConfiguration;

            if (!studyConfig) {
                console.warn('[EventCard] No study configuration found for studyId:', studyId);
                checklistHtml = "";
                return;
            }

            // Generate markdown for the specific event by name
            const markdown = getEventChecklistAsMarkdownByName(studyConfig, event.name);
            console.log('[EventCard] Generated markdown for event:', event.name, 'length:', markdown.length);

            // Render markdown to HTML
            let bodyHtml = md.render(markdown);

            // Post-process HTML (add CSS classes to tables, external links)
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = bodyHtml;

            const tables = tempDiv.querySelectorAll('table');
            tables.forEach(table => table.classList.add('table_component'));

            const links = tempDiv.querySelectorAll('a[href]');
            links.forEach(link => {
                const href = link.getAttribute('href')?.trim() ?? "";
                if (href.startsWith("http://") || href.startsWith("https://")) {
                    link.setAttribute("target", "_blank");
                    link.setAttribute("rel", "noopener noreferrer");
                }
            });

            checklistHtml = tempDiv.innerHTML;
            console.log('[EventCard] Generated HTML length:', checklistHtml.length);

        } catch (err) {
            console.error('[EventCard] Error loading checklist:', err);
            checklistHtml = "";
        } finally {
            isLoadingChecklist = false;
        }
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

    /**
     * Generate markdown for PDF/Word using the heading-based format.
     */
    async function getMarkdownForPdf(): Promise<string | null> {
        if (!event || !studyId) return null;

        try {
            const modelManager = ModelManager.getInstance();
            const studyConfig = await modelManager.getModelUnitWithoutOpening(studyId, "StudyConfiguration") as StudyConfiguration;
            if (!studyConfig) return null;

            return getEventChecklistAsMarkdownByNameForPdf(studyConfig, event.name);
        } catch (err) {
            console.error('[EventCard] Error getting markdown for PDF:', err);
            return null;
        }
    }

    async function openPdf() {
        if (!event || !checklistHtml) return;

        isGeneratingPdf = true;

        try {
            const markdown = await getMarkdownForPdf();
            if (!markdown) {
                console.error('[EventCard] Unable to generate checklist content for PDF.');
                isGeneratingPdf = false;
                return;
            }

            const study = await dataStore.getStudy(studyId);
            const studyName = study?.name ?? "Study";

            // Parse markdown to create PDF content
            const lines = markdown.split('\n');
            const pdfContent: any[] = [];

            // Add header
            pdfContent.push({
                text: `${studyName} - ${event.name}`,
                style: 'header',
                margin: [0, 0, 0, 5]
            });
            pdfContent.push({
                text: `Patient: ${patientId} | Day ${dayNumber} | ${date.toLocaleDateString()}`,
                style: 'subheader',
                margin: [0, 0, 0, 10]
            });

            // Parse markdown lines
            for (const line of lines) {
                if (!line.trim()) continue;

                if (line.startsWith('# ')) {
                    pdfContent.push({ text: line.substring(2), style: 'h1', margin: [0, 15, 0, 5] });
                } else if (line.startsWith('## ')) {
                    pdfContent.push({ text: line.substring(3), style: 'h2', margin: [0, 12, 0, 4] });
                } else if (line.startsWith('### ')) {
                    pdfContent.push({ text: line.substring(4), style: 'h3', margin: [0, 10, 0, 3] });
                } else if (line.startsWith('#### ')) {
                    pdfContent.push({ text: line.substring(5), style: 'h4', margin: [0, 8, 0, 2] });
                } else if (line.startsWith('- ')) {
                    pdfContent.push({ text: `• ${line.substring(2)}`, margin: [10, 2, 0, 2] });
                } else if (line.startsWith('---')) {
                    pdfContent.push({ canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 0.5, lineColor: '#cccccc' }], margin: [0, 10, 0, 10] });
                } else if (!line.startsWith('<')) {
                    pdfContent.push({ text: line, margin: [0, 2, 0, 2] });
                }
            }

            const docDefinition = {
                content: pdfContent,
                styles: {
                    header: { fontSize: 18, bold: true },
                    subheader: { fontSize: 10, color: '#666666' },
                    h1: { fontSize: 16, bold: true },
                    h2: { fontSize: 14, bold: true },
                    h3: { fontSize: 12, bold: true },
                    h4: { fontSize: 11, bold: true }
                },
                defaultStyle: {
                    fontSize: 10,
                    lineHeight: 1.15
                }
            };

            pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
                const url = URL.createObjectURL(blob);
                window.open(url);
            });
        } catch (err) {
            console.error('[EventCard] Error generating PDF:', err);
        } finally {
            isGeneratingPdf = false;
        }
    }

    async function openWord() {
        if (!event || !checklistHtml) return;

        isGeneratingWord = true;

        try {
            const markdown = await getMarkdownForPdf();
            if (!markdown) {
                console.error('[EventCard] Unable to generate checklist content for Word document.');
                isGeneratingWord = false;
                return;
            }

            const study = await dataStore.getStudy(studyId);
            const studyName = study?.name ?? "Study";
            const dateStr = date.toLocaleDateString().replace(/\//g, '-');

            // Generate Word document from markdown
            const blob = await generateWordChecklist(
                markdown,
                `${studyName} - ${event.name} - ${dateStr}`
            );

            // Download the file
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${studyName}-${event.name}-${dateStr}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error('[EventCard] Error generating Word document:', err);
        } finally {
            isGeneratingWord = false;
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
            // Not in scheduled mode or no event — clear checklist
            if (checklistHtml.length > 0) {
                console.log('[EventCard] Clearing checklist (mode:', mode, ', currentKey:', currentKey, ')');
                checklistHtml = "";
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
                        <button
                            class="header-btn"
                            onclick={openPdf}
                            disabled={isGeneratingPdf}
                            title={isGeneratingPdf ? "Generating PDF..." : "Open checklist as PDF"}
                        >
                            <IconPdf size={16} />
                            <span>{isGeneratingPdf ? '...' : 'PDF'}</span>
                        </button>
                        <button
                            class="header-btn"
                            onclick={openWord}
                            disabled={isGeneratingWord}
                            title={isGeneratingWord ? "Generating Word document..." : "Download checklist as Word document"}
                        >
                            <IconWord size={16} />
                            <span>{isGeneratingWord ? '...' : 'Word'}</span>
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
                        {:else if !checklistHtml}
                            <div class="empty-checklist">No tasks defined for this event.</div>
                        {:else}
                            <div class="study-checklist-content">
                                {@html checklistHtml}
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>
