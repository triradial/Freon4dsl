#!/usr/bin/env ts-node
/**
 * Utility to load test studies from modelstore into the database
 *
 * Usage:
 *   ts-node load-studies-to-db.ts [options]
 *
 * Options:
 *   --user-oid <oid>      User's Azure OID (required)
 *   --study <name>        Load specific study (optional, loads all if omitted)
 *   --server-url <url>    Server URL (default: http://localhost:3001)
 *   --dry-run             Preview what would be loaded without saving
 *
 * Examples:
 *   ts-node load-studies-to-db.ts --user-oid abc123
 *   ts-node load-studies-to-db.ts --user-oid abc123 --study ScheduleExample1
 *   ts-node load-studies-to-db.ts --user-oid abc123 --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

interface Study {
    id?: string;
    name: string;
    title: string;
    phase: string;
    status: string;
    therapeuticArea?: string;
    siteNumber: string;
    [key: string]: any;
}

interface StudyFiles {
    studyName: string;
    studyConfigPath: string;
    patientInfoPath: string;
    availabilityPath: string;
    patientHistoryPath?: string;
}

interface LoadOptions {
    userOid: string;
    studyName?: string;
    serverUrl: string;
    dryRun: boolean;
}

const MODELSTORE_DIR = path.join(__dirname, 'modelstore');

/**
 * Parse command-line arguments
 */
function parseArgs(): LoadOptions {
    const args = process.argv.slice(2);
    const options: LoadOptions = {
        userOid: '',
        serverUrl: 'http://localhost:8080',
        dryRun: false
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--user-oid':
                options.userOid = args[++i];
                break;
            case '--study':
                options.studyName = args[++i];
                break;
            case '--server-url':
                options.serverUrl = args[++i];
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--help':
            case '-h':
                printUsage();
                process.exit(0);
                break;
            default:
                console.error(`Unknown option: ${args[i]}`);
                printUsage();
                process.exit(1);
        }
    }

    if (!options.userOid) {
        console.error('Error: --user-oid is required');
        printUsage();
        process.exit(1);
    }

    return options;
}

function printUsage() {
    console.log(`
Usage: ts-node load-studies-to-db.ts [options]

Options:
  --user-oid <oid>      User's Azure OID (required)
  --study <name>        Load specific study (optional, loads all if omitted)
  --server-url <url>    Server URL (default: http://localhost:3001)
  --dry-run             Preview what would be loaded without saving
  --help, -h            Show this help message

Examples:
  ts-node load-studies-to-db.ts --user-oid abc123
  ts-node load-studies-to-db.ts --user-oid abc123 --study ScheduleExample1
  ts-node load-studies-to-db.ts --user-oid abc123 --dry-run
    `);
}

/**
 * Get list of all study directories in modelstore
 */
async function getStudyDirectories(): Promise<string[]> {
    const entries = await readdir(MODELSTORE_DIR);
    const studyDirs: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(MODELSTORE_DIR, entry);
        const stats = await stat(fullPath);
        if (stats.isDirectory()) {
            studyDirs.push(entry);
        }
    }

    return studyDirs;
}

/**
 * Find study files in a directory
 * Prefers "Public" versions if they exist
 */
async function findStudyFiles(studyName: string): Promise<StudyFiles | null> {
    const studyDir = path.join(MODELSTORE_DIR, studyName);

    try {
        const files = await readdir(studyDir);

        // Prefer Public versions
        const studyConfigFile = files.find(f => f === 'StudyConfigurationPublic.json')
                             || files.find(f => f === 'StudyConfiguration.json');
        const patientInfoFile = files.find(f => f === 'PatientInfoPublic.json')
                             || files.find(f => f === 'PatientInfo.json');
        const availabilityFile = files.find(f => f === 'AvailabilityPublic.json')
                              || files.find(f => f === 'Availability.json');
        const patientHistoryFile = files.find(f => f === 'PatientHistoryUnit.json');

        if (!studyConfigFile) {
            console.warn(`  Warning: No StudyConfiguration.json found for ${studyName}`);
            return null;
        }

        return {
            studyName,
            studyConfigPath: path.join(studyDir, studyConfigFile),
            patientInfoPath: patientInfoFile ? path.join(studyDir, patientInfoFile) : '',
            availabilityPath: availabilityFile ? path.join(studyDir, availabilityFile) : '',
            patientHistoryPath: patientHistoryFile ? path.join(studyDir, patientHistoryFile) : undefined
        };
    } catch (error) {
        console.error(`  Error accessing ${studyName}:`, error);
        return null;
    }
}

