import { describe, expect, test } from "vitest";
import { cloneJson, ensureUniqueCopyLabel, getNextCopyLabel, stripCopySuffix, validateName } from "../service/copy-study-utils.js";

describe("copy-study-utils", () => {
    test("stripCopySuffix removes trailing copy token", () => {
        expect(stripCopySuffix("Study A - Copy (2)")).toBe("Study A");
        expect(stripCopySuffix("Study A - Copy(2)")).toBe("Study A"); // legacy format
        expect(stripCopySuffix("Study A")).toBe("Study A");
    });

    test("getNextCopyLabel chooses next available index", () => {
        const existing = ["Study A", "Study A - Copy (1)", "Study A - Copy (3)"];
        expect(getNextCopyLabel("Study A", existing)).toBe("Study A - Copy (2)");
    });

    test("getNextCopyLabel increments when multiple copies exist", () => {
        const existing = [
            "My Study",
            "My Study - Copy (1)",
            "My Study - Copy (2)",
            "My Study - Copy (3)",
        ];
        expect(getNextCopyLabel("My Study", existing)).toBe("My Study - Copy (4)");
    });

    test("ensureUniqueCopyLabel preserves unique labels", () => {
        const existing = ["Study A", "Study B - Copy (1)"];
        expect(ensureUniqueCopyLabel("Study C", existing)).toBe("Study C");
    });

    test("ensureUniqueCopyLabel resolves collisions", () => {
        const existing = ["Study A", "Study A - Copy (1)"];
        expect(ensureUniqueCopyLabel("Study A", existing)).toBe("Study A - Copy (2)");
    });

    test("cloneJson returns a deep copy", () => {
        const original = { name: "Study", nested: { value: 1 } };
        const cloned = cloneJson(original);
        cloned.nested.value = 2;
        expect(original.nested.value).toBe(1);
    });

    test("validateName returns true for unique name", () => {
        const existing = [
            { id: "1", name: "Study A" },
            { id: "2", name: "Study B" },
        ];
        expect(validateName("Study C", existing)).toBe(true);
        expect(validateName("study c", existing)).toBe(true); // case-insensitive
    });

    test("validateName returns false for duplicate name", () => {
        const existing = [
            { id: "1", name: "Study A" },
            { id: "2", name: "Study B" },
        ];
        expect(validateName("Study A", existing)).toBe(false);
        expect(validateName("study a", existing)).toBe(false);
    });

    test("validateName excludes study by id when editing", () => {
        const existing = [
            { id: "1", name: "Study A" },
            { id: "2", name: "Study B" },
        ];
        expect(validateName("Study A", existing, "1")).toBe(true); // same study, editing
        expect(validateName("Study A", existing, "2")).toBe(false); // different study has this name
    });

    test("cloneJson produces independent copy of study design structure", () => {
        const studyDesign = {
            periods: [
                {
                    name: "Screening",
                    events: [
                        {
                            name: "Screen",
                            schedule: { eventStart: { startDay: 0 } },
                            tasks: [{ name: "Task 1" }],
                        },
                    ],
                },
            ],
        };
        const cloned = cloneJson(studyDesign);
        expect(cloned).toEqual(studyDesign);
        expect(cloned).not.toBe(studyDesign);
        cloned.periods[0].events[0].name = "Modified";
        expect(studyDesign.periods[0].events[0].name).toBe("Screen");
    });
});
