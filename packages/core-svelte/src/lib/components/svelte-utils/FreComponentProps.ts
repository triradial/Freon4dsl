import { type Box, FreEditor, type GridBox, type SelectOption } from '@freon4dsl/core';
import type { CaretDetails } from './CaretDetails';
import type { TableDetails } from './TableDetails';

/**
 * Properties for the FreonComponent
 */
export interface MainComponentProps {
    editor: FreEditor;
}

/**
 * Properties for most of the components in core-svelte
 */
export interface FreComponentProps<T extends Box> extends MainComponentProps {
    box: T;
    cssClass: string;
}

/**
 * Properties for a GridComponent
 */
export interface GridProps extends FreComponentProps<GridBox> {
}

/**
 * Properties for a GridCellComponent
 */
export interface GridCellProps<T extends Box> extends FreComponentProps<T> {
    parentBox: GridBox;
}

/**
 * Properties for a TableCellComponent
 */
export interface TableCellProps<T extends Box> extends FreComponentProps<T> {
    parentComponentId: string;
    parentOrientation: string;
    ondropOnCell: (details: TableDetails) => void;
}
/**
 * Properties for a TextComponent
 */
export interface TextComponentProps<T extends Box> extends FreComponentProps<T> {
    // Indication whether this component is currently being edited by the user, needs to be exported for binding in TextDropdownComponent
    isEditing: boolean;
    // Indication whether this text component is part of an TextDropdownComponent
    partOfDropdown: boolean;
    // The text to be displayed, needs to be exported for binding in TextDropdownComponent
    text: string;

    // This function replaces the event handling in version 1.0.0 (for svelte v4). What used to be an event,
    // now is a call to this function, where the param 'eventType' indicates the type of the former event, and
    // 'details' are the information passed by the event.
    // NB Here this function is called 'fromInner', in the child TextComponent it is called 'toParent'.
    toParent: (eventType: string, details?: CaretDetails) => void;
}

/**
 * Properties for a DropdownComponent
 */
export interface DropdownProps {
    options: SelectOption[];
    selected?: SelectOption;
    selectionChanged: (sel: SelectOption) => void;
}

/**
 * Properties for an ErrorTooltip
 */
export interface ErrorProps<T extends Box> extends FreComponentProps<T> {
    hasErr: boolean;
    parentTop: number;
    parentLeft: number;
    children(): any; // replaces slot from Svelte version 4
}

/** M+G start updates */

export interface ListProps<T extends Box> extends FreComponentProps<T> {
}

export interface ListGroupProps<T extends Box> extends FreComponentProps<T> {
    canAdd: boolean;
    canCRUD: boolean;
    canExpand: boolean;
    isExpanded: boolean;
}

export interface ItemGroupProps<T extends Box> extends FreComponentProps<T> {
    isEditing: boolean;
    partOfActionBox: boolean;
    text: string;
    canDelete: boolean;
    canUnlink: boolean;
    canExpand: boolean;
    canShare: boolean;
    canCRUD: boolean;
    canDuplicate: boolean;
    isRequired: boolean;
    isExpanded: boolean;
}

export interface ItemGroup2Props<T extends Box> extends FreComponentProps<T> {
    isEditing: boolean;
    canDelete: boolean;
    canUnlink: boolean;
    canExpand: boolean;
    isDraggable: boolean;
}

/** M+G end updates */
