import { Time } from "language/gen";
import { TimelineInstanceState } from "./TimelineEventInstance";
import { TimelineEventInstance } from "./TimelineEventInstance";
import { Timeline } from "./Timeline";

export class StaffAvailabilityEventInstance extends TimelineEventInstance {
    staffAvailable: number;

    constructor(staffAvailable: number, startDay: number, endDay?: number) {
        super();
        this.startDay = startDay;
        this.endDay = endDay;
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
