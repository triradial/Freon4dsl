<script lang="ts">
    // Patient Timeline Section - Shared component for displaying patient schedule timeline
    // Used by PatientStaffTimelineChart
    
    // @ts-ignore
    import { CircleChevronLeft as IconChevronCircleLeft, CircleChevronRight as IconChevronCircleRight, Plus as IconPlus, Pencil as IconPencil, Trash2 as IconTrash, RefreshCw as IconRefresh, Calendar as IconCalendar, Calendar1 as IconCalendar1, CalendarCheck as IconCalendarCheck, Grid2x2 as IconWindow, Check as IconCheck, X as IconX, ArrowRightToLine as IconArrowRightToLine } from '@lucide/svelte';
    import { type MonthGroup } from './TimelineCalendarHeader.svelte';
    
    export interface PatientRecord {
        id: string;
        patientNumber: string;
        initials?: string;
    }
    
    export interface DayRenderingInfo {
        isWindow: boolean;
        event: any | null;
        state: string;
        isActual: boolean;
        eventType: string;
        isUnscheduledEvent: boolean;
    }
    
    export interface TooltipEvent {
        name: string;
        status: string;
    }
    
    let { 
        studyId,
        visibleDays = [],
        visiblePatientIds = [],
        patients = [],
        monthGroups = [],
        dayWidth = 40,
        viewMode = 'scheduling',
        showAvailability = false,
        showWindows = true,
        getDateFromDay,
        isWeekend,
        isToday,
        getMonthName,
        getDayOfWeekAbbr,
        getMonthForDay,
        getPatientDayData,
        getDayRenderingInfo,
        isPatientUnavailable,
        isPatientDayZero,
        patientHasFirstVisit,
        onPatientCellClick,
        onPatientCellMouseEnter,
        onPatientCellMouseMove,
        onPatientCellMouseLeave,
        onAddPatient,
        onRefreshPatients,
        onEditPatient,
        onDeletePatient,
        onJumpToFirstVisit,
        onNavigatePrevious,
        onNavigateNext,
        canNavigatePrevious = false,
        canNavigateNext = false,
        hoveredPatientId = $bindable<string | null>(null),
        patientLabelsScrollRef = $bindable<HTMLElement | null>(null),
        patientRowsScrollRef = $bindable<HTMLElement | null>(null),
        onPatientScroll,
        quickFilter = $bindable(''),
        onQuickFilterChange
    } = $props<{
        studyId: string;
        visibleDays: number[];
        visiblePatientIds: string[];
        patients: PatientRecord[];
        monthGroups: MonthGroup[];
        dayWidth: number;
        viewMode: 'scheduling' | 'availability';
        showAvailability: boolean;
        showWindows: boolean;
        getDateFromDay: (day: number) => Date;
        isWeekend: (date: Date) => boolean;
        isToday: (day: number) => boolean;
        getMonthName: (date: Date) => string;
        getDayOfWeekAbbr: (date: Date) => string;
        getMonthForDay: (day: number) => { month: number; year: number };
        getPatientDayData: (day: number, patientId: string) => any;
        getDayRenderingInfo: (day: number, patientId: string) => DayRenderingInfo;
        isPatientUnavailable: (day: number, patientId: string) => boolean;
        isPatientDayZero: (day: number, patientId: string) => boolean;
        patientHasFirstVisit: (patientId: string) => boolean;
        onPatientCellClick: (event: MouseEvent, day: number, patientId: string) => void;
        onPatientCellMouseEnter: (event: MouseEvent, day: number, patientId: string) => void;
        onPatientCellMouseMove: (event: MouseEvent) => void;
        onPatientCellMouseLeave: () => void;
        onAddPatient: () => void;
        onRefreshPatients: () => void;
        onEditPatient: (patientId: string) => void;
        onDeletePatient: (patientId: string, triggerElement: HTMLElement) => void;
        onJumpToFirstVisit: (patientId: string) => void;
        onNavigatePrevious: () => void;
        onNavigateNext: () => void;
        canNavigatePrevious: boolean;
        canNavigateNext: boolean;
        hoveredPatientId?: string | null;
        patientLabelsScrollRef?: HTMLElement | null;
        patientRowsScrollRef?: HTMLElement | null;
        onPatientScroll?: (source: 'labels' | 'rows') => void;
        quickFilter?: string;
        onQuickFilterChange?: (value: string) => void;
    }>();

    // Get patient record by patientId (patientNumber)
    function getPatientRecord(patientId: string): PatientRecord | undefined {
        return patients.find(p => p.patientNumber === patientId);
    }
    
    // Handle quick filter input change
    function handleFilterInput(event: Event) {
        const target = event.target as HTMLInputElement;
        quickFilter = target.value;
        onQuickFilterChange?.(target.value);
    }
    
    // Clear quick filter
    function clearFilter() {
        quickFilter = '';
        onQuickFilterChange?.('');
    }
