import { Event, Period } from "../../language/gen/index.js";
import { ScheduledEvent } from "./ScheduledEvent.js";

export class ScheduledPeriod {
    configuredPeriod: Period;
    private scheduledEvents: ScheduledEvent[] = [];

    constructor(configuredPeriod: Period) {
        this.configuredPeriod = configuredPeriod;
        const events = (configuredPeriod as { events?: Event[] })?.events ?? [];
        this.scheduledEvents = events
            .filter((e): e is Event => e != null)
            .map((event) => new ScheduledEvent(event));
    }

    getScheduledEvent(eventName: string) {
        return this.scheduledEvents.find((se) => se.getName() === eventName);
    }

    getAllScheduledEvents() {
        return this.scheduledEvents;
    }

    getName() {
        const p = this.configuredPeriod as { name?: string; referred?: { name?: string } };
        return p?.name ?? p?.referred?.name ?? "Period";
    }
}
