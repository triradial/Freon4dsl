// Generated by the Freon Language Generator.
import {
    FreCustomAction,
    FreCombinedActions,
    Box,
    FreTriggerType,
    FreEditor,
    FreCaret,
    FreNode,
    FreNodeReference,
    OptionalBox,
    FreCreateBinaryExpressionAction,
    FreTriggerUse,
    isString,
    ActionBox,
    ownerOfType,
    BoxUtil,
} from "@freon4dsl/core";

// import { addListElement } from '@freon4dsl/core';

import {
    NumberLiteralExpression,
    EventSchedule,
    Period,
    Staffing,
    Assignment,
    Event,
    Task,
    Step,
    Reference,
    SystemAccess,
    RobotMapping,
    SourceToTargetMapping,
    Person,
    StudyConfiguration,
    PatientInfo,
    PatientHistory,
} from "../language/gen";

import { RoleProvider } from "@freon4dsl/core";
import { ExtendedEvent, extension } from "../custom/extensions/ExtensionLib";

/**
 * Class CustomStudyConfigurationModelActions provides an entry point for the language engineer to
 * define custom build additions to the editor.
 * These custom build additions are merged with the default and definition-based editor parts
 * in a three-way manner. For each modelelement,
 * (1) if a custom build creator/behavior is present, this is used,
 * (2) if a creator/behavior based on the editor definition is present, this is used,
 * (3) if neither (1) nor (2) yields a result, the default is used.
 */
export class CustomStudyConfigurationModelActions implements FreCombinedActions {
    binaryExpressionActions: FreCreateBinaryExpressionAction[] = MANUAL_BINARY_EXPRESSION_ACTIONS;
    customActions: FreCustomAction[] = MANUAL_CUSTOM_ACTIONS;
}

export const MANUAL_BINARY_EXPRESSION_ACTIONS: FreCreateBinaryExpressionAction[] = [
    // Add your own custom binary expression actions here
];

