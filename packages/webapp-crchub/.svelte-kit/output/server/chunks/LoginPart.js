import { U as getContext, B as pop, z as push, F as attr, K as store_get, M as unsubscribe_stores } from "./index.js";
import { w as writable } from "./index3.js";
import "./model-manager.js";
import "./env.js";
import "clsx";
import "./client.js";
const initialAuth = sessionStorage.getItem("auth") === "true";
const isAuthenticated = writable(initialAuth);
function ToastWarning($$payload, $$props) {
  push();
  const toast = getContext("toast");
  const { $$slots, $$events, ...props } = $$props;
  const message = props.message ?? "Incorrect username or password. Please try again.";
  const type = props.type ?? "error";
  function showToast() {
    toast.create({ title: message, type });
  }
  showToast();
  pop();
}
function LoginPart($$payload, $$props) {
  push();
  var $$store_subs;
  let username = "";
  let password = "";
  let showError = writable(false);
  $$payload.out += `<div id="login" style="width:24rem"><div><div class="flex justify-center items-center"><img class="w-16 h-16 mr-2" src="/images/logo_grey.svg" alt="logo"/> <h1 style="font-size: 2rem; color: white;"><span class="crc-logo-p1">CRC</span><span class="crc-logo-p2">Hub</span></h1></div> <div class="p-6 space-y-4 md:space-y-6 sm:p-8"><form class="flex flex-col space-y-6"><input${attr("value", username)} type="text" name="username" placeholder="username" required class="input text-white-500 dark:text-white-500"/> <input${attr("value", password)} type="password" name="password" placeholder="password" required class="input text-white-500 dark:text-white-500"/> <div class="flex items-start"><label class="flex items-center space-x-2"><input type="checkbox" class="checkbox"/> <span>Remember me</span></label> <a href="/" class="ml-auto text-sm text-white-500 hover:underline dark:text-white-500">Forgot password?</a></div> <button type="submit" class="btn preset-filled-primary-500 w-full text-white-500 dark:text-white-500">Sign in</button> <p class="text-sm font-light text-white-500 dark:text-white-500">Dont have an account yet? <a href="/" class="font-medium text-white-500 hover:underline dark:text-white-500">Sign up</a></p></form> `;
  if (store_get($$store_subs ??= {}, "$showError", showError)) {
    $$payload.out += "<!--[-->";
    ToastWarning($$payload, {
      message: "Incorrect username or password. Please try again.",
      type: "error"
    });
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  LoginPart as L,
  isAuthenticated as i
};
