import { w as writable } from "./exports.js";
const storedTheme = localStorage.getItem("theme") || "dark";
const theme = writable(storedTheme);
theme.subscribe((value) => {
  localStorage.setItem("theme", value);
  document.body.classList.toggle("dark", value === "dark");
});
export {
  theme as t
};