export const MANUAL_CUSTOM_ACTIONS: FreCustomAction[] = [
    FreCustomAction.create({
        activeInBoxRoles: [
            "FreBinaryExpression-left",
            "FreBinaryExpression-right",
            "MultiplyExpression-left",
            "MultiplyExpression-right",
            "PlusExpression-left",
            "PlusExpression-right",
            "DivideExpression-left",
            "DivideExpression-right",
            "AndExpression-left",
            "AndExpression-right",
            "OrExpression-left",
            "OrExpression-right",
            "ComparisonExpression-left",
            "ComparisonExpression-right",
            "LessThenExpression-left",
            "LessThenExpression-right",
            "GreaterThenExpression-left",
            "GreaterThenExpression-right",
            "EqualsExpression-left",
            "EqualsExpression-right",
            "Day-startDay",
        ],
        trigger: /[0-9]/,
        action: (box: Box, trigger: FreTriggerUse, editor: FreEditor) => {
            const parent = box.node;
            const x = new NumberLiteralExpression();
            if (isString(trigger)) {
                x.value = Number.parseInt(trigger.toString());
            }
            parent[(box as ActionBox).propertyName] = x;
            return x;
        },
        boxRoleToSelect: RoleProvider.property("NumberLiteralExpression", "value", "numberbox"),
        caretPosition: FreCaret.RIGHT_MOST,
    }),
    FreCustomAction.create({
        activeInBoxRoles: ["periods"],
        trigger: "add",
        action: (box: Box, trigger: FreTriggerType, ed: FreEditor): FreNode | null => {
            const studyconfig: StudyConfiguration = box.node as StudyConfiguration;
            const period: Period = Period.create({});
            studyconfig.periods.push(period);
            return null;
        },
    }),
    FreCustomAction.create({
        activeInBoxRoles: ["period"],
        trigger: "delete",
        action: (box: Box, trigger: FreTriggerType, ed: FreEditor): FreNode | null => {
            const period: Period = box.node as Period;
            const studyconfig: StudyConfiguration = ownerOfType(period, "StudyConfiguration") as StudyConfiguration; //box.parent.parent.parent.element as StudyConfiguration;
            const index = period.freOwnerDescriptor().propertyIndex; //studyconfig.periods.indexOf(period);
            studyconfig.periods.splice(index, 1);
            return null;
        },
    }),
    FreCustomAction.create({
        activeInBoxRoles: ["events"],
        trigger: "add",
        action: (box: Box, trigger: FreTriggerType, ed: FreEditor): FreNode | null => {
            const period: Period = box.node as Period;
            const event: Event = Event.create({});
            period.events.push(event);
            return null;
        },
    }),
    FreCustomAction.create({
        activeInBoxRoles: ["event"],
        trigger: "delete",
        action: (box: Box, trigger: FreTriggerType, ed: FreEditor): FreNode | null => {
            const event: Event = box.node as Event;
            const period: Period = ownerOfType(event, "Period") as Period; //box.parent.parent.parent.element as Period;
            const index = event.freOwnerDescriptor().propertyIndex; //period.events.indexOf(event);
            period.events.splice(index, 1);
            return null;
        },
    }),
    FreCustomAction.create({
        activeInBoxRoles: ["tasks"],
        trigger: "add",
        action: (box: Box, trigger: FreTriggerType, ed: FreEditor): FreNode | null => {
            const event: Event = box.node as Event;
            const task: Task = Task.create({});
            event.tasks.push(task);
            return null;
        },
    }),
    FreCustomAction.create({
        activeInBoxRoles: ["task"],
        trigger: "delete",
        action: (box: Box, trigger: FreTriggerType, ed: FreEditor): FreNode | null => {
            const task: Task = box.node as Task;
            const event: Event = ownerOfType(task, "Event") as Event;
            const index = task.freOwnerDescriptor().propertyIndex;
            event.tasks.splice(index, 1);
            return null;
        },
    }),
    FreCustomAction.create({
        activeInBoxRoles: ["steps"],
        trigger: "add",
        action: (box: Box, trigger: FreTriggerType, ed: FreEditor): FreNode | null => {
            const task: Task = box.node as Task;
            const step: Step = Step.create({});
            task.steps.push(step);
            return null;
        },
    }),
    FreCustomAction.create({
        activeInBoxRoles: ["step"],
        trigger: "delete",
        action: (box: Box, trigger: FreTriggerType, ed: FreEditor): FreNode | null => {
            const step: Step = box.node as Step;
            const task: Task = ownerOfType(step, "Task") as Task; //box.parent.parent.parent.element as Task;
            const index = step.freOwnerDescriptor().propertyIndex; // task.steps.indexOf(step);
            task.steps.splice(index, 1);
            return null;
        },
    }),
    FreCustomAction.create({
        activeInBoxRoles: ["references"],
        trigger: "add",
        action: (box: Box, trigger: FreTriggerType, ed: FreEditor): FreNode | null => {
            const step: Step = box.node as Step;
            const reference: Reference = Reference.create({});
            step.references.push(reference);
            return null;
        },
    }),
    FreCustomAction.create({
        activeInBoxRoles: ["reference"],
        trigger: "delete",
        action: (box: Box, trigger: FreTriggerType, ed: FreEditor): FreNode | null => {
            const reference: Reference = box.node as Reference;
            const step: Step = ownerOfType(reference, "Step") as Step; //box.parent.parent.parent.element as Step;
            const index = reference.freOwnerDescriptor().propertyIndex; //step.references.indexOf(reference);
            step.references.splice(index, 1);
            return null;
        },
    }),
    FreCustomAction.create({
        activeInBoxRoles: ["systems"],
        trigger: "add",
        action: (box: Box, trigger: FreTriggerType, ed: FreEditor): FreNode | null => {
            const step: Step = box.node as Step;
            const system: SystemAccess = SystemAccess.create({});
            step.systems.push(system);
            return null;
        },
    }),
    FreCustomAction.create({
        activeInBoxRoles: ["system"],
        trigger: "delete",
        action: (box: Box, trigger: FreTriggerType, ed: FreEditor): FreNode | null => {
            const system: SystemAccess = box.node as SystemAccess;
            const step: Step = ownerOfType(system, "Step") as Step; //box.parent.parent.parent.element as Step;
            const index = system.freOwnerDescriptor().propertyIndex; //step.systems.indexOf(system);
            step.systems.splice(index, 1);
            return null;
        },
    }),
    FreCustomAction.create({
        activeInBoxRoles: ["people"],
        trigger: "add",
        action: (box: Box, trigger: FreTriggerType, ed: FreEditor): FreNode | null => {
            const step: Step = box.node as Step;
            const person: Person = Person.create({});
            step.people.push(person);
            return null;
        },
    }),
    FreCustomAction.create({
        activeInBoxRoles: ["event"],
        trigger: "duplicate",
        action: (box: Box, trigger: FreTriggerType, ed: FreEditor): FreNode | null => {
            const event: Event = box.node as Event;
            const period: Period = ownerOfType(event, "Period") as Period; //box.parent.parent.parent.element as Period;
            const copyOfEvent = event.copy();
            extension(ExtendedEvent, Event);
            smartDuplicate(event, copyOfEvent);
            const index = period.events.indexOf(event);
            console.log("custom action duplicate, splicing in copyOfEvent: " + copyOfEvent.name + " at index: " + index);
            period.events.splice(index + 1, 0, copyOfEvent);
            return null;
        },
    }),

    FreCustomAction.create({
        activeInBoxRoles: ["person"],
        trigger: "delete",
        action: (box: Box, trigger: FreTriggerType, ed: FreEditor): FreNode | null => {
            const person: Person = box.node as Person;
            const step: Step = ownerOfType(person, "Step") as Step; //box.parent.parent.parent.element as Step;
            const index = person.freOwnerDescriptor().propertyIndex; //step.people.indexOf(person);
            step.people.splice(index, 1);
            return null;
        },
    }),

    FreCustomAction.create({
        activeInBoxRoles: ["task"],
        trigger: "make-shareable",
        action: (box: Box, trigger: FreTriggerType, ed: FreEditor): FreNode | null => {
            const task: Task = box.node as Task;
            makeTaskShareable(task);
            return null;
        },
    }),

    FreCustomAction.create({
        activeInBoxRoles: ["patients"],
        trigger: "add",
        action: (box: Box, trigger: FreTriggerType, ed: FreEditor): FreNode | null => {
            const patientInfo: PatientInfo = box.node as PatientInfo;
            const patientHistory: PatientHistory = PatientHistory.create({});
            patientInfo.patientHistories.push(patientHistory);
            return null;
        },
    }),
];

