import { V as createEventDispatcher, I as pop, F as push, P as store_get, S as unsubscribe_stores } from "./environment.js";
import "./auth.js";
import { w as writable } from "./exports.js";
import "clsx";
import { F as FontAwesomeIcon } from "./FontAwesomeIcon.js";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { Toast, Input, Checkbox, Button } from "flowbite-svelte";
import "./client.js";
import { c as copy_payload, a as assign_payload } from "./payload.js";
function ToastWarning($$payload, $$props) {
  push();
  createEventDispatcher();
  Toast($$payload, {
    children: ($$payload2) => {
      FontAwesomeIcon($$payload2, { icon: faCircleExclamation, class: "w-5 h-5" });
      $$payload2.out += `<!----> Incorrect username or password. Please try again.`;
    },
    $$slots: { default: true }
  });
  pop();
}
function LoginPart($$payload, $$props) {
  push();
  var $$store_subs;
  let username = "";
  let password = "";
  let showError = writable(false);
  showError.subscribe((value) => {
    console.log("showError value:", value);
  });
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out += `<div id="login" style="width:24rem"><div><div class="flex justify-center items-center"><img class="w-16 h-16 mr-2" src="/assets/images/logo_grey.svg" alt="logo"/> <h1 style="font-size: 2rem; color: white;"><span class="crc-logo-p1">CRC</span><span class="crc-logo-p2">Hub</span></h1></div> <div class="p-6 space-y-4 md:space-y-6 sm:p-8"><form class="flex flex-col space-y-6">`;
    Input($$payload2, {
      type: "text",
      name: "username",
      placeholder: "username",
      required: true,
      get value() {
        return username;
      },
      set value($$value) {
        username = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----> `;
    Input($$payload2, {
      type: "password",
      name: "password",
      placeholder: "password",
      required: true,
      get value() {
        return password;
      },
      set value($$value) {
        password = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----> <div class="flex items-start">`;
    Checkbox($$payload2, {
      class: "text-white-500 dark:text-white-500",
      children: ($$payload3) => {
        $$payload3.out += `<!---->Remember me`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----> <a href="/" class="ml-auto text-sm text-white-500 hover:underline dark:text-white-500">Forgot password?</a></div> `;
    Button($$payload2, {
      type: "submit",
      class: "w-full",
      children: ($$payload3) => {
        $$payload3.out += `<!---->Sign in`;
      },
      $$slots: { default: true }
    });
    $$payload2.out += `<!----> <p class="text-sm font-light text-white-500 dark:text-white-500">Dont have an account yet? <a href="/" class="font-medium text-white-500 hover:underline dark:text-white-500">Sign up</a></p></form> `;
    if (store_get($$store_subs ??= {}, "$showError", showError)) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="toast-warning-container">`;
      ToastWarning($$payload2);
      $$payload2.out += `<!----></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div></div></div>`;
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
export {
  LoginPart as L
};
