// Generated by the Freon Language Generator.
import {
    FreNode,
    FreLanguage,
    FreProjection,
    FreProjectionHandler,
    FreTableDefinition,
    ownerOfType,
    FRE_BINARY_EXPRESSION_LEFT,
    FRE_BINARY_EXPRESSION_RIGHT,
    Box,
    createDefaultExpressionBox,
    TableRowBox,
    MultiLineTextBox2,
    BoxFactory,
    BoxUtil,
    BoolDisplay,
    FreNodeReference,
    TableUtil,
} from "@freon4dsl/core";
import {
    StudyConfiguration,
    Description,
    Period,
    Event,
    EventSchedule,
    Task,
    TaskReference,
    AbstractTask,
    Step,
    SystemAccess,
    Reference,
    Person,
    TypeOfEvent,
    PatientInfo,
    PatientHistory,
} from "../language/gen";
import { StudyConfigurationModelEnvironment } from "../config/gen/StudyConfigurationModelEnvironment";
import { result } from "lodash";
import { elementFromString } from "@tiptap/core";
// import { TaskBoxProvider, SystemAccessBoxProvider } from "../editor";

/**
 * Class CustomStudyConfigurationModelProjection provides an entry point for the language engineer to
 * define custom build additions to the editor.
 * These are merged with the custom build additions and other definition-based editor parts
 * in a three-way manner. For each modelelement,
 * (1) if a custom build creator/behavior is present, this is used,
 * (2) if a creator/behavior based on one of the editor definition is present, this is used,
 * (3) if neither (1) nor (2) yields a result, the default is used.
 */

export class CustomStudyConfigurationModelProjection implements FreProjection {
    name: string = "Custom";
    handler: FreProjectionHandler;
    nodeTypeToBoxMethod: Map<string, (node: FreNode) => Box> = new Map<string, (node: FreNode) => Box>([
        ["StudyConfiguration", this.projectStudyConfiguration],
        ["Description", this.projectDescription],
        ["Period", this.projectPeriod],
        ["Event", this.projectEvent],
        ["EventSchedule", this.projectSchedule],
        ["Task", this.projectTask],
        ["TaskReference", this.projectTask],
        ["Step", this.projectStep],
        ["Reference", this.projectReference],
        ["SystemAccess", this.projectSystem],
        ["Person", this.projectPerson],
        ["PatientInfo", this.projectPatientInfo],
        ["PatientHistory", this.projectPatientHistory],
    ]);

    nodeTypeToTableDefinition: Map<string, () => FreTableDefinition> = new Map<string, () => FreTableDefinition>([
        // register your custom table definition methods here
        // ['NAME_OF_CONCEPT', this.TABLE_DEFINITION_FOR_CONCEPT],
    ]);

    getTableHeadersFor(projectionName: string): TableRowBox {
        return null;
    }

    // For each table projection to override the meta-programming pattern is:
    // - Use a type assertion to access the private getTableRowFor_default method on the XXXProvider prototype
    // - Assign the new implementation to the method
    //
    // overrideTableProjects() {
    //     const taskBoxProviderPrototype = TaskBoxProvider.prototype as any;
    //     taskBoxProviderPrototype.getTableRowFor_default = newGetTableRowFor_defaultTaskImplementation;

    //     const systemAccessBoxProviderPrototype = SystemAccessBoxProvider.prototype as any;
    //     systemAccessBoxProviderPrototype.getTableRowFor_default = newGetTableRowFor_defaultSystemAccessImplementation;
    // }

