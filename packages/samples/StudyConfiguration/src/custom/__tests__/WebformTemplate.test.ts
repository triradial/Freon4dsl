import {StudyConfiguration, Period, Event, EventSchedule, Day, BinaryExpression, PlusExpression, When, StartDay } from "../../language/gen/index";
import { WebformTemplate } from "../templates/WebFormTemplate";
import * as utils from "./Utils";

describe("Generate Study Site", () => {

    test(" is able to generate a WebForm YAML file from a model", async () => {
        let model: StudyConfiguration = utils.loadModel('StudyConfiguration', "Study2");
        WebformTemplate.writeWebForms(model);
    });
});


