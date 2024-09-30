import { writable, get } from 'svelte/store';

export interface Patient {
    id: string;
    patientNumber: string;
    displayName: string;
    name: string;
    dob: string;
    gender: string;
    studyId: string;
    study: string;
}

export interface Study {
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

export interface User {
    id: string;
    name: string;
}

export const patients = writable<Patient[]>([]);
export const studies = writable<Study[]>([]);
export const users = writable<User[]>([]);

let usersLoaded = false;

export async function initializeDatastore(): Promise<void> {
  await Promise.all([
    loadStudies(),
    loadPatients(),
    loadUsers()
  ]);
}

async function loadStudies(): Promise<boolean> {
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

async function loadPatients(): Promise<boolean> {
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

export function getStudyPatients(studyId: string): Patient[] {
    const filteredPatients = get(patients).filter((patient: Patient) => patient.studyId === studyId);
    return filteredPatients;
}

export function getStudy(studyId: string): Study | undefined {
  return get(studies).find((study: Study) => study.id === studyId);
}

export function getPatient(patientId: string): Patient | undefined {
  return get(patients).find((patient: Patient) => patient.id === patientId);
}