/**
 * Extract study metadata from StudyConfiguration.json
 * This creates a minimal Study object that matches the UI's structure
 */
async function extractStudyMetadata(files: StudyFiles): Promise<Study | null> {
    try {
        // For now, we'll create a basic study structure
        // In a real implementation, you'd parse the StudyConfiguration.json
        // to extract relevant fields

        const study: Study = {
            name: files.studyName,
            title: files.studyName.replace(/([A-Z])/g, ' $1').trim(), // Convert camelCase to title
            phase: 'Phase 3', // Default, could be extracted from JSON
            status: 'Active',
            therapeuticArea: 'Oncology', // Default, could be extracted from JSON
            siteNumber: '001' // Default site number
        };

        return study;
    } catch (error) {
        console.error(`  Error extracting metadata from ${files.studyName}:`, error);
        return null;
    }
}

/**
 * Upload a model unit (Availability, PatientInfo, or StudyConfiguration) to the server
 */
async function uploadModelUnit(
    studyId: string,
    unitName: string,
    filePath: string,
    options: LoadOptions
): Promise<boolean> {
    try {
        if (!filePath) {
            console.log(`    ℹ Skipping ${unitName} (file not found)`);
            return true;
        }

        const content = await readFile(filePath, 'utf-8');
        const modelData = JSON.parse(content);

        const url = `${options.serverUrl}/saveModelUnit?model=${studyId}&unit=${unitName}`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(modelData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`    ✗ Failed to upload ${unitName}: ${response.status} ${response.statusText}`);
            console.error(`    Error details: ${errorText}`);
            return false;
        }

        console.log(`    ✓ Uploaded ${unitName}`);
        return true;
    } catch (error) {
        console.error(`    ✗ Error uploading ${unitName}:`, error);
        return false;
    }
}

/**
 * Create an empty model unit with basic structure
 */
function createEmptyModelUnit(unitName: string, unitType: string): any {
    return {
        serializationFormatVersion: "2023.1",
        languages: [],
        nodes: [
            {
                id: `${unitName}-1`,
                classifier: {
                    language: "-key-StudyConfigurationModel",
                    version: "2023.1",
                    key: `-key-${unitType}`
                },
                properties: [
                    {
                        property: {
                            language: "-key-StudyConfigurationModel",
                            version: "2023.1",
                            key: `-key-${unitType}-name`
                        },
                        value: unitName
                    }
                ],
                children: [],
                references: [],
                annotations: [],
                parent: null
            }
        ]
    };
}

/**
 * Upload an empty model unit to the server
 */
async function uploadEmptyModelUnit(
    studyId: string,
    unitName: string,
    unitType: string,
    options: LoadOptions
): Promise<boolean> {
    try {
        const modelData = createEmptyModelUnit(unitName, unitType);
        const url = `${options.serverUrl}/saveModelUnit?model=${studyId}&unit=${unitName}`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(modelData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`    ✗ Failed to create empty ${unitName}: ${response.status} ${response.statusText}`);
            console.error(`    Error details: ${errorText}`);
            return false;
        }

        console.log(`    ✓ Created empty ${unitName}`);
        return true;
    } catch (error) {
        console.error(`    ✗ Error creating empty ${unitName}:`, error);
        return false;
    }
}

/**
 * Save study to database via API and upload model files
 */
