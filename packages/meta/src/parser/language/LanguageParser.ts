import * as fs from "fs";
import { PiLanguage } from "../../metalanguage/PiLanguage";
import { PiLanguageChecker } from "../../metalanguage/PiLanguageChecker";
import { PiParser } from "../PiParser";
let pegjsParser = require("./LanguageGrammar");

export class LanguageParser extends PiParser<PiLanguage> {

    constructor() {
        super();
        this.parser = pegjsParser;
        this.msg = "Language";
        this.checker = new PiLanguageChecker();
    }
}
