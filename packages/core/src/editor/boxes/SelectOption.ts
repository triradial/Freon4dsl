/**
 * Describes an option in a dropdown
 */
import { PiAction } from "../actions/index";
// import { InternalBehavior } from "../InternalBehavior";

export interface SelectOption {
    /**
     *  Unique id used to distinguish options in selection lists.
     */
    id: string;
    /**
     * The text as shown to the user, usually also the text that the user needs to type.
     */
    label: string;
    /**
     * The behavior to be executed
     */
    // behavior?: InternalBehavior,


    action?: PiAction,
    /**
     * A more vervose description, keep this to a single short line.
     */
    description?: string;
}

/**
 * Describes a selection by the user
 */
export interface SelectedOption {
    /**
     * The text that the user has typed,
     */
    selectText: string;
    /**
     * The option that the user has selected.
     */
    option: SelectOption;
    /**
     * An optional parameter to the seleected option.
     */
    parameter?: string;

}

export function findOption(options: SelectOption[], id: string): SelectOption | null {
    const index = options.findIndex(option => option.label === id);
    return (index === -1 ? null : options[index]);
}

