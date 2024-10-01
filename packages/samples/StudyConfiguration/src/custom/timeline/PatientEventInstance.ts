import { Time } from "language/gen";
import { TimelineInstanceState } from "./TimelineEventInstance";
import { TimelineEventInstance } from "./TimelineEventInstance";
import { Timeline } from "./Timeline";

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
                this.startDay < scheduledEventInstance.getStartDay() - scheduledEventInstance.getStartDayOfWindow() ||
                this.startDay > scheduledEventInstance.getStartDay() + scheduledEventInstance.getEndDayOfWindow()
            ) {
                classForDisplay = "out-of-window";
            } else if (scheduledEventInstance.startDay !== this.startDay) {
                classForDisplay = "in-window";
            }
        }
        // console.log(
        //     "getClassForDisplay " +
        //         scheduledEventInstance.getName() +
        //         " visitInstanceNumber:" +
        //         this.visitInstanceNumber +
        //         " scheduled day:" +
        //         scheduledEventInstance.startDay +
        //         " window:" +
        //         scheduledEventInstance.getStartDayOfWindow() +
        //         "-" +
        //         scheduledEventInstance.getEndDayOfWindow() +
        //         " patient startDay " +
        //         this.startDay +
        //         " classForDisplay:" +
        //         classForDisplay,
        // );
        return classForDisplay;
    }

    getTitle() {
        const visitInstanceNumber = this.getVisitInstanceNumber() > 1 ? " #" + this.getVisitInstanceNumber() : "";
        return "Patient visit:" + this.getName() + "'" + visitInstanceNumber;
    }
}

class PatientUnAvailableEventInstance extends PatientEventInstance {
    constructor(name: string, startDay: number, endDay?: number) {
        super(startDay, endDay);
        this.eventName = name;
    }

    getClassForDisplay(timeline: Timeline) {
        let classForDisplay = "red";
        return classForDisplay;
    }

    getTitle() {
        return "Patient Unavailable";
    }
}
