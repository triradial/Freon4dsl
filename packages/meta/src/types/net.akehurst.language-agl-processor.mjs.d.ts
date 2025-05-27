declare module 'net.akehurst.language-agl-processor/net.akehurst.language-agl-processor.mjs' {
    export class Agl {
        static getInstance(): Agl;
        processorFromString(grammar: string, config: any): LanguageProcessorResult<any, any>;
        configuration(undefined: undefined, callback: (b: any) => void): any;
    }

    export interface LanguageProcessor<T, C> {
        process(input: string, options: any): ProcessResult<T>;
        optionsDefault(): any;
    }

    export interface LanguageProcessorResult<T, C> {
        processor: LanguageProcessor<T, C>;
    }

    export interface ProcessResult<T> {
        asm: T;
        issues: {
            errors: {
                asJsReadonlyArrayView(): LanguageIssue[];
            };
        };
    }

    export interface LanguageIssue {
        message: string;
        location?: {
            line: number;
            column: number;
        };
    }

    export interface SentenceContext<T> {
        predefined: Map<string, T>;
    }

    export class SyntaxAnalyserByMethodRegistrationAbstract<T> {
        registerFor(name: string, handler: Function): void;
    }

    export type KtList<T> = {
        asJsReadonlyArrayView(): T[];
    };

    export type Sentence = any;
    export type SpptDataNodeInfo = any;
    export type SpptDataNode = any;
    export type SPPTBranch = any;
} 