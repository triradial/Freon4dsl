import { IRouterContext } from "koa-router";
import * as path from "node:path";
import { StorageFactory } from '../storage/StorageFactory.js';

const storage = StorageFactory.getStorageHandler();

export class DataHandler {

    private static async getUserFacility(uid: string): Promise<string> {
        console.log("DataHandler.getUserFacility: uid:" + uid);
        const usersFile = "users.json";
        const usersContent = await storage.readFile(usersFile);
        const users = JSON.parse(usersContent);
        const user = users.find((u: any) => u.userid === uid);
        if (!user) {
            throw new Error(`User not found uid: ${uid}`);
        }
        return user.facility;
    }

    private static async getFacilityFolder(uid: string): Promise<string> {
        const facility = await this.getUserFacility(uid);
        const facilityFolder = path.join("facilities", facility);
        return facilityFolder;
    }

    // Studies
    public static async getStudies(uid: string, ctx: IRouterContext) {
        var step = "1";
        try {
            ctx.response.type = 'application/json';
            const facilityFolder = await this.getFacilityFolder(uid);
            step = "2";
            const studiesFile = path.join(facilityFolder, "studies.json");
            step = "3";
            if (await storage.fileExists(studiesFile)) {
                const studiesContent = await storage.readFile(studiesFile);
                step = "4";
                ctx.status = 200;
                ctx.response.body = JSON.parse(studiesContent);
            } else {
                ctx.status = 200;
                ctx.response.body = [];
            }
        } catch (e) {
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving studies", details: step };
        }
    }

