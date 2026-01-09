<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { navigateTo } from '../../../services/routing/route-action.js';
	import { Pencil, Trash2 } from '@lucide/svelte';

	interface Props {
		params: any; // AG Grid cell renderer params
		studyId?: string; // Study ID from grid context
		onEdit?: (patientData: any) => void;
		onDelete?: (patientData: any) => void;
	}

	let { params, studyId: gridStudyId, onEdit, onDelete }: Props = $props();

	let patientData = $derived(params.data);
	let showActions = $state(false);

	function handleLinkClick(event: MouseEvent) {
		event.preventDefault();
		if (browser && patientData?.id) {
			// Use studyId from grid context (the study being viewed), fallback to patient data
			const studyId = gridStudyId || patientData?.studyId;
			const url = studyId 
				? `/patient?id=${patientData.id}&studyId=${studyId}`
				: `/patient?id=${patientData.id}`;
			goto(url);
		}
	}

	function handleEdit(event: MouseEvent) {
		event.stopPropagation();
		if (patientData && onEdit) {
			onEdit(patientData);
		}
	}

	function handleDelete(event: MouseEvent) {
		event.stopPropagation();
		if (patientData && onDelete) {
			onDelete(patientData);
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
		<button type="button" class="name-link" data-patient-id={patientData?.id} onclick={handleLinkClick}>
			{patientData?.patientNumber || ''}
		</button>
		{#if showActions && patientData?.id}
			<div class="grid-actions">
				<button type="button" class="grid-button general-button" onclick={handleEdit} title="Edit Patient" aria-label="Edit Patient">
					<Pencil size={16} />
				</button>
				<button type="button" class="grid-button delete-button" onclick={handleDelete} title="Delete Patient" aria-label="Delete Patient">
					<Trash2 size={16} />
				</button>
			</div>
		{/if}
	</div>
</div>

