// Generated by the Freon Language Generator.
import { FreNode, FreLanguage, FreProjection, FreProjectionHandler, FreTableDefinition, ownerOfType, FRE_BINARY_EXPRESSION_LEFT, FRE_BINARY_EXPRESSION_RIGHT,
  Box, createDefaultExpressionBox, TableRowBox, MultiLineTextBox2, BoxFactory, BoxUtil, BoolDisplay, FreNodeReference, TableUtil} from "@freon4dsl/core";
import { StudyConfiguration, Description, Period, Event, EventSchedule, Task, TaskReference, AbstractTask, Step, SystemAccess, Reference, Person, TypeOfEvent } from "../language/gen";
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
projectStudyConfiguration (studyconfig: StudyConfiguration): Box {
    const element: StudyConfiguration = studyconfig;
    return BoxFactory.verticalLayout(element, "StudyConfiguration-overall", "", [
      BoxUtil.listGroupBox(element, "study-options", "Options",
        BoxFactory.verticalLayout(element, "StudyConfiguration-vlist-line-3", "", 
          [   
            BoxUtil.emptyLineBox2(element, "option-empty-line", "h-4"),
            BoxUtil.switchElement(element, "showActivityDetails", "Show Shared Tasks"),
            BoxUtil.switchElement(element, "showSystems", "Show Systems"),
            BoxUtil.switchElement(element, "showScheduling", "Show Scheduling") 
          ], 
        {cssClass: "w-full ml-4"}),
      {cssClass: "type1 mt-5", isExpanded: true}),
      BoxUtil.listGroupBox(element, "periods", "Study Periods",
        BoxUtil.verticalPartListBox(element, (element).periods, "periods", null, this.handler, {cssClass:"ml-6 mt-2 mb-2"}),
      {cssClass:"type1 mt-2", isExpanded:true, canAdd: true}),
      ...(element.showActivityDetails === true? 
        [
          BoxUtil.listGroupBox(element, "shared-tasks", "Shared Tasks",
            BoxUtil.verticalPartListBox(element, (element).tasks, "tasks", null, this.handler, {cssClass:"ml-6 mt-2 mb-2"}),
          {cssClass:"type1 mt-2", isExpanded:true, canAdd: true}),
          ...(element.showSystems === true? 
            [
              BoxUtil.listGroupBox(element, "shared-systems", "Systems",
                BoxUtil.verticalPartListBox(element, (element).systemAccesses, "systemAccesses", null,  this.handler, {cssClass:"ml-6 mt-2 mb-2"}),
              {cssClass:"type1 mt-2", isExpanded:true, canAdd: true}),
            ] 
          : 
            []
          ),
          BoxUtil.listGroupBox(element, "shared-people", "People",
            BoxUtil.indentBox(element, 4, "21",
              BoxUtil.getBoxOrAction(element, "staffing", "Staffing", this.handler),
            ), 
          {cssClass:"type1 mt-2", isExpanded:true, canAdd: true})
        ] 
      : 
        []
      ),
  ]);
}

projectDescription (description: Description): Box {
const element: Description = description;
const ph = "<" + element.$$propertyName + ">";
return new MultiLineTextBox2(element, "study-part-description", () => { return element.text}, (t: string) => { element.text = t}, {placeHolder: ph, cssClass:"mr-2 mb-2"});
}

projectPeriod (period: Period): Box {
const element: Period = period;
let box: Box = 
  BoxUtil.itemGroupBox(element, "period", "Period:", "name",
    BoxFactory.verticalLayout(element, "period-detail", "", 
      [
        BoxFactory.horizontalLayout(element, "period-hlist-line-1", "",
          [
            BoxUtil.getBoxOrAction(element, "description", "Description", this.handler)
          ],
        {selectable: false, cssClass: "w-full mt-1 align-top"}),
        BoxUtil.listGroupBox(element, "events", "Events",
          BoxUtil.verticalPartListBox(element, element.events, "events", null, this.handler, {cssClass:"ml-6 mt-2 mb-2"}),
        {cssClass:"type2", isExpanded:true, canAdd: true})
      ],
    {cssClass:"ml-8 mb-2"}),
  {cssClass:"type1", placeHolder:"enter", isExpanded:false, isRequired:true});
return box;
}