async function saveStudyToDatabase(
    study: Study,
    files: StudyFiles,
    options: LoadOptions
): Promise<boolean> {
    try {
        const url = `${options.serverUrl}/addStudyWithSite?uid=${options.userOid}`;

        console.log(`  Saving ${study.name} to ${url}...`);

        const studyToSend = {
            ...study,
            therapeutic_area: study.therapeuticArea
        };
        delete studyToSend.therapeuticArea;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studyToSend)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`  Failed to save ${study.name}: ${response.status} ${response.statusText}`);
            console.error(`  Error details: ${errorText}`);
            return false;
        }

        const result = await response.json();
        const studyId = result.id;
        console.log(`  ✓ Successfully saved ${study.name} (ID: ${studyId})`);

        // Upload model files (matching UI behavior)
        console.log(`  Uploading model files...`);

        // 1. Upload Availability (empty if no file)
        let availabilitySuccess: boolean;
        if (files.availabilityPath) {
            availabilitySuccess = await uploadModelUnit(studyId, 'Availability', files.availabilityPath, options);
        } else {
            availabilitySuccess = await uploadEmptyModelUnit(studyId, 'Availability', 'Availability', options);
        }

        if (!availabilitySuccess) {
            console.error(`  ✗ Failed to upload Availability for ${study.name}`);
            return false;
        }

        // 2. Upload PatientInfo (empty if no file)
        let patientInfoSuccess: boolean;
        if (files.patientInfoPath) {
            patientInfoSuccess = await uploadModelUnit(studyId, 'PatientInfo', files.patientInfoPath, options);
        } else {
            patientInfoSuccess = await uploadEmptyModelUnit(studyId, 'PatientInfo', 'PatientInfo', options);
        }

        if (!patientInfoSuccess) {
            console.error(`  ✗ Failed to upload PatientInfo for ${study.name}`);
            return false;
        }

        // 3. Upload StudyConfiguration (required)
        if (!files.studyConfigPath) {
            console.error(`  ✗ No StudyConfiguration file found for ${study.name}`);
            return false;
        }

        const studyConfigSuccess = await uploadModelUnit(studyId, 'StudyConfiguration', files.studyConfigPath, options);
        if (!studyConfigSuccess) {
            console.error(`  ✗ Failed to upload StudyConfiguration for ${study.name}`);
            return false;
        }

        console.log(`  ✓ All model files uploaded successfully`);
        return true;
    } catch (error) {
        console.error(`  Error saving ${study.name}:`, error);
        return false;
    }
}

/**
 * Load a single study
 */
async function loadStudy(studyName: string, options: LoadOptions): Promise<boolean> {
    console.log(`\nProcessing ${studyName}...`);

    const files = await findStudyFiles(studyName);
    if (!files) {
        return false;
    }

    console.log(`  Found files:`);
    console.log(`    - StudyConfiguration: ${path.basename(files.studyConfigPath)}`);
    if (files.patientInfoPath) {
        console.log(`    - PatientInfo: ${path.basename(files.patientInfoPath)}`);
    }
    if (files.availabilityPath) {
        console.log(`    - Availability: ${path.basename(files.availabilityPath)}`);
    }
    if (files.patientHistoryPath) {
        console.log(`    - PatientHistory: ${path.basename(files.patientHistoryPath)}`);
    }

    const study = await extractStudyMetadata(files);
    if (!study) {
        return false;
    }

    console.log(`  Study metadata:`);
    console.log(`    - Name: ${study.name}`);
    console.log(`    - Title: ${study.title}`);
    console.log(`    - Phase: ${study.phase}`);
    console.log(`    - Status: ${study.status}`);
    console.log(`    - Site Number: ${study.siteNumber}`);

    if (options.dryRun) {
        console.log(`  [DRY RUN] Would save to: ${options.serverUrl}/addStudyWithSite?uid=${options.userOid}`);
        return true;
    }

    return await saveStudyToDatabase(study, files, options);
}

/**
 * Main function
 */
async function main() {
    const options = parseArgs();

    console.log('Study Loader Utility');
    console.log('====================');
    console.log(`User OID: ${options.userOid}`);
    console.log(`Server URL: ${options.serverUrl}`);
    console.log(`Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);
    console.log(`Modelstore: ${MODELSTORE_DIR}`);

    let studyNames: string[];

    if (options.studyName) {
        console.log(`Loading specific study: ${options.studyName}`);
        studyNames = [options.studyName];
    } else {
        console.log('Loading all studies...');
        studyNames = await getStudyDirectories();
        console.log(`Found ${studyNames.length} studies in modelstore`);
    }

    let successCount = 0;
    let failCount = 0;

    for (const studyName of studyNames) {
        const success = await loadStudy(studyName, options);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
    }

    console.log('\n====================');
    console.log('Summary:');
    console.log(`  ✓ Success: ${successCount}`);
    console.log(`  ✗ Failed: ${failCount}`);
    console.log(`  Total: ${studyNames.length}`);

    if (options.dryRun) {
        console.log('\nThis was a dry run. Use without --dry-run to actually save to database.');
    }

    process.exit(failCount > 0 ? 1 : 0);
}

// Run if executed directly
// In ES modules, we check if this is the main module by comparing import.meta.url
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export {
    loadStudy,
    getStudyDirectories,
    findStudyFiles,
    extractStudyMetadata,
    saveStudyToDatabase,
    type LoadOptions,
    type Study,
    type StudyFiles
};
