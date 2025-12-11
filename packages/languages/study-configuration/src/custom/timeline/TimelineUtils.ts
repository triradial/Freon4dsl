import { AST, RtString } from "@freon4dsl/core";
import { PatientHistory, StudyConfiguration } from "../../language/gen/index.js";
import * as Sim from "../simjs/sim.js";
import { StudyChecklistDocumentTemplate } from "../templates/StudyChecklistDocumentTemplate.js";
import { TimelineChartTemplate } from "../templates/TimelineChartTemplate.js";
import { TimelineTableTemplate } from "../templates/TimelineTableTemplate.js";
import { Simulator } from "./Simulator.js";
import { Timeline } from "./Timeline.js";

/**
 * Copies a patient history and fills all date concepts.
 * This creates an isolated copy to avoid editor observation issues.
 */
export function copyPatientHistoryWithFilledDates(copyOfPatientHistory: PatientHistory): PatientHistory {
    const copiedHistory: PatientHistory = PatientHistory.create({});
    AST.change(() => {
        // Process visits - copy first, then modify date concepts
        for (const visit of copyOfPatientHistory.patientVisits) {
            const updatedVisit = visit.copy();
            if (updatedVisit.actualVisitDate) {
                Timeline.fillDateConceptFromAsString(updatedVisit.actualVisitDate);
            }
            copiedHistory.patientVisits.push(updatedVisit);
        }
        // Process date ranges - copy first, then modify date concepts
        for (const dateRange of copyOfPatientHistory.patientNotAvailableDates) {
            const updatedDateRange = dateRange.copy();
            if (updatedDateRange.startDate) {
                Timeline.fillDateConceptFromAsString(updatedDateRange.startDate);
            }
            if (updatedDateRange.endDate) {
                Timeline.fillDateConceptFromAsString(updatedDateRange.endDate);
            }
            copiedHistory.patientNotAvailableDates.push(updatedDateRange);
        }
    });
    return copiedHistory;
}

/**
 * Determines the reference date for the timeline.
 * If a reference date is provided, it's normalized to local midnight.
 * Otherwise, uses the first visit date from the patient history, or today if no visits exist.
 */
export function determineReferenceDate(referenceDate: Date | undefined, patientHistory?: PatientHistory): Date {
    if (referenceDate !== undefined) {
        // Normalize to local midnight
        return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), 0, 0, 0);
    }
    
    if (patientHistory && patientHistory.patientVisits.length > 0) {
        // Parse the date string and set to local midnight (00:00:00) to avoid timezone issues
        // dateAsString format is "YYYY-MM-DD", parse it to ensure local time
        const dateStr = patientHistory.patientVisits[0].actualVisitDate.dateAsString;
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day, 0, 0, 0); // month is 0-indexed
    }
    
    // Default to today at local midnight
    const now = new Date(Date.now());
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
}

/**
 * Finds a patient history by patient number from an array of patient histories.
 * This is a shared helper function used by other utility functions.
 */
export function findPatientHistoryByPatientNumber(patientHistories: PatientHistory[], patientNumber: string): PatientHistory | undefined {
    return patientHistories.find(ph => ph.patient_id === patientNumber);
}

/**
 * Finds a patient history by patient number and returns a copied version with filled dates.
 * If no matching patient history is found, returns an empty PatientHistory.
 */
export function findAndCopyPatientHistory(patientHistories: PatientHistory[], patientNumber: string): PatientHistory {
    const copyOfPatientHistory = findPatientHistoryByPatientNumber(patientHistories, patientNumber);
    
    if (copyOfPatientHistory) {
        return copyPatientHistoryWithFilledDates(copyOfPatientHistory);
    } else {
        // Return empty patient history if not found
        return PatientHistory.create({});
    }
}

/**
 * Finds the first patient history that has visits from a list of patients.
 * Used to determine a reference date when multiple patients are being displayed.
 */
export function findFirstPatientHistoryWithVisits(
    patientHistories: PatientHistory[],
    patients: Array<{ patientNumber: string }>
): PatientHistory | undefined {
    for (const patient of patients) {
        const patientHistory = findPatientHistoryByPatientNumber(patientHistories, patient.patientNumber);
        if (patientHistory && patientHistory.patientVisits.length > 0) {
            return patientHistory;
        }
    }
    return undefined;
}

/**
 * Creates a timeline for a study configuration as of a specific reference date.
 * Optionally includes patient history events if provided.
 */
export function getTimelineAsOfADate(
    node: StudyConfiguration,
    referenceDate?: Date,
    patientHistory?: PatientHistory,
    patientIdentifier?: string
): Timeline {
    new Sim.Sim(); // For some reason, need to do this for Sim to be properly loaded and available in the Scheduler class used by the Simulator.
    const studyConfigurationUnit = node as StudyConfiguration;
    const simulator = new Simulator(studyConfigurationUnit);
    
    if (referenceDate) {
        simulator.setReferenceDate(referenceDate);
    } else {
        simulator.setReferenceDate(new Date(2024, 8, 30));
    }
    
    simulator.organizedByReferenceDate();
    
    if (patientHistory) {
        simulator.timeline.addPatientEvents(patientHistory, patientIdentifier);
    }
    
    simulator.run();
    const timeline = simulator.timeline;
    
    return timeline;
}

/**
 * Creates a timeline for a study configuration without patient history.
 * This is a helper function used by other timeline utility functions.
 */
function getTimeline(node: StudyConfiguration): Timeline {
    new Sim.Sim(); // For some reason, need to do this for Sim to be properly loaded and available in the Scheduler class used by the Simulator.
    const studyConfigurationUnit = node as StudyConfiguration;
    const simulator = new Simulator(studyConfigurationUnit);
    simulator.run();
    const timeline = simulator.timeline;
    return timeline;
}

/**
 * Generates a timeline table HTML for a study configuration.
 */
export function getTimelineTable(node: StudyConfiguration): RtString {
    const timeline = getTimeline(node);
    const tableHTML = TimelineTableTemplate.getTimeLineTableAndStyles(timeline);
    const html = `<div class="limited-width-container">${tableHTML}</div>`;
    return new RtString(html);
}

/**
 * Generates a timeline chart HTML for a study configuration.
 */
export function getTimelineChart(node: StudyConfiguration, hasPatientKey: boolean = false, hasStaffKey: boolean = false): RtString {
    const timeline = getTimeline(node);
    const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
    const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
    const chartHTML = TimelineChartTemplate.getTimelineAsHTMLBlock(timelineDataAsScript + timelineVisualizationHTML, hasPatientKey, hasStaffKey);
    const html = `<div class="limited-width-container">${chartHTML}</div>`;
    return new RtString(html);
}

/**
 * Generates a study checklist as markdown for a study configuration.
 */
export function getChecklistAsMarkdown(studyConfigurationUnit: StudyConfiguration, showHeadingNumbers: boolean = false): string {
    const timeline = getTimeline(studyConfigurationUnit);
    const studyChecklistAsMarkdown = StudyChecklistDocumentTemplate.getStudyChecklistAsMarkdown(studyConfigurationUnit, timeline, showHeadingNumbers);
    return studyChecklistAsMarkdown;
}

