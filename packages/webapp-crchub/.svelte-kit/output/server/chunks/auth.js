import { w as writable } from "./exports.js";
import "./FontAwesomeIcon.js";
const initialAuth = sessionStorage.getItem("auth") === "true";
const isAuthenticated = writable(initialAuth);
export {
  isAuthenticated as i
};
