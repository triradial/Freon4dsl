import { w as writable } from "./index3.js";
import { d as dataStore } from "./data-store.js";
const objectDrawerStore = writable({
  open: false,
  type: null,
  // 'study' | 'patient'
  action: null,
  // 'add' | 'edit'
  data: null
});
function closeObjectDrawer() {
  objectDrawerStore.set({ open: false, type: null, action: null, data: null });
}
async function editObject(type, id) {
  console.log("editObject called:", type, id);
  let object;
  if (type === "study") {
    object = await dataStore.getStudy(id);
  } else {
    object = await dataStore.getPatient(id);
  }
  console.log("Object retrieved:", object);
  if (!object) {
    console.error(`${type} with id ${id} not found`);
  } else {
    console.error(`${type} with id ${id} found`);
    objectDrawerStore.set({ open: true, type, action: "edit", data: object });
  }
}
function getStatusColor(status) {
  switch (status.toLowerCase()) {
    case "active":
      return "blue";
    case "complete":
      return "green";
    case "suspended":
      return "pink";
    case "terminated":
      return "red";
    case "planning":
      return "indigo";
    default:
      return "default";
  }
}
function getSVGIcon(iconName) {
  let svg = "";
  switch (iconName) {
    case "add":
      svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
      break;
    case "delete":
      svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>';
      break;
    case "edit":
      svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil-icon lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>';
      break;
    default:
      svg = "";
  }
  return svg;
}
export {
  getSVGIcon as a,
  closeObjectDrawer as c,
  editObject as e,
  getStatusColor as g,
  objectDrawerStore as o
};
