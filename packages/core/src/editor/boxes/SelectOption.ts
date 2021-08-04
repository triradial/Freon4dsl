/**
 * Describes an option in a dropdown
 */
import { observable } from "mobx";
import { PiEditor } from "../PiEditor";

export type SelectOption = {
    id: string;
    label: string;
    description?: string;
};

export function findOption(options: SelectOption[], id: string): SelectOption | null {
    const index = options.findIndex(option => option.id === id);
    return (index === -1 ? null : options[index]);
}

