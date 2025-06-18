import { z as push, V as props_id, W as spread_attributes, I as stringify, G as attr_class, B as pop, Q as attr_style, J as spread_props } from "./index.js";
import * as tabs from "@zag-js/tabs";
import { u as useMachine, n as normalizeProps, s as setTabContext, g as getTabContext } from "./Tooltip.svelte_svelte_type_style_lang.js";
import { I as Icon } from "./utils.js";
import "clsx";
import { s as stores } from "./client.js";
function Tabs$1($$payload, $$props) {
  push();
  const id = props_id($$payload);
  const {
    fluid = false,
    // Root
    base = "w-full",
    classes = "",
    // List
    listBase = "flex",
    listJustify = "justify-start",
    listBorder = "border-b-[1px] border-surface-200-800",
    listMargin = "mb-4",
    listGap = "gap-2",
    listClasses = "",
    // Content
    contentBase = "",
    contentClasses = "",
    // Snippets
    list,
    content,
    $$slots,
    $$events,
    // Zag
    ...zagProps
  } = $$props;
  const service = useMachine(tabs.machine, () => ({ id, ...zagProps }));
  const api = tabs.connect(service, normalizeProps);
  setTabContext({
    get api() {
      return api;
    },
    get fluid() {
      return fluid;
    }
  });
  $$payload.out += `<div${spread_attributes(
    {
      ...api.getRootProps(),
      class: `${stringify(base)} ${stringify(classes)}`,
      "data-testid": "tabs"
    }
  )}><div${spread_attributes(
    {
      ...api.getListProps(),
      class: `${stringify(listBase)} ${stringify(listJustify)} ${stringify(listBorder)} ${stringify(listMargin)} ${stringify(listGap)} ${stringify(listClasses)}`,
      "data-testid": "tabs-list"
    }
  )}>`;
  list?.($$payload);
  $$payload.out += `<!----></div> <div${attr_class(`${stringify(contentBase)} ${stringify(contentClasses)}`)} data-testid="tabs-content">`;
  content?.($$payload);
  $$payload.out += `<!----></div></div>`;
  pop();
}
function TabsControl($$payload, $$props) {
  push();
  const {
    // Root
    base = "border-b-[1px] border-transparent",
    padding = "pb-2",
    translateX = "translate-y-[1px]",
    classes = "",
    // Label
    labelBase = "btn hover:preset-tonal-primary",
    labelClasses = "",
    // State
    stateInactive = "[&:not(:hover)]:opacity-50",
    stateActive = "border-b-surface-950-50 opacity-100",
    stateLabelInactive = "",
    stateLabelActive = "",
    // Snippets
    lead,
    children,
    $$slots,
    $$events,
    // Zag
    ...zagProps
  } = $$props;
  const ctx = getTabContext();
  const state = ctx.api.getTriggerState(zagProps);
  const rxActive = state.selected ? stateActive : stateInactive;
  const rxLabelActive = state.selected ? stateLabelActive : stateLabelInactive;
  const commonWidth = ctx.fluid ? "100%" : "";
  $$payload.out += `<button${spread_attributes(
    {
      ...ctx.api.getTriggerProps(zagProps),
      class: `${stringify(base)} ${stringify(padding)} ${stringify(translateX)} ${stringify(rxActive)} ${stringify(classes)}`,
      "data-testid": "tabs-control"
    },
    null,
    void 0,
    { width: commonWidth }
  )}><div${attr_class(`${stringify(labelBase)} ${stringify(rxLabelActive)} ${stringify(labelClasses)}`)} data-testid="tabs-control-label"${attr_style("", { width: commonWidth })}>`;
  if (lead) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span>`;
    lead($$payload);
    $$payload.out += `<!----></span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <span>`;
  children?.($$payload);
  $$payload.out += `<!----></span></div></button>`;
  pop();
}
function TabsPanel($$payload, $$props) {
  push();
  const {
    // Root
    base = "",
    classes = "",
    // Children
    children,
    $$slots,
    $$events,
    // Zag
    ...zagProps
  } = $$props;
  const ctx = getTabContext();
  $$payload.out += `<div${spread_attributes(
    {
      ...ctx.api.getContentProps(zagProps),
      class: `${stringify(base)} ${stringify(classes)}`,
      "data-testid": "tabs-panel"
    }
  )}>`;
  children?.($$payload);
  $$payload.out += `<!----></div>`;
  pop();
}
const Tabs = /* @__PURE__ */ Object.assign(Tabs$1, { Control: TabsControl, Panel: TabsPanel });
function Pencil($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
      }
    ],
    ["path", { "d": "m15 5 4 4" }]
  ];
  Icon($$payload, spread_props([
    { name: "pencil" },
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
const getStores = () => {
  const stores$1 = stores;
  return {
    /** @type {typeof page} */
    page: {
      subscribe: stores$1.page.subscribe
    },
    /** @type {typeof navigating} */
    navigating: {
      subscribe: stores$1.navigating.subscribe
    },
    /** @type {typeof updated} */
    updated: stores$1.updated
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
export {
  Pencil as P,
  Tabs as T,
  page as p
};
