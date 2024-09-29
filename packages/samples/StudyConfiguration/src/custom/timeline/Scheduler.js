import { PatientVisit } from "../../language/gen/PatientVisit";
import * as Sim from "../simjs/sim.js"


   /*
    * The Scheduler is based on code copied from on simjs.updated (https://github.com/btelles/simjs-updated) and is used to run the simulations.
    *
    * The Events and Timeline are based on TypeScript classes so they are created externally and passed in to the this.
    */
  export class Scheduler extends Sim.Entity {
    simulation;

    start(...args) {
      this.simulation = args[0];
      // Scheduling starts with all the events that are scheduled on specific days.
      // This must include something that is the study start day that is assumed to be day 0.
      this.scheduleEventsOnSpecificDays();
    }

    getScheduledStudyConfiguration() {
      return this.simulation.scheduledStudyConfiguration;
    }

    getTimeline() {
      return this.simulation.getTimeline();
    }

    getEvents() {
      return this.getScheduledStudyConfiguration().getEvents();
    }

    getCompletedPatientVisits() {
      return this.simulation.getCompletedPatientVisits();
    }

    // Common code for scheduling events.
    #scheduleEvent(schedulingMsg, scheduledEventInstance, timeline, daysToWait) {
      console.log(schedulingMsg + ": '" + scheduledEventInstance.getName() + "' on day: " + timeline.currentDay + " with wait of: " + daysToWait + " days");
      this.setTimer(daysToWait).done(this.eventStarted, this, [scheduledEventInstance]);
      this.setTimer(daysToWait).done(this.eventCompleted, this, [scheduledEventInstance]);
      timeline.setScheduled(scheduledEventInstance);
      scheduledEventInstance.scheduled(this.getScheduledStudyConfiguration(), timeline, daysToWait);
    }

    // Find all the events with First-Scheduled on just a specific day and schedule them.
    scheduleEventsOnSpecificDays() {
      let eventsScheduledOnASpecificDay = this.getScheduledStudyConfiguration().getEventsScheduledOnASpecificDay();
      for (let scheduledEvent of eventsScheduledOnASpecificDay) {
        let timeline = this.getTimeline();
        let daysToWait = scheduledEvent.day(timeline, this.time());
        timeline.setCurrentDay(this.time())
        let scheduledEventInstance = timeline.newScheduledEventInstance(scheduledEvent, this.time() + daysToWait);
        this.#scheduleEvent('Scheduling Specific Day Event', scheduledEventInstance, timeline, daysToWait);
      }
    }

    eventStarted(startedEvent) {
      //TODO: change so timeline.addEvent only adds if not already there
      let timeline = this.getTimeline();
      let currentDay = startedEvent.getScheduledEvent().day(timeline) - 1 + this.getScheduledStudyConfiguration().studyConfiguration.studyStartDayNumber;
      if (isNaN(currentDay)) {
        console.log("Error: Event:'" + startedEvent.getName() + "' has no current day");
      }
      timeline.setCurrentDay(currentDay);
      console.log("Started Event:'" + startedEvent.getName() + "' at time: " + this.time());
      startedEvent.getScheduledEvent().started(this.getScheduledStudyConfiguration(), timeline, this.time());
    }

    eventCompleted(completedEvent) {
      // Complete the event
      console.log("Completed Event:'" + completedEvent.getName() + "' at time: " + this.time());
      let timeline = this.getTimeline();
      completedEvent.startDay = this.time();
      timeline.setCompleted(completedEvent);
      timeline.setCurrentDay(this.time())
      timeline.addEvent(completedEvent);

      // Schedule events that are ready as a result of the completion of the event.
      let readyScheduledEvents = this.getScheduledStudyConfiguration().getEventsReadyToBeScheduled(completedEvent, this.time(), timeline);
      if (readyScheduledEvents.length === 0) {
          console.log('No Events to Schedule');
          if (this.getScheduledStudyConfiguration().allEventsCompleted()) {
            this.getTimeline().printTimelineOfScheduledEventInstances();
            completedEvent.completeCurrentPeriod(this.getTimeline(), this.time());
            if (!!this.getCompletedPatientVisits()) {
              console.log('Adding Patient Visits to Timeline');
              timeline.addPatientVisits(this.getCompletedPatientVisits());
            }
            console.log('Simulation Complete');
          }      
      } else {
        console.log('Scheduling Next Event(s)');
        for (let scheduledEventInstance of readyScheduledEvents) {
          let daysToWait = scheduledEventInstance.getScheduledEvent().daysToWait(completedEvent, timeline, this.time());
          this.#scheduleEvent('Scheduling Event', scheduledEventInstance, timeline, daysToWait);
        }
        console.log("End of Scheduling Next Event(s)");
      }
    }
  }