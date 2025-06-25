<script lang="ts">
    import { RENDER_LOGGER } from './ComponentLoggers.js';
    import { tick } from "svelte"
    // This component renders any box from the box model.
    // Depending on the box type the right component is used.
    // It also makes the rendered element selectable, including changing the style.
    // Note that all boxes are rendered as flex-items within a RenderComponent,
    // which is the flex-container.
    // Note also that this component has no 'setFocus' method because it is not
    // strongly coupled to a box. Each box is coupled to the corresponding
    // component in the if-statement.
    import {
        isActionBox,
        isEmptyLineBox,
        isGridBox,
        isTableBox,
        isIndentBox,
        isLabelBox,
        isLayoutBox,
        isListBox,
        isSelectBox,
        isTextBox,
        isSvgBox,
        isBooleanControlBox,
        isNumberControlBox,
        isElementBox,
        isOptionalBox2,
        isMultiLineTextBox,
        isLimitedControlBox,
        isButtonBox,
        isExternalBox,
        isFragmentBox,
        isReferenceBox,
        Box,
        BoolDisplay,
        LimitedDisplay,
        isActionTextBox,
        isNullOrUndefined, type ClientRectangle, UndefinedRectangle,
        /** M+G: start updates */
        isMultiLineTextBox2, isItemGroupBox, isItemGroupBox2, isListGroupBox
        /** M+G: end updates */
    } from "@freon4dsl/core"
    import MultiLineTextComponent from './MultiLineTextComponent.svelte';
    import EmptyLineComponent from './EmptyLineComponent.svelte';
    import GridComponent from './GridComponent.svelte';
    import IndentComponent from './IndentComponent.svelte';
    import LabelComponent from './LabelComponent.svelte';
    import LayoutComponent from './LayoutComponent.svelte';
    import ListComponent from './ListComponent.svelte';
    import OptionalComponent from './OptionalComponent.svelte';
    import TableComponent from './TableComponent.svelte';
    import TextComponent from './TextComponent.svelte';
    import TextDropdownComponent from './TextDropdownComponent.svelte';
    import SvgComponent from './SvgComponent.svelte';
    import ElementComponent from './ElementComponent.svelte';
    import BooleanCheckboxComponent from './BooleanCheckboxComponent.svelte';
    import BooleanRadioComponent from './BooleanRadioComponent.svelte';
    import InnerSwitchComponent from './BooleanInnerSwitchComponent.svelte';
    import NumericSliderComponent from './NumericSliderComponent.svelte';
    import LimitedCheckboxComponent from './LimitedCheckboxComponent.svelte';
    import LimitedRadioComponent from './LimitedRadioComponent.svelte';
    import SwitchComponent from './BooleanSwitchComponent.svelte';
    import ButtonComponent from './ButtonComponent.svelte';
    import FragmentComponent from './FragmentComponent.svelte';
    /** M+G: start updates */
    import MultiLineTextComponent2 from './MultiLineTextComponent2.svelte';
    import ItemGroupComponent from './ItemGroupComponent.svelte';
    import ItemGroupComponent2 from './ItemGroupComponent2.svelte';
    import ListGroupComponent from './ListGroupComponent.svelte';
    /** M+G: end updates */
    import { componentId, findCustomComponent } from '../index.js';

    import ErrorMarker from './ErrorMarker.svelte';
    import { selectedBoxes } from './stores/AllStores.svelte.js';
    import type { FreComponentProps } from './svelte-utils/FreComponentProps.js';
    import type { Component } from 'svelte';

    const LOGGER = RENDER_LOGGER;

    let { editor, box, cssClass }: FreComponentProps<Box> = $props();

    const isFullWidth = $derived(
        !isNullOrUndefined(box) && (
            isGridBox(box)
            || isIndentBox(box)
            || isLayoutBox(box)
            || isListBox(box)
            || isTableBox(box)
            || isListGroupBox(box)
            || isItemGroupBox(box)
            || isItemGroupBox2(box)
            || isMultiLineTextBox(box)
            || isMultiLineTextBox2(box)
            // || isOptionalBox2(box)
        )
    );
    
    let id: string = $state('');
    let element: HTMLElement | undefined = $state(undefined);
    let selectedCls: string = $state(''); // css class name for when the node is selected
    let errorCls: string = $state(''); // css class name for when the node is erroneous
    let errMess: string[] = $state([]); // error message to be shown when element is hovered
    let ExternalComponent: Component<FreComponentProps<any>> | undefined = $state(undefined);

    const onClick = (event: MouseEvent) => {
        LOGGER.log(
            'RenderComponent.onClick for box ' + box.role + ', selectable:' + box.selectable
        );
        // Note that click events on some components, like TextComponent, are already caught.
        // These components need to take care of setting the currently selected element themselves.
        editor.selectElementForBox(box);
        event.preventDefault();
        event.stopPropagation();
    };
    
    $effect(() => {
        let selectedChanged = false
        // the following is done in the afterUpdate(), because then we are sure that all boxes are rendered by their respective components
        LOGGER.log(
            'afterUpdate selectedBoxes: [' +
                selectedBoxes.value.map(
                    (b) => b?.node?.freId() + '=' + b?.node?.freLanguageConcept() + '=' + b?.kind
                ) +
                ']'
        );
        let isSelected: boolean = selectedBoxes.value.includes(box);
        // Ensure that the internal textbox inside an Action/Select/Reference box is selected if its parent box is.
        if (isActionTextBox(box)) {
            isSelected = isSelected || selectedBoxes.value.includes(box.parent);
        }
        if (isExternalBox(box)) {
            ExternalComponent = findCustomComponent(box.externalComponentName);
        }
        if (isActionBox(box) || isSelectBox(box) || isReferenceBox(box)) {
            isSelected = isSelected || selectedBoxes.value.includes(box._textBox);
        }
        if (isBooleanControlBox(box) || isLimitedControlBox(box)) {
            // do not set extra class, the control itself handles being selected
        } else {
            const newSelectedCls = isSelected ? 'render-component-selected' : 'render-component-unselected'
            selectedChanged = (newSelectedCls !== selectedCls)
            selectedCls = newSelectedCls
        }
    });

    const refresh = (why?: string): void => {
        LOGGER.log('REFRESH RenderComponent (' + why + ')');
        id = !isNullOrUndefined(box) ? `render-${componentId(box)}` : 'render-for-unknown-box';
        if (!isNullOrUndefined(box) && box.hasError) {
            errorCls = 'render-component-error';
            errMess = box.errorMessages;
        } else {
            errorCls = '';
            errMess = [];
        }
    };
    
    const clientRectangle = (): ClientRectangle => {
        LOGGER.log(`Render clientRect ${box.id} `)
        return element?.getBoundingClientRect() || UndefinedRectangle
    }

    let first = true;
    $effect(() => {
        // Evaluated and re-evaluated when the box changes.
        refresh((first ? 'first' : 'later') + '   ' + box?.id);
        if (!isNullOrUndefined(box) && !isTextBox(box) ) {
            box.getClientRectangle = clientRectangle
        }
        first = false;
    });
