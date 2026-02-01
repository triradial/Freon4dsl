<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	interface Props {
		open: boolean;
		triggerElement: HTMLElement | null;
		itemName: string;
		itemType?: string; // e.g., 'study', 'patient', 'case', etc.
		onClose: () => void;
		onConfirm: () => void;
	}

	let { 
		open = $bindable(),
		triggerElement,
		itemName,
		itemType = 'item',
		onClose,
		onConfirm
	}: Props = $props();

	let popoverContainer: HTMLDivElement | undefined = $state();
	let position = $state({ top: 0, left: 0 });
	let arrowOnLeft = $state(true); // true when popup is to the right of button, false when on left

	function updatePosition() {
		if (!triggerElement) {
			return;
		}
		
		const rect = triggerElement.getBoundingClientRect();
		
		if (rect.width === 0 && rect.height === 0) {
			return;
		}
		
		// Position to the right of the trigger element, vertically aligned
		// Use fixed positioning relative to viewport
		const newPosition = {
			top: rect.top + (rect.height / 2) - 20, // Approximate vertical center offset
			left: rect.right + 8
		};
		
		// Only update if position actually changed to avoid infinite loops
		if (position.top !== newPosition.top || position.left !== newPosition.left) {
			position = newPosition;
		}
	}

	// Update position when opened - only run once when open/triggerElement changes
	let positionUpdateCleanup: (() => void) | null = null;
	let positionInitialized = false;
	$effect(() => {
		if (!open || !triggerElement) {
			if (positionUpdateCleanup) {
				positionUpdateCleanup();
				positionUpdateCleanup = null;
			}
			positionInitialized = false;
			return;
		}
		
		// Only initialize position once
		if (!positionInitialized) {
			positionInitialized = true;
			
			// Initial position update
			requestAnimationFrame(() => {
				updatePosition();
			});
			
			// Set up scroll/resize listeners
			if (browser) {
				const updateOnScroll = () => {
					updatePosition();
				};
				window.addEventListener('scroll', updateOnScroll, true);
				window.addEventListener('resize', updateOnScroll);
				
				positionUpdateCleanup = () => {
					window.removeEventListener('scroll', updateOnScroll, true);
					window.removeEventListener('resize', updateOnScroll);
				};
			}
		}
		
		return () => {
			if (positionUpdateCleanup) {
				positionUpdateCleanup();
				positionUpdateCleanup = null;
			}
			positionInitialized = false;
		};
	});

	function handleConfirm() {
		onConfirm();
	}

	function handleCancel() {
		onClose();
	}

	// Handle clicks outside to close
	function handleClickOutside(event: MouseEvent) {
		if (popoverContainer && !popoverContainer.contains(event.target as Node) && 
		    triggerElement && !triggerElement.contains(event.target as Node)) {
			handleCancel();
		}
	}

	// Handle escape key
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleCancel();
		}
	}

	onMount(() => {
		if (browser) {
			document.addEventListener('mousedown', handleClickOutside);
			document.addEventListener('keydown', handleKeyDown);
		}
		return () => {
			if (browser) {
				document.removeEventListener('mousedown', handleClickOutside);
				document.removeEventListener('keydown', handleKeyDown);
			}
		};
	});
</script>

{#if open && triggerElement}
	<div 
		bind:this={popoverContainer}
		class="delete-confirm-popover-wrapper"
		style="position: fixed; top: {position.top}px; left: {position.left}px; z-index: 10001; pointer-events: auto; display: block;"
	>
		<div class="delete-confirm-popover-content">
			<!-- Arrow -->
			<div class="delete-confirm-arrow" class:arrow-right={!arrowOnLeft}></div>
			
			<!-- Content -->
			<div class="delete-confirm-options">
				<span class="delete-confirm-label">Delete {itemType}?</span>
				<div class="delete-confirm-buttons-list">
					<button
						type="button"
						class="delete-confirm-button delete-cancel-button"
						onclick={handleCancel}
					>
						No, keep
					</button>
					<button
						type="button"
						class="delete-confirm-button delete-confirm-action-button"
						onclick={handleConfirm}
					>
						Yes, delete
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
