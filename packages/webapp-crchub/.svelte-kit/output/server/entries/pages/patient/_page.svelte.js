import { z as push, F as escape_html, B as pop, A as onMount, U as onDestroy, M as store_get, N as unsubscribe_stores } from "../../../chunks/index.js";
import { P as Pencil, T as Tabs, U as Undo, R as Redo, p as page } from "../../../chunks/editor-requests-handler.js";
import "clsx";
import { A as AST, W as WebappConfigurator, f as ModelManager } from "../../../chunks/model-manager.js";
import "../../../chunks/env.js";
import { s as setDrawerVisibility, S as Save } from "../../../chunks/side-drawer-store.js";
import { d as dataStore } from "../../../chunks/data-store.js";
import { C as Calendar_days } from "../../../chunks/calendar-days.js";
import { F as FreonComponent } from "../../../chunks/FreonComponent.js";
function PatientCard($$payload, $$props) {
  push();
  const { patient } = $$props;
  $$payload.out += `<div class="card card-area max-w-sm h-full"><div class="flex items-center justify-left mb-4"><h3 class="text-base font-bold mr-2">Patient</h3> <button type="button" class="icon-button btn-sm grid-header-button">`;
  Pencil($$payload, {});
  $$payload.out += `<!----></button></div> <div class="space-y-2"><div><h4 class="card-label-text">Patient Number</h4> <p class="text-sm">${escape_html(patient.patientNumber)}</p></div> <div><h4 class="card-label-text">Initials</h4> <p class="text-xs">${escape_html(patient.initials)}</p></div> <div><h4 class="card-label-text">YOB</h4> <p class="text-xs">${escape_html(patient.dob)}</p></div> <div><h4 class="card-label-text">Gender</h4> <p class="text-xs">${escape_html(patient.gender)}</p></div></div></div>`;
  pop();
}
function Patient($$payload, $$props) {
  push();
  let { id } = $$props;
  let patient = void 0;
  let isLoading = true;
  let activeTab = "schedule";
  let dslEditor = void 0;
  let patientInfo;
  onMount(async () => {
    const fetchedPatient = await dataStore.getPatient(id);
    if (fetchedPatient) {
      patient = fetchedPatient;
    } else {
      console.error(`Patient with id ${id} not found`);
    }
    AST.change(async () => {
      dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
      const modelManager = ModelManager.getInstance();
      await modelManager.createBasicModelUnit("PatientHistoryUnit", "PatientHistoryUnit");
      var patientHistoryUnit = modelManager.getModelUnit("PatientHistoryUnit");
      clearPatientHistory(patientHistoryUnit.patientHistory);
      patientHistoryUnit.patientHistory.patient_id = patient.patientNumber;
      patientInfo = await modelManager.openModelUnitWithoutSavingCurrentUnit(patient.studyId, "PatientInfo");
      if (patientInfo === null || patientInfo === void 0) {
        await modelManager.createRawModelUnit("PatientInfo", "PatientInfo");
      } else {
        var found = false;
        patientInfo.patientHistories.forEach((aPatientHistory) => {
          if (!found && aPatientHistory.patient_id === patient.patientNumber) {
            aPatientHistory.patientVisits.forEach((visit) => patientHistoryUnit.patientHistory.patientVisits.push(visit.copy()));
            aPatientHistory.patientNotAvailableDates.dates.forEach((dateRange) => patientHistoryUnit.patientHistory.patientNotAvailableDates.dates.push(dateRange.copy()));
            patientHistoryUnit.patientHistory.startOfStudyDate = aPatientHistory.startOfStudyDate?.copy();
            patientHistoryUnit.patientHistory.id = aPatientHistory.id;
            patientHistoryUnit.patientHistory.patient_id = aPatientHistory.patient_id;
            found = true;
          }
        });
      }
      await modelManager.setCurrentUnit(patientHistoryUnit);
      await modelManager.displayModelUnit(patientHistoryUnit);
    });
    setTimeout(
      () => {
        isLoading = false;
      },
      300
    );
  });
  onDestroy(() => {
    setDrawerVisibility("studyChecklist", false);
    setDrawerVisibility("patientTimelineChart", false);
  });
  function clearPatientHistory(patientHistory) {
    patientHistory.patientVisits.splice(0);
    patientHistory.patientNotAvailableDates.dates.splice(0);
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
        $$payload2.out += `<!---->`;
      }, content = function($$payload2) {
        $$payload2.out += `<!---->`;
        Tabs.Panel($$payload2, {
          value: "schedule",
          children: ($$payload3) => {
            if (!isLoading) {
              $$payload3.out += "<!--[-->";
              $$payload3.out += `<div class="flex gap-2 mb-2"><button type="button" class="icon-button primary inverted">`;
              Save($$payload3, {});
              $$payload3.out += `<!----></button> <button type="button" class="icon-button primary inverted">`;
              Undo($$payload3, {});
              $$payload3.out += `<!----></button> <button type="button" class="icon-button primary inverted">`;
              Redo($$payload3, {});
              $$payload3.out += `<!----></button></div> <div class="crc-editor crc-content-width">`;
              FreonComponent($$payload3, { editor: dslEditor });
              $$payload3.out += `<!----></div>`;
            } else {
              $$payload3.out += "<!--[!-->";
              $$payload3.out += `<div class="h-full crc-content-width"><div class="placeholder animate-pulse"></div></div>`;
            }
            $$payload3.out += `<!--]-->`;
          },
          $$slots: { default: true }
        });
        $$payload2.out += `<!---->`;
      };
      Tabs($$payload, {
        value: activeTab,
        onValueChange: (e) => activeTab = e.value,
        listGap: "gap-6",
        listMargin: "mb-2",
        base: "mt-2",
        contentBase: "mt-0",
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