/* #region Task functions */

function makeTaskShareable(task: Task) {
    console.log("SHARED: referencedTask is null so task is just becoming shared");
    // Get the study config context
    let studyConfig = task.freOwner().freOwner().freOwner().freOwner() as StudyConfiguration;
    // Create the shard task and wire together
    let refToTask = FreNodeReference.create(task.name, "Task") as FreNodeReference<Task>;
    let sharedTask = task.copy();
    // sharedTask.type = "S";
    task.name = "Original Task";
    refToTask.referred = sharedTask;
    //task.referencedTask = refToTask;
    // task.type = "R";
    // Add to the shared tasks list
    studyConfig.tasks.push(sharedTask);
}

function makeTaskUnreferenced(task: Task) {}

function smartDuplicate(originalElement: FreNode, duplicatedElement: FreNode) {
    const methodName = "smartUpdate";
    const args = [originalElement, duplicatedElement];
    // Call methodName if it exists on the element
    if (methodName in duplicatedElement && typeof (duplicatedElement as any)[methodName] === "function") {
        console.log(`smartDuplicate: Calling ${methodName} on the instance.`);
        return (duplicatedElement as any)[methodName](...args);
    } else {
        console.log(`Method ${methodName} does not exist on the instance.`);
    }
}

/* #endregion */
