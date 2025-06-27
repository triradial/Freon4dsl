import "clsx";
import { M as store_get, A as onMount, N as unsubscribe_stores, B as pop, T as head, J as attr_class, z as push, K as stringify } from "../../../chunks/index.js";
import { d as dataStore } from "../../../chunks/data-store.js";
import { a as getSVGIcon, e as editObject } from "../../../chunks/utils.js";
import { createGrid } from "ag-grid-community";
import "ag-grid-enterprise";
import { G as GridHeader, D as DeleteObjectDialog, n as navigateTo } from "../../../chunks/DeleteObjectDialog.js";
import { t as theme } from "../../../chunks/theme-store.js";
import { c as copy_payload, a as assign_payload } from "../../../chunks/plus.js";
function StudyGrid($$payload, $$props) {
  push();
  var $$store_subs;
  let deleteDialogOpen = false;
  let objectToDelete = null;
  let gridOptions;
  let gridApi;
  let studiesData = store_get($$store_subs ??= {}, "$dataStore", dataStore).studies;
  let canManageStudies = true;
  let gridTheme = store_get($$store_subs ??= {}, "$theme", theme) === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz";
  function updateGridData() {
    if (gridApi && studiesData) {
      gridApi.setGridOption("rowData", studiesData);
      setTimeout(
        () => {
          gridApi.sizeColumnsToFit();
          gridApi.autoSizeAllColumns();
        },
        100
      );
    }
  }
  onMount(async () => {
    gridOptions = {
      defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true
      },
      autoSizeStrategy: { type: "fitCellContents" },
      columnDefs: [
        {
          field: "name",
          tooltipField: "title",
          cellRenderer: (params) => {
            return createNameCell(params);
          }
        },
        {
          field: "phase",
          enableRowGroup: true,
          resizable: false
        },
        {
          field: "status",
          enableRowGroup: true,
          filter: "agSetColumnFilter",
          filterParams: { excelMode: "mac" }
        },
        {
          field: "therapeuticArea",
          headerName: "Therapeutic Area",
          enableRowGroup: true,
          filter: "agSetColumnFilter",
          filterParams: { excelMode: "mac" }
        }
      ],
      groupDisplayType: "groupRows",
      rowGroupPanelShow: "always",
      onGridReady: (params) => {
        if (studiesData.length > 0) {
          updateGridData();
        }
      }
    };
    const gridElement = document.querySelector("#studyGrid");
    gridApi = createGrid(gridElement, gridOptions);
    gridElement.addEventListener("click", (event) => {
      const target = event.target;
      if (target.tagName === "A") {
        event.preventDefault();
        const studyId = target.getAttribute("data-study-id");
        if (studyId) {
          onOpenClick(studyId);
        }
      }
    });
  });
  function onOpenClick(studyId) {
    console.log("Open clicked for studyid:", studyId);
    navigateTo("study", studyId);
  }
  function onDeleteClick(studyId) {
    console.log("Delete clicked for study:", studyId);
    objectToDelete = studiesData.find((s) => s.id === studyId);
    if (objectToDelete) {
      deleteDialogOpen = true;
    }
  }
  function onEditClick(studyId) {
    console.log("Edit clicked for study:", studyId);
    editObject("study", studyId);
  }
  function createNameCell(params) {
    const name = `<a href="#" data-study-id="${params.data.id}">${params.data.name}</a>`;
    const span = document.createElement("span");
    span.classList.add("grid-cell");
    span.innerHTML = name;
    const buttonConfigs = [
      {
        type: "edit",
        icon: "edit",
        level: "primary",
        onClick: onEditClick,
        isVisible: () => {
          return canManageStudies;
        }
      },
      {
        type: "delete",
        icon: "delete",
        level: "primary",
        onClick: onDeleteClick,
        isVisible: () => {
          return canManageStudies;
        }
      }
    ];
    const visibleButtons = buttonConfigs.filter((btn) => btn.isVisible());
    if (visibleButtons.length > 0) {
      const buttonGroup = document.createElement("span");
      buttonGroup.classList.add("grid-button-group");
      addActionButtons(buttonGroup, params, visibleButtons);
      span.appendChild(buttonGroup);
    }
    return span;
  }
  function addActionButtons(span, params, buttonConfigs) {
    buttonConfigs.forEach((config) => {
      const button = document.createElement("button");
      button.classList.add("icon-button", `${config.level}`, "inverted");
      button.innerHTML = getSVGIcon(config.icon);
      if (config.text) {
        button.innerHTML += config.text;
        button.classList.add("text");
      }
      button.addEventListener("click", () => config.onClick(params.data.id));
      span.appendChild(button);
    });
    return span;
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    head($$payload2, ($$payload3) => {
      $$payload3.out += `<script src="https://cdn.jsdelivr.net/npm/ag-grid-community/dist/ag-grid-community.min.js"><\/script><!---->`;
    });
    GridHeader($$payload2, { title: "Studies", objectType: "study" });
    $$payload2.out += `<!----> <div id="studyGrid"${attr_class(`${stringify(gridTheme)} ag-grid`)}></div> `;
    DeleteObjectDialog($$payload2, {
      objectType: "study",
      object: objectToDelete,
      get open() {
        return deleteDialogOpen;
      },
      set open($$value) {
        deleteDialogOpen = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!---->`;
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function Studies($$payload, $$props) {
  push();
  onMount(async () => {
  });
  $$payload.out += `<div class="crc-grid inside-root">`;
  StudyGrid($$payload);
  $$payload.out += `<!----></div>`;
  pop();
}
function _page($$payload, $$props) {
  push();
  Studies($$payload);
  pop();
}
export {
  _page as default
};
