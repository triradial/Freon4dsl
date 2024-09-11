import { BehaviorExecutionResult } from "../util";
import { FreUtils } from "../../util";
import { FreEditor } from "../internal";
import { AbstractChoiceBox, SelectOption, Box } from "./internal";
import { FreNode } from "../../ast";

export class ItemGroupBox2 extends AbstractChoiceBox {
  readonly kind: string = "ItemGroupBox2";
  deleteWhenEmpty: boolean = false;

  placeHolder: string = "";
  $label: string = "";
  $child: Box = null;
  isExpanded: boolean = false;
  isDraggable: boolean = true;
  isRequired: boolean = false;

  canDelete: boolean = false;
  canUnlink: boolean = true;
  canExpand: boolean = true;

  private getAllOptions: (editor: FreEditor) => SelectOption[];

  constructor(node: FreNode, role: string, 
    getLabel: string | (() => string), 
    getOptions: (editor: FreEditor) => SelectOption[],
    getSelectedOption: () => SelectOption | null,
    selectOption: (editor: FreEditor, option: SelectOption) => BehaviorExecutionResult,
    child: Box, initializer?: Partial<ItemGroupBox2>) {

    super(node, role, "<choose>", initializer);
    FreUtils.initializeObject(this, initializer);
    this.$child = child;
    this.setLabel(getLabel);    
    this.getAllOptions = getOptions;
    this.getSelectedOption = getSelectedOption;
    this.selectOption = selectOption;
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

    get child() {
        return this.$child;
    }

    set child(v: Box) {
        this.$child = v;
        this.$child.parent = this;
        this.isDirty();
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