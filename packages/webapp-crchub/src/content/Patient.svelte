<script lang="ts">
    import { onMount } from "svelte";
    import PatientCard from "../components/cards/PatientCard.svelte";

    import { Tabs, TabItem, ListPlaceholder } from "flowbite-svelte";
    import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
    import { faListCheck, faCalendarDays } from "@fortawesome/free-solid-svg-icons";
    import { getPatient, type Patient } from "../services/dataStore";

    import { EditorState } from "@freon4dsl/webapp-lib";
    import { RtString } from "@freon4dsl/core";
    import { FreNodeReference } from "@freon4dsl/core";
    import { type StudyConfigurationModel } from "@freon4dsl/samples-study-configuration";
    import { Timeline } from "@freon4dsl/samples-study-configuration/dist/custom/timeline/Timeline";
    import { getTimelineChart } from "../services/app/PatientTimeline";
    import { getTimelineChartHtml } from "../services/app/PatientTimeline";
    import { getTimeline } from "../services/app/PatientTimeline";

    import {
        Availability,
        DateRange,
        Month,
        PatientVisit,
        PatientVisitStatus,
        StaffLevel,
        StartRangeDate,
        Event,
        VisitDate,
        PatientNotAvailable,
        PatientHistory,
    } from "@freon4dsl/samples-study-configuration/dist/language/gen";

    export let id: string;
    let patient: Patient;

    let isLoading = true;
    let showChart = false;
    let chartHtml: string = "";
    let error: string | null = null;
    let container: HTMLElement | null = null;

    onMount(async () => {
        const fetchedPatient = await getPatient(id);
        if (fetchedPatient) {
            patient = fetchedPatient;
        } else {
            console.error(`Patient with id ${id} not found`);
        }
        await loadChart(patient.studyId); /* TODO: change to patient.id */
    });

    async function loadChart(id: string) {
        isLoading = true;
        showChart = false;
        error = null;
        try {
            const startTime = Date.now();
            chartHtml = getChartWithPatientHistory(id);
            await new Promise((resolve) => setTimeout(() => resolve(null), 0)); // Allow DOM to update

            await loadChartData();
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 3000) {
                await new Promise((resolve) => setTimeout(resolve, 5000 - elapsedTime));
            }
            showChart = true;
        } catch (err: unknown) {
            console.error(`Error fetching chart data for study: ${id}`, err);
            error = err instanceof Error ? err.message : "An error occurred while fetching chart data";
        } finally {
            isLoading = false;
        }
    }

    function getMonthFromString(month: string): Month {
        switch (month.toLowerCase()) {
            case "january":
                return Month.January;
            case "february":
                return Month.February;
            case "march":
                return Month.March;
            case "april":
                return Month.April;
            case "may":
                return Month.May;
            case "june":
                return Month.June;
            case "july":
                return Month.July;
            case "august":
                return Month.August;
            case "september":
                return Month.September;
            case "october":
                return Month.October;
            case "november":
                return Month.November;
            case "december":
                return Month.December;
            default:
                throw new Error(`Invalid month: ${month}`);
        }
    }

    function createOneDayAvailability(day: string, month: string, year: string): Availability {
        const staffLevel = createStaffLevel("3", day, month, year);
        const availability = Availability.create({ baselineStaff: "4", staffLevels: [staffLevel] });
        return availability;
    }

    function createStaffLevel(
        staffAvailable: string,
        startDay: string,
        startMonth: string,
        startYear: string,
        endDay?: string,
        endMonth?: string,
        endYear?: string,
    ) {
        const startDateInRange = StartRangeDate.create({
            day: startDay,
            month: FreNodeReference.create<Month>(getMonthFromString(startMonth), "Month"),
            year: startYear,
        });
        let endMonthString = "";

        if (endMonth !== undefined) {
            endMonthString = endMonth;
        } else {
            endMonthString = startMonth;
        }
        if (!endDay) {
            endDay = startDay;
            endMonthString = startMonth;
            endYear = startYear;
        }
        const endDateInRange = StartRangeDate.create({
            day: endDay,
            month: FreNodeReference.create<Month>(getMonthFromString(endMonthString), "Month"),
            year: endYear,
        });
        const staffDateOrRange = DateRange.create({ startDate: startDateInRange, endDate: endDateInRange });
        const staffLevel = StaffLevel.create({ staffAvailable: staffAvailable, dateOrRange: staffDateOrRange });
        return staffLevel;
    }

    function createAvailability(): Availability {
        let month = "January";
        const year = "2024";
        let staffLevels = [];
        staffLevels.push(createStaffLevel("3", "-27", month, year, "-25", month, year));
        staffLevels.push(createStaffLevel("2", "11", month, year));
        staffLevels.push(createStaffLevel("2", "19", month, year));
        const availability = Availability.create({ baselineStaff: "4", staffLevels: staffLevels });
        return availability;
    }

    function addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    function createACompletedPatientVisit(visitName: string, day: string, month: string, year: string, visitInstanceNumber: number): PatientVisit {
        // console.log("createACompletedPatientVisit visitName: " + visitName + " day: " + day + " month: " + month + " year: " + year);
        const referencedEvent = FreNodeReference.create<Event>(visitName, "Event");
        const visitDate = VisitDate.create({ day: day, month: FreNodeReference.create<Month>(getMonthFromString(month), "Month"), year: year });
        const completedVisitStatus = FreNodeReference.create<PatientVisitStatus>(PatientVisitStatus.completed, "completed");
        let patientVisit = PatientVisit.create({
            visit: referencedEvent,
            actualVisitDate: visitDate,
            status: completedVisitStatus,
            visitInstanceNumber: visitInstanceNumber,
        });
        return patientVisit;
    }

    function createPatientNotAvailableDateRange(startDay: string, startMonth: string, startYear: string, endDay?: string, endMonth?: string, endYear?: string) {
        const startDateInRange = StartRangeDate.create({
            day: startDay,
            month: FreNodeReference.create<Month>(getMonthFromString(startMonth), "Month"),
            year: startYear,
        });
        if (!endDay) {
            endDay = startDay;
            endMonth = startMonth;
            endYear = startYear;
        }
        let endMonthString = "";

        if (endMonth !== undefined) {
            endMonthString = endMonth;
        } else {
            endMonthString = startMonth;
        }

        const endDateInRange = StartRangeDate.create({
            day: endDay,
            month: FreNodeReference.create<Month>(getMonthFromString(endMonthString), "Month"),
            year: endYear,
        });
        const dateOrRange = DateRange.create({ startDate: startDateInRange, endDate: endDateInRange });
        return dateOrRange;
    }

    function createCompletedPatientVisits(
        numberToCreate: number,
        timeline: Timeline,
        shiftsFromScheduledVisit: ShiftsFromScheduledVisit[] = [],
    ): PatientVisit[] {
        let completedPatientVisits: PatientVisit[] = [];
        let i = 0;
        let stopAddingVisits = false;
        const referenceDate = timeline.getReferenceDate();
        timeline.printTimelineOfScheduledEventInstances();
        timeline.getScheduleEventInstancesOrderByDay().forEach((scheduledEventInstance) => {
            if (i++ < numberToCreate) {
                let dateOfVisit: Date = new Date();
                const startDay = scheduledEventInstance.getStartDay();
                let foundAMatch = false;
                // There can be multiple shifts for the same ScheduledEventInstance (a visit), each with a different instance number to shift. Need to search to find the shift for the instance number, if any.
                let shiftsForVisitInstance = shiftsFromScheduledVisit.filter((record) => record.name === scheduledEventInstance.getName());
                if (shiftsForVisitInstance.length > 0) {
                    shiftsForVisitInstance.forEach((shiftFromScheduledVisit) => {
                        shiftFromScheduledVisit.numberFound++; // This is the hack where the number of times a visit is matched is tracked for each shift of the same visit rather than just one counter.
                        if (shiftFromScheduledVisit.numberFound === shiftFromScheduledVisit.instance && shiftFromScheduledVisit.foundThisInstance === false) {
                            // if this matches then this is the instance to shift
                            dateOfVisit = addDays(referenceDate, startDay + shiftFromScheduledVisit.shift); // Shift the visit
                            shiftFromScheduledVisit.foundThisInstance = true; // Remember that this shift has been done
                            foundAMatch = true; // Done looking for shifts for this visit
                        }
                    });
                }
                if (!foundAMatch) {
                    dateOfVisit = addDays(referenceDate, startDay); // No shifts for this Visit
                }
                const patientVisit = createACompletedPatientVisit(
                    scheduledEventInstance.getName(),
                    dateOfVisit.getDate().toString(),
                    timeline.getMonthName(dateOfVisit.getMonth()),
                    dateOfVisit.getFullYear().toString(),
                    scheduledEventInstance.getInstanceNumber(),
                );
                console.log(
                    "Adding completed visit: " +
                        scheduledEventInstance.getName() +
                        " instance: " +
                        scheduledEventInstance.getInstanceNumber() +
                        " on " +
                        dateOfVisit.toDateString(),
                );
                completedPatientVisits.push(patientVisit);
            }
        });
        return completedPatientVisits;
    }

    type ShiftsFromScheduledVisit = { name: string; instance: number; shift: number; numberFound: number; foundThisInstance: boolean };

    function getChartWithPatientHistory(id: string) {
        console.log("getChartWithPatientHistory");
        const studyConfigurationModel = EditorState.getInstance().modelStore.model as StudyConfigurationModel;
        const studyConfigurationUnit = studyConfigurationModel.configuration;
        // createAvailability();

        // Adding after simulation because the timeline is used to find the visits to complete.
        let timeline = getTimeline(studyConfigurationUnit);
        let shiftsFromScheduledVisit: ShiftsFromScheduledVisit[] = [
            { name: "V2 Randomization", instance: 1, shift: -1, numberFound: 0, foundThisInstance: false },
            { name: "V4-V7 Randomization", instance: 1, shift: -4, numberFound: 0, foundThisInstance: false },
            { name: "V4-V7 Randomization", instance: 2, shift: 2, numberFound: 0, foundThisInstance: false },
        ];
        let completedPatientVisits: PatientVisit[] = createCompletedPatientVisits(10, timeline, shiftsFromScheduledVisit);
        let dateRangeList: DateRange[] = [];
        let dateRange = createPatientNotAvailableDateRange("3", "November", "2024", "3", "November", "2024");
        dateRangeList.push(dateRange);
        dateRange = createPatientNotAvailableDateRange("1", "December", "2024", "7", "December", "2024");
        dateRangeList.push(dateRange);
        let patientNotAvailable = PatientNotAvailable.create({ dates: dateRangeList });
        let patientHistory = PatientHistory.create({ id: "MV", patientVisits: completedPatientVisits, patientNotAvailableDates: patientNotAvailable });
        timeline.setPatientHistory(patientHistory);
        timeline.addPatientEvents(patientHistory);

        const rtObject = getTimelineChartHtml(timeline) as RtString;
        return rtObject.asString();
    }

    function getMonthFromString(month: string): Month {
        switch (month.toLowerCase()) {
            case "january":
                return Month.January;
            case "february":
                return Month.February;
            case "march":
                return Month.March;
            case "april":
                return Month.April;
            case "may":
                return Month.May;
            case "june":
                return Month.June;
            case "july":
                return Month.July;
            case "august":
                return Month.August;
            case "september":
                return Month.September;
            case "october":
                return Month.October;
            case "november":
                return Month.November;
            case "december":
                return Month.December;
            default:
                throw new Error(`Invalid month: ${month}`);
        }
    }

    function createOneDayAvailability(day: string, month: string, year: string): Availability {
        const staffLevel = createStaffLevel("3", day, month, year);
        const availability = Availability.create({ baselineStaff: "4", staffLevels: [staffLevel] });
        return availability;
    }

    function createStaffLevel(
        staffAvailable: string,
        startDay: string,
        startMonth: string,
        startYear: string,
        endDay?: string,
        endMonth?: string,
        endYear?: string,
    ) {
        const startDateInRange = StartRangeDate.create({
            day: startDay,
            month: FreNodeReference.create<Month>(getMonthFromString(startMonth), "Month"),
            year: startYear,
        });
        let endMonthString = "";

        if (endMonth !== undefined) {
            endMonthString = endMonth;
        } else {
            endMonthString = startMonth;
        }
        if (!endDay) {
            endDay = startDay;
            endMonthString = startMonth;
            endYear = startYear;
        }
        const endDateInRange = StartRangeDate.create({
            day: endDay,
            month: FreNodeReference.create<Month>(getMonthFromString(endMonthString), "Month"),
            year: endYear,
        });
        const staffDateOrRange = DateRange.create({ startDate: startDateInRange, endDate: endDateInRange });
        const staffLevel = StaffLevel.create({ staffAvailable: staffAvailable, dateOrRange: staffDateOrRange });
        return staffLevel;
    }

    function createAvailability(): Availability {
        let month = "January";
        const year = "2024";
        let staffLevels = [];
        staffLevels.push(createStaffLevel("3", "-27", month, year, "-25", month, year));
        staffLevels.push(createStaffLevel("2", "11", month, year));
        staffLevels.push(createStaffLevel("2", "19", month, year));
        const availability = Availability.create({ baselineStaff: "4", staffLevels: staffLevels });
        return availability;
    }

    function addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    function createACompletedPatientVisit(visitName: string, day: string, month: string, year: string, visitInstanceNumber: number): PatientVisit {
        // console.log("createACompletedPatientVisit visitName: " + visitName + " day: " + day + " month: " + month + " year: " + year);
        const referencedEvent = FreNodeReference.create<Event>(visitName, "Event");
        const visitDate = VisitDate.create({ day: day, month: FreNodeReference.create<Month>(getMonthFromString(month), "Month"), year: year });
        const completedVisitStatus = FreNodeReference.create<PatientVisitStatus>(PatientVisitStatus.completed, "completed");
        let patientVisit = PatientVisit.create({
            visit: referencedEvent,
            actualVisitDate: visitDate,
            status: completedVisitStatus,
            visitInstanceNumber: visitInstanceNumber,
        });
        return patientVisit;
    }

    function createPatientNotAvailableDateRange(startDay: string, startMonth: string, startYear: string, endDay?: string, endMonth?: string, endYear?: string) {
        const startDateInRange = StartRangeDate.create({
            day: startDay,
            month: FreNodeReference.create<Month>(getMonthFromString(startMonth), "Month"),
            year: startYear,
        });
        if (!endDay) {
            endDay = startDay;
            endMonth = startMonth;
            endYear = startYear;
        }
        let endMonthString = "";

        if (endMonth !== undefined) {
            endMonthString = endMonth;
        } else {
            endMonthString = startMonth;
        }

        const endDateInRange = StartRangeDate.create({
            day: endDay,
            month: FreNodeReference.create<Month>(getMonthFromString(endMonthString), "Month"),
            year: endYear,
        });
        const dateOrRange = DateRange.create({ startDate: startDateInRange, endDate: endDateInRange });
        return dateOrRange;
    }

    function createCompletedPatientVisits(
        numberToCreate: number,
        timeline: Timeline,
        shiftsFromScheduledVisit: ShiftsFromScheduledVisit[] = [],
    ): PatientVisit[] {
        let completedPatientVisits: PatientVisit[] = [];
        let i = 0;
        let stopAddingVisits = false;
        const referenceDate = timeline.getReferenceDate();
        timeline.printTimelineOfScheduledEventInstances();
        timeline.getScheduleEventInstancesOrderByDay().forEach((scheduledEventInstance) => {
            if (i++ < numberToCreate) {
                let dateOfVisit: Date = new Date();
                const startDay = scheduledEventInstance.getStartDay();
                let foundAMatch = false;
                // There can be multiple shifts for the same ScheduledEventInstance (a visit), each with a different instance number to shift. Need to search to find the shift for the instance number, if any.
                let shiftsForVisitInstance = shiftsFromScheduledVisit.filter((record) => record.name === scheduledEventInstance.getName());
                if (shiftsForVisitInstance.length > 0) {
                    shiftsForVisitInstance.forEach((shiftFromScheduledVisit) => {
                        shiftFromScheduledVisit.numberFound++; // This is the hack where the number of times a visit is matched is tracked for each shift of the same visit rather than just one counter.
                        if (shiftFromScheduledVisit.numberFound === shiftFromScheduledVisit.instance && shiftFromScheduledVisit.foundThisInstance === false) {
                            // if this matches then this is the instance to shift
                            dateOfVisit = addDays(referenceDate, startDay + shiftFromScheduledVisit.shift); // Shift the visit
                            shiftFromScheduledVisit.foundThisInstance = true; // Remember that this shift has been done
                            foundAMatch = true; // Done looking for shifts for this visit
                        }
                    });
                }
                if (!foundAMatch) {
                    dateOfVisit = addDays(referenceDate, startDay); // No shifts for this Visit
                }
                const patientVisit = createACompletedPatientVisit(
                    scheduledEventInstance.getName(),
                    dateOfVisit.getDate().toString(),
                    timeline.getMonthName(dateOfVisit.getMonth()),
                    dateOfVisit.getFullYear().toString(),
                    scheduledEventInstance.getInstanceNumber(),
                );
                console.log(
                    "Adding completed visit: " +
                        scheduledEventInstance.getName() +
                        " instance: " +
                        scheduledEventInstance.getInstanceNumber() +
                        " on " +
                        dateOfVisit.toDateString(),
                );
                completedPatientVisits.push(patientVisit);
            }
        });
        return completedPatientVisits;
    }

    type ShiftsFromScheduledVisit = { name: string; instance: number; shift: number; numberFound: number; foundThisInstance: boolean };

    function getChartWithPatientHistory(id: string) {
        console.log("getChartWithPatientHistory");
        const studyConfigurationModel = EditorState.getInstance().modelStore.model as StudyConfigurationModel;
        const studyConfigurationUnit = studyConfigurationModel.configuration;
        // createAvailability();

        // Adding after simulation because the timeline is used to find the visits to complete.
        let timeline = getTimeline(studyConfigurationUnit);
        let shiftsFromScheduledVisit: ShiftsFromScheduledVisit[] = [
            { name: "V2 Randomization", instance: 1, shift: -1, numberFound: 0, foundThisInstance: false },
            { name: "V4-V7 Randomization", instance: 1, shift: -4, numberFound: 0, foundThisInstance: false },
            { name: "V4-V7 Randomization", instance: 2, shift: 2, numberFound: 0, foundThisInstance: false },
        ];
        let completedPatientVisits: PatientVisit[] = createCompletedPatientVisits(10, timeline, shiftsFromScheduledVisit);
        let dateRangeList: DateRange[] = [];
        let dateRange = createPatientNotAvailableDateRange("3", "November", "2024", "3", "November", "2024");
        dateRangeList.push(dateRange);
        dateRange = createPatientNotAvailableDateRange("1", "December", "2024", "7", "December", "2024");
        dateRangeList.push(dateRange);
        let patientNotAvailable = PatientNotAvailable.create({ dates: dateRangeList });
        let patientHistory = PatientHistory.create({ id: "MV", patientVisits: completedPatientVisits, patientNotAvailableDates: patientNotAvailable });
        timeline.setPatientHistory(patientHistory);
        timeline.addPatientEvents(patientHistory);

        const rtObject = getTimelineChartHtml(timeline) as RtString;
        return rtObject.asString();
    }

    async function getChart(id: string) {
        const modelManager = EditorState.getInstance();
        const unit = (await modelManager.openUnitForModel(id, "StudyConfiguration")) as StudyConfiguration;
        const rtObject = getTimelineChart(unit) as RtString;
        return rtObject.asString();
    }

    async function loadChartData() {
        return new Promise<void>((resolve) => {
            if (container) {
                container.innerHTML = chartHtml;
                executeScripts();
            }
            resolve();
        });
    }

    function executeScripts() {
        if (container) {
            const scripts = container.querySelectorAll("script");
            scripts.forEach((oldScript) => {
                const newScript = document.createElement("script");
                Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
                newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                if (oldScript.parentNode) {
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                }
            });
        }
    }
</script>

{#if patient}
    <div class="crc-container">
        <div class="crc-card">
            <PatientCard {patient} />
        </div>

        <div class="crc-content">
            <Tabs tabStyle="underline" class="crc-tab">
                <TabItem open title="Schedule">
                    <div slot="title" class="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarDays} class="w-4 h-4" />Schedule
                    </div>
                    <div style="display: {isLoading || !showChart ? 'block' : 'none'}">
                        <ListPlaceholder class="mb-4" />
                    </div>
                    <div style="display: {!isLoading && showChart ? 'block' : 'none'}">
                        <div bind:this={container}>
                            {@html chartHtml}
                        </div>
                    </div>
                </TabItem>
                <TabItem title="Tasks">
                    <div slot="title" class="flex items-center gap-2">
                        <FontAwesomeIcon icon={faListCheck} class="w-4 h-4" />Tasks
                    </div>
                    <div class="crc-grid"></div>
                </TabItem>
            </Tabs>
        </div>
    </div>
{:else}
    <p>Loading patient...</p>
{/if}