    ////////////////////////////////////////////////////////////////////
    /**
     * Creates a study configuration box based on the provided element.
     *
     * @param element - The study configuration element.
     * @returns The created study configuration box.
     */
    projectStudyConfiguration(studyconfig: StudyConfiguration): Box {
        const element: StudyConfiguration = studyconfig;
        return BoxFactory.verticalLayout(element, "StudyConfiguration-overall", "", [
            BoxUtil.listGroupBox(
                element,
                "study-options",
                "Options",
                BoxFactory.verticalLayout(
                    element,
                    "StudyConfiguration-vlist-line-3",
                    "",
                    [
                        BoxUtil.emptyLineBox2(element, "option-empty-line", "h-2"),
                        BoxUtil.switchElement(element, "showActivityDetails", "Show Shared Tasks"),
                        BoxUtil.switchElement(element, "showSystems", "Show Systems"),
                        BoxUtil.switchElement(element, "showScheduling", "Show Scheduling"),
                        BoxUtil.switchElement(element, "showChecklists", "Show Checklists"),
                    ],
                    { cssClass: "w-full ml-4" },
                ),
                { cssClass: "type1", isExpanded: true },
            ),
            BoxUtil.listGroupBox(
                element,
                "periods",
                "Study Periods",
                BoxUtil.verticalPartListBox(element, element.periods, "periods", null, this.handler, { cssClass: "ml-6 mb-2" }),
                { cssClass: "type1 mt-2", isExpanded: true, canAdd: true },
            ),
            ...(element.showActivityDetails === true
                ? [
                      BoxUtil.listGroupBox(
                          element,
                          "shared-tasks",
                          "Shared Tasks",
                          BoxUtil.verticalPartListBox(element, element.tasks, "tasks", null, this.handler, { cssClass: "ml-6 mb-2" }),
                          { cssClass: "type1 mt-2", isExpanded: true, canAdd: true },
                      ),
                      ...(element.showSystems === true
                          ? [
                                BoxUtil.listGroupBox(
                                    element,
                                    "shared-systems",
                                    "Systems",
                                    BoxUtil.verticalPartListBox(element, element.systemAccesses, "systemAccesses", null, this.handler, {
                                        cssClass: "ml-6 mb-2",
                                    }),
                                    { cssClass: "type1 mt-2", isExpanded: true, canAdd: true },
                                ),
                            ]
                          : []),
                      BoxUtil.listGroupBox(
                          element,
                          "shared-people",
                          "People",
                          BoxUtil.indentBox(element, 4, "21", BoxUtil.getBoxOrAction(element, "staffing", "Staffing", this.handler)),
                          { cssClass: "type1 mt-2", isExpanded: true, canAdd: true },
                      ),
                  ]
                : []),
        ]);
    }

    projectDescription(description: Description): Box {
        const element: Description = description;
        const ph = "<" + element.$$propertyName + ">";
        return new MultiLineTextBox2(
            element,
            "study-part-description",
            () => {
                return element.text;
            },
            (t: string) => {
                element.text = t;
            },
            { placeHolder: ph, cssClass: "mr-2 mb-2" },
        );
    }

    projectPeriod(period: Period): Box {
        const element: Period = period;
        let box: Box = BoxUtil.itemGroupBox(
            element,
            "period",
            "Period:",
            "name",
            BoxFactory.verticalLayout(
                element,
                "period-detail",
                "",
                [
                    BoxFactory.horizontalLayout(
                        element,
                        "period-hlist-line-1",
                        "",
                        [BoxUtil.getBoxOrAction(element, "description", "Description", this.handler)],
                        { selectable: false, cssClass: "w-full mt-1 align-top" },
                    ),
                    BoxUtil.listGroupBox(
                        element,
                        "events",
                        "Events",
                        BoxUtil.verticalPartListBox(element, element.events, "events", null, this.handler, { cssClass: "ml-6 mt-2 mb-2" }),
                        { cssClass: "type2", isExpanded: true, canAdd: true },
                    ),
                ],
                { cssClass: "ml-8 mb-2" },
            ),
            { cssClass: "type1", placeHolder: "enter", isExpanded: false, isRequired: true },
        );
        return box;
    }

