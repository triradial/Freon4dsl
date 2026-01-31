import { get, writable } from 'svelte/store';
import { env } from '../../config/env.js';
import { ModelManager } from '../dsl/model-manager.js';
import { userStore, type User } from '../stores/users-store.js';

export interface Patient {
  id: string;
  patientNumber: string;
  initials: string;
  dob: string;
  gender: string;
  studyId: string;
  study: string;
  unavailableDates?: string[];
  schedule?: PatientSchedule;
  createdAt?: string;
}

export interface PatientScheduleEvent {
  id: string;
  type: string;
  name: string;
  actualDay?: number;
  scheduledDay: number;
  status?: string;
  state?: string;
  window?: {
    daysBefore: number;
    daysAfter: number;
  };
}

export interface PatientScheduleDay {
  day: number;
  date: string;
  events: PatientScheduleEvent[];
}

export interface PatientSchedule {
  referenceDate: string;
  days: PatientScheduleDay[];
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
  patientCount?: number;
  currentProtocol: string;
  protocolAmendments: Array<{
    version: string;
    date: string;
    description: string;
  }>;
  siteNumber?: string;
  organizationName?: string;
}

export interface Site {
  id: string;
  orgId: string;
  studyId: string;
  siteNumber: string;
  patientAvailabilityAndHistory?: any;
  siteAttributes?: any;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  // Joined fields
  orgName?: string;
  orgTypeName?: string;
  studyName?: string;
  patientCount?: number;
}

interface DataStoreState {
  studies: Study[];
  patients: Patient[];
  organizations: any[];
  persons: any[];
  studyPatients: Patient[];
  sites: Site[];
  studySites: Site[];
  organizationSites: Site[];
  personRoles: Array<{id: string, name: string, category: string}>;
}

