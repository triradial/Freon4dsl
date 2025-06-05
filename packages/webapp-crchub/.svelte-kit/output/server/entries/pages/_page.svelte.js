import { P as store_get, K as escape_html, S as unsubscribe_stores, I as pop, F as push, V as createEventDispatcher, R as slot, W as ensure_array_like, X as attr_class, Y as attr_style, U as stringify, Z as bind_props, Q as head, G as onMount, _ as onDestroy, $ as setContext, a0 as await_block } from "../../chunks/environment.js";
import { u as userStore, d as dataStore } from "../../chunks/data-store.js";
import { g as getDrawerWidth, a as getDrawer, d as drawerStore, n as navigateTo, G as GridHeader, D as DeleteObjectDialog, P as PatientGrid, F as FreonComponent, c as currentRoute, b as addDrawer, s as setDrawerVisibility, S as Study } from "../../chunks/Study.js";
import { Navbar, NavBrand, NavUl, NavLi, Button, Avatar, Dropdown, DropdownHeader, DropdownItem, DropdownDivider, BreadcrumbItem, Breadcrumb, ListPlaceholder, Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, Drawer } from "flowbite-svelte";
import { F as FontAwesomeIcon, r as rv, R as RtString, t as tv, N as NN, L as LOe, H as Hd, M as ModelManager, W as WebappConfigurator } from "../../chunks/FontAwesomeIcon.js";
import { faSun, faMoon, faGripLinesVertical, faRotateRight, faTimes, faSquareUpRight, faInfoCircle, faHeart, faTriangleExclamation, faTableList, faTimeline } from "@fortawesome/free-solid-svg-icons";
import "../../chunks/auth.js";
import "clsx";
import "../../chunks/client.js";
import { t as theme } from "../../chunks/theme-store.js";
import { h as html, P as Patient } from "../../chunks/Patient.js";
import { marked } from "marked";
import { d as drawerStore$1, g as getSVGIcon, e as editObject, a as addObject } from "../../chunks/object-drawer-store.js";
import { createGrid } from "ag-grid-community";
import "ag-grid-enterprise";
import "@fortawesome/fontawesome-svg-core";
import { c as copy_payload, a as assign_payload } from "../../chunks/payload.js";
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
function NavBar($$payload, $$props) {
  push();
  var $$store_subs;
  let user = null;
  userStore.subscribe((value) => {
    user = value;
  });
  let isDark = store_get($$store_subs ??= {}, "$theme", theme) === "dark";
  let icon = isDark ? faSun : faMoon;
  let userInitials = user ? user.name.split(" ").map((n) => n[0]).join("") : "";
  Navbar($$payload, {
    class: "navbar-component",
    children: ($$payload2) => {
      NavBrand($$payload2, {
        href: "/",
        children: ($$payload3) => {
          $$payload3.out += `<img src="/assets/images/logo_grey.svg" class="me-1 h-6 sm:h-8" alt="CRCHub Logo"/> <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white"><span class="crc-logo-p1">CRC</span><span class="crc-logo-p2">Hub</span></span>`;
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!----> `;
      NavUl($$payload2, {
        ulClass: "!bg-transparent flex flex-row items-center space-x-4",
        divClass: "md:block md:w-auto shocking !w-auto",
        class: "navbar-commands border-none",
        hidden: false,
        children: ($$payload3) => {
          NavLi($$payload3, {
            href: "#",
            children: ($$payload4) => {
              $$payload4.out += `<!---->${escape_html(LABEL.HOME)}`;
            },
            $$slots: { default: true }
          });
          $$payload3.out += `<!----> `;
          NavLi($$payload3, {
            href: "#",
            children: ($$payload4) => {
              $$payload4.out += `<!---->${escape_html(LABEL.STUDIES)}`;
            },
            $$slots: { default: true }
          });
          $$payload3.out += `<!----> `;
          NavLi($$payload3, {
            href: "#",
            children: ($$payload4) => {
              $$payload4.out += `<!---->${escape_html(LABEL.AVAILABILITY)}`;
            },
            $$slots: { default: true }
          });
          $$payload3.out += `<!---->`;
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!----> <div class="grow"></div> <div class="flex items-center gap-2 mr-2">`;
      Button($$payload2, {
        pill: true,
        outline: true,
        class: "navbar-button",
        size: "md",
        children: ($$payload3) => {
          $$payload3.out += `<!---->`;
          {
            FontAwesomeIcon($$payload3, { icon });
          }
          $$payload3.out += `<!---->`;
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!----></div> <div class="flex items-center md:order-2">`;
      Avatar($$payload2, {
        id: "avatar",
        border: true,
        size: "sm",
        class: "cursor-pointer",
        children: ($$payload3) => {
          $$payload3.out += `<!---->${escape_html(userInitials)}`;
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!----></div> `;
      Dropdown($$payload2, {
        class: "avatar-menu",
        placement: "bottom",
        triggeredBy: "#avatar",
        children: ($$payload3) => {
          DropdownHeader($$payload3, {
            children: ($$payload4) => {
              $$payload4.out += `<span class="block text-sm">${escape_html(user ? user.name : "Unknown")}</span> <span class="block truncate text-sm font-medium">${escape_html(user ? user.email : "Unknown")}</span>`;
            },
            $$slots: { default: true }
          });
          $$payload3.out += `<!----> `;
          DropdownItem($$payload3, {
            children: ($$payload4) => {
              $$payload4.out += `<!---->Profile`;
            },
            $$slots: { default: true }
          });
          $$payload3.out += `<!----> `;
          DropdownItem($$payload3, {
            children: ($$payload4) => {
              $$payload4.out += `<!---->Settings`;
            },
            $$slots: { default: true }
          });
          $$payload3.out += `<!----> `;
          DropdownDivider($$payload3, {});
          $$payload3.out += `<!----> `;
          DropdownItem($$payload3, {
            children: ($$payload4) => {
              $$payload4.out += `<!---->Sign out`;
            },
            $$slots: { default: true }
          });
          $$payload3.out += `<!---->`;
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!---->`;
    },
    $$slots: { default: true }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function CustomBreadcrumbItem($$payload, $$props) {
  push();
  const { href = "#", home = false } = $$props;
  createEventDispatcher();
  $$payload.out += `<span class="h-full inline-flex items-center" role="button" tabindex="0">`;
  BreadcrumbItem($$payload, {
    href,
    home,
    children: ($$payload2) => {
      $$payload2.out += `<!---->`;
      slot($$payload2, $$props, "default", {});
      $$payload2.out += `<!---->`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></span>`;
  pop();
}
function Breadcrumb_1($$payload, $$props) {
  push();
  let { items = [] } = $$props;
  Breadcrumb($$payload, {
    navClass: "crc-breadcrumb",
    "aria-label": "Default breadcrumb example",
    children: ($$payload2) => {
      const each_array = ensure_array_like(items);
      CustomBreadcrumbItem($$payload2, {
        href: "/",
        home: true,
        children: ($$payload3) => {
          $$payload3.out += `<!---->${escape_html(LABEL.HOME)}`;
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!----> <!--[-->`;
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let { label, href } = each_array[$$index];
        if (href) {
          $$payload2.out += "<!--[-->";
          CustomBreadcrumbItem($$payload2, {
            href,
            children: ($$payload3) => {
              $$payload3.out += `<!---->${escape_html(label)}`;
            },
            $$slots: { default: true }
          });
        } else {
          $$payload2.out += "<!--[!-->";
          BreadcrumbItem($$payload2, {
            children: ($$payload3) => {
              $$payload3.out += `<!---->${escape_html(label)}`;
            },
            $$slots: { default: true }
          });
        }
        $$payload2.out += `<!--]-->`;
      }
      $$payload2.out += `<!--]-->`;
    },
    $$slots: { default: true }
  });
  pop();
}
function SideDrawerSystem($$payload, $$props) {
  push();
  var $$store_subs;
  let { isOpen = false } = $$props;
  let activeDrawer = store_get($$store_subs ??= {}, "$drawerStore", drawerStore).activeDrawer;
  let drawerWidth = activeDrawer ? getDrawerWidth(activeDrawer) : 400;
  let drawers = Object.values(store_get($$store_subs ??= {}, "$drawerStore", drawerStore).drawers);
  createEventDispatcher();
  const each_array = ensure_array_like(drawers);
  $$payload.out += `<div${attr_class("drawer-system", void 0, { "open": isOpen })}><div class="drawer-buttons"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let drawer = each_array[$$index];
    if (drawer.isVisible) {
      $$payload.out += "<!--[-->";
      Button($$payload, {
        id: drawer.key,
        class: "toolbar-button",
        children: ($$payload2) => {
          FontAwesomeIcon($$payload2, { icon: drawer.icon });
        },
        $$slots: { default: true }
      });
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></div> `;
  if (isOpen && activeDrawer) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="drawer-content-wrapper"${attr_style(`width: ${stringify(drawerWidth)}px`)}><div class="resize-handle" role="button" tabindex="0">`;
    FontAwesomeIcon($$payload, { icon: faGripLinesVertical, class: "grip-icon" });
    $$payload.out += `<!----></div> <div class="drawer-content"><div class="drawer-header"><div class="drawer-title-container"><h2>${escape_html(getDrawer(activeDrawer)?.title ?? "")}</h2> `;
    if (getDrawer(activeDrawer)?.supportsRefresh) {
      $$payload.out += "<!--[-->";
      Button($$payload, {
        class: "drawer-header-button",
        children: ($$payload2) => {
          FontAwesomeIcon($$payload2, { icon: faRotateRight });
        },
        $$slots: { default: true }
      });
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div> `;
    Button($$payload, {
      class: "drawer-header-button",
      children: ($$payload2) => {
        FontAwesomeIcon($$payload2, { icon: faTimes });
      },
      $$slots: { default: true }
    });
    $$payload.out += `<!----></div> `;
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
    const model = ModelManager.getInstance().modelStore.model;
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
  $$payload.out += `<div class="drawer-content-area p-2"><div${attr_style(`display: ${stringify(isLoading || !showChart ? "block" : "none")}`)}>`;
  ListPlaceholder($$payload, { divClass: "mb-4" });
  $$payload.out += `<!----></div> <div${attr_style(`display: ${stringify(!isLoading && showChart ? "block" : "none")}`)}><div>${html(chartHtml)}</div></div></div>`;
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
    const model = ModelManager.getInstance().modelStore.model;
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
    const model = ModelManager.getInstance().modelStore.model;
    const unit = model.configuration;
    const rtObject = getTimelineTable(unit);
    return rtObject.asString();
  }
  $$payload.out += `<div class="drawer-content-area p-2"><div${attr_style(`display: ${stringify(isLoading || !showTable ? "block" : "none")}`)}>`;
  ListPlaceholder($$payload, { divClass: "mb-4" });
  $$payload.out += `<!----></div> <div${attr_style(`display: ${stringify(!isLoading && showTable ? "block" : "none")}`)}><div>${html(tableHtml)}</div></div> <div style="display: block" class="markdown-body svelte-110fhye"><div>${html(checklistHtml)}</div></div></div>`;
  bind_props($$props, { refresh });
  pop();
}
function DSLErrorsDrawer($$payload, $$props) {
  push();
  const dispatch = createEventDispatcher();
  let modelErrors = [];
  onMount(() => {
    modelErrors = ModelManager.getInstance().runValidator();
    console.log("DSLErrorsDrawer errors", modelErrors.length);
  });
  function refresh() {
    modelErrors = ModelManager.getInstance().runValidator();
    dispatch("refresh");
    console.log("DSLErrorsDrawer refresh errors", modelErrors.length);
  }
  $$payload.out += `<div class="drawer-content-area">`;
  Table($$payload, {
    striped: true,
    class: "error-drawer",
    children: ($$payload2) => {
      TableHead($$payload2, {
        class: "error-drawer-row",
        children: ($$payload3) => {
          TableHeadCell($$payload3, {
            class: "error-drawer-head",
            children: ($$payload4) => {
              $$payload4.out += `<!---->Message`;
            },
            $$slots: { default: true }
          });
          $$payload3.out += `<!----> `;
          TableHeadCell($$payload3, {
            class: "error-drawer-head",
            children: ($$payload4) => {
              $$payload4.out += `<!---->Severity`;
            },
            $$slots: { default: true }
          });
          $$payload3.out += `<!---->`;
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!----> `;
      TableBody($$payload2, {
        children: ($$payload3) => {
          const each_array = ensure_array_like(modelErrors);
          $$payload3.out += `<!--[-->`;
          for (let index = 0, $$length = each_array.length; index < $$length; index++) {
            let error = each_array[index];
            TableBodyRow($$payload3, {
              class: "error-drawer-row",
              children: ($$payload4) => {
                TableBodyCell($$payload4, {
                  class: "error-drawer-cell",
                  children: ($$payload5) => {
                    Button($$payload5, {
                      color: "dark",
                      size: "xs",
                      class: "error-drawer-button",
                      children: ($$payload6) => {
                        FontAwesomeIcon($$payload6, { icon: faSquareUpRight });
                      },
                      $$slots: { default: true }
                    });
                    $$payload5.out += `<!----> ${escape_html(error.message)}`;
                  },
                  $$slots: { default: true }
                });
                $$payload4.out += `<!----> `;
                TableBodyCell($$payload4, {
                  class: "error-drawer-cell",
                  children: ($$payload5) => {
                    $$payload5.out += `<!---->${escape_html(error.severity)}`;
                  },
                  $$slots: { default: true }
                });
                $$payload4.out += `<!---->`;
              },
              $$slots: { default: true }
            });
          }
          $$payload3.out += `<!--]-->`;
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!---->`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div>`;
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
      const response = await fetch("/assets/help/help.html");
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
function sineIn(t) {
  const v = Math.cos(t * Math.PI * 0.5);
  if (Math.abs(v) < 1e-14) return 1;
  else return 1 - v;
}
function ObjectDrawerSystem($$payload, $$props) {
  push();
  var $$store_subs;
  const title = store_get($$store_subs ??= {}, "$drawerStore", drawerStore$1).action === "add" ? `Add ${toProperCase(store_get($$store_subs ??= {}, "$drawerStore", drawerStore$1).objectType ?? "")}` : `Edit ${toProperCase(store_get($$store_subs ??= {}, "$drawerStore", drawerStore$1).objectType ?? "")}`;
  let transitionParams = { x: 320, duration: 200, easing: sineIn };
  function toProperCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
  Drawer($$payload, {
    id: "generic-drawer",
    class: "object-drawer",
    transitionType: "fly",
    transitionParams,
    placement: "left",
    backdrop: true,
    hidden: !store_get($$store_subs ??= {}, "$drawerStore", drawerStore$1).open,
    children: ($$payload2) => {
      $$payload2.out += `<div class="drawer-header"><div class="drawer-title-container"><h5 class="text-lg font-bold">${escape_html(title)}</h5></div> `;
      Button($$payload2, {
        class: "drawer-header-button",
        children: ($$payload3) => {
          FontAwesomeIcon($$payload3, { icon: faTimes });
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!----></div> `;
      {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]-->`;
    },
    $$slots: { default: true }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function StudyGrid($$payload, $$props) {
  push();
  var $$store_subs;
  let deleteDialogOpen = false;
  let objectToDelete = null;
  let gridOptions;
  let gridApi;
  let studiesData = [];
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
  let gridTheme = store_get($$store_subs ??= {}, "$theme", theme) === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz";
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
            const studyId = params.data.id;
            const studyName = params.data.name;
            return `<a href="#" data-study-id="${studyId}">${studyName}</a>`;
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
        },
        {
          headerName: "Actions",
          field: "actions",
          cellRenderer: (params) => {
            return createActionButtons(params, [
              {
                type: "edit",
                icon: "edit",
                onClick: onEditClick
              },
              {
                type: "delete",
                icon: "delete",
                onClick: onDeleteClick
              }
            ]);
          },
          width: 100,
          sortable: false,
          filter: false
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
  function createActionButtons(params, buttonConfigs) {
    const span = document.createElement("span");
    span.classList.add("grid-button-group");
    buttonConfigs.forEach((config) => {
      if (shouldRenderButton(params.data, config.type)) {
        const button = document.createElement("button");
        button.classList.add("grid-button", `${config.type}-button`);
        button.innerHTML = getSVGIcon(config.icon);
        button.addEventListener("click", () => config.onClick(params.data.id));
        span.appendChild(button);
      }
    });
    return span;
  }
  function shouldRenderButton(rowData, buttonType) {
    return true;
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
function Home($$payload, $$props) {
  push();
  onMount(async () => {
    console.log("Home component mounted");
  });
  $$payload.out += `<div class="crc-grid">Home</div>`;
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
function Patients($$payload, $$props) {
  push();
  onMount(async () => {
  });
  $$payload.out += `<div class="crc-grid inside-root">`;
  PatientGrid($$payload, { studyId: "" });
  $$payload.out += `<!----></div>`;
  pop();
}
function Availability($$payload, $$props) {
  push();
  let modelname = "11119f8b-1c2d-4e5f-9e8b-6a7b8c9d0e1f";
  let modelManager = ModelManager.getInstance();
  let dslEditor = void 0;
  let editorLoaded = false;
  onMount(async () => {
    dslEditor = WebappConfigurator.getInstance().editorEnvironment.editor;
    const result = await modelManager.openModelUnit(modelname, "Availability");
    if (result !== void 0) {
      setTimeout(
        () => {
          editorLoaded = true;
        },
        2500
      );
    } else {
      console.error("Failed to load study configuration");
    }
  });
  onDestroy(() => {
    editorLoaded = false;
  });
  $$payload.out += `<div class="crc-container p-2">`;
  if (editorLoaded) {
    $$payload.out += "<!--[-->";
    FreonComponent($$payload, { editor: dslEditor });
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="h-full crc-content-width">`;
    ListPlaceholder($$payload, {
      divClass: "p-4 space-y-4 mr-1 rounded border border-gray-200 divide-y divide-gray-200 shadow animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700"
    });
    $$payload.out += `<!----></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let contentComponent = void 0;
  let breadcrumbItems = [];
  setContext("addObject", addObject);
  setContext("editObject", editObject);
  onMount(() => {
    addDrawer({
      key: "help",
      icon: faInfoCircle,
      component: HelpDrawer,
      title: "Help",
      description: "Help for application.",
      supportsRefresh: false,
      defaultWidth: 900
    });
    addDrawer({
      key: "favorites",
      icon: faHeart,
      component: FavoritesDrawer,
      title: "Favorites",
      description: "Manage your favorite studies, patients, and tasks.",
      supportsRefresh: true,
      defaultWidth: 400
    });
    addDrawer({
      key: "dslErrors",
      icon: faTriangleExclamation,
      component: DSLErrorsDrawer,
      title: "Errors",
      description: "View the errors in the study design.",
      supportsRefresh: true,
      defaultWidth: 800
    });
    addDrawer({
      key: "studyTimelineTable",
      icon: faTableList,
      component: StudyTimelineTableDrawer,
      title: "Study Timeline Table",
      description: "View the timeline as a table for this study.",
      supportsRefresh: true,
      defaultWidth: 600
    });
    addDrawer({
      key: "studyTimelineChart",
      icon: faTimeline,
      component: StudyTimelineChartDrawer,
      title: "Study Timeline Chart",
      description: "View the timeline as a chart for this study.",
      supportsRefresh: true,
      defaultWidth: 800
    });
    setContent(store_get($$store_subs ??= {}, "$currentRoute", currentRoute));
    setDrawerVisibility("help", true);
    setDrawerVisibility("favorites", true);
  });
  async function setContent(route) {
    const routeName = route.name.toLowerCase();
    const id = route.params?.id;
    let study;
    let studyId;
    let studyName;
    let patient;
    let patientName;
    switch (routeName) {
      case ROUTE.HOME:
        contentComponent = Home;
        breadcrumbItems = [];
        break;
      case ROUTE.STUDIES:
        contentComponent = Studies;
        breadcrumbItems = [{ label: LABEL.STUDIES }];
        break;
      case ROUTE.AVAILABILITY:
        contentComponent = Availability;
        breadcrumbItems = [{ label: LABEL.AVAILABILITY }];
        break;
      case ROUTE.PATIENTS:
        contentComponent = Patients;
        breadcrumbItems = [{ label: LABEL.PATIENTS }];
        break;
      case ROUTE.STUDY:
        contentComponent = Study;
        try {
          study = await dataStore.getStudy(id);
          if (study) {
            studyName = study.name;
            breadcrumbItems = [
              {
                label: LABEL.STUDIES,
                href: "/" + ROUTE.STUDIES
              },
              { label: LABEL.STUDY + ": " + studyName }
            ];
          } else {
            throw new Error("Study not found");
          }
        } catch (error) {
          console.error("Error fetching study:", error);
          breadcrumbItems = [
            {
              label: LABEL.STUDIES,
              href: "/" + ROUTE.STUDIES
            },
            { label: LABEL.STUDY + ": Not Found" }
          ];
        }
        break;
      case ROUTE.PATIENT:
        contentComponent = Patient;
        patient = await dataStore.getPatient(id);
        if (patient) {
          patientName = patient.name;
          studyId = patient.studyId;
          study = await dataStore.getStudy(patient.studyId);
          if (study) {
            studyName = study.name;
            breadcrumbItems = [
              {
                label: LABEL.STUDIES,
                href: "/" + ROUTE.STUDIES
              },
              {
                label: LABEL.STUDY + ": " + studyName,
                href: "/" + ROUTE.STUDY + "?id=" + studyId
              },
              { label: LABEL.PATIENT + ": " + patientName }
            ];
          } else {
            console.error("Study not found for patient:", id);
            breadcrumbItems = [
              {
                label: LABEL.STUDIES,
                href: "/" + ROUTE.STUDIES
              },
              {
                label: LABEL.PATIENTS,
                href: "/" + ROUTE.PATIENTS
              },
              { label: LABEL.PATIENT + ": " + patientName }
            ];
          }
        } else {
          console.error("Patient not found:", id);
          breadcrumbItems = [
            {
              label: LABEL.STUDIES,
              href: "/" + ROUTE.STUDIES
            },
            {
              label: LABEL.PATIENTS,
              href: "/" + ROUTE.PATIENTS
            },
            { label: LABEL.PATIENT + ": Not Found" }
          ];
        }
        break;
      default:
        contentComponent = Home;
        breadcrumbItems = [];
    }
  }
  $$payload.out += `<div id="app-container"><appbar>`;
  NavBar($$payload);
  $$payload.out += `<!----></appbar> <div id="content-container"><main>`;
  Breadcrumb_1($$payload, { items: breadcrumbItems });
  $$payload.out += `<!----> `;
  await_block(
    $$payload,
    contentComponent,
    () => {
      $$payload.out += `<p>Loading...</p>`;
    },
    (Component) => {
      if (store_get($$store_subs ??= {}, "$currentRoute", currentRoute).params?.id) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<!---->`;
        Component($$payload, {
          id: store_get($$store_subs ??= {}, "$currentRoute", currentRoute).params.id
        });
        $$payload.out += `<!---->`;
      } else {
        $$payload.out += "<!--[!-->";
        $$payload.out += `<!---->`;
        Component($$payload, {});
        $$payload.out += `<!---->`;
      }
      $$payload.out += `<!--]-->`;
    }
  );
  $$payload.out += `<!--]--></main> `;
  ObjectDrawerSystem($$payload);
  $$payload.out += `<!----> `;
  SideDrawerSystem($$payload, {});
  $$payload.out += `<!----></div></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
