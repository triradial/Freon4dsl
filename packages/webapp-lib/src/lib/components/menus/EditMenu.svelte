<div
		class={Object.keys(anchorClasses).join(' ')}
		use:Anchor={{addClass: addClass, removeClass: removeClass}}
		bind:this={anchor}
>
	<Button variant="raised" on:click={() => menu.setOpen(true)}>
		<Label>Edit</Label>
	</Button>
	<Menu
			bind:this={menu}
			anchor={false}
			bind:anchorElement={anchor}
			anchorCorner="BOTTOM_LEFT"
	>
		<List>
			{#each menuItems as item (item.id)}
				<Item on:SMUI:action={() => (handleClick(item.id))} disabled={isDisabled(item.id)}>
					<Text>{item.title}</Text>
				</Item>
				{#if item.id === 2 || item.id === 5 || item.id === 6 }
					<Separator />
				{/if}
			{/each}
		</List>
	</Menu>
</div>

<script lang="ts">
	import {isRtError, type FreNode, type FreEnvironment, RtString} from "@freon4dsl/core";
	import MenuComponentDev from '@smui/menu';
	import Menu from '@smui/menu';
	import { Anchor } from '@smui/menu-surface';
	import List, {
		Item,
		Separator,
		Text
	} from '@smui/list';
	import Button, { Label } from '@smui/button';
	import { activeTab, interpreterTab, interpreterTrace, chartHTML, errorTab } from "../stores/InfoPanelStore.js";
	import { MenuItem } from "../ts-utils/MenuItem.js";
	import {
		findNamedDialogVisible,
		findStructureDialogVisible,
		findTextDialogVisible
	} from "../stores/DialogStore.js";
	import { EditorRequestsHandler } from "../../language/EditorRequestsHandler.js";
	import {EditorState} from "../../language/EditorState.js";
	import { setUserMessage } from "../stores/UserMessageStore.js";
	import { WebappConfigurator } from "$lib/WebappConfigurator.js";
    import type { StudyConfigurationModel } from "@freon4dsl/samples-study-configuration";

	let menu: MenuComponentDev;

	// stuff for positioning the menu
	let anchor: HTMLDivElement;
	let anchorClasses: { [k: string]: boolean } = {}; // a list of name - boolean pairs

	const addClass = (className: string) => {
		if (!anchorClasses[className]) {
			anchorClasses[className] = true;
		}
	}
	const removeClass = (className: string) => {
		if (anchorClasses[className]) {
			delete anchorClasses[className];
			anchorClasses = anchorClasses;
		}
	}

	// implementation of all actions
	const findText = () => {
		$findTextDialogVisible = true;
	}

	const runInterpreter = () => {
		activeTab.set(errorTab);
		const langEnv : FreEnvironment = WebappConfigurator.getInstance().editorEnvironment;
		const intp = langEnv.interpreter;
		const studyConfigurationModel = EditorState.getInstance().modelStore.model as StudyConfigurationModel;
		const studyConfigurationUnit = studyConfigurationModel.configuration;
		EditorRequestsHandler.getInstance().validate();
		activeTab.set(interpreterTab);
		chartHTML.set("<b>Running Simulation...</b>");
		const rtObject = intp.evaluate(studyConfigurationUnit) as RtString;
		chartHTML.set(rtObject.asString());
	}

	const findStructureElement = () => {
		$findStructureDialogVisible = true;
	}

	const findNamedElement = () => {
		$findNamedDialogVisible = true;
	}

	// when a menu-item is clicked, this function is executed
	const handleClick = (id: number) => {
		// find the item that was clicked
		let menuItem = menuItems.find(item => item.id === id);
		// perform the action associated with the menu item
		menuItem.action(id);
	};

	const notImplemented = () => {
		setUserMessage("Sorry, this action is not yet implemented.");
	}

	// all menu items
	let menuItems : MenuItem[] = [
		{ title: 'Undo', action: EditorRequestsHandler.getInstance().undo, id: 1 },
		{ title: 'Redo', action: EditorRequestsHandler.getInstance().redo, id: 2 },
		{ title: 'Cut', action: EditorRequestsHandler.getInstance().cut, id: 3 },
		{ title: 'Copy', action: EditorRequestsHandler.getInstance().copy, id: 4 },
		{ title: 'Paste', action: EditorRequestsHandler.getInstance().paste, id: 5 },
		{ title: 'Validate', action: EditorRequestsHandler.getInstance().validate, id: 6 },
		{ title: 'Find Named Element', action: findNamedElement, id: 7 },
		{ title: 'Find Structure Element', action: findStructureElement, id: 8 },
		{ title: 'Find Text', action: findText, id: 9 },
		{ title: 'Run Simulation', action: runInterpreter, id: 10 },
	];

	function isDisabled(id): boolean {
		if ( id === 8 ) { // find structure element
			return true;
		}
		return false;
	}
</script>
