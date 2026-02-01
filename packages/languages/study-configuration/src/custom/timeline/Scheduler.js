import * as Sim from "../simjs/sim.js";
import TimelineLogger from "./TimelineLogger.js";


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

    getPatientHistory() {
      return this.simulation.getPatientHistory();
    }


    getAvailability() {
      return this.simulation.getAvailability();
    }
    // Common code for scheduling events.
  #scheduleEvent(schedulingMsg, scheduledEventInstance, timeline, daysToWait) {
      TimelineLogger.log(schedulingMsg + ": '" + scheduledEventInstance.getName() + "' on day: " + timeline.currentDay + " with wait of: " + daysToWait + " days");
      this.setTimer(daysToWait).done(this.eventStarted, this, [scheduledEventInstance]);
      this.setTimer(daysToWait).done(this.eventCompleted, this, [scheduledEventInstance]);
      timeline.setScheduled(scheduledEventInstance);
      scheduledEventInstance.scheduled(this.getScheduledStudyConfiguration(), timeline, daysToWait);
    }

    // Find all the events with First-Scheduled on just a specific day and schedule them.
    scheduleEventsOnSpecificDays() {
      console.log("[Scheduler] scheduleEventsOnSpecificDays called");
      let eventsScheduledOnASpecificDay = this.getScheduledStudyConfiguration().getEventsScheduledOnASpecificDay();
      console.log("[Scheduler] Events scheduled on specific days:", eventsScheduledOnASpecificDay.length, 
        eventsScheduledOnASpecificDay.map(e => e.getName()));
      
      for (let scheduledEvent of eventsScheduledOnASpecificDay) {
        console.log("[Scheduler] Processing event:", scheduledEvent.getName());
        let timeline = this.getTimeline();
        let daysToWait = scheduledEvent.day(timeline, this.time());
        console.log("[Scheduler] daysToWait for", scheduledEvent.getName(), "=", daysToWait);
        timeline.setCurrentDay(this.time())
        let scheduledEventInstance = timeline.newScheduledEventInstance(scheduledEvent, this.time() + daysToWait);
        this.#scheduleEvent('Scheduling Specific Day Event', scheduledEventInstance, timeline, daysToWait);
      }
    }

    eventStarted(startedEvent) {
      let timeline = this.getTimeline();
      // let currentDay = startedEvent.getScheduledEvent().day(timeline) - 1 + this.getScheduledStudyConfiguration().studyConfiguration.studyStartDayNumber;
      // if (isNaN(currentDay)) {
      //   TimelineLogger.log("Error: Event:'" + startedEvent.getName() + "' has no current day");
      // }
      timeline.setCurrentDay(this.time());
      TimelineLogger.log("Started Event:'" + startedEvent.getName() + "' at time: " + this.time());
      startedEvent.getScheduledEvent().started(this.getScheduledStudyConfiguration(), timeline, this.time());
      timeline.addEvent(startedEvent);
    }

    eventCompleted(completedEvent) {
      // Complete the event
      TimelineLogger.log("Completed Event:'" + completedEvent.getName() + "' at time: " + this.time());
      console.log("[Scheduler] eventCompleted:", completedEvent.getName(), "at time:", this.time());
      let timeline = this.getTimeline();
      completedEvent.endDay = this.time();
      timeline.setCompleted(completedEvent);
      timeline.setCurrentDay(this.time())
      timeline.addEvent(completedEvent); // This should not be needed because it was added in eventStarted()
      
      // Debug: Check what's on the timeline now
      console.log("[Scheduler] Timeline now has", timeline.getDays().length, "days. Events on timeline:", 
        timeline.getDays().flatMap(d => d.events.map(e => e.getName())));

      // Schedule events that are ready as a result of the completion of the event.
      let readyScheduledEvents = this.getScheduledStudyConfiguration().getEventsReadyToBeScheduled(completedEvent, this.time(), timeline);
      console.log("[Scheduler] Found", readyScheduledEvents.length, "events ready to be scheduled");
      if (readyScheduledEvents.length === 0) {
          TimelineLogger.log('No Events to Schedule');
          if (this.getScheduledStudyConfiguration().allEventsCompleted()) {
            this.getTimeline().printTimelineOfScheduledEventInstances();
            completedEvent.completeCurrentPeriod(this.getTimeline(), this.time());
            if (!!this.getPatientHistory()) {
              // TODO: consider moving this to the timeline. Question is whether the events should be added before or after the simulation is complete.
              timeline.addPatientEvents(this.getPatientHistory());
            }
            if (!!this.getAvailability()) {
              timeline.addStaffAvailability(this.getAvailability());
            }

            TimelineLogger.log('Simulation Complete');
          }      
      } else {
        TimelineLogger.log('Scheduling Next Event(s)');
        for (let scheduledEventInstance of readyScheduledEvents) {
          let daysToWait = scheduledEventInstance.getScheduledEvent().daysToWait(completedEvent, timeline, this.time());
          this.#scheduleEvent('Scheduling Event', scheduledEventInstance, timeline, daysToWait);
        }
        TimelineLogger.log("End of Scheduling Next Event(s)");
      }
    }
  }