    projectEvent(event: Event): Box {
        const element: Event = event;
        const showScheduling = ((element.freOwner() as Period).freOwner() as StudyConfiguration).showScheduling;
        const showChecklists = ((element.freOwner() as Period).freOwner() as StudyConfiguration).showChecklists;
        let box: Box = BoxUtil.itemGroupBox(
            element,
            "event",
            "Event:",
            "name",
            BoxFactory.verticalLayout(
                element,
                "Event-detail",
                "",
                [
                    BoxFactory.horizontalLayout(element, "EventSchedule-hlist-line-0", "", [
                        BoxUtil.labelBox(element, "Alt-Name:", "alt-top-1-line-9-item-0"),
                        BoxUtil.textBox(element, "alternativeName"),
                    ]),
                    BoxFactory.horizontalLayout(element, "TypeOfEvent-hlist-line-0", "", [
                        BoxUtil.labelBox(element, "Type:", "typeOfEvent-kind-alt-top-1-line-9-item-0"),
                        BoxUtil.referenceBox(
                            element,
                            "typeOfEvent",
                            (selected: string) => {
                                element.typeOfEvent = FreNodeReference.create<TypeOfEvent>(selected, "TypeOfEvent");
                            },
                            StudyConfigurationModelEnvironment.getInstance().scoper,
                        ),
                    ]),
                    BoxUtil.getBoxOrAction(element, "description", "Description", this.handler),
                    ...(showScheduling === true
                        ? [
                              BoxUtil.listGroupBox(
                                  element,
                                  "schedule",
                                  "Schedule",
                                  BoxUtil.getBoxOrAction(element, "schedule", "EventSchedule", this.handler),
                                  { cssClass: "type3", isExpanded: true },
                              ),
                          ]
                        : []),
                    ...(showChecklists === true
                        ? [
                              BoxUtil.listGroupBox(
                                  element,
                                  "tasks",
                                  "Checklist",
                                  BoxUtil.verticalPartListBox(element, element.tasks, "tasks", null, this.handler, { cssClass: "ml-6 mt-2 mb-2" }),
                                  { cssClass: "type3", isExpanded: true, canAdd: true },
                              ),
                          ]
                        : []),
                ],
                { cssClass: "ml-6 mb-2" },
            ),
            { cssClass: "type2", placeHolder: "enter", isRequired: true, selectable: true, canDuplicate: true },
        );
        return box;
    }

    projectSchedule(event: EventSchedule): Box {
        const element: EventSchedule = event;
        let box: Box = BoxFactory.verticalLayout(
            element,
            "EventSchedule-overall",
            "",
            [
                BoxFactory.horizontalLayout(
                    element,
                    "schedule-event-start-group",
                    "",
                    [
                        BoxUtil.labelBox(element, "First scheduled:", "schedule-event-start-label"),
                        BoxUtil.getBoxOrAction(element, "eventStart", "EventStart", this.handler),
                    ],
                    { selectable: true, cssClass: "align-top" },
                ),

                BoxFactory.horizontalLayout(
                    element,
                    "EventSchedule-hlist-line-2",
                    "",
                    [
                        BoxUtil.labelBox(element, "with a window of:", "schedule-window"),
                        BoxUtil.getBoxOrAction(element, "eventWindow", "EventWindow", this.handler),
                    ],
                    { selectable: true, cssClass: "align-top" },
                ),

                BoxFactory.horizontalLayout(
                    element,
                    "EventSchedule-hlist-line-1",
                    "",
                    [
                        BoxUtil.labelBox(element, "and then repeats:", "schedule-then"),
                        BoxUtil.getBoxOrAction(element, "eventRepeat", "RepeatExpression", this.handler),
                    ],
                    { selectable: true, cssClass: "align-top" },
                ),

                BoxFactory.horizontalLayout(
                    element,
                    "EventSchedule-hlist-line-3",
                    "",
                    [
                        BoxUtil.labelBox(element, "limited to this time of day:", "top-1-line-3-item-0"),
                        BoxUtil.getBoxOrAction(element, "eventTimeOfDay", "EventTimeOfDay", this.handler),
                    ],
                    { selectable: true, cssClass: "align-top" },
                ),
            ],
            { cssClass: "ml-5 mb-2" },
        );
        return box;
    }

