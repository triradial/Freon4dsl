import * as fs from "fs";
import { Checker } from "./Checker.js";
import { Parser, parser } from "pegjs";
import { LOG2USER } from "../UserLogger.js";
import { FreMetaDefinitionElement } from "../FreMetaDefinitionElement.js";
import { ParseLocationUtil } from "./ParseLocationUtil.js";

// The following two types are used to store the location information from the PEGJS parser
// todo rethink how to adjust the errors from the PegJs parser
export type ParseLocation = {
    filename: string;
    start: Location;
    end: Location;
};

export type Location = {
    offset: number;
    line: number;
    column: number;
};

function isPegjsError(object: any): object is parser.SyntaxError {
    return "location" in object;
}

/**
 * This class is used to store the location information from the AGL parser.
 */
export class FreParseLocation {
    static create(data: Partial<FreParseLocation>): FreParseLocation {
        const result = new FreParseLocation();
        if (!!data.filename) {
            result.filename = data.filename;
        }
        if (!!data.line) {
            result.line = data.line;
        }
        if (!!data.column) {
            result.column = data.column;
        }
        return result;
    }
    filename: string = "";
    line: number = 0;
    column: number = 0;
}

/**
 * Generic Parser, subclasses need to initialize the parser, and checker fields.
 */
export class FreGenericParser<DEFINITION> {
    // todo find a way to ensure that these props are set by the subclasses, without introducing lots of test of undefined
    // @ts-ignore, the parser is set in each of the subclasses
    parser: Parser;
    // @ts-ignore, the checker is set in each of the subclasses
    checker: Checker<DEFINITION>;

    parse(definitionFile: string): DEFINITION | undefined {
        LOG2USER.log("FreGenericParser.Parse: " + definitionFile);
        // Check if language file exists
        if (!fs.existsSync(definitionFile)) {
            LOG2USER.error("definition file '" + definitionFile + "' does not exist, exiting.");
            throw new Error("file '" + definitionFile + "' not found.");
        }
        const langSpec: string = fs.readFileSync(definitionFile, { encoding: "utf8" });
        // console.log("FreGenericParser.Parse langSpec: " + langSpec)
        // remove warnings from previous runs
        this.checker.warnings = [];
        // clean the error list from the creator functions
        this.cleanNonFatalParseErrors();
        // parse definition file
        let model: DEFINITION | undefined = undefined;
        try {
            this.setCurrentFileName(definitionFile); // sets the filename in the creator functions to the right value
            model = this.parser.parse(langSpec);
            // console.log("FreGenericParser.Parse model: " + langSpec)
        } catch (e: unknown) {
            if (isPegjsError(e)) {
                LOG2USER.error("isPegjsError " + e?.message);
                // syntax error
                const errorLoc: ParseLocation = {
                    filename: definitionFile,
                    start: e.location.start,
                    end: e.location.end,
                };
                const errorstr: string = `${e}
                ${e.location && e.location.start ? ParseLocationUtil.locationPlus(definitionFile, errorLoc) : ``}`;
                LOG2USER.error(errorstr);
                throw new Error("syntax error: " + errorstr);
            } else {
                LOG2USER.error("FreGenericParser.Parse unknown error: " + e);
            }
        }

        if (!!model) {
            // run the checker
            this.runChecker(model);
        }

        // return the model
        return model;
    }

    parseMulti(filePaths: string[]): DEFINITION | undefined {
        let model: DEFINITION | undefined;
        const submodels: DEFINITION[] = [];
        // remove warnings from previous runs
        this.checker.warnings = [];
        // clean the error list from the creator functions used by this.parser
        this.cleanNonFatalParseErrors();
        // read the files and parse them separately
        for (const file of filePaths) {
            if (!fs.existsSync(file)) {
                LOG2USER.error("definition file '" + file + "' does not exist, exiting.");
                throw new Error("definition file '" + file + "' does not exist, exiting.");
            } else {
                let langSpec: string = "";
                langSpec += fs.readFileSync(file, { encoding: "utf8" }) + "\n";
                try {
                    this.setCurrentFileName(file); // sets the filename in the creator functions to the right value
                    submodels.push(this.parser.parse(langSpec));
                } catch (e: unknown) {
                    if (isPegjsError(e)) {
                        // throw syntax error, but adjust the location first
                        // to avoid a newline in the output, we do not put this if-stat in a smart string
                        const errorLoc: ParseLocation = {
                            filename: file,
                            start: e.location.start,
                            end: e.location.end,
                        };
                        let location: string = "";
                        if (!!e.location && !!e.location.start) {
                            location = ParseLocationUtil.locationPlus(file, errorLoc);
                        }
                        const errorstr = `${e.message.trimEnd()} ${location}`;
                        LOG2USER.error(errorstr);
                        throw new Error("syntax error: " + errorstr);
                    }
                }
            }
        }

        // combine the submodels into one
        model = this.merge(submodels);

        if (!!model) {
            // run the checker
            this.runChecker(model);
        }

        // return the model
        return model;
    }

    private runChecker(model: DEFINITION) {
        if (model !== undefined && model !== null) {
            this.checker.errors = [];
            this.checker.check(model);
            // this.checker.check makes errorlist empty, thus we must
            // add the non-fatal parse errors after the call
            this.checker.errors.push(...this.getNonFatalParseErrors());
            if (this.checker.hasErrors()) {
                this.checker.errors.forEach((error) => LOG2USER.error(`${error}`));
                throw new Error("checking errors (" + this.checker.errors.length + ").");
            }
            if (this.checker.hasWarnings()) {
                this.checker.warnings.forEach((warn) => LOG2USER.warning(`Warning: ${warn}`));
            }
        } else {
            throw new Error("parser does not return a language definition.");
        }
    }

    protected merge(submodels: DEFINITION[]): DEFINITION | undefined {
        if (submodels.length > 0) {
            throw Error("FreParser.merge should be implemented by its subclasses.");
        }
        return undefined;
    }

    // @ts-expect-error
    // error TS6133: 'file' is declared but its value is never read.
    // This error is ignored because this implementation is here merely to avoid it being called.
    protected setCurrentFileName(file: string) {
        throw Error("FreParser.setCurrentFileName should be implemented by its subclasses.");
    }

    // todo are the methods getNonFatalParseErrors and cleanNonFatalParseErrors useful?
    protected getNonFatalParseErrors(): string[] {
        throw Error("FreParser.getNonFatalParseErrors should be implemented by its subclasses.");
    }

    protected cleanNonFatalParseErrors() {
        // throw Error("FreParser.cleanNonFatalParseErrors should be implemented by its subclasses.");
    }

    protected location(elem: FreMetaDefinitionElement): string {
        if (!!elem.location) {
            return `[file: ${elem.location.filename}:${elem.location.start.line}:${elem.location.start.column}]`;
        }
        return `[no location]`;
    }
}
