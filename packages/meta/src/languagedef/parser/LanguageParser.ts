import fs from "fs";
import { IdMap } from "../../commandline/IdMap.js";
import { FreMetaLanguage } from "../metalanguage/index.js";
import { FreGenericParser, LOG2USER } from "../../utils/index.js";
import { parser } from "./LanguageGrammar.js";

import { cleanNonFatalParseErrors, getNonFatalParseErrors, setCurrentFileName, setIdMap } from "./LanguageCreators.js";
import { FreLangChecker } from "../checking/FreLangChecker.js";

// const LOGGER = new MetaLogger("LanguageParser").mute();

export class LanguageParser extends FreGenericParser<FreMetaLanguage> {
    idFile: string | undefined;

    constructor(idFile?: string) {
        super();
        this.idFile = idFile ? idFile : undefined;
        this.parser = parser;
        this.checker = new FreLangChecker(undefined);
    }

    parse(definitionFile: string): FreMetaLanguage | undefined {
        LOG2USER.log("ParseFile: " + definitionFile);
        if (this.idFile !== undefined && this.idFile !== null && this.idFile.length > 0) {
            const idFileString = fs.readFileSync(this.idFile, "utf-8");
            const idJson = JSON.parse(idFileString);
            const idMap = this.parseIds(idJson);
            setIdMap(idMap);
        } else {
            LOG2USER.log("No id.json found");
        }
        return super.parse(definitionFile);
    }

    parseMulti(filePaths: string[]): FreMetaLanguage | undefined {
        if (this.idFile !== undefined && this.idFile !== null) {
            const idFileString = fs.readFileSync(this.idFile, "utf-8");
            const idJson = JSON.parse(idFileString);
            const idMap = this.parseIds(idJson);
            setIdMap(idMap);
        } else {
            LOG2USER.log("No id.json found");
        }
        return super.parseMulti(filePaths);
    }

    protected merge(submodels: FreMetaLanguage[]): FreMetaLanguage | undefined {
        if (submodels.length > 0) {
            const result: FreMetaLanguage = new FreMetaLanguage();
            result.name = submodels[0].name;
            for (const sub of submodels) {
                result.usedLanguages.push(sub.name);
                // if (sub.name === result.name) { // all submodels should be of the same language
                if (!!sub.modelConcept) {
                    result.modelConcept = sub.modelConcept;
                }
                result.units.push(...sub.units);
                result.concepts.push(...sub.concepts);
                result.interfaces.push(...sub.interfaces);
                // } else {
                //     LOGGER.error("All sublanguages should be of the same language, found sublanguage: '" + sub.name + "' in '" + result.name + "'.");
                // }
            }
            result.conceptsAndInterfaces().forEach((classifier) => {
                classifier.language = result;
            });
            return result;
        } else {
            return undefined;
        }
    }

    protected setCurrentFileName(file: string) {
        setCurrentFileName(file);
    }

    protected getNonFatalParseErrors(): string[] {
        return getNonFatalParseErrors();
    }

    protected cleanNonFatalParseErrors() {
        cleanNonFatalParseErrors();
    }

    private parseIds(json: any): IdMap {
        LOG2USER.log("PARSE IDS");
        const idMap = new IdMap();

        const jsonLanguages = json["languages"];
        for (const jsonLanguage of jsonLanguages) {
            idMap.setLanguageIdAndKey(jsonLanguage["language"], jsonLanguage["id"], jsonLanguage["key"]);
        }
        if (!Array.isArray(jsonLanguages)) {
            throw new Error("id.json 'languages' property should be an array");
        }
        const languageId = json["id"];
        if (typeof languageId === "string") {
            LOG2USER.log("Language has id " + languageId);
        }
        const concepts = json["concepts"];
        if (!Array.isArray(concepts)) {
            throw new Error("id.json 'concepts' property should be an array");
        }
        for (const jsonConcept of concepts) {
            idMap.setClassifierIdAndKey(jsonConcept["concept"], jsonConcept["id"], jsonConcept["key"]);
            const properties = jsonConcept["properties"];
            if (!Array.isArray(properties)) {
                throw new Error("id.json 'properties' property should be an array");
            }
            for (const jsonProperty of properties) {
                idMap.setPropertyIdAndKey(
                    jsonConcept["concept"],
                    jsonProperty["name"],
                    jsonProperty["id"],
                    jsonProperty["key"],
                );
            }
        }
        const interfaces = json["interfaces"];
        if (!Array.isArray(interfaces)) {
            throw new Error("id.json 'interfaces' property should be an array");
        }
        for (const jsonInterface of interfaces) {
            idMap.setClassifierIdAndKey(jsonInterface["interface"], jsonInterface["id"], jsonInterface["key"]);
            const properties = jsonInterface["properties"];
            if (!Array.isArray(properties)) {
                throw new Error("id.json 'properties' property should be an array");
            }
            for (const jsonProperty of properties) {
                idMap.setPropertyIdAndKey(
                    jsonInterface["interface"],
                    jsonProperty["name"],
                    jsonProperty["id"],
                    jsonProperty["key"],
                );
            }
        }
        console.log("End parse ids");
        return idMap;
    }
}
