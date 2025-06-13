import "clsx";
import { A as onMount, T as onDestroy, B as pop, z as push } from "../../../chunks/index.js";
import { M as ModelManager, W as WebappConfigurator } from "../../../chunks/model-manager.js";
import { N as Ng } from "../../../chunks/index4.js";
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
    Ng($$payload, { editor: dslEditor });
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="h-full crc-content-width"><div class="placeholder animate-pulse"></div></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
function _page($$payload, $$props) {
  push();
  Availability($$payload);
  pop();
}
export {
  _page as default
};
