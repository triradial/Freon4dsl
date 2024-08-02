// Generated by the Freon Language Generator.
import { FreNode, FreLanguage, FreProjection, FreProjectionHandler, FreTableDefinition, FRE_BINARY_EXPRESSION_LEFT, FRE_BINARY_EXPRESSION_RIGHT,
        Box, GridCellBox, LabelBox, IconBox, GridBox, createDefaultExpressionBox, ActionBox, HorizontalListBox, TableRowBox, HorizontalLayoutBox, MultiLineTextBox, MultiLineTextBox2, BoxFactory, BoxUtil, BoolDisplay, FreNodeReference, TableUtil} from "@freon4dsl/core";
import { StudyConfiguration, Description, Period, Event, EventSchedule, CheckList, Task, SystemAccess, Step } from "../language/gen";
import { faGripVertical } from '@fortawesome/free-solid-svg-icons';
import { StudyConfigurationModelEnvironment } from "config/gen/StudyConfigurationModelEnvironment";
import { result } from "lodash";
import { TaskBoxProvider } from "./gen/TaskBoxProvider";
import { SystemAccessBoxProvider } from "editor";

/**
 * Class CustomStudyConfigurationModelProjection provides an entry point for the language engineer to
 * define custom build additions to the editor.
 * These are merged with the custom build additions and other definition-based editor parts
 * in a three-way manner. For each modelelement,
 * (1) if a custom build creator/behavior is present, this is used,
 * (2) if a creator/behavior based on one of the editor definition is present, this is used,
 * (3) if neither (1) nor (2) yields a result, the default is used.
 */

// Override of implementation for TaskBoxProvider.getTableRowFor_default
function newGetTableRowFor_defaultTaskImplementation(this: TaskBoxProvider): TableRowBox {
    const cells: Box[] = [];
    let task = this._element as Task;
    let innerCells: Box[] = [];

    if (task.isShared === true) {
        if(task.referencedTask === null) {
            console.log("SHARED: referencedTask is null so task is just becoming shared");
            let checklist = task.freOwner() as CheckList;
            let event = checklist.freOwner() as Event;
            let period = event.freOwner() as Period;
            let studyConfig = period.freOwner() as StudyConfiguration;
            let refToTask = FreNodeReference.create(task.name, "Task") as FreNodeReference<Task>;
            let copyOfTask = task.copy();
            refToTask.referred = copyOfTask;
            task.referencedTask = refToTask;
            studyConfig.tasks.push(copyOfTask);
        }
        innerCells.push(BoxFactory.horizontalLayout(task, "period-hlist-line-1", "","top",[
                BoxUtil.labelBox(task, " Shared:", "top-1-line-2-item-0", undefined, "app-small-caps mt-1 mr-1"),
                BoxUtil.switchElement(task, "isShared", ""),
                BoxUtil.referenceBox(
                        task,
                        "referencedTask",
                        (selected: string) => {
                            (task).referencedTask = FreNodeReference.create<Task>(
                                StudyConfigurationModelEnvironment.getInstance().scoper.getFromVisibleElements(
                                    task,
                                    selected,
                                    "Task",
                                ) as Task,
                                "Task",
                            );
                        },
                        StudyConfigurationModelEnvironment.getInstance().scoper,
                    ),
                BoxUtil.labelBox(task.referencedTask.referred, " Description:", "top-1-line-2-item-0", undefined, "app-small-caps mt-1 mr-1"),
                BoxUtil.labelBox(task.referencedTask.referred, task.referencedTask.referred.description.rawText, "top-1-line-2-item-0", undefined, "app-small-caps mt-1 mr-1"),
                ],
            { selectable: false })
        );
    } else {
        innerCells.push(BoxFactory.horizontalLayout(task, "period-hlist-line-1", "","top",[
                BoxUtil.labelBox(task, " Shared:", "top-1-line-2-item-0", undefined, "app-small-caps mt-1 mr-1"),
                BoxUtil.switchElement(task, "isShared", ""),
                BoxUtil.textBox(task, "name"),
                BoxUtil.labelBox(task, " Description:", "top-1-line-2-item-0", undefined, "app-small-caps mt-1 mr-1"),
                BoxUtil.getBoxOrAction(task, "description", "Description", this.mainHandler),
                BoxUtil.labelBox(task, " Expand:", "top-1-line-2-item-0", undefined, "app-small-caps mt-1 mr-1"),
                BoxUtil.switchElement(task, "showDetails", "")],
            { selectable: false }));
        if (task.showDetails === true) {
            innerCells.push(BoxFactory.verticalLayout(task, "tasks-optionally1", "", [
                BoxUtil.booleanBox(task, "numberedSteps", { yes: "YES", no: "NO" }, BoolDisplay.SELECT),
                BoxUtil.verticalPartListBox(task, task.steps, "steps", null, this.mainHandler)]));
        } 
    }
    cells.push(BoxFactory.verticalLayout(task, "tasks-optionally2", "", innerCells));
    return TableUtil.rowBox(
        this._element,
        this._element.freOwnerDescriptor().propertyName,
        "Task",
        cells,
        this._element.freOwnerDescriptor().propertyIndex,
        true,
    );
}

