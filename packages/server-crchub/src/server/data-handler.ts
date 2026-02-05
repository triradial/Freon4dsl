import { IRouterContext } from "koa-router";
import * as studyService from '../service/study-service.js';
import type { Study } from '../service/study-service.js';
import * as patientService from '../service/patient-service.js';
import type { Patient } from '../service/patient-service.js';
import * as userService from '../service/user-service.js';
import * as organizationService from '../service/organization-service.js';
import type { Organization } from '../service/organization-service.js';
import * as personService from '../service/person-service.js';
import type { Person } from '../service/person-service.js';
import * as siteService from '../service/site-service.js';
import type { Site } from '../service/site-service.js';
import { consoleLogError, consoleLogInfo } from './logging.js';

const moduleName = '[data-handler]';

export class DataHandler {

    // Studies
    public static async getStudies(oid: string, ctx: IRouterContext, all: boolean = false) {
        try {
            ctx.response.type = 'application/json';
            const studies = await studyService.getStudies(oid, all);
            ctx.status = 200;
            ctx.response.body = studies;
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving studies: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving studies", details: String(e) };
        }
    }

    public static async getStudy(oid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const study = await studyService.getStudy(oid, id);
            if (study) {
                ctx.status = 200;
                ctx.response.body = study;
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "Study not found", id };
            }
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving study: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving study", details: String(e) };
        }
    }

    public static async checkStudyNameExists(oid: string, ctx: IRouterContext) {
        try {
            const name = ctx.query["name"] as string | undefined;
            const excludeId = (ctx.query["excludeId"] as string | undefined) || undefined;
            const all = ctx.query["all"] === "true";
            if (!name || typeof name !== "string") {
                ctx.status = 412;
                ctx.response.type = "application/json";
                ctx.response.body = { error: "Missing or invalid query parameter 'name'" };
                return;
            }
            const exists = await studyService.checkStudyNameExists(oid, name, excludeId, all);
            ctx.response.type = "application/json";
            ctx.status = 200;
            ctx.response.body = { exists };
        } catch (e) {
            consoleLogError(moduleName, `Error checking study name: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error checking study name", details: String(e) };
        }
    }

    public static async addStudy(oid: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const newStudy = ctx.request.body as Omit<Study, 'id'>;
            const study = await studyService.createStudy(oid, newStudy);
            ctx.status = 201;
            ctx.response.body = study;
        } catch (e) {
            consoleLogError(moduleName, `Error adding study: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error adding study", details: String(e) };
        }
    }

    public static async addStudyWithSite(oid: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const newStudy = ctx.request.body as Omit<Study, 'id'> & { siteNumber: string };
            const study = await studyService.createStudyWithSite(oid, newStudy);
            ctx.status = 201;
            ctx.response.body = study;
        } catch (e) {
            consoleLogError(moduleName, `Error adding study with site: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error adding study with site", details: String(e) };
        }
    }

    public static async copyStudy(oid: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const body: any = (ctx.request as any).body;
            const sourceStudyId = body?.sourceStudyId;
            const studyData = body?.studyData || {};
            if (!sourceStudyId || typeof sourceStudyId !== "string") {
                ctx.status = 412;
                ctx.response.body = { error: "Missing required field 'sourceStudyId'" };
                return;
            }
            const copyOverrides = {
                ...studyData,
                therapeutic_area: studyData.therapeutic_area || studyData.therapeuticArea
            };
            delete (copyOverrides as any).therapeuticArea;
            const study = await studyService.copyStudy(oid, sourceStudyId, copyOverrides);
            ctx.status = 201;
            ctx.response.body = study;
        } catch (e) {
            consoleLogError(moduleName, `Error copying study: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error copying study", details: String(e) };
        }
    }

    public static async updateStudy(oid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const studyData = ctx.request.body as Partial<Study>;
            const study = await studyService.updateStudy(oid, id, studyData);
            if (study) {
                ctx.status = 200;
                ctx.response.body = study;
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "Study not found", id };
            }
        } catch (e) {
            consoleLogError(moduleName, `Error updating study: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error updating study", details: String(e) };
        }
    }

    public static async deleteStudy(oid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const deleted = await studyService.deleteStudy(oid, id);
            if (deleted) {
                ctx.status = 200;
                ctx.response.body = { message: "Study deleted successfully" };
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "Study not found", id };
            }
        } catch (e) {
            consoleLogError(moduleName, `Error deleting study: ${String(e)}`);
            const errorMessage = String(e);
            // Check if it's a constraint violation (user-friendly error)
            if (errorMessage.includes('related records that prevent deletion')) {
                ctx.status = 409; // Conflict
                ctx.response.body = { error: errorMessage, id };
            } else {
            ctx.status = 500;
                ctx.response.body = { error: "Error deleting study", details: errorMessage };
            }
        }
    }

    // Patients
    public static async getPatients(oid: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const patients = await patientService.getPatients(oid);
            ctx.status = 200;
            ctx.response.body = patients;
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving patients: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving patients", details: String(e) };
        }
    }

    public static async getStudyPatients(oid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const patients = await patientService.getStudyPatients(oid, id);
            ctx.status = 200;
            ctx.response.body = patients;
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving study patients: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving study patients", details: String(e) };
        }
    }

    public static async getPatient(uid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const patient = await patientService.getPatient(uid, id);
            if (patient) {
                ctx.status = 200;
                ctx.response.body = patient;
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "Patient not found", id };
            }
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving patient: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving patient", details: String(e) };
        }
    }

    public static async addPatient(oid: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const newPatient = ctx.request.body as Omit<Patient, 'id'>;
            const patient = await patientService.createPatient(oid, newPatient);
            ctx.status = 201;
            ctx.response.body = patient;
        } catch (e) {
            consoleLogError(moduleName, `Error adding patient: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error adding patient", details: String(e) };
        }
    }

    public static async updatePatient(oid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const patientData = ctx.request.body as Partial<Patient>;
            const patient = await patientService.updatePatient(oid, id, patientData);
            if (patient) {
                ctx.status = 200;
                ctx.response.body = patient;
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "Patient not found", id };
            }
        } catch (e) {
            consoleLogError(moduleName, `Error updating patient: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error updating patient", details: String(e) };
        }
    }

    public static async deletePatient(oid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const deleted = await patientService.deletePatient(oid, id);
            if (deleted) {
                ctx.status = 200;
                ctx.response.body = { message: "Patient deleted successfully" };
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "Patient not found", id };
            }
        } catch (e) {
            consoleLogError(moduleName, `Error deleting patient: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error deleting patient", details: String(e) };
        }
    }

    public static async getPatientUnavailableDates(patientId: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const dates = await patientService.getPatientUnavailableDates(patientId);
            ctx.status = 200;
            ctx.response.body = dates;
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving patient unavailable dates: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving patient unavailable dates", details: String(e) };
        }
    }

    public static async setPatientUnavailableDates(patientId: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const { dates } = ctx.request.body as { dates: string[] };
            const success = await patientService.setPatientUnavailableDates(patientId, dates || []);
            if (success) {
                ctx.status = 200;
                ctx.response.body = { message: "Patient unavailable dates updated successfully" };
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "Patient not found", patientId };
            }
        } catch (e) {
            consoleLogError(moduleName, `Error setting patient unavailable dates: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error setting patient unavailable dates", details: String(e) };
        }
    }

    public static async getPatientSchedule(patientId: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const schedule = await patientService.getPatientSchedule(patientId);
            ctx.status = 200;
            ctx.response.body = schedule;
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving patient schedule: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving patient schedule", details: String(e) };
        }
    }

    public static async setPatientSchedule(patientId: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const schedule = ctx.request.body as patientService.PatientSchedule;
            const success = await patientService.setPatientSchedule(patientId, schedule);
            if (success) {
                ctx.status = 200;
                ctx.response.body = { message: "Patient schedule updated successfully" };
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "Patient not found", patientId };
            }
        } catch (e) {
            consoleLogError(moduleName, `Error setting patient schedule: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error setting patient schedule", details: String(e) };
        }
    }

    public static async getStudyPatientsWithSchedules(studyId: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const patients = await patientService.getStudyPatientsWithSchedules(studyId);
            ctx.status = 200;
            ctx.response.body = patients;
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving study patients with schedules: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving study patients with schedules", details: String(e) };
        }
    }

    // Users  
    public static async getUsers(ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const users = await userService.getUsers();
            ctx.status = 200;
            ctx.response.body = users;
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving users: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving users", details: String(e) };
        }
    }

    public static async getUser(oid: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const user = await userService.getUser(oid);
            if (user) {
                ctx.status = 200;
                ctx.response.body = user;
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "User not found", oid };
            }
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving user: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving user", details: String(e) };
        }
    }

    public static async getUserByEmail(email: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const user = await userService.getUserByEmail(email);
            if (user) {
                ctx.status = 200;
                ctx.response.body = user;
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "User not found", email };
            }
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving user: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving user", details: String(e) };
        }
    }

    // Organizations
    public static async getOrganizations(oid: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const organizations = await organizationService.getOrganizations(oid);
            ctx.status = 200;
            ctx.response.body = organizations;
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving organizations: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving organizations", details: String(e) };
        }
    }

    public static async getOrganization(oid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const organization = await organizationService.getOrganization(oid, id);
            if (!organization) {
                ctx.status = 404;
                ctx.response.body = { error: "Organization not found" };
                return;
            }
            ctx.status = 200;
            ctx.response.body = organization;
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving organization: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving organization", details: String(e) };
        }
    }

    public static async getUserOrganization(oid: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const organization = await organizationService.getUserOrganization(oid);
            if (!organization) {
                ctx.status = 404;
                ctx.response.body = { error: "User organization not found" };
                return;
            }
            ctx.status = 200;
            ctx.response.body = organization;
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving user organization: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving user organization", details: String(e) };
        }
    }

    public static async addOrganization(oid: string, ctx: IRouterContext) {
        try {
            const body: any = (ctx.request as any).body;
            ctx.response.type = 'application/json';
            const organization = await organizationService.createOrganization(oid, body);
            ctx.status = 201;
            ctx.response.body = organization;
        } catch (e) {
            consoleLogError(moduleName, `Error adding organization: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error adding organization", details: String(e) };
        }
    }

    public static async updateOrganization(oid: string, id: string, ctx: IRouterContext) {
        try {
            const body: any = (ctx.request as any).body;
            ctx.response.type = 'application/json';
            const organization = await organizationService.updateOrganization(oid, id, body);
            ctx.status = 200;
            ctx.response.body = organization;
        } catch (e) {
            consoleLogError(moduleName, `Error updating organization: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error updating organization", details: String(e) };
        }
    }

    public static async deleteOrganization(oid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const success = await organizationService.deleteOrganization(oid, id);
            if (!success) {
                ctx.status = 404;
                ctx.response.body = { error: "Organization not found" };
                return;
            }
            ctx.status = 200;
            ctx.response.body = { success: true };
        } catch (e) {
            consoleLogError(moduleName, `Error deleting organization: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error deleting organization", details: String(e) };
        }
    }

    // Persons
    public static async getPersons(oid: string, ctx: IRouterContext) {
        try {
            consoleLogInfo(moduleName, `[getPersons] DataHandler.getPersons called with oid=${oid}`);
            ctx.response.type = 'application/json';
            consoleLogInfo(moduleName, `[getPersons] Calling personService.getPersons with oid=${oid}`);
            const persons = await personService.getPersons(oid);
            consoleLogInfo(moduleName, `[getPersons] personService.getPersons returned ${persons?.length || 0} persons`);
            ctx.status = 200;
            ctx.response.body = persons;
            consoleLogInfo(moduleName, `[getPersons] Response sent successfully with ${persons?.length || 0} persons`);
        } catch (e) {
            consoleLogError(moduleName, `[getPersons] Error retrieving persons: ${String(e)}`);
            consoleLogError(moduleName, `[getPersons] Error stack: ${e instanceof Error ? e.stack : 'No stack trace'}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving persons", details: String(e) };
        }
    }

    public static async getPerson(oid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const person = await personService.getPerson(oid, id);
            if (!person) {
                ctx.status = 404;
                ctx.response.body = { error: "Person not found" };
                return;
            }
            ctx.status = 200;
            ctx.response.body = person;
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving person: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving person", details: String(e) };
        }
    }

    public static async addPerson(oid: string, ctx: IRouterContext) {
        try {
            const body: any = (ctx.request as any).body;
            ctx.response.type = 'application/json';
            const person = await personService.createPerson(oid, body);
            ctx.status = 201;
            ctx.response.body = person;
        } catch (e) {
            consoleLogError(moduleName, `Error adding person: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error adding person", details: String(e) };
        }
    }

    public static async updatePerson(oid: string, id: string, ctx: IRouterContext) {
        try {
            const body: any = (ctx.request as any).body;
            ctx.response.type = 'application/json';
            const person = await personService.updatePerson(oid, id, body);
            ctx.status = 200;
            ctx.response.body = person;
        } catch (e) {
            consoleLogError(moduleName, `Error updating person: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error updating person", details: String(e) };
        }
    }

    public static async deletePerson(oid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const success = await personService.deletePerson(oid, id);
            if (!success) {
                ctx.status = 404;
                ctx.response.body = { error: "Person not found" };
                return;
            }
            ctx.status = 200;
            ctx.response.body = { success: true };
        } catch (e) {
            consoleLogError(moduleName, `Error deleting person: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error deleting person", details: String(e) };
        }
    }

    // Lookup data
    public static async getOrgTypes(ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const orgTypes = await organizationService.getOrgTypes();
            ctx.status = 200;
            ctx.response.body = orgTypes;
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving org types: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving org types", details: String(e) };
        }
    }

    public static async getOrgSubtypes(ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            // Get org_type_id from query string if provided
            const orgTypeId = ctx.query?.org_type_id as string | undefined;
            const orgSubtypes = await organizationService.getOrgSubtypes(orgTypeId);
            ctx.status = 200;
            ctx.response.body = orgSubtypes;
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving org subtypes: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving org subtypes", details: String(e) };
        }
    }

    public static async getPersonRoles(ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const personRoles = await personService.getPersonRoles();
            ctx.status = 200;
            ctx.response.body = personRoles;
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving person roles: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving person roles", details: String(e) };
        }
    }

    // Person Unavailable Dates
    public static async getPersonUnavailableDates(oid: string, personId: string, orgId: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const unavailableDates = await personService.getPersonUnavailableDates(oid, personId, orgId);
            ctx.status = 200;
            ctx.response.body = { unavailable: unavailableDates };
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving person unavailable dates: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving person unavailable dates", details: String(e) };
        }
    }

    public static async setPersonUnavailableDates(oid: string, personId: string, orgId: string, ctx: IRouterContext) {
        try {
            const body: any = (ctx.request as any).body;
            const unavailableDates: string[] = body.unavailable || [];
            
            await personService.setPersonUnavailableDates(oid, personId, orgId, unavailableDates);
            
            ctx.response.type = 'application/json';
            ctx.status = 200;
            ctx.response.body = { success: true, unavailable: unavailableDates };
        } catch (e) {
            consoleLogError(moduleName, `Error setting person unavailable dates: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error setting person unavailable dates", details: String(e) };
        }
    }

    // Sites
    public static async getSites(oid: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const sites = await siteService.getSites(oid);
            ctx.status = 200;
            ctx.response.body = sites;
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving sites: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving sites", details: String(e) };
        }
    }

    public static async getSite(oid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const site = await siteService.getSite(oid, id);
            if (!site) {
                ctx.status = 404;
                ctx.response.body = { error: "Site not found" };
                return;
            }
            ctx.status = 200;
            ctx.response.body = site;
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving site: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving site", details: String(e) };
        }
    }

    public static async getStudySites(oid: string, studyId: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const sites = await siteService.getStudySites(oid, studyId);
            ctx.status = 200;
            ctx.response.body = sites;
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving study sites: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving study sites", details: String(e) };
        }
    }

    public static async getOrganizationSites(oid: string, orgId: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const sites = await siteService.getOrganizationSites(oid, orgId);
            ctx.status = 200;
            ctx.response.body = sites;
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving organization sites: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving organization sites", details: String(e) };
        }
    }

    public static async getUserStudySite(oid: string, studyId: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const site = await siteService.getUserStudySite(oid, studyId);
            if (site) {
                ctx.status = 200;
                ctx.response.body = site;
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "Site not found" };
            }
        } catch (e) {
            consoleLogError(moduleName, `Error retrieving user study site: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving user study site", details: String(e) };
        }
    }

    public static async updateSiteNumber(oid: string, siteId: string, ctx: IRouterContext) {
        try {
            const body: any = (ctx.request as any).body;
            ctx.response.type = 'application/json';
            const site = await siteService.updateSiteNumber(oid, siteId, body.siteNumber);
            ctx.status = 200;
            ctx.response.body = site;
        } catch (e) {
            consoleLogError(moduleName, `Error updating site number: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error updating site number", details: String(e) };
        }
    }

    public static async addSite(oid: string, ctx: IRouterContext) {
        try {
            const body: any = (ctx.request as any).body;
            ctx.response.type = 'application/json';
            const site = await siteService.createSite(oid, body);
            ctx.status = 201;
            ctx.response.body = site;
        } catch (e) {
            consoleLogError(moduleName, `Error adding site: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error adding site", details: String(e) };
        }
    }

    public static async updateSite(oid: string, id: string, ctx: IRouterContext) {
        try {
            const body: any = (ctx.request as any).body;
            ctx.response.type = 'application/json';
            const site = await siteService.updateSite(oid, id, body);
            ctx.status = 200;
            ctx.response.body = site;
        } catch (e) {
            consoleLogError(moduleName, `Error updating site: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error updating site", details: String(e) };
        }
    }

    public static async deleteSite(oid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const success = await siteService.deleteSite(oid, id);
            if (!success) {
                ctx.status = 404;
                ctx.response.body = { error: "Site not found" };
                return;
            }
            ctx.status = 200;
            ctx.response.body = { success: true };
        } catch (e) {
            consoleLogError(moduleName, `Error deleting site: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error deleting site", details: String(e) };
        }
    }
}