projectEvent (event: Event): Box {
const element: Event = event;     
let showScheduling = false;
if (element.freOwner() instanceof(Period)) {
  showScheduling = ((element.freOwner() as Period).freOwner() as StudyConfiguration).showScheduling;
} else {
  showScheduling = (element.freOwner() as StudyConfiguration).showScheduling;
}
let box: Box = 
  BoxUtil.itemGroupBox(element, "event", "Event:", "name",
    BoxFactory.verticalLayout(element, "Event-detail", "", 
      [
        BoxFactory.horizontalLayout(element, "EventSchedule-hlist-line-0", "", [
          BoxUtil.labelBox(element, "Alt-Name:", "alt-top-1-line-9-item-0"),
          BoxUtil.textBox(element, "alternativeName"),
        ],
        ),
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
            ],
        ),     
        BoxUtil.getBoxOrAction(element, "description", "Description", this.handler),
        ...(showScheduling === true? 
          [                    
            BoxUtil.listGroupBox(element, "schedule", "Schedule", 
              BoxUtil.getBoxOrAction(element, "schedule", "EventSchedule", this.handler),
            {cssClass:"type3", isExpanded:true}) 
          ] 
        : 
          []
        ),
        BoxUtil.listGroupBox(element, "tasks", "Checklist",
          BoxUtil.verticalPartListBox(element, (element).tasks, "tasks", null, this.handler, {cssClass:"ml-6 mt-2 mb-2"}),
        {cssClass:"type3", isExpanded:true, canAdd:true})
      ],
    {cssClass:"ml-6 mb-2"}),
  {cssClass:"type2", placeHolder:"enter", isRequired:true, selectable: true, canDuplicate: true});
return box;
}

projectSchedule (event: EventSchedule): Box {
const element: EventSchedule = event;    
let box: Box =
  BoxFactory.verticalLayout(element, "EventSchedule-overall", "", 
    [
      BoxFactory.horizontalLayout(element, "schedule-event-start-group", "",
        [
          BoxUtil.labelBox(element, "First scheduled:", "schedule-event-start-label"),
          BoxUtil.getBoxOrAction(element, "eventStart", "EventStart", this.handler),
        ],
      {selectable: true, cssClass:"align-top"}),

      BoxFactory.horizontalLayout(element, "EventSchedule-hlist-line-2", "",
        [
          BoxUtil.labelBox(element, "with a window of:", "schedule-window"),
          BoxUtil.getBoxOrAction(element, "eventWindow", "EventWindow", this.handler),
        ],
      {selectable: true, cssClass:"align-top"}),

      BoxFactory.horizontalLayout(element, "EventSchedule-hlist-line-1", "",
        [
          BoxUtil.labelBox(element, "and then repeats:", "schedule-then"),
          BoxUtil.getBoxOrAction(element, "eventRepeat", "RepeatExpression", this.handler),
        ],
      {selectable: true, cssClass:"align-top"}),

      BoxFactory.horizontalLayout(element, "EventSchedule-hlist-line-3", "",
        [
          BoxUtil.labelBox(element, "limited to this time of day:", "top-1-line-3-item-0"),
          BoxUtil.getBoxOrAction(element, "eventTimeOfDay", "EventTimeOfDay", this.handler),
        ],
      {selectable: true, cssClass:"align-top"}),
    ],
  {cssClass:"ml-5 mb-2"});
return box;
}

