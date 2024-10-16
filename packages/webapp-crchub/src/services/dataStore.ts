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
    therapeuticArea: string;
    currentProtocol: string;
    protocolAmendments: Array<{
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

export async function addStudy(newStudy: Study): Promise<boolean> {
  try {
    const currentStudies = get(studies);
    currentStudies.push(newStudy);
    studies.set(currentStudies);
    await saveStudiesToFile(currentStudies);
    return true;
  } catch (error) {
    console.error('Error adding study:', error);
    return false;
  }
}

export async function editStudy(updatedStudy: Study): Promise<boolean> {
  try {
    const currentStudies = get(studies);
    const index = currentStudies.findIndex((study) => study.id === updatedStudy.id);
    if (index !== -1) {
      currentStudies[index] = updatedStudy;
      studies.set(currentStudies);
      await saveStudiesToFile(currentStudies);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error editing study:', error);
    return false;
  }
}

export async function deleteStudy(studyId: string): Promise<boolean> {
  try {
    const currentStudies = get(studies);
    const updatedStudies = currentStudies.filter((study) => study.id !== studyId);
    if (updatedStudies.length < currentStudies.length) {
      studies.set(updatedStudies);
      await saveStudiesToFile(updatedStudies);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting study:', error);
    return false;
  }
}

async function saveStudiesToFile(studiesData: Study[]): Promise<void> {
  try {
    const response = await fetch('data/studies.json', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studiesData),
    });
    if (!response.ok) {
      throw new Error('Failed to save studies to file');
    }
  } catch (error) {
    console.error('Error saving studies to file:', error);
    throw error;
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

export async function addPatient(newPatient: Patient): Promise<boolean> {
  try {
    const currentPatients = get(patients);
    currentPatients.push(newPatient);
    patients.set(currentPatients);
    await savePatientsToFile(currentPatients);
    return true;
  } catch (error) {
    console.error('Error adding patient:', error);
    return false;
  }
}

export async function editPatient(updatedPatient: Patient): Promise<boolean> {
  try {
    const currentPatients = get(patients);
    const index = currentPatients.findIndex((patient) => patient.id === updatedPatient.id);
    if (index !== -1) {
      currentPatients[index] = updatedPatient;
      patients.set(currentPatients);
      await savePatientsToFile(currentPatients);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error editing patient:', error);
    return false;
  }
}

export async function deletePatient(patientId: string): Promise<boolean> {
  try {
    const currentPatients = get(patients);
    const updatedPatients = currentPatients.filter((patient) => patient.id !== patientId);
    if (updatedPatients.length < currentPatients.length) {
      patients.set(updatedPatients);
      await savePatientsToFile(updatedPatients);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting patient:', error);
    return false;
  }
}

async function savePatientsToFile(patientsData: Patient[]): Promise<void> {
  try {
    const response = await fetch('data/patients.json', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientsData),
    });
    if (!response.ok) {
      throw new Error('Failed to save patients to file');
    }
  } catch (error) {
    console.error('Error saving patients to file:', error);
    throw error;
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

