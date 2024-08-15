import { StudyConfigurationModelEnvironment } from "../../config/gen/StudyConfigurationModelEnvironment";  
import {StudyConfiguration, Period, Event, EventSchedule, Day, PlusExpression, When, NumberLiteralExpression, EventReference, RepeatCondition, RepeatUnit, Days, EventWindow, EventState, SimpleOperators, TimeAmount, StudyStart, TimeUnit, Weekly } from "../../language/gen/index";
import { FreLionwebSerializer, FreLogger, FreNodeReference } from "@freon4dsl/core";
import { EventInstance, TimelineInstanceState, Timeline, PeriodInstance } from "../timeline/Timeline";
import { ScheduledEvent, ScheduledEventState } from "../timeline/ScheduledEvent";
import { ScheduledPeriod } from "../timeline/ScheduledPeriod";
import * as path from 'path';
import * as fs from 'fs';
import { TimelineScriptTemplate } from "../templates/TimelineScriptTemplate";

// Create a EventSchedule DSL element and set its 'eventStart' to a 'When' DSL element. 
// The When is populated using the parameters. These parameters match the fields of the When.startWhen EventReference. 
// The EventSchedule's EventWindow, RepeatExpression, and EventTimeOfDay are empty.
export function createWhenEventSchedule(eventName: string, eventState: EventState, operator: SimpleOperators, timeAmount: TimeAmount) {
  let referenceToOperator = FreNodeReference.create(operator, "SimpleOperators");
  // console.log("createWhenEventSchedule eventName: " + eventName + " eventState: " + eventState + " operator: " + operator + " timeAmount: " + timeAmount.value + " " + timeAmount.unit.name);
  let referenceToEventState = FreNodeReference.create(eventState, "EventState");
  const freNodeReference = FreNodeReference.create<Event>(eventName, "Event");
  let referencedEvent = freNodeReference;
  const startWhenEventReference = EventReference.create({'operator': referenceToOperator, 'timeAmount': timeAmount, 'eventState': referenceToEventState, 'event': referencedEvent}); 

  const whenExpression = When.create({ 'startWhen': startWhenEventReference});
  const eventSchedule = EventSchedule.create({ 'eventStart': whenExpression});
  return eventSchedule;
}

// Create a EventSchedule DSL element and set its 'eventStart' to a 'When' DSL element defined by a binary expression. 
// export function createStudyStartExpression(eventName: string, binaryExpression: BinaryExpression) {
//   let eventSchedule = new EventSchedule(eventName + binaryExpression.toString());
//   eventSchedule.eventStart = binaryExpression;
//   return eventSchedule;
// }


export function createEventWindow(uniquePrefix:string, daysBefore: number, daysAfter: number) {
  //TODO: change new to create
  let eventWindow = new EventWindow("EventWindow");
  let daysBeforeDay = new Days(uniquePrefix + "DaysBefore")
  daysBeforeDay.count = 1;
  let daysAfterDay = new Days(uniquePrefix + "DaysAfter")
  daysAfterDay.count = 1;
  eventWindow.daysBefore = daysBeforeDay;
  eventWindow.daysAfter = daysAfterDay;
  return eventWindow;
}


// Create a EventSchedule DSL element and set its 'eventStart' to a 'Day' DSL element starting 'startDay'. 
export function createEventScheduleStartingOnADay(uniquePrefix: string, startDay: number) {
  let day = Day.create({ 'startDay': startDay});
  let eventWindow = createEventWindow(uniquePrefix, 1, 1);
  let eventSchedule = EventSchedule.create({ 'eventStart': day, 'eventWindow': eventWindow});  
  return eventSchedule;
}

export function createDay1EventScheduleThatRepeatsWeekly(eventName: string, numberOfRepeats: number) {
  let eventSchedule = createEventScheduleStartingOnADay(eventName, 1);
  let repeatCondition = new RepeatCondition("RepeatCount-" + eventName);
  repeatCondition.maxRepeats = numberOfRepeats;
  repeatCondition.repeatUnit = new Weekly();
  eventSchedule.eventRepeat = repeatCondition;
  return eventSchedule;
}

// Add a Event DSL element to a Period DSL element.
export function createEventAndAddToPeriod(period: Period, eventName: string, eventSchedule: EventSchedule): Event {
  let event = new Event(eventName);
  event.name = eventName; 
  event.schedule = eventSchedule;
  period.events.push(event);
  return event;
}

/* Add a Period DSL element containing two Events to the Study Configuration:
 * - First event named 'event1Name' is First Scheduled on 'event1Day'
 * - Second event named 'event2Name' is First Scheduled at 'StudyStart + event2Day' .
 * Return the updated Study Configuration.
 */
