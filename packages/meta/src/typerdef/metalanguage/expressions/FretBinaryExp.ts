// Generated by the Freon Language Generator.
import { FretExp } from "./FretExp.js";

/**
 * Class FretBinaryExp is the implementation of the binary expression concept with the same name in the language definition file.
 * It uses mobx decorators to enable parts of the language environment, e.g. the editor, to react
 * to any changes in the state of its properties.
 */
export abstract class FretBinaryExp extends FretExp {
    readonly $typename: string = "FretBinaryExp"; // holds the metatype in the form of a string

    // @ts-ignore Property is set during parsing and checking phases
    left: FretExp; // implementation of part 'left'
    // @ts-ignore Property is set during parsing and checking phases
    right: FretExp; // implementation of part 'right'

    toFreString() {
        return "TO BE IMPLEMENTED BY SUBCLASSES OF FretBinaryExp";
    }
}
