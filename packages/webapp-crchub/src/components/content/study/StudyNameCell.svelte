<script lang="ts">
	import { browser } from '$app/environment';
	import { navigateTo } from '../../../services/routing/route-action.js';
	import { Pencil, Trash2 } from '@lucide/svelte';

	interface Props {
		params: any; // AG Grid cell renderer params
		onEdit?: (studyData: any) => void;
		onDelete?: (studyData: any) => void;
	}

	let { params, onEdit, onDelete }: Props = $props();

	let studyData = $derived(params.data);
	let showActions = $state(false);
	
	// Hide delete button if study has patients
	// Check patientCount (camelCase field from data-store transformation)
	let canDelete = $derived(!studyData?.patientCount || studyData.patientCount === 0);

	function handleLinkClick(event: MouseEvent) {
		event.preventDefault();
		if (browser && studyData?.id) {
			navigateTo("study", studyData.id);
		}
	}

	function handleEdit(event: MouseEvent) {
		event.stopPropagation();
		if (studyData && onEdit) {
			onEdit(studyData);
		}
	}

	function handleDelete(event: MouseEvent) {
		event.stopPropagation();
		if (studyData && onDelete) {
			onDelete(studyData);
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="study-name-cell-container"
	onmouseenter={() => (showActions = true)}
	onmouseleave={() => (showActions = false)}
>
	<div class="study-name-content">
		<button type="button" class="name-link" data-study-id={studyData?.id} onclick={handleLinkClick}>
			{studyData?.name || ''}
		</button>
		{#if showActions && studyData?.id}
			<div class="grid-actions">
				<button type="button" class="grid-button general-button" onclick={handleEdit} title="Edit Study" aria-label="Edit Study">
					<Pencil size={16} />
				</button>
				{#if canDelete}
					<button type="button" class="grid-button delete-button" onclick={handleDelete} title="Delete Study" aria-label="Delete Study">
						<Trash2 size={16} />
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>

