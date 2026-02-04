import { describe, expect, test } from "vitest";
import { cloneJson, ensureUniqueCopyLabel, getNextCopyLabel, stripCopySuffix } from "../service/copy-study-utils.js";

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
});
