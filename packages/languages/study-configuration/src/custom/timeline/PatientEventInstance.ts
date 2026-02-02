import { FreNodeReference } from "@freon4dsl/core";
import { PatientVisitStatus } from "../../language/gen/index.js";
import { Timeline } from "./Timeline.js";
import { TimelineEventInstance, TimelineInstanceState } from "./TimelineEventInstance.js";

export class PatientEventInstance extends TimelineEventInstance {
    eventName: string;
    patientIdentifier: string | undefined = undefined; // Identifier for the patient (e.g., patient number or name)

    getName() {
        return this.eventName;
    }

    getPatientIdentifier(): string | undefined {
        return this.patientIdentifier;
    }

    getTitle() {
        return "Patient event:" + this.getName();
    }
}

export class PatientVisitEventInstance extends PatientEventInstance {
    visitInstanceNumber: number = 1;
    patientVisitStatus: FreNodeReference<PatientVisitStatus> | undefined = undefined;

    constructor(name: string, visitInstanceNumber: number, startDay: number, endDay?: number, patientIdentifier?: string, patientVisitStatus?: FreNodeReference<PatientVisitStatus>) {
        super(startDay, endDay);
        this.eventName = name;
        this.setState(TimelineInstanceState.Active);
        this.visitInstanceNumber = visitInstanceNumber;
        this.patientIdentifier = patientIdentifier;
        this.patientVisitStatus = patientVisitStatus;
    }

    getVisitInstanceNumber() {
        return this.visitInstanceNumber;
    }

    getPatientVisitStatus(): FreNodeReference<PatientVisitStatus> | undefined {
        return this.patientVisitStatus;
    }

    getClassForDisplay(timeline: Timeline) {
        const scheduledEventInstance = timeline.getScheduledEventInstance(this.eventName, this.visitInstanceNumber);
        
        // If no scheduled event found, mark as visit-not-found
        if (scheduledEventInstance === undefined) {
            return "visit-not-found";
        }

        // Status-based classes take precedence over timing-based classes
        // Compare by name - try both the reference name and the referred object's name
        const statusName = this.patientVisitStatus?.name || this.patientVisitStatus?.referred?.name;
        
        // Check for explicit status values first
        if (statusName === "missed") {
            return "missed-visit";
        }
        if (statusName === "canceled") {
            return "canceled-visit";
        }
        if (statusName === "planned") {
            return "planned-visit";
        }
        
        // If status is undefined or completed, fall through to timing-based checks
        // (completed visits use timing-based classes, undefined uses default behavior)

        // Check timing relative to scheduled window
        const offsetStartDay = this.startDay - timeline.getOffsetOfFirstEventInstance();
        const scheduledStartDay = scheduledEventInstance.getStartDay();
        const windowStart = scheduledStartDay - scheduledEventInstance.getStartDayOfWindow();
        const windowEnd = scheduledStartDay + scheduledEventInstance.getEndDayOfWindow();

        if (offsetStartDay < windowStart || offsetStartDay > windowEnd) {
            return "out-of-window";
        }
        if (offsetStartDay !== scheduledStartDay) {
            return "in-window";
        }

        // Visit occurred exactly on the scheduled date (status is completed or undefined)
        return "on-scheduled-date";
    }

    getTitle() {
        const visitInstanceNumber = this.getVisitInstanceNumber() > 1 ? " #" + this.getVisitInstanceNumber() : "";
        return "Patient visit:" + this.getName() + "'" + visitInstanceNumber;
    }

    /*
    This is overridden because visit date is added at the start of the simulation with the 
    day of the visit specified by the user. 
    Because of this it doesn't need to be modified by adding the dayOffsetOfFirstEventInstance.
    */
    getDayAsDate(day: number, timeline: Timeline, toEndOfDay?: boolean): Date {
        let dayAsDate = new Date(timeline.getReferenceDate());
        var correctedDay = day;
        if (day < 0) {
            correctedDay = day - 1;
        }
        dayAsDate.setDate(dayAsDate.getDate() + correctedDay);
        if (toEndOfDay) {
            dayAsDate.setHours(23, 59, 59);
        }
        return dayAsDate;
    }
    // getDayAsDate(day: number, timeline: Timeline, toEndOfDay?: boolean): Date {
    //     return super.getDayAsDate(day, timeline, toEndOfDay);
    // }
}

export class PatientUnAvailableEventInstance extends PatientEventInstance {
    constructor(name: string, startDay: number, endDay?: number, patientIdentifier?: string) {
        super(startDay, endDay);
        this.eventName = name;
        this.patientIdentifier = patientIdentifier;
    }

    getClassForDisplay(timeline: Timeline) {
        let classForDisplay = "not-available ";
        return classForDisplay;
    }

    getTitle() {
        return "Patient Unavailable";
    }

    /*
    This is overridden because unavailability is added at the start of the simulation with the 
    day of the unavailability specified by the user. 
    Because of this it doesn't need to be modified by adding the dayOffsetOfFirstEventInstance.
    */
    getDayAsDate(day: number, timeline: Timeline, toEndOfDay?: boolean): Date {
        let startDateOfTimeline = new Date(timeline.getReferenceDate());
        startDateOfTimeline.setDate(startDateOfTimeline.getDate() + day);
        if (toEndOfDay) {
            startDateOfTimeline.setHours(23, 59, 59);
        }
        return startDateOfTimeline;
    }
}