</script>

<!-- Patient Section -->
<div class="timeline-section patients">
    <div class="timeline-grid">
        <!-- Left column: Patients label, patient labels -->
        <div class="left-column">
            <!-- Patients label (aligned with month row) -->
            <div class="section-label-row">
                <h3 class="section-title">Patients</h3>
                <button class="grid-button general-button" onclick={onAddPatient} title="Add Patient" aria-label="Add Patient">
                    <IconPlus size={16} />
                </button>
                <button class="grid-button green-button" onclick={onRefreshPatients} title="Refresh Patients" aria-label="Refresh Patients">
                    <IconRefresh size={16} />
                </button>
            </div>
            
            <!-- Quick filter row -->
            <div class="quick-filter-row">
                <div class="search-container">
                    <input 
                        type="text" 
                        placeholder="Quick filter..." 
                        class="quick-input-field" 
                        value={quickFilter} 
                        oninput={handleFilterInput} 
                    />
                    {#if quickFilter}
                        <button type="button" class="clear-search-button" onclick={clearFilter}>×</button>
                    {/if}
                </div>
            </div>
            
            <!-- Patient labels column (scrollable) -->
            <div class="patient-labels-scroll-wrapper" bind:this={patientLabelsScrollRef} onscroll={() => onPatientScroll?.('labels')}>
                <div class="patient-labels-column">
                    {#each visiblePatientIds as patientId}
                        {@const patientRecord = getPatientRecord(patientId)}
                        {@const hasFirstVisit = patientHasFirstVisit(patientId)}
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div class="row-label-container" onmouseenter={() => hoveredPatientId = patientId} onmouseleave={() => hoveredPatientId = null}>    
                            <div class="row-left-content">
                                <span class="row-label-text">
                                    <a href="/patient?id={patientRecord?.id || ''}&studyId={studyId}" class="name-link-text">{patientId}</a>{patientRecord?.initials ? ` • ${patientRecord.initials}` : ''}
                                </span>
                                {#if hoveredPatientId === patientId}
                                    <div class="row-actions">
                                        <button class="grid-button general-button" onclick={() => onEditPatient(patientId)} title="Edit Patient" aria-label="Edit Patient">
                                            <IconPencil size={14} />
                                        </button>
                                        <button class="grid-button delete-button" onclick={(e) => onDeletePatient(patientId, e.currentTarget as HTMLElement)} title="Delete Patient" aria-label="Delete Patient">
                                            <IconTrash size={14} />
                                        </button>
                                    </div>
                                {/if}
                            </div>
                            {#if hasFirstVisit}
                                <button class="grid-button general-button jump-to-first-visit" onclick={() => onJumpToFirstVisit(patientId)} title="Jump to first visit" aria-label="Jump to first visit">
                                    <IconArrowRightToLine size={14} />
                                </button>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        </div>
        
        <!-- Days columns -->
        <div class="days-container" style="--day-width: {dayWidth}px;">
            <!-- Month headers with navigation buttons -->
            <div class="month-headers-row with-nav">
                <div class="month-nav-buttons">
                    <button 
                        class="grid-button general-button" 
                        class:nav-disabled={!canNavigatePrevious}
                        onclick={onNavigatePrevious} 
                        disabled={!canNavigatePrevious} 
                        aria-label="Previous month"
                    >
                        <IconChevronCircleLeft size={20} />
                    </button>
                    <button 
                        class="grid-button general-button" 
                        class:nav-disabled={!canNavigateNext}
                        onclick={onNavigateNext} 
                        disabled={!canNavigateNext} 
                        aria-label="Next month"
                    >
                        <IconChevronCircleRight size={20} />
                    </button>
                </div>
                {#each monthGroups as group}
                    <div class="month-header" style="grid-column: {group.startIndex + 1} / {group.endIndex + 2}; background-color: {group.backgroundColor};">
                        {getMonthName(new Date(group.year, group.month, 1))} {group.year}
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
            
            <!-- Patient rows (scrollable) -->
            <div class="patient-rows-scroll-wrapper" bind:this={patientRowsScrollRef} onscroll={() => onPatientScroll?.('rows')}>
                {#each visiblePatientIds as patientId}
                    <div class="patient-row">
                    {#each visibleDays as day}
                        {@const date = getDateFromDay(day)}
                        {@const dayData = getPatientDayData(day, patientId)}
                        {@const renderingInfo = getDayRenderingInfo(day, patientId)}
                        {@const isUnavailable = isPatientUnavailable(day, patientId)}
                        {@const isDayZero = isPatientDayZero(day, patientId)}
                        {@const shouldShowUnavailable = isUnavailable && (viewMode === 'availability' || showAvailability)}
                        
                        {@const unavailableOnly = shouldShowUnavailable && !renderingInfo.event && (!renderingInfo.isWindow || !showWindows)}
                        <div 
                            class="timeline-cell clickable" 
                            class:weekend={isWeekend(date)}
                            class:today={isToday(day)}
                            class:day-zero={isDayZero}
                            class:unavailable={shouldShowUnavailable}
                            class:unavailable-only={unavailableOnly}
                            role="button"
                            tabindex="0"
                            onmousedown={(e) => { if (viewMode === 'availability') e.preventDefault(); }}
                            onclick={(e) => onPatientCellClick(e, day, patientId)}
                            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onPatientCellClick(e as unknown as MouseEvent, day, patientId); }}
                            onmouseenter={(e) => onPatientCellMouseEnter(e, day, patientId)}
                            onmousemove={onPatientCellMouseMove}
                            onmouseleave={onPatientCellMouseLeave}
                        >
                            {#if dayData && renderingInfo.isWindow && showWindows}
                                <!-- Window day with no events -->
                                <div class="event-indicator window">
                                    <IconWindow size={14} />
                                </div>
                            {:else if dayData && renderingInfo.event}
                                <!-- Event day -->
                                {@const event = renderingInfo.event}
                                {@const state = renderingInfo.state}
                                {@const isActual = renderingInfo.isActual}
                                {@const isUnscheduled = renderingInfo.isUnscheduledEvent}
                                {@const eventTypeClass = isActual ? 'actual' : (isUnscheduled ? 'unscheduled' : 'scheduled')}
                                <div class="event-indicator {eventTypeClass} {state}" class:day-zero-indicator={isDayZero}>
                                    {#if isActual}
                                        <!-- Actual/Completed event: check icon with stripe -->
                                        {#if state === "on-scheduled-date" || state === "in-window" || state === "out-of-window"}
                                            <IconCheck size={18} />
                                        {:else if state === "canceled-visit" || state === "missed-visit"}
                                            <IconX size={18} />
                                        {/if}
                                    {:else if isDayZero}
                                        <!-- Day 0 scheduled event: Calendar-1 icon -->
                                        <IconCalendar1 size={16} />
                                    {:else}
                                        <!-- Scheduled/Pending event: calendar icon without stripe -->
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
                {/each}
            </div>
        </div>
    </div>
</div>
