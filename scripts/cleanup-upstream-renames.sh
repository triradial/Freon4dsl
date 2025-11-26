#!/bin/bash
# Script to detect and remove files that were renamed/deleted in upstream/development
# but still exist locally in packages/core, packages/core-svelte, and packages/meta

set -e

UPSTREAM_BRANCH="upstream/development"
DRY_RUN=${1:-"--dry-run"}

echo "=== Detecting files renamed/deleted in upstream but still present locally ==="
echo "Upstream branch: $UPSTREAM_BRANCH"
echo ""

FILES_TO_DELETE=()

# Function to check if a file was renamed in upstream
check_rename() {
    local old_file=$1
    local commit=$(git log --oneline "$UPSTREAM_BRANCH" --diff-filter=R --find-renames=50% -- "$old_file" | head -1 | cut -d' ' -f1)
    if [ -n "$commit" ]; then
        local new_file=$(git show "$commit" --name-status --find-renames=50% -- "$old_file" | grep "^R[0-9]" | awk '{print $3}')
        if [ -n "$new_file" ] && git ls-tree -r --name-only "$UPSTREAM_BRANCH" -- "$new_file" | grep -q .; then
            echo "  RENAMED TO: $new_file"
            return 0
        fi
    fi
    return 1
}

# Function to check if a file was deleted in upstream
check_deleted() {
    local file=$1
    local commit=$(git log --oneline "$UPSTREAM_BRANCH" --diff-filter=D -- "$file" | head -1)
    if [ -n "$commit" ]; then
        echo "  DELETED IN UPSTREAM: $commit"
        return 0
    fi
    return 1
}

# Check External*Box files (renamed to *ReplacerBox)
echo "1. Checking External*Box files (renamed to *ReplacerBox)..."
for file in packages/core/src/editor/boxes/externalBoxes/External*.ts; do
    if [ -f "$file" ] && git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
        if ! git ls-tree -r --name-only "$UPSTREAM_BRANCH" -- "$file" | grep -q .; then
            echo "  FOUND: $file"
            if check_rename "$file"; then
                FILES_TO_DELETE+=("$file")
            fi
            echo ""
        fi
    fi
done

# Check other files that exist locally but not in upstream
echo "2. Checking other files deleted in upstream..."
git ls-files packages/core packages/core-svelte packages/meta | while read local_file; do
    # Skip if file exists in upstream
    if git ls-tree -r --name-only "$UPSTREAM_BRANCH" -- "$local_file" | grep -q .; then
        continue
    fi
    
    # Skip External*Box files (already handled above)
    if [[ "$local_file" == *"External"*"Box.ts" ]]; then
        continue
    fi
    
    # Check if it was deleted in upstream
    if check_deleted "$local_file" >/dev/null 2>&1; then
        echo "  FOUND: $local_file"
        check_deleted "$local_file"
        FILES_TO_DELETE+=("$local_file")
        echo ""
    fi
done

# Summary
echo "=== SUMMARY ==="
echo "Files to delete: ${#FILES_TO_DELETE[@]}"
echo ""

if [ ${#FILES_TO_DELETE[@]} -eq 0 ]; then
    echo "No files to delete. Your branch is clean!"
    exit 0
fi

echo "Files that will be deleted:"
for file in "${FILES_TO_DELETE[@]}"; do
    echo "  - $file"
done
echo ""

if [ "$DRY_RUN" = "--dry-run" ] || [ "$DRY_RUN" = "-n" ]; then
    echo "DRY RUN MODE - No files deleted"
    echo ""
    echo "To actually delete these files, run:"
    echo "  $0 --delete"
    exit 0
fi

if [ "$DRY_RUN" = "--delete" ] || [ "$DRY_RUN" = "-d" ]; then
    echo "DELETING FILES..."
    for file in "${FILES_TO_DELETE[@]}"; do
        if [ -f "$file" ]; then
            rm "$file"
            echo "  Deleted: $file"
        fi
    done
    echo ""
    echo "Done! ${#FILES_TO_DELETE[@]} files deleted."
    echo ""
    echo "Next steps:"
    echo "  1. Review the changes: git status"
    echo "  2. Stage the deletions: git add -u packages/core packages/core-svelte packages/meta"
    echo "  3. Commit: git commit -m 'Remove files renamed/deleted in upstream/development'"
else
    echo "Unknown option: $DRY_RUN"
    echo "Usage: $0 [--dry-run|--delete]"
    echo "  --dry-run (default): Show what would be deleted"
    echo "  --delete: Actually delete the files"
    exit 1
fi