export function addAPeriodWithEventOnDayAndEventUsingStudyStart(studyConfiguration: StudyConfiguration, periodName: string, event1Name: string, event1Day: number, event2Name: string, event2DaysAfterStudyStart ): StudyConfiguration {
  let period = new Period(periodName);
  period.name = periodName;

  let dayEventSchedule = createEventScheduleStartingOnADay(event1Name, event1Day);
  createEventAndAddToPeriod(period, event1Name, dayEventSchedule);

  const studyStart = PlusExpression.create({left:  StudyStart.create({}), right: NumberLiteralExpression.create({value:event2DaysAfterStudyStart})})
  let eventSchedule = EventSchedule.create({ 'eventStart': studyStart});
  createEventAndAddToPeriod(period, event2Name, eventSchedule);

  studyConfiguration.periods.push(period);
  return studyConfiguration;
}


// Event 1 is First Scheduled on event1Day and Event 2 is First Scheduled When event1 completes + event2DaysAfterEvent1
//
export function addEventScheduledOffCompletedEvent(studyConfiguration: StudyConfiguration, periodName: string, event1Name: string, event1Day: number, event2Name: string, event2DaysAfterEvent1: number ): StudyConfiguration {
  let period = new Period(periodName);
  period.name = periodName;

  let dayEventSchedule = createEventScheduleStartingOnADay(event1Name, event1Day);
  let firstEvent = createEventAndAddToPeriod(period, event1Name, dayEventSchedule);

  const timeUnit = FreNodeReference.create(TimeUnit.days, "TimeUnit");
  console.log("addEventScheduledOffCompletedEvent timeUnit: " + timeUnit.name);
  const timeAmount = TimeAmount.create({ 'value': event2DaysAfterEvent1, 'unit': timeUnit});
  let when = createWhenEventSchedule(event2Name, EventState.completed, SimpleOperators.plus, timeAmount);
  createEventAndAddToPeriod(period, event2Name, when);

  studyConfiguration.periods.push(period);
  return studyConfiguration;
}

export interface EventsToAdd {
  eventName: string;
  eventDay: number;
  repeat: number;
  period: string;
}

/*
  * eventsToAdd: An array of EventsToAdd objects. Each object contains the following fields:
  * - eventName: The name of the event to add.
  * - eventDay: The number of days the event is scheduled off the previous event. Note this is a confusing name!
  * - period: The name of the period the event belongs to.
  * 
  * For each period in eventsToAdd, add a Period DSL element containing Events:
  * - The first event of first period is First Scheduled on its eventDay.
  * - Subsequent events are scheduled off the previous event.
  * 
  * Return the updated Study Configuration.
  */
export function addEventsScheduledOffCompletedEvents(studyConfiguration: StudyConfiguration, eventsToAdd: EventsToAdd[]  ): StudyConfiguration {
  let periodName = eventsToAdd[0].period;
  let period = new Period(periodName);
  period.name = periodName;
  // Setup the study start event
  console.log("Adding the first event: " + eventsToAdd[0].eventName + " day: " + eventsToAdd[0].eventDay + " to period: " + periodName);
  let dayEventSchedule = createEventScheduleStartingOnADay(eventsToAdd[0].eventName, eventsToAdd[0].eventDay);
  let previousEvent = createEventAndAddToPeriod(period, eventsToAdd[0].eventName, dayEventSchedule);
  studyConfiguration.periods.push(period);

  // Add subsequent events scheduled off the previous event
  let timeAmount = null;
  let isFirstEvent = true;
  eventsToAdd.forEach(eventToAdd => {
    console.log("current period: "+ periodName + " eventToAdd: " + eventToAdd.eventName + " day: " + eventToAdd.eventDay + " to period: " + eventToAdd.period);
    if (isFirstEvent) { // Skip the first event as it is already added
      isFirstEvent = false;
      return; // return here is to break out of the forEach loop
    }
    let newPeriod = false;
    let eventReference = new EventReference(eventToAdd.eventName);
    if (periodName !== eventToAdd.period) {
      console.log("Creating new period: " + eventToAdd.period);
      periodName = eventToAdd.period;
      period = new Period(periodName);
      period.name = periodName;
      newPeriod = true;
    }    
    let freNodeReference = FreNodeReference.create(previousEvent, "Event");
    eventReference.event = freNodeReference;
    let timeUnit = FreNodeReference.create(TimeUnit.days, "TimeUnit");
    timeAmount = TimeAmount.create({ 'value': eventToAdd.eventDay, 'unit': timeUnit});
    console.log("addEventsScheduledOffCompletedEvents  eventToAdd: " + eventToAdd.eventName + " at " + timeAmount.value + " " + timeUnit.name + " after: " + previousEvent.name);
    let when = createWhenEventSchedule(previousEvent.name, EventState.completed, SimpleOperators.plus, timeAmount);
    previousEvent = createEventAndAddToPeriod(period, eventToAdd.eventName, when);
    if (newPeriod) {
      // console.log("Adding the new period: " + periodName);
      studyConfiguration.periods.push(period);
    }
  });
  // logPeriodsAndEvents("addEventsScheduledOffCompletedEvents",studyConfiguration);
  return studyConfiguration;
}

