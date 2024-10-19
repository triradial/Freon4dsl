import * as fs from "fs";
import { IRouterContext } from "koa-router";
import * as path from "node:path";

const dataStoreFolder = "./datastore";

export class DataHandler {

    private static checkDataStoreFolder() {
        try {
            if (!fs.existsSync(dataStoreFolder)) {
                fs.mkdirSync(dataStoreFolder, { recursive: true });
            }
        } catch (e) {
            console.log(e.message);
        }
    }

    private static getUserFacility(uid: string): string {
        const usersFile = path.join(dataStoreFolder, "users.json");
        if (fs.existsSync(usersFile)) {
            const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
            const user = users.find((u: any) => u.userid === uid);
            if (user) {
                return user.facility;
            }
        }
        throw new Error("User not found uid: " + uid);
    }

    private static getFacilityFolder(uid: string): string {
        const facility = this.getUserFacility(uid);
        const facilityFolder = path.join(dataStoreFolder, facility);
        if (!fs.existsSync(facilityFolder)) {
            fs.mkdirSync(facilityFolder, { recursive: true });
        }
        return facilityFolder;
    }

    // Studies
    public static async getStudies(uid: string, ctx: IRouterContext) {
        try {
            this.checkDataStoreFolder();
            const facilityFolder = this.getFacilityFolder(uid);
            const studiesFile = path.join(facilityFolder, "studies.json");
            if (fs.existsSync(studiesFile)) {
                const studies = JSON.parse(fs.readFileSync(studiesFile, 'utf8'));
                ctx.response.type = 'application/json';
                ctx.response.body = studies;
            } else {
                ctx.response.body = JSON.stringify([]);
            }
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.message = "Error retrieving studies";
        }
    }

    public static async getStudy(uid: string, id: string, ctx: IRouterContext) {
        try {
            this.checkDataStoreFolder();
            const facilityFolder = this.getFacilityFolder(uid);
            const studiesFile = path.join(facilityFolder, "studies.json");
            if (fs.existsSync(studiesFile)) {
                const studies = JSON.parse(fs.readFileSync(studiesFile, 'utf8'));
                const study = studies.find((s: any) => s.id === id);
                if (study) {
                    ctx.response.body = study;
                } else {
                    ctx.status = 404;
                    ctx.message = "Study not found";
                }
            } else {
                ctx.status = 404;
                ctx.message = "Study not found";
            }
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.message = "Error retrieving study";
        }
    }

    public static async addStudy(uid: string, ctx: IRouterContext) {
        try {
            this.checkDataStoreFolder();
            const facilityFolder = this.getFacilityFolder(uid);
            const studiesFile = path.join(facilityFolder, "studies.json");
            let studies = [];
            if (fs.existsSync(studiesFile)) {
                studies = JSON.parse(fs.readFileSync(studiesFile, 'utf8'));
            }
            const newStudy = ctx.request.body;
            studies.push(newStudy);
            fs.writeFileSync(studiesFile, JSON.stringify(studies, null, 2));
            ctx.response.body = newStudy;
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.message = "Error adding study";
        }
    }

    public static async updateStudy(uid: string, id: string, ctx: IRouterContext) {
        try {
            this.checkDataStoreFolder();
            const facilityFolder = this.getFacilityFolder(uid);
            const studiesFile = path.join(facilityFolder, "studies.json");
            if (fs.existsSync(studiesFile)) {
                let studies = JSON.parse(fs.readFileSync(studiesFile, 'utf8'));
                const index = studies.findIndex((s: any) => s.id === id);
                if (index !== -1) {
                    studies[index] = { ...studies[index], ...ctx.request.body as object };
                    fs.writeFileSync(studiesFile, JSON.stringify(studies, null, 2));
                    ctx.response.body = studies[index];
                } else {
                    ctx.status = 404;
                    ctx.message = "Study not found";
                }
            } else {
                ctx.status = 404;
                ctx.message = "Study not found";
            }
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.message = "Error updating study";
        }
    }

    public static async deleteStudy(uid: string, id: string, ctx: IRouterContext) {
        try {
            this.checkDataStoreFolder();
            const facilityFolder = this.getFacilityFolder(uid);
            const studiesFile = path.join(facilityFolder, "studies.json");
            if (fs.existsSync(studiesFile)) {
                let studies = JSON.parse(fs.readFileSync(studiesFile, 'utf8'));
                const filteredStudies = studies.filter((s: any) => s.id !== id);
                if (filteredStudies.length < studies.length) {
                    fs.writeFileSync(studiesFile, JSON.stringify(filteredStudies, null, 2));
                    ctx.response.body = { message: "Study deleted successfully" };
                } else {
                    ctx.status = 404;
                    ctx.message = "Study not found";
                }
            } else {
                ctx.status = 404;
                ctx.message = "Study not found";
            }
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.message = "Error deleting study";
        }
    }

    // Patients
    public static async getPatients(uid: string, ctx: IRouterContext) {
        try {
            this.checkDataStoreFolder();
            const facilityFolder = this.getFacilityFolder(uid);
            const patientsFile = path.join(facilityFolder, "patients.json");
            if (fs.existsSync(patientsFile)) {
                const patientsData = fs.readFileSync(patientsFile, 'utf8');
                ctx.response.type = 'application/json';
                ctx.response.body = patientsData;
            } else {
                ctx.response.body = JSON.stringify([]);
            }
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.message = "Error retrieving patients";
        }
    }

