import { Time } from "language/gen";
import { TimelineInstanceState } from "./TimelineEventInstance";
import { TimelineEventInstance } from "./TimelineEventInstance";
import { Timeline } from "./Timeline";

export class PatientEventInstance extends TimelineEventInstance {
    eventName: string;
    visitInstanceNumber: number = 1;

    constructor(name: string, visitInstanceNumber: number, startDay: number, endDay?: number) {
        super();
        this.startDay = startDay;
        this.endDay = endDay;
        this.eventName = name;
        this.setState(TimelineInstanceState.Active);
        this.visitInstanceNumber = visitInstanceNumber;
    }

    getName() {
        // return this.scheduledPeriod.getName();
        return this.eventName;
    }

    getVisitInstanceNumber() {
        return this.visitInstanceNumber;
    }

    // getIdOfScheduledPeriod() {
    //   return this.scheduledPeriod.configuredPeriod.freId();
    // }

    setCompleted(onDay: number) {
        this.setState(TimelineInstanceState.Completed);
        this.setEndDay(onDay);
    }

    getClassForDisplay(timeline: Timeline) {
        timeline.printTimelineOfScheduledEventInstances();
        const scheduledEventInstance = timeline.getScheduledEventInstance(this.eventName, this.visitInstanceNumber);
        let classForDisplay = "patient";
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
}
