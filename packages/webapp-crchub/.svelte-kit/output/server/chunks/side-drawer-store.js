import { M as attr_class, N as stringify, V as props_id, W as spread_attributes, B as pop, z as push, G as spread_props } from "./index.js";
import * as popover from "@zag-js/popover";
import { t as toStyleString, u as useMachine, n as normalizeProps } from "./Tooltip.svelte_svelte_type_style_lang.js";
import { mergeProps as mergeProps$1 } from "@zag-js/core";
import { I as Icon } from "./utils.js";
import { g as get, w as writable } from "./index3.js";
const CSS_REGEX = /((?:--)?(?:\w+-?)+)\s*:\s*([^;]*)/g;
const serialize = (style) => {
  const res = {};
  let match;
  while (match = CSS_REGEX.exec(style)) {
    res[match[1]] = match[2];
  }
  return res;
};
function mergeProps(...args) {
  const merged = mergeProps$1(...args);
  if ("style" in merged) {
    if (typeof merged.style === "string") {
      merged.style = serialize(merged.style);
    }
    merged.style = toStyleString(merged.style);
  }
  return merged;
}
function AppBar($$payload, $$props) {
  const {
    // Root
    base = "w-full flex flex-col",
    background = "bg-surface-100-900",
    spaceY = "space-y-4",
    border = "",
    padding = "p-4",
    shadow = "",
    classes = "",
    // Toolbar
    toolbarBase = "flex justify-between",
    toolbarGridCols = "grid-cols-[auto_1fr_auto]",
    toolbarGap = "gap-4",
    toolbarClasses = "",
    // Lead
    leadBase = "flex",
    leadSpaceX = "space-x-4 rtl:space-x-reverse",
    leadPadding = "",
    leadClasses = "",
    // Center
    centerBase = "grow",
    centerAlign = "text-center",
    centerPadding = "",
    centerClasses = "",
    // Trail
    trailBase = "flex",
    trailSpaceX = "space-x-4 rtl:space-x-reverse",
    trailPadding = "",
    trailClasses = "",
    // Headline
    headlineBase = "w-full",
    headlineClasses = "",
    // Snippets
    children,
    lead,
    trail,
    headline
  } = $$props;
  $$payload.out += `<header${attr_class(`${stringify(base)} ${stringify(background)} ${stringify(spaceY)} ${stringify(border)} ${stringify(padding)} ${stringify(shadow)} ${stringify(classes)}`)} role="toolbar" data-testid="app-bar"><section${attr_class(`${stringify(toolbarBase)} ${stringify(toolbarGridCols)} ${stringify(toolbarGap)} ${stringify(toolbarClasses)}`)} data-testid="app-bar-toolbar">`;
  if (lead) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div${attr_class(`${stringify(leadBase)} ${stringify(leadSpaceX)} ${stringify(leadPadding)} ${stringify(leadClasses)}`)}>`;
    lead($$payload);
    $$payload.out += `<!----></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (children) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div${attr_class(`${stringify(centerBase)} ${stringify(centerAlign)} ${stringify(centerPadding)} ${stringify(centerClasses)}`)}>`;
    children($$payload);
    $$payload.out += `<!----></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (trail) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div${attr_class(`${stringify(trailBase)} ${stringify(trailSpaceX)} ${stringify(trailPadding)} ${stringify(trailClasses)}`)}>`;
    trail($$payload);
    $$payload.out += `<!----></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></section> `;
  if (headline) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<section${attr_class(`${stringify(headlineBase)} ${stringify(headlineClasses)}`)} data-testid="app-bar-headline">`;
    headline($$payload);
    $$payload.out += `<!----></section>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></header>`;
}
function Popover($$payload, $$props) {
  push();
  const id = props_id($$payload);
  const {
    arrow = false,
    zIndex = "auto",
    // Base
    base = "",
    classes = "",
    // Trigger
    triggerBase = "",
    triggerBackground = "",
    triggerClasses = "",
    triggerAriaLabel = "",
    // Positioner
    positionerBase = "",
    positionerClasses = "",
    // Content
    contentBase = "",
    contentBackground = "",
    contentClasses = "",
    // Arrow
    arrowBase = "",
    arrowBackground = "!bg-surface-200 dark:!bg-surface-800",
    arrowClasses = "",
    // Snippets
    trigger,
    content,
    // Events
    onclick,
    $$slots,
    $$events,
    // Zag ---
    ...zagProps
  } = $$props;
  const service = useMachine(popover.machine, () => ({ id, ...zagProps }));
  const api = popover.connect(service, normalizeProps);
  const triggerProps = mergeProps(api.getTriggerProps(), { onclick });
  $$payload.out += `<span${attr_class(`${stringify(base)} ${stringify(classes)}`)} data-testid="popover">`;
  if (trigger) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<button${spread_attributes(
      {
        ...triggerProps,
        class: `${stringify(triggerBase)} ${stringify(triggerBackground)} ${stringify(triggerClasses)}`,
        type: "button",
        "aria-label": triggerAriaLabel
      }
    )}>`;
    trigger($$payload);
    $$payload.out += `<!----></button>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div${spread_attributes(
    {
      ...api.getPositionerProps(),
      class: `${stringify(positionerBase)} ${stringify(positionerClasses)}`
    }
  )}>`;
  if (api.open) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div${spread_attributes(
      {
        ...api.getContentProps(),
        style: `z-index: ${stringify(zIndex)};`
      }
    )}>`;
    if (arrow) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div${spread_attributes({ ...api.getArrowProps() })}><div${spread_attributes(
        {
          ...api.getArrowTipProps(),
          class: `${stringify(arrowBase)} ${stringify(arrowBackground)} ${stringify(arrowClasses)}`
        }
      )}></div></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div${attr_class(`${stringify(contentBase)} ${stringify(contentBackground)} ${stringify(contentClasses)}`)}>`;
    content?.($$payload);
    $$payload.out += `<!----></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></span>`;
  pop();
}
function Save($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "path",
      {
        "d": "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
      }
    ],
    [
      "path",
      {
        "d": "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"
      }
    ],
    ["path", { "d": "M7 3v4a1 1 0 0 0 1 1h7" }]
  ];
  Icon($$payload, spread_props([
    { name: "save" },
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
function X($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    ["path", { "d": "M18 6 6 18" }],
    ["path", { "d": "m6 6 12 12" }]
  ];
  Icon($$payload, spread_props([
    { name: "x" },
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
const drawerStore = writable({
  drawers: {},
  activeDrawer: null,
  drawerOrder: []
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
  drawerStore.update((store) => {
    const newOrder = store.drawerOrder.includes(drawer.key) ? store.drawerOrder : [...store.drawerOrder, drawer.key];
    return {
      ...store,
      drawers: {
        ...store.drawers,
        [drawer.key]: {
          ...drawer,
          width: drawer.defaultWidth,
          isVisible: false
        }
      },
      drawerOrder: newOrder
    };
  });
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
function getDrawerOrder() {
  return get(drawerStore).drawerOrder;
}
export {
  AppBar as A,
  Popover as P,
  Save as S,
  X,
  getDrawerOrder as a,
  getDrawer as b,
  addDrawer as c,
  drawerStore as d,
  setDrawerVisibility as e,
  getActiveDrawer as f,
  getDrawerWidth as g,
  setActiveDrawer as h,
  setDrawerProps as s
};
