import { TimelineInstanceState } from "./TimelineEventInstance.js";
import { TimelineEventInstance } from "./TimelineEventInstance.js";
import { Timeline } from "./Timeline.js";

export class StaffAvailabilityEventInstance extends TimelineEventInstance {
    staffAvailable: number;

    constructor(staffAvailable: number, startDay: number, endDay?: number) {
        super(startDay, endDay);
        this.setState(TimelineInstanceState.Completed);
        this.staffAvailable = staffAvailable;
    }

    getName() {
        return this.getStaffAvailable().toString();
    }

    getStaffAvailable(): number {
        return this.staffAvailable;
    }

    /*
    This is overridden because availability is added at the start of the simulation with the 
    day of the availability calculated relative to the reference date. 
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
