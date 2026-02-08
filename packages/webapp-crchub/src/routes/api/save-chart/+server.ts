import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * POST endpoint to save chart HTML to /tmp folder.
 * Expects JSON body with: { html: string, filename: string }
 */
export const POST: RequestHandler = async ({ request }) => {
    try {
        const { html, filename } = await request.json();

        if (!html || !filename) {
            return json({ error: 'Missing html or filename' }, { status: 400 });
        }

        // Sanitize filename to prevent path traversal
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        // Save to repo root for easy access during debugging
        const filepath = join('/Users/mikevogel/projects/Freon4dsl', sanitizedFilename);

        await writeFile(filepath, html, 'utf-8');

        console.log(`[save-chart] Saved chart to: ${filepath}`);

        return json({ success: true, filepath });
    } catch (error) {
        console.error('[save-chart] Error saving chart:', error);
        return json({ error: 'Failed to save chart' }, { status: 500 });
    }
};
