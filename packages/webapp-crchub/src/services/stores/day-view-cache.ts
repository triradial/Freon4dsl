/**
 * Persistent cache for DayView component data
 * This survives component destruction/recreation when navigating between pages
 */

import type { PatientVisitRow } from './day-view-store.js';

export interface StaffRow {
    name: string;
    personId: string;
}

// Module-level cache that persists across component lifecycle
class DayViewCache {
    // Cache for patient visits by date
    private patientVisitsCache = new Map<string, PatientVisitRow[]>();
    
    // Simple map: personId -> array of unavailable date strings (YYYY-MM-DD)
    private personUnavailableDates = new Map<string, string[]>();
    
    // Map of personId -> person object (for quick lookup)
    private orgPersonsMap = new Map<string, any>();
    
    // Organization context
    private organizationId: string | null = null;
    private organizationStartDate: string | null = null;
    private organizationEndDate: string | null = null;
    private studyId: string | null = null;
    private totalStaff = 0;
    
    // Get patient visits for a date
    getPatientVisits(dateStr: string): PatientVisitRow[] | undefined {
        return this.patientVisitsCache.get(dateStr);
    }
    
    // Set patient visits for a date
    setPatientVisits(dateStr: string, visits: PatientVisitRow[]): void {
        this.patientVisitsCache.set(dateStr, visits);
    }
    
    // Get person unavailable dates
    getPersonUnavailableDates(personId: string): string[] | undefined {
        return this.personUnavailableDates.get(personId);
    }
    
    // Set person unavailable dates
    setPersonUnavailableDates(personId: string, dates: string[]): void {
        this.personUnavailableDates.set(personId, dates);
    }
    
    // Get all person unavailable dates
    getAllPersonUnavailableDates(): Map<string, string[]> {
        return new Map(this.personUnavailableDates);
    }
    
    // Set all person unavailable dates
    setAllPersonUnavailableDates(dates: Map<string, string[]>): void {
        this.personUnavailableDates = new Map(dates);
    }
    
    // Get person object
    getPerson(personId: string): any {
        return this.orgPersonsMap.get(personId);
    }
    
    // Set person object
    setPerson(personId: string, person: any): void {
        this.orgPersonsMap.set(personId, person);
    }
    
    // Get all persons
    getAllPersons(): Map<string, any> {
        return new Map(this.orgPersonsMap);
    }
    
    // Set all persons
    setAllPersons(persons: Map<string, any>): void {
        this.orgPersonsMap = new Map(persons);
    }
    
    // Organization context getters/setters
    getOrganizationId(): string | null {
        return this.organizationId;
    }
    
    setOrganizationId(id: string | null): void {
        this.organizationId = id;
    }
    
    getOrganizationStartDate(): string | null {
        return this.organizationStartDate;
    }
    
    setOrganizationStartDate(date: string | null): void {
        this.organizationStartDate = date;
    }
    
    getOrganizationEndDate(): string | null {
        return this.organizationEndDate;
    }
    
    setOrganizationEndDate(date: string | null): void {
        this.organizationEndDate = date;
    }
    
    getStudyId(): string | null {
        return this.studyId;
    }
    
    setStudyId(id: string | null): void {
        this.studyId = id;
    }
    
    getTotalStaff(): number {
        return this.totalStaff;
    }
    
    setTotalStaff(count: number): void {
        this.totalStaff = count;
    }
    
    // Check if cache has organization data loaded
    hasOrganizationData(): boolean {
        return this.organizationId !== null && this.orgPersonsMap.size > 0;
    }
    
    // Clear all cache (useful for testing or logout)
    clear(): void {
        this.patientVisitsCache.clear();
        this.personUnavailableDates.clear();
        this.orgPersonsMap.clear();
        this.organizationId = null;
        this.organizationStartDate = null;
        this.organizationEndDate = null;
        this.studyId = null;
        this.totalStaff = 0;
    }
}

// Singleton instance
export const dayViewCache = new DayViewCache();

