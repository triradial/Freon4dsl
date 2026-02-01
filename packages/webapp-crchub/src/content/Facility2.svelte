<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { mount, unmount } from "svelte";
    import { browser } from '$app/environment';
    import { get } from "svelte/store";
    import dayjs from "dayjs";
    import FacilityCard from "../components/cards/FacilityCard.svelte";
    import StaffTimelineSection, { type StaffMember } from "../components/content/facility/StaffTimelineSection.svelte";
    import type { MonthGroup } from "../components/content/patient/TimelineCalendarHeader.svelte";
    import { dataStore } from "../services/data/data-store.js";
    import { addObject, editObject } from "../services/stores/object-drawer-store.js";

    // Splitter state
    let isDraggingSplitter = $state(false);
    let splitterContainer: HTMLDivElement | undefined = $state();
    let splitterHandle: HTMLButtonElement | undefined = $state();
    
    // Panel widths in rem
    const FACILITY_CARD_MIN_WIDTH = 12;
    const FACILITY_CARD_MAX_WIDTH = 25;
    const FACILITY_CARD_DEFAULT_WIDTH = 18;
    const SPLITTER_STORAGE_KEY = 'facility-card-width';
    
    let facilityCardWidth = $state(FACILITY_CARD_DEFAULT_WIDTH);

    // Timeline container ref for calculating visible days
    let containerRef: HTMLDivElement | undefined = $state();

    // Organization data
    let organizationId = $state<string | null>(null);
    let organizationStartDate = $state<string | null>(null);
    let organizationEndDate = $state<string | null>(null);
    let isLoading = $state(true);

    // Staff data
    let staffMembers = $state<StaffMember[]>([]);
    let staffAvailabilityOverrides = $state<Map<string, boolean>>(new Map()); // key: staffId-dateStr, value: true=available, false=unavailable
    let hoveredStaffId = $state<string | null>(null);
    let staffLabelsScrollRef = $state<HTMLElement | null>(null);
    let staffRowsScrollRef = $state<HTMLElement | null>(null);
    // Delete confirmation popover state
    let deleteConfirmInstance: any = null;
    let deleteConfirmContainer: HTMLDivElement | null = null;
    let deleteConfirmTriggerElement: HTMLElement | null = null;
    let deleteConfirmStaffId: string | null = null;
    
    // Quick filter for staff
    let staffQuickFilter = $state('');

    // Timeline date range
    let referenceDate = $state<Date>(new Date());
    let dateRangeStart = $state(0);
    let dateRangeEnd = $state(0);
    let visibleStartDay = $state(0);
    let visibleEndDay = $state(0);

    // Zoom control
    const ZOOM_LEVELS = [20, 40, 60, 80];
    let zoomLevel = $state(1); // Default to 40px width
    let dayWidth = $derived(ZOOM_LEVELS[zoomLevel]);

    // Load splitter setting from localStorage
    function loadSplitterSetting() {
        if (!browser) return;
        try {
            const saved = localStorage.getItem(SPLITTER_STORAGE_KEY);
            if (saved) {
                const parsed = parseFloat(saved);
                if (!isNaN(parsed) && parsed >= FACILITY_CARD_MIN_WIDTH && parsed <= FACILITY_CARD_MAX_WIDTH) {
                    facilityCardWidth = parsed;
                }
            }
        } catch (e) {
            console.warn('[Facility2] Failed to load splitter setting:', e);
        }
    }
    
    // Save splitter setting to localStorage
    function saveSplitterSetting() {
        if (!browser) return;
        try {
            localStorage.setItem(SPLITTER_STORAGE_KEY, facilityCardWidth.toString());
        } catch (e) {
            console.warn('[Facility2] Failed to save splitter setting:', e);
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
        
        const constrainedWidth = Math.max(FACILITY_CARD_MIN_WIDTH, Math.min(FACILITY_CARD_MAX_WIDTH, newWidth));
        facilityCardWidth = constrainedWidth;
    }

    function handleSplitterMouseUp() {
        if (!browser) return;
        isDraggingSplitter = false;
        document.removeEventListener('mousemove', handleSplitterMouseMove);
        document.removeEventListener('mouseup', handleSplitterMouseUp);
        saveSplitterSetting();
    }

    // Date/time helper functions
    function formatDateString(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getCalendarDayDiff(date: Date, refDate: Date): number {
        const refDayjs = dayjs(refDate).startOf('day');
        const dateDayjs = dayjs(date).startOf('day');
        return dateDayjs.diff(refDayjs, 'day');
    }

    function getDateFromDay(day: number): Date {
        return dayjs(referenceDate).add(day, 'day').toDate();
    }

    function isWeekend(date: Date): boolean {
        const day = date.getDay();
        return day === 0 || day === 6;
    }

    function isToday(day: number): boolean {
        const todayDay = getCalendarDayDiff(new Date(), referenceDate);
        return day === todayDay;
    }

    function getMonthAbbr(date: Date): string {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months[date.getMonth()];
    }

    function getDayOfWeekAbbr(date: Date): string {
        const days = ["S", "M", "T", "W", "T", "F", "S"];
        return days[date.getDay()];
    }

    function getMonthForDay(day: number): { month: number; year: number } {
        const date = getDateFromDay(day);
        return { month: date.getMonth(), year: date.getFullYear() };
    }

    function calculateVisibleDays(): number {
        if (!containerRef) return 31;
        // Account for left column width (approx 200px) and some padding
        const availableWidth = containerRef.clientWidth - 200 - 20;
        return Math.max(7, Math.floor(availableWidth / dayWidth));
    }

    function getMonthStartDay(day: number): number {
        const date = getDateFromDay(day);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        return getCalendarDayDiff(monthStart, referenceDate);
    }

    function getPreviousMonthStartDay(currentMonthStart: number): number {
        const currentDate = getDateFromDay(currentMonthStart);
        const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        return getCalendarDayDiff(prevMonth, referenceDate);
    }

    function getNextMonthStartDay(currentMonthStart: number): number {
        const currentDate = getDateFromDay(currentMonthStart);
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        return getCalendarDayDiff(nextMonth, referenceDate);
    }

    // Check if staff member is unavailable on a given day
    function isStaffUnavailable(day: number, staffId: string): boolean {
        const dateStr = formatDateString(getDateFromDay(day));
        const key = `${staffId}-${dateStr}`;
        
        // Check overrides first
        if (staffAvailabilityOverrides.has(key)) {
            return !staffAvailabilityOverrides.get(key);
        }
        
        // Check the staff member's unavailable dates
        const staffMember = staffMembers.find(s => s.id === staffId);
        if (!staffMember) return false;
        
        return staffMember.unavailableDates.has(dateStr);
    }

    // Load organization and staff data
    async function loadData() {
        console.log('[Facility2] Loading data...');
        isLoading = true;
        
        try {
            // Get the user's organization
            const organization = await dataStore.getUserOrganization();
            console.log('[Facility2] Organization loaded:', organization);
            
            if (organization && organization.id) {
                organizationId = organization.id;
                
                // Get organization start/end dates
                if (organization.startDate) {
                    organizationStartDate = typeof organization.startDate === 'string' ? organization.startDate.split('T')[0] : null;
                } else {
                    organizationStartDate = null;
                }
                
                if (organization.endDate) {
                    organizationEndDate = typeof organization.endDate === 'string' ? organization.endDate.split('T')[0] : null;
                } else {
                    organizationEndDate = null;
                }
                
                console.log('[Facility2] Organization date range:', organizationStartDate, 'to', organizationEndDate);
                
                // Set reference date (first of the month of org start, or today)
                if (organizationStartDate) {
                    const orgStart = new Date(organizationStartDate + 'T00:00:00');
                    referenceDate = new Date(orgStart.getFullYear(), orgStart.getMonth(), 1);
                } else {
                    const today = new Date();
                    referenceDate = new Date(today.getFullYear(), today.getMonth(), 1);
                }
                
                // Calculate date range
                const today = new Date();
                const startDate = organizationStartDate ? new Date(organizationStartDate + 'T00:00:00') : new Date(today.getFullYear(), today.getMonth(), 1);
                const endDate = organizationEndDate ? new Date(organizationEndDate + 'T00:00:00') : new Date(today.getFullYear(), today.getMonth() + 6, 0);
                
                // Extend to month boundaries
                const firstMonthStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                const lastMonthEnd = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
                
                dateRangeStart = getCalendarDayDiff(firstMonthStart, referenceDate);
                dateRangeEnd = getCalendarDayDiff(lastMonthEnd, referenceDate);
                
                // Set initial visible window
                const daysThatFit = calculateVisibleDays();
                visibleStartDay = dateRangeStart;
                visibleEndDay = Math.min(visibleStartDay + daysThatFit - 1, dateRangeEnd);
                
                console.log('[Facility2] Date range:', {
                    dateRangeStart,
                    dateRangeEnd,
                    visibleStartDay,
                    visibleEndDay
                });
                
                // Load staff
                await loadStaffData();
            } else {
                console.error('[Facility2] No organization found for user');
            }
        } catch (error) {
            console.error('[Facility2] Error loading data:', error);
        } finally {
            isLoading = false;
        }
    }

    async function loadStaffData() {
        if (!organizationId) return;
        
        try {
            // Load all persons
            await dataStore.getPersons();
            const allPersons = get(dataStore).persons;
            console.log('[Facility2] Total persons loaded:', allPersons.length);
            
            // Filter persons who belong to this organization
            const loadedStaffMembers: StaffMember[] = [];
            
            for (const person of allPersons) {
                const belongsToOrg = person.organizations?.some((org: any) => org.org_id === organizationId);
                
                if (belongsToOrg) {
                    // Load unavailable dates for this person
                    const unavailableDatesStrings = await dataStore.getPersonUnavailableDates(person.id, organizationId);
                    
                    loadedStaffMembers.push({
                        id: person.id,
                        name: person.name,
                        unavailableDates: new Set(unavailableDatesStrings)
                    });
                }
            }
            
            staffMembers = loadedStaffMembers;
            console.log('[Facility2] Loaded staff members:', staffMembers.map(s => s.name));
        } catch (err) {
            console.error('[Facility2] Error loading staff data:', err);
        }
    }

    // Visible days array
    let visibleDays = $derived.by(() => {
        const days: number[] = [];
        for (let day = visibleStartDay; day <= visibleEndDay && day <= dateRangeEnd; day++) {
            days.push(day);
        }
        return days;
    });

    // Month groups for background coloring
    let monthGroups = $derived.by(() => {
        const groups: MonthGroup[] = [];
        let currentMonth: { month: number; year: number } | null = null;
        let startIndex = 0;

        for (let i = 0; i < visibleDays.length; i++) {
            const day = visibleDays[i];
            const monthInfo = getMonthForDay(day);
            
            if (!currentMonth || currentMonth.month !== monthInfo.month || currentMonth.year !== monthInfo.year) {
                if (currentMonth !== null) {
                    groups.push({
                        ...currentMonth,
                        startIndex,
                        endIndex: i - 1,
                        backgroundColor: groups.length % 2 === 0 ? 'var(--month-bg-even)' : 'var(--month-bg-odd)'
                    });
                }
                currentMonth = monthInfo;
                startIndex = i;
            }
        }

        // Add the last group
        if (currentMonth !== null && visibleDays.length > 0) {
            groups.push({
                ...currentMonth,
                startIndex,
                endIndex: visibleDays.length - 1,
                backgroundColor: groups.length % 2 === 0 ? 'var(--month-bg-even)' : 'var(--month-bg-odd)'
            });
        }

        return groups;
    });

    // Visible staff (filtered and paginated)
    const STAFF_MEMBERS_PER_PAGE = 10;
    let staffScrollOffset = $state(0);
    
    // Get filtered staff (filtered by quick filter)
    let filteredStaffMembers = $derived.by(() => {
        if (!staffQuickFilter.trim()) {
            return staffMembers;
        }
        
        const filter = staffQuickFilter.toLowerCase().trim();
        return staffMembers.filter(staff => 
            staff.name.toLowerCase().includes(filter)
        );
    });
    
    let visibleStaff = $derived.by(() => {
        const start = staffScrollOffset;
        const end = Math.min(start + STAFF_MEMBERS_PER_PAGE, filteredStaffMembers.length);
        return filteredStaffMembers.slice(start, end);
    });

    // Navigation
    function navigatePrevious() {
        const currentMonthStart = getMonthStartDay(visibleStartDay);
        const prevMonthStart = getPreviousMonthStartDay(currentMonthStart);
        
        if (prevMonthStart >= dateRangeStart) {
            const daysThatFit = calculateVisibleDays();
            visibleStartDay = prevMonthStart;
            visibleEndDay = Math.min(prevMonthStart + daysThatFit - 1, dateRangeEnd);
        }
    }

    function navigateNext() {
        const currentMonthStart = getMonthStartDay(visibleStartDay);
        const nextMonthStart = getNextMonthStartDay(currentMonthStart);
        
        if (nextMonthStart <= dateRangeEnd) {
            const daysThatFit = calculateVisibleDays();
            visibleStartDay = nextMonthStart;
            visibleEndDay = Math.min(nextMonthStart + daysThatFit - 1, dateRangeEnd);
        }
    }

    let canNavigatePrevious = $derived(visibleStartDay > dateRangeStart);
    let canNavigateNext = $derived(visibleEndDay < dateRangeEnd);

    // Staff cell click handler - toggle availability
    async function handleStaffCellClick(event: MouseEvent, day: number, staffId: string) {
        event.stopPropagation();
        
        const date = getDateFromDay(day);
        const staffMember = staffMembers.find(s => s.id === staffId);
        if (!staffMember) return;
        
        const dateStr = formatDateString(date);
        const key = `${staffId}-${dateStr}`;
        
        // Determine current state and toggle
        const currentlyUnavailable = isStaffUnavailable(day, staffId);
        const available = currentlyUnavailable; // Toggle: if unavailable, make available
        
        console.log(`[Facility2] Toggling staff ${staffMember.name} on ${dateStr}: ${currentlyUnavailable ? 'unavailable -> available' : 'available -> unavailable'}`);
        
        // Update override
        const newOverrides = new Map(staffAvailabilityOverrides);
        newOverrides.set(key, available);
        staffAvailabilityOverrides = newOverrides;
        
        // Update staff member's unavailable dates
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
        
        // Save to database
        if (organizationId) {
            const staff = staffMembers.find(s => s.id === staffId);
            if (staff) {
                const unavailableDates = Array.from(staff.unavailableDates).sort();
                await dataStore.setPersonUnavailableDates(staffId, organizationId, unavailableDates);
            }
        }
    }

    // Staff CRUD handlers
    function handleAddStaff() {
        addObject("person");
    }
    
    async function handleRefreshStaff() {
        console.log('[Facility2] Refreshing staff data');
        await loadStaffData();
    }
    
    // Quick filter handler for staff
    function handleStaffQuickFilterChange(value: string) {
        staffQuickFilter = value;
    }
    
    function handleEditStaff(staffId: string) {
        const storeState = get(dataStore);
        const personData = storeState.persons?.find((p: any) => p.id === staffId);
        if (personData) {
            editObject("person", personData);
        }
    }
    
    async function handleDeleteStaff(staffId: string, triggerElement: HTMLElement) {
        // Close any existing delete confirm popover
        handleDeleteConfirmCancel();
        
        // Store staff info
        deleteConfirmStaffId = staffId;
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
    
    function handleDeleteConfirmCancel() {
        if (deleteConfirmInstance) {
            try {
                unmount(deleteConfirmInstance);
            } catch (e) {
                console.warn('[Facility2] Error unmounting delete confirm popover:', e);
            }
            deleteConfirmInstance = null;
        }
        if (deleteConfirmContainer && deleteConfirmContainer.parentNode) {
            deleteConfirmContainer.parentNode.removeChild(deleteConfirmContainer);
            deleteConfirmContainer = null;
        }
        deleteConfirmStaffId = null;
        deleteConfirmTriggerElement = null;
    }
    
    async function handleDeleteConfirmConfirm() {
        if (!deleteConfirmStaffId) {
            handleDeleteConfirmCancel();
            return;
        }
        
        const staffId = deleteConfirmStaffId;
        handleDeleteConfirmCancel();
        
        try {
            await dataStore.deletePerson(staffId);
            staffMembers = staffMembers.filter(s => s.id !== staffId);
        } catch (error) {
            console.error('[Facility2] Error deleting staff:', error);
        }
    }

    // Sync scroll between labels and rows
    function syncStaffScroll(source: 'labels' | 'rows') {
        if (source === 'labels' && staffLabelsScrollRef && staffRowsScrollRef) {
            staffRowsScrollRef.scrollTop = staffLabelsScrollRef.scrollTop;
        } else if (source === 'rows' && staffRowsScrollRef && staffLabelsScrollRef) {
            staffLabelsScrollRef.scrollTop = staffRowsScrollRef.scrollTop;
        }
    }

    // Update visible window when container size changes
    $effect(() => {
        if (containerRef && dateRangeStart !== dateRangeEnd && dateRangeStart >= 0 && dateRangeEnd > dateRangeStart) {
            const daysThatFit = calculateVisibleDays();
            visibleEndDay = Math.min(visibleStartDay + daysThatFit - 1, dateRangeEnd);
        }
    });

    onMount(() => {
        loadSplitterSetting();
        loadData();
    });

    onDestroy(() => {
        // Cleanup
    });
</script>

<div class="crc-container" style="height: calc(100vh - 5.75rem);">
    <div bind:this={splitterContainer} class="splitter-container" class:dragging={isDraggingSplitter} style="height: 100%;">
        <!-- Left Panel: Facility Card -->
        <div class="splitter-panel" style="width: {facilityCardWidth}rem; flex-shrink: 0;">
            <FacilityCard />
        </div>
        
        <!-- Splitter - used as drag handle for resizing panels -->
        <!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
        <button type="button"
            bind:this={splitterHandle}
            class="splitter-handle"
            onmousedown={handleSplitterMouseDown}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize facility card panel"
        ></button>
        
        <!-- Right Panel: Staff Timeline -->
        <div class="splitter-panel" bind:this={containerRef} style="flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden;">
            {#if isLoading}
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p>Loading staff information...</p>
                </div>
            {:else}
                <div class="timeline-chart staff-timeline-container">
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
                        canNavigatePrevious={canNavigatePrevious}
                        canNavigateNext={canNavigateNext}
                        bind:quickFilter={staffQuickFilter}
                        onQuickFilterChange={handleStaffQuickFilterChange}
                        bind:hoveredStaffId
                        bind:staffLabelsScrollRef
                        bind:staffRowsScrollRef
                        onStaffScroll={syncStaffScroll}
                    />
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .splitter-panel {
        height: 100%;
    }
    
    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        gap: 1rem;
    }
    
    .staff-timeline-container {
        height: 100%;
        overflow: hidden;
        padding: 0.5rem 0 0 0;
    }
</style>
