function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function stripCopySuffix(value: string): string {
    const match = value.match(/^(.*)\s-\sCopy\s*\(\s*(\d+)\s*\)\s*$/);
    return match ? match[1].trim() : value.trim();
}

export function getNextCopyLabel(sourceLabel: string, existingLabels: string[]): string {
    const baseLabel = stripCopySuffix(sourceLabel);
    if (!baseLabel) {
        return "Copy (1)";
    }
    const copyPattern = new RegExp(`^${escapeRegExp(baseLabel)}\\s-\\sCopy\\s*\\(\\s*(\\d+)\\s*\\)\\s*$`, "i");
    const used = new Set<number>();
    for (const label of existingLabels) {
        const match = label.match(copyPattern);
        if (match) {
            used.add(Number(match[1]));
        }
    }
    let nextIndex = 1;
    while (used.has(nextIndex)) {
        nextIndex += 1;
    }
    return `${baseLabel} - Copy (${nextIndex})`;
}

export function ensureUniqueCopyLabel(desiredLabel: string, existingLabels: string[]): string {
    const normalized = desiredLabel.trim();
    if (!normalized) {
        return getNextCopyLabel("", existingLabels);
    }
    const lowerExisting = new Set(existingLabels.map((label) => label.toLowerCase()));
    if (!lowerExisting.has(normalized.toLowerCase())) {
        return normalized;
    }
    return getNextCopyLabel(normalized, existingLabels);
}

export function cloneJson<T>(value: T): T {
    return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}

/**
 * Validates that a study name is unique among existing studies.
 * @param studyName - The name to validate
 * @param existingStudies - Array of existing studies with id and name
 * @param excludeStudyId - Optional study ID to exclude (e.g. when editing, exclude the current study)
 * @returns true if the name is valid (unique), false if it already exists
 */
export function validateName(
    studyName: string,
    existingStudies: Array<{ id: string; name: string }>,
    excludeStudyId?: string
): boolean {
    const normalized = studyName.trim();
    if (!normalized) {
        return true; // Empty is handled by required-field validation
    }
    const lowerNew = normalized.toLowerCase();
    for (const s of existingStudies) {
        if (excludeStudyId && s.id === excludeStudyId) continue;
        if (s.name?.trim().toLowerCase() === lowerNew) {
            return false; // Duplicate found
        }
    }
    return true;
}
