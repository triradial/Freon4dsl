import { w as writable, g as get } from "./index3.js";
import { M as ModelManager, t as tv, R as RtString, N as NN, L as LOe, a0 as lf, a1 as jo, a2 as Sf, b as FreNodeReference, a3 as of, a4 as lt, a5 as uf, a6 as Jr, a7 as em } from "./model-manager.js";
import { e as env } from "./env.js";
function createUserStore() {
  const { subscribe, set, update } = writable(null);
  return {
    subscribe,
    setUser: (user) => {
      set(user);
      sessionStorage.setItem("user", JSON.stringify(user));
    },
    clearUser: () => {
      set(null);
      sessionStorage.removeItem("user");
    },
    updateUser: (data) => {
      update((user) => {
        const updatedUser = user ? { ...user, ...data } : null;
        if (updatedUser) {
          sessionStorage.setItem("user", JSON.stringify(updatedUser));
        }
        return updatedUser;
      });
    },
    initializeFromStorage: () => {
      const storedUser = sessionStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          set(parsedUser);
        } catch (error) {
          console.error("Failed to parse stored user:", error);
          sessionStorage.removeItem("user");
        }
      }
    }
  };
}
const userStore = createUserStore();
function createDataStore() {
  const { subscribe, set, update } = writable({
    studies: [],
    patients: [],
    studyPatients: []
  });
  async function initializeDatastore() {
    await Promise.all([
      getStudies(),
      getPatients()
    ]);
  }
  async function getStudies() {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      const resp = await fetch(`${env.serverUrl}/getStudies?uid=${currentUser.userid}`);
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      const text = await resp.text();
      const data = JSON.parse(text);
      update((state) => ({ ...state, studies: data }));
      return true;
    } catch (error) {
      console.error("Error loading studies:", error);
      return false;
    }
  }
  async function getStudy(studyId) {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      const response = await fetch(`${env.serverUrl}/getStudy?id=${studyId}&uid=${currentUser.userid}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error("Error fetching study:", error);
      return void 0;
    }
  }
  async function addStudy(newStudy) {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      const response = await fetch(`${env.serverUrl}/addStudy?uid=${currentUser.userid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudy)
      });
      if (!response.ok) throw new Error("Failed to add study");
      const text = await response.text();
      const addedStudy = JSON.parse(text);
      await ModelManager.getInstance().createModel(addedStudy.id);
      update((state) => ({ ...state, studies: [...state.studies, addedStudy] }));
      return true;
    } catch (error) {
      console.error("Error adding study:", error);
      return false;
    }
  }
  async function updateStudy(updatedStudy) {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      const response = await fetch(`${env.serverUrl}/updateStudy?id=${updatedStudy.id}&uid=${currentUser.userid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedStudy)
      });
      if (!response.ok) throw new Error("Failed to update study");
      update((state) => ({ ...state, studies: state.studies.map((study) => study.id === updatedStudy.id ? updatedStudy : study) }));
      return true;
    } catch (error) {
      console.error("Error updating study:", error);
      return false;
    }
  }
  async function deleteStudy(studyId) {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      const response = await fetch(`${env.serverUrl}/deleteStudy?id=${studyId}&uid=${currentUser.userid}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete study");
      update((state) => ({ ...state, studies: state.studies.filter((study) => study.id !== studyId) }));
      await ModelManager.getInstance().deleteModel(studyId);
      return true;
    } catch (error) {
      console.error("Error deleting study:", error);
      return false;
    }
  }
  async function getPatients() {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      const resp = await fetch(`${env.serverUrl}/getPatients?uid=${currentUser.userid}`);
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      const text = await resp.text();
      const data = JSON.parse(text);
      update((state) => ({ ...state, patients: data }));
      return true;
    } catch (error) {
      console.error("Error loading patients:", error);
      return false;
    }
  }
  async function getStudyPatients(studyId) {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      const resp = await fetch(`${env.serverUrl}/getStudyPatients?id=${studyId}&uid=${currentUser.userid}`);
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      const text = await resp.text();
      const data = JSON.parse(text);
      update((state) => ({ ...state, studyPatients: data }));
      return true;
    } catch (error) {
      console.error("Error loading study patients:", error);
      return false;
    }
  }
  async function getPatient(patientId) {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      const response = await fetch(`${env.serverUrl}/getPatient?id=${patientId}&uid=${currentUser.userid}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error("Error fetching patient:", error);
      return void 0;
    }
  }
  async function addPatient(newPatient) {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      const response = await fetch(`${env.serverUrl}/addPatient?uid=${currentUser.userid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPatient)
      });
      if (!response.ok) throw new Error("Failed to add patient");
      const text = await response.text();
      const addedPatient = JSON.parse(text);
      update((state) => ({ ...state, patients: [...state.patients, addedPatient] }));
      update((state) => ({ ...state, studyPatients: [...state.studyPatients, addedPatient] }));
      return true;
    } catch (error) {
      console.error("Error adding patient:", error);
      return false;
    }
  }
  async function updatePatient(updatedPatient) {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      const response = await fetch(`${env.serverUrl}/updatePatient?id=${updatedPatient.id}&uid=${currentUser.userid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPatient)
      });
      if (!response.ok) throw new Error("Failed to update patient");
      update((state) => ({ ...state, patients: state.patients.map((patient) => patient.id === updatedPatient.id ? updatedPatient : patient) }));
      update((state) => ({ ...state, studyPatients: state.studyPatients.map((patient) => patient.id === updatedPatient.id ? updatedPatient : patient) }));
      return true;
    } catch (error) {
      console.error("Error updating patient:", error);
      return false;
    }
  }
  async function deletePatient(patientId) {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      const response = await fetch(`${env.serverUrl}/deletePatient?id=${patientId}&uid=${currentUser.userid}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete patient");
      update((state) => ({ ...state, patients: state.patients.filter((patient) => patient.id !== patientId) }));
      update((state) => ({ ...state, studyPatients: state.studyPatients.filter((patient) => patient.id !== patientId) }));
      return true;
    } catch (error) {
      console.error("Error deleting patient:", error);
      return false;
    }
  }
  async function getUserById(userId) {
    try {
      const response = await fetch(`${env.serverUrl}/getUser?id=${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error("Error fetching user:", error);
      return void 0;
    }
  }
  async function getUserByEmail(email) {
    try {
      if (!email) {
        console.error("getUserByEmail called with null or undefined email");
        return void 0;
      }
      const url = `${env.serverUrl}/getUserByEmail?email=${encodeURIComponent(email)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        console.error("Error response:", data);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      return void 0;
    }
  }
  return {
    subscribe,
    initializeDatastore,
    getStudies,
    getStudy,
    addStudy,
    updateStudy,
    deleteStudy,
    getPatients,
    getStudyPatients,
    getPatient,
    addPatient,
    updatePatient,
    deletePatient,
    getUserById,
    getUserByEmail
  };
}
const dataStore = createDataStore();
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
      svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
      break;
    case "delete":
      svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>';
      break;
    case "edit":
      svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil-icon lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>';
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
export {
  getChartWithPatientHistory as a,
  getSVGIcon as b,
  dataStore as d,
  getStatusColor as g,
  userStore as u
};
