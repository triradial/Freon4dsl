import { errorLocation } from "@freon4dsl/core";
export function locationDescription(node) {
    let result = "";
    const loc = errorLocation(node);
    loc.reverse();
    for (let index = 0; index < loc.length; index++) {
        result += loc[index];
        if (index !== loc.length - 1) {
            result += " of ";
        }
    }
    return result;
}
//# sourceMappingURL=CustomLocationDescription.js.map