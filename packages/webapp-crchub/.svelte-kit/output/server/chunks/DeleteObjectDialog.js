import { g as goto } from "./client.js";
import { F as spread_props, B as pop, z as push, I as attr_class, E as escape_html, P as createEventDispatcher } from "./index.js";
import "clsx";
import "./model-manager.js";
import "./env.js";
import { P as Plus } from "./plus.js";
import { I as Icon } from "./Icon.js";
function Circle_check($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "10" }
    ],
    ["path", { "d": "m9 12 2 2 4-4" }]
  ];
  Icon($$payload, spread_props([
    { name: "circle-check" },
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
function Circle_x($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const iconNode = [
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "10" }
    ],
    ["path", { "d": "m15 9-6 6" }],
    ["path", { "d": "m9 9 6 6" }]
  ];
  Icon($$payload, spread_props([
    { name: "circle-x" },
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
function navigateTo(routeName, id) {
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
  $$payload.out += `<div${attr_class(`card grid-header w-full ${parentId ? "mt-0" : "mt-3"}`)}><div class="flex items-center justify-left"><h3 class="main-label-text mr-2">${escape_html(title)}</h3> <button type="button" class="icon-button primary inverted">`;
  Plus($$payload, { size: "16" });
  $$payload.out += `<!----></button></div></div>`;
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
  $$payload.out += `<div${attr_class("fixed inset-0 z-50 overflow-y-auto", void 0, { "hidden": !open })}><div class="flex min-h-screen items-center justify-center p-4 text-center"><button type="button" class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-label="Close dialog"></button> <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"><div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4"><div class="sm:flex sm:items-start"><div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left"><h3 class="text-lg font-semibold leading-6 text-gray-900">${escape_html(title)}</h3> <div class="mt-2"><p class="text-sm text-gray-500">Are you sure you want to delete this ${escape_html(objectType)}?</p></div></div></div></div> <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6"><button type="button" class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto">`;
  Circle_check($$payload, { color: "green" });
  $$payload.out += `<!---->Yes, I'm sure</button> <button type="button" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">`;
  Circle_x($$payload, { color: "red" });
  $$payload.out += `<!---->No, cancel</button></div></div></div></div>`;
  pop();
}
export {
  DeleteObjectDialog as D,
  GridHeader as G,
  navigateTo as n
};