    public static async getStudyPatients(uid: string, id: string, ctx: IRouterContext) {
        try {
            this.checkDataStoreFolder();
            const facilityFolder = this.getFacilityFolder(uid);
            const patientsFile = path.join(facilityFolder, "patients.json");
            if (fs.existsSync(patientsFile)) {
                const patients = JSON.parse(fs.readFileSync(patientsFile, 'utf8'));
                const studyPatients = patients.filter((p: any) => p.studyId === id);
                ctx.response.type = 'application/json';
                ctx.response.body = studyPatients;
            } else {
                ctx.response.body = JSON.stringify([]);
            }
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.message = "Error retrieving study patients";
        }
    }

    public static async getPatient(uid: string, id: string, ctx: IRouterContext) {
        try {
            this.checkDataStoreFolder();
            const facilityFolder = this.getFacilityFolder(uid);
            const patientsFile = path.join(facilityFolder, "patients.json");
            if (fs.existsSync(patientsFile)) {
                const patients = JSON.parse(fs.readFileSync(patientsFile, 'utf8'));
                const patient = patients.find((p: any) => p.id === id);
                if (patient) {
                    ctx.response.body = patient;
                } else {
                    ctx.status = 404;
                    ctx.message = "Patient not found";
                }
            } else {
                ctx.status = 404;
                ctx.message = "Patient not found";
            }
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.message = "Error retrieving patient";
        }
    }

    public static async addPatient(uid: string, ctx: IRouterContext) {
        try {
            this.checkDataStoreFolder();
            const facilityFolder = this.getFacilityFolder(uid);
            const patientsFile = path.join(facilityFolder, "patients.json");
            let patients = [];
            if (fs.existsSync(patientsFile)) {
                patients = JSON.parse(fs.readFileSync(patientsFile, 'utf8'));
            }
            const newPatient = ctx.request.body;
            patients.push(newPatient);
            fs.writeFileSync(patientsFile, JSON.stringify(patients, null, 2));
            ctx.response.body = newPatient;
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.message = "Error adding patient";
        }
    }

    public static async updatePatient(uid: string, id: string, ctx: IRouterContext) {
        try {
            this.checkDataStoreFolder();
            const facilityFolder = this.getFacilityFolder(uid);
            const patientsFile = path.join(facilityFolder, "patients.json");
            if (fs.existsSync(patientsFile)) {
                let patients = JSON.parse(fs.readFileSync(patientsFile, 'utf8'));
                const index = patients.findIndex((p: any) => p.id === id);
                if (index !== -1) {
                    patients[index] = { ...patients[index], ...ctx.request.body as object };
                    fs.writeFileSync(patientsFile, JSON.stringify(patients, null, 2));
                    ctx.response.body = patients[index];
                } else {
                    ctx.status = 404;
                    ctx.message = "Patient not found";
                }
            } else {
                ctx.status = 404;
                ctx.message = "Patient not found";
            }
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.message = "Error updating patient";
        }
    }

    public static async deletePatient(uid: string, id: string, ctx: IRouterContext) {
        try {
            this.checkDataStoreFolder();
            const facilityFolder = this.getFacilityFolder(uid);
            const patientsFile = path.join(facilityFolder, "patients.json");
            if (fs.existsSync(patientsFile)) {
                let patients = JSON.parse(fs.readFileSync(patientsFile, 'utf8'));
                const filteredPatients = patients.filter((p: any) => p.id !== id);
                if (filteredPatients.length < patients.length) {
                    fs.writeFileSync(patientsFile, JSON.stringify(filteredPatients, null, 2));
                    ctx.response.body = { message: "Patient deleted successfully" };
                } else {
                    ctx.status = 404;
                    ctx.message = "Patient not found";
                }
            } else {
                ctx.status = 404;
                ctx.message = "Patient not found";
            }
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.message = "Error deleting patient";
        }
    }

    // Users
    public static async getUsers(ctx: IRouterContext) {
        try {
            this.checkDataStoreFolder();
            const usersFile = path.join(dataStoreFolder, "users.json");
            if (fs.existsSync(usersFile)) {
                const usersData = fs.readFileSync(usersFile, 'utf8');
                ctx.response.type = 'application/json';
                ctx.response.body = usersData;
            } else {
                ctx.response.body = JSON.stringify([]);
            }
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.message = "Error retrieving users";
        }
    }

    public static async getUser(uid: string, ctx: IRouterContext) {
        try {
            this.checkDataStoreFolder();
            const usersFile = path.join(dataStoreFolder, "users.json");
            if (fs.existsSync(usersFile)) {
                const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
                const user = users.find((u: any) => u.userid === uid);
                if (user) {
                    ctx.response.body = user;
                } else {
                    ctx.status = 404;
                    ctx.message = "User not found uid: " + uid;
                }
            } else {
                ctx.status = 404;
                ctx.message = "User not found uid: " + uid;
            }
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.message = "Error retrieving user";
        }
    }

    public static async getUserByEmail(email: string, ctx: IRouterContext) {
        try {
            this.checkDataStoreFolder();
            const usersFile = path.join(dataStoreFolder, "users.json");
            if (fs.existsSync(usersFile)) {
                const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
                const user = users.find((u: any) => u.email === email);
                if (user) {
                    ctx.response.body = user;
                } else {
                    ctx.status = 404;
                    ctx.message = "User not found email: " + email;
                }
            } else {
                ctx.status = 404;
                ctx.message = "User not found email: " + email;
            }
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.message = "Error retrieving user";
        }
    }
}