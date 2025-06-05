import "clsx";
import { F as push, K as escape_html, I as pop, V as createEventDispatcher, G as onMount, Q as head, X as attr_class, U as stringify, P as store_get, S as unsubscribe_stores, W as ensure_array_like, T as attr, Z as bind_props, Y as attr_style, J as tick, a1 as clsx, _ as onDestroy } from "./environment.js";
import { Card, Button, Modal, Badge, Popover, Checkbox, Skeleton, Tabs, TabItem, Toolbar, ToolbarButton, ListPlaceholder } from "flowbite-svelte";
import { g as getSVGIcon, e as editObject, c as getStatusColor } from "./object-drawer-store.js";
import { a as FreLogger, b as MobxModelElementImpl, F as FontAwesomeIcon, i as isNullOrUndefined, c as FreUtils, o as observableprim, E as ElementBox, d as FreEditorUtil, A as AST, e as isActionBox, T as TableDirection, f as isFreNodeReference, m as moveListElement, g as dropListElement, h as isActionTextBox, B as BehaviorExecutionResult, j as FreCaret, k as FreErrorSeverity, l as isSelectBox, n as ActionBox, S as SelectBox, p as FreCaretPosition, q as isReferenceBox, s as isElementBox, u as isBooleanControlBox, v as BoolDisplay, w as isNumberControlBox, x as isLimitedControlBox, y as LimitedDisplay, z as isButtonBox, C as isExternalBox, D as isIndentBox, G as isLabelBox, I as isLayoutBox, J as isListBox, K as isOptionalBox2, O as isTableBox, P as isTextBox, Q as isEmptyLineBox, U as isTableRowBox, W as WebappConfigurator, M as ModelManager } from "./FontAwesomeIcon.js";
import { faPlus, faPencil, faGlasses, faUser, faSave, faUndo, faRedo, faSwatchbook } from "@fortawesome/free-solid-svg-icons";
import { createGrid } from "ag-grid-community";
import "ag-grid-enterprise";
import { C as get, w as writable } from "./exports.js";
import { g as goto } from "./client.js";
import { t as theme } from "./theme-store.js";
import { c as copy_payload, a as assign_payload } from "./payload.js";
import { d as dataStore } from "./data-store.js";
import "mobx";
import "@material/web/checkbox/checkbox.js";
import "@material/web/all.js";
import "@material/web/slider/slider.js";
function isFreNode(node) {
  return node?.freLanguageConcept !== void 0;
}
var MetaKey;
(function(MetaKey2) {
  MetaKey2[MetaKey2["None"] = 0] = "None";
  MetaKey2[MetaKey2["Ctrl"] = 1] = "Ctrl";
  MetaKey2[MetaKey2["Alt"] = 2] = "Alt";
  MetaKey2[MetaKey2["Shift"] = 3] = "Shift";
  MetaKey2[MetaKey2["CtrlAlt"] = 4] = "CtrlAlt";
  MetaKey2[MetaKey2["CtrlShift"] = 5] = "CtrlShift";
  MetaKey2[MetaKey2["AltShift"] = 6] = "AltShift";
  MetaKey2[MetaKey2["CtrlAltShift"] = 7] = "CtrlAltShift";
})(MetaKey || (MetaKey = {}));
function toFreKey(e) {
  return {
    meta: meta(e),
    key: e.key,
    code: e.code
  };
}
function meta(e) {
  if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
    return MetaKey.None;
  }
  if (e.ctrlKey && e.altKey && e.shiftKey) {
    return MetaKey.CtrlAltShift;
  }
  if (e.ctrlKey && e.altKey) {
    return MetaKey.CtrlAlt;
  }
  if (e.ctrlKey && e.shiftKey) {
    return MetaKey.CtrlShift;
  }
  if (e.ctrlKey) {
    return MetaKey.Ctrl;
  }
  if (e.altKey && e.shiftKey) {
    return MetaKey.AltShift;
  }
  if (e.altKey) {
    return MetaKey.Alt;
  }
  if (e.shiftKey) {
    return MetaKey.Shift;
  }
  return MetaKey.None;
}
const BACKSPACE = "Backspace";
function isFragmentBox(box) {
  return box?.kind === "FragmentBox";
}
function isGridBox(box) {
  return box?.kind === "GridBox";
}
function isSvgBox(box) {
  return box?.kind === "SvgBox";
}
new FreLogger("MultiLineTextBox").mute();
function isMultiLineTextBox(b) {
  return !!b && b.kind === "MultiLineTextBox";
}
class FreNodeBaseImpl extends MobxModelElementImpl {
  copy() {
    throw new Error("Method should be implemented by subclasses of FreElementBaseImpl.");
  }
  match(toBeMatched) {
    throw new Error("Method should be implemented by subclasses of FreElementBaseImpl.");
  }
  freId() {
    throw new Error("Method should be implemented by subclasses of FreElementBaseImpl.");
  }
  freIsBinaryExpression() {
    throw new Error("Method should be implemented by subclasses of FreElementBaseImpl.");
  }
  freIsExpression() {
    throw new Error("Method should be implemented by subclasses of FreElementBaseImpl.");
  }
  freIsModel() {
    throw new Error("Method should be implemented by subclasses of FreElementBaseImpl.");
  }
  freIsUnit() {
    throw new Error("Method should be implemented by subclasses of FreElementBaseImpl.");
  }
  freLanguageConcept() {
    throw new Error("Method should be implemented by subclasses of FreElementBaseImpl.");
  }
}
const drawerStore = writable({
  drawers: {},
  activeDrawer: null
});
function setDrawerProps(drawerKey, props) {
  drawerStore.update((store) => ({
    ...store,
    drawers: {
      ...store.drawers,
      [drawerKey]: {
        ...store.drawers[drawerKey],
        props: { ...store.drawers[drawerKey].props, ...props }
      }
    }
  }));
}
function addDrawer(drawer) {
  drawerStore.update((store) => ({
    ...store,
    drawers: {
      ...store.drawers,
      [drawer.key]: {
        ...drawer,
        width: drawer.defaultWidth,
        isVisible: false
      }
    }
  }));
}
function getDrawerWidth(drawerKey) {
  const store = get(drawerStore);
  return store.drawers[drawerKey]?.width ?? store.drawers[drawerKey]?.defaultWidth ?? 400;
}
function setDrawerVisibility(drawerKey, isVisible) {
  drawerStore.update((store) => ({
    ...store,
    drawers: {
      ...store.drawers,
      [drawerKey]: { ...store.drawers[drawerKey], isVisible }
    }
  }));
}
function setActiveDrawer(drawerKey) {
  drawerStore.update((store) => ({
    ...store,
    activeDrawer: drawerKey
  }));
}
function getActiveDrawer() {
  return get(drawerStore).activeDrawer;
}
function getDrawer(drawerKey) {
  return get(drawerStore).drawers[drawerKey];
}
const currentRoute = writable({ name: "Home", params: {} });
function updateCurrentRoute(routeName, id) {
  if (routeName.includes("?id=")) {
    const [route, params] = routeName.split("?");
    routeName = route;
    id = params.split("=")[1];
  }
  currentRoute.set({ name: routeName, params: id ? { id } : {} });
}
function navigateTo(routeName, id) {
  updateCurrentRoute(routeName, id);
  let url = "/" + routeName.toLowerCase();
  if (id) {
    url += `?id=${id}`;
  }
  console.log("Navigating to:", url);
  goto(url);
}
function GridHeader($$payload, $$props) {
  push();
  const { parentId = null, objectType, title } = $$props;
  Card($$payload, {
    class: "crc-grid-header w-full",
    children: ($$payload2) => {
      $$payload2.out += `<div class="flex items-center justify-left"><h3 class="text-base font-bold mr-1">${escape_html(title)}</h3> `;
      Button($$payload2, {
        pill: true,
        outline: true,
        class: "grid-header-button",
        size: "sm",
        children: ($$payload3) => {
          FontAwesomeIcon($$payload3, { icon: faPlus });
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!----></div>`;
    },
    $$slots: { default: true }
  });
  pop();
}
function DeleteObjectDialog($$payload, $$props) {
  push();
  const { open = false, objectType, object } = $$props;
  createEventDispatcher();
  let title = () => "Delete " + toProperCase(objectType);
  function toProperCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
  Modal($$payload, {
    title,
    open,
    class: "dialog",
    backdropClass: "dialog-backdrop fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-opacity-80",
    dialogClass: "dialog-content fixed top-0 start-0 end-0 h-modal md:inset-0 md:h-full p-2 flex",
    size: "xs",
    autofocus: true,
    placement: "center",
    children: ($$payload2) => {
      $$payload2.out += `<div class="text-left"><div class="mb-2 text-xs font-normal text-gray-500 dark:text-gray-400">Are you sure you want to delete this ${escape_html(objectType)}?</div></div>`;
    },
    $$slots: {
      default: true,
      footer: ($$payload2) => {
        {
          Button($$payload2, {
            class: "primary-button",
            children: ($$payload3) => {
              $$payload3.out += `<!---->Yes, I'm sure`;
            },
            $$slots: { default: true }
          });
          $$payload2.out += `<!----> `;
          Button($$payload2, {
            class: "secondary-button",
            children: ($$payload3) => {
              $$payload3.out += `<!---->No, cancel`;
            },
            $$slots: { default: true }
          });
          $$payload2.out += `<!---->`;
        }
      }
    }
  });
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
  let patientsData = [];
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
  let gridTheme = () => store_get($$store_subs ??= {}, "$theme", theme) === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz";
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
            const patientId = params.data.id;
            const patientNumber = params.data.patientNumber;
            return `<a href="#" data-patient-id="${patientId}">${patientNumber}</a>`;
          },
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
function StudyCard($$payload, $$props) {
  push();
  const { study } = $$props;
  let statusColor = getStatusColor(study.status);
  Card($$payload, {
    class: "crc-card-area max-w-sm h-full",
    children: ($$payload2) => {
      $$payload2.out += `<div class="flex items-center justify-left mb-4"><h3 class="text-base font-bold">Study</h3> `;
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
      $$payload2.out += `<!----></div> <div class="space-y-2"><div><h4 class="card-label-text">Name</h4> <p class="text-sm">${escape_html(study.name)}</p></div> <div><h4 class="card-label-text">Title</h4> <p class="text-xs">${escape_html(study.title)}</p></div> <div><h4 class="card-label-text">Status</h4> `;
      Badge($$payload2, {
        color: statusColor,
        class: "text-xs",
        children: ($$payload3) => {
          $$payload3.out += `<!---->${escape_html(study.status)}`;
        },
        $$slots: { default: true }
      });
      $$payload2.out += `<!----></div> <div><h4 class="card-label-text">Phase</h4> <p class="text-sm">${escape_html(study.phase)}</p></div> <div><h4 class="card-label-text">Therapeutic Area</h4> <p class="text-sm">${escape_html(study.therapeuticArea)}</p></div> <div><h4 class="card-label-text text-gray-700">Current Protocol</h4> <p class="text-sm">${escape_html(study.currentProtocol)}</p></div></div>`;
    },
    $$slots: { default: true }
  });
  pop();
}
function cubic_out(t) {
  const f = t - 1;
  return f * f * f + 1;
}
function slide(node, { delay = 0, duration = 400, easing = cubic_out, axis = "y" } = {}) {
  const style = getComputedStyle(node);
  const opacity = +style.opacity;
  const primary_property = axis === "y" ? "height" : "width";
  const primary_property_value = parseFloat(style[primary_property]);
  const secondary_properties = axis === "y" ? ["top", "bottom"] : ["left", "right"];
  const capitalized_secondary_properties = secondary_properties.map(
    (e) => (
      /** @type {'Left' | 'Right' | 'Top' | 'Bottom'} */
      `${e[0].toUpperCase()}${e.slice(1)}`
    )
  );
  const padding_start_value = parseFloat(style[`padding${capitalized_secondary_properties[0]}`]);
  const padding_end_value = parseFloat(style[`padding${capitalized_secondary_properties[1]}`]);
  const margin_start_value = parseFloat(style[`margin${capitalized_secondary_properties[0]}`]);
  const margin_end_value = parseFloat(style[`margin${capitalized_secondary_properties[1]}`]);
  const border_width_start_value = parseFloat(
    style[`border${capitalized_secondary_properties[0]}Width`]
  );
  const border_width_end_value = parseFloat(
    style[`border${capitalized_secondary_properties[1]}Width`]
  );
  return {
    delay,
    duration,
    easing,
    css: (t) => `overflow: hidden;opacity: ${Math.min(t * 20, 1) * opacity};${primary_property}: ${t * primary_property_value}px;padding-${secondary_properties[0]}: ${t * padding_start_value}px;padding-${secondary_properties[1]}: ${t * padding_end_value}px;margin-${secondary_properties[0]}: ${t * margin_start_value}px;margin-${secondary_properties[1]}: ${t * margin_end_value}px;border-${secondary_properties[0]}-width: ${t * border_width_start_value}px;border-${secondary_properties[1]}-width: ${t * border_width_end_value}px;min-${primary_property}: 0`
  };
}
function DSLFooter($$payload, $$props) {
  push();
  const { onCheckboxChange, items: initialItems } = $$props;
  let items = [...initialItems];
  onMount(() => {
    items = [...initialItems];
  });
  let hiddenItems = items.filter((item) => !item.visible);
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
  $$payload.out += `<div class="footer-container">`;
  Button($$payload, {
    id: "editoritems",
    class: "editor-footer-button",
    outlined: true,
    rounded: true,
    children: ($$payload2) => {
      FontAwesomeIcon($$payload2, { icon: faGlasses });
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----> <span class="editor-footer-text flex-grow">${escape_html(hiddenItems.length > 0 ? `Hidden: ${hiddenItems.map((item) => item.label).join(", ")}` : "")}</span> `;
  Popover($$payload, {
    title: "Display Options",
    transition: slide,
    placement: "right",
    class: "editor-display-options-popover w-40",
    triggeredBy: "#editoritems",
    trigger: "click",
    children: ($$payload2) => {
      const each_array = ensure_array_like(items);
      $$payload2.out += `<div><!--[-->`;
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let item = each_array[$$index];
        $$payload2.out += `<div${attr_class(`flex items-center editor-display-options ${stringify(item.parent ? "ml-6" : "")}`)}>`;
        Checkbox($$payload2, {
          id: item.id,
          checked: item.visible,
          class: "crc-checkbox ",
          disabled: !isParentVisible(item.id),
          children: ($$payload3) => {
            $$payload3.out += `<!---->${escape_html(item.label)}`;
          },
          $$slots: { default: true }
        });
        $$payload2.out += `<!----></div>`;
      }
      $$payload2.out += `<!--]--></div>`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div>`;
  pop();
}
const TEXT_LOGGER = new FreLogger("TextComponent");
const TEXTDROPDOWN_LOGGER = new FreLogger("TextDropdownComponent");
new FreLogger("DropdownComponent");
const TABLE_LOGGER = new FreLogger("TableComponent");
const TABLECELL_LOGGER = new FreLogger("TableCellComponent");
new FreLogger("OptionalComponent");
const FREON_LOGGER = new FreLogger("FreonComponent");
new FreLogger("RenderComponent");
new FreLogger("FragmentComponent");
new FreLogger("GridComponent");
new FreLogger("GridCellComponent");
const BUTTON_LOGGER = new FreLogger("ButtonComponent");
new FreLogger("CheckBoxComponent");
new FreLogger("FreonComponent");
const CONTEXTMENU_LOGGER = new FreLogger("Contextmenu");
new FreLogger("ElementComponent");
new FreLogger("IndentComponent");
new FreLogger("InnerSwitchComponent");
const LABEL_LOGGER = new FreLogger("LabelComponent");
new FreLogger("LayoutComponent");
new FreLogger("LimitedCheckboxComponent");
new FreLogger("LimitedRadioComponent");
new FreLogger("ListComponent");
const MULTILINETEXT_LOGGER = new FreLogger("MultilineComponent");
new FreLogger("NumericSliderComponent");
const SWITCH_LOGGER = new FreLogger("SwitchComponent");
function BooleanCheckboxComponent($$payload, $$props) {
  push();
  let { editor, box } = $$props;
  let id = !isNullOrUndefined(box) ? componentId(box) : "checkbox-for-unknown-box";
  let value = box.getBoolean();
  onMount(() => {
    value = box.getBoolean();
  });
  $$payload.out += `<span${attr("id", id)} class="boolean-checkbox-component"><md-checkbox${attr("aria-label", id)} aria-checked="mixed"${attr("checked", value, true)} role="checkbox" tabindex="0"></md-checkbox></span>`;
  pop();
}
function BooleanRadioComponent($$payload, $$props) {
  push();
  let { editor, box } = $$props;
  let id = box.id;
  let currentValue = box.getBoolean();
  let ariaLabel = "toBeDone";
  let isHorizontal = false;
  onMount(() => {
    currentValue = box.getBoolean();
  });
  $$payload.out += `<span role="radiogroup"${attr("aria-labelledby", ariaLabel)}${attr_class("boolean-radio-component-group", void 0, {
    "boolean-radio-component-vertical": !isHorizontal
  })}${attr("id", id)}><span class="boolean-radio-component-single"><md-radio${attr("id", `${stringify(id)}-trueOne`)}${attr("name", `${stringify(id)}-group`)} role="radio" tabindex="0"${attr("aria-checked", currentValue === true)}${attr("value", true)}${attr("checked", currentValue === true, true)} aria-label="radio-control-true"></md-radio> <label${attr("for", `${stringify(id)}-trueOne`)} class="boolean-radio-component-label">${escape_html(box.labels.yes)}</label></span> <span class="boolean-radio-component-single"><md-radio${attr("id", `${stringify(id)}-falseOne`)}${attr("name", `${stringify(id)}-group`)} role="radio" tabindex="0"${attr("aria-checked", currentValue === false)}${attr("value", false)}${attr("checked", currentValue === false, true)} aria-label="radio-control-false"></md-radio> <label class="boolean-radio-component-label"${attr("for", `${stringify(id)}-falseOne`)}>${escape_html(box.labels.no)}</label></span></span>`;
  pop();
}
function DropdownComponent($$payload, $$props) {
  push();
  let {
    options = void 0,
    selected = void 0,
    selectionChanged
  } = $$props;
  let id = "dropdown";
  $$payload.out += `<span class="dropdown-component-container"><span class="dropdown-component"${attr("id", id)}>`;
  if (options.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(options);
    $$payload.out += `<!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let option = each_array[$$index];
      $$payload.out += `<div${attr_class("dropdown-component-item", void 0, {
        "dropdown-component-selected": options.length === 1 || option.id === selected?.id
      })} role="none">`;
      if (option.additional_label) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<span class="dropdown-entry-with-additional-label"><span class="column-for-dropdown-entry-with-additional-label">${escape_html(option.label)}</span> <span class="gap-for-dropdown-entry-with-additional-label"> </span> <span class="column-for-dropdown-entry-with-additional-label">${escape_html(option.additional_label)}</span></span>`;
      } else {
        $$payload.out += "<!--[!-->";
        $$payload.out += `${escape_html(option.label)}`;
      }
      $$payload.out += `<!--]--></div>`;
    }
    $$payload.out += `<!--]-->`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="dropdown-component-error">No selection available</div>`;
  }
  $$payload.out += `<!--]--></span></span>`;
  bind_props($$props, { options, selected });
  pop();
}
function EmptyLineComponent($$payload, $$props) {
  push();
  let { editor, box } = $$props;
  let id = isNullOrUndefined(box) ? componentId(box) : "empty-line-for-unknown-box";
  $$payload.out += `<span${attr("id", id)}><br/></span>`;
  pop();
}
function MultiLineTextComponent($$payload, $$props) {
  push();
  const LOGGER2 = MULTILINETEXT_LOGGER;
  let { box } = $$props;
  let id = "";
  id = !isNullOrUndefined(box) ? componentId(box) : "text-with-unknown-box";
  let textArea;
  let placeholder = "<..>";
  let text = "";
  async function setFocus() {
    LOGGER2.log("setFocus " + id);
    if (!isNullOrUndefined(textArea)) {
      textArea.focus();
    }
  }
  const refresh = () => {
    LOGGER2.log("REFRESH " + box?.node?.freId() + " (" + box?.node?.freLanguageConcept() + ")");
    placeholder = box.placeHolder;
    text = box.getText();
  };
  refresh();
  $$payload.out += `<textarea${attr_class(`${stringify(box.role)} multilinetext-box multiline-text-component`)}${attr("id", id)} spellcheck="false"${attr("placeholder", placeholder)}>`;
  const $$body = escape_html(text);
  if ($$body) {
    $$payload.out += `${$$body}`;
  }
  $$payload.out += `</textarea>`;
  bind_props($$props, { setFocus });
  pop();
}
function GridCellComponent($$payload, $$props) {
  push();
  let { editor, box, parentBox } = $$props;
  let contentBox = dummyBox;
  let id = !isNullOrUndefined(box) ? componentId(box) : "gridcell-for-unknown-box";
  let row = "";
  let column = "";
  let orientation = "gridcellNeutral";
  let isHeader = "noheader";
  let cssStyle = "";
  let cssClass = "";
  $$payload.out += `<div${attr_class(`grid-cell-component ${stringify(orientation)} ${stringify(isHeader)} ${stringify(cssClass)}`)}${attr_style(cssStyle, { "grid-row": row, "grid-column": column })}${attr("id", id)} role="gridcell"${attr("tabindex", 0)}>`;
  RenderComponent($$payload, { box: contentBox, editor });
  $$payload.out += `<!----></div>`;
  pop();
}
function GridComponent($$payload, $$props) {
  push();
  let { editor, box } = $$props;
  let id = "";
  let cells = [];
  let templateColumns = "";
  let templateRows = "";
  let cssClass = "";
  const each_array = ensure_array_like(cells);
  $$payload.out += `<div${attr_class(`grid-component ${stringify(cssClass)}`)}${attr("id", id)}${attr("tabindex", 0)}${attr_style("", {
    "grid-template-columns": templateColumns,
    "grid-template-rows": templateRows
  })}><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let cell = each_array[$$index];
    GridCellComponent($$payload, { parentBox: box, box: cell, editor });
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
function IndentComponent($$payload, $$props) {
  push();
  let { editor, box } = $$props;
  const indentWidth = 8;
  let style = `margin-left: ${box?.indent * indentWidth}px;`;
  let id = !isNullOrUndefined(box) ? componentId(box) : "indent-for-unknown-box";
  let child = void 0;
  if (!isNullOrUndefined(child)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span${attr_style(style)}${attr("id", id)}>`;
    RenderComponent($$payload, { box: child, editor });
    $$payload.out += `<!----></span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function LabelComponent($$payload, $$props) {
  push();
  let { box } = $$props;
  const LOGGER2 = LABEL_LOGGER;
  let id = !isNullOrUndefined(box) ? componentId(box) : "label-for-unknown-box";
  let style = "";
  let cssClass = "";
  let text = "";
  onMount(() => {
    if (!isNullOrUndefined(box)) {
      box.refreshComponent = refresh;
    }
  });
  const refresh = (why) => {
    LOGGER2.log("REFRESH LabelComponent (" + why + ")");
    if (!isNullOrUndefined(box)) {
      text = box.getLabel();
      style = box.cssStyle;
      cssClass = box.cssClass;
    }
  };
  $$payload.out += `<span${attr_class(`label-component ${stringify(text)} ${stringify(cssClass)}`)}${attr_style(style)}${attr("id", id)}>${escape_html(text)}</span>`;
  pop();
}
function ErrorTooltip($$payload, $$props) {
  push();
  let {
    editor,
    box,
    hasErr,
    parentLeft,
    parentTop,
    children
  } = $$props;
  $$payload.out += `<span role="group">`;
  children($$payload);
  $$payload.out += `<!----></span> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function ErrorMarker($$payload, $$props) {
  push();
  let { editor, box } = $$props;
  let top = 0;
  let height = 0;
  $$payload.out += `<span class="error-positioning"${attr_style(`top: ${stringify(top)}px; height: ${stringify(height)}px;`)} role="contentinfo">`;
  ErrorTooltip($$payload, {
    box,
    editor,
    hasErr: true,
    parentTop: top,
    parentLeft: 2,
    children: ($$payload2) => {
      $$payload2.out += `<span class="error-marker"${attr_style(`height: ${stringify(height)}px;`)}> </span>`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></span>`;
  pop();
}
function LayoutComponent($$payload, $$props) {
  push();
  let { editor, box } = $$props;
  let id = "";
  let children = [];
  let isHorizontal = true;
  let errorCls = "";
  let errMess = [];
  if (errMess.length > 0) {
    $$payload.out += "<!--[-->";
    ErrorMarker($$payload, { editor, box });
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <span${attr_class(`layout-component ${stringify(errorCls)}`, void 0, {
    "layout-component-horizontal": isHorizontal,
    "layout-component-vertical": !isHorizontal
  })}${attr("id", id)} tabindex="-1">`;
  {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(children);
    $$payload.out += `<!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let child = each_array[$$index];
      RenderComponent($$payload, { box: child, editor });
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></span>`;
  pop();
}
class SimpleElement extends FreNodeBaseImpl {
  /**
   * A convenience method that creates an instance of this class
   * based on the properties defined in 'data'.
   * @param data
   */
  static create(data) {
    const result = new SimpleElement();
    if (!!data.name) {
      result.name = data.name;
    }
    if (!!data.parseLocation) {
      result.parseLocation = data.parseLocation;
    }
    return result;
  }
  $typename = "SimpleElement";
  // holds the metatype in the form of a string
  $id;
  // a unique identifier
  // parseLocation: FreParseLocation; // if relevant, the location of this element within the source from which it is parsed
  name;
  // implementation of name
  constructor(id) {
    super();
    if (!!id) {
      this.$id = id;
    } else {
      this.$id = FreUtils.ID();
    }
    observableprim(this, "name");
    this.name = "";
  }
  /**
   * Returns the metatype of this instance in the form of a string.
   */
  freLanguageConcept() {
    return this.$typename;
  }
  /**
   * Returns the unique identifier of this instance.
   */
  freId() {
    return this.$id;
  }
  /**
   * Returns true if this instance is a model concept.
   */
  freIsModel() {
    return false;
  }
  /**
   * Returns true if this instance is a model unit.
   */
  freIsUnit() {
    return false;
  }
  /**
   * Returns true if this instance is an expression concept.
   */
  freIsExpression() {
    return false;
  }
  /**
   * Returns true if this instance is a binary expression concept.
   */
  freIsBinaryExpression() {
    return false;
  }
  /**
   * A convenience method that copies this instance into a new object.
   */
  copy() {
    const result = new SimpleElement();
    if (!!this.name) {
      result.name = this.name;
    }
    return result;
  }
  /**
   * Matches a partial instance of this class to this object
   * based on the properties defined in the partial.
   * @param toBeMatched
   */
  match(toBeMatched) {
    let result = true;
    if (result && toBeMatched.name !== null && toBeMatched.name !== void 0 && toBeMatched.name.length > 0) {
      result = result && this.name === toBeMatched.name;
    }
    return result;
  }
}
const dummyBox = new ElementBox(new SimpleElement("dummy"), "box-role");
function calculatePos(viewportSize, contentSize, mousePosition) {
  let result;
  if (viewportSize - mousePosition < contentSize) {
    result = mousePosition - contentSize;
  } else {
    result = mousePosition;
  }
  if (result < 0) {
    result = 0;
  }
  return result;
}
function executeCustomKeyboardShortCut(event, index, box, editor) {
  const cmd = FreEditorUtil.findKeyboardShortcutAction(toFreKey(event), box, editor);
  if (cmd !== null) {
    let postAction;
    AST.change(() => {
      const action = event["action"];
      if (!isNullOrUndefined(action)) {
        action();
      }
      postAction = cmd.execute(box, toFreKey(event), editor, index);
    });
    if (!isNullOrUndefined(postAction)) {
      postAction();
    }
    event.stopPropagation();
  }
}
function componentId(box) {
  return `${box?.node?.freId()}-${box?.role}`;
}
function ContextMenu($$payload, $$props) {
  push();
  let { editor } = $$props;
  const LOGGER2 = CONTEXTMENU_LOGGER;
  let _items = [];
  let submenuItems = [];
  let menuHeight = 0, menuWidth = 0;
  let top = 0, left = 0;
  let topSub = 0, leftSub = 0;
  let submenuOpen = false;
  async function show(event, index, items) {
    LOGGER2.log("CONTEXTMENU show for index " + index);
    _items = items;
    contextMenuVisible.value = true;
    submenuOpen = false;
    await tick();
    const rect = editor.getClientRectangle();
    let posX = event.pageX - rect.x;
    let posY = event.pageY - rect.y;
    left = calculatePos(rect.width, menuWidth, posX);
    top = calculatePos(rect.height, menuHeight, posY);
  }
  function hide() {
    LOGGER2.log("CONTEXTMENU hide");
    contextMenuVisible.value = false;
    submenuOpen = false;
  }
  $$payload.out += `<div>`;
  if (contextMenuVisible.value) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(_items);
    $$payload.out += `<nav class="contextmenu"${attr_style(`top: ${stringify(top)}px; left: ${stringify(left)}px`)}><!--[-->`;
    for (let index = 0, $$length = each_array.length; index < $$length; index++) {
      let item = each_array[index];
      if (item.label === "---") {
        $$payload.out += "<!--[-->";
        $$payload.out += `<hr class="contextmenu-hr"/>`;
      } else {
        $$payload.out += "<!--[!-->";
        $$payload.out += `<button class="contextmenu-button">${escape_html(item.label)} `;
        if (item.shortcut) {
          $$payload.out += "<!--[-->";
          $$payload.out += `<span class="contextmenu-shortcut">${escape_html(item.shortcut)}</span>`;
        } else {
          $$payload.out += "<!--[!-->";
        }
        $$payload.out += `<!--]--></button>`;
      }
      $$payload.out += `<!--]-->`;
    }
    $$payload.out += `<!--]--></nav> `;
    if (submenuOpen) {
      $$payload.out += "<!--[-->";
      const each_array_1 = ensure_array_like(submenuItems);
      $$payload.out += `<nav class="contextmenu"${attr_style(`top: ${stringify(topSub)}px; left: ${stringify(leftSub)}px`)}><!--[-->`;
      for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
        let item = each_array_1[index];
        if (item.label === "---") {
          $$payload.out += "<!--[-->";
          $$payload.out += `<hr class="contextmenu-hr"/>`;
        } else {
          $$payload.out += "<!--[!-->";
          $$payload.out += `<button class="contextmenu-button">${escape_html(item.label)} `;
          if (item.shortcut) {
            $$payload.out += "<!--[-->";
            $$payload.out += `<span class="contextmenu-shortcut">${escape_html(item.shortcut)}</span>`;
          } else {
            $$payload.out += "<!--[!-->";
          }
          $$payload.out += `<!--]--></button>`;
        }
        $$payload.out += `<!--]-->`;
      }
      $$payload.out += `<!--]--></nav>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]-->`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, { show, hide });
  pop();
}
const contextMenuVisible = { value: false };
const draggedElem = { value: null };
const draggedFrom = { value: "" };
const activeElem = { value: void 0 };
const activeIn = { value: "" };
function DragHandle($$payload) {
  $$payload.out += `<svg class="drag-handle-icon drag-handle-svg" width="20px" height="20px" viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.5 8C10.3284 8 11 7.32843 11 6.5C11 5.67157 10.3284 5 9.5 5C8.67157 5 8 5.67157 8 6.5C8 7.32843 8.67157 8 9.5 8ZM9.5 14C10.3284 14 11 13.3284 11 12.5C11 11.6716 10.3284 11 9.5 11C8.67157 11 8 11.6716 8 12.5C8 13.3284 8.67157 14 9.5 14ZM11 18.5C11 19.3284 10.3284 20 9.5 20C8.67157 20 8 19.3284 8 18.5C8 17.6716 8.67157 17 9.5 17C10.3284 17 11 17.6716 11 18.5ZM15.5 8C16.3284 8 17 7.32843 17 6.5C17 5.67157 16.3284 5 15.5 5C14.6716 5 14 5.67157 14 6.5C14 7.32843 14.6716 8 15.5 8ZM17 12.5C17 13.3284 16.3284 14 15.5 14C14.6716 14 14 13.3284 14 12.5C14 11.6716 14.6716 11 15.5 11C16.3284 11 17 11.6716 17 12.5ZM15.5 20C16.3284 20 17 19.3284 17 18.5C17 17.6716 16.3284 17 15.5 17C14.6716 17 14 17.6716 14 18.5C14 19.3284 14.6716 20 15.5 20Z"></path></svg>`;
}
function ListComponent($$payload, $$props) {
  push();
  let { editor, box } = $$props;
  let id = "";
  let shownElements = [];
  const each_array = ensure_array_like(shownElements);
  $$payload.out += `<span${attr_class(clsx("list-component-horizontal"))}${attr("id", id)}${attr_style("", {
    "grid-template-columns": "auto",
    "grid-template-rows": "auto"
  })}><!--[-->`;
  for (let index = 0, $$length = each_array.length; index < $$length; index++) {
    let box2 = each_array[index];
    $$payload.out += `<span${attr_class("list-item", void 0, {
      "is-active": activeElem.value?.row === index && activeIn.value === id,
      "dragged": draggedElem.value?.propertyIndex === index && draggedFrom.value === id
    })} role="none"${attr_style("", {
      "grid-column": index + 1,
      "grid-row": 1
    })}>`;
    if (!isActionBox(box2)) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<span class="drag-handle" draggable="true" role="listitem">`;
      DragHandle($$payload);
      $$payload.out += `<!----></span>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    RenderComponent($$payload, { box: box2, editor });
    $$payload.out += `<!----></span>`;
  }
  $$payload.out += `<!--]--></span>`;
  pop();
}
function OptionalComponent($$payload, $$props) {
  push();
  let { editor, box } = $$props;
  let id = "";
  id = !isNullOrUndefined(box) ? componentId(box) : "optional2-for-unknown-box";
  let optionalBox = void 0;
  $$payload.out += `<span class="optional-component"${attr("id", id)}>`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<span class="optional-component-hide">`;
    RenderComponent($$payload, { box: optionalBox, editor });
    $$payload.out += `<!----></span>`;
  }
  $$payload.out += `<!--]--></span>`;
  pop();
}
function TableCellComponent($$payload, $$props) {
  push();
  let {
    editor,
    box,
    parentComponentId,
    parentOrientation,
    ondropOnCell
  } = $$props;
  const LOGGER2 = TABLECELL_LOGGER;
  let id = !isNullOrUndefined(box) ? `cell-${componentId(box)}` : "table-cell-for-unknown-box";
  let row = 0;
  let column = 0;
  let orientation = "gridcellNeutral";
  let childBox = void 0;
  let isHeader = "";
  let cssStyle = "";
  let cssClass = "";
  const refresh = (why) => {
    LOGGER2.log("TableCellComponent refresh, why: " + why);
    if (!isNullOrUndefined(box)) {
      if (parentOrientation === TableDirection.HORIZONTAL) {
        row = box.row;
        column = box.column;
      } else {
        row = box.column;
        column = box.row;
      }
      childBox = box.content;
      box.conceptName = box.conceptName;
      isHeader = box.parent.isHeader ? "table-header" : "";
    }
    LOGGER2.log("    refresh row, col = " + row + ", " + column);
  };
  onMount(() => {
    refresh("from onMount");
  });
  let selectedCls = "";
  $$payload.out += `<span${attr("id", id)} role="cell"${attr_class(`table-cell-component ${stringify(orientation)} ${stringify(isHeader)} ${stringify(cssClass)} ${stringify(selectedCls)}`)}${attr_style(cssStyle, { "grid-row": row, "grid-column": column })}${attr("tabindex", -1)}>`;
  if (isHeader.length === 0 && box.isFirstInElementBox()) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="drag-handle" draggable="true" role="listitem">`;
    DragHandle($$payload);
    $$payload.out += `<!----></span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  RenderComponent($$payload, { box: childBox, editor });
  $$payload.out += `<!----></span>`;
  pop();
}
function TableComponent($$payload, $$props) {
  push();
  const LOGGER2 = TABLE_LOGGER;
  let { editor, box } = $$props;
  let id = !isNullOrUndefined(box) ? componentId(box) : "table-for-unknown-box";
  let cells = [];
  let templateColumns = "";
  let templateRows = "";
  let cssClass = "";
  let myMetaType;
  const drop = (details) => {
    const data = draggedElem.value;
    let targetIndex = details.row - 1;
    if (box.direction === TableDirection.VERTICAL) {
      targetIndex = details.column - 1;
    }
    if (!isNullOrUndefined(data)) {
      if (isFreNodeReference(data.element)) {
        LOGGER2.log(`DROPPING item [${data.element.name}] from [${data.componentId}] in list [${id}] on position [${targetIndex}]`);
      } else if (isFreNode(data.element)) {
        LOGGER2.log(`DROPPING item [${data.element.freId()}] from [${data.componentId}] in list [${id}] on position [${targetIndex}]`);
      }
      if (box.hasHeaders) {
        targetIndex = targetIndex - 1;
      }
      if (data.componentId === id) {
        moveListElement(box.node, data.element, box.propertyName, targetIndex);
      } else {
        dropListElement(editor, data, myMetaType, box.node, box.propertyName, targetIndex);
      }
    }
    draggedElem.value = null;
    draggedFrom.value = "";
    activeElem.value = { row: -1, column: -1 };
    activeIn.value = "";
  };
  const each_array = ensure_array_like(cells);
  $$payload.out += `<span${attr_class(`table-component ${stringify(cssClass)}`)}${attr("id", id)}${attr("tabindex", -1)}${attr_style("", {
    "grid-template-columns": templateColumns,
    "grid-template-rows": templateRows
  })}><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let cell = each_array[$$index];
    TableCellComponent($$payload, {
      box: cell,
      editor,
      parentComponentId: id,
      parentOrientation: box.direction,
      ondropOnCell: drop
    });
  }
  $$payload.out += `<!--]--></span>`;
  pop();
}
const LOGGER = new FreLogger("TextComponentHelper");
class TextComponentHelper {
  // The box that is shown in the text component for which this instance is created
  _myBox;
  // Function that enables us to get the value from the text variable in the TextComponent
  _getText;
  // Function that enables us to determine whether the text variable in the TextComponent is different from the value stored in the model
  _hasChanges;
  // Function that enables us to do everything that is needed when the editing of the TextComponent is in any way stopped.
  _endEditing;
  // The dispatcher that enables us to communicate with the surrounding TextDropdownComponent
  _dispatcher;
  // The cursor position, or when different from 'to', the start of the selected text.
  // Note that 'from <= to' always holds.
  _from = -1;
  // The cursor position, or when different from 'from', the end of the selected text.
  // Note that 'from <= to' always holds.
  _to = -1;
  constructor(box, getText, hasChanges, endEditing, dispatcher) {
    this._myBox = box;
    this._getText = getText;
    this._hasChanges = hasChanges;
    this._endEditing = endEditing;
    this._dispatcher = dispatcher;
  }
  get to() {
    return this._to;
  }
  set to(val) {
    this._to = val;
  }
  get from() {
    return this._from;
  }
  set from(val) {
    this._from = val;
  }
  // leaving the param because we might need it later
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleDelete(event, editor) {
    LOGGER.log(`Delete`);
    if (!event.ctrlKey && !event.altKey && event.shiftKey) {
      this.cut();
    } else {
      this._dispatcher("showDropdown");
      this.getCaretPosition(event);
      if (this._from < this._getText().length || this._from !== this._to) {
        LOGGER.log(`handleDelete, caret: ${this._from}-${this._to}`);
        event.stopPropagation();
      } else {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }
  handleBackSpace(event, editor) {
    LOGGER.log(`handleBackSpace`);
    this.getCaretPosition(event);
    if (this._from > 0 || this._from !== this._to) {
      if (this._from === this._to) {
        this._from -= 1;
        this._to -= 1;
      }
      LOGGER.log(`handleBackSpace, caret: ${this._from}-${this._to}`);
      event.stopPropagation();
    } else {
      if (this.isTextEmpty()) {
        LOGGER.log("    handleBackSpace EMPTY EMPTY EMPTY EMPTY EMPTY EMPTY EMPTY EMPTY " + this._myBox.kind + " id " + this._myBox.$id);
        editor.deleteTextBox(this._myBox, true);
      }
      event.preventDefault();
      event.stopPropagation();
    }
  }
  handleGoToPrevious(event, editor, htmlId) {
    LOGGER.log("handleGoToPrevious event " + event.key);
    this._endEditing();
    editor.selectPreviousLeafIncludingExpressionPreOrPost();
    LOGGER.log(htmlId + "    PREVIOUS LEAF IS " + editor.selectedBox.role);
    if (isActionTextBox(editor.selectedBox)) {
      const actionBox = editor.selectedBox.parent;
      const executionResult = actionBox.tryToExecute(event.key, editor);
      if (executionResult !== BehaviorExecutionResult.EXECUTED) {
        actionBox.setCaret(FreCaret.LEFT_MOST, editor);
      }
    }
    event.preventDefault();
    event.stopPropagation();
  }
  handleGoToNext(event, editor, htmlId) {
    LOGGER.log("handleGoToNext event " + event.key);
    this._endEditing();
    editor.selectNextLeafIncludingExpressionPreOrPost();
    LOGGER.log(htmlId + "    NEXT LEAF IS " + editor.selectedBox.role);
    if (isActionTextBox(editor.selectedBox)) {
      const actionBox = editor.selectedBox.parent;
      const executionResult = actionBox.tryToExecute(event.key, editor);
      if (executionResult !== BehaviorExecutionResult.EXECUTED) {
        actionBox.setCaret(FreCaret.RIGHT_MOST, editor);
      }
    }
    event.preventDefault();
    event.stopPropagation();
  }
  handleAltOrCtrlKey(event, editor) {
    LOGGER.log(`AltOrCtrlKey, key: ${JSON.stringify(event.key)}, ctrl: ${event.ctrlKey}, alt: ${event.altKey}`);
    executeCustomKeyboardShortCut(event, 0, this._myBox, editor);
    this.getCaretPosition(event);
    if (event.ctrlKey) {
      if (!event.altKey) {
        switch (event.key) {
          case "z":
          case "y":
            this._hasChanges();
            break;
          case "x":
            this.cut();
            break;
          case "a":
            break;
          case "c":
            this.copy(event, editor);
            break;
          case "v":
            this.paste(event);
            break;
        }
      } else {
        if (event.key === "z") {
          this._hasChanges();
        }
      }
    } else {
      if (event.altKey && event.key === BACKSPACE) {
        this._hasChanges();
      } else if (!event.ctrlKey && event.altKey && event.shiftKey) {
        this._hasChanges();
      }
    }
  }
  handleArrowLeft(event) {
    this.getCaretPosition(event);
    LOGGER.log(`handleArrowLeft, caret: ${this._from}-${this._to}`);
    if (this._from !== 0) {
      event.stopPropagation();
      this._from -= 1;
      this._to -= 1;
      LOGGER.log(`caretChanged from handleArrowLeft, caret: ${this._from}-${this._to}`);
      this._dispatcher("caretChanged", { content: this._getText(), caret: this._from });
    }
  }
  handleArrowRight(event) {
    this.getCaretPosition(event);
    LOGGER.log(`handleArrowRight, caret: ${this._from}-${this._to}`);
    if (this._from !== this._getText().length) {
      event.stopPropagation();
      this._from += 1;
      this._to += 1;
      LOGGER.log(`caretChanged from handleArrowLeft, caret: ${this._from}-${this._to}`);
      this._dispatcher("caretChanged", { content: this._getText(), caret: this._from });
    }
  }
  /**
   * When a keyboard event is triggered, this function stores the caret position(s).
   * Note, this function is to be used from the <input> element only. It depends on the
   * fact that the event target has a 'selectionStart' and a 'selectionEnd', which is the case
   * only for <textarea> or <input> elements.
   * @param event
   */
  getCaretPosition(event) {
    const target = event.target;
    this.setFromAndTo(target.selectionStart, target.selectionEnd);
  }
  /**
   * This function ensures that 'from <= to' always holds.
   * Should be called whenever these variables are set.
   * @param inFrom
   * @param inTo
   */
  setFromAndTo(inFrom, inTo) {
    if (!isNullOrUndefined(inFrom) && !isNullOrUndefined(inTo)) {
      if (inFrom < inTo) {
        this._from = inFrom;
        this._to = inTo;
      } else {
        this._from = inTo;
        this._to = inFrom;
      }
    } else {
      this._from = 0;
      this._to = 0;
    }
  }
  isTextEmpty() {
    return this._getText() === "" || !this._getText();
  }
  /**
   * This function determines where the current keystroke event should be handled.
   * It is used for keystrokes that are not directly handled by the corresponding TextComponent,
   * but are either handled by the browser, e.g. an undo in the input text, or by the surrounding
   * FreonComponent, e.g. an undo when there are no changes in the input text left that could be undone.
   * @private
   */
  /**
   * Like setHandler(), this function determines where the current keystroke event should be handled.
   * However, the condition for the choice is a different one.
   * @private
   */
  cut() {
    if (this._from !== this._to) ;
  }
  paste(event) {
    event.stopPropagation();
    event.preventDefault();
  }
  copy(event, editor) {
    event.stopPropagation();
    navigator.clipboard.writeText(this._getText()).then(() => {
      editor.setUserMessage("Text copied to clipboard", FreErrorSeverity.Info);
    }).catch((err) => {
      editor.setUserMessage("Error in copying text: " + err.message);
    });
  }
}
function TextComponent($$payload, $$props) {
  push();
  const LOGGER2 = TEXT_LOGGER;
  let {
    editor,
    box,
    partOfDropdown,
    isEditing = void 0,
    text = void 0,
    toParent
  } = $$props;
  let id = !isNullOrUndefined(box) ? componentId(box) : "text-with-unknown-box";
  let placeholder = !isNullOrUndefined(box) ? box.placeHolder : "<..>";
  let originalText = !isNullOrUndefined(box) ? box.getText() : "";
  let placeHolderStyle = partOfDropdown ? "text-component-action-placeholder" : "text-component-placeholder";
  let boxType = !isNullOrUndefined(box?.parent) ? isActionBox(box?.parent) ? "action" : isSelectBox(box?.parent) ? "select" : "text" : "text";
  let tabindex = !isNullOrUndefined(box?.role) ? box.role.startsWith("action-binary") || box.role.startsWith("action-exp") ? -1 : 0 : 0;
  let errorCls = "";
  let errMess = [];
  let hasErr = false;
  let inputElement = void 0;
  let myHelper = new TextComponentHelper(
    box,
    () => {
      return text;
    },
    () => {
      return originalText !== text;
    },
    endEditing,
    toParent
  );
  const refresh = (why) => {
    LOGGER2.log(`${id}: REFRESH why ${why}: (${box?.node?.freLanguageConcept()}) box text '${box?.getText()}' text '${text}'`);
    if (!isNullOrUndefined(box)) {
      if (placeholder !== box.placeHolder) placeholder = box.placeHolder;
      if (originalText !== box.getText()) originalText = box.getText();
      if (text !== box.getText()) text = box.getText();
      boxType = box.parent instanceof ActionBox ? "action" : box.parent instanceof SelectBox ? "select" : "text";
      if (box.hasError) {
        errorCls = "text-component-text-error";
        errMess = box.errorMessages;
        hasErr = true;
      } else {
        errorCls = "";
        errMess = [];
        hasErr = false;
      }
    }
  };
  async function setFocus() {
    LOGGER2.log(`setFocus for ${box?.id} ${isEditing} && ${inputElement}`);
    if (isEditing && !isNullOrUndefined(inputElement)) {
      inputElement.focus();
    } else {
      await startEditing();
    }
  }
  const calculateCaret = (freCaret) => {
    LOGGER2.log(`${id}: setCaret ${freCaret.position} [${freCaret.from}, ${freCaret.to}]`);
    switch (freCaret.position) {
      case FreCaretPosition.RIGHT_MOST:
        myHelper.from = myHelper.to = text.length;
        break;
      case FreCaretPosition.LEFT_MOST:
      case FreCaretPosition.UNSPECIFIED:
        myHelper.from = myHelper.to = 0;
        break;
      case FreCaretPosition.INDEX:
        myHelper.setFromAndTo(freCaret.from, freCaret.to);
        break;
      default:
        myHelper.from = myHelper.to = 0;
        break;
    }
  };
  async function startEditing(from) {
    LOGGER2.log(`startEditing for ${box?.id}`);
    {
      calculateCaret(editor.selectedCaretPosition);
    }
    isEditing = true;
    originalText = text;
    await tick();
    if (isEditing && !isNullOrUndefined(inputElement)) {
      inputElement.selectionStart = myHelper.from >= 0 ? myHelper.from : 0;
      inputElement.selectionEnd = myHelper.to >= 0 ? myHelper.to : 0;
      inputElement.focus();
    } else {
      LOGGER2.error("startEditing, trying to set caret and focus without input element");
    }
  }
  function endEditing() {
    LOGGER2.log(`endEditing for ${box?.id}`);
    if (isEditing) {
      isEditing = false;
      myHelper.from = -1;
      myHelper.to = -1;
      if (!partOfDropdown) {
        LOGGER2.log(`   save text using box.setText(${text})`);
        if (text !== box.getText()) {
          LOGGER2.log(`   text is new value`);
          box.setText(text);
        }
      } else {
        toParent("endEditing");
      }
    }
  }
  onMount(() => {
    LOGGER2.log(`onMount for ${box?.id}`);
    if (!isNullOrUndefined(box)) {
      box.setFocus = setFocus;
      box.setCaret = calculateCaret;
      box.refreshComponent = refresh;
    }
    refresh("from onMount");
  });
  if (errMess.length > 0 && box.isFirstInLine) {
    $$payload.out += "<!--[-->";
    ErrorMarker($$payload, { editor, box });
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  ErrorTooltip($$payload, {
    editor,
    box,
    hasErr,
    parentTop: 0,
    parentLeft: 0,
    children: ($$payload2) => {
      $$payload2.out += `<span${attr("id", id)} role="none">`;
      if (isEditing) {
        $$payload2.out += "<!--[-->";
        $$payload2.out += `<span class="text-component-input"><input type="text" class="text-component-input"${attr("id", `${stringify(id)}-input`)}${attr("value", text)} draggable="true"${attr("placeholder", placeholder)}/> <span class="text-component-width"></span></span>`;
      } else {
        $$payload2.out += "<!--[!-->";
        $$payload2.out += `<span${attr_class(`${stringify(box?.role)} text-box-${stringify(boxType)} text-component-text ${stringify(errorCls)}`)}${attr("tabindex", tabindex)} contenteditable="true" spellcheck="false"${attr("id", `${stringify(id)}-span`)} role="textbox">`;
        if (!!text && text.length > 0) {
          $$payload2.out += "<!--[-->";
          $$payload2.out += `<span${attr_class(clsx(errorCls))}>${escape_html(text)}</span>`;
        } else {
          $$payload2.out += "<!--[!-->";
          $$payload2.out += `<span${attr_class(`${stringify(placeHolderStyle)} ${stringify(errorCls)}`)}>${escape_html(placeholder)}</span>`;
        }
        $$payload2.out += `<!--]--></span>`;
      }
      $$payload2.out += `<!--]--></span>`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!---->`;
  bind_props($$props, { isEditing, text, setFocus });
  pop();
}
function ArrowForward($$payload) {
  $$payload.out += `<svg class="reference-arrow" xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 0 24 24" width="12px" fill="#5f6368"><path d="M0 0h24v24H0z" fill="none"></path><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"></path></svg>`;
}
function TextDropdownComponent($$payload, $$props) {
  push();
  const LOGGER2 = TEXTDROPDOWN_LOGGER;
  let { editor, box } = $$props;
  let textBox = box.textBox;
  let selectAbleReference = false;
  onMount(() => {
    LOGGER2.log(`${box.id}: onMount`);
    box.setFocus = setFocus;
    box.refreshComponent = refresh;
    selectAbleReference = isReferenceBox(box) && box.isSelectAble();
  });
  let id = "";
  id = !isNullOrUndefined(box) ? componentId(box) : "textdropdown-with-unknown-box";
  let isEditing = false;
  let dropdownShown = false;
  let text = "";
  let selected = void 0;
  let filteredOptions = [];
  let allOptions;
  let textComponent;
  let setText = (value) => {
    LOGGER2.log(`${box.id}: setting text to '${value}'`);
    if (isNullOrUndefined(value)) {
      text = "";
    } else {
      text = value;
    }
  };
  const noOptionsId = "noOptions";
  let getOptions = () => {
    LOGGER2.log("getOptions for " + box?.id);
    let result = box?.getOptions(editor);
    if (isNullOrUndefined(result)) {
      result = [
        { id: noOptionsId, label: "<no known options>" }
      ];
    }
    return result;
  };
  const setFocus = () => {
    LOGGER2.log("TextDropdownComponent.setFocus " + box.kind + id);
    if (!isNullOrUndefined(textComponent)) {
      textComponent.setFocus();
    } else {
      LOGGER2.error("TextDropdownComponent " + id + " has no textComponent");
    }
  };
  function setTextLocalAndInBox(text2) {
    box.textHelper.setText(text2);
    setText(text2);
  }
  const setFiltered = (options) => {
    LOGGER2.log(`setFiltered ${options.map((o) => o.label)}`);
    filteredOptions = options;
  };
  const refresh = (why) => {
    LOGGER2.log(`${box.id}: refresh: ` + why + " for " + box?.kind);
    if (isSelectBox(box)) {
      let selectedOption = box.getSelectedOption();
      LOGGER2.log("    selectedOption is " + selectedOption?.label);
      if (!isNullOrUndefined(selectedOption)) {
        setTextLocalAndInBox(selectedOption.label);
        selected = selectedOption;
      } else {
        selected = void 0;
      }
    }
    if (isReferenceBox(box)) {
      selectAbleReference = box.isSelectAble();
      LOGGER2.log("     selectAble is " + selectAbleReference);
    }
  };
  const textUpdate = (details) => {
    LOGGER2.log(`textUpdate for ${box.kind}: ${JSON.stringify(details)}, start: ${text.substring(0, details.caret)}`);
    if (!dropdownShown) {
      showDropdown();
    }
    allOptions = getOptions();
    setFiltered(allOptions.filter((o) => o.label.startsWith(text.substring(0, details.caret))));
    makeFilteredOptionsUnique();
    LOGGER2.log(`textUpdate: (${filteredOptions.length}, ${filteredOptions[0]?.label}, ${filteredOptions[0]?.label?.length}`);
    if (filteredOptions.length === 1 && filteredOptions[0].label === text && filteredOptions[0].label.length === details.caret) {
      storeOrExecute(filteredOptions[0]);
      return;
    }
    if (isActionBox(box)) {
      const result = box.tryToMatchRegExpAndExecuteAction(text, editor);
      if (result === BehaviorExecutionResult.EXECUTED) {
        endEditing();
      }
    }
  };
  const caretChanged = (details) => {
    LOGGER2.log(`caretChanged for ${box.kind}: ` + JSON.stringify(details) + ", start: " + text.substring(0, details.caret));
    allOptions = getOptions();
    setFiltered(allOptions.filter((o) => o.label.startsWith(text.substring(0, details.caret))));
    makeFilteredOptionsUnique();
  };
  const hideDropdown = () => {
    dropdownShown = false;
  };
  const showDropdown = () => {
    dropdownShown = true;
  };
  function makeFilteredOptionsUnique() {
    const seen = [];
    const result = [];
    filteredOptions.forEach((option) => {
      if (seen.includes(option.label)) {
        LOGGER2.log("Option " + JSON.stringify(option) + " is a duplicate");
      } else {
        seen.push(option.label);
        result.push(option);
      }
    });
    setFiltered(result);
  }
  const itemSelected = (sel) => {
    LOGGER2.log("itemSelected " + selected?.id);
    const index = filteredOptions.findIndex((o) => o === sel);
    if (index >= 0 && index < filteredOptions.length) {
      const chosenOption = filteredOptions[index];
      if (!isNullOrUndefined(chosenOption)) {
        storeOrExecute(chosenOption);
      }
    }
    if (!isSelectBox(box)) {
      setTextLocalAndInBox("");
    }
    isEditing = false;
    hideDropdown();
  };
  const startEditing = (details) => {
    LOGGER2.log("startEditing detail: " + JSON.stringify(details) + ` dropDown: ${dropdownShown}`);
    isEditing = true;
    showDropdown();
    allOptions = getOptions();
    LOGGER2.log(`    startEditing allOptions ${allOptions.map((o) => o.label)} dropDown: ${dropdownShown}`);
    if (!isNullOrUndefined(details)) {
      if (isNullOrUndefined(text) || text.length === 0) {
        setFiltered(allOptions.filter(() => true));
      } else {
        setFiltered(allOptions.filter((o) => {
          LOGGER2.log(`    startsWith text [${text}], option is ${JSON.stringify(o)}`);
          return o?.label?.startsWith(text.substring(0, details.caret));
        }));
      }
    } else {
      setFiltered(allOptions.filter((o) => o?.label?.startsWith(text.substring(0, 0))));
    }
    makeFilteredOptionsUnique();
  };
  function storeOrExecute(selected2) {
    LOGGER2.log("storeOrExecute for option " + selected2.label + " " + box.kind + " " + box.role);
    isEditing = false;
    hideDropdown();
    box.executeOption(editor, selected2);
    if (isActionBox(box)) {
      setTextLocalAndInBox("");
    } else {
      editor.selectNextLeaf(box);
    }
  }
  const endEditing = () => {
    LOGGER2.log("endEditing " + id + " dropdownShow:" + dropdownShown + " isEditing: " + isEditing);
    isEditing = false;
    if (dropdownShown) {
      allOptions = getOptions();
      let validOption = allOptions.find((o) => o.label === text);
      if (!!validOption && validOption.id !== noOptionsId) {
        storeOrExecute(validOption);
      } else {
        setText(textBox.getText());
      }
      hideDropdown();
    } else {
      setText(textBox.getText());
    }
  };
  const focusOutTextComponent = () => {
    LOGGER2.log("focusOutTextComponent " + id);
    selected = void 0;
    if (isEditing) {
      endEditing();
    }
  };
  function fromInner(eventType, details) {
    switch (eventType) {
      case "showDropdown": {
        showDropdown();
        break;
      }
      case "hideDropdown": {
        hideDropdown();
        break;
      }
      case "startEditing": {
        startEditing(details);
        break;
      }
      case "caretChanged": {
        caretChanged(details);
        break;
      }
      case "textUpdate": {
        textUpdate(details);
        break;
      }
      case "endEditing": {
        endEditing();
        break;
      }
      case "focusOutTextComponent": {
        focusOutTextComponent();
        break;
      }
    }
  }
  refresh();
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out += `<span${attr("id", id)} tabindex="-1" class="text-dropdown-component" role="none">`;
    TextComponent($$payload2, {
      editor,
      box: textBox,
      partOfDropdown: true,
      toParent: fromInner,
      get isEditing() {
        return isEditing;
      },
      set isEditing($$value) {
        isEditing = $$value;
        $$settled = false;
      },
      get text() {
        return text;
      },
      set text($$value) {
        text = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----> `;
    if (selectAbleReference) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<button class="reference-button"${attr("id", id)} tabindex="-1">`;
      ArrowForward($$payload2);
      $$payload2.out += `<!----></button>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (dropdownShown) {
      $$payload2.out += "<!--[-->";
      DropdownComponent($$payload2, {
        selectionChanged: itemSelected,
        get selected() {
          return selected;
        },
        set selected($$value) {
          selected = $$value;
          $$settled = false;
        },
        get options() {
          return filteredOptions;
        },
        set options($$value) {
          filteredOptions = $$value;
          $$settled = false;
        }
      });
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></span>`;
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  pop();
}
function SvgComponent($$payload, $$props) {
  push();
  let { box } = $$props;
  let id = "";
  let svgPath = "";
  let portWidth = 0;
  let portHeight = 0;
  let viewBoxWidth = 0;
  let viewBoxHeight = 0;
  let css = "";
  onMount(() => {
    box.refreshComponent = refresh;
  });
  const refresh = (why) => {
    LABEL_LOGGER.log("Refresh SVG component " + why);
    id = !isNullOrUndefined(box) ? componentId(box) : "SVG-for-unknown-box";
    svgPath = box.svgPath;
    portWidth = box.viewPortWidth;
    portHeight = box.viewPortHeight;
    viewBoxWidth = box.viewBoxWidth;
    viewBoxHeight = box.viewBoxHeight;
    css = box.cssClass;
  };
  refresh();
  $$payload.out += `<svg${attr_class(clsx(css))}${attr("width", portWidth)}${attr("height", portHeight)}${attr("viewBox", `0 0 ${stringify(viewBoxWidth)} ${stringify(viewBoxHeight)}`)}${attr("id", id)}><path${attr("d", svgPath)}${attr_style(box.cssStyle)}></path></svg>`;
  pop();
}
function ElementComponent($$payload, $$props) {
  push();
  let { editor, box } = $$props;
  let childBox = void 0;
  if (!isNullOrUndefined(childBox)) {
    $$payload.out += "<!--[-->";
    RenderComponent($$payload, { box: childBox, editor });
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function BooleanInnerSwitchComponent($$payload, $$props) {
  push();
  let { editor, box } = $$props;
  let value = box.getBoolean();
  let id = box.id;
  onMount(() => {
    value = box.getBoolean();
  });
  $$payload.out += `<span class="inner-switch-component"><button${attr("id", id)} role="switch"${attr("aria-checked", value)}${attr("aria-labelledby", `switch-${id}`)}><span>${escape_html(box.labels.yes)}</span> <span>${escape_html(box.labels.no)}</span></button></span>`;
  pop();
}
function NumericSliderComponent($$payload, $$props) {
  push();
  let { editor, box } = $$props;
  let id = box.id;
  let value = box.getNumber();
  let min = box.displayInfo.min;
  let max = box.displayInfo.max;
  let step = box.displayInfo.step;
  let showMarks = box.displayInfo.showMarks;
  onMount(() => {
    value = box.getNumber();
  });
  $$payload.out += `<span class="numeric-slider-component"${attr("id", id)}><md-slider labeled=""${attr("ticks", showMarks)}${attr("min", min)}${attr("max", max)}${attr("step", step)}${attr("value", value)}${attr("draggable", true)} role="slider"${attr("aria-valuenow", value)}${attr("tabindex", 0)}></md-slider></span>`;
  pop();
}
function LimitedCheckboxComponent($$payload, $$props) {
  push();
  let { editor, box } = $$props;
  let id = box.id;
  let currentNames = box.getNames();
  let myEnum = box.getPossibleNames();
  let ariaLabel = "toBeDone";
  let isHorizontal = false;
  function isChecked(nn) {
    return currentNames.includes(nn);
  }
  onMount(() => {
    currentNames = box.getNames();
  });
  const each_array = ensure_array_like(myEnum);
  $$payload.out += `<span role="group"${attr("aria-labelledby", ariaLabel)}${attr("id", id)}${attr_class("limited-checkbox-component-group", void 0, {
    "limited-checkbox-component-vertical": !isHorizontal
  })}><!--[-->`;
  for (let i = 0, $$length = each_array.length; i < $$length; i++) {
    let nn = each_array[i];
    $$payload.out += `<span class="limited-checkbox-component-single"><md-checkbox${attr("id", `${stringify(id)}-${stringify(nn)}-${stringify(i)}`)}${attr("value", nn)}${attr("checked", isChecked(nn), true)}${attr("aria-label", `checkbox-${stringify(nn)}`)} role="checkbox"${attr("aria-checked", isChecked(nn))}${attr("tabindex", 0)}></md-checkbox> <label${attr("for", `${stringify(id)}-${stringify(nn)}-${stringify(i)}`)} class="limited-checkbox-component-label">${escape_html(nn)}</label></span>`;
  }
  $$payload.out += `<!--]--></span>`;
  pop();
}
function LimitedRadioComponent($$payload, $$props) {
  push();
  let { editor, box } = $$props;
  let id = box.id;
  let myEnum = box.getPossibleNames();
  let currentValue = box.getNames()[0];
  let ariaLabel = "toBeDone";
  let isHorizontal = false;
  onMount(() => {
    currentValue = box.getNames()[0];
  });
  const each_array = ensure_array_like(myEnum);
  $$payload.out += `<span role="radiogroup"${attr("aria-labelledby", ariaLabel)}${attr("id", id)}${attr_class("limited-radio-component-group", void 0, {
    "limited-radio-component-vertical": !isHorizontal
  })}><!--[-->`;
  for (let i = 0, $$length = each_array.length; i < $$length; i++) {
    let nn = each_array[i];
    $$payload.out += `<span class="limited-radio-component-single"><md-radio${attr("id", `${stringify(id)}-${stringify(nn)}-${stringify(i)}`)}${attr("name", `${stringify(id)}-group`)} role="radio" tabindex="0"${attr("aria-checked", currentValue === nn)}${attr("value", nn)}${attr("checked", currentValue === nn, true)}${attr("aria-label", `radio-control-${stringify(nn)}`)}></md-radio> <label class="limited-radio-component-label"${attr("for", `${stringify(id)}-${stringify(nn)}-${stringify(i)}`)}>${escape_html(nn)}</label></span>`;
  }
  $$payload.out += `<!--]--></span>`;
  pop();
}
function BooleanSwitchComponent($$payload, $$props) {
  push();
  const LOGGER2 = SWITCH_LOGGER;
  let { editor, box } = $$props;
  let id = !isNullOrUndefined(box) ? componentId(box) : "switch-for-unknown-box";
  let value = box.getBoolean();
  let switchElement;
  async function setFocus() {
    switchElement.focus();
  }
  const refresh = (why) => {
    LOGGER2.log("REFRESH BooleanControlBox: " + why);
    value = box.getBoolean();
  };
  onMount(() => {
    value = box.getBoolean();
    box.setFocus = setFocus;
    box.refreshComponent = refresh;
  });
  $$payload.out += `<span class="switch-component"><button${attr("id", id)} role="switch"${attr("aria-checked", value)}${attr("aria-labelledby", `switch-${id}`)}></button></span>`;
  pop();
}
function ButtonComponent($$payload, $$props) {
  push();
  let { editor, box } = $$props;
  const LOGGER2 = BUTTON_LOGGER;
  LOGGER2.show();
  let id = box.id;
  $$payload.out += `<button${attr_class(`button-component-ripple button-component ${stringify(box.role)}`, void 0, {
    "button-component-empty": box.text.length === 0
  })}${attr("id", id)}><span>${escape_html(box.text)}</span></button>`;
  pop();
}
function RenderComponent($$payload, $$props) {
  push();
  let { editor, box } = $$props;
  let id = "";
  let element = void 0;
  let selectedCls = "";
  let errorCls = "";
  let errMess = [];
  let ExternalComponent = void 0;
  if (isElementBox(box)) {
    $$payload.out += "<!--[-->";
    ElementComponent($$payload, { box, editor });
  } else {
    $$payload.out += "<!--[!-->";
    if (errMess.length > 0 && !isNullOrUndefined(element)) {
      $$payload.out += "<!--[-->";
      ErrorMarker($$payload, { box, editor });
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]-->  <span${attr("id", id)}${attr_class(`render-component ${stringify(errorCls)} ${stringify(selectedCls)} `)} role="group">`;
    if (box === null || box === void 0) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="error">[BOX IS NULL OR UNDEFINED]</p>`;
    } else if (isBooleanControlBox(box) && box.showAs === BoolDisplay.CHECKBOX) {
      $$payload.out += "<!--[1-->";
      BooleanCheckboxComponent($$payload, { box, editor });
    } else if (isBooleanControlBox(box) && box.showAs === BoolDisplay.RADIO_BUTTON) {
      $$payload.out += "<!--[2-->";
      BooleanRadioComponent($$payload, { box, editor });
    } else if (isBooleanControlBox(box) && box.showAs === BoolDisplay.SWITCH) {
      $$payload.out += "<!--[3-->";
      BooleanSwitchComponent($$payload, { box, editor });
    } else if (isBooleanControlBox(box) && box.showAs === BoolDisplay.INNER_SWITCH) {
      $$payload.out += "<!--[4-->";
      BooleanInnerSwitchComponent($$payload, { box, editor });
    } else if (isNumberControlBox(box)) {
      $$payload.out += "<!--[5-->";
      NumericSliderComponent($$payload, { box, editor });
    } else if (isLimitedControlBox(box) && box.showAs === LimitedDisplay.RADIO_BUTTON) {
      $$payload.out += "<!--[6-->";
      LimitedRadioComponent($$payload, { box, editor });
    } else if (isLimitedControlBox(box) && box.showAs === LimitedDisplay.CHECKBOX) {
      $$payload.out += "<!--[7-->";
      LimitedCheckboxComponent($$payload, { box, editor });
    } else if (isButtonBox(box)) {
      $$payload.out += "<!--[8-->";
      ButtonComponent($$payload, { box, editor });
    } else if (isExternalBox(box)) {
      $$payload.out += "<!--[9-->";
      if (!isNullOrUndefined(ExternalComponent)) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<!---->`;
        ExternalComponent($$payload, { box, editor });
        $$payload.out += `<!---->`;
      } else {
        $$payload.out += "<!--[!-->";
        $$payload.out += `<p class="render-component-error">[UNKNOWN EXTERNAL BOX TYPE: ${escape_html(box.externalComponentName)}]</p>`;
      }
      $$payload.out += `<!--]-->`;
    } else if (isFragmentBox(box)) {
      $$payload.out += "<!--[10-->";
      FragmentComponent($$payload, { box, editor });
    } else if (isGridBox(box)) {
      $$payload.out += "<!--[11-->";
      GridComponent($$payload, { box, editor });
    } else if (isIndentBox(box)) {
      $$payload.out += "<!--[12-->";
      IndentComponent($$payload, { box, editor });
    } else if (isLabelBox(box)) {
      $$payload.out += "<!--[13-->";
      LabelComponent($$payload, { box, editor });
    } else if (isLayoutBox(box)) {
      $$payload.out += "<!--[14-->";
      LayoutComponent($$payload, { box, editor });
    } else if (isListBox(box)) {
      $$payload.out += "<!--[15-->";
      ListComponent($$payload, { box, editor });
    } else if (isOptionalBox2(box)) {
      $$payload.out += "<!--[16-->";
      OptionalComponent($$payload, { box, editor });
    } else if (isSvgBox(box)) {
      $$payload.out += "<!--[17-->";
      SvgComponent($$payload, { box, editor });
    } else if (isTableBox(box)) {
      $$payload.out += "<!--[18-->";
      TableComponent($$payload, { box, editor });
    } else if (isTextBox(box)) {
      $$payload.out += "<!--[19-->";
      TextComponent($$payload, {
        box,
        editor,
        partOfDropdown: false,
        text: "",
        isEditing: false,
        toParent: () => {
        }
      });
    } else if (isMultiLineTextBox(box)) {
      $$payload.out += "<!--[20-->";
      MultiLineTextComponent($$payload, { box, editor });
    } else if (isActionBox(box) || isSelectBox(box) || isReferenceBox(box)) {
      $$payload.out += "<!--[21-->";
      TextDropdownComponent($$payload, { box, editor });
    } else if (isEmptyLineBox(box)) {
      $$payload.out += "<!--[22-->";
      EmptyLineComponent($$payload, { box, editor });
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<p class="render-component-unknown-box">[UNKNOWN BOX TYPE: ${escape_html(box["kind"])}]</p>`;
    }
    $$payload.out += `<!--]--></span>`;
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function FragmentComponent($$payload, $$props) {
  push();
  let { editor, box } = $$props;
  let id = "";
  let childBox = void 0;
  let cssClass = "";
  if (!isNullOrUndefined(childBox)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span${attr_class(`fragment-component ${stringify(cssClass)}`)}${attr("id", id)}>`;
    RenderComponent($$payload, { box: childBox, editor });
    $$payload.out += `<!----></span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function FreonComponent($$payload, $$props) {
  push();
  let LOGGER2 = FREON_LOGGER;
  let { editor } = $$props;
  let rootBox = dummyBox;
  let id = (
    // an id for the html element showing the rootBox
    rootBox && rootBox !== dummyBox ? componentId(rootBox) : "freon-component-with-unknown-box"
  );
  const refreshSelection = async (why) => {
    LOGGER2.log("FreonComponent.refreshSelection: " + why + " editor selectedBox is " + editor?.selectedBox?.kind);
    if (!isNullOrUndefined(editor.selectedBox)) {
      await tick();
      getSelectableChildren(editor.selectedBox);
      editor.selectedBox.setFocus();
    }
  };
  function getSelectableChildren(box) {
    const result = [];
    if (isTableRowBox(box)) {
      for (const child of box.children) {
        result.push(...getSelectableChildren(child));
      }
    } else if (isElementBox(box)) {
      result.push(...getSelectableChildren(box.content));
    } else {
      result.push(box);
    }
    return result;
  }
  const refreshRootBox = (why) => {
    rootBox = editor.rootBox;
    LOGGER2.log("REFRESH " + why + " ==================> FreonComponent with rootbox " + rootBox?.id + " unit " + (!isNullOrUndefined(rootBox?.node) ? rootBox.node["name"] : "undefined"));
  };
  refreshRootBox("Initialize FreonComponent");
  refreshSelection("Initialize FreonComponent");
  head($$payload, ($$payload2) => {
    $$payload2.out += `<link href="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.css" rel="stylesheet"/> <script src="https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js"><\/script>`;
  });
  $$payload.out += `<div class="freon-component"${attr("id", id)} role="group"><div class="gutter"></div> <div class="editor-component">`;
  RenderComponent($$payload, { editor, box: rootBox });
  $$payload.out += `<!----></div></div>  `;
  ContextMenu($$payload, { editor });
  $$payload.out += `<!---->`;
  pop();
}
new FreLogger("EditorRequestsHandler");
function Study($$payload, $$props) {
  push();
  let { id } = $$props;
  let study = void 0;
  let editorLoaded = false;
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
          editorLoaded = true;
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
    editorLoaded = false;
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
    $$payload.out += `<div class="crc-container"><div class="crc-card">`;
    StudyCard($$payload, { study });
    $$payload.out += `<!----></div> <div class="crc-content">`;
    Tabs($$payload, {
      tabStyle: "underline",
      class: "crc-tab",
      children: ($$payload2) => {
        TabItem($$payload2, {
          open: true,
          title: "Patients",
          class: "tab-item",
          children: ($$payload3) => {
            $$payload3.out += `<div class="crc-grid inside-tab">`;
            PatientGrid($$payload3, { studyId: study.id });
            $$payload3.out += `<!----></div>`;
          },
          $$slots: {
            default: true,
            title: ($$payload3) => {
              $$payload3.out += `<div slot="title" class="flex items-center gap-2">`;
              FontAwesomeIcon($$payload3, { icon: faUser, class: "w-4 h-4" });
              $$payload3.out += `<!---->Patients</div>`;
            }
          }
        });
        $$payload2.out += `<!----> `;
        TabItem($$payload2, {
          title: "Study Design",
          class: "tab-item",
          children: ($$payload3) => {
            if (editorLoaded) {
              $$payload3.out += "<!--[-->";
              Toolbar($$payload3, {
                class: "toolbar",
                children: ($$payload4) => {
                  ToolbarButton($$payload4, {
                    class: "toolbar-button",
                    children: ($$payload5) => {
                      FontAwesomeIcon($$payload5, { icon: faSave });
                    },
                    $$slots: { default: true }
                  });
                  $$payload4.out += `<!----> `;
                  ToolbarButton($$payload4, {
                    class: "toolbar-button",
                    children: ($$payload5) => {
                      FontAwesomeIcon($$payload5, { icon: faUndo });
                    },
                    $$slots: { default: true }
                  });
                  $$payload4.out += `<!----> `;
                  ToolbarButton($$payload4, {
                    class: "toolbar-button",
                    children: ($$payload5) => {
                      FontAwesomeIcon($$payload5, { icon: faRedo });
                    },
                    $$slots: { default: true }
                  });
                  $$payload4.out += `<!---->`;
                },
                $$slots: { default: true }
              });
              $$payload3.out += `<!----> <div class="crc-editor crc-content-width">`;
              FreonComponent($$payload3, { editor: dslEditor });
              $$payload3.out += `<!----></div> <div class="crc-editor-footer h-8 crc-content-width">`;
              DSLFooter($$payload3, {
                items: footerItems,
                onCheckboxChange: handleCheckboxChange
              });
              $$payload3.out += `<!----></div>`;
            } else {
              $$payload3.out += "<!--[!-->";
              $$payload3.out += `<div class="h-full crc-content-width">`;
              ListPlaceholder($$payload3, {
                divClass: "p-4 space-y-4 mr-1 rounded border border-gray-200 divide-y divide-gray-200 shadow animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700"
              });
              $$payload3.out += `<!----></div>`;
            }
            $$payload3.out += `<!--]-->`;
          },
          $$slots: {
            default: true,
            title: ($$payload3) => {
              $$payload3.out += `<div slot="title" class="flex items-center gap-2">`;
              FontAwesomeIcon($$payload3, { icon: faSwatchbook, class: "w-4 h-4" });
              $$payload3.out += `<!---->Study Design</div>`;
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
    Skeleton($$payload, { size: "sm", divClass: "my-8" });
  }
  $$payload.out += `<!--]-->`;
  pop();
}
export {
  DeleteObjectDialog as D,
  FreonComponent as F,
  GridHeader as G,
  PatientGrid as P,
  Study as S,
  getDrawer as a,
  addDrawer as b,
  currentRoute as c,
  drawerStore as d,
  getDrawerWidth as g,
  navigateTo as n,
  setDrawerVisibility as s
};
