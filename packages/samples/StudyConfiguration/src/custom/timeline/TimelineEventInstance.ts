import { characterSets } from "@bscotch/utility";
import { Timeline } from "./Timeline.js";

export enum TimelineInstanceState {
    Ready,
    Scheduled,
    Active,
    Completed,
}

export abstract class TimelineEventInstance {
    startDay: number; // The day the instance occurred on
    endDay: number; // The day the instance ended on
    state: TimelineInstanceState = TimelineInstanceState.Active;

    constructor(startDay: number, endDay?: number) {
        this.startDay = startDay;
        if (endDay !== undefined) {
            this.endDay = endDay;
        }
    }

    setState(state: TimelineInstanceState) {
        this.state = state;
    }

    getState() {
        return this.state;
    }

    getEndDay(timeline: Timeline) {
        // TODO: determine if undefined should be returned by finding out when this path occurs.
        if (this.endDay === undefined) {
            return timeline.currentDay;
        } else {
            return this.endDay;
        }
    }

    getEndDayAsDateFrom(timeline: Timeline): Date {
        const result = new Date(timeline.getReferenceDate());
        const dayOffsetOfFirstEventInstance = timeline.getOffsetOfFirstEventInstance();
        result.setDate(result.getDate() + this.getEndDay(timeline) + dayOffsetOfFirstEventInstance);
        result.setHours(23, 59, 59);
        return result;
    }

    getEndDayStringAsDateFrom(timeline: Timeline): string {
        return TimelineEventInstance.formatDate(this.getEndDayAsDateFrom(timeline));
    }

    setEndDay(endDay: number) {
        if (endDay == 2) {
            console.log("endDay == 2");
        }
        this.endDay = endDay;
    }

    getStartDay() {
        return this.startDay;
    }

    getDayAsDate(day: number, timeline: Timeline, toEndOfDay?: boolean): Date {
        let result = new Date(timeline.getReferenceDate());
        const dayOffsetOfFirstEventInstance = timeline.getOffsetOfFirstEventInstance();
        // console.log(
        //     "result.getDate:" + result.getDate().toString() + " getStartDay:" + this.getStartDay() + " dayOffsetOfFirstEventInstance:",
        //     dayOffsetOfFirstEventInstance,
        // );
        result.setDate(result.getDate() + day + dayOffsetOfFirstEventInstance);
        if (toEndOfDay) {
            result.setHours(23, 59, 59);
        }
        return result;
    }

    getStartDayAsDate(timeline: Timeline): Date {
        return this.getDayAsDate(this.startDay, timeline);
    }

    getStartDayAsDateString(timeline: Timeline): string {
        return TimelineEventInstance.formatDate(this.getDayAsDate(this.startDay, timeline));
    }

    getEndDayAsDateString(timeline: Timeline): string {
        const toEndOfDay = true;
        let endDayToUse = undefined;
        if (this.endDay === undefined) {
            endDayToUse = this.startDay;
        } else {
            endDayToUse = this.endDay;
        }
        return TimelineEventInstance.formatDate(this.getDayAsDate(endDayToUse, timeline, toEndOfDay));
    }

    getEndOfStartDayAsDateString(timeline: Timeline): string {
        const endOfStartDay = this.getStartDayAsDate(timeline);
        endOfStartDay.setHours(23, 59, 59);
        const result = TimelineEventInstance.formatDate(endOfStartDay);
        return result;
    }

    abstract getName(): string;

    // static formatDate(date: Date): string {
    //   const options: Intl.DateTimeFormatOptions = {
    //       year: 'numeric',
    //       month: '2-digit',
    //       day: '2-digit'
    //   };
    //   return date.toLocaleDateString('en-CA', options).replace(/-/g, ', ');
    // }
    static formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = date.getMonth().toString().padStart(2, "0"); // getMonth() returns 0 for January
        const day = date.getDate().toString().padStart(2, "0");
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");
        return `${year}, ${month}, ${day}, ${hours}, ${minutes}, ${seconds}`;
    }
}
