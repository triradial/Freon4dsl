#!/usr/bin/env python3
"""Generate author-changes-core-meta-core-svelte-diffs.md with a linked TOC.

Reads the unique files list from author-changes-core-meta-core-svelte.md,
filters out mode-only and whitespace-only changes, and writes a diff report
where the "Changed files" section is a table of contents with anchor links
to each diff section.
"""
import pathlib, subprocess, re

root = pathlib.Path('/Users/mikevogel/projects/Freon4dsl')
report_path = root / 'developer-documentation/author-changes-core-meta-core-svelte.md'
text = report_path.read_text()
lines = text.splitlines()

unique_start = None
for i, line in enumerate(lines):
    if line.strip() == '## Unique files':
        unique_start = i + 1
        break
if unique_start is None:
    raise SystemExit('Unique files section not found')

files = []
for line in lines[unique_start:]:
    line = line.strip()
    if not line:
        continue
    if line.startswith('## '):
        break
    if line.startswith('- '):
        path = line[2:].strip()
        if path:
            files.append(path)

base_match = re.search(r'Baseline commit: `([0-9a-f]+)`', text)
base_commit = base_match.group(1) if base_match else None
if not base_commit:
    raise SystemExit('Baseline commit not found')

filtered_files = []
diffs = {}
for path in files:
    numstat = subprocess.check_output([
        'git', 'diff', '--numstat', f'{base_commit}..HEAD', '--', path
    ], cwd=root, text=True).strip()
    summary = subprocess.check_output([
        'git', 'diff', '--summary', f'{base_commit}..HEAD', '--', path
    ], cwd=root, text=True)

    mode_only = (not numstat) and ('mode change' in summary)
    if mode_only:
        continue

    # skip whitespace-only changes
    whitespace_check = subprocess.check_output([
        'git', 'diff', '-w', f'{base_commit}..HEAD', '--', path
    ], cwd=root, text=True)
    if not whitespace_check.strip():
        continue

    diff = subprocess.check_output([
        'git', 'diff', f'{base_commit}..HEAD', '--', path
    ], cwd=root, text=True)
    if not diff.strip():
        continue

    filtered_files.append(path)
    diffs[path] = diff.rstrip()


def slugify(filepath: str) -> str:
    """Generate a GFM-compatible anchor slug from a filepath.

    Matches how GitHub renders heading anchors for ## `filepath` headings:
    lowercase, remove non-alphanumeric chars except hyphens and spaces,
    collapse spaces to hyphens.
    """
    s = filepath.lower()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'\s+', '-', s)
    s = re.sub(r'-+', '-', s)
    return s.strip('-')


output_lines = [
    '# File changes since baseline (mode/whitespace-only excluded)\n',
    f'Baseline commit: `{base_commit}`\n',
    '\n',
    '## Changed files\n',
]
if filtered_files:
    for p in sorted(filtered_files):
        slug = slugify(p)
        output_lines.append(f'- [`{p}`](#{slug})\n')
else:
    output_lines.append('No matching files after filters.\n')

output_lines.append('\n')

for path in filtered_files:
    output_lines.append(f'## `{path}`\n')
    output_lines.append('```diff\n')
    output_lines.append(diffs[path] + '\n')
    output_lines.append('```\n\n')

out_path = root / 'developer-documentation/author-changes-core-meta-core-svelte-diffs.md'
out_path.write_text(''.join(output_lines))
print(f'Written to {out_path}')
