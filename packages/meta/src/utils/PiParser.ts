import * as fs from "fs";
import { Checker } from "./Checker";
import { Parser } from "pegjs";
import { PiLogger } from "../../../core/src/util/PiLogging";

const LOGGER = new PiLogger("PiParser"); // .mute();
/**
 * Generic Parser, subclasses need to initialize the parser, checker and msg fields.
 */
export class PiParser<DEFINITION> {

    // No known type, as this is a Javascript parser object generated by pegjs.
    parser: Parser;
    checker: Checker<DEFINITION>;
    msg: string;

    parse(definitionFile: string, verbose?: boolean): DEFINITION {
        // Check language file
        if (!fs.existsSync(definitionFile)) {
            LOGGER.error(this, this.msg + " definition file '" + definitionFile + "' does not exist, exiting.");
            process.exit(-1);
        }
        if (verbose) LOGGER.log(this.msg + " file is [" + definitionFile + "] ");
        const langSpec: string = fs.readFileSync(definitionFile, { encoding: "UTF8" });
        // Parse Language file
        let model: DEFINITION = null;
        try {
            model = this.parser["parse"](langSpec);
        } catch (e) {
            let errorstr = `Pase error: ${this.msg}: ${e} ${(e.location && e.location.start)? `[line ${e.location.start.line}, column ${e.location.start.column}`: ``}]`;
            LOGGER.error(this, errorstr);
            // if (verbose) LOGGER.log(JSON.stringify(e, null, 4));
            process.exit(-1);
        }
        if (model !== null) {
            this.checker.check(model, verbose);
            if (this.checker.hasErrors()) {
                this.checker.errors.forEach(error => LOGGER.error(this, error));
                LOGGER.error(this, "Stopping because of errors.");
                process.exit(-1);
            }
            return model;
        } else {
            // TODO change error message
            LOGGER.error(this, "ERROR: Parser does not return a PiLanguage");
            process.exit(-1);
        }
    }
}
