<script lang="ts">
	import { browser } from '$app/environment';
	import { navigateTo } from '../../../services/routing/route-action.js';
	import Copy from '@lucide/svelte/icons/copy';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	interface Props {
		params: any; // AG Grid cell renderer params
		onEdit?: (studyData: any) => void;
		onCopy?: (studyData: any) => void;
		onDelete?: (studyData: any, triggerElement: HTMLElement) => void; // Pass trigger element for popover positioning
	}

	let { params, onEdit, onCopy, onDelete }: Props = $props();

	let studyData = $derived(params.data);
	let showActions = $state(false);
	
	// Hide delete button if study has patients
	// Check patientCount (camelCase field from data-store transformation)
	let canDelete = $derived(!studyData?.patientCount || studyData.patientCount === 0);

	function handleOpenStudy(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();
		if (browser && studyData?.id) {
			navigateTo("study", studyData.id);
		}
	}

	function handleEdit(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();
		if (studyData && onEdit) {
			onEdit(studyData);
		}
	}

	function handleCopy(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();
		if (studyData && onCopy) {
			onCopy(studyData);
		}
	}

	function handleDeleteClick(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();
		if (studyData && onDelete) {
			const triggerElement = event.currentTarget as HTMLElement;
			onDelete(studyData, triggerElement);
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="study-name-cell-container"
	onmouseenter={() => showActions = true}
	onmouseleave={() => showActions = false}
>
	<div class="study-name-content">
		<button type="button" class="name-link" onclick={handleOpenStudy}>{studyData?.name || ''}</button>
		{#if showActions && studyData?.id}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="grid-actions" onclick={(e) => { e.stopPropagation(); e.stopImmediatePropagation(); }}>
				<button type="button" class="grid-button general-button" onclick={handleEdit} title="Edit Study" aria-label="Edit Study">
					<Pencil size={16} />
				</button>
				<button type="button" class="grid-button general-button" onclick={handleCopy} title="Copy Study" aria-label="Copy Study">
					<Copy size={16} />
				</button>
				{#if canDelete}
					<button type="button" class="grid-button delete-button" onclick={handleDeleteClick} title="Delete Study" aria-label="Delete Study">
						<Trash2 size={16} />
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>
