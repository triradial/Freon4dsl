#!/usr/bin/env node

/**
 * Script to clean up ISLR datastore:
 * 1. Delete all folders in packages/server-islr/datastore/projects
 * 2. Empty packages/server-islr/datastore/facilities/facility-001/studies.json
 */

const fs = require('fs');
const path = require('path');

const PROJECTS_DIR = path.join(__dirname, '..', 'packages', 'server-islr', 'datastore', 'projects');
const STUDIES_FILE = path.join(__dirname, '..', 'packages', 'server-islr', 'datastore', 'facilities', 'facility-001', 'studies.json');
const PROJECTS_FILE = path.join(__dirname, '..', 'packages', 'server-islr', 'datastore', 'facilities', 'facility-001', 'projects.json');

function deleteProjectFolders() {
    console.log('Deleting project folders from:', PROJECTS_DIR);
    
    if (!fs.existsSync(PROJECTS_DIR)) {
        console.log('Projects directory does not exist, skipping...');
        return;
    }

    const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
    let deletedCount = 0;

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const folderPath = path.join(PROJECTS_DIR, entry.name);
            console.log(`  Deleting folder: ${entry.name}`);
            fs.rmSync(folderPath, { recursive: true, force: true });
            deletedCount++;
        }
    }

    console.log(`Deleted ${deletedCount} project folder(s)\n`);
}

function emptyStudiesJson() {
    console.log('Emptying studies.json:', STUDIES_FILE);
    
    if (!fs.existsSync(STUDIES_FILE)) {
        console.log('Studies.json file does not exist, creating empty file...');
        // Ensure directory exists
        const dir = path.dirname(STUDIES_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    const emptyArray = [];
    fs.writeFileSync(STUDIES_FILE, JSON.stringify(emptyArray, null, 2));
    console.log('Studies.json has been emptied\n');
}

function emptyProjectsJson() {
    console.log('Emptying projects.json:', PROJECTS_FILE);
    
    if (!fs.existsSync(PROJECTS_FILE)) {
        console.log('Projects.json file does not exist, creating empty file...');
        // Ensure directory exists
        const dir = path.dirname(PROJECTS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    const emptyArray = [];
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(emptyArray, null, 2));
    console.log('Projects.json has been emptied\n');
}

// Main execution
console.log('=== Cleaning ISLR Datastore ===\n');

try {
    deleteProjectFolders();
    emptyStudiesJson();
    emptyProjectsJson();
    console.log('=== Cleanup Complete ===');
} catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
}

