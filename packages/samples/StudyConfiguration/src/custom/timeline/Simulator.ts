import { Scheduler } from "./Scheduler.js"
import * as Sim from "../simjs/sim.js"
import log from "../utils/SimpleLogger";
import { Timeline } from "./Timeline";
import { PatientInfo } from "../../language/gen/index";
import {StudyConfiguration, Period, Event } from "../../language/gen/index";
import { ScheduledStudyConfiguration } from "./ScheduledStudyConfiguration";

/*
  * A Simulator is the layer between the Scheduler and the use of the simjs.updated simulation engine. It is an attempt to isolate the TypeScript from the JavaScript and potentially allow a different implementation of the simulation engine.
  * It is responsible for setting up the simulation and running it.
  */

export class Simulator {
  sim: Sim.Sim;
  timeline: Timeline;
  events: Event[];
  name = "Simulator";
  studyConfiguration: StudyConfiguration;
  scheduledStudyConfiguration: ScheduledStudyConfiguration
  patientInfo: PatientInfo;

  constructor(studyConfiguration: StudyConfiguration, patientInfo?: PatientInfo) {
    // Setup the Scheduler
    this.scheduledStudyConfiguration = new ScheduledStudyConfiguration(studyConfiguration);
    this.patientInfo = patientInfo;
    this.timeline = new Timeline();
  }

  getTimeline() {
    return this.timeline;
  }

  run() {
    // Setup the simulator so it uses the Scheduler and link the Scheduler to this Simulator instance
    // This Scheduler is JavaScript and passing the Simulator instance to it is a way to allow the JavaScript to call back into the TypeScript data structures.
    this.sim = new Sim.Sim();
    this.sim.setLogger(function (s: string) {
       log(s);
    });
    this.sim.addEntity(Scheduler, "Scheduler", this);
    // Run the simulation for the appropriate number of days
    console.log("running simulation...");
    let results = this.sim.simulate(500); 
    return results;
  }
  

}
