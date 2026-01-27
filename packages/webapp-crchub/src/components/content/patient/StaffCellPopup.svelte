<script lang="ts">
    // Staff Cell Popup - Popup for toggling staff availability
    // Uses same styling as DayCellPopup for consistency
    
    import { createEventDispatcher } from 'svelte';
    // @ts-ignore
    import { X as IconX } from '@lucide/svelte';
    
    let {
        open = false,
        date = new Date(),
        staffId = '',
        staffName = '',
        isUnavailable = false,
        anchorElement = null
    } = $props<{
        open: boolean;
        date: Date;
        staffId: string;
        staffName: string;
        isUnavailable: boolean;
        anchorElement: HTMLElement | null;
    }>();
    
    const dispatch = createEventDispatcher<{
        close: void;
        availabilityChange: { staffId: string; available: boolean };
    }>();
    
    // Local state
    let staffAvailable = $state(true);
    
    // Popup position and reference
    let popupRef = $state<HTMLElement | null>(null);
    let popupStyle = $state('');
    let justOpened = $state(false);
    
    // Format date for display (same format as DayCellPopup)
    function formatDate(d: Date): string {
        const day = d.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    }
    
    // Initialize availability state when popup opens
    $effect(() => {
        if (open) {
            staffAvailable = !isUnavailable;
            justOpened = true;
            // Reset justOpened after a short delay
            setTimeout(() => {
                justOpened = false;
            }, 100);
        }
    });
    
    // Calculate position when popup opens or anchor changes (same logic as DayCellPopup)
    $effect(() => {
        if (open && anchorElement && popupRef) {
            const anchorRect = anchorElement.getBoundingClientRect();
            const popupRect = popupRef.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Position below the anchor by default
            let top = anchorRect.bottom + 4;
            let left = anchorRect.left;
            
            // Check if popup would go off the bottom
            if (top + popupRect.height > viewportHeight - 20) {
                // Position above the anchor instead
                top = anchorRect.top - popupRect.height - 4;
            }
            
            // Check if popup would go off the right
            if (left + popupRect.width > viewportWidth - 20) {
                left = viewportWidth - popupRect.width - 20;
            }
            
            // Check if popup would go off the left
            if (left < 20) {
                left = 20;
            }
            
            popupStyle = `top: ${top}px; left: ${left}px;`;
        }
    });
    
    // Toggle availability - applies immediately
    function toggleAvailability() {
        staffAvailable = !staffAvailable;
        dispatch("availabilityChange", { staffId, available: staffAvailable });
    }
    
    // Handle close
    function handleClose() {
        dispatch("close");
    }
    
    // Handle click outside to close
    function handleWindowClick(event: MouseEvent) {
        if (open && !justOpened && popupRef && !popupRef.contains(event.target as Node)) {
            handleClose();
        }
    }
    
    // Handle escape key to close
    function handleKeydown(event: KeyboardEvent) {
        if (open && event.key === 'Escape') {
            handleClose();
        }
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
            <!-- Header with staff name, date, and close button (same layout as DayCellPopup) -->
            <header class="popup-header">
                <div class="popup-header-info">
                    <span class="popup-patient-id">{staffName}</span>
                    <span class="popup-date">{formatDate(date)}</span>
                </div>
                <button 
                    type="button" 
                    class="popup-close-btn"
                    onclick={handleClose}
                    aria-label="Close popup"
                >
                    <IconX size={16} />
                </button>
            </header>
            
            <!-- Available/Unavailable toggle button -->
            <div class="popup-availability-row">
                <button 
                    type="button"
                    class="availability-btn"
                    class:unavailable={!staffAvailable}
                    onclick={toggleAvailability}
                >
                    {staffAvailable ? 'Available' : 'Unavailable'}
                </button>
            </div>
        </div>
    </div>
{/if}
