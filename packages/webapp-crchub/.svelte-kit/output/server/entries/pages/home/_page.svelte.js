import "clsx";
import { A as onMount, B as pop, z as push } from "../../../chunks/index.js";
import "../../../chunks/model-manager.js";
import "../../../chunks/env.js";
import "ag-grid-community";
import "ag-grid-enterprise";
import "../../../chunks/client.js";
import "../../../chunks/theme-store.js";
function Home($$payload, $$props) {
  push();
  onMount(async () => {
    console.log("Home component mounted");
  });
  $$payload.out += `<div class="crc-grid">Home</div>`;
  pop();
}
function _page($$payload, $$props) {
  push();
  Home($$payload);
  pop();
}
export {
  _page as default
};
