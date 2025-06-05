import { t as tv, R as RtString, N as NN, L as LOe, M as ModelManager, V as lf, X as jo, Y as Sf, Z as FreNodeReference, _ as of, $ as lt, a0 as uf, a1 as Jr, a2 as em } from "./FontAwesomeIcon.js";
import { w as writable } from "./exports.js";
import { v4 } from "uuid";
import { d as dataStore } from "./data-store.js";
function getTimelineChartHtml(timeline) {
  const timelineDataAsScript = tv.getTimelineDataHTML(timeline);
  const timelineVisualizationHTML = tv.getTimelineVisualizationHTML(timeline);
  const chartHTML = tv.getTimelineAsHTMLBlock(timelineDataAsScript + timelineVisualizationHTML);
  const html = `<div class="limited-width-container">${chartHTML}</div>`;
  return new RtString(html);
}
function getTimeline(node) {
  var simulator;
  new NN();
  let studyConfigurationUnit = node;
  simulator = new LOe(studyConfigurationUnit);
  simulator.setReferenceDate(new Date(2024, 8, 30));
  simulator.organizedByReferenceDate();
  simulator.run();
  let timeline = simulator.timeline;
  return timeline;
}
function getStatusColor(status) {
  switch (status.toLowerCase()) {
    case "active":
      return "green";
    case "complete":
      return "dark";
    case "suspended":
      return "pink";
    case "terminated":
      return "red";
    case "planning":
      return "indigo";
    default:
      return "default";
  }
}
function getSVGIcon(iconName) {
  let svg = "";
  switch (iconName) {
    case "add":
      svg = '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="plus" class="svg-inline--fa fa-plus w-3 h-3" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"></path></svg>';
      break;
    case "delete":
      svg = '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="xmark" class="svg-inline--fa fa-xmark w-3 h-3" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"></path></svg>';
      break;
    case "edit":
      svg = '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="pencil" class="svg-inline--fa fa-pencil w-3 h-3" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1 0 32c0 8.8 7.2 16 16 16l32 0zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path></svg>';
      break;
    default:
      svg = "";
  }
  return svg;
}
function getMonthFromString(month) {
  switch (month.toLowerCase()) {
    case "january":
      return lt.January;
    case "february":
      return lt.February;
    case "march":
      return lt.March;
    case "april":
      return lt.April;
    case "may":
      return lt.May;
    case "june":
      return lt.June;
    case "july":
      return lt.July;
    case "august":
      return lt.August;
    case "september":
      return lt.September;
    case "october":
      return lt.October;
    case "november":
      return lt.November;
    case "december":
      return lt.December;
    default:
      throw new Error(`Invalid month: ${month}`);
  }
}
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
function createACompletedPatientVisit(visitName, day, month, year, visitInstanceNumber) {
  const referencedEvent = FreNodeReference.create(visitName, "Event");
  const visitDate = uf.create({ day, month: FreNodeReference.create(getMonthFromString(month), "Month"), year });
  const completedVisitStatus = FreNodeReference.create(Jr.completed, "completed");
  let patientVisit = em.create({
    visit: referencedEvent,
    actualVisitDate: visitDate,
    status: completedVisitStatus,
    visitInstanceNumber
  });
  return patientVisit;
}
function createPatientNotAvailableDateRange(startDay, startMonth, startYear, endDay, endMonth, endYear) {
  const startDateInRange = Sf.create({
    day: startDay,
    month: FreNodeReference.create(getMonthFromString(startMonth), "Month"),
    year: startYear
  });
  if (!endDay) {
    endDay = startDay;
    endMonth = startMonth;
    endYear = startYear;
  }
  let endMonthString = "";
  if (endMonth !== void 0) {
    endMonthString = endMonth;
  } else {
    endMonthString = startMonth;
  }
  const endDateInRange = Sf.create({
    day: endDay,
    month: FreNodeReference.create(getMonthFromString(endMonthString), "Month"),
    year: endYear
  });
  const dateOrRange = of.create({ startDate: startDateInRange, endDate: endDateInRange });
  return dateOrRange;
}
function createCompletedPatientVisits(numberToCreate, timeline, shiftsFromScheduledVisit = []) {
  let completedPatientVisits = [];
  let i = 0;
  const referenceDate = timeline.getReferenceDate();
  timeline.printTimelineOfScheduledEventInstances();
  timeline.getScheduleEventInstancesOrderByDay().forEach((scheduledEventInstance) => {
    if (i++ < numberToCreate) {
      let dateOfVisit = /* @__PURE__ */ new Date();
      const startDay = scheduledEventInstance.getStartDay();
      let foundAMatch = false;
      let shiftsForVisitInstance = shiftsFromScheduledVisit.filter((record) => record.name === scheduledEventInstance.getName());
      if (shiftsForVisitInstance.length > 0) {
        shiftsForVisitInstance.forEach((shiftFromScheduledVisit) => {
          shiftFromScheduledVisit.numberFound++;
          if (shiftFromScheduledVisit.numberFound === shiftFromScheduledVisit.instance && shiftFromScheduledVisit.foundThisInstance === false) {
            dateOfVisit = addDays(referenceDate, startDay + shiftFromScheduledVisit.shift);
            shiftFromScheduledVisit.foundThisInstance = true;
            foundAMatch = true;
          }
        });
      }
      if (!foundAMatch) {
        dateOfVisit = addDays(referenceDate, startDay);
      }
      const patientVisit = createACompletedPatientVisit(
        scheduledEventInstance.getName(),
        dateOfVisit.getDate().toString(),
        timeline.getMonthName(dateOfVisit.getMonth()),
        dateOfVisit.getFullYear().toString(),
        scheduledEventInstance.getInstanceNumber()
      );
      console.log(
        "Adding completed visit: " + scheduledEventInstance.getName() + " instance: " + scheduledEventInstance.getInstanceNumber() + " on " + dateOfVisit.toDateString()
      );
      completedPatientVisits.push(patientVisit);
    }
  });
  return completedPatientVisits;
}
async function getChartWithPatientHistory(id) {
  console.log("getChartWithPatientHistory");
  const model = ModelManager.getInstance().modelStore.model;
  const unit = model.configuration;
  let timeline = getTimeline(unit);
  let shiftsFromScheduledVisit = [
    { name: "V2 Randomization", instance: 1, shift: -1, numberFound: 0, foundThisInstance: false },
    { name: "V4-V7 Randomization", instance: 1, shift: -4, numberFound: 0, foundThisInstance: false },
    { name: "V4-V7 Randomization", instance: 2, shift: 2, numberFound: 0, foundThisInstance: false }
  ];
  let completedPatientVisits = createCompletedPatientVisits(10, timeline, shiftsFromScheduledVisit);
  let dateRangeList = [];
  let dateRange = createPatientNotAvailableDateRange("3", "November", "2024", "3", "November", "2024");
  dateRangeList.push(dateRange);
  dateRange = createPatientNotAvailableDateRange("1", "December", "2024", "7", "December", "2024");
  dateRangeList.push(dateRange);
  let patientNotAvailable = lf.create({ dates: dateRangeList });
  let patientHistory = jo.create({ id: "MV", patientVisits: completedPatientVisits, patientNotAvailableDates: patientNotAvailable });
  timeline.setPatientHistory(patientHistory);
  timeline.addPatientEvents(patientHistory);
  const rtObject = getTimelineChartHtml(timeline);
  return rtObject.asString();
}
const drawerStore = writable({
  instanceId: v4(),
  open: false,
  objectType: null,
  action: null,
  id: null,
  object: null
});
async function addObject(type, parentId) {
  let parentName = "";
  if (parentId && type === "patient") {
    const parentObject = await dataStore.getStudy(parentId);
    if (parentObject) {
      parentName = parentObject.name;
    }
  }
  const object = type === "study" ? { id: v4(), name: "", title: "", status: "", phase: "", therapeuticArea: "", currentProtocol: "" } : { id: v4(), patientNumber: "", displayName: "", name: "", dob: "", gender: "", studyId: parentId, study: parentName };
  drawerStore.set({ instanceId: v4(), open: true, objectType: type, action: "add", id: null, object });
}
async function editObject(type, id) {
  console.log("editObject called:", type, id);
  let object;
  if (type === "study") {
    object = await dataStore.getStudy(id);
  } else {
    object = await dataStore.getPatient(id);
  }
  console.log("Object retrieved:", object);
  if (!object) {
    console.error(`${type} with id ${id} not found`);
  } else {
    console.error(`${type} with id ${id} found`);
    drawerStore.set({ instanceId: v4(), open: true, objectType: type, action: "edit", id, object });
  }
}
export {
  addObject as a,
  getChartWithPatientHistory as b,
  getStatusColor as c,
  drawerStore as d,
  editObject as e,
  getSVGIcon as g
};
