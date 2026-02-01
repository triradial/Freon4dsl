<script lang="ts">
    // Staff Timeline Section - Shared component for displaying staff availability timeline
    // Used by both PatientStaffTimelineChart and Facility2
    
    // @ts-ignore
    import { CircleChevronLeft as IconChevronCircleLeft, CircleChevronRight as IconChevronCircleRight, Plus as IconPlus, Pencil as IconPencil, Trash2 as IconTrash, RefreshCw as IconRefresh } from '@lucide/svelte';
    import { type MonthGroup } from './TimelineCalendarHeader.svelte';
    
    export interface StaffMember {
        id: string;
        name: string;
        unavailableDates: Set<string>;
    }
    
    let { 
        visibleDays = [],
        visibleStaff = [],
        monthGroups = [],
        dayWidth = 40,
        getDateFromDay,
        isWeekend,
        isToday,
        getMonthName,
        getDayOfWeekAbbr,
        getMonthForDay,
        isStaffUnavailable,
        onStaffCellClick,
        onAddStaff,
        onRefreshStaff,
        onEditStaff,
        onDeleteStaff,
        onNavigatePrevious,
        onNavigateNext,
        canNavigatePrevious = false,
        canNavigateNext = false,
        hoveredStaffId = $bindable<string | null>(null),
        staffLabelsScrollRef = $bindable<HTMLElement | null>(null),
        staffRowsScrollRef = $bindable<HTMLElement | null>(null),
        onStaffScroll,
        quickFilter = $bindable(''),
        onQuickFilterChange
    } = $props<{
        visibleDays: number[];
        visibleStaff: StaffMember[];
        monthGroups: MonthGroup[];
        dayWidth: number;
        getDateFromDay: (day: number) => Date;
        isWeekend: (date: Date) => boolean;
        isToday: (day: number) => boolean;
        getMonthName: (date: Date) => string;
        getDayOfWeekAbbr: (date: Date) => string;
        getMonthForDay: (day: number) => { month: number; year: number };
        isStaffUnavailable: (day: number, staffId: string) => boolean;
        onStaffCellClick: (event: MouseEvent, day: number, staffId: string) => void;
        onAddStaff: () => void;
        onRefreshStaff: () => void;
        onEditStaff: (staffId: string) => void;
        onDeleteStaff: (staffId: string, triggerElement: HTMLElement) => void;
        onNavigatePrevious: () => void;
        onNavigateNext: () => void;
        canNavigatePrevious: boolean;
        canNavigateNext: boolean;
        hoveredStaffId?: string | null;
        staffLabelsScrollRef?: HTMLElement | null;
        staffRowsScrollRef?: HTMLElement | null;
        onStaffScroll?: (source: 'labels' | 'rows') => void;
        quickFilter?: string;
        onQuickFilterChange?: (value: string) => void;
    }>();

    // Tooltip state
    let tooltipVisible = $state(false);
    let tooltipPosition = $state({ x: 0, y: 0 });
    let tooltipContent = $state<{ date: string; staffName: string } | null>(null);
    let tooltipTimeout: ReturnType<typeof setTimeout> | null = null;

    // Format date for tooltip display: d-MMM-yyyy
    function formatTooltipDate(date: Date): string {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
    }

    // Handle mouse enter for tooltip
    function handleCellMouseEnter(e: MouseEvent, day: number, staffMember: StaffMember) {
        const date = getDateFromDay(day);
        
        tooltipContent = {
            date: formatTooltipDate(date),
            staffName: staffMember.name
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

    // Handle mouse leave for tooltip
    function handleCellMouseLeave() {
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = null;
        }
        tooltipVisible = false;
        tooltipContent = null;
    }

    // Handle cell click - hide tooltip and call parent handler
    function handleCellClick(e: MouseEvent, day: number, staffId: string) {
        handleCellMouseLeave();
        onStaffCellClick(e, day, staffId);
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

<!-- Staff Section -->
<div class="timeline-section staff">
    <div class="timeline-grid">
        <!-- Left column: Staff label, staff labels -->
        <div class="left-column">
            <!-- Staff label (aligned with month row) -->
            <div class="section-label-row">
                <h3 class="section-title">Staff</h3>
                <button class="grid-button general-button" onclick={onAddStaff} title="Add Staff" aria-label="Add Staff">
                    <IconPlus size={16} />
                </button>
                <button class="grid-button green-button" onclick={onRefreshStaff} title="Refresh Staff" aria-label="Refresh Staff">
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
            
            <!-- Staff labels column (scrollable) -->
            <div class="staff-labels-scroll-wrapper" bind:this={staffLabelsScrollRef} onscroll={() => onStaffScroll?.('labels')}>
                <div class="staff-labels-column">
                    {#each visibleStaff as staffMember}
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div class="row-label-container" onmouseenter={() => hoveredStaffId = staffMember.id} onmouseleave={() => hoveredStaffId = null}>
                            <div class="row-left-content">
                                <span class="row-label-text">{staffMember.name}</span>
                                {#if hoveredStaffId === staffMember.id}
                                    <div class="row-actions">
                                        <button class="grid-button general-button" onclick={() => onEditStaff(staffMember.id)} title="Edit Staff" aria-label="Edit Staff">
                                            <IconPencil size={14} />
                                        </button>
                                        <button class="grid-button delete-button" onclick={(e) => onDeleteStaff(staffMember.id, e.currentTarget as HTMLElement)} title="Delete Staff" aria-label="Delete Staff">
                                            <IconTrash size={14} />
                                        </button>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
        
        <!-- Days columns with calendar header -->
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
                    <div 
                        class="month-header" 
                        style="grid-column: {group.startIndex + 1} / {group.endIndex + 2}; background-color: {group.backgroundColor};"
                    >
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
            
            <!-- Staff rows (scrollable) -->
            <div class="staff-rows-scroll-wrapper" bind:this={staffRowsScrollRef} onscroll={() => onStaffScroll?.('rows')}>
                {#each visibleStaff as staffMember}
                    <div class="staff-row">
                        {#each visibleDays as day}
                            {@const date = getDateFromDay(day)}
                            {@const isUnavailable = isStaffUnavailable(day, staffMember.id)}
                            
                            <div 
                                class="timeline-cell staff-cell clickable" 
                                class:weekend={isWeekend(date)}
                                class:today={isToday(day)}
                                class:unavailable={isUnavailable}
                                class:unavailable-only={isUnavailable}
                                role="button"
                                tabindex="0"
                                onclick={(e) => handleCellClick(e, day, staffMember.id)}
                                onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCellClick(e as unknown as MouseEvent, day, staffMember.id); }}
                                onmouseenter={(e) => handleCellMouseEnter(e, day, staffMember)}
                                onmouseleave={handleCellMouseLeave}
                            >
                                {#if isUnavailable}
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

<!-- Tooltip -->
{#if tooltipVisible && tooltipContent}
    <div class="day-tooltip below" style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px;">
        <div class="tooltip-content">
            <div class="tooltip-header">
                <span class="tooltip-date">{tooltipContent.date}</span>
            </div>
            <div class="tooltip-text">{tooltipContent.staffName}</div>
        </div>
    </div>
{/if}
