/**
 * PatientTimelineSection Tests
 * 
 * Following the same testing patterns as:
 * packages/languages/study-configuration/src/custom/__tests__/Simulator.test.ts
 * 
 * Test structure:
 * - Given-When-Then pattern for test cases
 * - Utility functions for building test data
 * - Fixture files for complex scenarios
 * - Separation of data logic from component rendering
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as utils from './Utils.js';
import { computeDayRenderingInfo, computeAllDayRenderingInfo, isPatientUnavailableOnDay } from './dayRenderingLogic.js';
import type { PatientDayData, DayRenderingInfo } from './Utils.js';

describe('PatientTimelineSection Data Logic', () => {
    
    describe('computeDayRenderingInfo - Null/Empty Data', () => {
        
        it('returns empty rendering info when dayData is null', () => {
            // GIVEN no patient day data
            const dayData = null;
            
            // WHEN computing rendering info
            const renderingInfo = computeDayRenderingInfo(dayData);
            
            // THEN it returns default empty values
            expect(renderingInfo).toEqual({
                isWindow: false,
                event: null,
                state: '',
                isActual: false,
                eventType: '',
                isUnscheduledEvent: false
            });
        });
        
        it('returns empty rendering info when dayData has no events', () => {
            // GIVEN patient day data with no events
            const dayData = utils.createEmptyDayData(0, '2026-01-14');
            
            // WHEN computing rendering info
            const renderingInfo = computeDayRenderingInfo(dayData);
            
            // THEN it returns default empty values
            expect(renderingInfo).toEqual({
                isWindow: false,
                event: null,
                state: '',
                isActual: false,
                eventType: '',
                isUnscheduledEvent: false
            });
        });
    });
    
    describe('computeDayRenderingInfo - Scheduled Events', () => {
        
        it('returns scheduled event info for a day with scheduled visit on scheduled date', () => {
            // GIVEN patient day data with a scheduled event
            const dayData = utils.createScheduledEventDayData(0, '2026-01-14', 'Visit 1', 'on-scheduled-date');
            
            // WHEN computing rendering info
            const renderingInfo = computeDayRenderingInfo(dayData);
            
            // THEN it shows as scheduled event
            expect(renderingInfo.isWindow).toBe(false);
            expect(renderingInfo.isActual).toBe(false);
            expect(renderingInfo.eventType).toBe('scheduled-event');
            expect(renderingInfo.state).toBe('on-scheduled-date');
            expect(renderingInfo.isUnscheduledEvent).toBe(false);
            expect(renderingInfo.event).not.toBeNull();
            expect(renderingInfo.event?.name).toBe('Visit 1');
        });
        
        it('returns scheduled event info for a day with scheduled visit in window', () => {
            // GIVEN patient day data with a scheduled event in window
            const dayData = utils.createScheduledEventDayData(7, '2026-01-21', 'Visit 2', 'in-window');
            
            // WHEN computing rendering info
            const renderingInfo = computeDayRenderingInfo(dayData);
            
            // THEN it shows as scheduled event with in-window state
            expect(renderingInfo.isActual).toBe(false);
            expect(renderingInfo.eventType).toBe('scheduled-event');
            expect(renderingInfo.state).toBe('in-window');
        });
        
        it('returns scheduled event info for a day with scheduled visit out of window', () => {
            // GIVEN patient day data with a scheduled event out of window
            const dayData = utils.createScheduledEventDayData(14, '2026-01-28', 'Visit 3', 'out-of-window');
            
            // WHEN computing rendering info
            const renderingInfo = computeDayRenderingInfo(dayData);
            
            // THEN it shows as scheduled event with out-of-window state
            expect(renderingInfo.isActual).toBe(false);
            expect(renderingInfo.eventType).toBe('scheduled-event');
            expect(renderingInfo.state).toBe('out-of-window');
        });
    });
    
    describe('computeDayRenderingInfo - Actual (Completed) Events', () => {
        
        it('returns actual event info for completed visit on scheduled date', () => {
            // GIVEN patient day data with an actual event completed on scheduled date
            const dayData = utils.createActualEventDayData(0, '2026-01-14', 'Prescreen', 0);
            
            // WHEN computing rendering info
            const renderingInfo = computeDayRenderingInfo(dayData);
            
            // THEN it shows as actual event on scheduled date
            expect(renderingInfo.isWindow).toBe(false);
            expect(renderingInfo.isActual).toBe(true);
            expect(renderingInfo.eventType).toBe('actual-event');
            expect(renderingInfo.state).toBe('on-scheduled-date');
            expect(renderingInfo.isUnscheduledEvent).toBe(false);
            expect(renderingInfo.event).not.toBeNull();
            expect(renderingInfo.event?.name).toBe('Prescreen');
        });
        
        it('returns actual event info for completed visit within window', () => {
            // GIVEN patient completed visit 1 day after scheduled (within 2-day window)
            const dayData = utils.createActualEventDayData(8, '2026-01-22', 'Screen', 7);
            
            // WHEN computing rendering info
            const renderingInfo = computeDayRenderingInfo(dayData);
            
            // THEN it shows as actual event with in-window state
            expect(renderingInfo.isActual).toBe(true);
            expect(renderingInfo.eventType).toBe('actual-event');
            expect(renderingInfo.state).toBe('in-window');
        });
        
        it('returns actual event info for completed visit outside window', () => {
            // GIVEN patient completed visit 5 days after scheduled (outside 2-day window)
            const dayData = utils.createActualEventDayData(13, '2026-01-27', 'Post Screen', 8, 'out-of-window');
            
            // WHEN computing rendering info
            const renderingInfo = computeDayRenderingInfo(dayData);
            
            // THEN it shows as actual event with out-of-window state
            expect(renderingInfo.isActual).toBe(true);
            expect(renderingInfo.eventType).toBe('actual-event');
            expect(renderingInfo.state).toBe('out-of-window');
        });
    });
    
    describe('computeDayRenderingInfo - Window Days', () => {
        
        it('returns window indicator for days in event window (windows array)', () => {
            // GIVEN a day that has a windows array
            const dayData = utils.createWindowDayData(6, '2026-01-20', 'visit-2', 'Visit 2');
            
            // WHEN computing rendering info
            const renderingInfo = computeDayRenderingInfo(dayData);
            
            // THEN isWindow is true and no event info
            expect(renderingInfo.isWindow).toBe(true);
            expect(renderingInfo.event).toBeNull();
            expect(renderingInfo.state).toBe('');
            expect(renderingInfo.isActual).toBe(false);
            expect(renderingInfo.eventType).toBe('');
        });
        
        it('returns window indicator for days with legacy isWindow flag', () => {
            // GIVEN a day with legacy isWindow flag
            const dayData = utils.createLegacyWindowDayData(5, '2026-01-19');
            
            // WHEN computing rendering info
            const renderingInfo = computeDayRenderingInfo(dayData);
            
            // THEN isWindow is true
            expect(renderingInfo.isWindow).toBe(true);
            expect(renderingInfo.event).toBeNull();
        });
    });
    
    describe('computeDayRenderingInfo - Cancelled Events', () => {
        
        it('returns canceled-visit state for cancelled events', () => {
            // GIVEN patient day data with a cancelled event
            const dayData = utils.createCancelledEventDayData(14, '2026-01-28', 'Visit 3');
            
            // WHEN computing rendering info
            const renderingInfo = computeDayRenderingInfo(dayData);
            
            // THEN state is 'canceled-visit'
            expect(renderingInfo.state).toBe('canceled-visit');
            expect(renderingInfo.isActual).toBe(true);
            expect(renderingInfo.eventType).toBe('actual-event');
            expect(renderingInfo.event?.status).toBe('cancelled');
        });
    });
    
    describe('computeDayRenderingInfo - Missed Events', () => {
        
        it('returns missed-visit state for missed events', () => {
            // GIVEN patient day data with a missed event
            const dayData = utils.createMissedEventDayData(21, '2026-02-04', 'Visit 4');
            
            // WHEN computing rendering info
            const renderingInfo = computeDayRenderingInfo(dayData);
            
            // THEN state is 'missed-visit'
            expect(renderingInfo.state).toBe('missed-visit');
            expect(renderingInfo.isActual).toBe(true);
            expect(renderingInfo.eventType).toBe('actual-event');
            expect(renderingInfo.event?.status).toBe('missed');
        });
    });
    
    describe('computeDayRenderingInfo - Unscheduled Events', () => {
        
        it('returns unscheduled event info via type', () => {
            // GIVEN patient day data with an unscheduled event (type)
            const dayData = utils.createUnscheduledEventDayData(10, '2026-01-24', 'Unscheduled Check');
            
            // WHEN computing rendering info
            const renderingInfo = computeDayRenderingInfo(dayData);
            
            // THEN isUnscheduledEvent is true
            expect(renderingInfo.isUnscheduledEvent).toBe(true);
            expect(renderingInfo.eventType).toBe('unscheduled-event');
            expect(renderingInfo.event?.name).toBe('Unscheduled Check');
        });
        
        it('returns unscheduled event info via isUnscheduledEvent flag', () => {
            // GIVEN patient day data with isUnscheduledEvent flag
            const dayData: PatientDayData = {
                day: 10,
                date: '2026-01-24',
                events: [{
                    id: 'unscheduled-1',
                    name: 'Ad-hoc Visit',
                    type: 'actual-event',
                    state: 'on-scheduled-date',
                    status: 'completed',
                    isUnscheduledEvent: true,
                    actualDay: 10
                }]
            };
            
            // WHEN computing rendering info
            const renderingInfo = computeDayRenderingInfo(dayData);
            
            // THEN isUnscheduledEvent is true even though type is 'actual-event'
            expect(renderingInfo.isUnscheduledEvent).toBe(true);
        });
    });
    
    describe('computeDayRenderingInfo - Default State Handling', () => {
        
        it('defaults to on-scheduled-date when event has no state', () => {
            // GIVEN patient day data with event missing state
            const dayData: PatientDayData = {
                day: 0,
                date: '2026-01-14',
                events: [{
                    id: 'visit-1',
                    name: 'Visit 1',
                    type: 'scheduled-event',
                    state: undefined as any,  // Missing state
                    scheduledDay: 0
                }]
            };
            
            // WHEN computing rendering info
            const renderingInfo = computeDayRenderingInfo(dayData);
            
            // THEN state defaults to 'on-scheduled-date'
            expect(renderingInfo.state).toBe('on-scheduled-date');
        });
        
        it('defaults eventType to scheduled-event when event has no type', () => {
            // GIVEN patient day data with event missing type
            const dayData: PatientDayData = {
                day: 0,
                date: '2026-01-14',
                events: [{
                    id: 'visit-1',
                    name: 'Visit 1',
                    type: undefined as any,  // Missing type
                    state: 'on-scheduled-date',
                    scheduledDay: 0
                }]
            };
            
            // WHEN computing rendering info
            const renderingInfo = computeDayRenderingInfo(dayData);
            
            // THEN eventType defaults to 'scheduled-event'
            expect(renderingInfo.eventType).toBe('scheduled-event');
        });
    });
    
    describe('computeAllDayRenderingInfo - Batch Processing', () => {
        
        it('computes rendering info for all patient days', () => {
            // GIVEN patient data with multiple days
            const patientDays: PatientDayData[] = [
                utils.createActualEventDayData(0, '2026-01-14', 'Prescreen', 0),
                utils.createWindowDayData(6, '2026-01-20', 'visit-2', 'Screen'),
                utils.createActualEventDayData(7, '2026-01-21', 'Screen', 7),
                utils.createScheduledEventDayData(14, '2026-01-28', 'Post Screen', 'on-scheduled-date')
            ];
            
            // WHEN computing all day rendering info
            const allRenderingInfo = computeAllDayRenderingInfo(patientDays);
            
            // THEN each day has computed rendering info
            expect(allRenderingInfo.size).toBe(4);
            
            // Day 0 - actual event
            const day0Info = allRenderingInfo.get(0);
            expect(day0Info?.isActual).toBe(true);
            expect(day0Info?.event?.name).toBe('Prescreen');
            
            // Day 6 - window
            const day6Info = allRenderingInfo.get(6);
            expect(day6Info?.isWindow).toBe(true);
            
            // Day 7 - actual event
            const day7Info = allRenderingInfo.get(7);
            expect(day7Info?.isActual).toBe(true);
            expect(day7Info?.event?.name).toBe('Screen');
            
            // Day 14 - scheduled event
            const day14Info = allRenderingInfo.get(14);
            expect(day14Info?.isActual).toBe(false);
            expect(day14Info?.eventType).toBe('scheduled-event');
        });
    });
    
    describe('isPatientUnavailableOnDay', () => {
        
        it('returns false when dayData is null', () => {
            expect(isPatientUnavailableOnDay(null)).toBe(false);
        });
        
        it('returns false when available is not set', () => {
            const dayData = utils.createEmptyDayData(0, '2026-01-14');
            expect(isPatientUnavailableOnDay(dayData)).toBe(false);
        });
        
        it('returns false when available is true', () => {
            const dayData: PatientDayData = {
                ...utils.createEmptyDayData(0, '2026-01-14'),
                available: true
            };
            expect(isPatientUnavailableOnDay(dayData)).toBe(false);
        });
        
        it('returns true when available is false', () => {
            const dayData: PatientDayData = {
                ...utils.createEmptyDayData(0, '2026-01-14'),
                available: false
            };
            expect(isPatientUnavailableOnDay(dayData)).toBe(true);
        });
    });
});

describe('PatientTimelineSection Integration Scenarios', () => {
    
    describe('Patient with typical study visit progression', () => {
        
        it('correctly renders a patient journey from prescreen to termination', () => {
            // GIVEN a patient with completed visits and one upcoming
            const patientDays: PatientDayData[] = [
                // Day 0: Prescreen completed on scheduled date
                utils.createActualEventDayData(0, '2026-01-14', 'Prescreen', 0),
                // Day 5-6: Window days before Screen
                utils.createWindowDayData(5, '2026-01-19', 'screen-1', 'Screen'),
                utils.createWindowDayData(6, '2026-01-20', 'screen-1', 'Screen'),
                // Day 7: Screen completed on scheduled date
                utils.createActualEventDayData(7, '2026-01-21', 'Screen', 7),
                // Day 8-9: Window days after Screen
                utils.createWindowDayData(8, '2026-01-22', 'screen-1', 'Screen'),
                utils.createWindowDayData(9, '2026-01-23', 'screen-1', 'Screen'),
                // Day 13: Post Screen completed early (out of window from day 14)
                utils.createActualEventDayData(13, '2026-01-27', 'Post Screen', 14, 'out-of-window'),
                // Day 14: Window day (scheduled day for Post Screen)
                utils.createWindowDayData(14, '2026-01-28', 'post-screen-1', 'Post Screen'),
                // Day 26: Termination still scheduled
                utils.createScheduledEventDayData(26, '2026-02-09', 'Termination', 'on-scheduled-date')
            ];
            
            // WHEN computing all rendering info
            const allInfo = computeAllDayRenderingInfo(patientDays);
            
            // THEN the patient journey is correctly represented
            
            // Prescreen - actual, on-scheduled-date
            expect(allInfo.get(0)?.isActual).toBe(true);
            expect(allInfo.get(0)?.state).toBe('on-scheduled-date');
            
            // Window days show as windows
            expect(allInfo.get(5)?.isWindow).toBe(true);
            expect(allInfo.get(6)?.isWindow).toBe(true);
            
            // Screen - actual, on-scheduled-date
            expect(allInfo.get(7)?.isActual).toBe(true);
            expect(allInfo.get(7)?.state).toBe('on-scheduled-date');
            
            // Post Screen - actual, out-of-window (completed early)
            expect(allInfo.get(13)?.isActual).toBe(true);
            expect(allInfo.get(13)?.state).toBe('out-of-window');
            
            // Termination - still scheduled
            expect(allInfo.get(26)?.isActual).toBe(false);
            expect(allInfo.get(26)?.eventType).toBe('scheduled-event');
        });
    });
    
    describe('Patient with cancelled and missed visits', () => {
        
        it('correctly identifies cancelled and missed visits in patient history', () => {
            // GIVEN a patient with problematic visit history
            const patientDays: PatientDayData[] = [
                // Day 0: Completed prescreen
                utils.createActualEventDayData(0, '2026-01-14', 'Prescreen', 0),
                // Day 7: Cancelled visit
                utils.createCancelledEventDayData(7, '2026-01-21', 'Screen'),
                // Day 14: Missed visit
                utils.createMissedEventDayData(14, '2026-01-28', 'Post Screen')
            ];
            
            // WHEN computing rendering info
            const allInfo = computeAllDayRenderingInfo(patientDays);
            
            // THEN cancelled and missed states are correct
            expect(allInfo.get(0)?.state).toBe('on-scheduled-date');
            expect(allInfo.get(7)?.state).toBe('canceled-visit');
            expect(allInfo.get(14)?.state).toBe('missed-visit');
        });
    });
    
    describe('Patient with unscheduled visits', () => {
        
        it('identifies unscheduled visits correctly', () => {
            // GIVEN a patient with scheduled and unscheduled visits
            const patientDays: PatientDayData[] = [
                // Day 0: Scheduled prescreen
                utils.createActualEventDayData(0, '2026-01-14', 'Prescreen', 0),
                // Day 3: Unscheduled emergency visit
                utils.createUnscheduledEventDayData(3, '2026-01-17', 'Emergency Check'),
                // Day 7: Scheduled screen
                utils.createActualEventDayData(7, '2026-01-21', 'Screen', 7)
            ];
            
            // WHEN computing rendering info
            const allInfo = computeAllDayRenderingInfo(patientDays);
            
            // THEN unscheduled visit is identified
            expect(allInfo.get(0)?.isUnscheduledEvent).toBe(false);
            expect(allInfo.get(3)?.isUnscheduledEvent).toBe(true);
            expect(allInfo.get(7)?.isUnscheduledEvent).toBe(false);
        });
    });
});

describe('PatientTimelineSection Fixture-Based Tests', () => {
    
    describe('Fixture: expected-rendering-basic', () => {
        
        it('validates basic patient rendering against fixture', () => {
            // GIVEN the expected rendering fixture
            const expected = utils.loadExpectedRenderingData('basic');
            
            // AND patient days matching the fixture scenario
            const patientDays: PatientDayData[] = [
                utils.createActualEventDayData(0, '2026-01-14', 'Prescreen', 0),
                utils.createActualEventDayData(7, '2026-01-21', 'Screen', 7),
                utils.createActualEventDayData(26, '2026-02-09', 'Termination', 26)
            ];
            
            // WHEN computing rendering info
            const allInfo = computeAllDayRenderingInfo(patientDays);
            
            // THEN each day matches expected rendering
            for (const [dayStr, dayExpected] of Object.entries(expected.days) as [string, any][]) {
                const day = parseInt(dayStr, 10);
                const renderingInfo = allInfo.get(day);
                
                expect(renderingInfo?.isWindow).toBe(dayExpected.expected.isWindow);
                expect(renderingInfo?.state).toBe(dayExpected.expected.state);
                expect(renderingInfo?.isActual).toBe(dayExpected.expected.isActual);
                expect(renderingInfo?.eventType).toBe(dayExpected.expected.eventType);
                expect(renderingInfo?.isUnscheduledEvent).toBe(dayExpected.expected.isUnscheduledEvent);
            }
        });
    });
    
    describe('Fixture: expected-rendering-shifts', () => {
        
        it('validates shifted visits rendering against fixture', () => {
            // GIVEN the expected rendering fixture for shifted visits
            const expected = utils.loadExpectedRenderingData('shifts');
            
            // AND patient days with visits at different shifts
            const patientDays: PatientDayData[] = [
                // On scheduled date
                utils.createActualEventDayData(0, '2026-01-14', 'Prescreen', 0),
                // 1 day early (in-window)
                utils.createActualEventDayData(6, '2026-01-20', 'Screen', 7, 'in-window'),
                // 5 days late (out-of-window)
                utils.createActualEventDayData(19, '2026-02-02', 'Post Screen', 14, 'out-of-window')
            ];
            
            // WHEN computing rendering info
            const allInfo = computeAllDayRenderingInfo(patientDays);
            
            // THEN each day matches expected rendering
            for (const [dayStr, dayExpected] of Object.entries(expected.days) as [string, any][]) {
                const day = parseInt(dayStr, 10);
                const renderingInfo = allInfo.get(day);
                
                expect(renderingInfo?.state).toBe(dayExpected.expected.state);
                expect(renderingInfo?.isActual).toBe(dayExpected.expected.isActual);
            }
        });
    });
    
    describe('Fixture: expected-rendering-cancelled-missed', () => {
        
        it('validates cancelled and missed visits against fixture', () => {
            // GIVEN the expected rendering fixture for cancelled/missed visits
            const expected = utils.loadExpectedRenderingData('cancelled-missed');
            
            // AND patient days with cancelled and missed visits
            const patientDays: PatientDayData[] = [
                utils.createActualEventDayData(0, '2026-01-14', 'Prescreen', 0),
                utils.createCancelledEventDayData(7, '2026-01-21', 'Screen'),
                utils.createMissedEventDayData(14, '2026-01-28', 'Post Screen'),
                utils.createScheduledEventDayData(26, '2026-02-09', 'Termination', 'on-scheduled-date')
            ];
            
            // WHEN computing rendering info
            const allInfo = computeAllDayRenderingInfo(patientDays);
            
            // THEN each day matches expected rendering
            for (const [dayStr, dayExpected] of Object.entries(expected.days) as [string, any][]) {
                const day = parseInt(dayStr, 10);
                const renderingInfo = allInfo.get(day);
                
                expect(renderingInfo?.state).toBe(dayExpected.expected.state);
            }
        });
    });
    
    describe('Fixture: test-patients-multi', () => {
        
        it('validates multiple patients from fixture data', () => {
            // GIVEN the multi-patient test fixture
            const fixture = utils.loadPatientTestData('test-patients-multi.json');
            
            // THEN fixture should have 3 patients
            expect(fixture.patients.length).toBe(3);
            
            // Patient 1: Completed (ARCX-1001)
            const patient1 = fixture.patients[0];
            const patient1Days = computeAllDayRenderingInfo(patient1.days);
            
            // All visits should be actual/completed
            expect(patient1Days.get(0)?.isActual).toBe(true);
            expect(patient1Days.get(7)?.isActual).toBe(true);
            expect(patient1Days.get(14)?.isActual).toBe(true);
            expect(patient1Days.get(26)?.isActual).toBe(true);
            
            // Patient 2: In progress (ARCX-1002)
            const patient2 = fixture.patients[1];
            const patient2Days = computeAllDayRenderingInfo(patient2.days);
            
            // Mix of actual and scheduled
            expect(patient2Days.get(0)?.isActual).toBe(true);   // Completed prescreen
            expect(patient2Days.get(5)?.isWindow).toBe(true);    // Window day
            expect(patient2Days.get(8)?.isActual).toBe(true);    // Completed screen (shifted)
            expect(patient2Days.get(8)?.state).toBe('in-window'); // Was shifted
            expect(patient2Days.get(14)?.isActual).toBe(false);  // Scheduled post-screen
            
            // Patient 3: Just started (ARCX-1003)
            const patient3 = fixture.patients[2];
            const patient3Days = computeAllDayRenderingInfo(patient3.days);
            
            // Only prescreen completed, rest scheduled
            expect(patient3Days.get(0)?.isActual).toBe(true);    // Completed prescreen
            expect(patient3Days.get(5)?.isWindow).toBe(true);    // Window day
            expect(patient3Days.get(7)?.isActual).toBe(false);   // Scheduled screen
            expect(patient3Days.get(14)?.isActual).toBe(false);  // Scheduled post-screen
        });
    });
});
