import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

interface Patient {
  id: string;
  name: string;
  dob: string;
  study: string;
}

interface Study {
  name: string;
  title: string;
  status: string;
  phase: string;
  therapeutic_area: string;
}

interface User {
  id: number;
  username: string;
  // Add other relevant properties
}

export const patients: Writable<Patient[]> = writable([]);
export const studies: Writable<Study[]> = writable([]);
export const users: Writable<User[]> = writable([]);
let usersLoaded = false;

export async function loadPatients(): Promise<void> {
  const response = await fetch('/data/patients.json');
  patients.set(await response.json() as Patient[]);
}

export async function loadStudies(): Promise<void> {
  const response = await fetch('/data/studies.json');
  studies.set(await response.json() as Study[]);
}

export async function loadUsers(): Promise<void> {
  if (!usersLoaded) {
    const response = await fetch('/data/users.json');
    users.set(await response.json() as User[]);
    usersLoaded = true;
  }
}
