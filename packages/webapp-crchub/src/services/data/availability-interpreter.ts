/**
 * Availability Interpreter
 * Converts between UI-friendly staff availability data and the DSL model format
 */

import type { StaffAvailability, DateRange } from './availability-service.js';
import { calculateStaffLevelsFromAvailability, mergeRanges } from './availability-service.js';

/**
 * DSL Model format structures
 */
interface AvailabilityModel {
    nodes: AvailabilityNode[];
    languages: Language[];
    serializationFormatVersion: string;
}

interface AvailabilityNode {
    id: string;
    parent: string | null;
    classifier: Classifier;
    properties: Property[];
    references: any[];
    annotations: any[];
    containments: Containment[];
}

interface Classifier {
    key: string;
    version: string;
    language: string;
}

interface Property {
    value: string;
    property: Classifier;
}

interface Containment {
    children: string[];
    containment: Classifier;
}

interface Language {
    key: string;
    version: string;
}

let nodeIdCounter = 1;

function generateNodeId(): string {
    return `ID-${nodeIdCounter++}`;
}

function createClassifier(key: string): Classifier {
    return {
        key: key,
        version: "2023.1",
        language: "-key-StudyConfigurationModel"
    };
}

function createProperty(key: string, value: string): Property {
    return {
        value: value,
        property: createClassifier(key)
    };
}

/**
 * Convert UI staff availability data to DSL model format
 */
export function convertToModel(
    totalStaff: number,
    staffAvailability: StaffAvailability[]
): AvailabilityModel {
    nodeIdCounter = 36; // Start from a reasonable ID
    const nodes: AvailabilityNode[] = [];

    // Calculate staff levels from availability data
    const staffLevels = calculateStaffLevelsFromAvailability(totalStaff, staffAvailability);

    // Create root Availability node
    const rootId = generateNodeId();
    const staffLevelChildIds: string[] = [];

    // Create StaffLevel nodes for each unique staff count
    for (const [key, { count, dateRange }] of staffLevels) {
        const staffLevelId = generateNodeId();
        staffLevelChildIds.push(staffLevelId);

        // Create DateConcept for start date
        const startDateId = generateNodeId();
        const startDate = parseDateString(dateRange.startDate);
        nodes.push({
            id: startDateId,
            parent: staffLevelId,
            classifier: createClassifier("-key-DateConcept"),
            properties: [
                createProperty("-key-DateConcept-dateAsString", dateRange.startDate),
                createProperty("-key-DateConcept-day", ""),
                createProperty("-key-DateConcept-year", startDate.year.toString())
            ],
            references: [],
            annotations: [],
            containments: []
        });

        // Create DateRange node
        const dateRangeId = generateNodeId();
        
        // Create DateConcept for range start
        const rangeStartId = generateNodeId();
        nodes.push({
            id: rangeStartId,
            parent: dateRangeId,
            classifier: createClassifier("-key-DateConcept"),
            properties: [
                createProperty("-key-DateConcept-dateAsString", dateRange.startDate),
                createProperty("-key-DateConcept-day", ""),
                createProperty("-key-DateConcept-year", startDate.year.toString())
            ],
            references: [],
            annotations: [],
            containments: []
        });

        // Create DateConcept for range end
        const rangeEndId = generateNodeId();
        const endDate = parseDateString(dateRange.endDate);
        nodes.push({
            id: rangeEndId,
            parent: dateRangeId,
            classifier: createClassifier("-key-DateConcept"),
            properties: [
                createProperty("-key-DateConcept-dateAsString", dateRange.endDate),
                createProperty("-key-DateConcept-day", ""),
                createProperty("-key-DateConcept-year", endDate.year.toString())
            ],
            references: [],
            annotations: [],
            containments: []
        });

        // Create DateRange node with start and end
        nodes.push({
            id: dateRangeId,
            parent: staffLevelId,
            classifier: createClassifier("-key-DateRange"),
            properties: [],
            references: [],
            annotations: [],
            containments: [
                {
                    children: [rangeStartId],
                    containment: createClassifier("-key-DateRange-startDate")
                },
                {
                    children: [rangeEndId],
                    containment: createClassifier("-key-DateRange-endDate")
                }
            ]
        });

        // Create StaffLevel node
        nodes.push({
            id: staffLevelId,
            parent: rootId,
            classifier: createClassifier("-key-StaffLevel"),
            properties: [
                createProperty("-key-StaffLevel-staffAvailable", count.toString())
            ],
            references: [],
            annotations: [],
            containments: [
                {
                    children: [startDateId],
                    containment: createClassifier("-key-StaffLevel-startDate")
                },
                {
                    children: [dateRangeId],
                    containment: createClassifier("-key-StaffLevel-dateOrRange")
                }
            ]
        });
    }

    // Create root Availability node
    nodes.unshift({
        id: rootId,
        parent: null,
        classifier: createClassifier("-key-Availability"),
        properties: [
            createProperty("-key-Availability-name", "Availability"),
            createProperty("-key-Availability-baselineStaff", totalStaff.toString())
        ],
        references: [],
        annotations: [],
        containments: [
            {
                children: staffLevelChildIds,
                containment: createClassifier("-key-Availability-staffLevels")
            }
        ]
    });

    return {
        nodes: nodes,
        languages: [
            {
                key: "-key-StudyConfigurationModel",
                version: "2023.1"
            }
        ],
        serializationFormatVersion: "2023.1"
    };
}

/**
 * Convert DSL model format to UI staff availability data
 * This is the reverse operation - extracting staff unavailability from the model
 */
export function convertFromModel(
    model: AvailabilityModel
): { totalStaff: number; staffAvailability: StaffAvailability[] } {
    // Find root Availability node
    const rootNode = model.nodes.find(n => n.parent === null && 
        n.classifier.key === "-key-Availability");
    
    if (!rootNode) {
        return { totalStaff: 0, staffAvailability: [] };
    }

    // Extract totalStaff from baselineStaff property
    const baselineStaffProp = rootNode.properties.find(p => 
        p.property.key === "-key-Availability-baselineStaff");
    const totalStaff = baselineStaffProp ? parseInt(baselineStaffProp.value) : 0;

    // For now, we can't reverse-engineer individual staff unavailability from aggregated data
    // This would require additional metadata in the model
    // Return empty staff availability - the UI will need to maintain its own data
    return {
        totalStaff: totalStaff,
        staffAvailability: []
    };
}

/**
 * Parse date string to extract year, month, day
 */
function parseDateString(dateStr: string): { year: number; month: number; day: number } {
    const parts = dateStr.split('-');
    return {
        year: parseInt(parts[0]),
        month: parseInt(parts[1]),
        day: parseInt(parts[2])
    };
}

/**
 * Format a date to YYYY-MM-DD
 * Note: This is a duplicate of the function in availability-service.ts
 * but kept here for self-contained interpreter functionality
 */
export function formatDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

