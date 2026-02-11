// Re-export everything from the generated index
export * from "./freon/index.js";

// Explicit re-exports for consumers (e.g. server export-study script)
export { StudyConfigurationModelEnvironment as LanguageEnvironment } from "./freon/config/StudyConfigurationModelEnvironment.js";
export { StudyConfigurationModel } from "./freon/language/index.js";

// Re-export specific items from custom to avoid naming conflicts
export { extendToSupportSmartDuplication } from "./custom/extensions/ExtensionLib.js";
export { Sim } from "./custom/simjs/sim.js";
export { StudyChecklistDocumentTemplate } from "./custom/templates/StudyChecklistDocumentTemplate.js";
export { TimelineChartTemplate } from "./custom/templates/TimelineChartTemplate.js";
export { TimelineTableTemplate } from "./custom/templates/TimelineTableTemplate.js";
export { Simulator } from "./custom/timeline/Simulator.js";
export { Timeline } from "./custom/timeline/Timeline.js";
export { copyPatientHistoryWithFilledDates, determineReferenceDate, findAndCopyPatientHistory, findAppropriateVisitDate, findFirstPatientHistoryWithVisits, findPatientHistoryByPatientNumber, getChecklistAsMarkdown, getEventChecklistAsMarkdownByName, getTimelineAsOfADate, getTimelineChart, getTimelineChartHtml, getTimelineTable, getVisitChecklistAsMarkdown, getVisitChecklistAsMarkdownForPdf, studyTimelineChart } from "./custom/timeline/TimelineUtils.js";
export { StudyConfigurationModelModelUnitWriter } from "./freon/writer/StudyConfigurationModelModelUnitWriter.js";