    projectTask(abstract: AbstractTask) {
        let box: Box;
        let isShareable: boolean = true;
        const event: Event = ownerOfType(abstract, "Event") as Event;
        if (event) {
            // event task
            if (abstract instanceof Task) {
                // in-line task
                let element: Task = abstract as Task;
                box = BoxUtil.itemGroupBox(
                    element,
                    "task",
                    "Task:",
                    "name",
                    BoxUtil.indentBox(
                        element,
                        4,
                        "it2",
                        BoxFactory.verticalLayout(element, "task-overall", "", [
                            BoxUtil.getBoxOrAction(element, "description", "Description", this.handler),
                            BoxUtil.listGroupBox(
                                element,
                                "steps",
                                "Steps",
                                BoxUtil.indentBox(element, 3, "t12", BoxUtil.verticalPartListBox(element, element.steps, "steps", null, this.handler)),
                                { cssClass: "type4", isExpanded: true, canAdd: true },
                            ),
                        ]),
                    ),
                    { cssClass: "type3", placeHolder: "enter", canShare: true, canDelete: true, isRequired: true },
                );
            } else {
                // task Reference
                let taskRef: TaskReference = abstract as TaskReference;
                let element: Task = taskRef.$task;
                if (element) {
                    //with selection
                    box = BoxUtil.itemGroupBox2(
                        element,
                        "task",
                        "Task:",
                        "task",
                        "AbstractTask",
                        (selected: string) => {
                            taskRef.task = FreNodeReference.create<Task>(
                                StudyConfigurationModelEnvironment.getInstance().scoper.getFromVisibleElements(taskRef, selected, "Task") as Task,
                                "Task",
                            );
                        },
                        StudyConfigurationModelEnvironment.getInstance().scoper,
                        BoxUtil.indentBox(
                            element,
                            4,
                            "it2",
                            BoxFactory.verticalLayout(element, "task-overall", "", [
                                BoxUtil.getBoxOrAction(element, "description", "Description", this.handler),
                                BoxUtil.listGroupBox(
                                    element,
                                    "steps",
                                    "Steps",
                                    BoxUtil.indentBox(element, 3, "t12", BoxUtil.verticalPartListBox(element, element.steps, "steps", null, this.handler)),
                                    { cssClass: "type4", isExpanded: true, canAdd: true },
                                ),
                            ]),
                        ),
                        { cssClass: "type3", placeHolder: "enter", canDelete: true, isRequired: false },
                    );
                } else {
                    // without selection
                    box = BoxUtil.itemGroupBox2(
                        taskRef,
                        "task",
                        "Task:",
                        "task",
                        "AbstractTask",
                        (selected: string) => {
                            taskRef.task = FreNodeReference.create<Task>(
                                StudyConfigurationModelEnvironment.getInstance().scoper.getFromVisibleElements(taskRef, selected, "Task") as Task,
                                "Task",
                            );
                        },
                        StudyConfigurationModelEnvironment.getInstance().scoper,
                        BoxFactory.label(taskRef, "task-reference", "No task details"),
                        { cssClass: "type3", placeHolder: "choose", canExpand: false, canDelete: true, isRequired: true },
                    );
                }
            }
        } else {
            //shared task
            let element: Task = abstract as Task;
            let isShared = true;
            box = BoxUtil.itemGroupBox(
                element,
                "task",
                "Task:",
                "name",
                BoxUtil.indentBox(
                    element,
                    4,
                    "it1",
                    BoxFactory.verticalLayout(element, "task-overall", "", [
                        BoxUtil.getBoxOrAction(element, "description", "Description", this.handler),
                        BoxUtil.listGroupBox(
                            element,
                            "steps",
                            "Steps",
                            BoxUtil.indentBox(element, 3, "t11", BoxUtil.verticalPartListBox(element, element.steps, "steps", null, this.handler)),
                            { cssClass: "type4", isExpanded: true, canAdd: true },
                        ),
                    ]),
                ),
                { cssClass: "type3", placeHolder: "enter", canShare: false, canDelete: !isShared, isRequired: true },
            );
        }
        return box;
    }

    projectStep(element: Step) {
        let box: Box = BoxUtil.itemGroupBox(
            element,
            "step",
            "Step:",
            "title",
            BoxUtil.indentBox(
                element,
                4,
                "ss1",
                BoxFactory.verticalLayout(element, "step-overall", "", [
                    BoxUtil.getBoxOrAction(element, "detailsDescription", "Description", this.handler),
                    BoxUtil.listGroupBox(
                        element,
                        "references",
                        "References",
                        BoxUtil.indentBox(element, 3, "ss11", BoxUtil.verticalPartListBox(element, element.references, "references", null, this.handler)),
                        { cssClass: "type4", isExpanded: false, canAdd: true },
                    ),
                    BoxUtil.listGroupBox(
                        element,
                        "systems",
                        "Systems",
                        BoxUtil.indentBox(element, 3, "ss12", BoxUtil.verticalPartListBox(element, element.systems, "systems", null, this.handler)),
                        { cssClass: "type4", isExpanded: false, canAdd: true },
                    ),
                    BoxUtil.listGroupBox(
                        element,
                        "people",
                        "People",
                        BoxUtil.indentBox(element, 3, "ss13", BoxUtil.verticalPartListBox(element, element.people, "people", null, this.handler)),
                        { cssClass: "type4", isExpanded: false, canAdd: true },
                    ),
                ]),
            ),
            { cssClass: "w-full type3", placeHolder: "enter", isRequired: true },
        );
        return box;
    }

