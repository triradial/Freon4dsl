<script lang="ts">
    import { createEventDispatcher } from 'svelte';
	import type { FreError } from "@freon4dsl/core";
	import { EditorState } from "@freon4dsl/webapp-lib";
    import { onMount } from 'svelte';
    import { WebappConfigurator } from '@freon4dsl/webapp-lib';
	import { Button, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSquareUpRight } from '@fortawesome/free-solid-svg-icons';

    const dispatch = createEventDispatcher();
    let modelErrors: FreError[] = [];

    onMount(() => {
        EditorState.getInstance().getErrors();
        modelErrors = WebappConfigurator.getInstance().editorEnvironment.editor.getErrors();
		console.log("DSLErrorsDrawer errors", modelErrors.length);
	});

    function closeDrawer() {
        dispatch('close');
    }

    export function refresh() {
		EditorState.getInstance().getErrors();
        modelErrors = WebappConfigurator.getInstance().editorEnvironment.editor.getErrors();
        dispatch("refresh");
        console.log("refresh errors");
    }

	let selected: number = 0;
	$: handleClick(selected);

	const handleClick = (index: number) => {
		if (!!modelErrors && modelErrors.length > 0) {
			const item: FreError = modelErrors[index];
			// TODO declaredType should be changed to property coming from error object.
			if (Array.isArray(item.reportedOn)) {
				EditorState.getInstance().selectElement(item.reportedOn[0], item.propertyName);
			} else {
				EditorState.getInstance().selectElement(item.reportedOn, item.propertyName);
			}
		}
	}
</script>

<div class="drawer-content-area">
	<Table striped={true} class="error-drawer">
		<TableHead class="error-drawer-row">
		  <TableHeadCell class="error-drawer-head">Message</TableHeadCell>
		  <TableHeadCell class="error-drawer-head">Severity</TableHeadCell>
		</TableHead>
		<TableBody>
		  {#each modelErrors as error, index}
			<TableBodyRow class="error-drawer-row">
			  <TableBodyCell class="error-drawer-cell">
				<Button color="dark" size="xs" class="error-drawer-button" on:click={() => handleClick(index)}>
					<FontAwesomeIcon icon={faSquareUpRight} />
				</Button>
				{error.message}
			  </TableBodyCell>
			  <TableBodyCell class="error-drawer-cell">{error.severity}</TableBodyCell>
			</TableBodyRow>
		  {/each}
		</TableBody>
	  </Table>
</div>


