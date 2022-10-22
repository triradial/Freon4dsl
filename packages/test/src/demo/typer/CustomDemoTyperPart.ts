// Generated by the ProjectIt Language Generator.
import { FreCompositeTyper, FreTyper, PiElement, PiType } from "@projectit/core";
import { DemoEntity } from "../language/gen";
import { DemoEnvironment } from "../config/gen/DemoEnvironment";

/**
 * Class 'CustomDemoTyperPart' is meant to be a convient place to add any
 * custom code for type checking.
 */
export class CustomDemoTyperPart implements FreTyper {
    mainTyper: FreCompositeTyper;

    isType(elem: PiElement): boolean | null {
        return null;
    }

    inferType(modelelement: PiElement): PiType | null {
        return null;
    }

    equals(type1: PiType, type2: PiType): boolean | null {
        return null;
    }

    conforms(type1: PiType, type2: PiType): boolean | null {
        return null;
    }

    conformsList(typelist1: PiType[], typelist2: PiType[]): boolean | null {
        // console.log(`Third level is called, length: ${typelist1.length}, kind: ${typelist1[0].$typename}`);
        if (typelist1.length > 0 && (typelist1[0].toAstElement() instanceof DemoEntity)) {
            if (typelist1.length !== typelist2.length) {
                return false;
            }
            let result: boolean = true;
            const maxLength = typelist1.length;
            for (let i = 0; i < maxLength; i++) {
                // console.log(`comparing typelist1[${i}]: ${(typelist1[i]).toAstElement()?.piId()} with typelist2[${maxLength - i - 1}]: ${typelist2[maxLength - i -1].toAstElement()?.piId()}`);
                result = DemoEnvironment.getInstance().typer.conforms(typelist1[i], typelist2[maxLength - i - 1]);
                if (result === false) {
                    return result;
                }
            }
            return result;
        } else {
            return null;
        }
    }

    commonSuper(typelist: PiType[]): PiType | null {
        return null;
    }

    public getSuperTypes(type: PiType): PiType[] | null {
        return null;
    }
}
