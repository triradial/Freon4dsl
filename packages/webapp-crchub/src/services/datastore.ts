import { writable } from 'svelte/store';

interface Patient {
    id: string;
    name: string;
    dob: string;
    study: string;
}

interface Study {
    id: string;
    name: string;
    identifiers: Array<{ type: string; identifier: string }>;
    status: string;
    title: string;
    phase: string;
    interventions: Array<{ type: string; name: string }>;
    "therapeutic-area": string;
    "current-protocol": string;
    "protocol-amendments": Array<{
      version: string;
      date: string;
      description: string;
    }>;
}  

interface User {
    id: string;
    name: string;
}

export const patients = writable<Patient[]>([]);
export const studies = writable<Study[]>([]);
export const users = writable<User[]>([]);

let usersLoaded = false;

export async function loadStudies(): Promise<boolean> {
  try {
    const resp = await fetch('data/studies.json');
    const data = await resp.json();
    studies.set(data);
    return true;
  } catch (error) {
    console.error('Error loading studies:', error);
    return false;
  }
}

export async function loadPatients(): Promise<boolean> {
  try {
    const resp = await fetch('data/patients.json');
    const data = await resp.json();
    patients.set(data);
    return true;
  } catch (error) {
    console.error('Error loading patients:', error);
    return false;
  }
}

export async function loadUsers(): Promise<boolean> {
  try {
    const resp = await fetch('data/users.json');
    const data = await resp.json();
    users.set(data);
    return true;
  } catch (error) {
    console.error('Error loading users:', error);
    return false;
  }
}
