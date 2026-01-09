// info about the available models at the server

import { writable } from 'svelte/store';
import type { stringList } from "./store-interfaces.js";

export const modelNames = writable<{ list: string[] }>({ list: [] });