export function logPeriodsAndEvents(prefix: string, studyConfiguration: StudyConfiguration) {
  let output = prefix + " # periods: " + studyConfiguration.periods.length + "\n";
  studyConfiguration.periods.forEach(period => {
    output += "Period: " + period.name + " # events: " + period.events.length + "\n";
    period.events.forEach(event => {
      output += "  Event: " + event.name + "\n";
    });
  });
  console.log(output);
}

export function addRepeatingEvents(studyConfiguration: StudyConfiguration, periodName: string, eventsToAdd: EventsToAdd[]): StudyConfiguration {
  let period = new Period(periodName);
  period.name = periodName;
  // Setup the study start event
  let dayEventSchedule = createDay1EventScheduleThatRepeatsWeekly(eventsToAdd[0].eventName, eventsToAdd[0].repeat);
  let event = createEventAndAddToPeriod(period, eventsToAdd[0].eventName, dayEventSchedule);
  studyConfiguration.periods.push(period);
  return studyConfiguration;
}

/*
 * Add to the timeline an Event and if not already there add the Period it belongs to.
 * - studyConfiguration: The StudyConfiguration containing the DSL defined Period and Event for which the scheduled Event and Period are added.
 * - periodNumber: The index of the Period in the StudyConfiguration.periods array. TODO: Change to searching by period name
 *  
*/
export function addEventAndInstanceToTimeline(studyConfiguration: StudyConfiguration, periodNumber: number, eventName: string, dayEventCompleted: number, timeline: Timeline, eventState: ScheduledEventState, periodState: TimelineInstanceState, nameOfPeriodToAddEventTo: string, dayPeriodStarted?: number, dayPeriodEnded?: number) : EventInstance {
  let scheduledPeriodToAddEventTo = null;
  let currentPeriodInstance = timeline.getPeriodInstanceFor(nameOfPeriodToAddEventTo);
  if (currentPeriodInstance === undefined) { // The period is not already on the timeline, so add it
    let configuredPeriod = studyConfiguration.periods[periodNumber]; 
    scheduledPeriodToAddEventTo = new ScheduledPeriod(configuredPeriod);
    let periodInstance = new PeriodInstance(scheduledPeriodToAddEventTo, dayPeriodStarted, dayPeriodEnded);
    periodInstance.setState(periodState);
    timeline.addEvent(periodInstance);
  } else {
    scheduledPeriodToAddEventTo = currentPeriodInstance.scheduledPeriod; // Add the new event to the period that was previously added to the timeline
    if (periodState === TimelineInstanceState.Completed) {
      currentPeriodInstance.setCompleted(dayPeriodEnded)
    }
  }
  let scheduledEvent = scheduledPeriodToAddEventTo.getScheduledEvent(eventName);
  scheduledEvent.state = eventState;
  let eventInstance = new EventInstance(scheduledEvent, dayEventCompleted);
  eventInstance.state = TimelineInstanceState.Completed;
  timeline.addEvent(eventInstance);
  return eventInstance;
}

export function loadModel(modelFolderName: string, modelName: string): StudyConfiguration {
  FreLogger.muteAllLogs();
  // const studyFolderPath: string = path.resolve(__dirname, '..','__tests__', 'modelstore', modelFolderName);
  console.log("__dirname:"+__dirname);
  let studyConfigurationModelEnvironment = StudyConfigurationModelEnvironment.getInstance();
  const studyFolderPath: string = path.resolve(__dirname, '..','..', '..','..', '..', 'server', 'modelstore', modelFolderName);
  console.log("studyFolderPath (TODO: move from tests folder):"+studyFolderPath);
  const serializer = new FreLionwebSerializer();
  let metaModel = JSON.parse(fs.readFileSync(`${studyFolderPath}/${modelName}.json`).toString());
  const ts = serializer.toTypeScriptInstance(metaModel);
  let modelUnit: StudyConfiguration = ts as StudyConfiguration;
  logPeriodsAndEvents("loadModel", modelUnit);
  const validator = studyConfigurationModelEnvironment.validator;
  const errors = validator.validate(modelUnit);
  return modelUnit;
}

export function generateChartAndSave(timeline: Timeline): string {
  let timelineDataAsScript = TimelineScriptTemplate.getTimelineDataHTML(timeline);
  let timelineVisualizationHTML = TimelineScriptTemplate.getTimelineVisualizationHTML(timeline);
  // Save full HTML of chart for viewing / debugging
  const html = timelineDataAsScript + timelineVisualizationHTML;
  TimelineScriptTemplate.saveTimeline(html);
  return html;
}
  




