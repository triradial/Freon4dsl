export function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
        case "active":
            return "green";
        case "complete":
            return "dark";
        case "suspended":
            return "pink";
        case "terminated":
            return "red";
        case "planning":
            return "indigo";               
        default:
            return "default";
    }
}