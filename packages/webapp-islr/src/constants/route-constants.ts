export const ROUTE = Object.freeze({
    HOME: 'home',
    LOGIN: 'login',
    STUDIES: 'projects',
    STUDY: 'project'
});

export const VALID_ROUTES = [
    ROUTE.LOGIN,
    ROUTE.HOME,
    ROUTE.STUDIES,
    ROUTE.STUDY
] as const;

export const VALID_ROUTES_WITH_ID = [
    ROUTE.STUDY
] as const;

export type ValidRoute = typeof VALID_ROUTES[number];
export type ValidRouteWithId = typeof VALID_ROUTES_WITH_ID[number];