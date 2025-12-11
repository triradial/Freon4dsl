import { RtString } from "@freon4dsl/core";
import * as Sim from "@freon4dsl/study-configuration";
import { PatientHistory, PatientInfo, PatientVisit, PatientVisitStatus, Simulator, StudyChecklistDocumentTemplate, StudyConfiguration, TimelineChartTemplate, TimelineTableTemplate } from "@freon4dsl/study-configuration";
import { getTimelineAsOfADate } from "./patient-timeline.js";


export function getTimelineTable(node: StudyConfiguration) {
    let timeline = getTimeline(node);

    const tableHTML = TimelineTableTemplate.getTimeLineTableAndStyles(timeline);
    const html = `<div class="limited-width-container">${tableHTML}</div>`;

    return new RtString(html);
}

export function getTimelineChart(node: StudyConfiguration, hasPatientKey: boolean = false, hasStaffKey: boolean = false) {
    let timeline = getTimeline(node);

    const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
    const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
    const chartHTML = TimelineChartTemplate.getTimelineAsHTMLBlock(timelineDataAsScript + timelineVisualizationHTML, hasPatientKey, hasStaffKey);
    const html = `<div class="limited-width-container">${chartHTML}</div>`;

    return new RtString(html);
}

function getTimeline(node: StudyConfiguration) {
    var simulator;
    new Sim.Sim(); // For some reason, need to do this for Sim to be properly loaded and available in the Scheduler class used by the Simulator.
    let studyConfigurationUnit = node as StudyConfiguration;
    simulator = new Simulator(studyConfigurationUnit);
    simulator.run();
    let timeline = simulator.timeline;

    return timeline;
}

export function getChecklistAsMarkdown(studyConfigurationUnit: StudyConfiguration, showHeadingNumbers: boolean = false) {
    let timeline = getTimeline(studyConfigurationUnit);
    const studyChecklistAsMarkdown = StudyChecklistDocumentTemplate.getStudyChecklistAsMarkdown(studyConfigurationUnit, timeline, showHeadingNumbers);
    return studyChecklistAsMarkdown;
}

export function studyTimelineChart(node: StudyConfiguration, referenceDate: Date, hasPatientKey: boolean = false, hasStaffKey: boolean = false) {
    let timeline = getTimelineAsOfADate(node, referenceDate);

    const timelineDataAsScript = TimelineChartTemplate.getTimelineDataHTML(timeline);
    const timelineVisualizationHTML = TimelineChartTemplate.getTimelineVisualizationHTML(timeline);
    const chartHTML = TimelineChartTemplate.getTimelineAsHTMLBlock(timelineDataAsScript + timelineVisualizationHTML, hasPatientKey, hasStaffKey);
    const html = `<div class="limited-width-container">${chartHTML}</div>`;

    return new RtString(html);
}

export function getVisitChecklistAsMarkdown(studyConfigurationUnit: StudyConfiguration, targetDate: Date, referenceDate?: Date): string {
    // Get timeline for the reference date (or use the target date as reference if not provided)
    const refDate = referenceDate || targetDate;
    let timeline = getTimelineAsOfADate(studyConfigurationUnit, refDate);
    
    // Get the visit checklist for the target date
    const markdown = StudyChecklistDocumentTemplate.getVisitForDateAsMarkdown(timeline, targetDate, studyConfigurationUnit);
    return markdown;
}

/**
 * Converts a DateConcept to a JavaScript Date object
 */
function dateConceptToDate(dateConcept: any): Date | null {
    if (!dateConcept || !dateConcept.day || !dateConcept.month || !dateConcept.year) {
        return null;
    }
    
    const monthMap: { [key: string]: number } = {
        January: 0,
        February: 1,
        March: 2,
        April: 3,
        May: 4,
        June: 5,
        July: 6,
        August: 7,
        September: 8,
        October: 9,
        November: 10,
        December: 11,
    };
    
    const monthName = dateConcept.month?.name || dateConcept.month;
    const monthNumber = monthMap[monthName];
    if (monthNumber === undefined) {
        return null;
    }
    
    return new Date(parseInt(dateConcept.year), monthNumber, parseInt(dateConcept.day));
}

/**
 * Finds the appropriate visit date for a patient based on their visits.
 * Priority:
 * 1. Check if there is a visit today (completed, canceled, or planned)
 * 2. Otherwise, find the first planned visit in the future
 * 
 * @param patientInfo - The PatientInfo model unit containing all patient histories
 * @param patientId - The patient ID to find visits for
 * @returns The date of the appropriate visit, or null if no visit found
 */
export function findAppropriateVisitDate(patientInfo: PatientInfo | null, patientId: string | undefined): Date | null {
    if (!patientInfo || !patientId) {
        return null;
    }
    
    // Find the patient history for this patient
    const patientHistory = patientInfo.patientHistories.find(ph => ph.patient_id === patientId);
    if (!patientHistory || !patientHistory.patientVisits || patientHistory.patientVisits.length === 0) {
        return null;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // First, check if there's a visit today (any status)
    for (const visit of patientHistory.patientVisits) {
        if (!visit.actualVisitDate) continue;
        
        const visitDate = dateConceptToDate(visit.actualVisitDate);
        if (!visitDate) continue;
        
        visitDate.setHours(0, 0, 0, 0);
        
        // Check if visit is today
        if (visitDate.getTime() === today.getTime()) {
            return visitDate;
        }
    }
    
    // If no visit today, find the first planned visit in the future
    const plannedVisits: { visit: PatientVisit; date: Date }[] = [];
    
    for (const visit of patientHistory.patientVisits) {
        if (!visit.actualVisitDate) continue;
        
        const visitDate = dateConceptToDate(visit.actualVisitDate);
        if (!visitDate) continue;
        
        // Check if this is a planned visit
        const status = visit.status?.referred;
        // PatientVisitStatus is a limited type - check if it's planned by comparing with the enum value
        // Using type assertion to access the enum value since TypeScript may not recognize it
        if (status && status === (PatientVisitStatus as any).planned) {
            visitDate.setHours(0, 0, 0, 0);
            if (visitDate >= today) {
                plannedVisits.push({ visit, date: visitDate });
            }
        }
    }
    
    // Sort by date and return the first one
    if (plannedVisits.length > 0) {
        plannedVisits.sort((a, b) => a.date.getTime() - b.date.getTime());
        return plannedVisits[0].date;
    }
    
    return null;
}
