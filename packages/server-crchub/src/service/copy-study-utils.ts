function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function stripCopySuffix(value: string): string {
    const match = value.match(/^(.*)\s-\sCopy\((\d+)\)$/);
    return match ? match[1].trim() : value.trim();
}

export function getNextCopyLabel(sourceLabel: string, existingLabels: string[]): string {
    const baseLabel = stripCopySuffix(sourceLabel);
    if (!baseLabel) {
        return "Copy(1)";
    }
    const copyPattern = new RegExp(`^${escapeRegExp(baseLabel)}\\s-\\sCopy\\((\\d+)\\)$`, "i");
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
    return `${baseLabel} - Copy(${nextIndex})`;
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