    projectReference(element: Reference) {
        let box: Box = BoxUtil.itemGroupBox(
            element,
            "reference",
            "Reference",
            "title",
            BoxUtil.indentBox(element, 6.5, "ir1", BoxFactory.verticalLayout(element, "reference-overall", "", [BoxUtil.textBox(element, "link")])),
            { cssClass: "w-full type3", placeHolder: "reference", canShare: true, isRequired: true },
        );
        return box;
    }

    projectSystem(element: SystemAccess) {
        let box: Box = BoxUtil.itemGroupBox(
            element,
            "system",
            "System",
            "name",
            BoxUtil.indentBox(
                element,
                6.5,
                "is1",
                BoxFactory.verticalLayout(element, "system-overall", "", [
                    BoxUtil.textBox(element, "functionName"),
                    BoxUtil.getBoxOrAction(element, "description", "Description", this.handler),
                ]),
            ),
            { cssClass: "w-full type3", placeHolder: "system", canShare: true, isRequired: true },
        );
        return box;
    }

    projectPerson(element: Person) {
        let box: Box = BoxUtil.itemGroupBox(
            element,
            "person",
            "Person",
            "name",
            BoxUtil.indentBox(
                element,
                6.5,
                "ip1",
                BoxFactory.verticalLayout(element, "person-overall", "", [
                    BoxUtil.textBox(element, "email"),
                    BoxUtil.textBox(element, "phoneNumber"),
                    BoxUtil.getBoxOrAction(element, "role", "StaffRole", this.handler),
                ]),
            ),
            { cssClass: "w-full type3", placeHolder: "name", canShare: true, isRequired: true },
        );
        return box;
    }

    projectPatientInfo(patientInfo: PatientInfo) {
        const element: PatientInfo = patientInfo;
        let box = BoxUtil.listGroupBox(
            element,
            "patients",
            "patients",
            BoxUtil.verticalPartListBox(element, element.patientHistories, "patientHistories", null, this.handler, { cssClass: "ml-6 mb-2" }),
            { cssClass: "type1 mt-2", isExpanded: true, canAdd: true },
        );
        return box;
    }

    projectPatientHistory(patientHistory: PatientHistory) {
        const element: PatientHistory = patientHistory;
        let box: Box = BoxUtil.itemGroupBox(
            element,
            "patientHistory",
            "Patient:",
            "id",
            BoxFactory.verticalLayout(
                element,
                "PatientHistory-overall",
                "",
                [
                    BoxUtil.listGroupBox(
                        element,
                        "patientVisit",
                        "Completed Visits",
                        //TODO: put a "completed visits: " label here?
                        //TODO: decide if it's worth auto-populating all the visits without a complete date
                        BoxFactory.horizontalLayout(
                            element,
                            "PatientHistory-hlist-line-1",
                            "",
                            [BoxUtil.verticalPartListBox(element, element.patientVisits, "patientVisits", null, this.handler)],
                            { selectable: false, cssClass: "w-full ml-8" },
                        ),
                        {
                            cssClass: "type4",
                            isExpanded: true,
                        },
                    ),
                    BoxUtil.listGroupBox(
                        element,
                        "patientNotAvailable",
                        "Not Available",
                        BoxFactory.horizontalLayout(
                            element,
                            "PatientHistory-hlist-line-2",
                            "",
                            [BoxUtil.getBoxOrAction(element, "patientNotAvailableDates", "PatientNotAvailable", this.handler)],
                            { selectable: false, cssClass: "w-full ml-8" },
                        ),
                        {
                            cssClass: "type4",
                            isExpanded: true,
                        },
                    ),
                ],
                { cssClass: "w-full ml-8" },
            ),
            { cssClass: "type2", placeHolder: "enter", isRequired: true, selectable: true, canDuplicate: true },
        );
        return box;
    }
}
