import { observable } from "mobx";
import { DemoModelElement } from "../";
import { model } from "@projectit/core";

export abstract class DemoMember {}

@model
export class DemoAttributeRef extends DemoMember {
    $typename: string = "DemoAttributeRef";
    @observable attributeName = " ";

    constructor() {
        super();
        this.getName = this.getName.bind(this);
    }

    getName() {
        return this.attributeName;
    }

    asString(): string {
        return "/" + this.attributeName;
    }
}

@model
export class DemoAssociationRef extends DemoMember {
    $typename: string = "DemoAssociationRef";
    @observable associationName = " ";
    asString(): string {
        return "//" + this.associationName;
    }
}