function createDataStore() {
  const { subscribe, set, update } = writable<DataStoreState>({
    studies: [],
    patients: [],
    organizations: [],
    persons: [],
    studyPatients: [],
    sites: [],
    studySites: [],
    organizationSites: [],
    personRoles: []
  });

  /**
   * Helper function to get current user and validate they have an OID
   * Throws error if user is not authenticated or OID is missing
   */
  function getCurrentUserOid(): string {
    const currentUser = get(userStore);
    if (!currentUser || !currentUser.oid) {
      throw new Error('User not authenticated or missing OID');
    }
    return currentUser.oid;
  }

  async function initializeDatastore(): Promise<void> {
    await Promise.all([
      getStudies(),
      getPatients()
    ]);
  }

  // Studies
  async function getStudies(adminMode: boolean = false): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      const url = adminMode 
        ? `${env.serverUrl}/getStudies?uid=${uid}&all=true`
        : `${env.serverUrl}/getStudies?uid=${uid}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      const text = await resp.text();
      const data = JSON.parse(text);
      // Transform snake_case to camelCase for frontend compatibility
      const transformedData = data.map((study: any) => ({
        ...study,
        therapeuticArea: study.therapeutic_area || study.therapeuticArea || '',
        patientCount: study.patient_count || study.patientCount || 0,
        siteNumber: study.site_number || study.siteNumber || '',
        organizationName: study.organization_name || study.organizationName || ''
      }));
      update(state => ({ ...state, studies: transformedData }));
      return true;
    } catch (error) {
      console.error('Error loading studies:', error);
      return false;
    }
  }

  async function getStudy(studyId: string): Promise<Study | undefined> {
    try {
      const uid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/getStudy?id=${studyId}&uid=${uid}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      const study = JSON.parse(text);
      // Transform snake_case to camelCase for frontend compatibility
      return {
        ...study,
        therapeuticArea: study.therapeutic_area || study.therapeuticArea || ''
      };
    } catch (error) {
      console.error('Error fetching study:', error);
      return undefined;
    }
  }

  async function addStudy(newStudy: Study): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      // Transform camelCase to snake_case for backend compatibility
      const studyToSend = {
        ...newStudy,
        therapeutic_area: newStudy.therapeuticArea || (newStudy as any).therapeutic_area
      };
      // Remove camelCase version if it exists
      delete (studyToSend as any).therapeuticArea;
      const response = await fetch(`${env.serverUrl}/addStudy?uid=${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studyToSend)
      });
      if (!response.ok) throw new Error('Failed to add study');
      const text = await response.text();
      const addedStudy = JSON.parse(text);
      // Transform snake_case to camelCase for frontend compatibility
      const transformedStudy = {
        ...addedStudy,
        therapeuticArea: addedStudy.therapeutic_area || addedStudy.therapeuticArea || ''
      };
      await ModelManager.getInstance().createModel(addedStudy.id);
      update(state => ({ ...state, studies: [...state.studies, transformedStudy] }));
      return true;
    } catch (error) {
      console.error('Error adding study:', error);
      return false;
    }
  }

  async function addStudyWithSite(newStudy: Study & { siteNumber: string }): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      // Transform camelCase to snake_case for backend compatibility
      const studyToSend = {
        ...newStudy,
        therapeutic_area: newStudy.therapeuticArea || (newStudy as any).therapeutic_area
      };
      // Remove camelCase version if it exists
      delete (studyToSend as any).therapeuticArea;
      const response = await fetch(`${env.serverUrl}/addStudyWithSite?uid=${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studyToSend)
      });
      if (!response.ok) throw new Error('Failed to add study with site');
      const text = await response.text();
      const addedStudy = JSON.parse(text);
      
      // Create the model for the new study
      await ModelManager.getInstance().createModel(addedStudy.id);
      
      // Refresh the studies list to get complete data with site information
      await getStudies();
      
      return true;
    } catch (error) {
      console.error('Error adding study with site:', error);
      return false;
    }
  }

  async function updateStudy(updatedStudy: Study): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      // Transform camelCase to snake_case for backend compatibility
      const studyToSend = {
        ...updatedStudy,
        therapeutic_area: updatedStudy.therapeuticArea || (updatedStudy as any).therapeutic_area
      };
      // Remove camelCase version if it exists
      delete (studyToSend as any).therapeuticArea;
      const response = await fetch(`${env.serverUrl}/updateStudy?id=${updatedStudy.id}&uid=${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studyToSend)
      });
      if (!response.ok) throw new Error('Failed to update study');
      
      // Refresh the studies list to get complete data with site information
      // This ensures the grid shows updated site_number and other joined fields
      await getStudies();
      
      return true;
    } catch (error) {
      console.error('Error updating study:', error);
      return false;
    }
  }

  async function deleteStudy(studyId: string): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/deleteStudy?id=${studyId}&uid=${uid}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete study' }));
        throw new Error(errorData.error || errorData.details || 'Failed to delete study');
      }
      update(state => ({ ...state, studies: state.studies.filter(study => study.id !== studyId) }));
      
      // Try to delete the model, but don't fail if it's not open or doesn't exist
      try {
      await ModelManager.getInstance().deleteModel(studyId);
      } catch (modelError) {
        // Log but don't throw - study deletion should succeed even if model deletion fails
        console.warn('Failed to delete model for study:', studyId, modelError);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting study:', error);
      throw error; // Re-throw to let the dialog handle the error message
    }
  }

  // Patients
  async function getPatients(): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      const resp = await fetch(`${env.serverUrl}/getPatients?uid=${uid}`);
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
      const uid = getCurrentUserOid();
      const resp = await fetch(`${env.serverUrl}/getStudyPatients?id=${studyId}&uid=${uid}`);
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
      const uid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/getPatient?id=${patientId}&uid=${uid}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      const patient = JSON.parse(text);
      // Add patient to store so PatientCard can find it
      if (patient) {
        update(state => {
          const existingIndex = state.patients.findIndex(p => p.id === patient.id);
          if (existingIndex >= 0) {
            // Update existing patient
            const updatedPatients = [...state.patients];
            updatedPatients[existingIndex] = patient;
            return { ...state, patients: updatedPatients };
          } else {
            // Add new patient
            return { ...state, patients: [...state.patients, patient] };
          }
        });
      }
      return patient;
    } catch (error) {
      console.error('Error fetching patient:', error);
      return undefined;
    }
  }

  async function addPatient(newPatient: Patient): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/addPatient?uid=${uid}`, {
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
      const uid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/updatePatient?id=${updatedPatient.id}&uid=${uid}`, {
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
      const uid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/deletePatient?id=${patientId}&uid=${uid}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete patient' }));
        throw new Error(errorData.error || errorData.details || 'Failed to delete patient');
      }
      update(state => ({ ...state, patients: state.patients.filter(patient => patient.id !== patientId) }));
      update(state => ({ ...state, studyPatients: state.studyPatients.filter(patient => patient.id !== patientId) }));
      return true;
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error; // Re-throw to let the dialog handle the error message
    }
  }

  async function getPatientUnavailableDates(patientId: string): Promise<string[]> {
    try {
      const response = await fetch(`${env.serverUrl}/getPatientUnavailableDates?id=${patientId}`);
      if (!response.ok) throw new Error('Failed to get patient unavailable dates');
      const dates = await response.json();
      return dates || [];
    } catch (error) {
      console.error('Error getting patient unavailable dates:', error);
      return [];
    }
  }

  async function setPatientUnavailableDates(patientId: string, dates: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${env.serverUrl}/setPatientUnavailableDates?id=${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates })
      });
      if (!response.ok) throw new Error('Failed to set patient unavailable dates');
      return true;
    } catch (error) {
      console.error('Error setting patient unavailable dates:', error);
      return false;
    }
  }

  async function getPatientSchedule(patientId: string): Promise<PatientSchedule | null> {
    try {
      const response = await fetch(`${env.serverUrl}/getPatientSchedule?id=${patientId}`);
      if (!response.ok) throw new Error('Failed to get patient schedule');
      const schedule = await response.json();
      return schedule || null;
    } catch (error) {
      console.error('Error getting patient schedule:', error);
      return null;
    }
  }

  async function setPatientSchedule(patientId: string, schedule: PatientSchedule): Promise<boolean> {
    try {
      const response = await fetch(`${env.serverUrl}/setPatientSchedule?id=${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule)
      });
      if (!response.ok) throw new Error('Failed to set patient schedule');
      return true;
    } catch (error) {
      console.error('Error setting patient schedule:', error);
      return false;
    }
  }

  async function getStudyPatientsWithSchedules(studyId: string): Promise<Patient[]> {
    const url = `${env.serverUrl}/getStudyPatientsWithSchedules?id=${studyId}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`getStudyPatientsWithSchedules failed: ${response.status} ${response.statusText}`, { url, studyId });
        throw new Error(`Failed to get study patients with schedules: ${response.status}`);
      }
      const patients: Patient[] = (await response.json()) || [];
      // Order newest to oldest (creation date desc) for timeline display
      patients.sort((a, b) => {
        const da = typeof a.createdAt === "string" ? a.createdAt : "";
        const db = typeof b.createdAt === "string" ? b.createdAt : "";
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return db.localeCompare(da);
      });
      return patients;
    } catch (error) {
      console.error('Error getting study patients with schedules:', error, { url, studyId });
      return [];
    }
  }

  async function getUserById(userId: string): Promise<User | undefined> {
    try {
      const response = await fetch(`${env.serverUrl}/getUser?id=${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      const data = JSON.parse(text);
      // Transform snake_case to camelCase for frontend compatibility
      const transformedUser: User = {
        oid: data.oid,
        email: data.email,
        name: data.name,
        facility: data.facility || '',
        role: data.role || '',
        isGlobalAdmin: data.is_global_admin || false
      };
      return transformedUser;
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
        // Re-throw with status code information
        const error: any = new Error(data.error || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        throw error;
      }
      // Transform snake_case to camelCase for frontend compatibility
      const transformedUser: User = {
        oid: data.oid,
        email: data.email,
        name: data.name,
        facility: data.facility || '',
        role: data.role || '',
        isGlobalAdmin: data.is_global_admin || false
      };
      return transformedUser;
    } catch (error) {
      console.error('Error in getUserByEmail:', error);
      // Re-throw to preserve error information
      throw error;
    }
  }

  // Organizations
  async function getOrganizations(): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      const resp = await fetch(`${env.serverUrl}/getOrganizations?uid=${uid}`);
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      const data = await resp.json();
      const transformedData = data.map((org: any) => ({
        ...org,
        orgTypeId: org.org_type_id,
        orgSubtypeId: org.org_subtype_id,
        isDomain: org.is_domain,
        staffAvailability: org.staff_availability,
        organizationAttributes: org.organization_attributes,
        startDate: org.start_date,
        endDate: org.end_date,
        createdAt: org.created_at,
        updatedAt: org.updated_at,
        orgTypeName: org.org_type_name,
        orgSubtypeName: org.org_subtype_name,
        personCount: org.person_count || 0
      }));
      update(state => ({ ...state, organizations: transformedData }));
      return true;
    } catch (error) {
      console.error('Error loading organizations:', error);
      return false;
    }
  }

  async function getOrganization(orgId: string): Promise<any | undefined> {
    try {
      const uid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/getOrganization?id=${orgId}&uid=${uid}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const org = await response.json();
      return {
        ...org,
        orgTypeId: org.org_type_id,
        orgSubtypeId: org.org_subtype_id,
        isDomain: org.is_domain,
        staffAvailability: org.staff_availability,
        organizationAttributes: org.organization_attributes,
        startDate: org.start_date,
        endDate: org.end_date,
        createdAt: org.created_at,
        updatedAt: org.updated_at,
        orgTypeName: org.org_type_name,
        orgSubtypeName: org.org_subtype_name,
        personCount: org.person_count || 0
      };
    } catch (error) {
      console.error('Error fetching organization:', error);
      return undefined;
    }
  }

  async function getUserOrganization(): Promise<any | undefined> {
    try {
      const uid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/getUserOrganization?uid=${uid}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.log('[dataStore] getUserOrganization: Organization not found (404)');
          return undefined;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const org = await response.json();
      return {
        ...org,
        orgTypeId: org.org_type_id,
        orgSubtypeId: org.org_subtype_id,
        isDomain: org.is_domain,
        staffAvailability: org.staff_availability,
        organizationAttributes: org.organization_attributes,
        startDate: org.start_date,
        endDate: org.end_date,
        createdAt: org.created_at,
        updatedAt: org.updated_at,
        orgTypeName: org.org_type_name,
        orgSubtypeName: org.org_subtype_name,
        personCount: org.person_count || 0
      };
    } catch (error) {
      console.error('Error fetching user organization:', error);
      return undefined;
    }
  }

  async function addOrganization(newOrganization: any): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      // Transform camelCase to snake_case for backend
      const backendData = {
        org_type_id: newOrganization.orgTypeId || null,
        org_subtype_id: newOrganization.orgSubtypeId || null,
        name: newOrganization.name,
        is_domain: newOrganization.isDomain || false,
        staff_availability: newOrganization.staffAvailability || null,
        organization_attributes: newOrganization.organizationAttributes || null,
        start_date: newOrganization.startDate || null,
        end_date: newOrganization.endDate || null
      };
      const response = await fetch(`${env.serverUrl}/addOrganization?uid=${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendData)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await getOrganizations();
      return true;
    } catch (error) {
      console.error('Error adding organization:', error);
      return false;
    }
  }

  async function updateOrganization(orgId: string, updatedOrganization: any): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      // Transform camelCase to snake_case for backend
      const backendData: any = {};
      if (updatedOrganization.orgTypeId !== undefined) {
        backendData.org_type_id = updatedOrganization.orgTypeId || null;
      }
      if (updatedOrganization.orgSubtypeId !== undefined) {
        backendData.org_subtype_id = updatedOrganization.orgSubtypeId || null;
      }
      if (updatedOrganization.name !== undefined) {
        backendData.name = updatedOrganization.name;
      }
      if (updatedOrganization.isDomain !== undefined) {
        backendData.is_domain = updatedOrganization.isDomain;
      }
      if (updatedOrganization.staffAvailability !== undefined) {
        backendData.staff_availability = updatedOrganization.staffAvailability;
      }
      if (updatedOrganization.organizationAttributes !== undefined) {
        backendData.organization_attributes = updatedOrganization.organizationAttributes;
      }
      if (updatedOrganization.startDate !== undefined) {
        backendData.start_date = updatedOrganization.startDate || null;
      }
      if (updatedOrganization.endDate !== undefined) {
        backendData.end_date = updatedOrganization.endDate || null;
      }
      const response = await fetch(`${env.serverUrl}/updateOrganization?id=${orgId}&uid=${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendData)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await getOrganizations();
      return true;
    } catch (error) {
      console.error('Error updating organization:', error);
      return false;
    }
  }

  async function deleteOrganization(orgId: string): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/deleteOrganization?id=${orgId}&uid=${uid}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await getOrganizations();
      return true;
    } catch (error) {
      console.error('Error deleting organization:', error);
      return false;
    }
  }

  // Persons
  async function getPersons(): Promise<boolean> {
    try {
      console.log('[data-store] getPersons called');
      const uid = getCurrentUserOid();
      console.log('[data-store] getPersons - uid:', uid);
      const url = `${env.serverUrl}/getPersons?uid=${uid}`;
      console.log('[data-store] getPersons - fetching from:', url);
      const resp = await fetch(url);
      console.log('[data-store] getPersons - response status:', resp.status, 'ok:', resp.ok);
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('[data-store] getPersons - HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${resp.status}, body: ${errorText}`);
      }
      const data = await resp.json();
      console.log('[data-store] getPersons - received data:', data?.length || 0, 'persons');
      
      const transformedData = data.map((person: any) => {
        // Normalize active field to boolean - handle boolean, string, or null/undefined
        const activeValue = person.active;
        let active = false;
        if (activeValue === true || activeValue === 'true' || activeValue === 'True' || 
            (typeof activeValue === 'string' && activeValue.toLowerCase() === 'true')) {
          active = true;
        }
        
        return {
          ...person,
          createdAt: person.created_at,
          updatedAt: person.updated_at,
          hasLogin: person.has_login,
          isGlobalAdmin: person.is_global_admin,
          isDomainAdmin: person.is_domain_admin,
          active: active,
          passwordHash: person.password_hash,
          // Transform organizations array to include org_type_name
          organizations: (person.organizations || []).map((org: any) => ({
            ...org,
            orgName: org.org_name,
            orgTypeName: org.org_type_name,
            roleName: org.role_name
          }))
        };
      });
      update(state => ({ ...state, persons: transformedData }));
      return true;
    } catch (error) {
      console.error('Error loading persons:', error);
      return false;
    }
  }

  async function getPerson(personId: string): Promise<any | undefined> {
    try {
      const uid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/getPerson?id=${personId}&uid=${uid}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const person = await response.json();
      return {
        ...person,
        createdAt: person.created_at,
        updatedAt: person.updated_at,
        hasLogin: person.has_login,
        isGlobalAdmin: person.is_global_admin,
        isDomainAdmin: person.is_domain_admin
      };
    } catch (error) {
      console.error('Error fetching person:', error);
      return undefined;
    }
  }

  async function addPerson(newPerson: any): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/addPerson?uid=${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPerson)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await getPersons();
      return true;
    } catch (error) {
      console.error('Error adding person:', error);
      return false;
    }
  }

  async function updatePerson(personId: string, updatedPerson: any): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/updatePerson?id=${personId}&uid=${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPerson)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await getPersons();
      return true;
    } catch (error) {
      console.error('Error updating person:', error);
      return false;
    }
  }

  async function deletePerson(personId: string): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/deletePerson?id=${personId}&uid=${uid}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await getPersons();
      return true;
    } catch (error) {
      console.error('Error deleting person:', error);
      return false;
    }
  }

  // Sites
  async function getSites(): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      const resp = await fetch(`${env.serverUrl}/getSites?uid=${uid}`);
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      const data = await resp.json();
      const transformedData = data.map((site: any) => ({
        ...site,
        orgId: site.org_id,
        protocolVersionId: site.protocol_version_id,
        siteNumber: site.site_number,
        patientAvailabilityAndHistory: site.patient_availability_and_history,
        siteAttributes: site.site_attributes,
        startDate: site.start_date,
        endDate: site.end_date,
        createdAt: site.created_at,
        updatedAt: site.updated_at,
        orgName: site.org_name,
        orgTypeName: site.org_type_name,
        studyId: site.study_id,
        studyName: site.study_name,
        protocolNumber: site.protocol_number,
        protocolVersion: site.protocol_version,
        patientCount: site.patient_count
      }));
      update(state => ({ ...state, sites: transformedData }));
      return true;
    } catch (error) {
      console.error('Error loading sites:', error);
      return false;
    }
  }

  async function getSite(siteId: string): Promise<Site | undefined> {
    try {
      const uid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/getSite?id=${siteId}&uid=${uid}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const site = await response.json();
      return {
        ...site,
        orgId: site.org_id,
        studyId: site.study_id,
        siteNumber: site.site_number,
        patientAvailabilityAndHistory: site.patient_availability_and_history,
        siteAttributes: site.site_attributes,
        startDate: site.start_date,
        endDate: site.end_date,
        createdAt: site.created_at,
        updatedAt: site.updated_at,
        orgName: site.org_name,
        orgTypeName: site.org_type_name,
        studyName: site.study_name,
        patientCount: site.patient_count
      };
    } catch (error) {
      console.error('Error fetching site:', error);
      return undefined;
    }
  }

  async function getStudySites(studyId: string): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      const resp = await fetch(`${env.serverUrl}/getStudySites?studyId=${studyId}&uid=${uid}`);
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      const data = await resp.json();
      const transformedData = data.map((site: any) => ({
        ...site,
        orgId: site.org_id,
        studyId: site.study_id,
        siteNumber: site.site_number,
        patientAvailabilityAndHistory: site.patient_availability_and_history,
        siteAttributes: site.site_attributes,
        startDate: site.start_date,
        endDate: site.end_date,
        createdAt: site.created_at,
        updatedAt: site.updated_at,
        orgName: site.org_name,
        orgTypeName: site.org_type_name,
        studyName: site.study_name,
        patientCount: site.patient_count
      }));
      update(state => ({ ...state, studySites: transformedData }));
      return true;
    } catch (error) {
      console.error('Error loading study sites:', error);
      return false;
    }
  }

  async function getOrganizationSites(orgId: string): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      const resp = await fetch(`${env.serverUrl}/getOrganizationSites?orgId=${orgId}&uid=${uid}`);
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      const data = await resp.json();
      const transformedData = data.map((site: any) => ({
        ...site,
        orgId: site.org_id,
        studyId: site.study_id,
        siteNumber: site.site_number,
        patientAvailabilityAndHistory: site.patient_availability_and_history,
        siteAttributes: site.site_attributes,
        startDate: site.start_date,
        endDate: site.end_date,
        createdAt: site.created_at,
        updatedAt: site.updated_at,
        orgName: site.org_name,
        orgTypeName: site.org_type_name,
        studyName: site.study_name,
        patientCount: site.patient_count
      }));
      update(state => ({ ...state, organizationSites: transformedData }));
      return true;
    } catch (error) {
      console.error('Error loading organization sites:', error);
      return false;
    }
  }

  async function addSite(newSite: Site): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/addSite?uid=${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSite)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await getSites();
      return true;
    } catch (error) {
      console.error('Error adding site:', error);
      return false;
    }
  }

  async function updateSite(siteId: string, updatedSite: any): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/updateSite?id=${siteId}&uid=${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSite)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await getSites();
      return true;
    } catch (error) {
      console.error('Error updating site:', error);
      return false;
    }
  }

  async function deleteSite(siteId: string): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/deleteSite?id=${siteId}&uid=${uid}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await getSites();
      return true;
    } catch (error) {
      console.error('Error deleting site:', error);
      return false;
    }
  }

  async function getUserStudySite(studyId: string): Promise<Site | undefined> {
    try {
      const uid = getCurrentUserOid();
      console.log('[dataStore] getUserStudySite: studyId=', studyId, 'uid=', uid);
      const response = await fetch(`${env.serverUrl}/getUserStudySite?studyId=${studyId}&uid=${uid}`);
      console.log('[dataStore] getUserStudySite: response status=', response.status);
      if (!response.ok) {
        if (response.status === 404) {
          console.log('[dataStore] getUserStudySite: Site not found (404)');
          return undefined;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const site = await response.json();
      console.log('[dataStore] getUserStudySite: Raw site from backend=', site);
      const transformedSite = {
        ...site,
        orgId: site.org_id,
        studyId: site.study_id,
        siteNumber: site.site_number,
        patientAvailabilityAndHistory: site.patient_availability_and_history,
        siteAttributes: site.site_attributes,
        startDate: site.start_date,
        endDate: site.end_date,
        createdAt: site.created_at,
        updatedAt: site.updated_at,
        orgName: site.org_name,
        orgStartDate: site.org_start_date,
        orgEndDate: site.org_end_date,
        orgTypeName: site.org_type_name,
        studyName: site.study_name,
        patientCount: site.patient_count
      };
      console.log('[dataStore] getUserStudySite: Transformed site=', transformedSite);
      return transformedSite;
    } catch (error) {
      console.error('Error fetching user study site:', error);
      return undefined;
    }
  }

  async function updateSiteNumber(siteId: string, siteNumber: string): Promise<boolean> {
    try {
      const uid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/updateSiteNumber?siteId=${siteId}&uid=${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteNumber })
      });
      if (!response.ok) throw new Error('Failed to update site number');
      
      // Refresh the studies list to update the grid with the new site number
      await getStudies();
      
      return true;
    } catch (error) {
      console.error('Error updating site number:', error);
      return false;
    }
  }

  // Person
  async function getPersonRoles(): Promise<boolean> {
    try {
      const resp = await fetch(`${env.serverUrl}/getPersonRoles`);
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      const data = await resp.json();
      update(state => ({ ...state, personRoles: data }));
      return true;
    } catch (error) {
      console.error('Error loading person roles:', error);
      return false;
    }
  }

  async function getPersonUnavailableDates(personId: string, orgId: string): Promise<string[]> {
    try {
      const oid = getCurrentUserOid();
      const resp = await fetch(`${env.serverUrl}/getPersonUnavailableDates?oid=${oid}&personId=${personId}&orgId=${orgId}`);
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      const data = await resp.json();
      return data.unavailable || [];
    } catch (error) {
      console.error('Error loading person unavailable dates:', error);
      return [];
    }
  }

  async function setPersonUnavailableDates(personId: string, orgId: string, unavailableDates: string[]): Promise<boolean> {
    try {
      const oid = getCurrentUserOid();
      const response = await fetch(`${env.serverUrl}/setPersonUnavailableDates?oid=${oid}&personId=${personId}&orgId=${orgId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unavailable: unavailableDates })
      });
      if (!response.ok) throw new Error('Failed to set person unavailable dates');
      return true;
    } catch (error) {
      console.error('Error setting person unavailable dates:', error);
      return false;
    }
  }

  return {
    subscribe,
    initializeDatastore,
    getStudies,
    getStudy,
    addStudy,
    addStudyWithSite,
    updateStudy,
    deleteStudy,
    getPatients,
    getStudyPatients,
    getPatient,
    addPatient,
    updatePatient,
    deletePatient,
    getPatientUnavailableDates,
    setPatientUnavailableDates,
    getPatientSchedule,
    setPatientSchedule,
    getStudyPatientsWithSchedules,
    getOrganizations,
    getOrganization,
    getUserOrganization,
    addOrganization,
    updateOrganization,
    deleteOrganization,
    getPersons,
    getPerson,
    addPerson,
    updatePerson,
    deletePerson,
    getSites,
    getSite,
    getStudySites,
    getOrganizationSites,
    getUserStudySite,
    updateSiteNumber,
    addSite,
    updateSite,
    deleteSite,
    getPersonRoles,
    getPersonUnavailableDates,
    setPersonUnavailableDates,
    getUserById,
    getUserByEmail
  };
}

export const dataStore = createDataStore();