</script>

<!-- TableRows are not included here, because they use the CSS grid and table cells must in HTML
     always be directly under the main grid.
-->
<!-- ElementBoxes are without span, because they are not shown themselves.
     Their children are, and each child gets its own surrounding RenderComponent.
-->
{#if isElementBox(box)}
    <ElementComponent {box} {editor} cssClass={box.cssClass} />
{:else}
    {#if errMess.length > 0 && !isNullOrUndefined(element)}
        <ErrorMarker {box} {editor} cssClass={box.cssClass} />
    {/if}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
    <!--	svelte-ignore a11y_click_events_have_key_events -->
    <span
        {id}
        class="render-component {errorCls} {selectedCls} {isFullWidth ? 'w-full' : ''}"
        onclick={onClick}
        bind:this={element}
        role="group"
    >
        {#if box === null || box === undefined}
            <p class="error">[BOX IS NULL OR UNDEFINED]</p>
        {:else if isBooleanControlBox(box) && box.showAs === BoolDisplay.CHECKBOX}
            <BooleanCheckboxComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isBooleanControlBox(box) && box.showAs === BoolDisplay.RADIO_BUTTON}
            <BooleanRadioComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isBooleanControlBox(box) && box.showAs === BoolDisplay.SWITCH}
            <SwitchComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isBooleanControlBox(box) && box.showAs === BoolDisplay.INNER_SWITCH}
            <InnerSwitchComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isNumberControlBox(box)}
            <NumericSliderComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isLimitedControlBox(box) && box.showAs === LimitedDisplay.RADIO_BUTTON}
            <LimitedRadioComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isLimitedControlBox(box) && box.showAs === LimitedDisplay.CHECKBOX}
            <LimitedCheckboxComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isButtonBox(box)}
            <ButtonComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isExternalBox(box)}
            {#if !isNullOrUndefined(ExternalComponent)}
                <ExternalComponent {box} {editor} cssClass={box.cssClass}></ExternalComponent>
            {:else}
                <p class="render-component-error">
                    [UNKNOWN EXTERNAL BOX TYPE: {box.externalComponentName}]
                </p>
            {/if}
        {:else if isFragmentBox(box)}
            <FragmentComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isGridBox(box)}
            <GridComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isIndentBox(box)}
            <IndentComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isLabelBox(box)}
            <LabelComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isLayoutBox(box)}
            <LayoutComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isListBox(box)}
            <ListComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isOptionalBox2(box)}
            <OptionalComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isSvgBox(box)}
            <SvgComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isTableBox(box)}
            <TableComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isTextBox(box)}
            <TextComponent {box} {editor} cssClass={box.cssClass} partOfDropdown={false} text="" isEditing={false} toParent={() => {} } />
        {:else if isMultiLineTextBox(box)}
            <MultiLineTextComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isActionBox(box) || isSelectBox(box) || isReferenceBox(box)}
            <TextDropdownComponent {box} {editor} cssClass={box.cssClass} />
        {:else if isEmptyLineBox(box)}
            <EmptyLineComponent {box} {editor} cssClass={box.cssClass} />
        <!-- M+G: start updates -->
        {:else if isMultiLineTextBox2(box)}
            <MultiLineTextComponent2 {box} {editor} cssClass={box.cssClass} />
        {:else if isItemGroupBox(box)}
            <ItemGroupComponent 
                {box} 
                {editor} 
                cssClass={box.cssClass}
                isEditing={false}
                partOfActionBox={false}
                text={box.getText()}
                canDelete={box.canDelete}
                canUnlink={box.canUnlink}
                canExpand={box.canExpand}
                canShare={box.canShare}
                canCRUD={box.canCRUD}
                canDuplicate={box.canDuplicate}
                isRequired={box.isRequired}
                isExpanded={box.isExpanded}
            />
        {:else if isItemGroupBox2(box)}
            <ItemGroupComponent2 
                {box} 
                {editor} 
                cssClass={box.cssClass} 
            />
        {:else if isListGroupBox(box)}
            <ListGroupComponent 
                {box} 
                {editor} 
                cssClass={box.cssClass}
                canAdd={box.canAdd}
                canCRUD={box.canCRUD}
                canExpand={box.canExpand}
                isExpanded={box.isExpanded}
            />
        <!-- M+G: end updates -->
        {:else}
            <!-- we use box["kind"] here instead of box.kind to avoid an error from svelte check-->
            <p class="render-component-unknown-box">[UNKNOWN BOX TYPE: {box['kind']}]</p>
        {/if}
    </span>
{/if}
