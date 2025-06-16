import { TimelineInstanceState } from "./TimelineEventInstance.js";
import { TimelineEventInstance } from "./TimelineEventInstance.js";
import { Timeline } from "./Timeline.js";

export class PatientEventInstance extends TimelineEventInstance {
    eventName: string;

    getName() {
        return this.eventName;
    }

    getTitle() {
        return "Patient event:" + this.getName();
    }
}

export class PatientVisitEventInstance extends PatientEventInstance {
    visitInstanceNumber: number = 1;

    constructor(name: string, visitInstanceNumber: number, startDay: number, endDay?: number) {
        super(startDay, endDay);
        this.eventName = name;
        this.setState(TimelineInstanceState.Active);
        this.visitInstanceNumber = visitInstanceNumber;
    }

    getVisitInstanceNumber() {
        return this.visitInstanceNumber;
    }

    getClassForDisplay(timeline: Timeline) {
        const scheduledEventInstance = timeline.getScheduledEventInstance(this.eventName, this.visitInstanceNumber);
        let classForDisplay = "on-scheduled-date";
        if (scheduledEventInstance === undefined) {
            classForDisplay = "visit-not-found";
        } else {
            if (
                this.startDay - timeline.getOffsetOfFirstEventInstance() <
                    scheduledEventInstance.getStartDay() - scheduledEventInstance.getStartDayOfWindow() ||
                this.startDay - timeline.getOffsetOfFirstEventInstance() > scheduledEventInstance.getStartDay() + scheduledEventInstance.getEndDayOfWindow()
            ) {
                classForDisplay = "out-of-window";
            } else if (scheduledEventInstance.startDay !== this.startDay - timeline.getOffsetOfFirstEventInstance()) {
                classForDisplay = "in-window";
            }
        }
        return classForDisplay;
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
        let startDateOfTimeline = new Date(timeline.getReferenceDate());
        startDateOfTimeline.setDate(startDateOfTimeline.getDate() + day);
        if (toEndOfDay) {
            startDateOfTimeline.setHours(23, 59, 59);
        }
        return startDateOfTimeline;
    }
}

export class PatientUnAvailableEventInstance extends PatientEventInstance {
    constructor(name: string, startDay: number, endDay?: number) {
        super(startDay, endDay);
        this.eventName = name;
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
