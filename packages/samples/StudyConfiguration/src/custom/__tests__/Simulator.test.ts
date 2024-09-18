import * as Sim from "../simjs/sim.js"
import { Timeline, EventInstance, PeriodInstance, TimelineEventInstance, TimelineInstanceState } from "../timeline/Timeline";
import { Simulator, } from "../timeline/Simulator";
import { StudyConfiguration, Period, When, StudyConfigurationModel } from "../../language/gen/index";
import * as utils from "./Utils";
import { TimelineScriptTemplate } from "../templates/TimelineScriptTemplate";
import { TimelineTableTemplate } from "../templates/TimelineTableTemplate";
import { StudyChecklistDocumentTemplate } from "../templates/StudyChecklistDocumentTemplate";
import { EventsToAdd, addEventAndInstanceToTimeline } from "./Utils";
import { ScheduledEventState } from "../timeline/ScheduledEvent";
import { StudyConfigurationModelEnvironment } from "../../config/gen/StudyConfigurationModelEnvironment";

describe ("Study Simulation", () => {
  var simulator;
  const studyConfigurationModelEnvironment = StudyConfigurationModelEnvironment.getInstance();
  var studyConfigurationUnit: StudyConfiguration;
  var studyConfigurationModel: StudyConfigurationModel;
  const modelName = "TestStudyModel"; // The name used for all the tests that don't load their own already named model. No semantic meaning.
  
  beforeEach(() => {
    new Sim.Sim(); // For some reason, need to do this for Sim to be properly loaded and available in the Scheduler class used by the Simulator.
    // const studyConfigurationModelEnvironment = StudyConfigurationModelEnvironment.getInstance();
    studyConfigurationModel = studyConfigurationModelEnvironment.newModel(modelName) as StudyConfigurationModel;
    studyConfigurationUnit = studyConfigurationModel.newUnit("StudyConfiguration") as StudyConfiguration;
    simulator = new Simulator(studyConfigurationUnit);
  });

  describe("Simulation of Trial Events to Generate the Timeline in the same period", () => {

    it("generates a one visit timeline for a visit on day 1", () => {
        // GIVEN a study configuration with one period and one event
        let eventSchedule = utils.createEventScheduleStartingOnADay("Visit 1", 1);
        let period = new Period("Screening");
        utils.createEventAndAddToPeriod(period, "Visit 1", eventSchedule);
        studyConfigurationUnit.periods.push(period);

        // WHEN the study is simulated and a timeline is generated
        let simulator = new Simulator(studyConfigurationUnit);
        simulator.run();
        let timeline = simulator.timeline;

        // utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

        // Then the generated timeline has one event on the expected event day
        let expectedTimeline = new Timeline()
        addEventAndInstanceToTimeline(studyConfigurationUnit, 0, "Visit 1", 1, expectedTimeline, ScheduledEventState.Completed, TimelineInstanceState.Completed, "Screening", 1,1)
        expectedTimeline.setCurrentDay(1);
        expect(timeline).toEqual(expectedTimeline);  
    });

    it("generates a two visit timeline with a visit on day 1 and 7 in the same period", () => {
      // GIVEN a study configuration with one period and two events
      let period = Period.create({'name':'Screening'});
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

      // utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

      expect(timeline).toEqual(expectedTimeline);  
    });


    it("generates a two visit timeline for a visit 7 days after the study start day in the same period", () => {
        // GIVEN a study configuration with one period and two events
        studyConfigurationUnit = utils.addAPeriodWithEventOnDayAndEventUsingStudyStart(studyConfigurationUnit, "Screening", "StudyStart", 0, "Visit 2", 7);
        console.log("studyConfigurationUnit studyStartDayNumber: " + studyConfigurationUnit.studyStartDayNumber);

        // WHEN the study is simulated and a timeline is generated
        let simulator = new Simulator(studyConfigurationUnit);
        simulator.run();
        let timeline = simulator.timeline;
        console.log("studyConfigurationUnit after simulation studyStartDayNumber: " + studyConfigurationUnit.studyStartDayNumber);

        // Then the generated timeline has two events on the expected event days
        let expectedTimeline = new Timeline();
        addEventAndInstanceToTimeline(studyConfigurationUnit, 0, "StudyStart", 0, expectedTimeline, ScheduledEventState.Completed, TimelineInstanceState.Completed, "Screening",0)
        // TODO: Decide whether the period completes on the day the visit completes or the day after. Currently it is the day after.
        addEventAndInstanceToTimeline(studyConfigurationUnit, 0, "Visit 2", 7, expectedTimeline, ScheduledEventState.Completed, TimelineInstanceState.Completed, "Screening",0,7)
        expectedTimeline.setCurrentDay(7);

        // utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

        expect(timeline).toEqual(expectedTimeline);  
    });

    it("[Start Day of 1] generates a two visit timeline for a visit 7 days after the study start day", () => {
      // GIVEN a study configuration with one period and two events
      studyConfigurationUnit.studyStartDayNumber = 1;
      studyConfigurationUnit = utils.addAPeriodWithEventOnDayAndEventUsingStudyStart(studyConfigurationUnit, "Screening", "StudyStart", 0, "Visit 2", 7);

      // WHEN the study is simulated and a timeline is generated
      let simulator = new Simulator(studyConfigurationUnit);
      simulator.run();
      let timeline = simulator.timeline;

      // Then the generated timeline has two events on the expected event days with the reflecting a study start day of 1
      let expectedTimeline = new Timeline()
      addEventAndInstanceToTimeline(studyConfigurationUnit, 0, "StudyStart", 0, expectedTimeline, ScheduledEventState.Completed, TimelineInstanceState.Completed, "Screening",0)
      // TODO: Decide whether the period completes on the day the visit completes or the day after. Currently it is the day after.
      addEventAndInstanceToTimeline(studyConfigurationUnit, 0, "Visit 2", 8, expectedTimeline, ScheduledEventState.Completed, TimelineInstanceState.Completed, "Screening",0,8)
      expectedTimeline.setCurrentDay(8);

      // utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

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
      addEventAndInstanceToTimeline(studyConfigurationUnit, 1, "Visit 2", 8, expectedTimeline, ScheduledEventState.Completed, TimelineInstanceState.Completed, "Treatment",8,8)
      expectedTimeline.setCurrentDay(8);

      // utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

      expect(timeline).toEqual(expectedTimeline);  
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

      // utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

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

      // utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

      expect(expectedTimeline.days[0].events[0]).toEqual(timeline.days[0].events[0]);
      expect(expectedTimeline.days[0].events[1]).toEqual(timeline.days[0].events[1]);
      expect(expectedTimeline.days[1].events[0]).toEqual(timeline.days[1].events[0]);
      expect(timeline).toEqual(expectedTimeline);  
    });

    it ("can access the first instance of a period on the timeline" , () => {
      // GIVEN a study configuration with one period and one event
      let eventSchedule = utils.createEventScheduleStartingOnADay("Visit 1", 1);
      let period = Period.create({'name':'Screening'});
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
      expectedTimeline.addEvent(periodInstance as unknown as TimelineEventInstance);
      expectedTimeline.setCurrentDay(1);

      // utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

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

      // utils.generateChartAndSave(timeline); // Save full HTML of chart for viewing / debugging

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
          ]);

          var items = new vis.DataSet([
            { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 08, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: 0", content: "<b>Screening</b>", id: "Screening0" },
            { start: new Date(2023, 11, 31, 00, 00, 00), end: new Date(2023, 11, 31, 23, 59, 59), group: "Visit 1", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 11" },
            { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Visit 1", className: "treatment-visits", title: "Visit 1: day 0", content: "&nbsp;", id: "Visit 12" },
            { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 02, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 13" },
            { start: new Date(2024, 00, 08, 00, 00, 00), end: new Date(2024, 00, 08, 23, 59, 59), group: "Visit 2", className: "treatment-visits", title: "Visit 2: Study Start + 7", content: "&nbsp;", id: "Visit 24" },
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
            end: new Date(2024, 0, 8, 23, 59, 59),
            min: new Date(2024, 0, 1),
            max: new Date(2024, 0, 8, 23, 59, 59),
            margin: {
                item: {
                    horizontal: 0,
                },
            },
          };
        `
        // GIVEN a study configuration with one period and two events
        studyConfigurationUnit = utils.addAPeriodWithEventOnDayAndEventUsingStudyStart(studyConfigurationUnit, "Screening", "Visit 1", 0, "Visit 2", 7);

        // WHEN the study is simulated and a timeline picture is generated
        let simulator = new Simulator(studyConfigurationUnit);
        simulator.run();
        let timeline = simulator.timeline;

        utils.checkTimelineChart(timeline, expectedTimelineDataAsScript, expectedTimelineVisualizationHTML, true);
    }); 

    it("generate a chart for two periods", () => {
  
      // HTML is split into two parts: the data and the visualization, so tests don't need to check both. The visualization is so simple that it doesn't need to be tested in multiple other tests.
      let expectedTimelineDataAsScript = 
        `var groups = new vis.DataSet([
          { "content": "<b>Phase</b>", "id": "Phase", className: 'phase' },
          { "content": "Visit 1", "id": "Visit 1" },
          { "content": "Visit 2", "id": "Visit 2" },
        ]);

        var items = new vis.DataSet([
          { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 07, 23, 59, 59), group: "Phase", className: "screening-phase", title: "Day: 0", content: "<b>Screening</b>", id: "Screening0" },
          { start: new Date(2024, 00, 08, 00, 00, 00), end: new Date(2024, 00, 08, 23, 59, 59), group: "Phase", className: "treatment-phase", title: "Day: 7", content: "<b>Treatment</b>", id: "Treatment1" },
          { start: new Date(2023, 11, 31, 00, 00, 00), end: new Date(2023, 11, 31, 23, 59, 59), group: "Visit 1", className: "window", title: "Window before Event", content: "&nbsp;", id: "before-Visit 12" },
          { start: new Date(2024, 00, 01, 00, 00, 00), end: new Date(2024, 00, 01, 23, 59, 59), group: "Visit 1", className: "treatment-visits", title: "Visit 1: day 0", content: "&nbsp;", id: "Visit 13" },
          { start: new Date(2024, 00, 02, 00, 00, 00), end: new Date(2024, 00, 02, 23, 59, 59), group: "Visit 1", className: "window", title: "Window after Event", content: "&nbsp;", id: "after-Visit 14" },
          { start: new Date(2024, 00, 08, 00, 00, 00), end: new Date(2024, 00, 08, 23, 59, 59), group: "Visit 2", className: "treatment-visits", title: "Visit 2: when Visit 1 completed + 7 days", content: "&nbsp;", id: "Visit 25" },
        ])
        `;
        // GIVEN a study configuration with one period and two events
        // where second visit has no window before or after
        let listOfEventsToAdd: EventsToAdd[] = [
          { eventName: "Visit 1", eventDay: 0, repeat: 0, period: "Screening"},
          { eventName: "Visit 2", eventDay: 7, repeat: 0, period: "Treatment"},
        ];
        studyConfigurationUnit = utils.addEventsScheduledOffCompletedEvents(studyConfigurationUnit, listOfEventsToAdd);
  
        // WHEN the study is simulated and a timeline picture is generated
        let simulator = new Simulator(studyConfigurationUnit);
        simulator.run();
        let timeline = simulator.timeline;

        utils.checkTimelineChart(timeline, expectedTimelineDataAsScript, "", true);
    }); 

    it("generate a chart for the example study 1", () => {
  
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
        // const studyConfigurationUnit = utils.loadModel("Example1", 'StudyConfiguration');
        const studyConfigurationUnit = utils.loadModel("ScheduleExample1", 'StudyConfiguration');
        studyConfigurationModel.addUnit(studyConfigurationUnit)
  
        // WHEN the study is simulated and a timeline picture is generated
        let simulator = new Simulator(studyConfigurationUnit);
        simulator.run();
        let timeline = simulator.timeline;

        const timelineDataAsScript = TimelineScriptTemplate.getTimelineDataHTML(timeline);
        const timelineVisualizationHTML = TimelineScriptTemplate.getTimelineVisualizationHTML(timeline);
        // Save full HTML of chart for viewing / debugging
        utils.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);

        const normalizedTimelineDataAsScript = timelineDataAsScript.replace(/\s+/g, '');
        const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, '');
        // Then the generated timeline picture has two events on the expected event days
        // expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
    }); 

    it("generate a chart for the example study 2", () => {
  
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
        const studyConfigurationUnit = utils.loadModel("ScheduleExample2", 'StudyConfiguration');
        // const studyConfigurationUnit = utils.loadModel("EachCompleteTest", 'StudyConfiguration');
        studyConfigurationModel.addUnit(studyConfigurationUnit)
  
        // WHEN the study is simulated and a timeline picture is generated
        let simulator = new Simulator(studyConfigurationUnit);
        simulator.run();
        let timeline = simulator.timeline;

        const timelineDataAsScript = TimelineScriptTemplate.getTimelineDataHTML(timeline);
        const timelineVisualizationHTML = TimelineScriptTemplate.getTimelineVisualizationHTML(timeline);
        // Save full HTML of chart for viewing / debugging
        utils.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);

        const normalizedTimelineDataAsScript = timelineDataAsScript.replace(/\s+/g, '');
        const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, '');
        // Then the generated timeline picture has two events on the expected event days
        // expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
    }); 
    
    it("generate a chart for the example study 3", () => {
  
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
        const studyConfigurationUnit = utils.loadModel("ScheduleExample3", 'StudyConfiguration');
        studyConfigurationModel.addUnit(studyConfigurationUnit)
  
        // WHEN the study is simulated and a timeline picture is generated
        let simulator = new Simulator(studyConfigurationUnit);
        simulator.run();
        let timeline = simulator.timeline;

        const timelineDataAsScript = TimelineScriptTemplate.getTimelineDataHTML(timeline);
        const timelineVisualizationHTML = TimelineScriptTemplate.getTimelineVisualizationHTML(timeline);
        // Save full HTML of chart for viewing / debugging
        utils.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);

        const normalizedTimelineDataAsScript = timelineDataAsScript.replace(/\s+/g, '');
        const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, '');
        // Then the generated timeline picture has two events on the expected event days
        // expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
    }); 


    it.skip("generate a chart from the text version of the study", () => {
  
        // GIVEN a study configuration loaded from a string
    const configAsText = `StudyConfiguration StudyConfiguration {
    showActivityDetails true
    showSystems false
    showScheduling true
    showPeriods true
    studyStartDayNumber 0
    periods
        Period: Screening
        Description: " "
        EVENTS
            Event: V1
            Type: site
            Description: " "
            Schedule:
                First scheduled: Study Start - 28
                with a window of: at most 0 day(s) before
                                  0 day(s) before
                                  16 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V2
            Type: site
            Description: " "
            Schedule:
                First scheduled: Study Start - 16
                with a window of: at most 0 day(s) before
                                  0 day(s) before
                                  14 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V3
            Type: site
            Description: " "
            Schedule:
                First scheduled: Study Start - 15
                with a window of: at most 0 day(s) before
                                  0 day(s) before
                                  14 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

        Period: Baseline
        Description: " "
        EVENTS
            Event: V4
            Type: site
            Description: " "
            Schedule:
                First scheduled: Study Start
                with a window of: at most 0 day(s) before
                                  0 day(s) before
                                  0 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V5
            Type: site
            Description: " "
            Schedule:
                First scheduled: when V4 completed + 4 weeks
                with a window of: at most 0 day(s) before
                                  0 day(s) before
                                  0 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V6
            Type: phone
            Description: " "
            Schedule:
                First scheduled: Study Start + "8" weeks
                with a window of: at most 0 day(s) before
                                  0 day(s) before
                                  0 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V7, V10, V12
            Type: site
            Description: " "
            Schedule:
                First scheduled: Study Start + "12" weeks
                with a window of: at most 0 day(s) before
                                  5 day(s) before
                                  5 day(s) after
                                  at most 0 day(s) after
                and then repeats: frequency: Every: "12" weeks
                                  max 2 times
                                  until
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V8
            Type: phone
            Description: " "
            Schedule:
                First scheduled: Study Start + "16" weeks
                with a window of: at most 0 day(s) before
                                  5 day(s) before
                                  5 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V9
            Type: phone
            Description: " "
            Schedule:
                First scheduled: Study Start + "20" weeks
                with a window of: at most 0 day(s) before
                                  5 day(s) before
                                  5 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V11
            Type: phone
            Description: " "
            Schedule:
                First scheduled: Study Start + "28" weeks
                with a window of: at most 0 day(s) before
                                  5 day(s) before
                                  5 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V13
            Type: phone
            Description: " "
            Schedule:
                First scheduled: Study Start + "44" weeks
                with a window of: at most 0 day(s) before
                                  5 day(s) before
                                  5 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: V14
            Type: site
            Description: " "
            Schedule:
                First scheduled: Study Start + "52" weeks
                with a window of: at most 0 day(s) before
                                  5 day(s) before
                                  5 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

            Event: FU
            Type: phone
            Description: " "
            Schedule:
                First scheduled: Study Start + "54" weeks
                with a window of: at most 0 day(s) before
                                  0 day(s) before
                                  0 day(s) after
                                  at most 0 day(s) after
                and then repeats:
                limited to this time of day: 0 : 0 - 0 : 0
            Checklist:

    tasks
        Task 1
        "<p>ssss</p>"
    systemAccesses

    staffing Roles:

             Assignments:

}`
        const studyConfigurationUnit = studyConfigurationModelEnvironment.reader.readFromString(configAsText, 'StudyConfiguration', studyConfigurationModel) as StudyConfiguration;
        studyConfigurationModel.addUnit(studyConfigurationUnit)
  
        // WHEN the study is simulated and a timeline picture is generated
        let simulator = new Simulator(studyConfigurationUnit);
        simulator.run();
        let timeline = simulator.timeline;

        const timelineDataAsScript = TimelineScriptTemplate.getTimelineDataHTML(timeline);
        const timelineVisualizationHTML = TimelineScriptTemplate.getTimelineVisualizationHTML(timeline);
        // Save full HTML of chart for viewing / debugging
        utils.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);

        // const normalizedTimelineDataAsScript = timelineDataAsScript.replace(/\s+/g, '');
        // const normalizedExpectedTimelineDataAsScript = expectedTimelineDataAsScript.replace(/\s+/g, '');
        // Then the generated timeline picture has two events on the expected event days
        // expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
    }); 

    it("generates a CHART for a three visit timeline for a visit that repeats twice", () => {
      // GIVEN
      let listOfEventsToAdd: EventsToAdd[] = [
        { eventName: "Visit 1", eventDay: 0, repeat: 2, period: "Screening"},
      ];
      studyConfigurationUnit = utils.addRepeatingEvents(studyConfigurationUnit, "Screening", listOfEventsToAdd);

      // WHEN the study is simulated and a timeline is generated
      let simulator = new Simulator(studyConfigurationUnit);
      simulator.run();
      let timeline = simulator.timeline;

      const timelineDataAsScript = TimelineScriptTemplate.getTimelineDataHTML(timeline);
      const timelineVisualizationHTML = TimelineScriptTemplate.getTimelineVisualizationHTML(timeline);
      // Save full HTML of chart for viewing / debugging
      utils.saveTimeline(timelineDataAsScript + timelineVisualizationHTML);
      // utils.checkTimelineChart(timeline, expectedTimelineDataAsScript, expectedTimelineVisualizationHTML, true);

    });

    
    it("generates a TABLE for a three visit timeline for a visit that repeats twice", () => {
      // GIVEN
      let listOfEventsToAdd: EventsToAdd[] = [
        { eventName: "Visit 1", eventDay: 1, repeat: 2, period: "Screening"},
      ];
      studyConfigurationUnit = utils.addRepeatingEvents(studyConfigurationUnit, "Screening", listOfEventsToAdd);

      // WHEN the study is simulated and a timeline is generated
      let simulator = new Simulator(studyConfigurationUnit);
      simulator.run();
      let timeline = simulator.timeline;

      const expectedTimelineTableAsHTML = `<div class="table_component" role="region" tabindex="0">
        <table>
          <caption>Study Timeline Table</caption>
          <thead>
            <tr>
              <th>Visit Name</th>
              <th>Alternative Name</th>
              <th>Phase</th>
              <th>Window (-)</th>
              <th>Date</th>
              <th>Window (+)</th>
            </tr>
            </thead>
            <tbody>

        <tr>
                <td>Visit 1</td>
                <td> </td>
                <td>Screening</td>
                <td>1</td>
                <td>1</td>
                <td>1</td>
                </tr><tr>
                <td>Visit 1</td>
                <td> </td>
                <td>Screening</td>
                <td>1</td>
                <td>1</td>
                <td>1</td>
                </tr><tr>
                <td>Visit 1</td>
                <td> </td>
                <td>Screening</td>
                <td>1</td>
                <td>1</td>
                <td>1</td>
                </tr>
              </tr>
            </tbody>
          </table>
        `;
      const timelineTableAsHTML = TimelineTableTemplate.getTimelineTableHTML(timeline);
      // Save full HTML of table for viewing / debugging
      utils.saveTimelineTable(timelineTableAsHTML);

      const normalizedTimelineDataAsScript = timelineTableAsHTML.replace(/\s+/g, '');
      const normalizedExpectedTimelineDataAsScript = expectedTimelineTableAsHTML.replace(/\s+/g, '');
      // Then the generated timeline table has the expected data in it
      expect(normalizedTimelineDataAsScript).toEqual(normalizedExpectedTimelineDataAsScript);
  });


  });

  describe("Generation of Study Checklists Document", () => {

    it("generate a document for a one visit,one checklist, one task study", () => {
  
        // GIVEN a study configuration loaded from a file and the study is simulated
        const studyConfigurationUnit = utils.loadModel("OneVisitOneChecklist", 'StudyConfiguration');
        studyConfigurationModel.addUnit(studyConfigurationUnit)
        let simulator = new Simulator(studyConfigurationUnit);
        simulator.run();
        let timeline = simulator.timeline;

        // WHEN the study checklist document is generated
        const studyChecklistAsMarkdown = StudyChecklistDocumentTemplate.getStudyChecklistAsMarkdown(studyConfigurationUnit, timeline);

        // THEN the generated study checklist document has the expected content
        utils.saveToFile(studyChecklistAsMarkdown, "StudyChecklistOneVisitOneChecklist.md");
    });
  });
});

