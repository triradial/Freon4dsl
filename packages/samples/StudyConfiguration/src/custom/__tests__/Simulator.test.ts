import * as Sim from "../simjs/sim.js"
import { Timeline, EventInstance, PeriodInstance, TimelineInstance, TimelineInstanceState } from "../timeline/Timeline";
import { Simulator, } from "../timeline/Simulator";
import { StudyConfiguration, Period, When, StudyConfigurationModel } from "../../language/gen/index";
import * as utils from "./Utils";
import { TimelineScriptTemplate } from "../templates/TimelineScriptTemplate";
import { TimelineTableTemplate } from "../templates/TimelineTableTemplate";
import { EventsToAdd, addEventAndInstanceToTimeline } from "./Utils";
import { ScheduledEventState } from "../timeline/ScheduledEvent";
import { FreUtils } from "@freon4dsl/core";
import { StudyConfigurationModelEnvironment } from "../../config/gen/StudyConfigurationModelEnvironment";

describe ("Study Simulation", () => {
  var simulator;
  var studyConfigurationUnit: StudyConfiguration;
  var studyConfigurationModel: StudyConfigurationModel;
  const modelName = "TestStudyModel"; // The name used for all the tests that don't load their own already named model. No semantic meaning.
  
  beforeEach(() => {
    new Sim.Sim(); // For some reason, need to do this for Sim to be properly loaded and available in the Scheduler class used by the Simulator.
    let studyConfigurationModelEnvironment = StudyConfigurationModelEnvironment.getInstance();
    studyConfigurationModel = studyConfigurationModelEnvironment.newModel(modelName) as StudyConfigurationModel;
    studyConfigurationUnit = studyConfigurationModel.newUnit("StudyConfiguration") as StudyConfiguration;
    simulator = new Simulator(studyConfigurationUnit);
  });

  describe("Simulation of Trial Events to Generate the Timeline", () => {

    it("generates a one visit timeline for a visit on day 1", () => {
        // GIVEN a study configuration with one period and one event
        let eventSchedule = utils.createEventScheduleStartingOnADay("Visit 1", 1);
        let period = new Period("Screening");
        utils.createEventAndAddToPeriod(period, "Visit 1", eventSchedule);
        studyConfigurationUnit.periods.push(period);

        // WHEN the study is simulated and a timeline is generated
        let simulator = new Simulator(studyConfigurationUnit);
        simulator.run();

        // Then the generated timeline has one event on the expected event day
        let timeline = simulator.timeline;
        let expectedTimeline = new Timeline()
        addEventAndInstanceToTimeline(studyConfigurationUnit, 0, "Visit 1", 1, expectedTimeline, ScheduledEventState.Completed, TimelineInstanceState.Completed, "Screening", 1,1)
        expectedTimeline.setCurrentDay(1);

        let eventFromTimeline = timeline.days[0].events[0];
        let event1FromExpectedTimeline = expectedTimeline.days[0].events[0];
        expect(eventFromTimeline).toEqual(event1FromExpectedTimeline);
        // expect(timeline.days[0].events[1]).toEqual(expectedTimeline.days[0].events[1]);
        // expect(timeline).toEqual(expectedTimeline);  

        utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging
    });

    it("generates a two visit timeline with a visit on day 1 and 7", () => {
      // GIVEN a study configuration with one period and two events
      let period = Period.create({'$id': FreUtils.ID(),'name':'Screening'});
      studyConfigurationUnit.periods.push(period);
      let eventSchedule = utils.createEventScheduleStartingOnADay("Visit 1", 1);
      utils.createEventAndAddToPeriod(period, "Visit 1", eventSchedule);
      eventSchedule = utils.createEventScheduleStartingOnADay("Visit 2", 7);
      utils.createEventAndAddToPeriod(period, "Visit 2", eventSchedule);

      // WHEN the study is simulated and a timeline is generated
      let simulator = new Simulator(studyConfigurationUnit);
      simulator.run();
      let timeline = simulator.timeline;

      // Then the generated timeline has two events on the expected event days
      let expectedTimeline = new Timeline()
      addEventAndInstanceToTimeline(studyConfigurationUnit, 0, "Visit 1", 1, expectedTimeline, ScheduledEventState.Completed, TimelineInstanceState.Completed, "Screening",1)
      addEventAndInstanceToTimeline(studyConfigurationUnit, 0, "Visit 2", 7, expectedTimeline, ScheduledEventState.Completed, TimelineInstanceState.Completed, "Screening",1,7)
      expectedTimeline.setCurrentDay(7);

      expect(timeline).toEqual(expectedTimeline);  
    });


    it("generates a two visit timeline for a visit 7 days after the study start day", () => {
        // GIVEN a study configuration with one period and two events
        studyConfigurationUnit = utils.addAPeriodWithEventOnDayAndEventUsingStudyStart(studyConfigurationUnit, "Screening", "StudyStart", 0, "Visit 2", 7);

        // WHEN the study is simulated and a timeline is generated
        let simulator = new Simulator(studyConfigurationUnit);
        simulator.run();
        let timeline = simulator.timeline;

        // Then the generated timeline has two events on the expected event days
        let expectedTimeline = new Timeline()
        addEventAndInstanceToTimeline(studyConfigurationUnit, 0, "StudyStart", 0, expectedTimeline, ScheduledEventState.Completed, TimelineInstanceState.Completed, "Screening",0)
        // TODO: Decide whether the period completes on the day the visit completes or the day after. Currently it is the day after.
        addEventAndInstanceToTimeline(studyConfigurationUnit, 0, "Visit 2", 7, expectedTimeline, ScheduledEventState.Completed, TimelineInstanceState.Completed, "Screening",0,7)
        expectedTimeline.setCurrentDay(7);

        utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

        expect(timeline).toEqual(expectedTimeline);  
    });

    it("generates a two visit timeline for a visit in the second period 7 days after the end of the first visit", () => {
      // GIVEN a study configuration with one period and two events
      let listOfEventsToAdd: EventsToAdd[] = [
        { eventName: "Visit 1", eventDay: 1, repeat: 0, period: "Screening"},
        { eventName: "Visit 2", eventDay: 7, repeat: 0, period: "Treatment"}
      ];
      studyConfigurationUnit = utils.addEventsScheduledOffCompletedEvents(studyConfigurationUnit, listOfEventsToAdd);

      // WHEN the study is simulated and a timeline is generated
      let simulator = new Simulator(studyConfigurationUnit);
      simulator.run();
      let timeline = simulator.timeline;

      // Then the generated timeline has two events on the expected event days
      let expectedTimeline = new Timeline()
      addEventAndInstanceToTimeline(studyConfigurationUnit, 0, "Visit 1", 1, expectedTimeline, ScheduledEventState.Completed, TimelineInstanceState.Completed, "Screening",1,7)
      expectedTimeline.days[0].events[0].state = TimelineInstanceState.Completed;
      addEventAndInstanceToTimeline(studyConfigurationUnit, 1, "Visit 2", 8, expectedTimeline, ScheduledEventState.Completed, TimelineInstanceState.Completed, "Treatment",8,8)
      expectedTimeline.setCurrentDay(8);

      // Checking the specific timeline events to be more explict about what is being tested
      expect(expectedTimeline.days[0].events[0]).toEqual(timeline.days[0].events[0]);
      expect(expectedTimeline.days[0].events[1]).toEqual(timeline.days[0].events[1]);
      expect(expectedTimeline.days[1].events[0]).toEqual(timeline.days[1].events[0]);
      expect(expectedTimeline.days[1].events[1]).toEqual(timeline.days[1].events[1]);
      // Add this check back if there is a chance some other detail is off
      // expect(timeline).toEqual(expectedTimeline);  
    });

    it("generates a three visit timeline for visits 7 days after the end of the previous visit", () => {
      // GIVEN a study configuration with one period and two events
      let listOfEventsToAdd: EventsToAdd[] = [
        { eventName: "Visit 1", eventDay: 1, repeat: 0, period: "Screening"},
        { eventName: "Visit 2", eventDay: 7, repeat: 0, period: "Treatment"},
        { eventName: "Visit 3", eventDay: 7, repeat: 0, period: "Treatment"}
      ];
      studyConfigurationUnit = utils.addEventsScheduledOffCompletedEvents(studyConfigurationUnit, listOfEventsToAdd);

      // WHEN the study is simulated and a timeline is generated
      let simulator = new Simulator(studyConfigurationUnit);
      simulator.run();
      let timeline = simulator.timeline;

      // Then the generated timeline has two events on the expected event days
      let expectedTimeline = new Timeline()
      addEventAndInstanceToTimeline(studyConfigurationUnit, 0, "Visit 1", 1, expectedTimeline, ScheduledEventState.Completed, TimelineInstanceState.Completed, "Screening",1,7);
      addEventAndInstanceToTimeline(studyConfigurationUnit, 1, "Visit 2", 8, expectedTimeline, ScheduledEventState.Completed, TimelineInstanceState.Completed, "Treatment",8);
      addEventAndInstanceToTimeline(studyConfigurationUnit, 1, "Visit 3", 15, expectedTimeline, ScheduledEventState.Completed, TimelineInstanceState.Completed, "Treatment",8,15);
      expectedTimeline.setCurrentDay(15);

      expect(expectedTimeline.days[0].events[0]).toEqual(timeline.days[0].events[0]);
      expect(expectedTimeline.days[0].events[1]).toEqual(timeline.days[0].events[1]);
      expect(expectedTimeline.days[1].events[0]).toEqual(timeline.days[1].events[0]);
      expect(expectedTimeline.days[1].events[1]).toEqual(timeline.days[1].events[1]);
      expect(timeline).toEqual(expectedTimeline);  
    });

    it("generates a three visit timeline for a visit that repeats twice", () => {
      // GIVEN a study configuration with one period and two events
      let listOfEventsToAdd: EventsToAdd[] = [
        { eventName: "Visit 1", eventDay: 1, repeat: 2, period: "Screening"},
      ];
      studyConfigurationUnit = utils.addRepeatingEvents(studyConfigurationUnit, "Screening", listOfEventsToAdd);

      // WHEN the study is simulated and a timeline is generated
      let simulator = new Simulator(studyConfigurationUnit);
      simulator.run();
      let timeline = simulator.timeline;

      // Then the generated timeline has three instances of the repeating event on the expected days
      let expectedTimeline = new Timeline()
      let eventInstance1 = addEventAndInstanceToTimeline(studyConfigurationUnit, 0, "Visit 1", 1, expectedTimeline, ScheduledEventState.Completed, TimelineInstanceState.Completed, "Screening",1,15);
      expectedTimeline.setCompleted(eventInstance1);
      let eventInstance2 = new EventInstance(eventInstance1.scheduledEvent, 8);
      expectedTimeline.setCompleted(eventInstance2);
      expectedTimeline.addEvent(eventInstance2);
      let eventInstance3 = new EventInstance(eventInstance1.scheduledEvent, 15);
      expectedTimeline.setCompleted(eventInstance3);
      expectedTimeline.addEvent(eventInstance3);
      expectedTimeline.setCurrentDay(15);

      expect(expectedTimeline.days[0].events[0]).toEqual(timeline.days[0].events[0]);
      expect(expectedTimeline.days[0].events[1]).toEqual(timeline.days[0].events[1]);
      expect(expectedTimeline.days[1].events[0]).toEqual(timeline.days[1].events[0]);
      expect(timeline).toEqual(expectedTimeline);  
    });

    it ("can access the first instance of a period on the timeline" , () => {
      // GIVEN a study configuration with one period and one event
      let eventSchedule = utils.createEventScheduleStartingOnADay("Visit 1", 1);
      let period = Period.create({'$id': FreUtils.ID(),'name':'Screening'});
      let scheduledEvent = utils.createEventAndAddToPeriod(period, "Visit 1", eventSchedule);
      studyConfigurationUnit.periods.push(period);

      // WHEN the study is simulated with no period is active yet and a timeline is generated
      let simulator = new Simulator(studyConfigurationUnit);
      simulator.run();

      // Then the generated timeline has one event on the expected event day
      let timeline = simulator.timeline;
      let expectedTimeline = new Timeline();
      let scheduledPeriod = simulator.scheduledStudyConfiguration.scheduledPeriods[0];
      let periodInstance = new PeriodInstance(scheduledPeriod, 1);
      periodInstance.setCompleted(1);
      expectedTimeline.addEvent(periodInstance as unknown as TimelineInstance);
      expectedTimeline.setCurrentDay(1);

      expect((timeline.getPeriods()[0] as PeriodInstance).scheduledPeriod.getName()).toEqual("Screening");
      expect(expectedTimeline.getPeriods()[0]).toEqual(timeline.getPeriods()[0]); // First instance on the timeline should be the period
    });
 
    it ("can access the second instance of a period on the timeline" , () => {
      // GIVEN a study configuration with two periods and two events
      let listOfEventsToAdd: EventsToAdd[] = [
        { eventName: "Visit 1", eventDay: 1, repeat: 0, period: "Screening"},
        { eventName: "Visit 2", eventDay: 7, repeat: 0, period: "Treatment"},
      ];
      studyConfigurationUnit = utils.addEventsScheduledOffCompletedEvents(studyConfigurationUnit, listOfEventsToAdd);

     // WHEN the study is simulated with no period is active yet and a timeline is generated
      let simulator = new Simulator(studyConfigurationUnit);
      simulator.run();

      // Then the generated timeline has two periods on the expected day
      let timeline = simulator.timeline;

      let periodsOnTimeline = timeline.getPeriods();
      expect(periodsOnTimeline.length).toEqual(2);
      expect(periodsOnTimeline[0].getName()).toEqual("Screening");
      expect(periodsOnTimeline[1].getName()).toEqual("Treatment");
      expect(periodsOnTimeline[0].startDay).toEqual(1);
      expect(periodsOnTimeline[1].startDay).toEqual(8);
      let currentPeriod = timeline.getPeriods()[1] as PeriodInstance;
      expect(currentPeriod.scheduledPeriod.getName()).toEqual("Treatment");
      expect(currentPeriod.startDay).toEqual(8);    
    });
 
  });
    
  describe("Generation of Timeline Chart from Timeline", () => {

    it("generate a chart for a two visit and one period timeline for a visit 7 days after the end of the first visit", () => {
  
      // HTML is split into two parts: the data and the visualization, so tests don't need to check both. The visualization is so simple that it doesn't need to be tested in multiple other tests.
      let expectedTimelineDataAsScript = 
        ` var groups = new vis.DataSet([
            { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
            { "content": "Visit 1", "id": "Visit 1" },{ "content": "Visit 2", "id": "Visit 2" },
            { "content": "Any Day", "id": "AnyDay", className: 'any-day' },
          ]);

          var items = new vis.DataSet([
            { start: new Date(2024, 0, 1), end: new Date(2024, 0, 8, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: 1", content: "<b>Screening</b>", id: "1" },
            { start: new Date(2024, 0, 0), end: new Date(2024, 0, 0, 23, 59, 59), group: "Visit 1", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 1" },
            { start: new Date(2024, 0, 1), end: new Date(2024, 0, 1, 23, 59, 59), group: "Visit 1", className: "treatment-visits", title: "day 1", content: "&nbsp;", id: "Visit 1" },
            { start: new Date(2024, 0, 2), end: new Date(2024, 0, 2, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 1" },
            { start: new Date(2024, 0, 7), end: new Date(2024, 0, 7, 23, 59, 59), group: "Visit 2", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 2" },
            { start: new Date(2024, 0, 8), end: new Date(2024, 0, 8, 23, 59, 59), group: "Visit 2", className: "treatment-visits", title: "when Start Day + 7", content: "&nbsp;", id: "Visit 2" },
            { start: new Date(2024, 0, 9), end: new Date(2024, 0, 9, 23, 59, 59), group: "Visit 2", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 2" },
            { start: new Date(2024, 0, 6), end: new Date(2024, 0, 8, 23, 59, 59), group: "AnyDay", className: "any-day", title: "Adverse Event", content: "Unscheduled Adverse Event Visit", id: "911" },
          ])
        `;

      let expectedTimelineVisualizationHTML =
        ` // create visualization
          var container = document.getElementById('visualization');
          var options = {
            format: {
                minorLabels: {
                    millisecond:'',
                    second:     '',
                    minute:     '',
                    hour:       '',
                    weekday:    '',
                    day:        'DDD',
                    week:       '',
                    month:      '',
                    year:       ''
                },
            },
            timeAxis: {scale: 'day', step: 1},
            showMajorLabels: false,
            orientation: 'both',
            start: new Date(2024, 0, 1),
            end: new Date(2024, 0, 9, 23, 59, 59),
            min: new Date(2024, 0, 1),
            max: new Date(2024, 0, 9, 23, 59, 59),
            margin: {
                item: {
                    horizontal: 0,
                },
            },
          };
        `
        // GIVEN a study configuration with one period and two events
        studyConfigurationUnit = utils.addAPeriodWithEventOnDayAndEventUsingStudyStart(studyConfigurationUnit, "Screening", "Visit 1", 1, "Visit 2", 7);

        // WHEN the study is simulated and a timeline picture is generated
        let simulator = new Simulator(studyConfigurationUnit);
        simulator.run();
        let timeline = simulator.timeline;

        let timelineDataAsScript = TimelineScriptTemplate.getTimelineDataHTML(timeline);
        let timelineVisualizationHTML = TimelineScriptTemplate.getTimelineVisualizationHTML(timeline);
        // Save full HTML of chart for viewing / debugging
        TimelineScriptTemplate.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);

        const normalizedTimelineDataAsScript = timelineDataAsScript.replace(/\s+/g, '');
        const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, '');
        // Then the generated timeline picture has two events on the expected event days
        expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);

        const normalizedTimelineVisualizationHTML = timelineVisualizationHTML.replace(/\s+/g, '');
        const normalizedExpectedTimelineVisualizationHTML = expectedTimelineVisualizationHTML.replace(/\s+/g, '');
        expect(normalizedTimelineVisualizationHTML).toEqual(normalizedExpectedTimelineVisualizationHTML);
    }); 

    it("generate a chart for two periods", () => {
  
      // HTML is split into two parts: the data and the visualization, so tests don't need to check both. The visualization is so simple that it doesn't need to be tested in multiple other tests.
      let expectedTimelineDataAsScript = 
        `var groups = new vis.DataSet([
           { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
           { "content": "Visit 1", "id": "Visit 1" },{ "content": "Visit 2", "id": "Visit 2" },
           { "content": "Any Day", "id": "AnyDay", className: 'any-day' },
         ]);

        var items = new vis.DataSet([
          { start: new Date(2024, 0, 1), end: new Date(2024, 0, 7, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: 1", content: "<b>Screening</b>", id: "Screening" },
          { start: new Date(2024, 0, 8), end: new Date(2024, 0, 8, 23, 59, 59), group: "Phase", className: "treatment-phase", title: "Day: 8", content: "<b>Treatment</b>", id: "Treatment" },
          { start: new Date(2024, 0, 0), end: new Date(2024, 0, 0, 23, 59, 59), group: "Visit 1", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 1" },
          { start: new Date(2024, 0, 1), end: new Date(2024, 0, 1, 23, 59, 59), group: "Visit 1", className: "treatment-visits", title: "day 1", content: "&nbsp;", id: "Visit 1" },
          { start: new Date(2024, 0, 2), end: new Date(2024, 0, 2, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 1" },
          { start: new Date(2024, 0, 7), end: new Date(2024, 0, 7, 23, 59, 59), group: "Visit 2", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 2" },
          { start: new Date(2024, 0, 8), end: new Date(2024, 0, 8, 23, 59, 59), group: "Visit 2", className: "treatment-visits", title: "when Visit 1 + 7", content: "&nbsp;", id: "Visit 2" },
          { start: new Date(2024, 0, 9), end: new Date(2024, 0, 9, 23, 59, 59), group: "Visit 2", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 2" },
          { start: new Date(2024, 0, 6), end: new Date(2024, 0, 8, 23, 59, 59), group: "AnyDay", className: "any-day", title: "Adverse Event", content: "Unscheduled Adverse Event Visit", id: "911" },
         ])
        `;
        // GIVEN a study configuration with one period and two events
        let listOfEventsToAdd: EventsToAdd[] = [
          { eventName: "Visit 1", eventDay: 1, repeat: 0, period: "Screening"},
          { eventName: "Visit 2", eventDay: 7, repeat: 0, period: "Treatment"},
        ];
        studyConfigurationUnit = utils.addEventsScheduledOffCompletedEvents(studyConfigurationUnit, listOfEventsToAdd);
  
        // WHEN the study is simulated and a timeline picture is generated
        let simulator = new Simulator(studyConfigurationUnit);
        simulator.run();
        let timeline = simulator.timeline;

        const html = utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

        const normalizedTimelineDataAsScript = html.replace(/\s+/g, '');
        const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, '');
        // Then the generated timeline picture has two events on the expected event days
        expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
    }); 

    it("generate a chart for the example study", () => {
  
      // HTML is split into two parts: the data and the visualization, so tests don't need to check both. The visualization is so simple that it doesn't need to be tested in multiple other tests.
      let expectedTimelineDataAsScript = 
        `var groups = new vis.DataSet([
           { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
           { "content": "Visit 1", "id": "Visit 1" },{ "content": "Visit 2", "id": "Visit 2" },
           { "content": "Any Day", "id": "AnyDay", className: 'any-day' },
         ]);

        var items = new vis.DataSet([
          { start: new Date(2024, 0, 1), end: new Date(2024, 0, 7, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: 1", content: "<b>Screening</b>", id: "Screening" },
          { start: new Date(2024, 0, 8), end: new Date(2024, 0, 8, 23, 59, 59), group: "Phase", className: "treatment-phase", title: "Day: 8", content: "<b>Treatment</b>", id: "Treatment" },
          { start: new Date(2024, 0, 0), end: new Date(2024, 0, 0, 23, 59, 59), group: "Visit 1", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 1" },
          { start: new Date(2024, 0, 1), end: new Date(2024, 0, 1, 23, 59, 59), group: "Visit 1", className: "treatment-visits", title: "day 1", content: "&nbsp;", id: "Visit 1" },
          { start: new Date(2024, 0, 2), end: new Date(2024, 0, 2, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 1" },
          { start: new Date(2024, 0, 7), end: new Date(2024, 0, 7, 23, 59, 59), group: "Visit 2", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 2" },
          { start: new Date(2024, 0, 8), end: new Date(2024, 0, 8, 23, 59, 59), group: "Visit 2", className: "treatment-visits", title: "when Visit 1 + 7", content: "&nbsp;", id: "Visit 2" },
          { start: new Date(2024, 0, 9), end: new Date(2024, 0, 9, 23, 59, 59), group: "Visit 2", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 2" },
          { start: new Date(2024, 0, 6), end: new Date(2024, 0, 8, 23, 59, 59), group: "AnyDay", className: "any-day", title: "Adverse Event", content: "Unscheduled Adverse Event Visit", id: "911" },
         ])
        `;
        // GIVEN a study configuration loaded from a file
        const studyConfigurationUnit = utils.loadModel("Example1", 'StudyConfiguration');
        studyConfigurationModel.addUnit(studyConfigurationUnit)
  
        // WHEN the study is simulated and a timeline picture is generated
        let simulator = new Simulator(studyConfigurationUnit);
        simulator.run();
        let timeline = simulator.timeline;

        const timelineDataAsScript = TimelineScriptTemplate.getTimelineDataHTML(timeline);
        const timelineVisualizationHTML = TimelineScriptTemplate.getTimelineVisualizationHTML(timeline);
        // Save full HTML of chart for viewing / debugging
        TimelineScriptTemplate.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);

        const normalizedTimelineDataAsScript = timelineDataAsScript.replace(/\s+/g, '');
        const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, '');
        // Then the generated timeline picture has two events on the expected event days
        // expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
    }); 

    it("generates a chart for a three visit timeline for a visit that repeats twice", () => {
      // GIVEN
      let listOfEventsToAdd: EventsToAdd[] = [
        { eventName: "Visit 1", eventDay: 1, repeat: 2, period: "Screening"},
      ];
      studyConfigurationUnit = utils.addRepeatingEvents(studyConfigurationUnit, "Screening", listOfEventsToAdd);

      // WHEN the study is simulated and a timeline is generated
      let simulator = new Simulator(studyConfigurationUnit);
      simulator.run();
      let timeline = simulator.timeline;

      const timelineDataAsScript = TimelineScriptTemplate.getTimelineDataHTML(timeline);
      const timelineVisualizationHTML = TimelineScriptTemplate.getTimelineVisualizationHTML(timeline);
      // Save full HTML of chart for viewing / debugging
      TimelineScriptTemplate.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);
    });

    
    it("generates a chart for a three visit timeline for a visit that repeats twice", () => {
      // GIVEN
      let listOfEventsToAdd: EventsToAdd[] = [
        { eventName: "Visit 1", eventDay: 1, repeat: 2, period: "Screening"},
      ];
      studyConfigurationUnit = utils.addRepeatingEvents(studyConfigurationUnit, "Screening", listOfEventsToAdd);

      // WHEN the study is simulated and a timeline is generated
      let simulator = new Simulator(studyConfigurationUnit);
      simulator.run();
      let timeline = simulator.timeline;

      const timelineTableAsHTML = TimelineTableTemplate.getTimelineTableHTML(timeline);
      // Save full HTML of chart for viewing / debugging
      TimelineTableTemplate.saveTimeline(timelineTableAsHTML);
    });


  });
});
