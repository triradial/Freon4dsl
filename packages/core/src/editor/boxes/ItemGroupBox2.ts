import { BehaviorExecutionResult } from "../util/index.js";
import { FreUtils } from "../../util/index.js";
import { FreEditor } from "../internal.js";
import { AbstractChoiceBox, Box } from "./internal.js";
import type { SelectOption } from "./internal.js";
import type { FreNode } from "../../ast/index.js";

export class ItemGroupBox2 extends AbstractChoiceBox {
    readonly kind: string = "ItemGroupBox2";
    deleteWhenEmpty: boolean = false;

    placeHolder: string = "";
    $label: string = "";
    $child: Box = null;
    protected _children: Box[] = [];

    isExpanded: boolean = false;
    isDraggable: boolean = true;
    isRequired: boolean = false;
    canDelete: boolean = false;
    canUnlink: boolean = true;
    canExpand: boolean = true;

    private getAllOptions: (editor: FreEditor) => SelectOption[];
    _innerSelectOption: (editor: FreEditor, option: SelectOption) => BehaviorExecutionResult;

    constructor(
        node: FreNode,
        role: string,
        getLabel: string | (() => string),
        getOptions: (editor: FreEditor) => SelectOption[],
        getSelectedOption: () => SelectOption | null,
        selectOption: (editor: FreEditor, option: SelectOption) => BehaviorExecutionResult,
        child: Box,
        initializer?: Partial<ItemGroupBox2>,
    ) {
        super(node, role, "<options>", initializer);
        FreUtils.initializeObject(this, initializer);
        if (!!child) {
            this.addChild(child);
        }
        this.$child = child;
        this.setLabel(getLabel);
        this.getAllOptions = getOptions;
        this.getSelectedOption = getSelectedOption;
        this._innerSelectOption = selectOption;
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
            throw new Error("LabelBox: incorrect label type");
        }
    }

    getLabel(): string {
        return this.$label;
    }

    get children(): Box[] {
        return this._children;
    }

    addChildren(children?: Box[]): ItemGroupBox2 {
        if (!!children) {
            children.forEach((child) => {
                this._children.push(child);
                child.parent = this;
            });
            this.isDirty();
        }
        return this;
    }

    get child() {
        return this.$child;
    }

    set child(v: Box) {
        this.$child = v;
        this.$child.parent = this;
        this.isDirty();
    }

    addChild(child: Box | null): ItemGroupBox2 {
        if (!!child) {
            this._children.push(child);
            child.parent = this;
            this.isDirty();
        }
        return this;
    }

    getOptions(editor: FreEditor): SelectOption[] {
        // console.log("Options for " + this.element.freLanguageConcept() + this.getAllOptions(editor).map(opt => {
        //     opt.label
        // }))
        return this.getAllOptions(editor);
    }

    public deleteWhenEmpty1(): boolean {
        return this.deleteWhenEmpty;
    }
}

export function isItemGroupBox2(b: Box): b is ItemGroupBox2 {
    return !!b && b.kind === "ItemGroupBox2"; // b instanceof ItemGroupBox;
}
