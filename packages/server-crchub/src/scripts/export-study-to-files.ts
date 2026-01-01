#!/usr/bin/env node
/**
 * Standalone utility to export StudyConfiguration and PatientInfo to DSL text files.
 * 
 * Usage:
 *   npm run export-study -- <study-name>
 *   
 *   (This will build the project first, then run the compiled script)
 * 
 * This script:
 * 1. Looks up the study by name in the database
 * 2. Retrieves StudyConfiguration and PatientInfo JSON from the database
 * 3. Converts JSON to model units using FreLionwebSerializer
 * 4. Uses StudyConfigurationModelModelUnitWriter to convert to DSL text
 * 5. Writes both StudyConfiguration and PatientInfo to files in the tmp/ directory:
 *    - {studyName}.dsl.txt: Combined DSL text format (may have incomplete PatientInfo)
 *    - StudyConfiguration-{studyName}.json: JSON format with all references preserved
 *    - PatientInfo-{studyName}.json: JSON format with all references preserved
 * 
 * Note: The JSON files preserve all cross-unit references (e.g., PatientVisit -> Event references),
 * while the DSL text format may have incomplete PatientInfo due to unresolved references.
 */

import { FreLionwebSerializer, FreLogger } from '@freon4dsl/core';
import { LanguageEnvironment, StudyConfigurationModel, StudyConfigurationModelModelUnitWriter } from '@freon4dsl/study-configuration';
import * as fs from 'fs';
import { runInAction } from 'mobx';
import * as path from 'path';
import '../config/load-environment.js';
import { getDbPool } from '../service/db-connection.js';
import { getPatientInfo, getStudyConfiguration } from '../service/model-service.js';

// Mute all logs for cleaner output
FreLogger.muteAllLogs();

// Initialize the language environment - this is required for the serializer to work
// This loads the meta-model so the serializer can understand the JSON structure
LanguageEnvironment.getInstance();

async function findStudyByName(studyName: string): Promise<string | null> {
    const pool = getDbPool();
    
    const result = await pool.query(
        `SELECT study_id as id, name
         FROM study
         WHERE name = $1
         LIMIT 1`,
        [studyName]
    );
    
    if (result.rows.length === 0) {
        return null;
    }
    
    return result.rows[0].id;
}

async function convertJsonToModelUnit(jsonData: any, unitType: string): Promise<any> {
    const serializer = new FreLionwebSerializer();
    const modelUnit = serializer.toTypeScriptInstance(jsonData);
    return modelUnit;
}

function convertModelUnitToJson(unit: any): any {
    const serializer = new FreLionwebSerializer();
    const nodes = serializer.convertToJSON(unit);
    return {
        serializationFormatVersion: "2023.1",
        languages: [
            {
                key: "-key-StudyConfigurationModel",
                version: "2023.1"
            }
        ],
        nodes: nodes
    };
}

