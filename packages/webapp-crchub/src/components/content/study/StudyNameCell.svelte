<script lang="ts">
	import { browser } from '$app/environment';
	import { navigateTo } from '../../../services/routing/route-action.js';
	import { Pencil, Trash2, Palette as IconPalette, Users as IconUsers } from '@lucide/svelte';

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

	function handleStudyDesign(event: MouseEvent) {
		event.stopPropagation();
		if (browser && studyData?.id) {
			navigateTo("study-design", studyData.id);
		}
	}

	function handleStudyPatients(event: MouseEvent) {
		event.stopPropagation();
		if (browser && studyData?.id) {
			navigateTo("study-patients", studyData.id);
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
		<span>{studyData?.name || ''}</span>
		{#if showActions && studyData?.id}
			<div class="grid-actions">
				<button type="button" class="grid-button general-button" onclick={handleEdit} title="Edit Study" aria-label="Edit Study">
					<Pencil size={16} />
				</button>
				<button type="button" class="grid-button general-button" onclick={handleStudyDesign} title="Study Design" aria-label="Study Design">
					<IconPalette size={16} />
				</button>
				<button type="button" class="grid-button general-button" onclick={handleStudyPatients} title="Study Patients" aria-label="Study Patients">
					<IconUsers size={16} />
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

