import { userStore } from "../stores/users-store.js";
import { dataStore } from "../data/data-store.js";

export async function initializeApp() {
    // Initialize user data and datastore
    userStore.initializeFromStorage();
    dataStore.initializeDatastore();
} 