declare module 'net.akehurst.language-agl-processor' {
    export class Agl {
        static getInstance(): Agl;
        processorFromString<T, C>(grammar: string, config: any): LanguageProcessorResult<T, C>;
        configuration(options: any, callback: (builder: any) => void): any;
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
        registerFor(name: string, handler: (node: SpptDataNodeInfo, children: KtList<object>, sentence: Sentence) => any): void;
    }

    export interface KtList<T> {
        asJsReadonlyArrayView(): T[];
    }

    export interface Sentence {
        locationFor(start: number, length: number): { line: number; column: number };
    }

    export interface SpptDataNodeInfo {
        node: SpptDataNode;
    }

    export interface SpptDataNode {
        startPosition: number;
        nextInputNoSkip: number;
    }

    export interface SPPTBranch {
        // Add any specific properties if needed
    }
} 