async function exportStudyToFiles(studyName: string) {
    try {
        console.log(`\n🔍 Looking up study: "${studyName}"...`);
        
        // Find study by name
        const studyId = await findStudyByName(studyName);
        if (!studyId) {
            console.error(`❌ Study not found: "${studyName}"`);
            console.log('\nAvailable studies:');
            const pool = getDbPool();
            const allStudies = await pool.query('SELECT name FROM study ORDER BY name');
            allStudies.rows.forEach(row => {
                console.log(`  - ${row.name}`);
            });
            process.exit(1);
        }
        
        console.log(`✅ Found study: "${studyName}" (ID: ${studyId})`);
        
        // Get StudyConfiguration JSON from database
        console.log('\n📥 Retrieving StudyConfiguration from database...');
        const studyConfigJson = await getStudyConfiguration(studyId);
        if (!studyConfigJson) {
            console.error(`❌ StudyConfiguration not found for study: "${studyName}"`);
            process.exit(1);
        }
        console.log('✅ StudyConfiguration retrieved');
        
        // Get list of actual patients for this study (to filter out deleted patients)
        // The UI filters PatientInfo by matching patient_id to existing patient records
        console.log('\n📋 Getting list of patients for study...');
        const pool = getDbPool();
        const patientsResult = await pool.query(
            `SELECT DISTINCT
                p.patient_id as id,
                p.patient_number as "patientNumber"
             FROM patient p
             JOIN site s ON p.site_id = s.site_id
             JOIN study st ON s.study_id = st.study_id
             WHERE st.study_id = $1`,
            [studyId]
        );
        const existingPatientNumbers = new Set<string>();
        const existingPatientIds = new Set<string>();
        patientsResult.rows.forEach(row => {
            if (row.patientNumber) existingPatientNumbers.add(row.patientNumber);
            if (row.id) existingPatientIds.add(row.id);
        });
        console.log(`✅ Found ${existingPatientNumbers.size} existing patients in database`);
        
        // Get PatientInfo JSON from database
        console.log('\n📥 Retrieving PatientInfo from database...');
        const patientInfoJson = await getPatientInfo(studyId);
        if (!patientInfoJson) {
            console.warn(`⚠️  PatientInfo not found for study: "${studyName}"`);
        } else {
            console.log('✅ PatientInfo retrieved');
        }
        
        // Create a model first (required for reference resolution)
        const env = LanguageEnvironment.getInstance();
        const model = env.newModel(`ExportModel-${studyName}`) as StudyConfigurationModel;
        
        // Convert StudyConfiguration JSON to model unit and add to model FIRST
        // This is critical: StudyConfiguration must be in the model before PatientInfo
        // so that PatientInfo references to Events can be resolved
        console.log('\n🔄 Converting JSON to model units...');
        const studyConfigUnit = await convertJsonToModelUnit(studyConfigJson, 'StudyConfiguration');
        console.log('✅ StudyConfiguration converted');
        model.addUnit(studyConfigUnit);
        console.log('✅ StudyConfiguration added to model');
        
        // Now convert PatientInfo JSON to model unit (StudyConfiguration is already in model)
        // This allows the serializer to resolve cross-unit references during conversion
        let patientInfoUnit = null;
        if (patientInfoJson) {
            patientInfoUnit = await convertJsonToModelUnit(patientInfoJson, 'PatientInfo');
            console.log('✅ PatientInfo converted (with references resolved)');
            
            // Filter PatientInfo to only include PatientHistories for existing patients
            // This matches what the UI shows (it filters by matching patient_id to patient records)
            if (patientInfoUnit && existingPatientNumbers.size > 0) {
                console.log('\n🔍 Filtering PatientInfo to only include existing patients...');
                const patientHistories = (patientInfoUnit as any).patientHistories;
                const originalCount = patientHistories?.length || 0;
                
                if (patientHistories && originalCount > 0) {
                    // Use MobX runInAction to properly modify observable arrays
                    runInAction(() => {
                        // Remove PatientHistories for deleted patients (iterate backwards to safely remove items)
                        for (let i = patientHistories.length - 1; i >= 0; i--) {
                            const history = patientHistories[i];
                            const patientId = history.patient_id;
                            const exists = patientId && (
                                existingPatientNumbers.has(patientId) || 
                                existingPatientIds.has(patientId)
                            );
                            if (!exists) {
                                console.log(`   Removing PatientHistory for deleted patient: ${patientId || 'unknown'}`);
                                patientHistories.splice(i, 1);
                            }
                        }
                    });
                    
                    const filteredCount = patientHistories.length;
                    const removedCount = originalCount - filteredCount;
                    if (removedCount > 0) {
                        console.log(`✅ Filtered PatientInfo: removed ${removedCount} PatientHistory entries for deleted patients`);
                    } else {
                        console.log(`✅ PatientInfo already contains only existing patients`);
                    }
                }
            }
            
            model.addUnit(patientInfoUnit);
            console.log('✅ PatientInfo added to model');
        }
        
        // Force resolution of all references by accessing them
        // This ensures the scoper resolves cross-unit references before writing
        if (patientInfoUnit) {
            console.log('\n🔗 Resolving cross-unit references...');
            // Access all PatientVisit references to force resolution
            const histories = (patientInfoUnit as any).patientHistories || [];
            for (const history of histories) {
                const visits = history.patientVisits || [];
                for (const visit of visits) {
                    // Access the reference to trigger scoper resolution
                    try {
                        const eventRef = visit.visit;
                        if (eventRef && typeof eventRef === 'object' && 'referred' in eventRef) {
                            const referred = (eventRef as any).referred;
                            if (referred) {
                                console.log(`   Resolved: PatientVisit -> ${referred.name || 'Event'}`);
                            }
                        }
                    } catch (e) {
                        // Reference might not be resolvable, that's okay
                    }
                }
            }
            console.log('✅ References resolved');
        }
        
        // Create writer for DSL text output
        // The writer should use the parser projection from PatientParser.edit
        // which defines a simpler PatientVisit projection without fragments
        const writer = new StudyConfigurationModelModelUnitWriter();
        
        // Convert to DSL text (both units are now in the model, references should be resolved)
        console.log('\n📝 Converting to DSL text format...');
        const studyConfigText = writer.writeToString(studyConfigUnit);
        console.log(`✅ StudyConfiguration DSL text generated (${studyConfigText.length} characters)`);
        
        let patientInfoText = '';
        if (patientInfoUnit) {
            // Write PatientInfo now that both units are in the model context and references are resolved
            // The writer should use the parser projection from PatientParser.edit
            patientInfoText = writer.writeToString(patientInfoUnit);
            console.log(`✅ PatientInfo DSL text generated (${patientInfoText.length} characters)`);
            if (patientInfoText.length < 200) {
                console.log(`   ⚠️  Warning: PatientInfo text appears incomplete.`);
            }
        }
        
        // Also serialize back to JSON format (preserves all references)
        // This matches how the webapp saves data using FreLionwebSerializer.convertToJSON()
        console.log('\n📦 Serializing to JSON format (with references preserved)...');
        const studyConfigJsonSerialized = convertModelUnitToJson(studyConfigUnit);
        console.log(`✅ StudyConfiguration JSON serialized`);
        
        let patientInfoJsonSerialized = null;
        if (patientInfoUnit) {
            patientInfoJsonSerialized = convertModelUnitToJson(patientInfoUnit);
            console.log(`✅ PatientInfo JSON serialized (with references preserved)`);
        }
        
        // Create output directory
        const outputDir = path.resolve(process.cwd(), 'tmp');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Write DSL text file (combined)
        console.log('\n💾 Writing files...');
        const dslPath = path.resolve(outputDir, `${studyName}.dsl.txt`);
        let combinedText = `// StudyConfiguration for: ${studyName}\n`;
        combinedText += `// ============================================\n\n`;
        combinedText += studyConfigText;
        if (patientInfoText) {
            combinedText += `\n\n// PatientInfo for: ${studyName}\n`;
            combinedText += `// ============================================\n\n`;
            combinedText += patientInfoText;
        }
        fs.writeFileSync(dslPath, combinedText, 'utf-8');
        console.log(`✅ Written DSL text: ${dslPath}`);
        
        // Write JSON files (with references preserved)
        const studyConfigJsonPath = path.resolve(outputDir, `StudyConfiguration-${studyName}.json`);
        fs.writeFileSync(studyConfigJsonPath, JSON.stringify(studyConfigJsonSerialized, null, 2), 'utf-8');
        console.log(`✅ Written JSON: ${studyConfigJsonPath}`);
        
        if (patientInfoJsonSerialized) {
            const patientInfoJsonPath = path.resolve(outputDir, `PatientInfo-${studyName}.json`);
            fs.writeFileSync(patientInfoJsonPath, JSON.stringify(patientInfoJsonSerialized, null, 2), 'utf-8');
            console.log(`✅ Written JSON: ${patientInfoJsonPath} (with references preserved)`);
        }
        
        console.log('\n✨ Export complete!');
        console.log(`\nFiles saved to: ${outputDir}/`);
        
    } catch (error) {
        console.error('\n❌ Error exporting study:', error);
        if (error instanceof Error) {
            console.error('Stack trace:', error.stack);
        }
        process.exit(1);
    } finally {
        // Close database connection
        const pool = getDbPool();
        await pool.end();
    }
}

// Main execution
const studyName = process.argv[2];

if (!studyName) {
    console.error('❌ Error: Study name is required');
    console.log('\nUsage:');
    console.log('  npm run export-study -- <study-name>');
    console.log('  or');
    console.log('  ts-node src/scripts/export-study-to-files.ts <study-name>');
    console.log('\nExample:');
    console.log('  npm run export-study -- "ScheduleExample1"');
    process.exit(1);
}

exportStudyToFiles(studyName).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