// Override of implementation for SystemAccessBoxProvider.getTableRowFor_default
function newGetTableRowFor_defaultSystemAccessImplementation(this: SystemAccessBoxProvider): TableRowBox {
    const cells: Box[] = [];
    let systemAccess = this._element as SystemAccess;
    let innerCells: Box[] = [];

    console.log("SHARED: SystemAccessBoxProvider.getTableRowFor_default: systemAccess.isShared = " + systemAccess.isShared);
    if (systemAccess.isShared === true) {
        if(systemAccess.referencedSystemAccess === null) {
            console.log("SHARED: referencedSystemAccess is null so SystemAccess is just becoming shared");
            let step = systemAccess.freOwner() as Step;
            let task = step.freOwner() as Task;
            let checklist = task.freOwner() as CheckList;
            let event = checklist.freOwner() as Event;
            let period = event.freOwner() as Period;
            let studyConfig = period.freOwner() as StudyConfiguration;
            let refToSystemAccess = FreNodeReference.create(systemAccess.name, "SystemAccess") as FreNodeReference<SystemAccess>;
            let copyOfSystemAccess = systemAccess.copy();
            refToSystemAccess.referred = copyOfSystemAccess;
            systemAccess.referencedSystemAccess = refToSystemAccess;
            studyConfig.systemAccesses.push(copyOfSystemAccess);
            console.log("SHARED: pushed system");
        }
        if (systemAccess.referencedSystemAccess.referred.description === null) {
            systemAccess.referencedSystemAccess.referred.description = new Description();
        }
        innerCells.push(BoxFactory.horizontalLayout(systemAccess, "period-hlist-line-1", "","top",[
                BoxUtil.labelBox(systemAccess, " Shared:", "top-1-line-2-item-0", undefined, "app-small-caps mt-1 mr-1"),
                BoxUtil.switchElement(systemAccess, "isShared", ""),
                BoxUtil.referenceBox(
                        systemAccess,
                        "referencedSystemAccess",
                        (selected: string) => {
                            systemAccess.referencedSystemAccess = FreNodeReference.create<SystemAccess>(
                                StudyConfigurationModelEnvironment.getInstance().scoper.getFromVisibleElements(
                                    systemAccess,
                                    selected,
                                    "SystemAccess",
                                ) as SystemAccess,
                                "SystemAccess",
                            );
                        },
                        StudyConfigurationModelEnvironment.getInstance().scoper,
                    ),
                BoxUtil.labelBox(systemAccess.referencedSystemAccess.referred, " Description:", "top-1-line-2-item-0", undefined, "app-small-caps mt-1 mr-1"),
                BoxUtil.labelBox(systemAccess.referencedSystemAccess.referred, systemAccess.referencedSystemAccess.referred.description.rawText, "top-1-line-2-item-0", undefined, "app-small-caps mt-1 mr-1"),
                ],
            { selectable: false })
        );
    } else {
        console.log("SHARED: not shared yet");
        innerCells.push(BoxFactory.verticalLayout(this._element as SystemAccess, "SystemAccess-overall", "", [
            BoxUtil.labelBox(systemAccess, " Shared:", "top-1-line-2-item-0", undefined, "app-small-caps mt-1 mr-1"),
            BoxUtil.switchElement(systemAccess, "isShared", ""),
            BoxUtil.emptyLineBox(this._element as SystemAccess, "SystemAccess-empty-line-0"),
            BoxFactory.horizontalLayout(
                this._element as SystemAccess,
                "SystemAccess-hlist-line-1",
                "",
                "center",
                [
                    BoxUtil.labelBox(this._element as SystemAccess, "System Name  :", "top-1-line-1-item-0"),
                    BoxUtil.textBox(this._element as SystemAccess, "name"),
                    BoxUtil.labelBox(this._element as SystemAccess, "Function:", "top-1-line-1-item-2"),
                    BoxUtil.textBox(this._element as SystemAccess, "functionName"),
                ],
                { selectable: false },
            ),
            BoxFactory.horizontalLayout(
                this._element as SystemAccess,
                "SystemAccess-hlist-line-2",
                "",
                "center",
                [
                    BoxUtil.labelBox(this._element as SystemAccess, "Description  :", "top-1-line-2-item-0"),
                    BoxUtil.getBoxOrAction(this._element as SystemAccess, "description", "Description", this.mainHandler),
                ],
                { selectable: false },
            ),
            BoxFactory.horizontalLayout(
                this._element as SystemAccess,
                "SystemAccess-hlist-line-3",
                "",
                "center",
                [
                    BoxUtil.labelBox(this._element as SystemAccess, "Access at", "top-1-line-3-item-0"),
                    BoxUtil.getBoxOrAction(this._element as SystemAccess, "accessedAt", "AccessedAt", this.mainHandler),
                ],
                { selectable: false },
            ),
            BoxUtil.labelBox(this._element as SystemAccess, "The Robot should copy:", "top-1-line-4-item-0"),
            BoxUtil.indentBox(
                this._element as SystemAccess,
                4,
                false,
                "5",
                BoxUtil.getBoxOrAction(this._element as SystemAccess, "robotMappings", "RobotMapping", this.mainHandler),
            ),
            BoxUtil.emptyLineBox(this._element as SystemAccess, "SystemAccess-empty-line-6"),
            BoxUtil.emptyLineBox(this._element as SystemAccess, "SystemAccess-empty-line-7"),
            BoxUtil.emptyLineBox(this._element as SystemAccess, "SystemAccess-empty-line-8"),
        ]));
    }
    cells.push(BoxFactory.verticalLayout(systemAccess, "systemsAccess-optionally2", "", innerCells));
    return TableUtil.rowBox(
        this._element,
        this._element.freOwnerDescriptor().propertyName,
        "SystemAccess",
        cells,
        this._element.freOwnerDescriptor().propertyIndex,
        true,
    );
}

