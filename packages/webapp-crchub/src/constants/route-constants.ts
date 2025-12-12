export const ROUTE = Object.freeze({
    HOME: 'home',
    LOGIN: 'login',
    PATIENTS: 'patients',
    STUDIES: 'studies',
    AVAILABILITY: 'availability',
    FACILITY: 'facility',
    ORGANIZATIONS: 'organizations',
    PEOPLE: 'people',
    STUDY: 'study',
    PATIENT: 'patient'
});

export const VALID_ROUTES = [
    ROUTE.LOGIN,
    ROUTE.HOME,
    ROUTE.PATIENTS,
    ROUTE.STUDIES,
    ROUTE.AVAILABILITY,
    ROUTE.FACILITY,
    ROUTE.ORGANIZATIONS,
    ROUTE.PEOPLE,
    ROUTE.STUDY,
    ROUTE.PATIENT
] as const;

export const VALID_ROUTES_WITH_ID = [
    ROUTE.PATIENT,
    ROUTE.STUDY
] as const;

export type ValidRoute = typeof VALID_ROUTES[number];
export type ValidRouteWithId = typeof VALID_ROUTES_WITH_ID[number];