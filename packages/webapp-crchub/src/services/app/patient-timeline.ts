import { PatientHistory, Simulator, StudyConfiguration } from "@freon4dsl/samples-study-configuration";
import * as Sim from "@freon4dsl/samples-study-configuration/dist/custom/simjs/sim.js";
import type { Timeline } from "@freon4dsl/samples-study-configuration/dist/custom/timeline/Timeline.js";

//TODO: move this to the Timeline or the simulator

export function getTimelineAsOfADate(node: StudyConfiguration, referenceDate?: Date, patientHistory?: PatientHistory) : Timeline {
    var simulator;
    new Sim.Sim(); // For some reason, need to do this for Sim to be properly loaded and available in the Scheduler class used by the Simulator.
    let studyConfigurationUnit = node as StudyConfiguration;
    simulator = new Simulator(studyConfigurationUnit);
    if (referenceDate) {
        simulator.setReferenceDate(referenceDate);
    } else {
        simulator.setReferenceDate(new Date(2024, 8, 30));
    }
    simulator.organizedByReferenceDate();
    if (patientHistory) {
        simulator.timeline.addPatientEvents(patientHistory);
    }
    simulator.run();
    let timeline = simulator.timeline;

    return timeline;
}