export class CustomStudyConfigurationModelProjection implements FreProjection {
    name: string = "Custom";
    handler: FreProjectionHandler;
    nodeTypeToBoxMethod: Map<string, (node: FreNode) => Box> = new Map<string, (node: FreNode) => Box>([
        ["StudyConfiguration", this.createStudyConfiguration],
        ["Description", this.createDescription],
        ["Period", this.createPeriod],
        ["Event", this.createEvent],
        ["EventSchedule", this.createSchedule],
        // ["Task", this.createTask],
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
    overrideTableProjects() {
        const taskBoxProviderPrototype = TaskBoxProvider.prototype as any;        
        taskBoxProviderPrototype.getTableRowFor_default = newGetTableRowFor_defaultTaskImplementation;

        const systemAccessBoxProviderPrototype = SystemAccessBoxProvider.prototype as any;        
        systemAccessBoxProviderPrototype.getTableRowFor_default = newGetTableRowFor_defaultSystemAccessImplementation;
    }
    
    ////////////////////////////////////////////////////////////////////
    createStudyConfiguration (element: StudyConfiguration): Box {
    
        this.overrideTableProjects();
        return BoxFactory.verticalLayout(element, "StudyConfiguration-overall", "", [
            // BoxUtil.emptyLineBox(element, "StudyConfiguration-empty-line-0", "h-4"),
            // BoxFactory.horizontalLayout(element, "StudyConfiguration-hlist-line-1", "", "top",
            //     [
            //         BoxUtil.labelBox(element, "STUDY NAME:", "top-1-line-1-item-0", undefined, "app-uppercase"),
            //         BoxUtil.textBox(element, "name")
            //     ],
            //     { selectable: false },
            // ), 
            BoxUtil.emptyLineBox(element, "StudyConfiguration-empty-line-1", "h-2"),
            BoxUtil.listGroupBox(element, "OPTIONS:", 0, "study-periods-group",
                BoxUtil.indentBox(element, 4, true, "3",
                    BoxFactory.verticalLayout(element, "StudyConfiguration-vlist-line-3", "", 
                    [
                        BoxUtil.emptyLineBox(element, "option-empty-line", "h-4"),
                        BoxUtil.switchElement(element, "showPeriods", "Configure by Periods/Phases"), 
                        BoxUtil.switchElement(element, "showActivityDetails", "Show Task Details"),
                        BoxUtil.switchElement(element, "showSystems", "Show Systems"),
                        BoxUtil.switchElement(element, "showScheduling", "Show Scheduling") 
                    ])
                ), undefined, undefined, true
            ),
            BoxUtil.emptyLineBox(element, "StudyConfiguration-empty-line-3", "h-2"),
            ...(element.showPeriods === true? [                    
                BoxUtil.listGroupBox(element, "STUDY PERIODS", 0, "study-periods-group",
                    BoxUtil.indentBox(element, 4, true, "9",
                        BoxUtil.verticalPartListBox(element, (element).periods, "periods", null, this.handler)
                    ), undefined, undefined, true
                ),
            ] : [
                BoxUtil.listGroupBox(element, "EVENTS", 0, "group-1-line-2-item-0",
                    BoxUtil.indentBox(element, 4, true, "4",
                        BoxUtil.verticalPartListBox(element, element.events, "events", null, this.handler)
                    ), undefined, undefined, true
                ),
            ]),
            ...(element.showActivityDetails === true? [
                    BoxUtil.emptyLineBox(element, "StudyConfiguration-empty-line-4", "h-2"),
                    BoxUtil.listGroupBox(element, "TASK DETAILS", 0, "task-details-group",
                        BoxUtil.indentBox(element, 4, true, "13",
                            BoxUtil.verticalPartListBox(element, (element).tasks, "tasks", null, this.handler)
                        ),
                    undefined, "app-uppercase", true),
                    ...(element.showSystems === true? [
                    BoxUtil.emptyLineBox(element, "StudyConfiguration-empty-line-5", "h-2"),
                    BoxUtil.listGroupBox(element, "SYSTEM ACCESS DEFINITIONS", 0, "sys-defs-group",
                        BoxUtil.indentBox(element, 4, true, "17",
                            BoxUtil.verticalPartListBox(element, (element).systemAccesses, "systemAccesses", null,  this.handler)
                        ),
                    undefined, "app-uppercase"),
                    ] : []),
                    BoxUtil.emptyLineBox(element, "StudyConfiguration-empty-line-6", "h-2"),
                    BoxUtil.listGroupBox(element, "STAFFING", 0, "staffing-group",
                        BoxUtil.indentBox(element, 4, true, "21",
                            BoxUtil.getBoxOrAction(element, "staffing", "Staffing", this.handler)
                        ),
                    undefined, "app-uppercase")
                ] : []),
        ]);
    }

    createDescription (desc: Description): Box {
        return new MultiLineTextBox2(desc, "study-part-description", () => { return desc.text}, (t: string) => { desc.text = t}, () => { return desc.rawText}, (t: string) => { desc.rawText = t}, undefined, "mr-2");
    }

    createPeriod (period: Period): Box {
        let box: Box = BoxUtil.itemGroupBox(period, "name", "Period:", 0, 
            BoxUtil.indentBox(period, 1.5, true, "period-indent",
                BoxFactory.verticalLayout(period, "period-detail", "", [
                    BoxFactory.horizontalLayout(period, "period-hlist-line-1", "","top",
                        [
                            BoxUtil.labelBox(period, "Description:", "top-1-line-2-item-0", undefined, "app-small-caps mt-1 mr-1"),
                            BoxUtil.getBoxOrAction(period, "description", "Description", this.handler)
                        ],
                        { selectable: false }, "w-full mt-1"
                    ),
                    BoxFactory.horizontalLayout(period, "Period-hlist-line-1", "", "top",
                        [
                            BoxUtil.labelBox(period, "Date:", "top-1-line-1-item-0"),
                            BoxUtil.dateBox(period, "date"),
                        ],
                        { selectable: false }, "w-full mt-1"
                    ),

                    BoxUtil.listGroupBox(period, "EVENTS", 0, "group-1-line-2-item-0",
                        BoxUtil.indentBox(period, 4, true, "4",
                            BoxUtil.verticalPartListBox(period, period.events, "events", null, this.handler)
                        ), 
                        undefined, undefined, true)
                ])
            ), "w-full", true, true
        );
        return box;
    }

    // createPeriod (period: Period): Box {
    //     return BoxFactory.verticalLayout(period, "Period-overall", "", [
    //         BoxFactory.horizontalLayout(period, "Period-hlist-line-0", "", "center",
    //             [
    //                 new IconBox(period, "draggrip", faGripVertical, "grab"),
    //                 BoxUtil.labelBox(period, "Period:", "top-1-line-0-item-1", undefined, "app-uppercase"),
    //                 BoxUtil.textBox(period, "name")                   
    //             ],
    //             { selectable: false }
    //         ),
    //         BoxUtil.indentBox(period, 1.5, true, "e1",
    //             BoxFactory.verticalLayout(period, "Period-detail", "", [
    //                 BoxFactory.horizontalLayout(period, "Period-hlist-line-1", "","top",
    //                     [
    //                         BoxUtil.labelBox(period, "Description:", "top-1-line-2-item-0",undefined, "app-small-caps"),
    //                         BoxUtil.getBoxOrAction(period, "description", "Description", this.handler)
    //                     ],
    //                     { selectable: false }, "w-full"
    //                 ),
    //                 BoxUtil.listGroupBox(period, "EVENTS", 0, "group-1-line-2-item-0",
    //                     BoxUtil.indentBox(period, 4, true, "4",
    //                         BoxUtil.verticalPartListBox(period, period.events, "events", null, this.handler)
    //                     ) 
    //                 )
    //             ])
    //         )
    //     ]);
    // }

    createEvent (event: Event): Box {
        let showScheduling = false;
        if (event.freOwner() instanceof(Period)) {
            showScheduling = ((event.freOwner() as Period).freOwner() as StudyConfiguration).showScheduling;
        } else {
            showScheduling = (event.freOwner() as StudyConfiguration).showScheduling;
        }
        let box: Box = BoxUtil.itemGroupBox(event, "name", "Event:", 0,
            BoxUtil.indentBox(event, 1.5, true, "e1",
                BoxFactory.verticalLayout(event, "Event-detail", "", [
                    BoxFactory.horizontalLayout(event, "Event-hlist-line-2", "","top",
                        [
                            BoxUtil.labelBox(event, "Description:", "top-1-line-2-item-0", undefined, "app-small-caps mt-1 mr-1"),
                            BoxUtil.getBoxOrAction(event, "description", "Description", this.handler)
                        ],
                        { selectable: false }, "w-full mt-1"
                    ),
                    ...(showScheduling === true? [                    
                        BoxUtil.labelBox(event, "Schedule:", "top-1-line-4-item-0"),
                        BoxUtil.indentBox(event, 2, true, "e11",
                            BoxUtil.getBoxOrAction(event, "schedule", "EventSchedule", this.handler)
                        ),
                    ] : []),
                            BoxUtil.labelBox(event, "Checklist:", "top-1-line-9-item-0"),
                        BoxUtil.indentBox(event, 2, true, "e12",
                        BoxUtil.getBoxOrAction(event, "checkList", "CheckList", this.handler)
                    ),
                    BoxUtil.emptyLineBox(event, "Event-empty-line-11")
                ])
            ), "w-full", true, true
        );
        return box;
    }

    createSchedule (schedule: EventSchedule): Box {
        return BoxFactory.verticalLayout(schedule, "EventSchedule-overall", "", [
            BoxFactory.horizontalLayout(schedule, "EventSchedule-hlist-line-0", "", "top",
                [
                    BoxUtil.labelBox(schedule, "First Scheduled:", "top-1-line-0-item-0", undefined, "app-small-caps"),
                    BoxUtil.getBoxOrAction(schedule, "eventStart", "EventStart", this.handler),
                ],
                { selectable: false },
            ),
            BoxFactory.horizontalLayout(schedule, "EventSchedule-hlist-line-1", "", "top",
                [
                    BoxUtil.labelBox(schedule, "Then Repeats:", "top-1-line-1-item-0", undefined, "app-small-caps"),
                    BoxUtil.getBoxOrAction(schedule, "eventRepeat", "RepeatExpression", this.handler),
                ],
                { selectable: false },
            ),
            BoxFactory.horizontalLayout(schedule, "EventSchedule-hlist-line-2", "", "top",
                [
                    BoxUtil.labelBox(schedule, "Window:", "top-1-line-2-item-0", undefined, "app-small-caps"),
                    BoxUtil.getBoxOrAction(schedule, "eventWindow", "EventWindow", this.handler),
                ],
                { selectable: false },
            ),
            BoxFactory.horizontalLayout(schedule, "EventSchedule-hlist-line-3", "", "top",
                [
                    BoxUtil.labelBox(schedule, "Time of Day:", "top-1-line-3-item-0", undefined, "app-small-caps"),
                    BoxUtil.getBoxOrAction(schedule, "eventTimeOfDay", "EventTimeOfDay", this.handler),
                ],
                { selectable: false },
            ),
        ]);
    }
 }
