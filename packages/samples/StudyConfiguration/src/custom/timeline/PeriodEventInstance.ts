import { ScheduledPeriod } from "./ScheduledPeriod";
import { TimelineInstanceState } from './TimelineEventInstance';
import { TimelineEventInstance } from "./TimelineEventInstance";


export class PeriodEventInstance extends TimelineEventInstance {

  scheduledPeriod: ScheduledPeriod;

  constructor(scheduledPeriod: ScheduledPeriod, startDay: number, endDay?: number) {
    super();
    this.scheduledPeriod = scheduledPeriod;
    this.startDay = startDay;
    this.endDay = endDay;
    this.setState(TimelineInstanceState.Active);
  }

  getName() {
    return this.scheduledPeriod.getName();
  }

  getIdOfScheduledPeriod() {
    return this.scheduledPeriod.configuredPeriod.freId();
  }

  setCompleted(onDay: number) {
    this.setState(TimelineInstanceState.Completed);
    this.setEndDay(onDay);
  }
}
