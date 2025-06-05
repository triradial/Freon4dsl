import { P as store_get, S as unsubscribe_stores, I as pop, F as push } from "../../../../chunks/environment.js";
import { p as page } from "../../../../chunks/stores.js";
import { P as Patient } from "../../../../chunks/Patient.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  Patient($$payload, {
    id: store_get($$store_subs ??= {}, "$page", page).params.id
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
