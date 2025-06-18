import { z as push, J as spread_props, B as pop, E as escape_html, A as onMount, Q as attr_style, I as stringify, K as store_get, M as unsubscribe_stores } from "../../../chunks/index.js";
import { P as Pencil, T as Tabs, p as page } from "../../../chunks/stores.js";
import "clsx";
import "../../../chunks/model-manager.js";
import "../../../chunks/env.js";
import "../../../chunks/Tooltip.svelte_svelte_type_style_lang.js";
import { I as Icon, d as dataStore, a as getChartWithPatientHistory } from "../../../chunks/utils.js";
import { h as html } from "../../../chunks/html.js";
function Calendar_days($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["path", { "d": "M8 2v4" }],
    ["path", { "d": "M16 2v4" }],
    [
      "rect",
      {
        "width": "18",
        "height": "18",
        "x": "3",
        "y": "4",
        "rx": "2"
      }
    ],
    ["path", { "d": "M3 10h18" }],
    ["path", { "d": "M8 14h.01" }],
    ["path", { "d": "M12 14h.01" }],
    ["path", { "d": "M16 14h.01" }],
    ["path", { "d": "M8 18h.01" }],
    ["path", { "d": "M12 18h.01" }],
    ["path", { "d": "M16 18h.01" }]
  ];
  Icon($$payload, spread_props([
    { name: "calendar-days" },
    props,
    {
      iconNode,
      children: ($$payload2) => {
        props.children?.($$payload2);
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
  pop();
}
function List_todo($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "rect",
      {
        "x": "3",
        "y": "5",
        "width": "6",
        "height": "6",
        "rx": "1"
      }
    ],
    ["path", { "d": "m3 17 2 2 4-4" }],
    ["path", { "d": "M13 6h8" }],
    ["path", { "d": "M13 12h8" }],
    ["path", { "d": "M13 18h8" }]
  ];
  Icon($$payload, spread_props([
    { name: "list-todo" },
    props,
    {
      iconNode,
      children: ($$payload2) => {
        props.children?.($$payload2);
        $$payload2.out += `<!---->`;
      },
      $$slots: { default: true }
    }
  ]));
  pop();
}
function PatientCard($$payload, $$props) {
  push();
  const { patient } = $$props;
  $$payload.out += `<div class="card crc-card-area max-w-sm h-full"><div class="flex items-center justify-left mb-4"><h3 class="text-base font-bold mr-2">Patient</h3> <button type="button" class="icon-button btn-sm grid-header-button">`;
  Pencil($$payload, {});
  $$payload.out += `<!----></button></div> <div class="space-y-2"><div><h4 class="card-label-text">Patient Number</h4> <p class="text-sm">${escape_html(patient.patientNumber)}</p></div> <div><h4 class="card-label-text">Initials</h4> <p class="text-xs">${escape_html(patient.initials)}</p></div> <div><h4 class="card-label-text">YOB</h4> <p class="text-xs">${escape_html(patient.dob)}</p></div> <div><h4 class="card-label-text">Gender</h4> <p class="text-xs">${escape_html(patient.gender)}</p></div></div></div>`;
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
  let activeTab = "schedule";
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
    {
      let list = function($$payload2) {
        $$payload2.out += `<!---->`;
        Tabs.Control($$payload2, {
          value: "schedule",
          children: ($$payload3) => {
            $$payload3.out += `<div class="flex items-center gap-2">`;
            Calendar_days($$payload3, {});
            $$payload3.out += `<!---->Schedule</div>`;
          },
          $$slots: { default: true }
        });
        $$payload2.out += `<!----> <!---->`;
        Tabs.Control($$payload2, {
          value: "tasks",
          children: ($$payload3) => {
            $$payload3.out += `<div class="flex items-center gap-2">`;
            List_todo($$payload3, {});
            $$payload3.out += `<!---->Tasks</div>`;
          },
          $$slots: { default: true }
        });
        $$payload2.out += `<!---->`;
      }, content = function($$payload2) {
        $$payload2.out += `<!---->`;
        Tabs.Panel($$payload2, {
          value: "schedule",
          children: ($$payload3) => {
            $$payload3.out += `<div${attr_style(`display: ${stringify(isLoading || !showChart ? "block" : "none")}`)}><div class="placeholder animate-pulse mb-4"></div></div> <div${attr_style(`display: ${stringify(!isLoading && showChart ? "block" : "none")}`)}><div>${html(chartHtml)}</div></div>`;
          },
          $$slots: { default: true }
        });
        $$payload2.out += `<!----> <!---->`;
        Tabs.Panel($$payload2, {
          value: "tasks",
          children: ($$payload3) => {
            $$payload3.out += `<div class="crc-grid"></div>`;
          },
          $$slots: { default: true }
        });
        $$payload2.out += `<!---->`;
      };
      Tabs($$payload, {
        value: activeTab,
        onValueChange: (e) => {
          activeTab = e.value;
          if (e.value === "schedule" && patient) {
            loadChart(patient.studyId);
          }
        },
        list,
        content,
        $$slots: { list: true, content: true }
      });
    }
    $$payload.out += `<!----></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="h-full crc-content-width"><div class="placeholder animate-pulse"></div></div>`;
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let id = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("id") || "";
  Patient($$payload, { id });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
