import { FreNodeReference } from "@freon4dsl/core";
import { Event, When } from "../../freon/language/index.js";
export type Constructor22 = new (...args: any[]) => {};

/**
 * Extends original with extension.
 *
 * @param extension - the extension class
 * @param original - the class to be extended by 'extension'
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

export class ExtendedEvent {
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
        let result = input;

        // Pattern 1: V + number (V1, V2, V19, etc.)
        result = result.replace(/V(\d+)/g, this.incrementNumericSequence);

        // Pattern 2: number + uppercase letter (4A, 4B, etc.)
        result = result.replace(/(\d+)([A-Z])/g, this.incrementAlphaNumericSequence);

        // Pattern 3: trailing number (Visit 1, Week 12, Day 30, etc.)
        if (result === input) {
            result = result.replace(/(\d+)\s*$/, (_match, p1) => {
                return (parseInt(p1, 10) + 1).toString();
            });
        }

        // Fallback: append " copy" if nothing matched
        if (result === input) {
            result = input + " copy";
        }
        return result;
    }

    updateSchedule(originalEvent: Event, duplicatedElement: Event): void {
        if (!duplicatedElement.schedule) {
            return;
        }
        let eventStart = duplicatedElement.schedule.eventStart;
        if (eventStart instanceof When) {
            let newRef = FreNodeReference.create(originalEvent.name, "Event") as FreNodeReference<Event>;
            (eventStart as When).startWhen.event = newRef;
        }
    }

    smartUpdate(originalElement: Event, duplicatedElement: Event): void {
        console.log("smartUpdate to duplicate event " + originalElement.name);
        duplicatedElement.name = this.incrementSequences(duplicatedElement.name);
        this.updateSchedule(originalElement, duplicatedElement);
        // Eventually will need to do other smart things to eliminate manual changes when duplicating.
        // For now just update the reference to the duplicated event in the 'When'.
    }
}

export function extendToSupportSmartDuplication(): void {
    extension(ExtendedEvent, Event);
}
