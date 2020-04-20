import { PiBehavior, PiTriggerType } from "../editor/PiAction";
import { PiKey } from "./Keys";
import { remove, union } from "lodash";

export class PiActionsUtil {
    static join(defaultActions: PiBehavior[], newActions: PiBehavior[]) {
        newActions.forEach(newA => this.remove(defaultActions, newA));
        return union(defaultActions, newActions);
    }

    static remove(from: PiBehavior[], item: PiBehavior) {
        remove(from, e => this.equalsTrigger(e.trigger, item.trigger));
    }

    static equalsTrigger(trigger1: PiTriggerType, trigger2: PiTriggerType): boolean {
        let type1: string = typeof trigger1;
        let type2: string = typeof trigger2;

        if (type1 === type2) {
            if (type1 === "string") {
                return type1 === type2;
            } else if (type1 === "object") {
                type1 = trigger1["meta"] === undefined ? "PiKey" : "RegExp";
                type2 = trigger2["meta"] === undefined ? "PiKey" : "RegExp";
                if (type1 === type2) {
                    if (type1 === "PiKey") {
                        const key1 = trigger1 as PiKey;
                        const key2 = trigger2 as PiKey;
                        return key1.meta === key2.meta && key1.keyCode === key2.keyCode;
                    } else {
                        const regexp1 = trigger1 as RegExp;
                        const regexp2 = trigger2 as RegExp;
                        return regexp1.source === regexp2.source;
                    }
                }
            }
        }
        return false;
    }
}
