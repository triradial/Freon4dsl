import { AST, RtString } from "@freon4dsl/core";
import { PatientHistory, PatientInfo, StudyConfiguration } from "../../freon/language/index.js";
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
export function copyPatientHistoryWithFilledDates(patientHistory: PatientHistory): PatientHistory {
    const copiedHistory: PatientHistory = PatientHistory.create({});
    AST.change(() => {
        // Process visits - copy first, then modify date concepts
        for (const visit of patientHistory.patientVisits) {
            const updatedVisit = visit.copy();
            if (updatedVisit.actualVisitDate) {
                Timeline.fillDateConceptFromAsString(updatedVisit.actualVisitDate);
            }
            copiedHistory.patientVisits.push(updatedVisit);
        }
        
        // Find the earliest visit date from the COPIED visits (after dates are filled)
        let earliestVisitDate: string | undefined;
        for (const visit of copiedHistory.patientVisits) {
            if (visit.actualVisitDate?.dateAsString) {
                if (!earliestVisitDate || 
                    visit.actualVisitDate.dateAsString < earliestVisitDate) {
                    earliestVisitDate = visit.actualVisitDate.dateAsString;
                }
            }
        }
        
        // Process date ranges - only include those that start on or after the first visit date
        for (const dateRange of patientHistory.patientNotAvailableDates) {
            const updatedDateRange = dateRange.copy();
            if (updatedDateRange.startDate) {
                Timeline.fillDateConceptFromAsString(updatedDateRange.startDate);
            }
            if (updatedDateRange.endDate) {
                Timeline.fillDateConceptFromAsString(updatedDateRange.endDate);
            }
            
            // Skip date ranges that start before the first visit date
            // Only filter if we have both an earliest visit date and a start date
            if (earliestVisitDate && updatedDateRange.startDate?.dateAsString) {
                if (updatedDateRange.startDate.dateAsString < earliestVisitDate) {
                    continue; // Skip this date range - it's entirely before the first visit
                }
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
        // Find the earliest visit date
        // dateAsString format is "YYYY-MM-DD", which can be compared lexicographically
        let earliestVisit: typeof patientHistory.patientVisits[0] | undefined;
        for (const visit of patientHistory.patientVisits) {
            if (visit.actualVisitDate?.dateAsString) {
                if (!earliestVisit || 
                    visit.actualVisitDate.dateAsString < earliestVisit.actualVisitDate.dateAsString) {
                    earliestVisit = visit;
                }
            }
        }
        
        if (earliestVisit && earliestVisit.actualVisitDate) {
        // Parse the date string and set to local midnight (00:00:00) to avoid timezone issues
            const dateStr = earliestVisit.actualVisitDate.dateAsString;
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day, 0, 0, 0); // month is 0-indexed
        }
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
 * Finds an appropriate visit date for a patient from PatientInfo.
 * Used when no specific date is selected: returns the reference date (earliest visit) for that patient
 * so the visit checklist shows tasks for that date/event.
 * @param patientInfo The PatientInfo unit, or null
 * @param patientId The patient number/identifier
 * @returns The date to use for the checklist, or undefined if no visits found
 */
export function findAppropriateVisitDate(patientInfo: PatientInfo | null, patientId: string): Date | undefined {
    if (!patientInfo || !patientId) {
        return undefined;
    }
    const patientHistory = findPatientHistoryByPatientNumber(patientInfo.patientHistories, patientId);
    if (!patientHistory || patientHistory.patientVisits.length === 0) {
        return undefined;
    }
    return determineReferenceDate(undefined, patientHistory);
}

/**
 * Creates a timeline for a study configuration as of a specific reference date.
 * Optionally includes patient history events if provided.
 */
export function getTimelineAsOfADate(
    node: StudyConfiguration,
    referenceDate: Date,
    patientHistory?: PatientHistory,
    patientIdentifier?: string
): Timeline {
    new Sim.Sim(); // For some reason, need to do this for Sim to be properly loaded and available in the Scheduler class used by the Simulator.
    const studyConfigurationUnit = node as StudyConfiguration;
    const simulator = new Simulator(studyConfigurationUnit);
    
        simulator.setReferenceDate(referenceDate);
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

/**
 * Generates a timeline chart HTML for a study configuration as of a specific reference date.
 */
export function studyTimelineChart(
    node: StudyConfiguration,
    referenceDate: Date,
    hasPatientKey: boolean = false,
    hasStaffKey: boolean = false
): RtString {
    const timeline = getTimelineAsOfADate(node, referenceDate);
    const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
    const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
    const chartHTML = TimelineChartTemplate.getTimelineAsHTMLBlock(timelineDataAsScript + timelineVisualizationHTML, hasPatientKey, hasStaffKey);
    const html = `<div class="limited-width-container">${chartHTML}</div>`;
    return new RtString(html);
}

/**
 * Generates a timeline chart HTML from a Timeline instance.
 * Automatically detects multi-patient scenarios and includes appropriate keys.
 */
export function getTimelineChartHtml(timeline: Timeline): RtString {
    const isMultiPatient = timeline.getUniquePatientIdentifiers().length > 1;
    const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
    const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline, isMultiPatient);
    const chartHTML = TimelineChartTemplate.getTimelineAsHTMLBlock(timelineDataAsScript + timelineVisualizationHTML, timeline.anyPatientEventInstances(), timeline.anyStaffAvailabilityEventInstances(), isMultiPatient);
    const html = `<div class="limited-width-container">${chartHTML}</div>`;
    return new RtString(html);
}

/**
 * Generates a visit checklist as markdown for a specific date in a study configuration.
 * @param studyConfigurationUnit The study configuration
 * @param targetDate The date to get visits for
 * @param referenceDate Optional reference date for timeline generation (defaults to targetDate)
 * @param showHeadingNumbers Whether to add hierarchical heading numbers (default: true)
 * @returns Markdown string with the visit checklist for that date
 */
export function getVisitChecklistAsMarkdown(
    studyConfigurationUnit: StudyConfiguration,
    targetDate: Date,
    referenceDate?: Date,
    showHeadingNumbers: boolean = false
): string {
    // Get timeline for the reference date (or use the target date as reference if not provided)
    const refDate = referenceDate || targetDate;
    const timeline = getTimelineAsOfADate(studyConfigurationUnit, refDate);

    // Get the visit checklist for the target date
    let markdown = StudyChecklistDocumentTemplate.getVisitForDateAsMarkdown(timeline, targetDate, studyConfigurationUnit);

    // Apply heading numbers if requested (same as getStudyChecklistAsMarkdown)
    if (showHeadingNumbers) {
        markdown = StudyChecklistDocumentTemplate.addHeadingNumbers(markdown);
    }

    return markdown;
}

/**
 * Get visit/event checklist for a specific date as markdown for PDF/Word generation.
 * Uses heading-based rendering (same as Study Checklist) instead of HTML checkboxes.
 *
 * @param studyConfigurationUnit The study configuration
 * @param targetDate The date to get visits for
 * @param referenceDate The reference date for the timeline (e.g., patient enrollment date)
 * @param showHeadingNumbers Whether to add hierarchical heading numbers (default: true)
 * @returns Markdown string with the visit checklist for that date (heading-based format)
 */
export function getVisitChecklistAsMarkdownForPdf(
    studyConfigurationUnit: StudyConfiguration,
    targetDate: Date,
    referenceDate?: Date,
    showHeadingNumbers: boolean = false
): string {
    // Get timeline for the reference date (or use the target date as reference if not provided)
    const refDate = referenceDate || targetDate;
    const timeline = getTimelineAsOfADate(studyConfigurationUnit, refDate);

    // Get the visit checklist for the target date using heading-based format
    let markdown = StudyChecklistDocumentTemplate.getVisitForDateAsMarkdownForPdf(timeline, targetDate, studyConfigurationUnit);

    // Apply heading numbers if requested (same as getStudyChecklistAsMarkdown)
    if (showHeadingNumbers) {
        markdown = StudyChecklistDocumentTemplate.addHeadingNumbers(markdown);
    }

    return markdown;
}

