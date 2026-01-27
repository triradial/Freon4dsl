<script lang="ts">
    // Staff Timeline Section - Shared component for displaying staff availability timeline
    // Used by both PatientStaffTimelineChart and Facility2
    
    // @ts-ignore
    import { CircleChevronLeft as IconChevronCircleLeft, CircleChevronRight as IconChevronCircleRight, Plus as IconPlus, Pencil as IconPencil, Trash2 as IconTrash, RefreshCw as IconRefresh } from '@lucide/svelte';
    import TimelineCalendarHeader, { type MonthGroup } from './TimelineCalendarHeader.svelte';
    
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
        deletePopupStaffId = null,
        deletePopupRowIndex = -1,
        onConfirmDelete,
        onCancelDelete
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
        onDeleteStaff: (staffId: string) => void;
        onNavigatePrevious: () => void;
        onNavigateNext: () => void;
        canNavigatePrevious: boolean;
        canNavigateNext: boolean;
        hoveredStaffId?: string | null;
        staffLabelsScrollRef?: HTMLElement | null;
        staffRowsScrollRef?: HTMLElement | null;
        onStaffScroll?: (source: 'labels' | 'rows') => void;
        deletePopupStaffId?: string | null;
        deletePopupRowIndex?: number;
        onConfirmDelete?: (staffId: string) => void;
        onCancelDelete?: () => void;
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
</script>

<!-- Staff Section -->
<div class="timeline-section staff">
    <div class="timeline-grid">
        <!-- Left column: Staff label, nav buttons, staff labels -->
        <div class="left-column">
            <!-- Staff label (aligned with month row) -->
            <div class="section-label-row">
                <h3 class="section-title">Staff</h3>
                <button class="grid-button general-button" onclick={onAddStaff} title="Add Staff" aria-label="Add Staff">
                    <IconPlus size={16} />
                </button>
                <button class="grid-button general-button" onclick={onRefreshStaff} title="Refresh Staff" aria-label="Refresh Staff">
                    <IconRefresh size={16} />
                </button>
            </div>
            
            <!-- Navigation buttons (aligned with day row) -->
            <div class="nav-buttons-row">
                <button class="grid-button general-button" onclick={onNavigatePrevious} disabled={!canNavigatePrevious} aria-label="Previous page">
                    <IconChevronCircleLeft size={24} />
                </button>
                <button class="grid-button general-button" onclick={onNavigateNext} disabled={!canNavigateNext} aria-label="Next page">
                    <IconChevronCircleRight size={24} />
                </button>
            </div>
            
            <!-- Staff labels column (scrollable) -->
            <div class="staff-labels-scroll-wrapper" bind:this={staffLabelsScrollRef} onscroll={() => onStaffScroll?.('labels')}>
                <div class="staff-labels-column">
                    {#each visibleStaff as staffMember}
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div class="row-label-container" onmouseenter={() => { if (deletePopupStaffId !== staffMember.id) hoveredStaffId = staffMember.id; }} onmouseleave={() => { if (deletePopupStaffId !== staffMember.id) hoveredStaffId = null; }}>
                            <div class="row-left-content">
                                <span class="row-label-text">{staffMember.name}</span>
                                {#if hoveredStaffId === staffMember.id && deletePopupStaffId !== staffMember.id}
                                    <div class="row-actions">
                                        <button class="grid-button general-button" onclick={() => onEditStaff(staffMember.id)} title="Edit Staff" aria-label="Edit Staff">
                                            <IconPencil size={14} />
                                        </button>
                                        <button class="grid-button delete-button"  onclick={() => onDeleteStaff(staffMember.id)} title="Delete Staff" aria-label="Delete Staff">
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
            <!-- Calendar header (month + day headers) -->
            <TimelineCalendarHeader
                {visibleDays}
                {monthGroups}
                {getDateFromDay}
                {isWeekend}
                {isToday}
                {getMonthName}
                {getDayOfWeekAbbr}
                {getMonthForDay}
            />
            
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
        
        <!-- Delete confirmation popup overlay -->
        {#if deletePopupStaffId && deletePopupRowIndex !== undefined && deletePopupRowIndex >= 0}
            {@const staffMember = visibleStaff.find(s => s.id === deletePopupStaffId)}
            {@const scrollOffset = staffLabelsScrollRef?.scrollTop || 0}
            {@const rowTop = deletePopupRowIndex * 40 - scrollOffset}
            <div class="delete-popup-overlay" style="top: calc(5rem + {rowTop}px);">
                <div class="inline-delete-popup">
                    <span class="delete-popup-patient">{staffMember?.name || ''}</span>
                    <span class="delete-popup-separator">|</span>
                    <span class="delete-popup-text">Delete staff member?</span>
                    <button class="delete-popup-btn keep" onclick={() => onCancelDelete?.()}>No, keep</button>
                    <button class="delete-popup-btn delete" onclick={() => onConfirmDelete?.(deletePopupStaffId!)}>Yes, delete</button>
                </div>
            </div>
        {/if}
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
