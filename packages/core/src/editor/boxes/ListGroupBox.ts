import { Box } from "./Box";
import { FreUtils } from "../../util";
import { BehaviorExecutionResult } from "../util";
import { FreNode } from "../../ast";
import { FreLogger } from "../../logging";
import { FrePostAction } from "../actions";
import { runInAction } from "mobx";
import  {FreEditor } from "../FreEditor";

const LOGGER: FreLogger = new FreLogger("ListGroupBox"); //.mute();

export class ListGroupBox extends Box {
    readonly kind = "ListGroupBox";
    
    private $label: string = "";
    private $child: Box = null;

    isExpanded: boolean = true;
    hasActions: boolean = true;  

    constructor(node: FreNode, role: string, getLabel: string | (() => string), child: Box, initializer?: Partial<ListGroupBox>) {
        super(node, role);
        FreUtils.initializeObject(this, initializer);
        this.setLabel(getLabel);
        this.child = child;
    }

    setLabel(getLabel: string | (() => string)) {
        if (typeof getLabel === "function") {
            if (this.getLabel !== getLabel) {
                this.getLabel = getLabel;
                this.isDirty();
            }
        } else if (typeof getLabel === "string") {
            if (this.$label !== getLabel) {
                this.$label = getLabel;
                this.isDirty();
            }
        } else {
            throw new Error("ListGroupBox: incorrect label type");
        }
    }

    getLabel(): string {
        return this.$label;
    }

    get child() {
        return this.$child;
    }

    set child(v: Box) {
        this.$child = v;
        this.$child.parent = this;
        this.isDirty();
    }

    get firstLeaf(): Box {
        return this.child.firstLeaf;
    }

    get lastLeaf(): Box {
        return this.child.lastLeaf;
    }

    get firstEditableChild(): Box {
        return this.child.firstEditableChild;
    }

    get children(): ReadonlyArray<Box> {
        return [this.child];
    }  

    executeAction(editor: FreEditor):BehaviorExecutionResult {
        // find the action to use based on the boxRole
        for (const action of editor.newFreActions) {
            if (action.activeInBoxRoles.includes(this.role)) {
                let postAction: FrePostAction = null;
                runInAction(() => {
                    const command = action.command();
                    postAction = command.execute(this, 'no-label', editor, -1);
                });
                if (!!postAction) {
                    postAction();
                }
                return BehaviorExecutionResult.EXECUTED;
            }
        }
        // execute the action
        // return the result
        LOGGER.log("Executing ButtonBox Action");
        return BehaviorExecutionResult.NULL;
    }
} 
    
export function isListGroupBox(b: Box): b is ListGroupBox {
    return b?.kind === "ListGroupBox"; // b instanceof ListGroupBox;
}
