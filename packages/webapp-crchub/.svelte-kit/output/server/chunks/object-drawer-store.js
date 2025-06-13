import { w as writable } from "./index3.js";
import { d as dataStore } from "./utils.js";
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
export {
  closeObjectDrawer as c,
  editObject as e,
  objectDrawerStore as o
};
