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
}
