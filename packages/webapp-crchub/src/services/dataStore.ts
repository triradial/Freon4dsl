import { writable, get } from 'svelte/store';
import { userStore, type User } from './userStore';
import { EditorState } from '@freon4dsl/webapp-lib';

const API_BASE_URL = 'http://localhost:8001';

export interface Patient {
    id: string;
    patientNumber: string;
    displayName: string;
    name: string;
    initials: string;
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

export const studies = writable<Study[]>([]);
export const patients = writable<Patient[]>([]);
export const studyPatients = writable<Patient[]>([]);

export async function initializeDatastore(): Promise<void> {
  await Promise.all([
    getStudies(),
    getPatients()
  ]);
}

export async function getStudies(): Promise<boolean> {
  try {
    const currentUser = get(userStore);
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    const resp = await fetch(`${API_BASE_URL}/getStudies?uid=${currentUser.userid}`);
    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
    const text = await resp.text();
    const data = JSON.parse(text);
    studies.set(data);
    return true;
  } catch (error) {
    console.error('Error loading studies:', error);
    return false;
  }
}

export async function getStudy(studyId: string): Promise<Study | undefined> {
  try {
    const currentUser = get(userStore);
    if (!currentUser) {
      throw new Error('User not authenticated');
    }   
    const response = await fetch(`${API_BASE_URL}/getStudy?id=${studyId}&uid=${currentUser.userid}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error fetching study:', error);
    return undefined;
  }
}

export async function addStudy(newStudy: Study): Promise<boolean> {
  try {
    const currentUser = get(userStore);
    if (!currentUser) {
      throw new Error('User not authenticated');
    }  
    const response = await fetch(`${API_BASE_URL}/addStudy?uid=${currentUser.userid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudy)
    });
    if (!response.ok) throw new Error('Failed to add study');
    const text = await response.text();
    const addedStudy = JSON.parse(text);

    let modelManager = EditorState.getInstance();
    await modelManager.newModel(addedStudy.id);

    studies.update(s => [...s, addedStudy]);
    return true;
  } catch (error) {
    console.error('Error adding study:', error);
    return false;
  }
}

export async function updateStudy(updatedStudy: Study): Promise<boolean> {
  try {
    const currentUser = get(userStore);
    if (!currentUser) {
      throw new Error('User not authenticated');
    }  
    const response = await fetch(`${API_BASE_URL}/updateStudy?id=${updatedStudy.id}&uid=${currentUser.userid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedStudy)
    });
    if (!response.ok) throw new Error('Failed to update study');
    studies.update(s => s.map(study => study.id === updatedStudy.id ? updatedStudy : study));
    return true;
  } catch (error) {
    console.error('Error updating study:', error);
    return false;
  }
}

export async function deleteStudy(studyId: string): Promise<boolean> {
  try {
    const currentUser = get(userStore);
    if (!currentUser) {
      throw new Error('User not authenticated');
    }  
    const response = await fetch(`${API_BASE_URL}/deleteStudy?id=${studyId}&uid=${currentUser.userid}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete study');
    studies.update(s => s.filter(study => study.id !== studyId));

    let modelManager = EditorState.getInstance();
    await modelManager.newModel(studyId);   

    return true;
  } catch (error) {
    console.error('Error deleting study:', error);
    return false;
  }
}

export async function getPatients(): Promise<boolean> {
  try {
    const currentUser = get(userStore);
    if (!currentUser) {
      throw new Error('User not authenticated');
    }  
    const resp = await fetch(`${API_BASE_URL}/getPatients?uid=${currentUser.userid}`);
    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
    const text = await resp.text();
    const data = JSON.parse(text);
    patients.set(data);
    return true;
  } catch (error) {
    console.error('Error loading patients:', error);
    return false;
  }
}

export async function getStudyPatients(studyId: string): Promise<boolean> {
  try {
    const currentUser = get(userStore);
    if (!currentUser) {
      throw new Error('User not authenticated');
    }  
    const resp = await fetch(`${API_BASE_URL}/getStudyPatients?id=${studyId}&uid=${currentUser.userid}`);
    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
    const text = await resp.text();
    const data = JSON.parse(text);
    studyPatients.set(data); 
    return true;
  } catch (error) {
    console.error('Error loading study patients:', error);
    return false;
  }
}

export async function getPatient(patientId: string): Promise<Patient | undefined> {
  try {
    const currentUser = get(userStore);
    if (!currentUser) {
      throw new Error('User not authenticated');
    }  
    const response = await fetch(`${API_BASE_URL}/getPatient?id=${patientId}&uid=${currentUser.userid}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error fetching patient:', error);
    return undefined;
  }
}

export async function addPatient(newPatient: Patient): Promise<boolean> {
  try {
    const currentUser = get(userStore);
    if (!currentUser) {
      throw new Error('User not authenticated');
    }  
    const response = await fetch(`${API_BASE_URL}/addPatient?uid=${currentUser.userid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPatient)
    });
    if (!response.ok) throw new Error('Failed to add patient');
    const text = await response.text();
    const addedPatient = JSON.parse(text);
    patients.update(p => [...p, addedPatient]);
    return true;
  } catch (error) {
    console.error('Error adding patient:', error);
    return false;
  }
}

export async function updatePatient(updatedPatient: Patient): Promise<boolean> {
  try {
    const currentUser = get(userStore);
    if (!currentUser) {
      throw new Error('User not authenticated');
    }  
    const response = await fetch(`${API_BASE_URL}/updatePatient?id=${updatedPatient.id}&uid=${currentUser.userid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPatient)
    });
    if (!response.ok) throw new Error('Failed to update patient');
    patients.update(p => p.map(patient => patient.id === updatedPatient.id ? updatedPatient : patient));
    return true;
  } catch (error) {
    console.error('Error updating patient:', error);
    return false;
  }
}

export async function deletePatient(patientId: string): Promise<boolean> {
  try {
    const currentUser = get(userStore);
    if (!currentUser) {
      throw new Error('User not authenticated');
    }  
    const response = await fetch(`${API_BASE_URL}/deletePatient?id=${patientId}&uid=${currentUser.userid}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete patient');
    patients.update(p => p.filter(patient => patient.id !== patientId));
    return true;
  } catch (error) {
    console.error('Error deleting patient:', error);
    return false;
  }
}

export async function getUserById(userId: string): Promise<User | undefined> {
  try {
    const response = await fetch(`${API_BASE_URL}/getUser?id=${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error fetching user:', error);
    return undefined;
  }
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  try {
    const response = await fetch(`${API_BASE_URL}/getUserByEmail?email=${email}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Error fetching user:', error);
    return undefined;
  }
}