projectTask(abstract: AbstractTask) {
let box: Box;
let isShareable: boolean = true;
const event: Event = ownerOfType(abstract, "Event") as Event;
if (event) { // event task
  if (abstract instanceof(Task)) { // in-line task
    let element: Task = (abstract as Task);
    box =
      BoxUtil.itemGroupBox(element, "task", "Task:", "name",
        BoxUtil.indentBox(element, 4, "it2",
          BoxFactory.verticalLayout(element, "task-overall", "", [
            BoxUtil.getBoxOrAction(element, "description", "Description", this.handler),
            BoxUtil.listGroupBox(element, "steps", "Steps",
              BoxUtil.indentBox(element, 3, "t12",
                BoxUtil.verticalPartListBox(element, element.steps, "steps", null, this.handler)
              ),
              { cssClass: "type4", isExpanded: true, canAdd: true }),
          ])
        ),
        {cssClass: "type3", placeHolder: "enter", canShare: true, canDelete: true, isRequired: true}
      );
  } else { // task Reference 
    let taskRef: TaskReference  = abstract as TaskReference;
    let element: Task = taskRef.$task;
    if (element) { //with selection
      box =
        BoxUtil.itemGroupBox2(element, "task", "Task:", "task", "AbstractTask",
          (selected: string) => { taskRef.task = FreNodeReference.create<Task>(StudyConfigurationModelEnvironment.getInstance().scoper.getFromVisibleElements(taskRef, selected,"Task") as Task, "Task"); },
          StudyConfigurationModelEnvironment.getInstance().scoper,
            BoxUtil.indentBox(element, 4, "it2",
              BoxFactory.verticalLayout(element, "task-overall", "", [
                BoxUtil.getBoxOrAction(element, "description", "Description", this.handler),
                BoxUtil.listGroupBox(element, "steps", "Steps",
                  BoxUtil.indentBox(element, 3, "t12",
                    BoxUtil.verticalPartListBox(element, element.steps, "steps", null, this.handler)
                  ),
                { cssClass: "type4", isExpanded: true, canAdd: true }),
              ])
            ),
        {cssClass: "type3", placeHolder: "enter", canDelete: true, isRequired: false});      
    } else {    // without selection
      box =
      BoxUtil.itemGroupBox2(taskRef, "task", "Task:", "task", "AbstractTask",
        (selected: string) => { taskRef.task = FreNodeReference.create<Task>(StudyConfigurationModelEnvironment.getInstance().scoper.getFromVisibleElements(taskRef, selected, "Task") as Task,"Task"); },
        StudyConfigurationModelEnvironment.getInstance().scoper,
          BoxFactory.label(taskRef, "task-reference", "No task details"),
      {cssClass: "type3", placeHolder: "choose", canExpand: false, canDelete: true, isRequired: true });  
    }
  }
} else { //shared task
  let element: Task = (abstract as Task);
  let isShared = true;
  box =
    BoxUtil.itemGroupBox(element, "task", "Task:", "name",
      BoxUtil.indentBox(element, 4, "it1",
        BoxFactory.verticalLayout(element, "task-overall", "", [
          BoxUtil.getBoxOrAction(element, "description", "Description", this.handler),
          BoxUtil.listGroupBox(element, "steps", "Steps",
            BoxUtil.indentBox(element, 3, "t11",
              BoxUtil.verticalPartListBox(element, element.steps, "steps", null, this.handler)
            ),
          {cssClass: "type4", isExpanded: true, canAdd: true }),
        ])
      ),
    {cssClass: "type3", placeHolder: "enter", canShare: false, canDelete: !isShared, isRequired: true});
}
return box;
}

projectStep(element: Step) {
  let box: Box = BoxUtil.itemGroupBox(element, "step", "Step:", "title",
      BoxUtil.indentBox(element, 4, "ss1",
          BoxFactory.verticalLayout(element, "step-overall", "", [
              BoxUtil.getBoxOrAction(element, "detailsDescription", "Description", this.handler),
              BoxUtil.listGroupBox(element, "references", "References",
                  BoxUtil.indentBox(element, 3, "ss11",
                      BoxUtil.verticalPartListBox(element, element.references, "references", null, this.handler)
                  ),
              {cssClass:"type4", isExpanded:false, canAdd: true}), 
              BoxUtil.listGroupBox(element, "systems", "Systems",
                  BoxUtil.indentBox(element, 3, "ss12",
                      BoxUtil.verticalPartListBox(element, element.systems, "systems", null, this.handler)
                  ),
              {cssClass:"type4", isExpanded:false, canAdd: true}),
              BoxUtil.listGroupBox(element, "people", "People",
                  BoxUtil.indentBox(element, 3, "ss13",
                      BoxUtil.verticalPartListBox(element, element.people, "people", null, this.handler)
                  ),
              {cssClass:"type4", isExpanded:false, canAdd: true}),
          ])
      ), 
  {cssClass:"w-full type3", placeHolder:"enter", isRequired:true});
  return box;
}

projectReference(element: Reference) {
let box: Box = 
  BoxUtil.itemGroupBox(element, "reference", "Reference", "title",
    BoxUtil.indentBox(element, 6.5, "ir1",
      BoxFactory.verticalLayout(element, "reference-overall", "", [
        BoxUtil.textBox(element, "link"),
      ])
    ), 
  {cssClass:"w-full type3", placeHolder:"reference", canShare:true, isRequired:true});
return box;
}