    public static async getStudy(uid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const facilityFolder = await this.getFacilityFolder(uid);
            const studiesFile = path.join(facilityFolder, "studies.json");

            if (await storage.fileExists(studiesFile)) {
                const studiesContent = await storage.readFile(studiesFile);
                const studies = JSON.parse(studiesContent);
                const study = studies.find((s: any) => s.id === id);
                if (study) {
                    ctx.status = 200;
                    ctx.response.body = study;
                } else {
                    ctx.status = 404;
                    ctx.response.body = { error: "Study not found", id };
                }
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "Studies file not found" };
            }
        } catch (e) {
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving study", details: e.message };
        }
    }

    public static async addStudy(uid: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const facilityFolder = await this.getFacilityFolder(uid);
            const studiesFile = path.join(facilityFolder, "studies.json");

            let studies = [];
            if (await storage.fileExists(studiesFile)) {
                const studiesContent = await storage.readFile(studiesFile);
                studies = JSON.parse(studiesContent);
            }
            const newStudy = ctx.request.body;
            studies.push(newStudy);
            await storage.writeFile(studiesFile, JSON.stringify(studies, null, 2));
            ctx.status = 201;
            ctx.response.body = newStudy;
        } catch (e) {
            ctx.status = 500;
            ctx.response.body = { error: "Error adding study", details: e.message };
        }
    }

    public static async updateStudy(uid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const facilityFolder = await this.getFacilityFolder(uid);
            const studiesFile = path.join(facilityFolder, "studies.json");

            if (await storage.fileExists(studiesFile)) {
                const studiesContent = await storage.readFile(studiesFile);
                let studies = JSON.parse(studiesContent);
                const index = studies.findIndex((s: any) => s.id === id);
                if (index !== -1) {
                    studies[index] = { ...studies[index], ...ctx.request.body as object };
                    await storage.writeFile(studiesFile, JSON.stringify(studies, null, 2));
                    ctx.status = 200;
                    ctx.response.body = studies[index];
                } else {
                    ctx.status = 404;
                    ctx.response.body = { error: "Study not found", id };
                }
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "Studies file not found" };
            }
        } catch (e) {
            ctx.status = 500;
            ctx.response.body = { error: "Error updating study", details: e.message };
        }
    }

    public static async deleteStudy(uid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const facilityFolder = await this.getFacilityFolder(uid);
            const studiesFile = path.join(facilityFolder, "studies.json");

            if (await storage.fileExists(studiesFile)) {
                const studiesContent = await storage.readFile(studiesFile);
                let studies = JSON.parse(studiesContent);
                const filteredStudies = studies.filter((s: any) => s.id !== id);
                if (filteredStudies.length < studies.length) {
                    await storage.writeFile(studiesFile, JSON.stringify(filteredStudies, null, 2));
                    ctx.status = 200;
                    ctx.response.body = { message: "Study deleted successfully" };
                } else {
                    ctx.status = 404;
                    ctx.response.body = { error: "Study not found", id };
                }
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "Studies file not found" };
            }
        } catch (e) {
            ctx.status = 500;
            ctx.response.body = { error: "Error deleting study", details: e.message };
        }
    }

    // Patients
    public static async getPatients(uid: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const facilityFolder = await this.getFacilityFolder(uid);
            const patientsFile = path.join(facilityFolder, "patients.json");

            if (await storage.fileExists(patientsFile)) {
                const patientsContent = await storage.readFile(patientsFile);
                ctx.status = 200;
                ctx.response.body = JSON.parse(patientsContent);
            } else {
                ctx.status = 200;
                ctx.response.body = [];
            }
        } catch (e) {
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving patients", details: e.message };
        }
    }

    public static async getStudyPatients(uid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const facilityFolder = await this.getFacilityFolder(uid);
            const patientsFile = path.join(facilityFolder, "patients.json");

            if (await storage.fileExists(patientsFile)) {
                const patientsContent = await storage.readFile(patientsFile);
                const patients = JSON.parse(patientsContent);
                const studyPatients = patients.filter((p: any) => p.studyId === id);
                ctx.status = 200;
                ctx.response.body = studyPatients;
            } else {
                ctx.status = 200;
                ctx.response.body = [];
            }
        } catch (e) {
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving study patients", details: e.message };
        }
    }

    public static async getPatient(uid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const facilityFolder = await this.getFacilityFolder(uid);
            const patientsFile = path.join(facilityFolder, "patients.json");

            if (await storage.fileExists(patientsFile)) {
                const patientsContent = await storage.readFile(patientsFile);
                const patients = JSON.parse(patientsContent);
                const patient = patients.find((p: any) => p.id === id);
                if (patient) {
                    ctx.status = 200;
                    ctx.response.body = patient;
                } else {
                    ctx.status = 404;
                    ctx.response.body = { error: "Patient not found", id };
                }
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "Patients file not found" };
            }
        } catch (e) {
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving patient", details: e.message };
        }
    }

    public static async addPatient(uid: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const facilityFolder = await this.getFacilityFolder(uid);
            const patientsFile = path.join(facilityFolder, "patients.json");

            let patients = [];
            if (await storage.fileExists(patientsFile)) {
                const patientsContent = await storage.readFile(patientsFile);
                patients = JSON.parse(patientsContent);
            }
            const newPatient = ctx.request.body;
            patients.push(newPatient);
            await storage.writeFile(patientsFile, JSON.stringify(patients, null, 2));
            ctx.status = 201;
            ctx.response.body = newPatient;
        } catch (e) {
            ctx.status = 500;
            ctx.response.body = { error: "Error adding patient", details: e.message };
        }
    }

    public static async updatePatient(uid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const facilityFolder = await this.getFacilityFolder(uid);
            const patientsFile = path.join(facilityFolder, "patients.json");

            if (await storage.fileExists(patientsFile)) {
                const patientsContent = await storage.readFile(patientsFile);
                let patients = JSON.parse(patientsContent);
                const index = patients.findIndex((p: any) => p.id === id);
                if (index !== -1) {
                    patients[index] = { ...patients[index], ...ctx.request.body as object };
                    await storage.writeFile(patientsFile, JSON.stringify(patients, null, 2));
                    ctx.status = 200;
                    ctx.response.body = patients[index];
                } else {
                    ctx.status = 404;
                    ctx.response.body = { error: "Patient not found", id };
                }
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "Patients file not found" };
            }
        } catch (e) {
            ctx.status = 500;
            ctx.response.body = { error: "Error updating patient", details: e.message };
        }
    }

    public static async deletePatient(uid: string, id: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const facilityFolder = await this.getFacilityFolder(uid);
            const patientsFile = path.join(facilityFolder, "patients.json");

            if (await storage.fileExists(patientsFile)) {
                const patientsContent = await storage.readFile(patientsFile);
                let patients = JSON.parse(patientsContent);
                const filteredPatients = patients.filter((p: any) => p.id !== id);
                if (filteredPatients.length < patients.length) {
                    await storage.writeFile(patientsFile, JSON.stringify(filteredPatients, null, 2));
                    ctx.status = 200;
                    ctx.response.body = { message: "Patient deleted successfully" };
                } else {
                    ctx.status = 404;
                    ctx.response.body = { error: "Patient not found", id };
                }
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "Patients file not found" };
            }
        } catch (e) {
            ctx.status = 500;
            ctx.response.body = { error: "Error deleting patient", details: e.message };
        }
    }

    // Users
    public static async getUsers(ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const usersFile = "users.json";

            if (await storage.fileExists(usersFile)) {
                const usersContent = await storage.readFile(usersFile);
                ctx.status = 200;
                ctx.response.body = JSON.parse(usersContent);
            } else {
                ctx.status = 200;
                ctx.response.body = [];
            }
        } catch (e) {
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving users", details: e.message };
        }
    }

    public static async getUser(uid: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const usersFile = "users.json";

            if (await storage.fileExists(usersFile)) {
                const usersContent = await storage.readFile(usersFile);
                const users = JSON.parse(usersContent);
                const user = users.find((u: any) => u.userid === uid);
                if (user) {
                    ctx.status = 200;
                    ctx.response.body = user;
                } else {
                    ctx.status = 404;
                    ctx.response.body = { error: "User not found", uid };
                }
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "Users file not found" };
            }
        } catch (e) {
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving user", details: e.message };
        }
    }

    public static async getUserByEmail(email: string, ctx: IRouterContext) {
        try {
            ctx.response.type = 'application/json';
            const usersFile = "users.json";
            console.log("getUserByEmail path: " + usersFile);

            if (await storage.fileExists(usersFile)) {
                const usersContent = await storage.readFile(usersFile);
                const users = JSON.parse(usersContent);
                const user = users.find((u: any) => u.email === email);
                if (user) {
                    ctx.status = 200;
                    ctx.response.body = user;
                } else {
                    ctx.status = 404;
                    ctx.response.body = { error: "User not found", email };
                }
            } else {
                ctx.status = 404;
                ctx.response.body = { error: "Users file not found" };
            }
        } catch (e) {
            ctx.status = 500;
            ctx.response.body = { error: "Error retrieving user", details: e.message };
        }
    }
}