import { F as escape_html, B as pop, z as push } from "../../chunks/index.js";
import "clsx";
import { u as updated, s as stores, p as page$2 } from "../../chunks/client.js";
const page$1 = {
  get data() {
    return page$2.data;
  },
  get error() {
    return page$2.error;
  },
  get form() {
    return page$2.form;
  },
  get params() {
    return page$2.params;
  },
  get route() {
    return page$2.route;
  },
  get state() {
    return page$2.state;
  },
  get status() {
    return page$2.status;
  },
  get url() {
    return page$2.url;
  }
};
({
  get current() {
    return updated.current;
  },
  check: stores.updated.check
});
const page = page$1;
function Error$1($$payload, $$props) {
  push();
  $$payload.out += `<h1>${escape_html(page.status)}</h1> <p>${escape_html(page.error?.message)}</p>`;
  pop();
}
export {
  Error$1 as default
};
