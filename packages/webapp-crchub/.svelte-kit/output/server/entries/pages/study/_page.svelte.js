import { z as push, J as spread_props, B as pop, E as escape_html, G as attr_class, I as stringify, K as store_get, A as onMount, M as unsubscribe_stores, S as head, N as ensure_array_like, F as attr, T as onDestroy } from "../../../chunks/index.js";
import { P as Pencil, T as Tabs, p as page } from "../../../chunks/stores.js";
import "clsx";
import { a as FreLogger, W as WebappConfigurator, M as ModelManager } from "../../../chunks/model-manager.js";
import "../../../chunks/env.js";
import { I as Icon, g as getStatusColor, d as dataStore, b as getSVGIcon } from "../../../chunks/utils.js";
import { createGrid } from "ag-grid-community";
import "ag-grid-enterprise";
import { n as navigateTo, c as copy_payload, a as assign_payload, G as GridHeader, D as DeleteObjectDialog } from "../../../chunks/DeleteObjectDialog.js";
import { t as theme } from "../../../chunks/theme-store.js";
import { e as editObject } from "../../../chunks/object-drawer-store.js";
import "../../../chunks/Tooltip.svelte_svelte_type_style_lang.js";
import { P as Popover, X, s as setDrawerProps, e as setDrawerVisibility, f as getActiveDrawer, h as setActiveDrawer, S as Save } from "../../../chunks/side-drawer-store.js";
import { F as Fg } from "../../../chunks/index4.js";
import "mobx";
function Eye($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
      }
    ],
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "3" }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "eye" },
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
function Pencil_ruler($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13"
      }
    ],
    ["path", { "d": "m8 6 2-2" }],
    ["path", { "d": "m18 16 2-2" }],
    [
      "path",
      {
        "d": "m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17"
      }
    ],
    [
      "path",
      {
        "d": "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
      }
    ],
    ["path", { "d": "m15 5 4 4" }]
  ];
  Icon($$payload, spread_props([
    { name: "pencil-ruler" },
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
function Redo($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["path", { "d": "M21 7v6h-6" }],
    [
      "path",
      {
        "d": "M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "redo" },
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
function Undo($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["path", { "d": "M3 7v6h6" }],
    [
      "path",
      {
        "d": "M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "undo" },
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
function User($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
      }
    ],
    ["circle", { "cx": "12", "cy": "7", "r": "4" }]
  ];
  Icon($$payload, spread_props([
    { name: "user" },
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
function StudyCard($$payload, $$props) {
  push();
  const { study } = $$props;
  let statusColor = getStatusColor(study.status);
  $$payload.out += `<div class="card crc-card-area max-w-sm h-full"><div class="flex items-center justify-left mb-4"><h3 class="main-label-text mr-2">Study</h3> <button type="button" class="icon-button primary inverted">`;
  Pencil($$payload, {});
  $$payload.out += `<!----></button></div> <div class="space-y-4"><div><div class="small-label-text">Name</div> <p class="standard-text">${escape_html(study.name)}</p></div> <div><div class="small-label-text">Title</div> <p class="standard-text">${escape_html(study.title)}</p></div> <div><div class="small-label-text">Status</div> <span${attr_class(`badge ${stringify(statusColor)} text-xs`)}>${escape_html(study.status)}</span></div> <div><div class="small-label-text">Phase</div> <p class="standard-text">${escape_html(study.phase)}</p></div> <div><div class="small-label-text">Therapeutic Area</div> <p class="standard-text">${escape_html(study.therapeuticArea)}</p></div> <div><div class="small-label-text">Current Protocol</div> <p class="standard-text">${escape_html(study.currentProtocol)}</p></div></div></div>`;
  pop();
}
function PatientGrid($$payload, $$props) {
  push();
  var $$store_subs;
  const { studyId } = $$props;
  let deleteDialogOpen = false;
  let objectToDelete = null;
  let gridOptions;
  let gridApi;
  let patientsData = store_get($$store_subs ??= {}, "$dataStore", dataStore).studyPatients;
  let canManageStudies = true;
  let gridTheme = store_get($$store_subs ??= {}, "$theme", theme) === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz";
  function updateGridData() {
    if (gridApi && patientsData) {
      gridApi.setGridOption("rowData", patientsData);
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
          field: "patientNumber",
          headerName: "Number",
          cellRenderer: (params) => {
            return createNameCell(params);
          },
          // cellRenderer: (params: any) => {
          //     const patientId = params.data.id;
          //     const patientNumber = params.data.patientNumber;
          //     return `<a href="#" data-patient-id="${patientId}">${patientNumber}</a>`;
          // },
          filter: "agSetColumnFilter",
          filterParams: { excelMode: "mac" }
        },
        {
          field: "initials",
          headerName: "Initials",
          filter: "agSetColumnFilter",
          filterParams: { excelMode: "mac" }
        },
        {
          field: "dob",
          headerName: "YOB",
          filter: "agSetColumnFilter",
          filterParams: { excelMode: "mac" }
        },
        {
          field: "gender",
          enableRowGroup: true,
          filter: "agSetColumnFilter",
          filterParams: { excelMode: "mac" }
        }
      ],
      groupDisplayType: "groupRows",
      rowGroupPanelShow: "always",
      onGridReady: (params) => {
        if (patientsData.length > 0) {
          updateGridData();
        }
      }
    };
    const gridElement = document.querySelector("#patientGrid");
    gridApi = createGrid(gridElement, gridOptions);
    gridElement.addEventListener("click", (event) => {
      const target = event.target;
      if (target.tagName === "A") {
        event.preventDefault();
        const patientId = target.getAttribute("data-patient-id");
        if (patientId) {
          onOpenClick(patientId);
        }
      }
    });
  });
  function onOpenClick(patientId) {
    navigateTo("patient", patientId);
  }
  function onDeleteClick(patientId) {
    console.log("Delete clicked for patient:", patientId);
    objectToDelete = patientsData.find((p) => p.id === patientId);
    if (objectToDelete) {
      deleteDialogOpen = true;
    }
  }
  function onEditClick(patientId) {
    editObject("patient", patientId);
  }
  function createNameCell(params) {
    const name = `<a href="#" data-patient-id="${params.data.id}">${params.data.patientNumber}</a>`;
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
        level: "secondary",
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
    GridHeader($$payload2, {
      title: "Patients",
      objectType: "patient",
      parentId: studyId
    });
    $$payload2.out += `<!----> <div id="patientGrid"${attr_class(`${stringify(gridTheme)} ag-grid`)}></div> `;
    DeleteObjectDialog($$payload2, {
      objectType: "patient",
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
function DSLFooter($$payload, $$props) {
  push();
  const { onCheckboxChange, items: initialItems } = $$props;
  let items = [...initialItems];
  onMount(() => {
    items = [...initialItems];
    console.log("[DSLFooter] onMount items:", items);
  });
  let hiddenItems = items.filter((item) => !item.visible);
  console.log("[DSLFooter] $derived hiddenItems:", hiddenItems);
  function isParentVisible(id) {
    const index = items.findIndex((item) => item.id === id);
    let result = true;
    if (index !== -1) {
      const item = items[index];
      if (!item.parent) {
        result = true;
      } else {
        const parent = items.find((i) => i.id === item.parent);
        result = parent ? parent.visible : true;
      }
    }
    return result;
  }
  let openState = false;
  $$payload.out += `<div class="footer-container">`;
  {
    let trigger = function($$payload2) {
      $$payload2.out += `<button id="editoritems" type="button" class="btn btn-sm preset-filled editor-footer-button">`;
      Eye($$payload2, {});
      $$payload2.out += `<!----></button>`;
    }, content = function($$payload2) {
      const each_array = ensure_array_like(items);
      $$payload2.out += `<header class="flex justify-between"><span class="font-bold text-xl">Display Options</span> <button class="icon-button preset-filled hover:preset-tonal" type="button">`;
      X($$payload2, {});
      $$payload2.out += `<!----></button></header>  <div><!--[-->`;
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let item = each_array[$$index];
        $$payload2.out += `<div${attr_class(`flex items-center editor-display-options ${stringify(item.parent ? "ml-6" : "")}`)}><input${attr("id", item.id)} type="checkbox"${attr("checked", item.visible, true)} class="crc-checkbox form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out mr-2"${attr("disabled", !isParentVisible(item.id), true)}/> <label${attr("for", item.id)} class="select-none">${escape_html(item.label)}</label></div>`;
      }
      $$payload2.out += `<!--]--></div>`;
    };
    Popover($$payload, {
      open: openState,
      onOpenChange: (e) => openState = e.open,
      positioning: { placement: "top" },
      triggerBase: "btn btn-sm preset-filled editor-footer-button",
      contentBase: "card bg-surface-200-800 p-4 space-y-4 max-w-[320px] editor-display-options-popover w-40",
      arrow: true,
      arrowBackground: "!bg-surface-200 dark:!bg-surface-800",
      trigger,
      content,
      $$slots: { trigger: true, content: true }
    });
  }
  $$payload.out += `<!----> <span class="editor-footer-text flex-grow">${escape_html(hiddenItems.length > 0 ? `Hidden: ${hiddenItems.map((item) => item.label).join(", ")}` : "")}</span></div>`;
  pop();
}
new FreLogger("EditorRequestsHandler");
function Study($$payload, $$props) {
  push();
  let { id } = $$props;
  let study = void 0;
  let activeTab = "patients";
  let dslEditor = void 0;
  let unit = void 0;
  let footerItems = [
    {
      id: "showScheduling",
      label: "Scheduling",
      visible: true
    },
    {
      id: "showChecklists",
      label: "Checklists",
      visible: false
    },
    {
      id: "showReferences",
      label: "References",
      visible: false,
      parent: "showChecklists"
    },
    {
      id: "showSystems",
      label: "Systems",
      visible: false,
      parent: "showChecklists"
    },
    {
      id: "showPeople",
      label: "People",
      visible: false,
      parent: "showChecklists"
    },
    {
      id: "showDescriptions",
      label: "Descriptions",
      visible: false
    },
    {
      id: "showSharedTasks",
      label: "Shared Tasks",
      visible: false
    }
  ];
  onMount(async () => {
    study = await dataStore.getStudy(id);
    await dataStore.getStudyPatients(id);
    if (!study) {
      console.error(`Study with id ${id} not found`);
      return;
    }
    dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
    const result = await ModelManager.getInstance().openModelUnit(study.id, "StudyConfiguration");
    if (result !== void 0) {
      unit = result;
      setTimeout(
        () => {
        },
        3e3
      );
    } else {
      console.error("Failed to load study configuration");
    }
    footerItems = footerItems.map((item) => ({ ...item, visible: unit[item.id] }));
    setDrawerProps("dslErrors", { studyId: id });
    setDrawerVisibility("dslErrors", true);
    setDrawerProps("studyTimelineTable", { studyId: id });
    setDrawerVisibility("studyTimelineTable", true);
    setDrawerProps("studyTimelineChart", { studyId: id });
    setDrawerVisibility("studyTimelineChart", true);
  });
  onDestroy(() => {
    var activeDrawer = getActiveDrawer();
    if (activeDrawer === "studyTimelineTable" || activeDrawer === "studyTimelineChart" || activeDrawer === "dslErrors") {
      setActiveDrawer(null);
    }
    setDrawerVisibility("dslErrors", false);
    setDrawerVisibility("studyTimelineTable", false);
    setDrawerVisibility("studyTimelineChart", false);
  });
  function handleCheckboxChange(id2, visible) {
    if (id2 in unit) {
      unit[id2] = visible;
    }
  }
  if (study) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="crc-container"><div class="card-container">`;
    StudyCard($$payload, { study });
    $$payload.out += `<!----></div> <div class="crc-content">`;
    {
      let list = function($$payload2) {
        $$payload2.out += `<!---->`;
        Tabs.Control($$payload2, {
          value: "patients",
          children: ($$payload3) => {
            $$payload3.out += `<div class="tab-item">`;
            User($$payload3, { size: "16" });
            $$payload3.out += `<!---->Patients</div>`;
          },
          $$slots: { default: true }
        });
        $$payload2.out += `<!----> <!---->`;
        Tabs.Control($$payload2, {
          value: "design",
          children: ($$payload3) => {
            $$payload3.out += `<div class="tab-item">`;
            Pencil_ruler($$payload3, { size: "16" });
            $$payload3.out += `<!---->Study Design</div>`;
          },
          $$slots: { default: true }
        });
        $$payload2.out += `<!---->`;
      }, content = function($$payload2) {
        $$payload2.out += `<!---->`;
        Tabs.Panel($$payload2, {
          value: "patients",
          children: ($$payload3) => {
            $$payload3.out += `<div class="crc-grid inside-tab">`;
            PatientGrid($$payload3, { studyId: study.id });
            $$payload3.out += `<!----></div>`;
          },
          $$slots: { default: true }
        });
        $$payload2.out += `<!----> <!---->`;
        Tabs.Panel($$payload2, {
          value: "design",
          children: ($$payload3) => {
            $$payload3.out += `<div class="flex gap-2"><button type="button" class="icon-button primary inverted">`;
            Save($$payload3, {});
            $$payload3.out += `<!----></button> <button type="button" class="icon-button primary inverted">`;
            Undo($$payload3, {});
            $$payload3.out += `<!----></button> <button type="button" class="icon-button primary inverted">`;
            Redo($$payload3, {});
            $$payload3.out += `<!----></button></div> <div class="crc-editor crc-content-width">`;
            Fg($$payload3, { editor: dslEditor });
            $$payload3.out += `<!----></div> <div class="crc-editor-footer h-8 crc-content-width">`;
            DSLFooter($$payload3, {
              items: footerItems,
              onCheckboxChange: handleCheckboxChange
            });
            $$payload3.out += `<!----></div>`;
          },
          $$slots: { default: true }
        });
        $$payload2.out += `<!---->`;
      };
      Tabs($$payload, {
        value: activeTab,
        onValueChange: (e) => activeTab = e.value,
        listGap: "gap-6",
        base: "mt-4",
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
  Study($$payload, { id });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