projectSystem(element: SystemAccess) {
  let box: Box = BoxUtil.itemGroupBox(element, "system", "System", "name",
      BoxUtil.indentBox(element, 6.5, "is1",
          BoxFactory.verticalLayout(element, "system-overall", "", [
              BoxUtil.textBox(element, "functionName"),
              BoxUtil.getBoxOrAction(element, "description", "Description", this.handler)
          ])
      ), 
  {cssClass:"w-full type3", placeHolder:"system", canShare:true, isRequired:true});
  return box;
}

projectPerson(element: Person) {
  let box: Box = BoxUtil.itemGroupBox(element, "person", "Person", "name",
      BoxUtil.indentBox(element, 6.5, "ip1",
          BoxFactory.verticalLayout(element, "person-overall", "", [
              BoxUtil.textBox(element, "email"),
              BoxUtil.textBox(element, "phoneNumber"),
              BoxUtil.getBoxOrAction(element, "role", "StaffRole", this.handler),
          ])
      ), 
  {cssClass:"w-full type3", placeHolder:"name", canShare:true, isRequired:true});
  return box;
}

}







// function copyIntoTask(target:Task, source:Task) {
//     console.log("copyIntoTask");
//     if (source.name) {
//         target.name = source.name;
//     }
//     // if (source.isShared) {
//     //     target.isShared = source.isShared;
//     // }
//     if (source.numberedSteps) {
//         target.numberedSteps = source.numberedSteps;
//     }
//     if (source.showDetails) {
//         target.showDetails = source.showDetails;
//     }
//     if (source.description) {
//         target.description = source.description.copy();
//     }
//     if (source.steps) {
//         console.log("copyIntoTask # steps:" + source.steps.length);
//         source.steps.forEach((x) => target.steps.push(x.copy()));
//     }
//     if (source.referencedTask) {
//         target.referencedTask = source.referencedTask.copy();
//     }
// }


// function copyIntoSystemAccess(target:SystemAccess, source:SystemAccess) {
//     const result = new SystemAccess();
//     if (source.name) {
//         target.name = source.name;
//     }
//     if (source.functionName) {
//         target.functionName = source.functionName;
//     }
//     if (source.description) {
//         target.description = source.description.copy();
//     }
//     if (source.accessedAt) {
//         target.accessedAt = source.accessedAt.copy();
//     }
//     if (source.robotMappings) {
//         source.robotMappings = target.robotMappings.copy();
//     }
// }

// // Override of implementation for TaskBoxProvider.getTableRowFor_default
// function newGetTableRowFor_defaultTaskImplementation(this: TaskBoxProvider): TableRowBox {
//     const cells: Box[] = [];
//     let task = this._element as Task;
//     let innerCells: Box[] = [];

//     //Action to share is invoked
//     // 1) 

