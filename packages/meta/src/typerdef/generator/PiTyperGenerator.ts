import { Helpers } from "../../utils/Helpers";
import { PiLanguageUnit } from "../../languagedef/metalanguage/PiLanguage";
import * as fs from "fs";
import { TYPER_FOLDER, TYPER_GEN_FOLDER } from "../../utils/GeneratorConstants";
import { Names } from "../../utils/Names";
import { PiLogger } from "../../../../core/src/util/PiLogging";
import { PiTyperDef } from "../../typerdef/metalanguage/PiTyperDefLang";
import { PiTyperTemplate } from "./templates/PiTyperTemplate";

const LOGGER = new PiLogger("PiTyperGenerator"); // .mute();
export class PiTyperGenerator {
    public outputfolder: string = ".";
    public language: PiLanguageUnit;
    protected typerGenFolder: string;
    protected typerFolder: string;

    constructor(language: PiLanguageUnit) {
        this.language = language;
    }

    generate(typerdef: PiTyperDef, verbose?: boolean): void {
        this.typerFolder = this.outputfolder + "/" + TYPER_FOLDER;
        this.typerGenFolder = this.outputfolder + "/" + TYPER_GEN_FOLDER;
        if (verbose) LOGGER.log("Generating typer: " + typerdef.name + " in folder " + this.typerGenFolder);

        const typer = new PiTyperTemplate();

        //Prepare folders
        Helpers.createDirIfNotExisting(this.typerFolder, verbose);
        Helpers.createDirIfNotExisting(this.typerGenFolder, verbose);

        //  Generate validator
        // if (verbose) LOGGER.log("Generating typer class");
        // var typerFile = Helpers.pretty(typer.generateTyper(this.language, typerdef), "Validator Class", verbose);
        // fs.writeFileSync(`${this.typerGenFolder}/${Names.validator(this.language, typerdef)}.ts`, typerFile);

        if (verbose) LOGGER.log("Succesfully generated typer: " + typerdef.name);
    } 
}
