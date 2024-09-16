import { FreNamedNode, FreNode, FreNodeReference } from "@freon4dsl/core";
import { Event, EventReference, When } from "../../language/gen/index";
export type Constructor22 = new (...args: any[]) => {};

/**
 * Extends original with extension.
 *
 * @param extension
 * @param original
 */
export function extension(extension: Constructor22, original: Constructor22) {
    const extensionPrototype = extension.prototype;
    const originalPrototype = original.prototype;
    for (const property of Object.getOwnPropertyNames(extensionPrototype)) {
        if (property !== "constructor") {
            console.log("Extending " + originalPrototype.constructor.name + " with property " + property);
            originalPrototype[property] = extensionPrototype[property];
        }
    }
}

export class ExtendedEvent extends Event {
    // Function to increment numeric sequences
    private incrementNumericSequence(match: string, p1: string): string {
        const num = parseInt(p1, 10);
        return match.replace(p1, (num + 1).toString());
    }

    // Function to increment alphanumeric sequences
    private incrementAlphaNumericSequence(match: string, p1: string, p2: string): string {
        const num = parseInt(p1, 10);
        const char = String.fromCharCode(p2.charCodeAt(0) + 1);
        return match.replace(p1 + p2, num + char);
    }

    private incrementSequences(input: string): string {
        // Regular expressions to match patterns like V1, V2, V3 and 4A, 4B, 4C
        const patterns = [
            /V(\d+)/g, // Matches V1, V2, V3, etc.
            /(\d+)([A-Z])/g, // Matches 4A, 4B, 4C, etc.
        ];

        // Replace all matches with incremented sequences
        let result = input;
        result = result.replace(patterns[0], this.incrementNumericSequence);
        result = result.replace(patterns[1], this.incrementAlphaNumericSequence);

        return result;
    }

    updateSchedule(originalEvent: Event): void {
        let eventStart = this.schedule.eventStart;
        if (eventStart instanceof When) {
            let newRef  = FreNodeReference.create(originalEvent.name, "Event") as FreNodeReference<Event>;
            (eventStart as When).startWhen.event = newRef;
        }
    }


    smartUpdate(originalElement:Event): void {
        console.log("smartUpdate to duplicate event " + originalElement.name);
        this.name = this.incrementSequences(this.name) + " (copy)";
        this.updateSchedule(originalElement);
        // Eventually will need to do other smart things to eliminate manual changes when duplicating.
        // For now just update the reference to the duplicated event in the 'When'.
    }
}

export function extendToSupportSmartDuplication(): void {
    extension(ExtendedEvent, Event);
}
