export const ROUTE = {
    HOME: 'home',
    LOGIN: 'login',
    PATIENTS: 'patients',
    STUDIES: 'studies',
    AVAILABILITY: 'availability',
    STUDY: 'study',
    PATIENT: 'patient'
  } as const;

export const VALID_ROUTES = [
    ROUTE.LOGIN,
    ROUTE.HOME,
    ROUTE.PATIENTS,
    ROUTE.STUDIES,
    ROUTE.AVAILABILITY,
    ROUTE.STUDY,
    ROUTE.PATIENT
] as const;

export const VALID_ROUTES_WITH_ID = [
    ROUTE.PATIENT,
    ROUTE.STUDY
] as const;

export type ValidRoute = typeof VALID_ROUTES[number];
export type ValidRouteWithId = typeof VALID_ROUTES_WITH_ID[number];