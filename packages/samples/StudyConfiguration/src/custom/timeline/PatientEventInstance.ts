import { TimelineInstanceState } from './TimelineEventInstance';
import { TimelineEventInstance } from "./TimelineEventInstance";


export class PatientEventInstance extends TimelineEventInstance {

  constructor(startDay: number, endDay?: number) {
    super();
    this.startDay = startDay;
    this.endDay = endDay;
    this.setState(TimelineInstanceState.Active);
  }

  getName() {
    // return this.scheduledPeriod.getName();
    return "Patient";
  }

  // getIdOfScheduledPeriod() {
  //   return this.scheduledPeriod.configuredPeriod.freId();
  // }

  setCompleted(onDay: number) {
    this.setState(TimelineInstanceState.Completed);
    this.setEndDay(onDay);
  }
}
