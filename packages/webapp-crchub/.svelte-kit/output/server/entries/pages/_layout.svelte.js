import { z as push, F as spread_props, B as pop, G as store_get, I as unsubscribe_stores, E as escape_html, J as attr, K as ensure_array_like, M as attr_class, N as stringify, O as maybe_selected, P as createEventDispatcher, Q as attr_style, R as bind_props, S as head, A as onMount } from "../../chunks/index.js";
import { w as writable, g as get } from "../../chunks/index3.js";
import { L as LoginPart, i as isAuthenticated } from "../../chunks/LoginPart.js";
import { I as Icon, u as userStore, g as getStatusColor, d as dataStore } from "../../chunks/utils.js";
import { t as theme } from "../../chunks/theme-store.js";
import "../../chunks/Tooltip.svelte_svelte_type_style_lang.js";
import { A as AppBar, P as Popover, S as Save, X, g as getDrawerWidth, a as getDrawerOrder, b as getDrawer, d as drawerStore, c as addDrawer } from "../../chunks/side-drawer-store.js";
import "../../chunks/client.js";
import "clsx";
import { o as objectDrawerStore, c as closeObjectDrawer } from "../../chunks/object-drawer-store.js";
import { r as rv, R as RtString, t as tv, N as NN, L as LOe, H as Hd, M as ModelManager } from "../../chunks/model-manager.js";
import { h as html } from "../../chunks/html.js";
import { marked } from "marked";
const ROUTE = Object.freeze({
  HOME: "home",
  LOGIN: "login",
  PATIENTS: "patients",
  STUDIES: "studies",
  AVAILABILITY: "availability",
  STUDY: "study",
  PATIENT: "patient"
});
[
  ROUTE.LOGIN,
  ROUTE.HOME,
  ROUTE.PATIENTS,
  ROUTE.STUDIES,
  ROUTE.AVAILABILITY,
  ROUTE.STUDY,
  ROUTE.PATIENT
];
[
  ROUTE.PATIENT,
  ROUTE.STUDY
];
const LABEL = {
  HOME: "Home",
  PATIENTS: "Patients",
  STUDIES: "Studies",
  STUDY: "Study",
  PATIENT: "Patient",
  AVAILABILITY: "Availability"
};
function Arrow_up_right($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["path", { "d": "M7 7h10v10" }],
    ["path", { "d": "M7 17 17 7" }]
  ];
  Icon($$payload, spread_props([
    { name: "arrow-up-right" },
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
function Chevron_right($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [["path", { "d": "m9 18 6-6-6-6" }]];
  Icon($$payload, spread_props([
    { name: "chevron-right" },
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
function Grip_vertical($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["circle", { "cx": "9", "cy": "12", "r": "1" }],
    ["circle", { "cx": "9", "cy": "5", "r": "1" }],
    ["circle", { "cx": "9", "cy": "19", "r": "1" }],
    [
      "circle",
      { "cx": "15", "cy": "12", "r": "1" }
    ],
    ["circle", { "cx": "15", "cy": "5", "r": "1" }],
    [
      "circle",
      { "cx": "15", "cy": "19", "r": "1" }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "grip-vertical" },
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
function Heart($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "heart" },
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
function House($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
      }
    ],
    [
      "path",
      {
        "d": "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "house" },
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
function Info($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "10" }
    ],
    ["path", { "d": "M12 16v-4" }],
    ["path", { "d": "M12 8h.01" }]
  ];
  Icon($$payload, spread_props([
    { name: "info" },
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
function Moon($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      { "d": "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "moon" },
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
function Refresh_cw($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
      }
    ],
    ["path", { "d": "M21 3v5h-5" }],
    [
      "path",
      {
        "d": "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
      }
    ],
    ["path", { "d": "M8 16H3v5" }]
  ];
  Icon($$payload, spread_props([
    { name: "refresh-cw" },
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
function Square_chart_gantt($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "rect",
      {
        "width": "18",
        "height": "18",
        "x": "3",
        "y": "3",
        "rx": "2"
      }
    ],
    ["path", { "d": "M9 8h7" }],
    ["path", { "d": "M8 12h6" }],
    ["path", { "d": "M11 16h5" }]
  ];
  Icon($$payload, spread_props([
    { name: "square-chart-gantt" },
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
function Sun($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "4" }
    ],
    ["path", { "d": "M12 2v2" }],
    ["path", { "d": "M12 20v2" }],
    ["path", { "d": "m4.93 4.93 1.41 1.41" }],
    ["path", { "d": "m17.66 17.66 1.41 1.41" }],
    ["path", { "d": "M2 12h2" }],
    ["path", { "d": "M20 12h2" }],
    ["path", { "d": "m6.34 17.66-1.41 1.41" }],
    ["path", { "d": "m19.07 4.93-1.41 1.41" }]
  ];
  Icon($$payload, spread_props([
    { name: "sun" },
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
function Table_2($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"
      }
    ]
  ];
  Icon($$payload, spread_props([
    { name: "table-2" },
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
function Triangle_alert($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
      }
    ],
    ["path", { "d": "M12 9v4" }],
    ["path", { "d": "M12 17h.01" }]
  ];
  Icon($$payload, spread_props([
    { name: "triangle-alert" },
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
function NavBar($$payload, $$props) {
  push();
  var $$store_subs;
  let user = null;
  userStore.subscribe((value) => {
    user = value;
  });
  let isDark = store_get($$store_subs ??= {}, "$theme", theme) === "dark";
  let userInitials = user ? user.name.split(" ").map((n) => n[0]).join("") : "";
  let popoverOpen = false;
  {
    let lead = function($$payload2) {
      $$payload2.out += `<div id="navbar-logo" class="flex items-center"><img src="/images/logo_grey.svg" class="me-1 h-6 sm:h-8" alt="CRCHub Logo"/> <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white"><span class="crc-logo-p1">CRC</span><span class="crc-logo-p2">Hub</span></span></div> <div class="navbar-commands"><button type="button">${escape_html(LABEL.HOME)}</button> <button type="button">${escape_html(LABEL.STUDIES)}</button> <button type="button">${escape_html(LABEL.AVAILABILITY)}</button></div>`;
    }, trail = function($$payload2) {
      $$payload2.out += `<div class="flex items-center"><button class="icon-button btn-toggle-theme"${attr("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode")}>`;
      if (isDark) {
        $$payload2.out += "<!--[-->";
        Sun($$payload2, { size: 20 });
      } else {
        $$payload2.out += "<!--[!-->";
        Moon($$payload2, { size: 20 });
      }
      $$payload2.out += `<!--]--></button></div> `;
      {
        let trigger = function($$payload3) {
          $$payload3.out += `<div class="icon-button btn-user">${escape_html(userInitials)}</div>`;
        }, content = function($$payload3) {
          $$payload3.out += `<header class="flex justify-between items-center mb-2"><div><span class="block text-xs">${escape_html(user ? user.name : "Unknown")}</span> <span class="block truncate text-xs">${escape_html(user ? user.email : "Unknown")}</span></div></header> <div class="user-menu"><button class="px-2 py-1" tabindex="0">Profile</button> <button class="px-2 py-1" tabindex="0">Settings</button> <hr class="my-2"/> <button class="px-2 py-1" tabindex="0">Sign out</button></div>`;
        };
        Popover($$payload2, {
          zIndex: "900",
          open: popoverOpen,
          onOpenChange: (e) => popoverOpen = e.open,
          positioning: { placement: "bottom" },
          triggerBase: "p-0 popover-trigger shadow-none",
          contentBase: "popover-content card p-4 max-w-[400px]",
          trigger,
          content,
          $$slots: { trigger: true, content: true }
        });
      }
      $$payload2.out += `<!---->`;
    };
    AppBar($$payload, {
      lead,
      trail,
      $$slots: { lead: true, trail: true }
    });
  }
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
const breadcrumbStore = writable([]);
function Breadcrumb($$payload, $$props) {
  push();
  var $$store_subs;
  let items = store_get($$store_subs ??= {}, "$breadcrumbStore", breadcrumbStore);
  const each_array = ensure_array_like(items);
  $$payload.out += `<ol class="breadcrumb" aria-label="breadcrumb"><li><a class="opacity-90 hover:underline" href="/">`;
  House($$payload, { size: 16 });
  $$payload.out += `<!---->${escape_html(LABEL.HOME)}</a></li> <!--[-->`;
  for (let i = 0, $$length = each_array.length; i < $$length; i++) {
    let { label, href } = each_array[i];
    $$payload.out += `<li class="opacity-50" aria-hidden="true">`;
    Chevron_right($$payload, { size: 16 });
    $$payload.out += `<!----></li> `;
    if (href) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<li><a class="opacity-60 hover:underline"${attr("href", href)}>${escape_html(label)}</a></li>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<li>${escape_html(label)}</li>`;
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></ol>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function StudyMutation($$payload, $$props) {
  push();
  const { study, action, onsave, onclose } = $$props;
  let mutatedStudy = { ...study };
  let rows = 6;
  getStatusColor(mutatedStudy.status);
  function getErrorState(field) {
    return errorState[field] ? "error" : "";
  }
  const errors = { name: "" };
  const errorState = { ...errors };
  let hasErrors = Object.values(errorState).some((error) => error !== "");
  $$payload.out += `<div class="mutation-area max-w-sm"><div class="space-y-4"><div><div class="small-label-text">Name `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <input${attr_class(`input-field ${stringify(getErrorState("name"))}`)} type="text"${attr("value", mutatedStudy.name)}/></div> <div><div class="small-label-text">Title</div> <textarea class="textarea-field min-h-[5rem]"${attr("rows", rows)}>`;
  const $$body = escape_html(mutatedStudy.title);
  if ($$body) {
    $$payload.out += `${$$body}`;
  }
  $$payload.out += `</textarea></div> <div><div class="small-label-text">Status</div> <select class="select-field">`;
  $$payload.select_value = mutatedStudy.status;
  $$payload.out += `<option value="Planning"${maybe_selected($$payload, "Planning")}>Planning</option><option value="Active"${maybe_selected($$payload, "Active")}>Active</option><option value="Completed"${maybe_selected($$payload, "Completed")}>Completed</option><option value="Suspended"${maybe_selected($$payload, "Suspended")}>Suspended</option><option value="Withdrawn"${maybe_selected($$payload, "Withdrawn")}>Withdrawn</option>`;
  $$payload.select_value = void 0;
  $$payload.out += `</select></div> <div><div class="small-label-text">Phase</div> <input class="input-field" type="text"${attr("value", mutatedStudy.phase)}/></div> <div><div class="small-label-text">Therapeutic Area</div> <input class="input-field" type="text"${attr("value", mutatedStudy.therapeuticArea)}/></div> <div><div class="small-label-text">Current Protocol</div> <input class="input-field" type="text"${attr("value", mutatedStudy.currentProtocol)}/></div></div> <div class="flex items-center justify-center mt-8"><button class="standard-button primary"${attr("disabled", hasErrors, true)}>`;
  Save($$payload, { size: "16" });
  $$payload.out += `<!---->Save</button> <button class="standard-button secondary">`;
  X($$payload, { size: "16" });
  $$payload.out += `<!---->Cancel</button></div></div>`;
  pop();
}
function PatientMutation($$payload, $$props) {
  push();
  const { study, patient, action } = $$props;
  let mutatedPatient = { ...patient };
  createEventDispatcher();
  function getInputClass(field) {
    return errorState[field] ? "error" : "";
  }
  let errors = { patientNumber: "" };
  let errorState = { ...errors };
  let hasErrors = Object.values(errorState).some((error) => error !== "");
  $$payload.out += `<div class="card crc-mutation-area max-w-sm"><div class="space-y-2"><div><h4 class="card-label-text">Patient Number</h4> <input type="text"${attr("value", mutatedPatient.patientNumber)}${attr_class(`crc-field ${stringify(getInputClass("patientNumber"))}`)}/></div> <div><h4 class="card-label-text">Initials</h4> <input type="text"${attr("value", mutatedPatient.initials)} class="crc-field"/></div> <div><h4 class="card-label-text">YOB</h4> <input type="number"${attr("value", mutatedPatient.dob)} min="1924"${attr("max", (/* @__PURE__ */ new Date()).getFullYear())} class="crc-field"/></div> <div><h4 class="card-label-text">Gender</h4> <select class="select crc-field">`;
  $$payload.select_value = mutatedPatient.gender;
  $$payload.out += `<option value="Male"${maybe_selected($$payload, "Male")}>Male</option><option value="Female"${maybe_selected($$payload, "Female")}>Female</option><option value="Other"${maybe_selected($$payload, "Other")}>Other</option>`;
  $$payload.select_value = void 0;
  $$payload.out += `</select></div></div> <div class="flex items-center justify-center mt-4"><button class="btn btn-sm preset-filled primary-button mr-2"${attr("disabled", hasErrors, true)}>`;
  Save($$payload, {});
  $$payload.out += `<!---->Save</button> <button class="btn btn-sm preset-filled secondary-button">`;
  X($$payload, {});
  $$payload.out += `<!---->Cancel</button></div></div>`;
  pop();
}
function ObjectDrawerSystem($$payload, $$props) {
  push();
  var $$store_subs;
  let openState = store_get($$store_subs ??= {}, "$objectDrawerStore", objectDrawerStore).open;
  let type = store_get($$store_subs ??= {}, "$objectDrawerStore", objectDrawerStore).type;
  let action = store_get($$store_subs ??= {}, "$objectDrawerStore", objectDrawerStore).action;
  let data = store_get($$store_subs ??= {}, "$objectDrawerStore", objectDrawerStore).data;
  function handleClose() {
    console.log("[ObjectDrawerSystem] handleClose called");
    closeObjectDrawer();
  }
  {
    let content = function($$payload2) {
      $$payload2.out += `<header class="drawer-header"><div class="drawer-title-container"><h2>${escape_html(action === "add" ? "Add" : "Edit")} ${escape_html(type === "study" ? "Study" : type === "patient" ? "Patient" : "")}</h2></div> <button class="icon-button drawer-header-button">`;
      X($$payload2, { size: "16" });
      $$payload2.out += `<!----></button></header> <div class="drawer-content">`;
      if (type === "study") {
        $$payload2.out += "<!--[-->";
        StudyMutation($$payload2, {
          study: data,
          action,
          onsave: (study) => {
            handleClose();
          },
          onclose: () => {
            handleClose();
          }
        });
      } else if (type === "patient") {
        $$payload2.out += "<!--[1-->";
        PatientMutation($$payload2, {
          patient: data,
          action,
          onsave: (patient) => {
            handleClose();
          },
          onclose: () => {
            handleClose();
          }
        });
      } else {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--></div>`;
    };
    Popover($$payload, {
      open: openState,
      onOpenChange: (e) => e.open ? null : handleClose(),
      positioning: {
        placement: "left",
        strategy: "fixed",
        offset: { mainAxis: 0, crossAxis: 0 },
        gutter: 0
      },
      zIndex: "50",
      contentBackground: "object-drawer",
      contentBase: "fixed inset-y-0 left-0 w-full max-w-md shadow-xl transition-transform duration-200 transform-gpu translate-x-0",
      triggerBase: "",
      content,
      $$slots: { content: true }
    });
  }
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function SideDrawerSystem($$payload, $$props) {
  push();
  var $$store_subs;
  let { isOpen = false } = $$props;
  let activeDrawer = store_get($$store_subs ??= {}, "$drawerStore", drawerStore).activeDrawer;
  let drawerWidth = activeDrawer ? getDrawerWidth(activeDrawer) : 400;
  getDrawerOrder();
  let drawers = store_get($$store_subs ??= {}, "$drawerStore", drawerStore).drawerOrder.map((key) => store_get($$store_subs ??= {}, "$drawerStore", drawerStore).drawers[key]).filter(Boolean);
  createEventDispatcher();
  const each_array = ensure_array_like(drawers);
  $$payload.out += `<div${attr_class("drawer-system", void 0, { "open": isOpen })}><div class="drawer-buttons"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let drawer = each_array[$$index];
    if (drawer.isVisible) {
      $$payload.out += "<!--[-->";
      const Icon2 = drawer.icon;
      $$payload.out += `<button${attr("id", drawer.key)} class="icon-button toolbar-button"><!---->`;
      Icon2($$payload, { size: 20 });
      $$payload.out += `<!----></button>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></div> `;
  if (isOpen && activeDrawer) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="drawer-content-wrapper"${attr_style(`width: ${stringify(drawerWidth)}px`)}><div class="resize-handle" role="button" tabindex="0">`;
    Grip_vertical($$payload, {});
    $$payload.out += `<!----></div> <div class="drawer-content"><div class="drawer-header"><div class="drawer-title-container"><h2>${escape_html(getDrawer(activeDrawer)?.title ?? "")}</h2> `;
    if (getDrawer(activeDrawer)?.supportsRefresh) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<button class="icon-button drawer-header-button">`;
      Refresh_cw($$payload, { size: 16 });
      $$payload.out += `<!----></button>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div> <button class="icon-button drawer-header-button">`;
    X($$payload, { size: 16 });
    $$payload.out += `<!----></button></div> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function FavoritesDrawer($$payload, $$props) {
  push();
  const dispatch = createEventDispatcher();
  function refresh() {
    dispatch("refresh");
    console.log("refresh favorites");
  }
  $$payload.out += `<div class="drawer-content-area"></div>`;
  bind_props($$props, { refresh });
  pop();
}
function getTimelineTable(node) {
  let timeline = getTimeline(node);
  const tableHTML = rv.getTimeLineTableAndStyles(timeline);
  const html2 = `<div class="limited-width-container">${tableHTML}</div>`;
  return new RtString(html2);
}
function getTimelineChart(node) {
  let timeline = getTimeline(node);
  const timelineDataAsScript = tv.getTimelineDataHTML(timeline);
  const timelineVisualizationHTML = tv.getTimelineVisualizationHTML(timeline);
  const chartHTML = tv.getTimelineAsHTMLBlock(timelineDataAsScript + timelineVisualizationHTML);
  const html2 = `<div class="limited-width-container">${chartHTML}</div>`;
  return new RtString(html2);
}
function getTimeline(node) {
  var simulator;
  new NN();
  let studyConfigurationUnit = node;
  simulator = new LOe(studyConfigurationUnit);
  simulator.run();
  let timeline = simulator.timeline;
  return timeline;
}
function getChecklistAsMarkdown(studyConfigurationUnit) {
  let timeline = getTimeline(studyConfigurationUnit);
  const studyChecklistAsMarkdown = Hd.getStudyChecklistAsMarkdown(studyConfigurationUnit, timeline);
  const html2 = `<div class="limited-width-container">${studyChecklistAsMarkdown}</div>`;
  return html2;
}
function StudyTimelineChartDrawer($$payload, $$props) {
  push();
  let { studyId } = $$props;
  let isLoading = true;
  let showChart = false;
  let chartHtml = "";
  const dispatch = createEventDispatcher();
  function refresh() {
    dispatch("refresh");
    loadChart(studyId);
  }
  async function loadChart(id) {
    isLoading = true;
    showChart = false;
    try {
      const startTime = Date.now();
      chartHtml = getChart(studyId);
      await new Promise((resolve) => setTimeout(() => resolve(null), 0));
      await loadChartData();
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 5e3) {
        await new Promise((resolve) => setTimeout(resolve, 5e3 - elapsedTime));
      }
      showChart = true;
    } catch (err) {
      console.error(`Error fetching chart data for study: ${id}`, err);
      err instanceof Error ? err.message : "An error occurred while fetching chart data";
    } finally {
      isLoading = false;
    }
  }
  function getChart(id) {
    const model = ModelManager.getInstance().openModel(id);
    const unit = model.configuration;
    const rtObject = getTimelineChart(unit);
    return rtObject.asString();
  }
  async function loadChartData() {
    return new Promise((resolve) => {
      const link = document.createElement("link");
      link.href = "https://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css";
      link.rel = "stylesheet";
      document.head.appendChild(link);
      const script = document.createElement("script");
      script.src = "https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js";
      script.onload = () => {
        resolve();
      };
      document.body.appendChild(script);
    });
  }
  head($$payload, ($$payload2) => {
    $$payload2.out += `<script src="https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js"><\/script> <link href="https://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css" rel="stylesheet" type="text/css"/>`;
  });
  $$payload.out += `<div class="drawer-content-area p-2"><div${attr_style(`display: ${stringify(isLoading || !showChart ? "block" : "none")}`)}><div class="placeholder animate-pulse mb-4"></div></div> <div${attr_style(`display: ${stringify(!isLoading && showChart ? "block" : "none")}`)}><div>${html(chartHtml)}</div></div></div>`;
  bind_props($$props, { refresh });
  pop();
}
function StudyTimelineTableDrawer($$payload, $$props) {
  push();
  let { studyId } = $$props;
  let isLoading = true;
  let tableHtml = "";
  let checklistHtml = "";
  let showTable = false;
  const dispatch = createEventDispatcher();
  function refresh() {
    dispatch("refresh");
    loadTable(studyId);
    loadChecklistAsMarkdown(studyId);
  }
  async function loadChecklistAsMarkdown(id) {
    console.log("loadChecklistAsMarkdown: ", id);
    const model = ModelManager.getInstance().openModel(id);
    const unit = model.configuration;
    const checklistAsMarkdown = getChecklistAsMarkdown(unit);
    const htmlContent = marked(checklistAsMarkdown);
    console.log("htmlContent: ", htmlContent);
    checklistHtml = `<div class="limited-width-container">${htmlContent}</div>`;
  }
  async function loadTable(id) {
    console.log("loadTable: ", id);
    isLoading = true;
    showTable = false;
    try {
      const startTime = Date.now();
      tableHtml = loadTableData(studyId);
      await new Promise((resolve) => setTimeout(() => resolve(null), 0));
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 2e3) {
        await new Promise((resolve) => setTimeout(resolve, 2e3 - elapsedTime));
      }
      showTable = true;
    } catch (err) {
      console.error(`Error fetching chart data for study: ${id}`, err);
      err instanceof Error ? err.message : "An error occurred while fetching chart data";
    } finally {
      isLoading = false;
    }
  }
  function loadTableData(id) {
    const model = ModelManager.getInstance().openModel(id);
    const unit = model.configuration;
    const rtObject = getTimelineTable(unit);
    return rtObject.asString();
  }
  $$payload.out += `<div class="drawer-content-area p-2"><div${attr_style(`display: ${stringify(isLoading || !showTable ? "block" : "none")}`)}><div class="placeholder animate-pulse mb-4"></div></div> <div${attr_style(`display: ${stringify(!isLoading && showTable ? "block" : "none")}`)}><div>${html(tableHtml)}</div></div> <div style="display: block" class="markdown-body svelte-110fhye"><div>${html(checklistHtml)}</div></div></div>`;
  bind_props($$props, { refresh });
  pop();
}
function DSLErrorsDrawer($$payload, $$props) {
  push();
  const dispatch = createEventDispatcher();
  let modelErrors = [];
  onMount(() => {
    modelErrors = ModelManager.getInstance().runValidator();
    console.log("[DSLErrorsDrawer] onMount modelErrors:", modelErrors.length);
  });
  function refresh() {
    modelErrors = ModelManager.getInstance().runValidator();
    dispatch("refresh");
    console.log("DSLErrorsDrawer refresh errors", modelErrors.length);
  }
  const each_array = ensure_array_like(modelErrors);
  $$payload.out += `<div class="drawer-content-area"><div class="table-wrap"><table class="table table-hover table-striped"><thead><tr><th class="bg-surface-500-900">Message</th><th class="bg-surface-500-900">Severity</th></tr></thead><tbody><!--[-->`;
  for (let index = 0, $$length = each_array.length; index < $$length; index++) {
    let error = each_array[index];
    $$payload.out += `<tr class="hover:bg-surface-500-900/50"><td><div class="flex items-center gap-2"><button type="button" class="icon-button btn-sm">`;
    Arrow_up_right($$payload, {});
    $$payload.out += `<!----></button> <span>${escape_html(error.message)}</span></div></td><td>${escape_html(error.severity)}</td></tr>`;
  }
  $$payload.out += `<!--]--></tbody></table></div></div>`;
  bind_props($$props, { refresh });
  pop();
}
function HelpDrawer($$payload, $$props) {
  push();
  let helpHtml = "";
  let container;
  let shadowRoot;
  const dispatch = createEventDispatcher();
  onMount(async () => {
    try {
      const response = await fetch("/help/help.html");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      helpHtml = await response.text();
    } catch (error) {
      console.error("Failed to load help content:", error);
      helpHtml = "<p>Failed to load help content. Please try again later.</p>";
    }
    shadowRoot = container.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = helpHtml;
    shadowRoot.addEventListener("click", (event) => {
      if (event instanceof MouseEvent) {
        handleAnchorClick(event);
      }
    });
  });
  function refresh() {
    dispatch("refresh");
    console.log("refresh help");
  }
  function handleAnchorClick(event) {
    const target = event.target;
    const anchorElement = target.closest("a");
    if (anchorElement instanceof HTMLAnchorElement) {
      const href = anchorElement.getAttribute("href");
      if (href?.startsWith("#")) {
        event.preventDefault();
        const id = href.slice(1);
        const element = shadowRoot.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }
  $$payload.out += `<div class="drawer-content-area help-drawer"><div></div></div>`;
  bind_props($$props, { refresh });
  pop();
}
function _layout($$payload, $$props) {
  push();
  var $$store_subs;
  let auth = store_get($$store_subs ??= {}, "$isAuthenticated", isAuthenticated);
  let { children } = $$props;
  onMount(() => {
    auth = sessionStorage.getItem("auth") === "true";
    isAuthenticated.set(auth);
    if (auth) {
      userStore.initializeFromStorage();
      dataStore.initializeDatastore();
      addDrawer({
        key: "help",
        icon: Info,
        component: HelpDrawer,
        title: "Help",
        description: "Help for application.",
        supportsRefresh: false,
        defaultWidth: 900
      });
      addDrawer({
        key: "favorites",
        icon: Heart,
        component: FavoritesDrawer,
        title: "Favorites",
        description: "Manage your favorite studies, patients, and tasks.",
        supportsRefresh: true,
        defaultWidth: 400
      });
      addDrawer({
        key: "dslErrors",
        icon: Triangle_alert,
        component: DSLErrorsDrawer,
        title: "Errors",
        description: "View the errors in the study design.",
        supportsRefresh: true,
        defaultWidth: 800
      });
      addDrawer({
        key: "studyTimelineTable",
        icon: Square_chart_gantt,
        component: StudyTimelineTableDrawer,
        title: "Study Timeline Table",
        description: "View the timeline as a table for this study.",
        supportsRefresh: true,
        defaultWidth: 600
      });
      addDrawer({
        key: "studyTimelineChart",
        icon: Table_2,
        component: StudyTimelineChartDrawer,
        title: "Study Timeline Chart",
        description: "View the timeline as a chart for this study.",
        supportsRefresh: true,
        defaultWidth: 800
      });
      console.log("All drawers after registration:", get(drawerStore).drawers);
    }
  });
  head($$payload, ($$payload2) => {
    $$payload2.out += `<link rel="stylesheet"${attr("href", `/styles/bundle-${stringify(store_get($$store_subs ??= {}, "$theme", theme))}.css`)}/>`;
  });
  if (auth) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div id="app-container"><appbar>`;
    NavBar($$payload);
    $$payload.out += `<!----></appbar> <div id="content-container">`;
    Breadcrumb($$payload);
    $$payload.out += `<!----> `;
    children($$payload);
    $$payload.out += `<!----> `;
    ObjectDrawerSystem($$payload);
    $$payload.out += `<!----> `;
    SideDrawerSystem($$payload, {});
    $$payload.out += `<!----></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="login-page"><div class="login-container">`;
    LoginPart($$payload);
    $$payload.out += `<!----></div></div>`;
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _layout as default
};