//     if (task.type === "R") {
//         if(task.referencedTask === null) {
//             console.log("SHARED: referencedTask is null so task is just becoming shared");
//             let checklist = task.freOwner() as CheckList;
//             let event = checklist.freOwner() as Event;
//             let period = event.freOwner() as Period;
//             let studyConfig = period.freOwner() as StudyConfiguration;
//             let refToTask = FreNodeReference.create(task.name, "Task") as FreNodeReference<Task>;
//             let copyOfTask = task.copy();
//             task.name = "Original Task";
//             refToTask.referred = copyOfTask;
//             task.referencedTask = refToTask;
//             studyConfig.tasks.push(copyOfTask);
//         }
//         innerCells.push(
//           BoxFactory.horizontalLayout(task, "period-hlist-line-1", "",
//             [
//                 BoxUtil.labelBox(task, " Shared:", "top-1-line-2-item-0", { cssClass: "app-small-caps mt-1 mr-1" }),
//                 BoxUtil.switchElement(task, "isShared", ""),
//                 BoxUtil.referenceBox(task,"referencedTask",
// (selected: string) => { (task).referencedTask = FreNodeReference.create<Task>(
//                                 StudyConfigurationModelEnvironment.getInstance().scoper.getFromVisibleElements(task,selected,"Task") as Task,"Task");
//                         },
//                         StudyConfigurationModelEnvironment.getInstance().scoper,
//                     ),
//                 BoxUtil.labelBox(task, "Description:", "top-1-line-2-item-0", { cssClass: "app-small-caps mt-1 mr-1" }),
//                 BoxFactory.label(task, "xxx-top-1-line-2-item-0", ()=> task.referencedTask.referred.description.text,  undefined, "mr-1"),
//             ],
//           { selectable: false, cssClass:"align-top" })
//         );
//     } else {
//         // task was previously shared but that just changed so copy in what was shared
//         if (task.referencedTask !== null) {
//             copyIntoTask(task, task.referencedTask.referred);
//             // task.referencedTask = null;
//         }
//         innerCells.push(
//           BoxFactory.horizontalLayout(task, "period-hlist-line-1", "",
//             [
//                 BoxUtil.labelBox(task, " Shared:", "top-1-line-2-item-0", { cssClass: "app-small-caps mt-1 mr-1" }),
//                 BoxUtil.switchElement(task, "isShared", ""),
//                 BoxUtil.textBox(task, "name"),
//                 BoxUtil.labelBox(task, " Description:", "top-1-line-2-item-0", { cssClass: "app-small-caps mt-1 mr-1" }),
//                 BoxUtil.getBoxOrAction(task, "description", "Description", this.mainHandler),
//                 BoxUtil.labelBox(task, " Expand:", "top-1-line-2-item-0", { cssClass: "app-small-caps mt-1 mr-1" }),
//                 BoxUtil.switchElement(task, "showDetails", "")
//             ],
//             { selectable: true, cssClass:"align-top" })
//         );
//         if (task.showDetails === true) {
//             innerCells.push(BoxFactory.verticalLayout(task, "tasks-optionally1", "", [
//                 BoxUtil.booleanBox(task, "numberedSteps", { yes: "YES", no: "NO" }, BoolDisplay.SELECT),
//                 BoxUtil.verticalPartListBox(task, task.steps, "steps", null, this.mainHandler)]));
//         } 
//     }
//     cells.push(BoxFactory.verticalLayout(task, "tasks-optionally2", "", innerCells));
//     return TableUtil.rowBox(
//         this._element,
//         this._element.freOwnerDescriptor().propertyName,
//         "Task",
//         cells,
//         this._element.freOwnerDescriptor().propertyIndex,
//         true,
//     );
// }

// // Override of implementation for SystemAccessBoxProvider.getTableRowFor_default
// function newGetTableRowFor_defaultSystemAccessImplementation(this: SystemAccessBoxProvider): TableRowBox {
//     const cells: Box[] = [];
//     let systemAccess = this._element as SystemAccess;
//     let innerCells: Box[] = [];

