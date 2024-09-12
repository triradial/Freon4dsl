import { FreMetaLanguage } from "../metalanguage/FreMetaLanguage.js";
import { FreLangExpressionChecker } from "../checking/FreLangExpressionChecker.js";
import { FreGenericParser } from "../../utils/parsingAndChecking/FreGenericParser.js";
import { LanguageExpressionTester } from "./LanguageExpressionTester.js";
import { parser } from "./ExpressionGrammar.js";
import { setCurrentFileName } from "./ExpressionCreators.js";

export class LanguageExpressionParser extends FreGenericParser<LanguageExpressionTester> {
    public language: FreMetaLanguage;

    constructor(language: FreMetaLanguage) {
        super();
        this.parser = parser;
        this.language = language;
        this.checker = new FreLangExpressionChecker(this.language);
    }

    // @ts-ignore
    // error TS6133: 'submodels' is declared but its value is never read.
    // This error is ignored because this class is only used for tests.
    protected merge(submodels: LanguageExpressionTester[]): LanguageExpressionTester | undefined {
        // no need to merge submodels, LanguageExpressionTester is only used for tests
        return undefined;
    }

    protected setCurrentFileName(file: string) {
        setCurrentFileName(file);
    }

    protected getNonFatalParseErrors(): string[] {
        return [];
    }

    protected cleanNonFatalParseErrors() {}
}
