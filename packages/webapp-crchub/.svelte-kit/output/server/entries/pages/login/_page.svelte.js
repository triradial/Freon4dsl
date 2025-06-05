import "clsx";
import { L as LoginPart } from "../../../chunks/LoginPart.js";
function _page($$payload) {
  $$payload.out += `<div class="login-page"><div class="login-container">`;
  LoginPart($$payload);
  $$payload.out += `<!----></div></div>`;
}
export {
  _page as default
};
