import { P as store_get, G as onMount, Q as head, R as slot, S as unsubscribe_stores, I as pop, T as attr, U as stringify, F as push } from "../../chunks/environment.js";
import { i as isAuthenticated } from "../../chunks/auth.js";
import { u as userStore, d as dataStore } from "../../chunks/data-store.js";
import { t as theme } from "../../chunks/theme-store.js";
import { L as LoginPart } from "../../chunks/LoginPart.js";
function _layout($$payload, $$props) {
  push();
  var $$store_subs;
  let auth = store_get($$store_subs ??= {}, "$isAuthenticated", isAuthenticated);
  onMount(() => {
    auth = sessionStorage.getItem("auth") === "true";
    isAuthenticated.set(auth);
    if (auth) {
      userStore.initializeFromStorage();
      dataStore.initializeDatastore();
    }
  });
  head($$payload, ($$payload2) => {
    $$payload2.out += `<link rel="stylesheet"${attr("href", `/assets/styles/bundle-${stringify(store_get($$store_subs ??= {}, "$theme", theme))}.css`)}/>`;
  });
  if (auth) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<!---->`;
    slot($$payload, $$props, "default", {});
    $$payload.out += `<!---->`;
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
