import { FreLanguage } from "@freon4dsl/core";

/**
 * Set to true to log debug info when a string component's box has a non-"string" property type
 * (e.g. to see if the concept name or property lookup is wrong).
 */
export const DEBUG_STRING_PROPERTY_LOOKUP = false;

/**
 * Set to true to log debug info when ListGroupComponent adds an item (concept name, property name, lookup result).
 */
export const DEBUG_LIST_PROPERTY_LOOKUP = false;

type BoxWithNode = {
    node?: { freLanguageConcept?(): string };
    propertyName?: string;
    getPropertyType?(): string;
};

/**
 * When the box reports a non-"string" type, log lookup details to see if the concept name
 * or property is wrong (e.g. concept not found, or property exists on a different classifier).
 */
export function debugStringPropertyLookup(componentName: string, box: BoxWithNode | null): void {
    if (!DEBUG_STRING_PROPERTY_LOOKUP || !box) return;

    const conceptName = typeof box.node?.freLanguageConcept === "function" ? box.node.freLanguageConcept() : undefined;
    const propertyName = box.propertyName;
    const reportedType = typeof box.getPropertyType === "function" ? box.getPropertyType() : undefined;

    const lang = FreLanguage.getInstance();
    const prop = conceptName != null && propertyName != null ? lang.classifierProperty(conceptName, propertyName) : undefined;

    console.group(`[${componentName}] String property lookup debug`);
    console.log("Box reports: conceptName =", conceptName, ", propertyName =", propertyName, ", getPropertyType() =", reportedType);
    console.log("FreLanguage.classifierProperty(conceptName, propertyName) =", prop, prop ? `(type: "${prop.type}")` : "(undefined — not found)");

    if (prop === undefined && conceptName != null) {
        const conceptExists = lang.concept(conceptName) !== undefined;
        const unitExists = lang.unit(conceptName) !== undefined;
        const modelMatch = lang.modelOfType(conceptName) !== null;
        console.log("Concept found by typeName?", conceptExists, "| Unit?", unitExists, "| Model?", modelMatch);

        const classifier = lang.concept(conceptName) ?? lang.unit(conceptName) ?? lang.modelOfType(conceptName);
        if (classifier?.properties) {
            const keys = Array.from(classifier.properties.keys());
            console.log("Properties on this classifier:", keys.length ? keys.join(", ") : "(none)");
            if (propertyName != null && !classifier.properties.get(propertyName)) {
                console.warn("Property", JSON.stringify(propertyName), "is NOT on this classifier.");
            }
        }

        // Search for which classifier has this property with type "string"
        if (propertyName != null) {
            const unitNames = lang.getUnitNames();
            for (const name of unitNames) {
                const u = lang.unit(name);
                const p = u?.properties.get(propertyName);
                if (p) {
                    console.log("Found property on unit:", name, "→ type:", p.type);
                }
            }
            const namedConcepts = lang.getNamedConcepts();
            for (const name of namedConcepts) {
                const c = lang.concept(name);
                const p = c?.properties.get(propertyName);
                if (p) {
                    console.log("Found property on named concept:", name, "→ type:", p.type);
                }
            }
        }
    }
    console.groupEnd();
}

/**
 * When ListGroupComponent (or similar) looks up a list property, log concept/property and whether the language found it.
 */
export function debugListPropertyLookup(
    componentName: string,
    typeName: string,
    propertyName: string,
    node: unknown,
): void {
    if (!DEBUG_LIST_PROPERTY_LOOKUP) return;

    const lang = FreLanguage.getInstance();
    const prop = lang.classifierProperty(typeName, propertyName);

    console.group(`[${componentName}] List property lookup debug`);
    console.log("typeName =", typeName, ", propertyName =", propertyName, ", node =", node);
    console.log("FreLanguage.classifierProperty(typeName, propertyName) =", prop, prop ? `(type: "${prop.type}")` : "(undefined — not found)");

    if (prop === undefined) {
        const conceptExists = lang.concept(typeName) !== undefined;
        const unitExists = lang.unit(typeName) !== undefined;
        const modelMatch = lang.modelOfType(typeName) !== null;
        console.log("Concept found by typeName?", conceptExists, "| Unit?", unitExists, "| Model?", modelMatch);

        const classifier = lang.concept(typeName) ?? lang.unit(typeName) ?? lang.modelOfType(typeName);
        if (classifier?.properties) {
            const keys = Array.from(classifier.properties.keys());
            console.log("Properties on this classifier:", keys.length ? keys.join(", ") : "(none)");
            if (!classifier.properties.get(propertyName)) {
                console.warn("Property", JSON.stringify(propertyName), "is NOT on this classifier.");
            }
        }
    }
    console.groupEnd();
}
