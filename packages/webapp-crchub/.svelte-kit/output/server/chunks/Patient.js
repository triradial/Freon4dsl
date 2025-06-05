import { F as push, K as escape_html, I as pop, G as onMount, Y as attr_style, U as stringify } from "./environment.js";
import "clsx";
import { Card, Button, Tabs, TabItem, ListPlaceholder } from "flowbite-svelte";
import { b as getChartWithPatientHistory } from "./object-drawer-store.js";
import { F as FontAwesomeIcon } from "./FontAwesomeIcon.js";
import { faPencil, faCalendarDays, faListCheck } from "@fortawesome/free-solid-svg-icons";
import { d as dataStore } from "./data-store.js";
function html(value) {
  var html2 = String(value ?? "");
  var open = "<!---->";
  return open + html2 + "<!---->";
}
function PatientCard($$payload, $$props) {
  push();
  const { patient } = $$props;
  Card($$payload, {
    class: "crc-card-area max-w-sm h-full",
    children: ($$payload2) => {
      $$payload2.out += `<div class="flex items-center justify-left mb-4"><h3 class="text-base font-bold mr-2">Patient</h3> `;
      Button($$payload2, {
        pill: true,
        outline: true,
        class: "grid-header-button",
        size: "sm",
        children: ($$payload3) => {
          FontAwesomeIcon($$payload3, { icon: faPencil });
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!----></div> <div class="space-y-2"><div><h4 class="card-label-text">Patient Number</h4> <p class="text-sm">${escape_html(patient.patientNumber)}</p></div> <div><h4 class="card-label-text">Initials</h4> <p class="text-xs">${escape_html(patient.initials)}</p></div> <div><h4 class="card-label-text">YOB</h4> <p class="text-xs">${escape_html(patient.dob)}</p></div> <div><h4 class="card-label-text">Gender</h4> <p class="text-xs">${escape_html(patient.gender)}</p></div></div>`;
    },
    $$slots: { default: true }
  });
  pop();
}
function Patient($$payload, $$props) {
  push();
  let { id } = $$props;
  let patient = void 0;
  let isLoading = true;
  let showChart = false;
  let chartHtml = "";
  let container = null;
  onMount(async () => {
    const fetchedPatient = await dataStore.getPatient(id);
    if (fetchedPatient) {
      patient = fetchedPatient;
      await loadChart(patient.studyId);
    } else {
      console.error(`Patient with id ${id} not found`);
    }
  });
  async function loadChart(id2) {
    isLoading = true;
    showChart = false;
    try {
      const startTime = Date.now();
      console.log("calling getChartWithPatientHistory");
      chartHtml = await getChartWithPatientHistory(id2);
      await new Promise((resolve) => setTimeout(() => resolve(null), 0));
      if (container) ;
      else {
        console.error("Container not found");
        throw new Error("Container not available");
      }
    } catch (err) {
      console.error(`Error fetching chart data for study: ${id2}`, err);
      err instanceof Error ? err.message : "An error occurred while fetching chart data";
    } finally {
      isLoading = false;
    }
  }
  async function loadChartData() {
    return new Promise((resolve) => {
      resolve();
    });
  }
  if (patient) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="crc-container"><div class="crc-card">`;
    PatientCard($$payload, { patient });
    $$payload.out += `<!----></div> <div class="crc-content">`;
    Tabs($$payload, {
      tabStyle: "pill",
      class: "crc-tab",
      children: ($$payload2) => {
        TabItem($$payload2, {
          open: true,
          title: "Schedule",
          children: ($$payload3) => {
            $$payload3.out += `<div${attr_style(`display: ${stringify(isLoading || !showChart ? "block" : "none")}`)}>`;
            ListPlaceholder($$payload3, { divClass: "mb-4" });
            $$payload3.out += `<!----></div> <div${attr_style(`display: ${stringify(!isLoading && showChart ? "block" : "none")}`)}><div>${html(chartHtml)}</div></div>`;
          },
          $$slots: {
            default: true,
            title: ($$payload3) => {
              $$payload3.out += `<div slot="title" class="flex items-center gap-2">`;
              FontAwesomeIcon($$payload3, { icon: faCalendarDays, class: "w-4 h-4" });
              $$payload3.out += `<!---->Schedule</div>`;
            }
          }
        });
        $$payload2.out += `<!----> `;
        TabItem($$payload2, {
          title: "Tasks",
          children: ($$payload3) => {
            $$payload3.out += `<div class="crc-grid"></div>`;
          },
          $$slots: {
            default: true,
            title: ($$payload3) => {
              $$payload3.out += `<div slot="title" class="flex items-center gap-2">`;
              FontAwesomeIcon($$payload3, { icon: faListCheck, class: "w-4 h-4" });
              $$payload3.out += `<!---->Tasks</div>`;
            }
          }
        });
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    });
    $$payload.out += `<!----></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<p>Loading patient...</p>`;
  }
  $$payload.out += `<!--]-->`;
  pop();
}
export {
  Patient as P,
  html as h
};
