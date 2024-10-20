const fs = require('fs-extra');
const path = require('path');

const sourceDir = path.join(__dirname, 'packages/server/modelstore/');
const targetDir = path.join(__dirname, 'packages/samples/StudyConfiguration/src/custom/__tests__/modelstore/');

const foldersToCopy = ['StartMinusDays', 'TwoP3V', 'ScheduleExample1', 'ScheduleExample1Orig', 'ScheduleExample2', 'ScheduleExample2Orig', 'ScheduleExample3', 'ScheduleExample3Orig', 'OneVisitOneChecklist'];

async function copyFolders() {
  try {
    for (const folder of foldersToCopy) {
      const sourcePath = path.join(sourceDir, folder);
      const targetPath = path.join(targetDir, folder);
      await fs.copy(sourcePath, targetPath, { overwrite: true });
      console.log(`Copied ${folder} to ${targetPath}`);
    }
    console.log('All folders copied successfully.');
  } catch (err) {
    console.error('Error copying folders:', err);
  }
}

copyFolders();