//     console.log("SHARED: SystemAccessBoxProvider.getTableRowFor_default: systemAccess.isShared = " + systemAccess.isShared);
//     if (systemAccess.isShared === true) {
//         if(systemAccess.referencedSystemAccess === null) {
//             console.log("SHARED: referencedSystemAccess is null so SystemAccess is just becoming shared");
//             let step = systemAccess.freOwner() as Step;
//             let task = step.freOwner() as Task;
//             let checklist = task.freOwner() as CheckList;
//             let event = checklist.freOwner() as Event;
//             let period = event.freOwner() as Period;
//             let studyConfig = period.freOwner() as StudyConfiguration;
//             let refToSystemAccess = FreNodeReference.create(systemAccess.name, "SystemAccess") as FreNodeReference<SystemAccess>;
//             let copyOfSystemAccess = systemAccess.copy();
//             refToSystemAccess.referred = copyOfSystemAccess;
//             systemAccess.referencedSystemAccess = refToSystemAccess;
//             studyConfig.systemAccesses.push(copyOfSystemAccess);
//             console.log("SHARED: pushed system");
//         }
//         // if (systemAccess.referencedSystemAccess.referred.description === null) {
//         //     systemAccess.referencedSystemAccess.referred.description = new Description();
//         // }
//         console.log("SHARED: SystemAccess is shared");
//         innerCells.push(
//           BoxFactory.horizontalLayout(systemAccess, "period-hlist-line-1", "",
//             [
//                 BoxUtil.labelBox(systemAccess, " Shared:", "top-1-line-2-item-0", { cssClass: "app-small-caps mt-1 mr-1" }),
//                 BoxUtil.switchElement(systemAccess, "isShared", ""),
//                 BoxUtil.referenceBox(
//                         systemAccess,
//                         "referencedSystemAccess",
//                         (selected: string) => {
//                             systemAccess.referencedSystemAccess = FreNodeReference.create<SystemAccess>(
//                                 StudyConfigurationModelEnvironment.getInstance().scoper.getFromVisibleElements(
//                                     systemAccess,
//                                     selected,
//                                     "SystemAccess",
//                                 ) as SystemAccess,
//                                 "SystemAccess",
//                             );
//                         },
//                         StudyConfigurationModelEnvironment.getInstance().scoper,
//                     ),
//                 BoxUtil.labelBox(systemAccess.referencedSystemAccess.referred, " DescriptionX:", "sys-top-1-line-2-item-0", { cssClass: "app-small-caps mt-1 mr-1" }),
//                 BoxUtil.labelBox(systemAccess.referencedSystemAccess.referred.description, systemAccess.referencedSystemAccess.referred.description.rawText + " is the raw text!", "raw-sys-top-1-line-2-item-0", { cssClass: "app-small-caps mt-1 mr-1" }),
//             ],
//           { selectable: true, cssClass:"align-top" })
//         );
//     } else {
//         // task was previously shared but that just changed so copy in what was shared
//         if (systemAccess.referencedSystemAccess !== null) {
//             copyIntoSystemAccess(systemAccess, systemAccess.referencedSystemAccess.referred);
//             systemAccess.referencedSystemAccess = null;
//         }      
//         console.log("SHARED: System Access not shared yet");
//         innerCells.push(BoxFactory.verticalLayout(this._element as SystemAccess, "SystemAccess-overall", "", [
//             BoxUtil.labelBox(systemAccess, " Shared:", "top-1-line-2-item-0", { cssClass: "app-small-caps mt-1 mr-1" }),
//             BoxUtil.switchElement(systemAccess, "isShared", ""),
//             BoxUtil.emptyLineBox(this._element as SystemAccess, "SystemAccess-empty-line-0"),
//             BoxFactory.horizontalLayout(this._element as SystemAccess,"SystemAccess-hlist-line-1","",
//               [
//                   BoxUtil.labelBox(this._element as SystemAccess, "System Name  :", "top-1-line-1-item-0"),
//                   BoxUtil.textBox(this._element as SystemAccess, "name"),
//                   BoxUtil.labelBox(this._element as SystemAccess, "Function:", "top-1-line-1-item-2"),
//                   BoxUtil.textBox(this._element as SystemAccess, "functionName"),
//               ],
//             { selectable: true, cssClass:"align-top" }),
//             BoxFactory.horizontalLayout(this._element as SystemAccess,"SystemAccess-hlist-line-2","",
//               [
//                   BoxUtil.labelBox(this._element as SystemAccess, "Description  :", "sysa-top-1-line-2-item-0"),
//                   BoxUtil.getBoxOrAction(this._element as SystemAccess, "description", "Description", this.mainHandler),
//               ],
//             { selectable: true, cssClass:"align-top" }),
//             BoxFactory.horizontalLayout(this._element as SystemAccess,"SystemAccess-hlist-line-3","",
//               [
//                   BoxUtil.labelBox(this._element as SystemAccess, "Access at", "top-1-line-3-item-0"),
//                   BoxUtil.getBoxOrAction(this._element as SystemAccess, "accessedAt", "AccessedAt", this.mainHandler),
//               ],
//             { selectable: true, cssClass:"align-top" }),
//             BoxUtil.labelBox(this._element as SystemAccess, "The Robot should copy:", "top-1-line-4-item-0"),
//             BoxUtil.indentBox(this._element as SystemAccess, 4, "5",
//                 BoxUtil.getBoxOrAction(this._element as SystemAccess, "robotMappings", "RobotMapping", this.mainHandler),
//             ),
//             BoxUtil.emptyLineBox(this._element as SystemAccess, "SystemAccess-empty-line-6"),
//             BoxUtil.emptyLineBox(this._element as SystemAccess, "SystemAccess-empty-line-7"),
//             BoxUtil.emptyLineBox(this._element as SystemAccess, "SystemAccess-empty-line-8"),
//         ]));
//     }
//     cells.push(BoxFactory.verticalLayout(systemAccess, "systemsAccess-optionally2", "", innerCells));
//     return TableUtil.rowBox(
//         this._element,
//         this._element.freOwnerDescriptor().propertyName,
//         "SystemAccess",
//         cells,
//         this._element.freOwnerDescriptor().propertyIndex,
//         true,
//     );
// }