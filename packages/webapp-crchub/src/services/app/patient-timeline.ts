import { PatientHistory, Simulator, StudyConfiguration } from "@freon4dsl/study-configuration";
import * as Sim from "@freon4dsl/study-configuration";
import type { Timeline } from "@freon4dsl/study-configuration";

export function getTimelineAsOfADate(node: StudyConfiguration, referenceDate?: Date, patientHistory?: PatientHistory, patientIdentifier?: string) : Timeline {
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
        simulator.timeline.addPatientEvents(patientHistory, patientIdentifier);
    }
    simulator.run();
    let timeline = simulator.timeline;

    return timeline;
}
