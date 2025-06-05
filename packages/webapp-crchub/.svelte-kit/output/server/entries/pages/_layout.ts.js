import { r as redirect } from "../../chunks/index.js";
const ssr = false;
const load = async ({ url }) => {
  if (typeof window !== "undefined") {
    const auth = sessionStorage.getItem("auth") === "true";
    if (!auth && url.pathname !== "/login") {
      sessionStorage.setItem("intendedRoute", url.pathname + url.search);
      throw redirect(307, "/login");
    }
  }
  return {};
};
export {
  load,
  ssr
};
