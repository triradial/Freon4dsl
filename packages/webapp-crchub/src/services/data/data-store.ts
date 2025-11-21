import { get, writable } from 'svelte/store';
import { env } from '../../config/env.js';
import { ModelManager } from '../dsl/model-manager.js';
import { userStore, type User } from '../stores/users-store.js';

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

interface DataStoreState {
  studies: Study[];
  patients: Patient[];
  studyPatients: Patient[];
}

function createDataStore() {
  const { subscribe, set, update } = writable<DataStoreState>({
    studies: [],
    patients: [],
    studyPatients: []
  });

  async function initializeDatastore(): Promise<void> {
    await Promise.all([
      getStudies(),
      getPatients()
    ]);
  }

  async function getStudies(): Promise<boolean> {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      const resp = await fetch(`${env.serverUrl}/getStudies?uid=${currentUser.userid}`);
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      const text = await resp.text();
      const data = JSON.parse(text);
      update(state => ({ ...state, studies: data }));
      return true;
    } catch (error) {
      console.error('Error loading studies:', error);
      return false;
    }
  }

  async function getStudy(studyId: string): Promise<Study | undefined> {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      const response = await fetch(`${env.serverUrl}/getStudy?id=${studyId}&uid=${currentUser.userid}`);
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

  async function addStudy(newStudy: Study): Promise<boolean> {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      const response = await fetch(`${env.serverUrl}/addStudy?uid=${currentUser.userid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudy)
      });
      if (!response.ok) throw new Error('Failed to add study');
      const text = await response.text();
      const addedStudy = JSON.parse(text);
      await ModelManager.getInstance().createModel(addedStudy.id);
      update(state => ({ ...state, studies: [...state.studies, addedStudy] }));
      return true;
    } catch (error) {
      console.error('Error adding study:', error);
      return false;
    }
  }

  async function updateStudy(updatedStudy: Study): Promise<boolean> {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      const response = await fetch(`${env.serverUrl}/updateStudy?id=${updatedStudy.id}&uid=${currentUser.userid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStudy)
      });
      if (!response.ok) throw new Error('Failed to update study');
      update(state => ({ ...state, studies: state.studies.map(study => study.id === updatedStudy.id ? updatedStudy : study) }));
      return true;
    } catch (error) {
      console.error('Error updating study:', error);
      return false;
    }
  }

  async function deleteStudy(studyId: string): Promise<boolean> {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      const response = await fetch(`${env.serverUrl}/deleteStudy?id=${studyId}&uid=${currentUser.userid}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete study');
      update(state => ({ ...state, studies: state.studies.filter(study => study.id !== studyId) }));
      await ModelManager.getInstance().deleteModel(studyId);
      return true;
    } catch (error) {
      console.error('Error deleting study:', error);
      return false;
    }
  }

  async function getPatients(): Promise<boolean> {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      const resp = await fetch(`${env.serverUrl}/getPatients?uid=${currentUser.userid}`);
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      const text = await resp.text();
      const data = JSON.parse(text);
      update(state => ({ ...state, patients: data }));
      return true;
    } catch (error) {
      console.error('Error loading patients:', error);
      return false;
    }
  }

  async function getStudyPatients(studyId: string): Promise<boolean> {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      const resp = await fetch(`${env.serverUrl}/getStudyPatients?id=${studyId}&uid=${currentUser.userid}`);
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      const text = await resp.text();
      const data = JSON.parse(text);
      update(state => ({ ...state, studyPatients: data }));
      return true;
    } catch (error) {
      console.error('Error loading study patients:', error);
      return false;
    }
  }

  async function getPatient(patientId: string): Promise<Patient | undefined> {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      const response = await fetch(`${env.serverUrl}/getPatient?id=${patientId}&uid=${currentUser.userid}`);
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

  async function addPatient(newPatient: Patient): Promise<boolean> {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      const response = await fetch(`${env.serverUrl}/addPatient?uid=${currentUser.userid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient)
      });
      if (!response.ok) throw new Error('Failed to add patient');
      const text = await response.text();
      const addedPatient = JSON.parse(text);
      update(state => ({ ...state, patients: [...state.patients, addedPatient] }));
      update(state => ({ ...state, studyPatients: [...state.studyPatients, addedPatient] }));
      return true;
    } catch (error) {
      console.error('Error adding patient:', error);
      return false;
    }
  }

  async function updatePatient(updatedPatient: Patient): Promise<boolean> {
    try {
      console.log("[dataStore] updatePatient called with updatedPatient:", updatedPatient);
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      const response = await fetch(`${env.serverUrl}/updatePatient?id=${updatedPatient.id}&uid=${currentUser.userid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPatient)
      });
      if (!response.ok) throw new Error('Failed to update patient');
      update(state => ({ ...state, patients: state.patients.map(patient => patient.id === updatedPatient.id ? updatedPatient : patient) }));
      update(state => ({ ...state, studyPatients: state.studyPatients.map(patient => patient.id === updatedPatient.id ? updatedPatient : patient) }));
      return true;
    } catch (error) {
      console.error('Error updating patient:', error);
      return false;
    }
  }

  async function deletePatient(patientId: string): Promise<boolean> {
    try {
      const currentUser = get(userStore);
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      const response = await fetch(`${env.serverUrl}/deletePatient?id=${patientId}&uid=${currentUser.userid}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete patient');
      update(state => ({ ...state, patients: state.patients.filter(patient => patient.id !== patientId) }));
      update(state => ({ ...state, studyPatients: state.studyPatients.filter(patient => patient.id !== patientId) }));
      return true;
    } catch (error) {
      console.error('Error deleting patient:', error);
      return false;
    }
  }

  async function getUserById(userId: string): Promise<User | undefined> {
    try {
      const response = await fetch(`${env.serverUrl}/getUser?id=${userId}`);
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

  async function getUserByEmail(email: string): Promise<User | undefined> {
    try {
      if (!email) {
        console.error('getUserByEmail called with null or undefined email');
        return undefined;
      }
      const url = `${env.serverUrl}/getUserByEmail?email=${encodeURIComponent(email)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error('Error in getUserByEmail:', error);
      return undefined;
    }
  }

  return {
    subscribe,
    initializeDatastore,
    getStudies,
    getStudy,
    addStudy,
    updateStudy,
    deleteStudy,
    getPatients,
    getStudyPatients,
    getPatient,
    addPatient,
    updatePatient,
    deletePatient,
    getUserById,
    getUserByEmail
  };
}

export const dataStore = createDataStore();